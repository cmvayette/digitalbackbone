/**
 * React hooks for SOM API Client
 * These hooks integrate with React Query for data fetching
 */

// Note: These hooks are designed to work with @tanstack/react-query
// Apps should install react-query and wrap their app with QueryClientProvider

import type { HolonID, Holon, Relationship } from '@som/shared-types';
import * as SharedTypes from '@som/shared-types';
import { SOMClient, HolonFilters, SearchResult, OrgStructure } from './client';

/**
 * Query keys for React Query caching
 */
export const queryKeys = {
  holon: (id: HolonID) => ['holon', id] as const,
  holons: (type: SharedTypes.HolonType, filters?: HolonFilters) =>
    ['holons', type, filters] as const,
  search: (query: string, types?: SharedTypes.HolonType[]) =>
    ['search', query, types] as const,
  relationships: (holonId: HolonID, type?: SharedTypes.RelationshipType) =>
    ['relationships', holonId, type] as const,
  orgStructure: (orgId: HolonID, asOf?: Date) =>
    ['orgStructure', orgId, asOf?.toISOString()] as const,
  tasks: (positionId: HolonID, status?: string) =>
    ['tasks', positionId, status] as const,
  processes: (filters?: HolonFilters) => ['processes', filters] as const,
  policies: (filters?: HolonFilters) => ['policies', filters] as const,
  objectives: (loeId: HolonID) => ['objectives', loeId] as const,
};

/**
 * Query function factories for React Query
 * Use these with useQuery from @tanstack/react-query
 *
 * @example
 * import { useQuery } from '@tanstack/react-query';
 * import { queryKeys, queryFns } from '@som/api-client';
 *
 * function MyComponent() {
 *   const client = useSOMClient();
 *
 *   const { data, isLoading } = useQuery({
 *     queryKey: queryKeys.holon('org-123'),
 *     queryFn: () => queryFns.getHolon(client, 'org-123'),
 *   });
 * }
 */
export const queryFns = {
  getHolon: async (client: SOMClient, id: HolonID): Promise<Holon | null> => {
    const response = await client.getHolon(id);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || null;
  },

  queryHolons: async (
    client: SOMClient,
    type: SharedTypes.HolonType,
    filters?: HolonFilters
  ): Promise<Holon[]> => {
    const response = await client.queryHolons(type, filters);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },

  search: async (
    client: SOMClient,
    query: string,
    types?: SharedTypes.HolonType[]
  ): Promise<SearchResult[]> => {
    const response = await client.search(query, types);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },

  getRelationships: async (
    client: SOMClient,
    holonId: HolonID,
    type?: SharedTypes.RelationshipType
  ): Promise<Relationship[]> => {
    const response = await client.getRelationships(holonId, type);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },

  getOrgStructure: async (
    client: SOMClient,
    orgId: HolonID,
    asOf?: Date
  ): Promise<OrgStructure | null> => {
    const response = await client.getOrgStructure(orgId, asOf);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || null;
  },

  getTasks: async (
    client: SOMClient,
    positionId: HolonID,
    status?: string
  ): Promise<Holon[]> => {
    const response = await client.getTasksForPosition(positionId, status);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },

  getProcesses: async (
    client: SOMClient,
    filters?: HolonFilters
  ): Promise<Holon[]> => {
    const response = await client.getProcesses(filters);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },

  getPolicies: async (
    client: SOMClient,
    filters?: HolonFilters
  ): Promise<Holon[]> => {
    const response = await client.getPolicies(filters);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },

  getObjectivesForLOE: async (
    client: SOMClient,
    loeId: HolonID
  ): Promise<Holon[]> => {
    const response = await client.getObjectivesForLOE(loeId);
    if (!response.success) throw new Error(response.error?.message);
    return response.data || [];
  },
};

/**
 * Default stale times for different query types (in milliseconds)
 */
export const staleTimes = {
  holon: 5 * 60 * 1000, // 5 minutes - holons change infrequently
  search: 30 * 1000, // 30 seconds - search results can change
  relationships: 5 * 60 * 1000, // 5 minutes
  orgStructure: 5 * 60 * 1000, // 5 minutes
  tasks: 1 * 60 * 1000, // 1 minute - tasks change more frequently
  processes: 10 * 60 * 1000, // 10 minutes - processes rarely change
  policies: 10 * 60 * 1000, // 10 minutes - policies rarely change
};
