import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SOMClient } from './client';
import { createSOMClient } from './factory';

describe('SOMClient', () => {
    const baseUrl = 'http://api.test';

    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = vi.fn();
    });

    it('should initialize with default headers', async () => {
        const client = new SOMClient(baseUrl);
        // @ts-ignore
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: {} })
        });

        await client.getHolon('123');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://api.test/holons/123',
            expect.objectContaining({
                headers: expect.objectContaining({ 'Content-Type': 'application/json' })
            })
        );
    });

    it('should set auth token correctly', async () => {
        const client = new SOMClient(baseUrl);
        client.setAuthToken('my-secret-token');

        // @ts-ignore
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: {} })
        });

        await client.getHolon('123');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer my-secret-token'
                })
            })
        );
    });

    it('should handle "Bearer " prefix in setAuthToken', async () => {
        const client = new SOMClient(baseUrl);
        client.setAuthToken('Bearer my-secret-token');

        // @ts-ignore
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: {} })
        });

        await client.getHolon('123');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer my-secret-token'
                })
            })
        );
    });

    it('should clear auth token', async () => {
        const client = new SOMClient(baseUrl);
        client.setAuthToken('token');
        client.clearAuthToken();

        // @ts-ignore
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: {} })
        });

        await client.getHolon('123');

        // Check headers does NOT contain Authorization
        const callArgs = (global.fetch as any).mock.calls[0];
        const options = callArgs[1];
        expect(options.headers).not.toHaveProperty('Authorization');
    });

    it('should include credentials if configured', async () => {
        const client = new SOMClient(baseUrl, { includeCredentials: true });

        // @ts-ignore
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: {} })
        });

        await client.getHolon('123');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                credentials: 'include'
            })
        );
    });

    it('should not include credentials by default', async () => {
        const client = new SOMClient(baseUrl);

        // @ts-ignore
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: {} })
        });

        await client.getHolon('123');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                credentials: undefined
            })
        );
    });
});
