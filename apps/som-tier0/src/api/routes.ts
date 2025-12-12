/**
 * API Routes for Tier-1 System Integration
 * Defines all REST API endpoints
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
import { HolonType, HolonID } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { Event } from '@som/shared-types';
import {
  APIRequest,
  APIResponse,
  QueryHolonsRequest,
  QueryRelationshipsRequest,
  TemporalQueryRequest,
  SubmitEventRequest,
  BatchSubmitEventsRequest,
  QueryEventsRequest,
  OrganizationStructureRequest,
  CausalChainRequest,
  PatternMatchRequest,
  SchemaProposalRequest,
  SchemaVersionRequest,
  ExternalDataSubmissionRequest,
  IDMappingRequest,
  HealthCheckResponse,
  UnifiedSearchRequest,
} from './api-types';

/**
 * API Routes Handler
 * Implements all API endpoints
 */
export class APIRoutes {
  private queryLayer: QueryLayer;
  private eventStore: EventStore;
  private semanticAccessLayer: SemanticAccessLayer;
  private schemaVersioning: SchemaVersioningEngine;
  private governance: GovernanceEngine;
  private monitoring: MonitoringService;
  private holonRegistry: HolonRegistry;
  private relationshipRegistry: RelationshipRegistry;
  private constraintEngine: ConstraintEngine;
  private documentRegistry: DocumentRegistry;
  private projectionEngine: StateProjectionEngine;

  private calendarIndex: CalendarIndex;
  private availabilityService: AvailabilityService;

  constructor(
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
    this.queryLayer = queryLayer;
    this.eventStore = eventStore;
    this.semanticAccessLayer = semanticAccessLayer;
    this.schemaVersioning = schemaVersioning;
    this.governance = governance;
    this.monitoring = monitoring;
    this.holonRegistry = holonRegistry;
    this.relationshipRegistry = relationshipRegistry;
    this.constraintEngine = constraintEngine;
    this.documentRegistry = documentRegistry;
    this.projectionEngine = projectionEngine;

    this.calendarIndex = calendarIndex;
    this.availabilityService = availabilityService;
  }

  // ==================== Holon Query Endpoints ====================

  /**
   * GET /api/v1/holons/:type
   * Query holons by type with optional filters
   */
  async queryHolons(request: APIRequest<QueryHolonsRequest>): Promise<APIResponse> {
    const { type, filters, includeRelationships, relationshipTypes, pagination } = request.body!;

    const result = await this.queryLayer.queryCurrentHolons(request.user, type, {
      filters,
      includeRelationships,
      relationshipTypes,
    });

    // Apply pagination
    let paginatedData = result.data;
    const totalCount = result.data.length;

    if (pagination) {
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      paginatedData = result.data.slice(startIndex, endIndex);
    }

    return {
      success: true,
      data: paginatedData,
      metadata: {
        filtered: result.filtered,
        totalCount,
        pageSize: pagination?.pageSize,
        page: pagination?.page,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/holons/:id
   * Get a specific holon by ID
   */
  async getHolon(request: APIRequest): Promise<APIResponse> {
    const holonId = request.params!.id as HolonID;

    const result = await this.queryLayer.getHolon(holonId, { user: request.user });

    if (!result.data) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Holon ${holonId} not found or access denied`,
        },
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/search
   * Unified search across multiple holon types
   */
  async unifiedSearch(request: APIRequest<UnifiedSearchRequest>): Promise<APIResponse> {
    // Extract parameters from query string if GET, or body if POST
    const query = request.query?.q || request.body?.query;
    const limit = request.query?.limit ? parseInt(request.query.limit) : (request.body?.limit || 20);
    const typesStr = request.query?.types;

    if (!query) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Query parameter "q" is required'
        }
      };
    }

    let types: HolonType[] | undefined;
    if (typesStr) {
      types = typesStr.split(',').map(t => t.trim()) as HolonType[];
    } else if (request.body?.types) {
      types = request.body.types;
    }

    const result = await this.queryLayer.unifiedSearch(
      request.user,
      query,
      types,
      limit
    );

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        totalCount: result.data.length,
        timestamp: new Date()
      }
    };
  }

  // ==================== Relationship Query Endpoints ====================

  /**
   * GET /api/v1/relationships/:type
   * Query relationships by type with optional filters
   */
  async queryRelationships(request: APIRequest<QueryRelationshipsRequest>): Promise<APIResponse> {
    const { type, sourceHolonID, targetHolonID, filters, pagination } = request.body!;

    const queryFilters = {
      ...filters,
      ...(sourceHolonID && { sourceHolonID }),
      ...(targetHolonID && { targetHolonID }),
    };

    const result = await this.queryLayer.queryCurrentRelationships(request.user, type, queryFilters);

    // Apply pagination
    let paginatedData = result.data;
    const totalCount = result.data.length;

    if (pagination) {
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      paginatedData = result.data.slice(startIndex, endIndex);
    }

    return {
      success: true,
      data: paginatedData,
      metadata: {
        filtered: result.filtered,
        totalCount,
        pageSize: pagination?.pageSize,
        page: pagination?.page,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/holons/:id/relationships
   * Get relationships for a specific holon
   */
  async getHolonRelationships(request: APIRequest): Promise<APIResponse> {
    const holonId = request.params!.id as HolonID;
    const relationshipType = request.query?.type as RelationshipType | undefined;
    const direction = (request.query?.direction as 'outgoing' | 'incoming' | 'both') || 'both';

    const result = await this.queryLayer.traverseRelationships(
      request.user,
      holonId,
      relationshipType,
      direction
    );

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/holons/:id/connected
   * Get connected holons from a starting holon
   */
  async getConnectedHolons(request: APIRequest): Promise<APIResponse> {
    const holonId = request.params!.id as HolonID;
    const relationshipType = request.query?.type as RelationshipType | undefined;
    const direction = (request.query?.direction as 'outgoing' | 'incoming' | 'both') || 'both';

    const result = await this.queryLayer.getConnectedHolons(
      request.user,
      holonId,
      relationshipType,
      direction
    );

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  // ==================== Event Submission Endpoints ====================

  /**
   * POST /api/v1/events
   * Submit a single event
   */
  async submitEvent(request: APIRequest<SubmitEventRequest>): Promise<APIResponse> {
    const { eventType, subjects, payload, sourceSystem, sourceDocument, validityWindow, causalLinks } = request.body!;

    // Convert ISO timestamps to Date objects
    const validityWindowDates = validityWindow ? {
      start: new Date(validityWindow.start),
      end: new Date(validityWindow.end),
    } : undefined;

    // Create event
    const event: Event = {
      id: this.generateEventID(),
      type: eventType,
      occurredAt: new Date(),
      recordedAt: new Date(),
      actor: request.user.userId,
      subjects,
      payload: payload as any, // Cast generic payload that will be validated by runtime
      sourceSystem,
      sourceDocument,
      validityWindow: validityWindowDates,
      causalLinks: causalLinks || {},
    } as Event;

    // Validate event
    const validationResult = await this.constraintEngine.validateEvent(event);

    if (!validationResult.valid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Event validation failed',
          validationErrors: validationResult.errors?.map(e => ({
            field: 'event',
            message: e.message,
            constraint: e.violatedRule,
          })),
        },
      };
    }

    // Submit event
    const eventId = await this.eventStore.submitEvent(event);

    // Provide real-time consistency for read-your-writes
    this.projectionEngine.applyNewEvent(event);

    return {
      success: true,
      data: {
        eventId,
        event,
      },
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * POST /api/v1/events/batch
   * Submit multiple events in a batch
   */
  async submitEventsBatch(request: APIRequest<BatchSubmitEventsRequest>): Promise<APIResponse> {
    const { events, atomic = true } = request.body!;

    const results: Array<{ success: boolean; eventId?: string; error?: string }> = [];
    const submittedEvents: Event[] = [];

    for (const eventReq of events) {
      try {
        // Convert ISO timestamps to Date objects
        const validityWindowDates = eventReq.validityWindow ? {
          start: new Date(eventReq.validityWindow.start),
          end: new Date(eventReq.validityWindow.end),
        } : undefined;

        // Create event
        const event: Event = {
          id: this.generateEventID(),
          type: eventReq.eventType,
          occurredAt: new Date(),
          recordedAt: new Date(),
          actor: request.user.userId,
          subjects: eventReq.subjects,
          payload: eventReq.payload as any,
          sourceSystem: eventReq.sourceSystem,
          sourceDocument: eventReq.sourceDocument,
          validityWindow: validityWindowDates,
          causalLinks: eventReq.causalLinks || {},
        } as Event;

        // Validate event
        const validationResult = await this.constraintEngine.validateEvent(event);

        if (!validationResult.valid) {
          const error = `Validation failed: ${validationResult.errors?.map(e => e.message).join(', ')}`;

          if (atomic) {
            // Atomic mode: fail entire batch
            return {
              success: false,
              error: {
                code: 'BATCH_VALIDATION_ERROR',
                message: 'Batch validation failed (atomic mode)',
                details: { failedEvent: event, validationErrors: validationResult.errors },
              },
            };
          }

          results.push({ success: false, error });
          continue;
        }

        // Submit event
        const eventId = await this.eventStore.submitEvent(event);
        submittedEvents.push(event);
        results.push({ success: true, eventId });
      } catch (error: any) {
        if (atomic) {
          // Atomic mode: fail entire batch
          return {
            success: false,
            error: {
              code: 'BATCH_SUBMISSION_ERROR',
              message: 'Batch submission failed (atomic mode)',
              details: error.message,
            },
          };
        }

        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: successCount > 0,
      data: {
        results,
        summary: {
          total: events.length,
          succeeded: successCount,
          failed: failureCount,
        },
      },
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  // ==================== Event Query Endpoints ====================

  /**
   * GET /api/v1/events
   * Query events with filters
   */
  async queryEvents(request: APIRequest<QueryEventsRequest>): Promise<APIResponse> {
    const { holonID, eventType, timeRange, pagination } = request.body!;

    let result;

    const timeRangeDates = timeRange ? {
      start: new Date(timeRange.start),
      end: new Date(timeRange.end),
    } : undefined;

    if (holonID) {
      result = await this.queryLayer.findEvents({
        subjects: [holonID],
        ...(timeRangeDates && {
          startTime: timeRangeDates.start,
          endTime: timeRangeDates.end
        })
      }, { user: request.user });
    } else if (eventType) {
      result = await this.queryLayer.findEvents({
        type: [eventType],
        ...(timeRangeDates && {
          startTime: timeRangeDates.start,
          endTime: timeRangeDates.end
        })
      }, { user: request.user });
    } else if (timeRange) {
      result = await this.queryLayer.findEvents({
        startTime: timeRangeDates!.start,
        endTime: timeRangeDates!.end
      }, { user: request.user });
    } else {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Must specify holonID, eventType, or timeRange',
        },
      };
    }

    // Apply pagination
    let paginatedData = result.data;
    const totalCount = result.data.length;

    if (pagination) {
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      paginatedData = result.data.slice(startIndex, endIndex);
    }

    return {
      success: true,
      data: paginatedData,
      metadata: {
        filtered: result.filtered,
        totalCount,
        pageSize: pagination?.pageSize,
        page: pagination?.page,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/events/:id
   * Get a specific event by ID
   */
  async getEvent(request: APIRequest): Promise<APIResponse> {
    const eventId = request.params!.id;
    const event = await this.eventStore.getEvent(eventId);

    if (!event) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Event ${eventId} not found`,
        },
      };
    }

    // Check access control
    const accessDecision = await this.queryLayer['accessControl'].canAccessEvent(request.user, event);

    if (!accessDecision.allowed) {
      return {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this event',
        },
      };
    }

    return {
      success: true,
      data: event,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  // ==================== Temporal Query Endpoints ====================

  /**
   * POST /api/v1/temporal/holons
   * Query holons as of a specific timestamp
   */
  async queryHolonsAsOf(request: APIRequest<TemporalQueryRequest>): Promise<APIResponse> {
    const { type, asOfTimestamp, filters, includeRelationships, pagination } = request.body!;

    const timestamp = new Date(asOfTimestamp);

    const result = await this.queryLayer.queryHolonsAsOf(request.user, type as HolonType, {
      asOfTimestamp: timestamp,
      filters,
      includeRelationships,
    });

    // Apply pagination
    let paginatedData = result.data;
    const totalCount = result.data.length;

    if (pagination) {
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      paginatedData = result.data.slice(startIndex, endIndex);
    }

    return {
      success: true,
      data: paginatedData,
      metadata: {
        filtered: result.filtered,
        totalCount,
        pageSize: pagination?.pageSize,
        page: pagination?.page,
        timestamp: new Date(),
      },
    };
  }

  /**
   * POST /api/v1/temporal/relationships
   * Query relationships as of a specific timestamp
   */
  async queryRelationshipsAsOf(request: APIRequest<TemporalQueryRequest>): Promise<APIResponse> {
    const { type, asOfTimestamp, filters, pagination } = request.body!;

    const timestamp = new Date(asOfTimestamp);

    const result = await this.queryLayer.queryRelationshipsAsOf(request.user, type as RelationshipType, {
      asOfTimestamp: timestamp,
      filters,
    });

    // Apply pagination
    let paginatedData = result.data;
    const totalCount = result.data.length;

    if (pagination) {
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      paginatedData = result.data.slice(startIndex, endIndex);
    }

    return {
      success: true,
      data: paginatedData,
      metadata: {
        filtered: result.filtered,
        totalCount,
        pageSize: pagination?.pageSize,
        page: pagination?.page,
        timestamp: new Date(),
      },
    };
  }

  /**
   * POST /api/v1/temporal/holons/:id
   * Get a holon's state as of a specific timestamp
   */
  async getHolonAsOf(request: APIRequest): Promise<APIResponse> {
    const holonId = request.params!.id as HolonID;
    const asOfTimestamp = request.query!.asOfTimestamp;

    if (!asOfTimestamp) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'asOfTimestamp query parameter is required',
        },
      };
    }

    const timestamp = new Date(asOfTimestamp);

    const result = await this.queryLayer.getHolon(holonId, {
      user: request.user,
      asOf: timestamp
    });

    if (!result.data) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Holon ${holonId} not found at timestamp ${asOfTimestamp} or access denied`,
        },
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  /**
   * POST /api/v1/temporal/organizations/:id/structure
   * Get organizational structure as of a specific timestamp
   */
  async getOrganizationStructureAsOf(request: APIRequest<OrganizationStructureRequest>): Promise<APIResponse> {
    const { organizationID, asOfTimestamp, includeSubOrganizations = true } = request.body!;

    const timestamp = asOfTimestamp ? new Date(asOfTimestamp) : new Date();

    const result = await this.queryLayer.getOrganizationStructureAsOf(
      request.user,
      organizationID,
      timestamp
    );

    if (!result.data) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Organization ${organizationID} not found at timestamp ${asOfTimestamp} or access denied`,
        },
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/events/:id/causal-chain
   * Trace causal chain for an event
   */
  async traceCausalChain(request: APIRequest<CausalChainRequest>): Promise<APIResponse> {
    const { eventID } = request.body!;

    const result = await this.queryLayer.analyzeCausality(eventID, { user: request.user });

    if (!result.data) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Event ${eventID} not found or access denied`,
        },
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/holons/:id/history
   * Get event history for a holon
   */
  async getHolonHistory(request: APIRequest): Promise<APIResponse> {
    const holonId = request.params!.id as HolonID;
    const startTime = request.query?.startTime ? new Date(request.query.startTime) : undefined;
    const endTime = request.query?.endTime ? new Date(request.query.endTime) : undefined;

    const timeRange = startTime && endTime ? { start: startTime, end: endTime } : undefined;

    const result = await this.queryLayer.getHolonHistory(holonId, {
      user: request.user,
      timeRange
    });

    return {
      success: true,
      data: result.data,
      metadata: {
        filtered: result.filtered,
        timestamp: new Date(),
      },
    };
  }

  // ==================== Pattern Matching Endpoints ====================

  /**
   * POST /api/v1/patterns/match
   * Match graph patterns
   */
  async matchPattern(request: APIRequest<PatternMatchRequest>): Promise<APIResponse> {
    const { pattern, maxResults = 100 } = request.body!;

    // Convert pattern to GraphPattern format
    const graphPattern = {
      holonPatterns: pattern.holonTypes?.map(type => ({ type })) || [],
      relationshipPatterns: pattern.relationshipTypes?.map(type => ({ type })) || [],
    };

    const result = await this.queryLayer.matchPattern(request.user, graphPattern);

    // Limit results
    const limitedData = result.data.slice(0, maxResults);

    return {
      success: true,
      data: limitedData,
      metadata: {
        timestamp: new Date()
      }
    };
  }

  // ==================== Calendar Endpoints ====================

  /**
   * GET /api/v1/calendar/events
   * Query calendar events by time range
   */
  async queryCalendarEvents(request: APIRequest): Promise<APIResponse> {
    const startStr = request.query?.start;
    const endStr = request.query?.end;

    if (!startStr || !endStr) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Start and end query parameters are required'
        }
      };
    }

    const start = new Date(startStr);
    const end = new Date(endStr);
    const classification = request.query?.classification;
    const type = request.query?.type;
    const participantId = request.query?.participantId;

    const events = this.calendarIndex.queryEvents(start, end, {
      classification,
      type,
      participantId
    });

    return {
      success: true,
      data: events,
      metadata: {
        totalCount: events.length,
        timestamp: new Date()
      }
    };
  }


  // ==================== Schema Management Endpoints ====================

  /**
   * POST /api/v1/schema/proposals
   * Submit a schema change proposal
   */
  async submitSchemaProposal(request: APIRequest<SchemaProposalRequest>): Promise<APIResponse> {
    const { proposalType, name, description, definition, referenceDocuments, exampleUseCases, impactAnalysis } = request.body!;

    // Map API proposal type to internal proposal type
    const typeMapping: Record<string, any> = {
      'holon_type': 'add_holon_type',
      'relationship_type': 'add_relationship_type',
      'constraint': 'add_constraint',
      'measure': 'add_measure',
      'lens': 'add_lens'
    };

    const internalProposalType = typeMapping[proposalType] || 'add_holon_type';

    // Create default impact analysis if string provided
    const impactAnalysisObj = typeof impactAnalysis === 'string' ? {
      affectedHolonTypes: [],
      affectedRelationshipTypes: [],
      affectedConstraints: [],
      estimatedDataMigrationRequired: false,
      breakingChange: false,
      riskLevel: 'low' as const,
      mitigationStrategies: [],
      analysisDate: new Date(),
      analysisNotes: impactAnalysis
    } : undefined;

    const proposal = this.governance.createProposal({
      proposalType: internalProposalType,
      referenceDocuments,
      exampleUseCases,
      impactAnalysis: impactAnalysisObj,
      // Map generic definition to specific type definition based on proposal type
      holonTypeDefinition: internalProposalType === 'add_holon_type' ? definition : undefined,
      relationshipTypeDefinition: internalProposalType === 'add_relationship_type' ? definition : undefined,
      proposedBy: request.user.userId,
    });

    return {
      success: true,
      data: proposal,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/schema/versions
   * Get schema versions
   */
  async getSchemaVersions(request: APIRequest<SchemaVersionRequest>): Promise<APIResponse> {
    const { version, includeDeprecated = false } = request.body || {};

    let versions;
    if (version) {
      const v = this.schemaVersioning.getVersion(version);
      versions = v ? [v] : [];
    } else {
      versions = this.schemaVersioning.getAllVersions();
    }

    return {
      success: true,
      data: versions,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/schema/current
   * Get current schema version
   */
  async getCurrentSchema(request: APIRequest): Promise<APIResponse> {
    const currentSchema = this.schemaVersioning.getCurrentVersion();

    return {
      success: true,
      data: currentSchema,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  // ==================== External System Integration Endpoints ====================

  /**
   * POST /api/v1/external/data
   * Submit external system data
   */
  async submitExternalData(request: APIRequest<ExternalDataSubmissionRequest>): Promise<APIResponse> {
    const { externalSystem, externalID, dataType, payload, sourceDocument } = request.body!;

    const result = await this.semanticAccessLayer.submitExternalData({
      externalSystem,
      externalID,
      dataType,
      payload,
      timestamp: new Date(),
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'TRANSFORMATION_ERROR',
          message: 'External data transformation failed',
          details: {
            errors: result.errors,
            conflicts: result.conflicts,
          },
        },
      };
    }

    return {
      success: true,
      data: {
        holonID: result.holonID,
        events: result.events,
      },
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/external/mappings
   * Query ID mappings
   */
  async queryIDMapping(request: APIRequest<IDMappingRequest>): Promise<APIResponse> {
    const { externalSystem, externalID } = request.body!;

    const holonID = this.semanticAccessLayer.getHolonID(externalSystem, externalID);

    if (!holonID) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No mapping found for ${externalSystem}:${externalID}`,
        },
      };
    }

    return {
      success: true,
      data: {
        externalSystem,
        externalID,
        holonID,
      },
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  // ==================== System Health Endpoints ====================

  /**
   * GET /api/v1/health
   * Get system health status
   */
  async getHealth(request: APIRequest): Promise<APIResponse<HealthCheckResponse>> {
    const eventMetrics = this.monitoring.getEventMetrics();

    const health: HealthCheckResponse = {
      status: 'healthy',
      version: '0.1.0',
      components: {
        eventStore: {
          status: 'healthy',
          latency: eventMetrics.averageProcessingLatency,
        },
        graphStore: {
          status: 'healthy',
        },
        constraintEngine: {
          status: 'healthy',
        },
        documentRegistry: {
          status: 'healthy',
        },
      },
      timestamp: new Date(),
    };

    // Check for degraded status
    if (eventMetrics.validationFailureRate > 0.1) {
      health.status = 'degraded';
      health.components.constraintEngine.status = 'degraded';
      health.components.constraintEngine.message = 'High validation failure rate';
    }

    return {
      success: true,
      data: health,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  /**
   * GET /api/v1/metrics
   * Get system metrics
   */
  async getMetrics(request: APIRequest): Promise<APIResponse> {
    const eventMetrics = this.monitoring.getEventMetrics();

    return {
      success: true,
      data: {
        eventMetrics,
      },
      metadata: {
        timestamp: new Date(),
      },
    };
  }


  // ==================== Availability Endpoints ====================

  /**
   * POST /api/v1/availability/check
   * Check availability for a resource
   */
  async checkAvailability(request: APIRequest): Promise<APIResponse> {
    const { resourceId, start, end } = request.body!;

    if (!resourceId || !start || !end) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required parameters: resourceId, start, end',
        },
      };
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const result = await this.availabilityService.checkAvailability(resourceId, startDate, endDate);

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date(),
      },
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Generate a unique event ID
   */
  private generateEventID(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
