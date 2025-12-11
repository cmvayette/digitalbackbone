/**
 * Security Headers Middleware
 * NIST 800-53: SC-8 (Transmission Confidentiality), SC-7 (Boundary Protection)
 *
 * Implements DoD C-ATO required security headers for IL4/IL5 compliance
 */

import { Context, Next } from 'hono';

export interface SecurityHeadersConfig {
  /** Enable HSTS (HTTP Strict Transport Security) */
  enableHSTS?: boolean;
  /** HSTS max-age in seconds (default: 1 year) */
  hstsMaxAge?: number;
  /** Include subdomains in HSTS */
  hstsIncludeSubdomains?: boolean;
  /** HSTS preload */
  hstsPreload?: boolean;

  /** Enable Content Security Policy */
  enableCSP?: boolean;
  /** Custom CSP directives */
  cspDirectives?: Record<string, string | string[]>;
  /** CSP report URI for violations */
  cspReportUri?: string;

  /** Custom additional headers */
  additionalHeaders?: Record<string, string>;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubdomains: true,
  hstsPreload: true,
  enableCSP: true,
  cspReportUri: undefined,
};

/**
 * Create security headers middleware
 *
 * @param config - Security headers configuration
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * app.use('*', securityHeaders({
 *   enableHSTS: true,
 *   enableCSP: true,
 *   cspReportUri: '/api/v1/csp-report'
 * }));
 * ```
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    // Set security headers before processing request

    // 1. HTTPS Enforcement (HSTS)
    // NIST SC-8: Transmission Confidentiality
    if (cfg.enableHSTS) {
      let hstsValue = `max-age=${cfg.hstsMaxAge}`;
      if (cfg.hstsIncludeSubdomains) {
        hstsValue += '; includeSubDomains';
      }
      if (cfg.hstsPreload) {
        hstsValue += '; preload';
      }
      c.header('Strict-Transport-Security', hstsValue);
    }

    // 2. Clickjacking Protection
    // NIST SC-7: Boundary Protection
    c.header('X-Frame-Options', 'DENY');

    // 3. XSS Protection
    // NIST SI-3: Malicious Code Protection
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-XSS-Protection', '1; mode=block');

    // 4. Content Security Policy (CSP)
    // NIST SI-3: Malicious Code Protection
    if (cfg.enableCSP) {
      const defaultDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // TODO: Remove unsafe-* in production
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'https://localhost:*'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"], // Same as X-Frame-Options: DENY
        'upgrade-insecure-requests': [],
      };

      const directives = { ...defaultDirectives, ...cfg.cspDirectives };

      // Build CSP string
      const cspParts: string[] = [];
      for (const [directive, values] of Object.entries(directives)) {
        if (Array.isArray(values) && values.length > 0) {
          cspParts.push(`${directive} ${values.join(' ')}`);
        } else if (Array.isArray(values) && values.length === 0) {
          // Directive with no value (e.g., upgrade-insecure-requests)
          cspParts.push(directive);
        }
      }

      let cspValue = cspParts.join('; ');

      // Add report URI if configured
      if (cfg.cspReportUri) {
        cspValue += `; report-uri ${cfg.cspReportUri}`;
      }

      c.header('Content-Security-Policy', cspValue);
    }

    // 5. Referrer Policy
    // NIST SC-7: Boundary Protection
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Permissions Policy (Feature Policy)
    // Disable unnecessary browser features
    c.header(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    );

    // 7. Remove server identification
    // NIST SC-7: Boundary Protection - Don't leak server information
    c.header('X-Powered-By', ''); // Remove if present
    c.res.headers.delete('Server'); // Remove server header

    // 8. Additional custom headers
    if (cfg.additionalHeaders) {
      for (const [key, value] of Object.entries(cfg.additionalHeaders)) {
        c.header(key, value);
      }
    }

    // 9. Security event logging
    // Log that security headers were applied (for audit trail)
    const requestId = c.req.header('x-request-id') || crypto.randomUUID();
    c.set('requestId', requestId);
    c.set('securityHeadersApplied', true);

    await next();
  };
}

/**
 * Production-ready security headers with strict CSP
 * Removes unsafe-inline and unsafe-eval for production environments
 */
export function strictSecurityHeaders(config: Omit<SecurityHeadersConfig, 'cspDirectives'> = {}) {
  return securityHeaders({
    ...config,
    cspDirectives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"], // No unsafe-inline or unsafe-eval
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  });
}
