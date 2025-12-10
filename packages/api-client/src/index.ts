/**
 * @som/api-client
 * Unified API client for all Tier-1 applications
 */

export { SOMClient, createSOMClient } from './client';
export type {
  APIResponse,
  HolonFilters,
  PaginationOptions,
  SearchResult,
  OrgStructure,
  SubmitEventRequest,
  EventResult,
} from './client';

export { queryKeys, queryFns, staleTimes } from './hooks';
export { useExternalOrgData, type ExternalOrganization, type ExternalPosition } from './useExternalOrgData';
export * from './useExternalProcessData';
export * from './hooks/useProcessEditor';
export * from './useExternalPolicyData';
export * from './hooks/useStrategyComposer';
export * from './useStrategyData';
