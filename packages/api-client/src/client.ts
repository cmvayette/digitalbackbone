import {
    Holon,
    HolonID,
    HolonType,
    Relationship,
    RelationshipType,
    Event,
    EventType,
    GovernanceConfig,
    Process
} from '@som/shared-types';

import type { OPAInput } from './services/OPAClient';
export type { OPAInput } from './services/OPAClient';

// ==================== Types ====================

export interface SOMClientOptions {
    authToken?: string;
    timeout?: number;
    headers?: Record<string, string>;
    mode?: 'mock' | 'real';
    includeCredentials?: boolean;
    authConfig?: any;
}

export interface APIResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata?: {
        timestamp: Date;
        requestId?: string;
        pagination?: {
            page: number;
            pageSize: number;
            total: number;
        };
    };
}

export interface PaginationOptions {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface HolonFilters {
    properties?: Record<string, any>;
    status?: string | string[];
    createdAfter?: Date;
    createdBefore?: Date;
    relationship?: {
        relatedTo: HolonID;
        type?: string;
    };
    ids?: HolonID[];
}

export interface SearchResult {
    id: HolonID;
    type: HolonType;
    name: string;
    description?: string;
    score: number;
    properties?: any; // Changed to any to allow flexible casting
    highlights?: Record<string, string[]>;
}

export interface OrgStructure {
    organization: Holon;
    subOrganizations: Holon[];
    positions: Holon[];
    assignments: any[]; // Todo: Define Assignment type
    relationships: Relationship[];
    asOfTimestamp: Date;
}

export interface SubmitEventRequest<T extends EventType = EventType> {
    type: T;
    payload: any;
    occurredAt?: Date; // Added occurredAt
    actor?: HolonID; // Added actor
    subjects?: HolonID[]; // Added subjects
    sourceSystem?: string; // Added sourceSystem
    timestamp?: Date;
    source?: string;
}

export interface EventResult {
    eventId: string;
    success: boolean;
    affectedHolons: HolonID[];
    error?: string;
}

// ==================== Interface ====================

export interface ISOMClient {
    setAuthToken(token: string): void;
    clearAuthToken(): void;
    login?(): Promise<void>;

    // Holons
    getHolon(id: HolonID): Promise<APIResponse<Holon>>;
    queryHolons(type: HolonType, filters?: HolonFilters, pagination?: PaginationOptions): Promise<APIResponse<Holon[]>>;
    search(query: string, types?: HolonType[], limit?: number): Promise<APIResponse<SearchResult[]>>;

    // Relationships
    getRelationships(holonId: HolonID, type?: RelationshipType, direction?: 'source' | 'target' | 'both'): Promise<APIResponse<Relationship[]>>;

    // Events
    submitEvent<T extends EventType>(event: any): Promise<APIResponse<EventResult>>;
    getEvents(holonId: HolonID, eventTypes?: EventType[], since?: Date): Promise<APIResponse<Event[]>>;

    // Temporal
    getHolonAsOf(id: HolonID, timestamp: Date): Promise<APIResponse<Holon>>;

    // Hierarchy
    getOrgStructure(orgId: HolonID, asOf?: Date): Promise<APIResponse<OrgStructure>>; // Added asOf

    // Domain Specific
    getProcesses(filters?: HolonFilters): Promise<APIResponse<Holon[]>>;
    getTasksForPosition(positionId: HolonID, status?: string): Promise<APIResponse<Holon[]>>;
    getObjectivesForLOE(loeId: HolonID): Promise<APIResponse<Holon[]>>;
    getPolicies(filters?: HolonFilters): Promise<APIResponse<Holon[]>>;

    // Governance
    getGovernanceConfig(): Promise<APIResponse<GovernanceConfig>>;
    updateGovernanceConfig(config: Partial<GovernanceConfig['properties']>): Promise<APIResponse<GovernanceConfig>>;

    // System
    healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
    checkAccess(input: OPAInput): Promise<boolean>;
}

// ==================== Implementation ====================

export class SOMClient implements ISOMClient {
    private baseUrl: string;
    private options: SOMClientOptions;

    constructor(baseUrl: string, options: SOMClientOptions = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.options = options;
    }

    setAuthToken(token: string): void {
        this.options.authToken = token;
    }

    clearAuthToken(): void {
        delete this.options.authToken;
    }

    async login(): Promise<void> {
        if (this.options.authConfig) {
            // Placeholder for login logic if needed
        }
    }

    private async fetch<T>(path: string, init?: RequestInit): Promise<APIResponse<T>> {
        const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(this.options.authToken ? { 'Authorization': `Bearer ${this.options.authToken}` } : {}),
            ...this.options.headers,
            ...init?.headers,
        };

        try {
            const response = await globalThis.fetch(url, {
                ...init,
                headers,
                credentials: this.options.includeCredentials ? 'include' : undefined
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    data: null as any,
                    error: {
                        code: response.status.toString(),
                        message: response.statusText,
                        details: data
                    }
                };
            }

            return {
                success: true,
                data: data.data || data, // Handle wrapped vs unwrapped responses
                metadata: data.metadata
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error.message
                }
            };
        }
    }

    async getHolon(id: HolonID): Promise<APIResponse<Holon>> {
        return this.fetch<Holon>(`/holons/${id}`);
    }

    async queryHolons(type: HolonType, filters?: HolonFilters, pagination?: PaginationOptions): Promise<APIResponse<Holon[]>> {
        const params = new URLSearchParams();
        params.append('type', type);
        if (filters?.status) params.append('status', String(filters.status));
        if (pagination?.page) params.append('page', String(pagination.page));
        if (pagination?.pageSize) params.append('pageSize', String(pagination.pageSize));

        return this.fetch<Holon[]>(`/holons?${params.toString()}`);
    }

    async search(query: string, types?: HolonType[], limit: number = 10): Promise<APIResponse<SearchResult[]>> {
        const params = new URLSearchParams({ q: query, limit: String(limit) });
        if (types) types.forEach(t => params.append('types', t));
        return this.fetch<SearchResult[]>(`/search?${params.toString()}`);
    }

    async getRelationships(holonId: HolonID, type?: RelationshipType, direction: 'source' | 'target' | 'both' = 'both'): Promise<APIResponse<Relationship[]>> {
        const params = new URLSearchParams({ direction });
        if (type) params.append('type', type);
        return this.fetch<Relationship[]>(`/holons/${holonId}/relationships?${params.toString()}`);
    }

    async submitEvent<T extends EventType>(event: any): Promise<APIResponse<EventResult>> {
        return this.fetch<EventResult>('/events', {
            method: 'POST',
            body: JSON.stringify(event)
        });
    }

    async getEvents(holonId: HolonID, eventTypes?: EventType[], since?: Date): Promise<APIResponse<Event[]>> {
        const params = new URLSearchParams();
        if (holonId) params.append('holonId', holonId);
        if (since) params.append('since', since.toISOString());
        return this.fetch<Event[]>('/events?${params.toString()}');
    }

    async getHolonAsOf(id: HolonID, timestamp: Date): Promise<APIResponse<Holon>> {
        return this.fetch<Holon>(`/holons/${id}?asOf=${timestamp.toISOString()}`);
    }

    async getOrgStructure(orgId: HolonID, asOf?: Date): Promise<APIResponse<OrgStructure>> {
        const params = new URLSearchParams();
        if (asOf) params.append('asOf', asOf.toISOString());
        return this.fetch<OrgStructure>(`/organization/${orgId}/structure?${params.toString()}`);
    }

    async getProcesses(filters?: HolonFilters): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Process, filters);
    }

    async getTasksForPosition(positionId: HolonID, status?: string): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Task, { properties: { ownerId: positionId, status } });
    }

    async getObjectivesForLOE(loeId: HolonID): Promise<APIResponse<Holon[]>> {
        const params = new URLSearchParams({ loeId });
        return this.fetch<Holon[]>(`/objectives?${params.toString()}`);
    }

    async getPolicies(filters?: HolonFilters): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Document, { ...filters, properties: { ...filters?.properties, documentType: 'Policy' } });
    }

    async getGovernanceConfig(): Promise<APIResponse<GovernanceConfig>> {
        return this.fetch<GovernanceConfig>('/governance/config');
    }

    async updateGovernanceConfig(config: Partial<GovernanceConfig['properties']>): Promise<APIResponse<GovernanceConfig>> {
        return this.fetch<GovernanceConfig>('/governance/config', {
            method: 'PATCH',
            body: JSON.stringify(config)
        });
    }

    async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
    async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
        const start = Date.now();
        try {
            await this.fetch('/health');
            return { healthy: true, latencyMs: Date.now() - start };
        } catch {
            return { healthy: false, latencyMs: -1 };
        }
    }

    async checkAccess(input: OPAInput): Promise<boolean> {
        const res = await this.fetch<{ allow: boolean }>('/auth/check', {
            method: 'POST',
            body: JSON.stringify(input)
        });
        return res.success && res.data.allow;
    }
}
