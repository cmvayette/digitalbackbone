import { describe, it, expect } from 'vitest';
import { createSOMClient } from './factory';
import { HolonType, RelationshipType } from '@som/shared-types';

describe('MockSOMClient', () => {
    const client = createSOMClient('http://mock', { mode: 'mock' });

    it('should return a mocked organization', async () => {
        const response = await client.getHolon('some-id');
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data?.type).toBe(HolonType.Organization); // Defaults to Org in implementation
    });

    it('should query holons and return correct count', async () => {
        const response = await client.queryHolons(HolonType.Person, {}, { pageSize: 5 });
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(5);
        expect(response.data?.[0].type).toBe(HolonType.Person);
    });

    it('should return org structure', async () => {
        const response = await client.getOrgStructure('org-id');
        expect(response.success).toBe(true);
        expect(response.data?.organization).toBeDefined();
        expect(response.data?.positions.length).toBeGreaterThan(0);
    });

    it('should submit event successfully', async () => {
        const response = await client.submitEvent({
            type: 'SOME_EVENT',
            payload: {}
        } as any);
        expect(response.success).toBe(true);
        expect(response.data?.eventId).toBeDefined();
    });
});
