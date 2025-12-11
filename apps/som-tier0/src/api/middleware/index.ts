/**
 * Security Middleware Exports
 * DoD C-ATO Compliance (IL4/IL5)
 */

export {
  securityHeaders,
  strictSecurityHeaders,
  type SecurityHeadersConfig,
} from './security-headers';

export {
  auditLogger,
  logAuditEvent,
  setAuditContext,
  type AuditLog,
  type AuditEventType,
  type AuditEventStatus,
  type AuditSeverity,
  type AuditLoggerConfig,
} from './audit-logger';

export {
  validator,
  validateBody,
  validateFileUpload,
  sanitizeHTML,
  sanitizeInput,
  containsXSS,
  containsSQLInjection,
  containsPathTraversal,
  CommonSchemas,
  APISchemas,
  type ValidationError,
  type ValidationResult,
  type FileUploadConfig,
} from './input-validation';
