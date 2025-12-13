import { APIRoutes } from './routes';
import { AuthorizationMiddleware } from './middleware';
import { Route } from './api-types';

/**
 * Define all API routes
 */
export function defineRoutes(routes: APIRoutes, authzMiddleware: AuthorizationMiddleware): Route[] {
    return [
        // Holon query routes
        {
            method: 'POST',
            path: '/api/v1/holons/query',
            handler: (req) => routes.queryHolons(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/holons/:id',
            handler: (req) => routes.getHolon(req),
            requiresAuth: true,
        },

        // Relationship query routes
        {
            method: 'POST',
            path: '/api/v1/relationships/query',
            handler: (req) => routes.queryRelationships(req),
            requiresAuth: true,
        },
        {
            method: 'POST',
            path: '/api/v1/relationships', // Alias for Client Contract
            handler: (req) => routes.queryRelationships(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/holons/:id/relationships',
            handler: (req) => routes.getHolonRelationships(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/holons/:id/connected',
            handler: (req) => routes.getConnectedHolons(req),
            requiresAuth: true,
        },

        // Event submission routes
        {
            method: 'POST',
            path: '/api/v1/events',
            handler: (req) => routes.submitEvent(req),
            requiresAuth: true,
            requiresPermission: (user) => authzMiddleware.canSubmitEvents(user).authorized,
        },
        {
            method: 'POST',
            path: '/api/v1/events/batch',
            handler: (req) => routes.submitEventsBatch(req),
            requiresAuth: true,
            requiresPermission: (user) => authzMiddleware.canSubmitEvents(user).authorized,
        },

        // Event query routes
        {
            method: 'POST',
            path: '/api/v1/events/query',
            handler: (req) => routes.queryEvents(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/events/:id',
            handler: (req) => routes.getEvent(req),
            requiresAuth: true,
        },

        // Temporal query routes
        {
            method: 'POST',
            path: '/api/v1/temporal/holons',
            handler: (req) => routes.queryHolonsAsOf(req),
            requiresAuth: true,
        },
        {
            method: 'POST',
            path: '/api/v1/temporal/relationships',
            handler: (req) => routes.queryRelationshipsAsOf(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/temporal/holons/:id',
            handler: (req) => routes.getHolonAsOf(req),
            requiresAuth: true,
        },
        {
            method: 'POST',
            path: '/api/v1/temporal/organizations/structure',
            handler: (req) => routes.getOrganizationStructureAsOf(req),
            requiresAuth: true,
        },
        {
            method: 'POST',
            path: '/api/v1/events/causal-chain',
            handler: (req) => routes.traceCausalChain(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/holons/:id/history',
            handler: (req) => routes.getHolonHistory(req),
            requiresAuth: true,
        },

        // Calendar events
        {
            method: 'GET',
            path: '/api/v1/calendar/events',
            handler: (req) => routes.queryCalendarEvents(req),
            requiresAuth: true,
        },
        {
            method: 'POST',
            path: '/api/v1/availability/check',
            handler: (req) => routes.checkAvailability(req),
            requiresAuth: true,
        },

        // Unified Search Route (Client Contract)
        {
            method: 'GET',
            path: '/api/v1/search',
            handler: (req) => routes.unifiedSearch(req),
            requiresAuth: true,
        },

        // Pattern matching routes
        {
            method: 'POST',
            path: '/api/v1/patterns/match',
            handler: (req) => routes.matchPattern(req),
            requiresAuth: true,
        },

        // Schema management routes
        {
            method: 'POST',
            path: '/api/v1/schema/proposals',
            handler: (req) => routes.submitSchemaProposal(req),
            requiresAuth: true,
            requiresPermission: (user) => authzMiddleware.canProposeSchemaChanges(user).authorized,
        },
        {
            method: 'POST',
            path: '/api/v1/schema/versions',
            handler: (req) => routes.getSchemaVersions(req),
            requiresAuth: true,
        },
        {
            method: 'GET',
            path: '/api/v1/schema/current',
            handler: (req) => routes.getCurrentSchema(req),
            requiresAuth: true,
        },

        // External system integration routes
        {
            method: 'POST',
            path: '/api/v1/external/data',
            handler: (req) => routes.submitExternalData(req),
            requiresAuth: true,
            requiresPermission: (user) => authzMiddleware.canSubmitEvents(user).authorized,
        },
        {
            method: 'POST',
            path: '/api/v1/external/mappings',
            handler: (req) => routes.queryIDMapping(req),
            requiresAuth: true,
        },

        // System health routes
        {
            method: 'GET',
            path: '/api/v1/health',
            handler: (req) => routes.getHealth(req),
            requiresAuth: false, // Public endpoint
        },
        {
            method: 'GET',
            path: '/health/liveness',
            handler: async () => ({ success: true, data: { status: 'UP' } }),
            requiresAuth: false,
        },
        {
            method: 'GET',
            path: '/health/readiness',
            handler: (req) => routes.getHealth(req),
            requiresAuth: false,
        },
        {
            method: 'GET',
            path: '/api/v1/metrics',
            handler: (req) => routes.getMetrics(req),
            requiresAuth: true,
            requiresPermission: (user) => authzMiddleware.canAccessSystemHealth(user).authorized,
        },
    ];
}
