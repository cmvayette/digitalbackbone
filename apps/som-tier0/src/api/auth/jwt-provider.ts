/**
 * JWT Authentication Provider
 * NIST 800-53: IA-2 (Identification and Authentication), IA-5 (Authenticator Management)
 *
 * Implements JWT-based authentication with DoD-compliant session management
 */

import { createHmac, randomBytes } from 'crypto';
import type { IAuthProvider, AuthenticationResult } from './auth-types';
import type { UserContext } from '../../access-control';

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  /** User ID */
  sub: string;
  /** User email/username */
  email?: string;
  /** User roles */
  roles: string[];
  /** Clearance level */
  clearance?: string;
  /** Issued at (Unix timestamp) */
  iat: number;
  /** Expires at (Unix timestamp) */
  exp: number;
  /** Session ID for tracking */
  sid: string;
  /** Token type (access or refresh) */
  type: 'access' | 'refresh';
}

/**
 * JWT Configuration
 */
export interface JWTConfig {
  /** Secret key for signing tokens (min 32 bytes) */
  secret: string;
  /** Access token expiry in seconds (DoD standard: 900 = 15 minutes) */
  accessTokenExpiry?: number;
  /** Refresh token expiry in seconds (DoD standard: 28800 = 8 hours) */
  refreshTokenExpiry?: number;
  /** Algorithm (only HS256 supported for FIPS compliance) */
  algorithm?: 'HS256';
}

const DEFAULT_CONFIG: Required<Omit<JWTConfig, 'secret'>> = {
  accessTokenExpiry: 900, // 15 minutes (DoD standard)
  refreshTokenExpiry: 28800, // 8 hours (DoD max session)
  algorithm: 'HS256',
};

/**
 * Session tracking for timeout and lockout
 */
interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  failedAttempts: number;
  lockedUntil?: number;
}

/**
 * JWT Authentication Provider
 * Implements DoD-compliant session management with JWT tokens
 */
export class JWTAuthProvider implements IAuthProvider {
  private config: Required<JWTConfig>;
  private sessions: Map<string, SessionData>;
  private failedAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>;

  // DoD AC-7: Account lockout parameters
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

  constructor(config: JWTConfig) {
    if (!config.secret || config.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters (256 bits)');
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessions = new Map();
    this.failedAttempts = new Map();

    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Generate JWT token
   */
  generateToken(user: UserContext, type: 'access' | 'refresh' = 'access'): string {
    const now = Math.floor(Date.now() / 1000);
    const expiry = type === 'access' ? this.config.accessTokenExpiry : this.config.refreshTokenExpiry;

    const sessionId = this.createSession(user.userId);

    const payload: JWTPayload = {
      sub: user.userId,
      email: (user as any).email,
      roles: user.roles,
      clearance: user.clearanceLevel,
      iat: now,
      exp: now + expiry,
      sid: sessionId,
      type,
    };

    return this.signToken(payload);
  }

  /**
   * Verify JWT token
   */
  async authenticate(headers: Record<string, string>): Promise<AuthenticationResult> {
    const token = this.extractToken(headers);

    if (!token) {
      return {
        authenticated: false,
        error: 'Missing authorization token',
      };
    }

    try {
      const payload = this.verifyToken(token);

      // Check if session is still valid
      const session = this.sessions.get(payload.sid);
      if (!session) {
        return {
          authenticated: false,
          error: 'Session expired or invalid',
        };
      }

      // Check session timeout (15 minutes of inactivity)
      const now = Date.now();
      const inactivityTime = now - session.lastActivity;
      const maxInactivity = 15 * 60 * 1000; // 15 minutes

      if (inactivityTime > maxInactivity) {
        this.endSession(payload.sid);
        return {
          authenticated: false,
          error: 'Session timeout due to inactivity',
        };
      }

      // Check maximum session duration (8 hours)
      const sessionDuration = now - session.createdAt;
      const maxDuration = 8 * 60 * 60 * 1000; // 8 hours

      if (sessionDuration > maxDuration) {
        this.endSession(payload.sid);
        return {
          authenticated: false,
          error: 'Maximum session duration exceeded',
        };
      }

      // Update last activity
      session.lastActivity = now;

      // Return user context
      const user: UserContext = {
        userId: payload.sub,
        roles: payload.roles as any[],
        clearanceLevel: (payload.clearance || 'UNCLASSIFIED') as any,
      };

      return {
        authenticated: true,
        user,
      };
    } catch (error: any) {
      return {
        authenticated: false,
        error: error.message || 'Invalid token',
      };
    }
  }

  /**
   * Authenticate user with credentials (username/password)
   * This should be called during login
   */
  async authenticateCredentials(
    username: string,
    password: string,
    userLookup: (username: string) => Promise<UserContext | null>,
    validatePassword: (password: string, hashedPassword: string) => Promise<boolean>
  ): Promise<AuthenticationResult & { accessToken?: string; refreshToken?: string }> {
    const now = Date.now();

    // Check if account is locked
    const lockStatus = this.failedAttempts.get(username);
    if (lockStatus?.lockedUntil && now < lockStatus.lockedUntil) {
      const remainingTime = Math.ceil((lockStatus.lockedUntil - now) / 1000 / 60);
      return {
        authenticated: false,
        error: `Account locked. Try again in ${remainingTime} minutes.`,
      };
    }

    // Look up user
    const user = await userLookup(username);
    if (!user) {
      this.recordFailedAttempt(username);
      return {
        authenticated: false,
        error: 'Invalid credentials',
      };
    }

    // Validate password (implementation depends on password hashing strategy)
    // For now, this is a placeholder - actual implementation needed
    const isValid = await validatePassword(password, (user as any).hashedPassword || '');

    if (!isValid) {
      this.recordFailedAttempt(username);
      return {
        authenticated: false,
        error: 'Invalid credentials',
      };
    }

    // Clear failed attempts on successful login
    this.failedAttempts.delete(username);

    // Generate tokens
    const accessToken = this.generateToken(user, 'access');
    const refreshToken = this.generateToken(user, 'refresh');

    return {
      authenticated: true,
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): { accessToken?: string; error?: string } {
    try {
      const payload = this.verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        return { error: 'Invalid token type' };
      }

      const session = this.sessions.get(payload.sid);
      if (!session) {
        return { error: 'Session expired' };
      }

      // Generate new access token
      const user: UserContext = {
        userId: payload.sub,
        roles: payload.roles as any[],
        clearanceLevel: (payload.clearance || 'UNCLASSIFIED') as any,
      };

      const accessToken = this.generateToken(user, 'access');

      return { accessToken };
    } catch (error: any) {
      return { error: error.message || 'Invalid refresh token' };
    }
  }

  /**
   * End session (logout)
   */
  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get active session count for user
   */
  getUserSessionCount(userId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        count++;
      }
    }
    return count;
  }

  /**
   * End all sessions for user
   */
  endAllUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // ==================== Private Methods ====================

  /**
   * Sign JWT token using HMAC-SHA256
   */
  private signToken(payload: JWTPayload): string {
    const header = { alg: this.config.algorithm, typ: 'JWT' };

    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(payload));

    const signature = createHmac('sha256', this.config.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT token signature and expiration
   */
  private verifyToken(token: string): JWTPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac('sha256', this.config.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(this.base64urlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * Extract token from Authorization header
   */
  private extractToken(headers: Record<string, string>): string | undefined {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader) {
      return undefined;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }

    return undefined;
  }

  /**
   * Create new session
   */
  private createSession(userId: string): string {
    const sessionId = randomBytes(16).toString('hex');
    const now = Date.now();

    this.sessions.set(sessionId, {
      userId,
      sessionId,
      createdAt: now,
      lastActivity: now,
      failedAttempts: 0,
    });

    return sessionId;
  }

  /**
   * Record failed login attempt (NIST AC-7)
   */
  private recordFailedAttempt(username: string): void {
    const now = Date.now();
    const existing = this.failedAttempts.get(username);

    if (!existing || now - existing.lastAttempt > this.FAILED_ATTEMPT_WINDOW) {
      // Start new window
      this.failedAttempts.set(username, {
        count: 1,
        lastAttempt: now,
      });
      return;
    }

    existing.count++;
    existing.lastAttempt = now;

    // Lock account after max attempts
    if (existing.count >= this.MAX_FAILED_ATTEMPTS) {
      existing.lockedUntil = now + this.LOCKOUT_DURATION;
      console.warn(`Account locked: ${username} (${existing.count} failed attempts)`);
    }
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxAge = 8 * 60 * 60 * 1000; // 8 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Base64URL encode
   */
  private base64urlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64URL decode
   */
  private base64urlDecode(str: string): string {
    // Add padding if needed
    let padded = str;
    while (padded.length % 4 !== 0) {
      padded += '=';
    }

    return Buffer.from(
      padded.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf-8');
  }
}
