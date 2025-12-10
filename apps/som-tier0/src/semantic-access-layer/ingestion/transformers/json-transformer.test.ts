import { describe, it, expect } from 'vitest';
import { JsonPathTransformer } from './json-transformer';

describe('JsonPathTransformer', () => {
    it('should transform simple flat object', () => {
        const transformer = new JsonPathTransformer({
            externalSystem: 'TestSys',
            targetDataType: 'person_created',
            paths: {
                externalID: 'id'
            }
        });

        const raw = { id: 123, name: 'Alice' };
        const result = transformer.transform(raw);

        expect(result).not.toBeNull();
        expect(result?.externalSystem).toBe('TestSys');
        expect(result?.externalID).toBe('123');
        expect(result?.payload).toEqual(raw);
    });

    it('should transform nested object with dot notation', () => {
        const transformer = new JsonPathTransformer({
            externalSystem: 'HR',
            targetDataType: 'employee',
            paths: {
                externalID: 'meta.id',
                timestamp: 'meta.created_at',
                payload: 'data'
            }
        });

        const now = new Date();
        const raw = {
            meta: { id: 999, created_at: now.toISOString() },
            data: { role: 'Engineer' }
        };

        const result = transformer.transform(raw);

        expect(result).not.toBeNull();
        expect(result?.externalID).toBe('999');
        expect(result?.timestamp).toEqual(now);
        expect(result?.payload).toEqual({ role: 'Engineer' });
    });

    it('should return null if externalID is missing', () => {
        const transformer = new JsonPathTransformer({
            externalSystem: 'BadSys',
            targetDataType: 'bad',
            paths: { externalID: 'missing_field' }
        });

        const result = transformer.transform({ foo: 'bar' });
        expect(result).toBeNull();
    });

    it('should merge static payload', () => {
        const transformer = new JsonPathTransformer({
            externalSystem: 'StaticSys',
            targetDataType: 'static',
            paths: { externalID: 'id' },
            staticPayload: { source: 'manual' }
        });

        const result = transformer.transform({ id: 1, val: 'test' });
        expect(result?.payload).toEqual({
            id: 1,
            val: 'test',
            source: 'manual'
        });
    });
});
