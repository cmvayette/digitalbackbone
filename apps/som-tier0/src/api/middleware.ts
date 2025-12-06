/**
 * API Middleware for authentication, authorization, and request validation
 */

import { UserContext, Role } from '../access-control';
import { APIRequest, APIResponse, APIError } from './api-types';

/**
 * Authentication result
 */
export interface AuthenticationResult {
  authenticated: boolean;
  user?: UserContext;
  error?: string;
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  authorized: boolean;
  error?: string;
}

/**
 * Authentication middleware
 * Validates API tokens and extracts user context
 */
export class AuthenticationMiddleware {
  private apiKeys: Map<string, UserContext>; // Simple API key storage

  constructor() {
    this.apiKeys = new Map();
  }

  /**
   * Register an API key for a user
   */
  registerAPIKey(apiKey: string, user: UserContext): void {
    this.apiKeys.set(apiKey, user);
  }

  /**
   * Revoke an API key
   */
  revokeAPIKey(apiKey: string): void {
    this.apiKeys.delete(apiKey);
  }

  /**
   * Authenticate a request using API key
   */
  authenticate(apiKey: string): AuthenticationResult {
    const user = this.apiKeys.get(apiKey);

    if (!user) {
      return {
        authenticated: false,
        error: 'Invalid API key',
      };
    }

    return {
      authenticated: true,
      user,
    };
  }

  /**
   * Extract API key from authorization header
   */
  extractAPIKey(authHeader?: string): string | undefined {
    if (!authHeader) {
      return undefined;
    }

    // Support "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }

    // Support direct API key
    return authHeader;
  }
}

/**
 * Authorization middleware
 * Checks if user has required permissions for operations
 */
export class AuthorizationMiddleware {
  /**
   * Check if user can query holons
   */
  canQueryHolons(user: UserContext): AuthorizationResult {
    // All authenticated users can query (access control filters results)
    return { authorized: true };
  }

  /**
   * Check if user can submit events
   */
  canSubmitEvents(user: UserContext): AuthorizationResult {
    // Require at least DataSubmitter role
    const hasPermission = user.roles.some(role =>
      role === Role.DataSubmitter ||
      role === Role.SystemIntegrator ||
      role === Role.Administrator
    );

    if (!hasPermission) {
      return {
        authorized: false,
        error: 'Insufficient permissions to submit events',
      };
    }

    return { authorized: true };
  }

  /**
   * Check if user can propose schema changes
   */
  canProposeSchemaChanges(user: UserContext): AuthorizationResult {
    // Require SchemaDesigner or Administrator role
    const hasPermission = user.roles.some(role =>
      role === Role.SchemaDesigner ||
      role === Role.Administrator
    );

    if (!hasPermission) {
      return {
        authorized: false,
        error: 'Insufficient permissions to propose schema changes',
      };
    }

    return { authorized: true };
  }

  /**
   * Check if user can approve schema changes
   */
  canApproveSchemaChanges(user: UserContext): AuthorizationResult {
    // Require GovernanceOfficer or Administrator role
    const hasPermission = user.roles.some(role =>
      role === Role.GovernanceOfficer ||
      role === Role.Administrator
    );

    if (!hasPermission) {
      return {
        authorized: false,
        error: 'Insufficient permissions to approve schema changes',
      };
    }

    return { authorized: true };
  }

  /**
   * Check if user can access system health information
   */
  canAccessSystemHealth(user: UserContext): AuthorizationResult {
    // Require SystemIntegrator or Administrator role
    const hasPermission = user.roles.some(role =>
      role === Role.SystemIntegrator ||
      role === Role.Administrator
    );

    if (!hasPermission) {
      return {
        authorized: false,
        error: 'Insufficient permissions to access system health',
      };
    }

    return { authorized: true };
  }
}

/**
 * Request validation middleware
 * Validates request parameters and body
 */
export class RequestValidationMiddleware {
  /**
   * Validate required fields are present
   */
  validateRequiredFields(
    data: any,
    requiredFields: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate timestamp format (ISO 8601)
   */
  validateTimestamp(timestamp: string): { valid: boolean; error?: string } {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return {
          valid: false,
          error: 'Invalid timestamp format',
        };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid timestamp format',
      };
    }
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(
    page?: number,
    pageSize?: number
  ): { valid: boolean; error?: string } {
    if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
      return {
        valid: false,
        error: 'Page must be a positive integer',
      };
    }

    if (pageSize !== undefined) {
      if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
        return {
          valid: false,
          error: 'Page size must be an integer between 1 and 1000',
        };
      }
    }

    return { valid: true };
  }
}

/**
 * Error handler middleware
 * Converts errors to standardized API error responses
 */
export class ErrorHandlerMiddleware {
  /**
   * Handle error and convert to API response
   */
  handleError(error: any): APIResponse {
    // Validation errors
    if (error.name === 'ValidationError') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details,
          validationErrors: error.validationErrors,
        },
      };
    }

    // Authorization errors
    if (error.name === 'AuthorizationError') {
      return {
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: error.message,
        },
      };
    }

    // Authentication errors
    if (error.name === 'AuthenticationError') {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
      };
    }

    // Not found errors
    if (error.name === 'NotFoundError') {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      };
    }

    // Constraint violation errors
    if (error.name === 'ConstraintViolationError') {
      return {
        success: false,
        error: {
          code: 'CONSTRAINT_VIOLATION',
          message: error.message,
          details: error.details,
        },
      };
    }

    // Generic errors
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }
}

/**
 * Rate limiting middleware
 * Prevents API abuse by limiting request rates
 */
export class RateLimitMiddleware {
  private requestCounts: Map<string, { count: number; resetTime: number }>;
  private maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute: number = 100) {
    this.requestCounts = new Map();
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  /**
   * Check if request should be rate limited
   */
  checkRateLimit(identifier: string): { allowed: boolean; error?: string } {
    const now = Date.now();
    const entry = this.requestCounts.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Start new window
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      });
      return { allowed: true };
    }

    if (entry.count >= this.maxRequestsPerMinute) {
      return {
        allowed: false,
        error: `Rate limit exceeded. Maximum ${this.maxRequestsPerMinute} requests per minute.`,
      };
    }

    entry.count++;
    return { allowed: true };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requestCounts.entries()) {
      if (now > entry.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}
