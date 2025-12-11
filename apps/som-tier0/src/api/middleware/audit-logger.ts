/**
 * Audit Logging Middleware
 * NIST 800-53: AU-2 (Audit Events), AU-3 (Content of Audit Records)
 *
 * Implements comprehensive audit logging for DoD C-ATO compliance (IL4/IL5)
 */

import { Context, Next } from 'hono';

/**
 * Audit event types
 * Based on NIST 800-53 required audit event categories
 */
export type AuditEventType =
  | 'AUTH' // Authentication events
  | 'AUTHZ' // Authorization events
  | 'CREATE' // Resource creation
  | 'READ' // Resource read/query
  | 'UPDATE' // Resource modification
  | 'DELETE' // Resource deletion
  | 'EXPORT' // Data export
  | 'ADMIN' // Administrative actions
  | 'CONFIG' // Configuration changes
  | 'SECURITY'; // Security-relevant events

/**
 * Event outcome/status
 */
export type AuditEventStatus = 'SUCCESS' | 'FAILURE' | 'DENIED';

/**
 * Audit severity levels
 * Based on DoD security classification guidance
 */
export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Audit log entry
 * Compliant with NIST 800-53 AU-3 requirements
 */
export interface AuditLog {
  /** Unique audit event ID */
  id: string;

  /** ISO 8601 timestamp of the event */
  timestamp: string;

  /** User identifier (required by AU-3) */
  userId: string;

  /** User roles/groups */
  userRole?: string[];

  /** Event type (required by AU-3) */
  eventType: AuditEventType;

  /** Event outcome (required by AU-3) */
  eventStatus: AuditEventStatus;

  /** Resource type being accessed (required by AU-3) */
  resourceType?: string;

  /** Specific resource identifier (required by AU-3) */
  resourceId?: string;

  /** Source IP address (required by AU-3) */
  sourceIP: string;

  /** User agent string */
  userAgent?: string;

  /** HTTP method */
  httpMethod?: string;

  /** Request path */
  requestPath?: string;

  /** Request ID for correlation */
  requestId?: string;

  /** Additional event-specific details (sanitized) */
  details?: Record<string, unknown>;

  /** Severity level */
  severity: AuditSeverity;

  /** Error message if status is FAILURE */
  errorMessage?: string;

  /** Session ID (if applicable) */
  sessionId?: string;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  /** Enable audit logging */
  enabled?: boolean;

  /** Log all requests (including READ operations) */
  logAllRequests?: boolean;

  /** Exclude paths from audit logging (e.g., health checks) */
  excludePaths?: string[];

  /** Custom log writer function */
  logWriter?: (log: AuditLog) => void | Promise<void>;

  /** Sanitize sensitive fields */
  sanitizeFields?: string[];
}

const DEFAULT_CONFIG: AuditLoggerConfig = {
  enabled: true,
  logAllRequests: false, // By default, only log security-relevant events
  excludePaths: ['/health', '/health/liveness', '/health/readiness'],
  sanitizeFields: ['password', 'token', 'apiKey', 'secret', 'credential'],
};

/**
 * Default log writer - writes to stdout as JSON
 * In production, this should send to SIEM (Splunk, ELK, etc.)
 */
function defaultLogWriter(log: AuditLog): void {
  // Use console.log for audit logs (not console.error)
  // This allows separation via logging infrastructure
  console.log(JSON.stringify({
    ...log,
    logType: 'AUDIT', // Marker for log aggregation
  }));
}

/**
 * Determine event severity based on type and status
 */
function getSeverity(eventType: AuditEventType, eventStatus: AuditEventStatus): AuditSeverity {
  // FAILURE or DENIED events are always at least MEDIUM
  if (eventStatus === 'FAILURE') {
    if (eventType === 'AUTH' || eventType === 'SECURITY') {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  if (eventStatus === 'DENIED') {
    return 'HIGH'; // Authorization failures are high severity
  }

  // SUCCESS events severity based on type
  switch (eventType) {
    case 'AUTH':
    case 'SECURITY':
    case 'ADMIN':
    case 'CONFIG':
      return 'MEDIUM';
    case 'DELETE':
    case 'EXPORT':
      return 'MEDIUM';
    case 'CREATE':
    case 'UPDATE':
      return 'LOW';
    case 'READ':
      return 'LOW';
    default:
      return 'LOW';
  }
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, sensitiveFields));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Extract user context from request
 */
function extractUserContext(c: Context): { userId: string; userRole?: string[]; sessionId?: string } {
  const user = c.get('user');

  if (user) {
    return {
      userId: user.userId || user.id || 'unknown',
      userRole: user.roles || [],
      sessionId: user.sessionId,
    };
  }

  // Fallback: try to extract from headers (API key scenario)
  const apiKey = c.req.header('authorization')?.split(' ')[1];
  if (apiKey) {
    return {
      userId: 'api-key-user',
      userRole: ['api'],
    };
  }

  return {
    userId: 'anonymous',
    userRole: ['anonymous'],
  };
}

/**
 * Determine audit event type from request
 */
function determineEventType(c: Context): AuditEventType {
  const method = c.req.method;
  const path = c.req.path;

  // Authentication endpoints
  if (path.includes('/auth') || path.includes('/login')) {
    return 'AUTH';
  }

  // Schema/configuration endpoints
  if (path.includes('/schema') || path.includes('/config')) {
    return 'CONFIG';
  }

  // Export endpoints
  if (path.includes('/export')) {
    return 'EXPORT';
  }

  // Map HTTP methods to event types
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
    default:
      return 'READ';
  }
}

/**
 * Create audit logger middleware
 *
 * @param config - Audit logger configuration
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * app.use('*', auditLogger({
 *   enabled: true,
 *   logAllRequests: false,
 *   logWriter: async (log) => {
 *     // Send to SIEM
 *     await sendToSplunk(log);
 *   }
 * }));
 * ```
 */
export function auditLogger(config: AuditLoggerConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const logWriter = cfg.logWriter || defaultLogWriter;

  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = c.get('requestId') || c.req.header('x-request-id') || crypto.randomUUID();
    c.set('requestId', requestId);

    // Skip excluded paths
    const path = c.req.path;
    if (cfg.excludePaths?.some(excluded => path.startsWith(excluded))) {
      await next();
      return;
    }

    // Extract request information
    const method = c.req.method;
    const sourceIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const eventType = determineEventType(c);
    const userContext = extractUserContext(c);

    let eventStatus: AuditEventStatus = 'SUCCESS';
    let errorMessage: string | undefined;
    let resourceType: string | undefined;
    let resourceId: string | undefined;

    try {
      await next();

      // Determine status from response
      const statusCode = c.res.status;
      if (statusCode >= 400 && statusCode < 500) {
        eventStatus = statusCode === 403 ? 'DENIED' : 'FAILURE';
      } else if (statusCode >= 500) {
        eventStatus = 'FAILURE';
      }

      // Try to extract resource info from response
      if (c.get('resourceType')) {
        resourceType = c.get('resourceType');
      }
      if (c.get('resourceId')) {
        resourceId = c.get('resourceId');
      }
    } catch (error: any) {
      eventStatus = 'FAILURE';
      errorMessage = error.message || 'Unknown error';
    }

    // Log only security-relevant events unless logAllRequests is true
    const shouldLog = cfg.logAllRequests ||
                     eventStatus !== 'SUCCESS' ||
                     ['AUTH', 'AUTHZ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'ADMIN', 'CONFIG', 'SECURITY'].includes(eventType);

    if (cfg.enabled && shouldLog) {
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        userId: userContext.userId,
        userRole: userContext.userRole,
        eventType,
        eventStatus,
        resourceType,
        resourceId,
        sourceIP,
        userAgent,
        httpMethod: method,
        requestPath: path,
        requestId,
        sessionId: userContext.sessionId,
        severity: getSeverity(eventType, eventStatus),
        errorMessage,
        details: {
          processingTime: Date.now() - startTime,
          responseStatus: c.res.status,
        },
      };

      // Sanitize details if needed
      if (cfg.sanitizeFields && auditLog.details) {
        auditLog.details = sanitizeData(auditLog.details, cfg.sanitizeFields);
      }

      // Write audit log
      try {
        await logWriter(auditLog);
      } catch (error) {
        // Never fail request due to audit logging error
        console.error('Audit logging failed:', error);
      }
    }
  };
}

/**
 * Manually log an audit event
 * Use this for application-level audit events not tied to HTTP requests
 */
export async function logAuditEvent(
  event: Omit<AuditLog, 'id' | 'timestamp' | 'severity'>,
  logWriter?: (log: AuditLog) => void | Promise<void>
): Promise<void> {
  const writer = logWriter || defaultLogWriter;

  const auditLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    severity: getSeverity(event.eventType, event.eventStatus),
    ...event,
  };

  try {
    await writer(auditLog);
  } catch (error) {
    console.error('Manual audit logging failed:', error);
  }
}

/**
 * Create audit log context helper
 * Set resource information in the request context for audit logging
 */
export function setAuditContext(c: Context, resourceType: string, resourceId?: string): void {
  c.set('resourceType', resourceType);
  if (resourceId) {
    c.set('resourceId', resourceId);
  }
}
