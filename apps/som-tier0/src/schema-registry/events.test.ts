
import { describe, it, expect, beforeAll } from 'vitest';
import { SchemaRegistry } from './index';
import * as path from 'path';

describe('Event Schema Verification', () => {
    let registry: SchemaRegistry;

    beforeAll(async () => {
        // Point to the correct schemas directory
        const schemaDir = path.resolve(__dirname, '../../schemas/v1');
        registry = new SchemaRegistry(schemaDir);
        await registry.initialize();
    });

    it('should load event schemas', () => {
        const loadedTypes = registry.getLoadedTypes();
        expect(loadedTypes).toContain('DocumentIssued');
        expect(loadedTypes).toContain('ObligationDefined');
    });

    it('should validate a valid DocumentIssued event', () => {
        const validEvent = {
            id: 'evt-101',
            timestamp: new Date().toISOString(),
            type: 'DocumentIssued',
            payload: {
                title: 'Security Policy 2025',
                content: 'Must use 2FA.',
                documentType: 'Policy',
                status: 'active',
                version: '1.0',
                authorId: 'user-admin'
            }
        };

        const result = registry.validate('DocumentIssued', validEvent);
        expect(result.valid).toBe(true);
    });

    it('should validate a valid ObligationDefined event', () => {
        const validEvent = {
            id: 'evt-102',
            timestamp: new Date().toISOString(),
            type: 'ObligationDefined',
            payload: {
                statement: 'Review logs daily',
                assignedTo: 'pos-security-officer',
                sourceDocId: 'doc-sec-pol-2025',
                trigger: 'Daily at 9am',
                action: 'Check logs',
                criticality: 'high'
            }
        };

        const result = registry.validate('ObligationDefined', validEvent);
        expect(result.valid).toBe(true);
    });

    it('should fail validation for invalid DocumentIssued event', () => {
        const invalidEvent = {
            id: 'evt-103',
            type: 'DocumentIssued',
            // Missing timestamp
            payload: {
                // Missing required title
                documentType: 'Blog', // Invalid enum
                status: 'active'
            }
        };

        const result = registry.validate('DocumentIssued', invalidEvent);
        expect(result.valid).toBe(false);
    });

    it('should fail validation for invalid ObligationDefined event', () => {
        const invalidEvent = {
            id: 'evt-104',
            timestamp: new Date().toISOString(),
            type: 'ObligationDefined',
            payload: {
                statement: 'Review logs',
                // Missing assignedTo
                sourceDocId: 'doc-1'
            }
        };

        const result = registry.validate('ObligationDefined', invalidEvent);
        expect(result.valid).toBe(false);
    });
});
