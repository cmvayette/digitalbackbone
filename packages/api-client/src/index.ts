/**
 * @som/api-client
 * Unified API client for all Tier-1 applications
 */

export { SOMClient } from './client';
export type { SOMClientOptions } from './client';
export { createSOMClient } from './factory';

export type {
  APIResponse,
  HolonFilters,
  PaginationOptions,
  SearchResult,
  OrgStructure,
  SubmitEventRequest,
  EventResult,
  OPAInput,
} from './client';

export { queryKeys, queryFns, staleTimes } from './hooks';
export { useExternalOrgData, type ExternalOrganization, type ExternalPosition, type ExternalPerson } from './useExternalOrgData';
export * from './useExternalProcessData';
export * from './hooks/useProcessEditor';
export * from './hooks/useProcessDetail';
export * from './useExternalPolicyData';
export * from './hooks/useStrategyComposer';
export * from './useStrategyData';
export * from './services/OPAClient';
