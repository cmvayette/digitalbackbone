
import { describe, it, expect, beforeAll } from 'vitest';
import { SchemaRegistry } from './index';
// import { HolonType } from '@som/shared-types'; // Removing reliance on potentially stale enum
import * as path from 'path';

// Define types locally for test reliability if shared lib is stale
const HolonType = {
    Process: 'Process',
    Task: 'Task',
    Objective: 'Objective',
    LOE: 'LOE'
};

describe('Schema Verification for New Types', () => {
    let registry: SchemaRegistry;

    beforeAll(async () => {
        // Point to the correct schemas directory
        const schemaDir = path.resolve(__dirname, '../../schemas/v1');
        registry = new SchemaRegistry(schemaDir);
        await registry.initialize();
    });

    it('should load all expected schemas', () => {
        const loadedTypes = registry.getLoadedTypes();
        expect(loadedTypes).toContain(HolonType.Process);
        expect(loadedTypes).toContain(HolonType.Task);
        expect(loadedTypes).toContain(HolonType.Objective);
        expect(loadedTypes).toContain(HolonType.LOE);
    });

    it('should validate a valid Process holon', () => {
        const validProcess = {
            id: 'proc-123',
            type: 'Process',
            name: 'Onboarding Process',
            description: 'Standard onboarding flow',
            status: 'active',
            steps: [
                {
                    id: 'step-1',
                    title: 'Initial Review',
                    description: 'Review application',
                    owner: {
                        type: 'Position',
                        id: 'pos-hr-manager'
                    }
                }
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'user-1'
        };

        const result = registry.validate(HolonType.Process as any, validProcess);
        expect(result.valid).toBe(true);
    });

    it('should fail validation for Process missing required fields', () => {
        const invalidProcess = {
            id: 'proc-123',
            type: 'Process',
            properties: {
                // Missing name and description
                inputs: []
            },
            createdAt: new Date().toISOString(),
            createdBy: 'user-1',
            status: 'active',
            sourceDocuments: []
        };

        const result = registry.validate(HolonType.Process as any, invalidProcess);
        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
    });

    it('should validate a valid Task holon', () => {
        const validTask = {
            id: 'task-123',
            type: 'Task',
            properties: {
                description: 'Complete the form',
                type: 'review',
                priority: 'high',
                dueDate: new Date().toISOString(),
                status: 'created'
            },
            createdAt: new Date().toISOString(),
            createdBy: 'user-1',
            status: 'active',
            sourceDocuments: []
        };

        const result = registry.validate(HolonType.Task as any, validTask);
        expect(result.valid).toBe(true);
    });

    it('should validate a valid Objective holon', () => {
        const validObjective = {
            id: 'obj-123',
            type: 'Objective',
            properties: {
                description: 'Improve readiness',
                level: 'strategic',
                timeHorizon: new Date().toISOString(),
                status: 'active'
            },
            createdAt: new Date().toISOString(),
            createdBy: 'user-1',
            status: 'active',
            sourceDocuments: []
        };

        const result = registry.validate(HolonType.Objective as any, validObjective);
        expect(result.valid).toBe(true);
    });
});
