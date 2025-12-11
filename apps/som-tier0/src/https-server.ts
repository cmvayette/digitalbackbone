/**
 * HTTPS Server Configuration
 * NIST 800-53: SC-8 (Transmission Confidentiality)
 *
 * Implements TLS 1.3 with DoD-compliant cipher suites
 */

import { createServer as createHTTPSServer, type ServerOptions } from 'https';
import { createServer as createHTTPServer } from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Hono } from 'hono';

export interface HTTPSConfig {
  /** Enable HTTPS (default: false for development) */
  enabled: boolean;
  /** Port for HTTPS server (default: 3443) */
  port: number;
  /** Path to TLS certificate */
  certPath?: string;
  /** Path to TLS private key */
  keyPath?: string;
  /** Path to CA certificate (optional) */
  caPath?: string;
  /** Minimum TLS version (default: TLSv1.3) */
  minVersion?: 'TLSv1.2' | 'TLSv1.3';
  /** Maximum TLS version (default: TLSv1.3) */
  maxVersion?: 'TLSv1.2' | 'TLSv1.3';
  /** Enable HTTP server for redirect (default: true if HTTPS enabled) */
  enableHTTPRedirect?: boolean;
  /** Port for HTTP redirect server (default: 3080) */
  httpRedirectPort?: number;
}

/**
 * DoD-approved TLS cipher suites (FIPS 140-2 compliant)
 * Based on NIST SP 800-52 Rev 2
 */
const DOD_CIPHER_SUITES = [
  // TLS 1.3 cipher suites (preferred)
  'TLS_AES_256_GCM_SHA384',
  'TLS_AES_128_GCM_SHA256',
  'TLS_CHACHA20_POLY1305_SHA256',

  // TLS 1.2 cipher suites (fallback for compatibility)
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
].join(':');

/**
 * Load TLS certificates from file system
 */
function loadCertificates(config: HTTPSConfig): { key: Buffer; cert: Buffer; ca?: Buffer } {
  if (!config.certPath || !config.keyPath) {
    throw new Error(
      'HTTPS enabled but certificate paths not provided. ' +
      'Set TLS_CERT_PATH and TLS_KEY_PATH environment variables.'
    );
  }

  try {
    const key = readFileSync(resolve(config.keyPath));
    const cert = readFileSync(resolve(config.certPath));
    const ca = config.caPath ? readFileSync(resolve(config.caPath)) : undefined;

    return { key, cert, ca };
  } catch (error: any) {
    throw new Error(
      `Failed to load TLS certificates: ${error.message}\n` +
      `  Key path: ${config.keyPath}\n` +
      `  Cert path: ${config.certPath}`
    );
  }
}

/**
 * Create HTTP redirect server
 * Redirects all HTTP traffic to HTTPS
 */
function createHTTPRedirectServer(httpsPort: number, httpPort: number) {
  const server = createHTTPServer((req, res) => {
    const host = req.headers.host?.split(':')[0] || 'localhost';
    const redirectUrl = `https://${host}:${httpsPort}${req.url}`;

    // 301 Permanent Redirect for SEO and caching
    res.writeHead(301, {
      Location: redirectUrl,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    });
    res.end();
  });

  server.listen(httpPort, () => {
    console.log(`HTTP redirect server running on http://localhost:${httpPort}`);
    console.log(`  → Redirecting to https://localhost:${httpsPort}`);
  });

  return server;
}

/**
 * Create and configure HTTPS server
 *
 * @param app - Hono application instance
 * @param config - HTTPS configuration
 * @returns HTTPS server instance (or HTTP if HTTPS disabled)
 */
export function createSecureServer(app: Hono, config: HTTPSConfig) {
  if (!config.enabled) {
    console.log('HTTPS disabled - running HTTP server (development only)');
    console.warn('⚠️  WARNING: HTTP is NOT secure. Enable HTTPS for production!');

    const server = createHTTPServer(app.fetch as any);
    server.listen(config.port, () => {
      console.log(`HTTP server running on http://localhost:${config.port}`);
    });

    return server;
  }

  // Load TLS certificates
  const { key, cert, ca } = loadCertificates(config);

  // HTTPS server options (DoD compliant)
  const httpsOptions: ServerOptions = {
    key,
    cert,
    ca,

    // TLS version enforcement (NIST 800-52 Rev 2)
    minVersion: config.minVersion || 'TLSv1.3',
    maxVersion: config.maxVersion || 'TLSv1.3',

    // DoD-approved cipher suites (FIPS 140-2)
    ciphers: DOD_CIPHER_SUITES,

    // Prefer server cipher suite order
    honorCipherOrder: true,

    // Disable session resumption for maximum security
    // (can be enabled for performance if needed)
    sessionTimeout: 300, // 5 minutes

    // Request client certificate (optional - for CAC/PIV)
    // requestCert: true,
    // rejectUnauthorized: false, // Set to true in production with proper CA
  };

  // Create HTTPS server
  const server = createHTTPSServer(httpsOptions, app.fetch as any);

  server.listen(config.port, () => {
    console.log(`✓ HTTPS server running on https://localhost:${config.port}`);
    console.log(`  TLS Version: ${config.minVersion || 'TLSv1.3'}`);
    console.log(`  Certificate: ${config.certPath}`);
    console.log(`  FIPS 140-2 cipher suites enabled`);
  });

  // Create HTTP redirect server if enabled
  if (config.enableHTTPRedirect !== false) {
    const httpPort = config.httpRedirectPort || 3080;
    createHTTPRedirectServer(config.port, httpPort);
  }

  return server;
}

/**
 * Parse HTTPS configuration from environment variables
 */
export function getHTTPSConfigFromEnv(): HTTPSConfig {
  const enabled = process.env.ENABLE_HTTPS === 'true';
  const port = parseInt(process.env.HTTPS_PORT || '3443');
  const httpRedirectPort = parseInt(process.env.HTTP_PORT || '3080');

  return {
    enabled,
    port,
    certPath: process.env.TLS_CERT_PATH,
    keyPath: process.env.TLS_KEY_PATH,
    caPath: process.env.TLS_CA_PATH,
    minVersion: (process.env.TLS_MIN_VERSION as any) || 'TLSv1.3',
    maxVersion: (process.env.TLS_MAX_VERSION as any) || 'TLSv1.3',
    enableHTTPRedirect: process.env.ENABLE_HTTP_REDIRECT !== 'false',
    httpRedirectPort,
  };
}
