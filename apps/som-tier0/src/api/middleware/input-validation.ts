/**
 * Input Validation Middleware
 * NIST 800-53: SI-10 (Information Input Validation)
 *
 * Implements comprehensive input validation for DoD C-ATO compliance (IL4/IL5)
 */

import type { Context, Next } from 'hono';
import { z, ZodError, type ZodSchema } from 'zod';

/**
 * Validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/**
 * XSS detection patterns
 * Based on OWASP XSS prevention guidelines
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<img[^>]+src[^>]*>/gi,
];

/**
 * SQL injection detection patterns
 * Note: Parameterized queries are the primary defense
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(UNION\s+SELECT)/gi,
  /('|")\s*(OR|AND)\s*('|")/gi,
  /(--|\#|\/\*)/gi, // SQL comments
];

/**
 * Path traversal detection
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./,
  /\.\.\\/,
  /%2e%2e/gi,
  /\.\.\//,
];

/**
 * Check for XSS patterns in string
 */
export function containsXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for SQL injection patterns in string
 */
export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for path traversal patterns
 */
export function containsPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize HTML entities
 * Converts special characters to HTML entities to prevent XSS
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * UUID validation
   */
  uuid: z.string().uuid('Invalid UUID format'),

  /**
   * Email validation
   */
  email: z.string().email('Invalid email format'),

  /**
   * URL validation (HTTPS only for production)
   */
  httpsUrl: z.string().url().refine(
    (url) => url.startsWith('https://'),
    'Only HTTPS URLs are allowed'
  ),

  /**
   * Safe string (no XSS, SQL injection, path traversal)
   */
  safeString: z.string()
    .refine((val) => !containsXSS(val), 'Potential XSS detected')
    .refine((val) => !containsSQLInjection(val), 'Potential SQL injection detected')
    .refine((val) => !containsPathTraversal(val), 'Potential path traversal detected'),

  /**
   * Safe text (allows more characters but still validated)
   */
  safeText: z.string()
    .max(50000, 'Text too long')
    .refine((val) => !containsXSS(val), 'Potential XSS detected'),

  /**
   * Alphanumeric with common safe characters
   */
  alphanumericSafe: z.string().regex(
    /^[a-zA-Z0-9\s\-_.,()]+$/,
    'Contains invalid characters'
  ),

  /**
   * Version string (semantic versioning)
   */
  version: z.string().regex(
    /^\d+\.\d+(\.\d+)?$/,
    'Invalid version format (expected X.Y or X.Y.Z)'
  ),

  /**
   * ISO 8601 timestamp
   */
  isoTimestamp: z.string().refine(
    (val) => !isNaN(new Date(val).getTime()),
    'Invalid ISO 8601 timestamp'
  ),

  /**
   * Positive integer
   */
  positiveInt: z.number().int().positive(),

  /**
   * Non-negative integer
   */
  nonNegativeInt: z.number().int().min(0),

  /**
   * Pagination parameters
   */
  pagination: z.object({
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(1000).optional(),
  }).optional(),

  /**
   * IP address (v4 or v6)
   */
  ipAddress: z.string().refine(
    (val) => {
      const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6 = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
      return ipv4.test(val) || ipv6.test(val);
    },
    'Invalid IP address'
  ),
};

/**
 * Example API request schemas
 */
export const APISchemas = {
  /**
   * Query holons request
   */
  queryHolons: z.object({
    type: z.string(),
    filters: z.record(z.string(), z.unknown()).optional(),
    includeRelationships: z.boolean().optional(),
    relationshipTypes: z.array(z.string()).optional(),
    pagination: CommonSchemas.pagination,
  }),

  /**
   * Submit event request
   */
  submitEvent: z.object({
    eventType: z.string(),
    subjects: z.record(z.string(), z.string()),
    payload: z.record(z.string(), z.unknown()),
    sourceSystem: z.string().optional(),
    sourceDocument: z.string().optional(),
    validityWindow: z.object({
      start: CommonSchemas.isoTimestamp,
      end: CommonSchemas.isoTimestamp,
    }).optional(),
    causalLinks: z.record(z.string(), z.array(z.string())).optional(),
  }),

  /**
   * Schema proposal request
   */
  schemaProposal: z.object({
    proposalType: z.enum(['holon_type', 'relationship_type', 'constraint', 'measure', 'lens']),
    name: CommonSchemas.alphanumericSafe,
    description: CommonSchemas.safeText,
    definition: z.record(z.string(), z.unknown()),
    referenceDocuments: z.array(z.string()).optional(),
    exampleUseCases: z.array(z.string()).optional(),
    impactAnalysis: z.union([
      z.string(),
      z.record(z.string(), z.unknown())
    ]).optional(),
  }),
};

/**
 * Validate request body against schema
 */
export async function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): Promise<{ success: true; data: T } | { success: false; errors: ValidationError[] }> {
  try {
    const data = await schema.parseAsync(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown' }],
    };
  }
}

/**
 * Create validation middleware for a specific schema
 *
 * @param schema - Zod schema to validate against
 * @param target - What to validate ('body', 'query', 'params')
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * app.post('/api/v1/holons/query',
 *   validator(APISchemas.queryHolons, 'body'),
 *   async (c) => {
 *     const validated = c.get('validatedBody');
 *     // validated is type-safe based on schema
 *   }
 * );
 * ```
 */
export function validator<T>(
  schema: ZodSchema<T>,
  target: 'body' | 'query' | 'params' = 'body'
) {
  return async (c: Context, next: Next) => {
    let data: unknown;

    try {
      switch (target) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = Object.fromEntries(new URL(c.req.url).searchParams);
          break;
        case 'params':
          data = c.req.param();
          break;
      }
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request format',
        },
      }, 400);
    }

    const result = await validateBody(schema, data);

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          validationErrors: result.errors,
        },
      }, 400);
    }

    // Store validated data in context
    const targetCapitalized = target.charAt(0).toUpperCase() + target.slice(1);
    c.set(`validated${targetCapitalized}`, result.data);

    await next();
  };
}

/**
 * Sanitize input recursively
 * Use this for untrusted input that needs to be displayed
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return sanitizeHTML(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * File upload validation
 */
export interface FileUploadConfig {
  /** Allowed MIME types */
  allowedMimeTypes?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
}

const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  allowedMimeTypes: ['application/pdf', 'application/json', 'text/plain'],
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.pdf', '.json', '.txt'],
};

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { name: string; type: string; size: number },
  config: FileUploadConfig = {}
): ValidationResult {
  const cfg = { ...DEFAULT_FILE_CONFIG, ...config };
  const errors: ValidationError[] = [];

  // Check file size
  if (cfg.maxSize && file.size > cfg.maxSize) {
    errors.push({
      field: 'file',
      message: `File size exceeds maximum allowed size of ${cfg.maxSize} bytes`,
      code: 'FILE_TOO_LARGE',
    });
  }

  // Check MIME type
  if (cfg.allowedMimeTypes && !cfg.allowedMimeTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type ${file.type} is not allowed`,
      code: 'INVALID_FILE_TYPE',
    });
  }

  // Check file extension
  if (cfg.allowedExtensions) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!cfg.allowedExtensions.includes(ext)) {
      errors.push({
        field: 'file',
        message: `File extension ${ext} is not allowed`,
        code: 'INVALID_FILE_EXTENSION',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
