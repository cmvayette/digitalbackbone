import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIServer } from './api-server';
import { APIRoutes } from './routes';
import { APIRequest } from './api-types';

// Mock everything needed for APIServer
const mockRoutes = {
    unifiedSearch: vi.fn().mockResolvedValue({ success: true, data: [] }),
    queryRelationships: vi.fn().mockResolvedValue({ success: true, data: [] }),
    // ... add others if needed, but we only test routing here
} as unknown as APIRoutes;

describe('APIServer Routing', () => {
    let server: APIServer;

    beforeEach(() => {
        // We can cast a partial object to APIServer to test private methods or internal routing logic
        // But since we want to test handleRequest which calls findRoute, we should instantiate it properly 
        // OR mock the entire dependencies.

        // Easier approach: Use the class but mock the internal routes object if possible.
        // Since routes is private, we can't easily swap it.
        // Instead, we will test the route registry if we can access it, or just call handleRequest.

        // We'll mock the dependencies of APIServer constructor
        // This is verbose. Let's try to inspect the routeRegistry via "any" cast to verify registration.

        const mockDeps = {} as any; // Mock all deps as empty objects
        server = new APIServer(
            {}, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps, mockDeps
        );

        // Inject our mock routes object (dirty but effective for unit testing the wiring)
        (server as any).routes = mockRoutes;
    });

    it('should have GET /api/v1/search registered', async () => {
        const req: APIRequest = {
            user: { userId: 'test', roles: [] },
            query: { q: 'test' },
            body: {},
            params: {}
        };

        const response = await server.handleRequest('GET', '/api/v1/search', {}, {}, { q: 'test' });

        // We expect it to call our mockRoutes.unifiedSearch
        // Note: APIServer checks auth. We didn't set up auth middleware mocking.
        // The default auth middleware checks headers. 
        // We can bypass auth by mocking authMiddleware or providing a valid key if we controlled the store.

        // Alternative: Check routeRegistry directly
        const registry = (server as any).routeRegistry as Map<string, any>;
        const route = registry.get('GET:/api/v1/search');

        expect(route).toBeDefined();
        expect(route?.requiresAuth).toBe(true);
    });

    it('should have POST /api/v1/relationships registered', async () => {
        const registry = (server as any).routeRegistry as Map<string, any>;
        const route = registry.get('POST:/api/v1/relationships');

        expect(route).toBeDefined();
        expect(route?.requiresAuth).toBe(true);
    });
});
