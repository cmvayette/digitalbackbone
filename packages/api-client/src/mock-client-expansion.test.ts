import { describe, it, expect } from 'vitest';
import { MockSOMClient } from './mock-client';
import { HolonType, Process, Document, DocumentType } from '@som/shared-types';

describe('MockSOMClient Expansion', () => {
    const client = new MockSOMClient();

    it('generates a valid Process holon with steps', async () => {
        const response = await client.queryHolons(HolonType.Process, {}, { pageSize: 1 });
        expect(response.success).toBe(true);
        const process = response.data![0] as Process;

        expect(process.type).toBe(HolonType.Process);
        expect(process.properties.steps.length).toBeGreaterThanOrEqual(3);

        const step = process.properties.steps[0];
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        // assigneeType should be one of the mocked values
        expect(['human', 'agent', 'system']).toContain(step.assigneeType);
    });

    it('generates a valid Document holon with correct enums', async () => {
        const response = await client.queryHolons(HolonType.Document, {}, { pageSize: 1 });
        expect(response.success).toBe(true);
        const doc = response.data![0] as Document;

        expect(doc.type).toBe(HolonType.Document);
        expect(Object.values(DocumentType)).toContain(doc.properties.documentType);
        expect(doc.properties.classificationMetadata).toBe('UNCLASSIFIED');
    });
});
