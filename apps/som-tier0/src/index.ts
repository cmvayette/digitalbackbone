/**
 * Semantic Operating Model - Main Entry Point
 * Tier-0 authoritative conceptual representation for NSW
 */

export * from '@som/shared-types';
export * from './core/holon-registry';
export * from './event-store';
export * from './document-registry';
export * from './constraint-engine';
export * from './relationship-registry';
export * from './state-projection';

// Re-export graph-store, but explicitly handle HolonQueryFilters conflict
// Use the graph-store version as it's more comprehensive
export {
  GraphStore,
  HolonQueryFilters as GraphStoreQueryFilters,
  RelationshipQueryFilters,
  GraphPattern,
  HolonPattern,
  RelationshipPattern,
  PatternMatch,
  createGraphStore
} from './graph-store';

export * from './query';
export * from './person-management';
export * from './measure-lens-engine';
export * from './schema-versioning';
export * from './monitoring';
export { APIRoutes } from './api/routes';
export {
  APIRequest,
  APIResponse,
  ValidationError as APIValidationError,
  ComponentHealth as APIComponentHealth
} from './api/api-types';
