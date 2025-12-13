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
import { StateProjectionEngine } from '../state-projection';
import { CalendarIndex, AvailabilityService } from '../calendar';
import { APIRoutes } from './routes';
import {
  AuthenticationMiddleware,
  AuthorizationMiddleware,
  RequestValidationMiddleware,
  ErrorHandlerMiddleware,
  RateLimitMiddleware,
} from './middleware';
import { APIRequest, APIResponse, Route, RouteHandler } from './api-types';
import { ApiKeyAuthProvider } from './auth/api-key-provider';
import { defineRoutes } from './route-config';

/**
 * API Server configuration
 */
export interface APIServerConfig {
  port?: number;
  host?: string;
  maxRequestsPerMinute?: number;
  enableCORS?: boolean;
  corsOrigins?: string[];
  authMode?: 'apikey' | 'gateway';
}



/**
 * API Server
 * Provides REST API for Tier-1 system integration
 */
export class APIServer {
  private config: APIServerConfig;
  private routes: APIRoutes;
  private availabilityService: AvailabilityService;
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
    documentRegistry: DocumentRegistry,


    projectionEngine: StateProjectionEngine,
    calendarIndex: CalendarIndex,
    availabilityService: AvailabilityService
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
      documentRegistry,

      projectionEngine,
      calendarIndex,
      availabilityService
    );

    // Select Auth Provider based on configuration
    let authProvider: import('./auth/auth-types').IAuthProvider;

    if (this.config.authMode === 'gateway') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GatewayHeaderAuthProvider } = require('./auth/gateway-provider');
      authProvider = new GatewayHeaderAuthProvider();
    } else {
      // Default to API Key
      authProvider = new ApiKeyAuthProvider();
    }

    this.authMiddleware = new AuthenticationMiddleware(authProvider);

    this.authzMiddleware = new AuthorizationMiddleware();
    this.validationMiddleware = new RequestValidationMiddleware();
    this.errorHandler = new ErrorHandlerMiddleware();
    this.rateLimiter = new RateLimitMiddleware(this.config.maxRequestsPerMinute);
    this.routeRegistry = new Map();
    this.availabilityService = availabilityService;

    this.registerRoutes();
  }

  /**
   * Register all API routes
   */
  /*
   * Register all API routes
   */
  private registerRoutes(): void {
    const routeDefinitions = defineRoutes(this.routes, this.authzMiddleware);
    for (const route of routeDefinitions) {
      this.registerRoute(route);
    }
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
    } catch (error: unknown) {
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
  documentRegistry: DocumentRegistry,

  projectionEngine: StateProjectionEngine,
  calendarIndex: CalendarIndex,
  availabilityService: AvailabilityService
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
    documentRegistry,

    projectionEngine,
    calendarIndex,
    availabilityService
  );
}
