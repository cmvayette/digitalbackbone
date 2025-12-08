/**
 * API Server for Tier-1 System Integration
 * Main server implementation with routing and middleware
 */

import { QueryLayer } from '../query/query-layer';
import { IEventStore as EventStore } from '../event-store';
import { SemanticAccessLayer } from '../semantic-access-layer';
import { SchemaVersioningEngine } from '../schema-versioning';
import { GovernanceEngine } from '../governance';
import { MonitoringService } from '../monitoring';
import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { APIRoutes } from './routes';
import {
  AuthenticationMiddleware,
  AuthorizationMiddleware,
  RequestValidationMiddleware,
  ErrorHandlerMiddleware,
  RateLimitMiddleware,
} from './middleware';
import { APIRequest, APIResponse } from './api-types';
import { ApiKeyAuthProvider } from './auth/api-key-provider';

/**
 * API Server configuration
 */
export interface APIServerConfig {
  port?: number;
  host?: string;
  maxRequestsPerMinute?: number;
  enableCORS?: boolean;
  corsOrigins?: string[];
}

/**
 * Route handler function
 */
export type RouteHandler = (request: APIRequest) => Promise<APIResponse>;

/**
 * Route definition
 */
export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: RouteHandler;
  requiresAuth?: boolean;
  requiresPermission?: (user: any) => boolean;
}

/**
 * API Server
 * Provides REST API for Tier-1 system integration
 */
export class APIServer {
  private config: APIServerConfig;
  private routes: APIRoutes;
  private authMiddleware: AuthenticationMiddleware;
  private authzMiddleware: AuthorizationMiddleware;
  private validationMiddleware: RequestValidationMiddleware;
  private errorHandler: ErrorHandlerMiddleware;
  private rateLimiter: RateLimitMiddleware;
  private routeRegistry: Map<string, Route>;

  constructor(
    config: APIServerConfig,
    queryLayer: QueryLayer,
    eventStore: EventStore,
    semanticAccessLayer: SemanticAccessLayer,
    schemaVersioning: SchemaVersioningEngine,
    governance: GovernanceEngine,
    monitoring: MonitoringService,
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry,
    constraintEngine: ConstraintEngine,
    documentRegistry: DocumentRegistry
  ) {
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      maxRequestsPerMinute: 100,
      enableCORS: true,
      corsOrigins: ['*'],
      ...config,
    };

    this.routes = new APIRoutes(
      queryLayer,
      eventStore,
      semanticAccessLayer,
      schemaVersioning,
      governance,
      monitoring,
      holonRegistry,
      relationshipRegistry,
      constraintEngine,
      documentRegistry
    );

    // Default to API Key Auth for now (or could be config driven)
    const authProvider = new ApiKeyAuthProvider();
    this.authMiddleware = new AuthenticationMiddleware(authProvider);

    this.authzMiddleware = new AuthorizationMiddleware();
    this.validationMiddleware = new RequestValidationMiddleware();
    this.errorHandler = new ErrorHandlerMiddleware();
    this.rateLimiter = new RateLimitMiddleware(this.config.maxRequestsPerMinute);
    this.routeRegistry = new Map();

    this.registerRoutes();
  }

  /**
   * Register all API routes
   */
  private registerRoutes(): void {
    // Holon query routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/holons/query',
      handler: (req) => this.routes.queryHolons(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/holons/:id',
      handler: (req) => this.routes.getHolon(req),
      requiresAuth: true,
    });

    // Relationship query routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/relationships/query',
      handler: (req) => this.routes.queryRelationships(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/holons/:id/relationships',
      handler: (req) => this.routes.getHolonRelationships(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/holons/:id/connected',
      handler: (req) => this.routes.getConnectedHolons(req),
      requiresAuth: true,
    });

    // Event submission routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/events',
      handler: (req) => this.routes.submitEvent(req),
      requiresAuth: true,
      requiresPermission: (user) => this.authzMiddleware.canSubmitEvents(user).authorized,
    });

    this.registerRoute({
      method: 'POST',
      path: '/api/v1/events/batch',
      handler: (req) => this.routes.submitEventsBatch(req),
      requiresAuth: true,
      requiresPermission: (user) => this.authzMiddleware.canSubmitEvents(user).authorized,
    });

    // Event query routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/events/query',
      handler: (req) => this.routes.queryEvents(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/events/:id',
      handler: (req) => this.routes.getEvent(req),
      requiresAuth: true,
    });

    // Temporal query routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/temporal/holons',
      handler: (req) => this.routes.queryHolonsAsOf(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'POST',
      path: '/api/v1/temporal/relationships',
      handler: (req) => this.routes.queryRelationshipsAsOf(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/temporal/holons/:id',
      handler: (req) => this.routes.getHolonAsOf(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'POST',
      path: '/api/v1/temporal/organizations/structure',
      handler: (req) => this.routes.getOrganizationStructureAsOf(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'POST',
      path: '/api/v1/events/causal-chain',
      handler: (req) => this.routes.traceCausalChain(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/holons/:id/history',
      handler: (req) => this.routes.getHolonHistory(req),
      requiresAuth: true,
    });

    // Pattern matching routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/patterns/match',
      handler: (req) => this.routes.matchPattern(req),
      requiresAuth: true,
    });

    // Schema management routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/schema/proposals',
      handler: (req) => this.routes.submitSchemaProposal(req),
      requiresAuth: true,
      requiresPermission: (user) => this.authzMiddleware.canProposeSchemaChanges(user).authorized,
    });

    this.registerRoute({
      method: 'POST',
      path: '/api/v1/schema/versions',
      handler: (req) => this.routes.getSchemaVersions(req),
      requiresAuth: true,
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/schema/current',
      handler: (req) => this.routes.getCurrentSchema(req),
      requiresAuth: true,
    });

    // External system integration routes
    this.registerRoute({
      method: 'POST',
      path: '/api/v1/external/data',
      handler: (req) => this.routes.submitExternalData(req),
      requiresAuth: true,
      requiresPermission: (user) => this.authzMiddleware.canSubmitEvents(user).authorized,
    });

    this.registerRoute({
      method: 'POST',
      path: '/api/v1/external/mappings',
      handler: (req) => this.routes.queryIDMapping(req),
      requiresAuth: true,
    });

    // System health routes
    this.registerRoute({
      method: 'GET',
      path: '/api/v1/health',
      handler: (req) => this.routes.getHealth(req),
      requiresAuth: false, // Public endpoint
    });

    this.registerRoute({
      method: 'GET',
      path: '/api/v1/metrics',
      handler: (req) => this.routes.getMetrics(req),
      requiresAuth: true,
      requiresPermission: (user) => this.authzMiddleware.canAccessSystemHealth(user).authorized,
    });
  }

  /**
   * Register a route
   */
  private registerRoute(route: Route): void {
    const key = `${route.method}:${route.path}`;
    this.routeRegistry.set(key, route);
  }

  /**
   * Find a matching route
   */
  private findRoute(method: string, path: string): { route: Route; params: Record<string, string> } | undefined {
    for (const [key, route] of this.routeRegistry.entries()) {
      // Split only on the first colon to separate method from path
      const colonIndex = key.indexOf(':');
      const routeMethod = key.substring(0, colonIndex);
      const routePath = key.substring(colonIndex + 1);

      if (routeMethod !== method) {
        continue;
      }

      const params = this.matchPath(routePath, path);
      if (params !== null) {
        return { route, params };
      }
    }

    return undefined;
  }

  /**
   * Match a path pattern against an actual path
   * Returns params if match, null otherwise
   */
  private matchPath(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/').filter(p => p);
    const pathParts = path.split('/').filter(p => p);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Path parameter
        const paramName = patternPart.substring(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Literal mismatch
        return null;
      }
    }

    return params;
  }

  /**
   * Handle an incoming request
   */
  async handleRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: any,
    query?: Record<string, string>
  ): Promise<APIResponse> {
    try {
      // Find matching route
      const match = this.findRoute(method, path);

      if (!match) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Route ${method} ${path} not found`,
          },
        };
      }

      const { route, params } = match;

      // Check rate limit
      const clientId = headers['x-client-id'] || headers['x-forwarded-for'] || 'unknown';
      const rateLimitResult = this.rateLimiter.checkRateLimit(clientId);

      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimitResult.error!,
          },
        };
      }

      // Authenticate if required
      let user: any = undefined;
      if (route.requiresAuth !== false) {
        // New Auth Flow: Pass headers to authenticate()
        const authResult = await this.authMiddleware.authenticate(headers);

        if (!authResult.authenticated) {
          return {
            success: false,
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: authResult.error || 'Authentication failed',
            },
          };
        }

        user = authResult.user!;

        // Check permissions if required
        if (route.requiresPermission && !route.requiresPermission(user)) {
          return {
            success: false,
            error: {
              code: 'AUTHORIZATION_ERROR',
              message: 'Insufficient permissions',
            },
          };
        }
      }

      // Build request object
      const request: APIRequest = {
        user: user!,
        body,
        params,
        query,
      };

      // Execute route handler
      const response = await route.handler(request);

      return response;
    } catch (error: any) {
      return this.errorHandler.handleError(error);
    }
  }

  /**
   * Register an API key for a user
   */
  registerAPIKey(apiKey: string, user: any): void {
    this.authMiddleware.registerAPIKey(apiKey, user);
  }

  /**
   * Revoke an API key
   */
  revokeAPIKey(apiKey: string): void {
    this.authMiddleware.revokeAPIKey(apiKey);
  }

  /**
   * Get server configuration
   */
  getConfig(): APIServerConfig {
    return { ...this.config };
  }

  /**
   * Get registered routes
   */
  getRoutes(): Route[] {
    return Array.from(this.routeRegistry.values());
  }
}

/**
 * Create a new API server instance
 */
export function createAPIServer(
  config: APIServerConfig,
  queryLayer: QueryLayer,
  eventStore: EventStore,
  semanticAccessLayer: SemanticAccessLayer,
  schemaVersioning: SchemaVersioningEngine,
  governance: GovernanceEngine,
  monitoring: MonitoringService,
  holonRegistry: HolonRegistry,
  relationshipRegistry: RelationshipRegistry,
  constraintEngine: ConstraintEngine,
  documentRegistry: DocumentRegistry
): APIServer {
  return new APIServer(
    config,
    queryLayer,
    eventStore,
    semanticAccessLayer,
    schemaVersioning,
    governance,
    monitoring,
    holonRegistry,
    relationshipRegistry,
    constraintEngine,
    documentRegistry
  );
}
