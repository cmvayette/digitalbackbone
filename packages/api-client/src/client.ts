/**
 * SOM API Client
 * Unified client for all Tier-1 applications to communicate with the SOM API
 */

import {
  Holon,
  HolonType,
  HolonID,
  Relationship,
  RelationshipType,
  Event,
  EventType,
  TypedEvent,
} from '@som/shared-types';

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    timestamp: Date;
  };
}

/**
 * Holon query filters
 */
export interface HolonFilters {
  status?: 'active' | 'inactive';
  createdAfter?: Date;
  createdBefore?: Date;
  properties?: Record<string, unknown>;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Search result item
 */
export interface SearchResult {
  id: HolonID;
  type: HolonType;
  name: string;
  description?: string;
  score: number;
  properties?: any;
}

/**
 * Organization structure response
 */
export interface OrgStructure {
  organization: Holon;
  subOrganizations: OrgStructure[];
  positions: Holon[];
  assignments: Array<{
    position: Holon;
    person: Holon;
    relationship: Relationship;
  }>;
  asOfTimestamp: string | Date; // Depending on serialization
}

/**
 * Event submission request
 * Enforces strict typing against the EventType but omits server-generated fields
 */
export type SubmitEventRequest<T extends EventType> = Omit<TypedEvent<T>, 'id' | 'recordedAt' | 'causalLinks'> & {
  causalLinks?: TypedEvent<T>['causalLinks']
};

/**
 * Event submission result
 */
export interface EventResult {
  eventId: string;
  success: boolean;
  affectedHolons: HolonID[];
}

/**
 * SOM API Client
 *
 * @example
 * const client = new SOMClient('http://localhost:3000/api/v1');
 *
 * // Query holons
 * const orgs = await client.queryHolons(HolonType.Organization);
 *
 * // Search
 * const results = await client.search('training');
 *
 * // Get org structure
 * const structure = await client.getOrgStructure('org-123');
 */
export class SOMClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private includeCredentials?: boolean;

  constructor(baseUrl: string, options?: { headers?: Record<string, string>; includeCredentials?: boolean }) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.includeCredentials = options?.includeCredentials;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
  }

  /**
   * Set the authentication token/key for subsequent requests
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Make an API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: this.includeCredentials ? 'include' : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'API_ERROR',
            message: data.error?.message || `HTTP ${response.status}`,
          },
        };
      }

      return data as APIResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // ==================== Holon Operations ====================

  /**
   * Get a single holon by ID
   */
  async getHolon(id: HolonID): Promise<APIResponse<Holon>> {
    return this.request<Holon>('GET', `/holons/${id}`);
  }

  /**
   * Query holons by type with optional filters
   */
  async queryHolons(
    type: HolonType,
    filters?: HolonFilters,
    pagination?: PaginationOptions
  ): Promise<APIResponse<Holon[]>> {
    return this.request<Holon[]>('POST', '/holons/query', {
      type,
      filters,
      pagination,
    });
  }

  /**
   * Unified search across holon types
   */
  async search(
    query: string,
    types?: HolonType[],
    limit?: number
  ): Promise<APIResponse<SearchResult[]>> {
    const params = new URLSearchParams({ q: query });
    if (types?.length) params.set('types', types.join(','));
    if (limit) params.set('limit', String(limit));

    return this.request<SearchResult[]>('GET', `/search?${params}`);
  }

  // ==================== Relationship Operations ====================

  /**
   * Get relationships for a holon
   */
  async getRelationships(
    holonId: HolonID,
    type?: RelationshipType,
    direction?: 'source' | 'target' | 'both'
  ): Promise<APIResponse<Relationship[]>> {
    return this.request<Relationship[]>('POST', '/relationships', {
      holonId,
      type,
      direction: direction || 'both',
    });
  }

  // ==================== Event Operations ====================

  /**
   * Submit an event to the SOM
   */
  async submitEvent<T extends EventType>(event: SubmitEventRequest<T>): Promise<APIResponse<EventResult>> {
    return this.request<EventResult>('POST', '/events', event);
  }

  /**
   * Get events for a holon
   */
  async getEvents(
    holonId: HolonID,
    eventTypes?: EventType[],
    since?: Date
  ): Promise<APIResponse<Event[]>> {
    return this.request<Event[]>('POST', '/events/query', {
      holonId,
      eventTypes,
      since: since?.toISOString(),
    });
  }

  // ==================== Temporal Operations ====================

  /**
   * Get a holon as it existed at a specific point in time
   */
  async getHolonAsOf(id: HolonID, timestamp: Date): Promise<APIResponse<Holon>> {
    return this.request<Holon>('POST', '/temporal/holons', {
      holonId: id,
      asOf: timestamp.toISOString(),
    });
  }

  /**
   * Get organization structure (org, positions, people, relationships)
   */
  async getOrgStructure(
    orgId: HolonID,
    asOf?: Date
  ): Promise<APIResponse<OrgStructure>> {
    const body: Record<string, unknown> = {
      organizationID: orgId,
    };
    if (asOf) body.asOfTimestamp = asOf.toISOString();

    return this.request<OrgStructure>(
      'POST',
      '/temporal/organizations/structure',
      body
    );
  }

  // ==================== Domain-Specific Operations ====================

  /**
   * Get all processes
   */
  async getProcesses(filters?: HolonFilters): Promise<APIResponse<Holon[]>> {
    return this.queryHolons(HolonType.Process, filters);
  }

  /**
   * Get all tasks for a position
   */
  async getTasksForPosition(
    positionId: HolonID,
    status?: string
  ): Promise<APIResponse<Holon[]>> {
    const filters: HolonFilters = {
      properties: { ownerId: positionId },
    };
    if (status) {
      filters.properties = { ...filters.properties, status };
    }
    return this.queryHolons(HolonType.Task, filters);
  }

  /**
   * Get all objectives under a Line of Effort
   */
  async getObjectivesForLOE(loeId: HolonID): Promise<APIResponse<Holon[]>> {
    // 1. Get all 'CONTAINS' relationships from the LOE
    const relResponse = await this.getRelationships(loeId, RelationshipType.CONTAINS, 'source');

    if (!relResponse.success || !relResponse.data) {
      return {
        success: false,
        error: relResponse.error
      };
    }

    // 2. Fetch all target holons (since we can't filter by type on the relationship itself)
    const targetIDs = relResponse.data.map(r => r.targetHolonID);

    if (targetIDs.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Fetch each Holon
    // Ideally use a bulk fetch if available, else parallel requests
    const holonPromises = targetIDs.map(id => this.getHolon(id));
    const responses = await Promise.all(holonPromises);

    // 4. Filter for success and specifically for Objectives
    const objectives = responses
      .filter(res => res.success && res.data && res.data.type === HolonType.Objective)
      .map(res => res.data as Holon);

    return {
      success: true,
      data: objectives
    };
  }

  /**
   * Get all documents (policies)
   */
  async getPolicies(filters?: HolonFilters): Promise<APIResponse<Holon[]>> {
    return this.queryHolons(HolonType.Document, {
      ...filters,
      properties: { ...filters?.properties, documentType: 'Policy' },
    });
  }

  // ==================== Health Check ====================

  /**
   * Check API health
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const latencyMs = Date.now() - start;
      return { healthy: response.ok, latencyMs };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }
}

/**
 * Create a SOM client instance
 */
export function createSOMClient(
  baseUrl?: string,
  options?: { headers?: Record<string, string>; includeCredentials?: boolean }
): SOMClient {
  // @ts-ignore
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SOM_API_URL : undefined;
  const url = baseUrl || envUrl || 'http://localhost:3000/api/v1';
  return new SOMClient(url, options);
}
