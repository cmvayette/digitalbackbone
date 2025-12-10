/**
 * Structured Logger for C-ATO Observability (AU-2/AU-3)
 * Outputs logs in JSON format for aggregation systems (Splunk/ELK)
 */

export interface LogEntry {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: string;
    context?: Record<string, any>;
    userId?: string;
    traceId?: string;
}

class StructuredLogger {
    private sanitize(obj: any): any {
        // Simple sanitization to prevent logging secrets
        const sensitiveKeys = ['token', 'password', 'secret', 'key', 'credential'];
        if (typeof obj !== 'object' || obj === null) return obj;

        const sanitized: any = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                sanitized[key] = this.sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    private log(level: LogEntry['level'], message: string, context?: Record<string, any>, userId?: string, traceId?: string) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context: context ? this.sanitize(context) : undefined,
            userId,
            traceId
        };

        // In production, this goes to stdout for picking up by log collector
        console.log(JSON.stringify(entry));
    }

    info(message: string, context?: Record<string, any>, userId?: string) {
        this.log('info', message, context, userId);
    }

    warn(message: string, context?: Record<string, any>, userId?: string) {
        this.log('warn', message, context, userId);
    }

    error(message: string, error?: any, userId?: string) {
        this.log('error', message, { error: error?.message || error, stack: error?.stack }, userId);
    }

    debug(message: string, context?: Record<string, any>) {
        if (process.env.NODE_ENV !== 'production') {
            this.log('debug', message, context);
        }
    }
}

export const logger = new StructuredLogger();
