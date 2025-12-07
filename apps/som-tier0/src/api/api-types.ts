/**
 * API Types and Request/Response Interfaces
 */

import { HolonType, HolonID, Timestamp } from '@som/shared-types';
import { RelationshipType, RelationshipID } from '@som/shared-types';
import { EventType, EventID } from '@som/shared-types';
import { UserContext } from '../access-control';

/**
 * API Request with user context
 */
export interface APIRequest<T = any> {
  user: UserContext;
  body?: T;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * API Response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

/**
 * API Error
 */
export interface APIError {
  code: string;
  message: string;
  details?: any;
  validationErrors?: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  constraint?: string;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  filtered?: boolean; // True if results were filtered by access control
  totalCount?: number;
  pageSize?: number;
  page?: number;
  timestamp: Timestamp;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Query holon request
 */
export interface QueryHolonsRequest {
  type: HolonType;
  filters?: Record<string, any>;
  includeRelationships?: boolean;
  relationshipTypes?: RelationshipType[];
  pagination?: PaginationParams;
}

/**
 * Query relationships request
 */
export interface QueryRelationshipsRequest {
  type: RelationshipType;
  sourceHolonID?: HolonID;
  targetHolonID?: HolonID;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

/**
 * Temporal query request
 */
export interface TemporalQueryRequest {
  type: HolonType | RelationshipType;
  asOfTimestamp: string; // ISO 8601 timestamp
  filters?: Record<string, any>;
  includeRelationships?: boolean;
  pagination?: PaginationParams;
}

/**
 * Event submission request
 */
export interface SubmitEventRequest {
  eventType: EventType;
  subjects: HolonID[];
  payload: Record<string, any>;
  sourceSystem: string;
  sourceDocument?: string;
  validityWindow?: {
    start: string; // ISO 8601 timestamp
    end: string; // ISO 8601 timestamp
  };
  causalLinks?: {
    precededBy?: EventID[];
    causedBy?: EventID[];
    groupedWith?: EventID[];
  };
}

/**
 * Batch event submission request
 */
export interface BatchSubmitEventsRequest {
  events: SubmitEventRequest[];
  atomic?: boolean; // If true, all events must succeed or all fail
}

/**
 * Event query request
 */
export interface QueryEventsRequest {
  holonID?: HolonID;
  eventType?: EventType;
  timeRange?: {
    start: string; // ISO 8601 timestamp
    end: string; // ISO 8601 timestamp
  };
  pagination?: PaginationParams;
}

/**
 * Organizational structure query request
 */
export interface OrganizationStructureRequest {
  organizationID: HolonID;
  asOfTimestamp?: string; // ISO 8601 timestamp
  includeSubOrganizations?: boolean;
  maxDepth?: number;
}

/**
 * Causal chain query request
 */
export interface CausalChainRequest {
  eventID: EventID;
  maxDepth?: number;
}

/**
 * Graph pattern matching request
 */
export interface PatternMatchRequest {
  pattern: {
    holonTypes?: HolonType[];
    relationshipTypes?: RelationshipType[];
    constraints?: Record<string, any>;
  };
  maxResults?: number;
}

/**
 * Schema proposal request
 */
export interface SchemaProposalRequest {
  proposalType: 'holon_type' | 'relationship_type' | 'constraint' | 'measure' | 'lens';
  name: string;
  description: string;
  definition: any;
  referenceDocuments: string[];
  exampleUseCases: string[];
  impactAnalysis?: string;
}

/**
 * Schema version query request
 */
export interface SchemaVersionRequest {
  version?: string;
  includeDeprecated?: boolean;
}

/**
 * External data submission request
 */
export interface ExternalDataSubmissionRequest {
  externalSystem: string;
  externalID: string;
  dataType: string;
  payload: Record<string, any>;
  sourceDocument?: string;
}

/**
 * ID mapping query request
 */
export interface IDMappingRequest {
  externalSystem: string;
  externalID: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  components: {
    eventStore: ComponentHealth;
    graphStore: ComponentHealth;
    constraintEngine: ComponentHealth;
    documentRegistry: ComponentHealth;
  };
  timestamp: Timestamp;
}

/**
 * Component health status
 */
export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  latency?: number; // milliseconds
}
