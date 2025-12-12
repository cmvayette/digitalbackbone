import { describe, it, expect } from 'vitest';
import { MockSOMClient } from './mock-client';
import * as SharedTypes from '@som/shared-types';

describe('MockSOMClient Expansion', () => {
    const client = new MockSOMClient();

    it('generates a valid Process holon with steps', async () => {
        const response = await client.queryHolons(SharedTypes.HolonType.Process, {}, { pageSize: 1 });
        expect(response.success).toBe(true);
        const process = response.data![0] as SharedTypes.Process;

        expect(process.type).toBe(SharedTypes.HolonType.Process);
        expect(process.properties.steps.length).toBeGreaterThanOrEqual(3);

        const step = process.properties.steps[0];
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        // assigneeType should be one of the mocked values
        expect(['human', 'agent', 'system']).toContain(step.assigneeType);
    });

    it('generates a valid Document holon with correct enums', async () => {
        const response = await client.queryHolons(SharedTypes.HolonType.Document, {}, { pageSize: 1 });
        expect(response.success).toBe(true);
        const doc = response.data![0] as SharedTypes.Document;

        expect(doc.type).toBe(SharedTypes.HolonType.Document);
        expect(Object.values(SharedTypes.DocumentType)).toContain(doc.properties.documentType);
        expect(doc.properties.classificationMetadata).toBe('UNCLASSIFIED');
    });
});
