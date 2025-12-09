import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { ApiIngestionAdapter } from './api-adapter';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('ApiIngestionAdapter', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const userSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email()
    });

    type User = z.infer<typeof userSchema>;

    it('should successfully fetch and validate valid data', async () => {
        const mockData = [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' }
        ];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const adapter = new ApiIngestionAdapter<User>('https://api.example.com/users', userSchema);
        const result = await adapter.fetch();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Alice');
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object));
    });

    it('should handle dataPath for nested responses', async () => {
        const mockResponse = {
            meta: { page: 1 },
            data: {
                users: [
                    { id: 1, name: 'Charlie', email: 'charlie@example.com' }
                ]
            }
        };

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const adapter = new ApiIngestionAdapter<User>(
            'https://api.example.com/users',
            userSchema,
            {},
            'data.users'
        );
        const result = await adapter.fetch();

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Charlie');
    });

    it('should throw validation error when data does not match schema', async () => {
        const invalidData = [
            { id: 1, name: 'Dave', email: 'invalid-email' } // Invalid email
        ];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => invalidData
        });

        const adapter = new ApiIngestionAdapter<User>('https://api.example.com/users', userSchema);

        await expect(adapter.fetch()).rejects.toThrow('Validation failed for item at index 0');
    });

    it('should throw error when API call fails', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found'
        });

        const adapter = new ApiIngestionAdapter<User>('https://api.example.com/users', userSchema);

        await expect(adapter.fetch()).rejects.toThrow('API fetch failed: 404 Not Found');
    });
});
