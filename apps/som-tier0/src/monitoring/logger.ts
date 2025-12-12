/**
 * Structured Logger for C-ATO Observability (AU-2/AU-3)
 * Outputs logs in JSON format for aggregation systems (Splunk/ELK)
 * Uses 'pino' for high-performance structured logging
 */

import pino from 'pino';

// Configure pino
// In development, we use pino-pretty for readability
// In production, we use raw JSON
const isProduction = process.env.NODE_ENV === 'production';

export const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: !isProduction ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
        }
    } : undefined,
    base: {
        service: 'som-tier0',
        env: process.env.NODE_ENV
    },
    redact: {
        paths: ['*.token', '*.password', '*.secret', '*.key', '*.credential', '*.authorization'],
        censor: '[REDACTED]'
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

class PinoWrapper {
    info(message: string, context?: Record<string, any>, userId?: string) {
        pinoLogger.info({ context, userId }, message);
    }

    warn(message: string, context?: Record<string, any>, userId?: string) {
        pinoLogger.warn({ context, userId }, message);
    }

    error(message: string, error?: any, userId?: string) {
        // Handle error object specially for pino
        if (error instanceof Error) {
            pinoLogger.error({ err: error, userId }, message);
        } else {
            pinoLogger.error({ error, userId }, message);
        }
    }

    debug(message: string, context?: Record<string, any>) {
        pinoLogger.debug({ context }, message);
    }
}

export const logger = new PinoWrapper();

