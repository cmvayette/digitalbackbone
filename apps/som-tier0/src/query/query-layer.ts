/**
 * Unified Query Layer for the Semantic Operating Model
 * Integrates current state, temporal, pattern matching, and access control
 */

import { Holon, HolonID, HolonType, Timestamp } from '@som/shared-types';
import { Relationship, RelationshipID, RelationshipType } from '@som/shared-types';
import { Event, EventID, EventType } from '@som/shared-types';
import { TemporalQueryEngine, OrganizationalStructure, CausalChain, EventHistory } from './temporal-query-engine';
import { GraphStore, HolonQueryFilters, RelationshipQueryFilters, GraphPattern, PatternMatch } from '../graph-store';
import { AccessControlEngine, UserContext } from '../access-control';
import { IEventStore as EventStore } from '../event-store';

/**
 * Query options for current state queries
 */
export interface CurrentStateQueryOptions {
  filters?: HolonQueryFilters;
  includeRelationships?: boolean;
  relationshipTypes?: RelationshipType[];
}

/**
 * Query options for temporal queries
 */
export interface TemporalQueryOptions {
  asOfTimestamp: Timestamp;
  filters?: Record<string, any>;
  includeRelationships?: boolean;
}

/**
 * Query options for time-range queries
 */
export interface TimeRangeQueryOptions {
  startTime: Timestamp;
  endTime: Timestamp;
  eventTypes?: EventType[];
  holonTypes?: HolonType[];
}

/**
 * Query result with access control applied
 */
export interface QueryResult<T> {
  data: T;
  filtered: boolean; // True if some results were filtered due to access control
}

/**
 * Unified Query Layer
 * Provides a single interface for all query operations with integrated access control
 */
export class QueryLayer {
  private temporalQueryEngine: TemporalQueryEngine;
  private graphStore: GraphStore;
  private accessControl: AccessControlEngine;
  private eventStore: EventStore;

  constructor(
    temporalQueryEngine: TemporalQueryEngine,
    graphStore: GraphStore,
    accessControl: AccessControlEngine,
    eventStore: EventStore
  ) {
    this.temporalQueryEngine = temporalQueryEngine;
    this.graphStore = graphStore;
    this.accessControl = accessControl;
    this.eventStore = eventStore;
  }

  /**
   * Query current state holons by type with filtering and access control
   */
  queryCurrentHolons(
    user: UserContext,
    type: HolonType,
    options?: CurrentStateQueryOptions
  ): QueryResult<Holon[]> {
    // Query holons from graph store
    const holons = this.graphStore.queryHolonsByType(type, options?.filters);

    // Apply access control
    const originalCount = holons.length;
    const filteredHolons = this.accessControl.filterHolons(user, holons);

    return {
      data: filteredHolons,
      filtered: filteredHolons.length < originalCount,
    };
  }

  /**
   * Query current state relationships by type with filtering and access control
   */
  async queryCurrentRelationships(
    user: UserContext,
    type: RelationshipType,
    options?: RelationshipQueryFilters
  ): Promise<QueryResult<Relationship[]>> {
    // Query relationships from graph store
    const relationships = await this.graphStore.queryRelationshipsByType(type, options);

    // Apply access control
    const originalCount = relationships.length;
    const filteredRelationships = this.accessControl.filterRelationships(user, relationships);

    return {
      data: filteredRelationships,
      filtered: filteredRelationships.length < originalCount,
    };
  }

  /**
   * Get a specific holon by ID with access control
   */
  getHolon(user: UserContext, holonId: HolonID): QueryResult<Holon | undefined> {
    const holon = this.graphStore.getHolon(holonId);

    if (!holon) {
      return { data: undefined, filtered: false };
    }

    // Check access control
    const accessDecision = this.accessControl.canAccessHolon(user, holon);

    return {
      data: accessDecision.allowed ? holon : undefined,
      filtered: !accessDecision.allowed,
    };
  }

  /**
   * Traverse relationships from a holon with access control
   */
  async traverseRelationships(
    user: UserContext,
    holonId: HolonID,
    relationshipType?: RelationshipType,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
    filters?: RelationshipQueryFilters
  ): Promise<QueryResult<Relationship[]>> {
    // Get relationships from graph store
    const relationships = await this.graphStore.traverseRelationships(
      holonId,
      relationshipType,
      direction,
      filters
    );

    // Apply access control
    const originalCount = relationships.length;
    const filteredRelationships = this.accessControl.filterRelationships(user, relationships);

    return {
      data: filteredRelationships,
      filtered: filteredRelationships.length < originalCount,
    };
  }

  /**
   * Get connected holons from a starting holon with access control
   */
  async getConnectedHolons(
    user: UserContext,
    holonId: HolonID,
    relationshipType?: RelationshipType,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
    filters?: RelationshipQueryFilters
  ): Promise<QueryResult<Holon[]>> {
    // Get connected holons from graph store
    const holons = await this.graphStore.getConnectedHolons(
      holonId,
      relationshipType,
      direction,
      filters
    );

    // Apply access control
    const originalCount = holons.length;
    const filteredHolons = this.accessControl.filterHolons(user, holons);

    return {
      data: filteredHolons,
      filtered: filteredHolons.length < originalCount,
    };
  }

  /**
   * Match graph patterns with access control
   */
  async matchPattern(
    user: UserContext,
    pattern: GraphPattern
  ): Promise<QueryResult<PatternMatch[]>> {
    // Get pattern matches from graph store
    const matches = await this.graphStore.matchPattern(pattern);

    // Apply access control to each match
    const filteredMatches: PatternMatch[] = [];
    let totalFiltered = false;

    for (const match of matches) {
      const holons = Array.from(match.holons.values());
      const filteredHolons = this.accessControl.filterHolons(user, holons);
      const filteredRelationships = this.accessControl.filterRelationships(user, match.relationships);

      // Only include match if all holons and relationships are accessible
      if (filteredHolons.length === holons.length &&
        filteredRelationships.length === match.relationships.length) {
        filteredMatches.push(match);
      } else {
        totalFiltered = true;
      }
    }

    return {
      data: filteredMatches,
      filtered: totalFiltered || filteredMatches.length < matches.length,
    };
  }

  /**
   * Unified Search across multiple holon types
   */
  async unifiedSearch(
    user: UserContext,
    query: string,
    types: HolonType[] = [HolonType.Organization, HolonType.Position, HolonType.Person, HolonType.Process],
    limit: number = 20
  ): Promise<QueryResult<{ id: HolonID; type: HolonType; label: string; subtitle?: string; relevance: number, properties?: any }[]>> {
    const term = query.toLowerCase();
    const results: { id: HolonID; type: HolonType; label: string; subtitle?: string; relevance: number, properties?: any }[] = [];
    let totalFiltered = false;

    // Search each type
    for (const type of types) {
      // Get all holons of type (filtered by simple property match logic)
      // Note: In a real DB, this would be a specific search query.
      // Here we fetch all and filter in memory since we are in-memory.
      const holons = this.graphStore.queryHolonsByType(type);

      const filteredHolons = this.accessControl.filterHolons(user, holons);
      if (filteredHolons.length < holons.length) totalFiltered = true;

      for (const holon of filteredHolons) {
        let matchScore = 0;
        let label = '';
        let subtitle: string | undefined;

        // Type-specific matching logic
        switch (type) {
          case HolonType.Person:
            label = holon.properties.name || 'Unknown Person';
            subtitle = holon.properties.rank || holon.properties.category;
            if (label.toLowerCase().includes(term)) matchScore += 10;
            if (holon.properties.email?.toLowerCase().includes(term)) matchScore += 5;
            break;
          case HolonType.Organization:
            label = holon.properties.name || 'Unknown Org';
            subtitle = holon.properties.uics?.join(', ');
            if (label.toLowerCase().includes(term)) matchScore += 10;
            if (subtitle?.toLowerCase().includes(term)) matchScore += 5;
            break;
          case HolonType.Position:
            label = holon.properties.title || 'Unknown Position';
            subtitle = holon.properties.billetIDs?.join(', ');
            if (label.toLowerCase().includes(term)) matchScore += 10;
            if (subtitle?.toLowerCase().includes(term)) matchScore += 5;
            break;
          case HolonType.Process:
            label = holon.properties.name || 'Unknown Process';
            subtitle = holon.properties.description?.substring(0, 50);
            if (label.toLowerCase().includes(term)) matchScore += 10;
            break;
          default:
            // Generic fallback
            label = holon.id;
            if (JSON.stringify(holon.properties).toLowerCase().includes(term)) matchScore += 1;
        }

        if (matchScore > 0) {
          results.push({
            id: holon.id,
            type: holon.type,
            label,
            subtitle,
            relevance: matchScore,
            properties: holon.properties
          });
        }
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Limit
    const limitedResults = results.slice(0, limit);

    return {
      data: limitedResults,
      filtered: totalFiltered
    };
  }

  /**
   * Query holons as of a specific timestamp with access control
   */
  queryHolonsAsOf(
    user: UserContext,
    type: HolonType,
    options: TemporalQueryOptions
  ): QueryResult<Holon[]> {
    // Query holons from temporal query engine
    const holons = this.temporalQueryEngine.queryHolonsAsOf(
      type,
      options.asOfTimestamp,
      options.filters
    );

    // Apply access control
    const originalCount = holons.length;
    const filteredHolons = this.accessControl.filterHolons(user, holons);

    return {
      data: filteredHolons,
      filtered: filteredHolons.length < originalCount,
    };
  }

  /**
   * Query relationships as of a specific timestamp with access control
   */
  queryRelationshipsAsOf(
    user: UserContext,
    type: RelationshipType,
    options: TemporalQueryOptions
  ): QueryResult<Relationship[]> {
    // Query relationships from temporal query engine
    const relationships = this.temporalQueryEngine.queryRelationshipsAsOf(
      type,
      options.asOfTimestamp,
      options.filters
    );

    // Apply access control
    const originalCount = relationships.length;
    const filteredRelationships = this.accessControl.filterRelationships(user, relationships);

    return {
      data: filteredRelationships,
      filtered: filteredRelationships.length < originalCount,
    };
  }

  /**
   * Get a holon's state as of a specific timestamp with access control
   */
  getHolonAsOf(
    user: UserContext,
    holonId: HolonID,
    timestamp: Timestamp
  ): QueryResult<Holon | undefined> {
    const holon = this.temporalQueryEngine.getHolonAsOf(holonId, timestamp);

    if (!holon) {
      return { data: undefined, filtered: false };
    }

    // Check access control
    const accessDecision = this.accessControl.canAccessHolon(user, holon);

    return {
      data: accessDecision.allowed ? holon : undefined,
      filtered: !accessDecision.allowed,
    };
  }

  /**
   * Get relationships for a holon as of a specific timestamp with access control
   */
  getRelationshipsAsOf(
    user: UserContext,
    holonId: HolonID,
    timestamp: Timestamp,
    relationshipType?: RelationshipType
  ): QueryResult<Relationship[]> {
    const relationships = this.temporalQueryEngine.getRelationshipsAsOf(
      holonId,
      timestamp,
      relationshipType
    );

    // Apply access control
    const originalCount = relationships.length;
    const filteredRelationships = this.accessControl.filterRelationships(user, relationships);

    return {
      data: filteredRelationships,
      filtered: filteredRelationships.length < originalCount,
    };
  }

  /**
   * Get organizational structure as of a specific timestamp with access control
   */
  getOrganizationStructureAsOf(
    user: UserContext,
    organizationId: HolonID,
    timestamp: Timestamp
  ): QueryResult<OrganizationalStructure | undefined> {
    const structure = this.temporalQueryEngine.getOrganizationStructureAsOf(
      organizationId,
      timestamp
    );

    if (!structure) {
      return { data: undefined, filtered: false };
    }

    // Apply access control recursively
    const filteredStructure = this.filterOrganizationalStructure(user, structure);

    return {
      data: filteredStructure,
      filtered: this.isStructureFiltered(structure, filteredStructure),
    };
  }

  /**
   * Query events in a time range with access control
   */
  queryEventsByTimeRange(
    user: UserContext,
    options: TimeRangeQueryOptions
  ): QueryResult<Event[]> {
    // Query events from event store
    const events = this.eventStore.getEvents({
      startTime: options.startTime,
      endTime: options.endTime,
    });

    // Filter by event types if specified
    let filteredEvents = events;
    if (options.eventTypes && options.eventTypes.length > 0) {
      filteredEvents = events.filter(e => options.eventTypes!.includes(e.type));
    }

    // Apply access control
    const originalCount = filteredEvents.length;
    const accessFilteredEvents = this.accessControl.filterEvents(user, filteredEvents);

    return {
      data: accessFilteredEvents,
      filtered: accessFilteredEvents.length < originalCount,
    };
  }

  /**
   * Query events by holon with access control
   */
  queryEventsByHolon(
    user: UserContext,
    holonId: HolonID,
    timeRange?: { start: Timestamp; end: Timestamp }
  ): QueryResult<Event[]> {
    const events = this.eventStore.getEvents({ subjects: [holonId], startTime: timeRange?.start, endTime: timeRange?.end });

    // Apply access control
    const originalCount = events.length;
    const filteredEvents = this.accessControl.filterEvents(user, events);

    return {
      data: filteredEvents,
      filtered: filteredEvents.length < originalCount,
    };
  }

  /**
   * Query events by type with access control
   */
  queryEventsByType(
    user: UserContext,
    eventType: EventType,
    timeRange?: { start: Timestamp; end: Timestamp }
  ): QueryResult<Event[]> {
    const events = this.eventStore.getEvents({ type: [eventType], startTime: timeRange?.start, endTime: timeRange?.end });

    // Apply access control
    const originalCount = events.length;
    const filteredEvents = this.accessControl.filterEvents(user, events);

    return {
      data: filteredEvents,
      filtered: filteredEvents.length < originalCount,
    };
  }

  /**
   * Get event history for a holon with access control
   */
  getHolonEventHistory(
    user: UserContext,
    holonId: HolonID,
    timeRange?: { start: Timestamp; end: Timestamp }
  ): QueryResult<EventHistory> {
    const history = this.temporalQueryEngine.getHolonEventHistory(holonId, timeRange);

    // Apply access control to events
    const originalCount = history.events.length;
    const filteredEvents = this.accessControl.filterEvents(user, history.events);

    return {
      data: {
        ...history,
        events: filteredEvents,
      },
      filtered: filteredEvents.length < originalCount,
    };
  }

  /**
   * Get event history for a relationship with access control
   */
  async getRelationshipEventHistory(
    user: UserContext,
    relationshipId: RelationshipID,
    timeRange?: { start: Timestamp; end: Timestamp }
  ): Promise<QueryResult<EventHistory>> {
    const history = await this.temporalQueryEngine.getRelationshipEventHistory(relationshipId, timeRange);

    // Apply access control to events
    const originalCount = history.events.length;
    const filteredEvents = this.accessControl.filterEvents(user, history.events);

    return {
      data: {
        ...history,
        events: filteredEvents,
      },
      filtered: filteredEvents.length < originalCount,
    };
  }

  /**
   * Trace causal chain with access control
   */
  traceCausalChain(
    user: UserContext,
    eventId: EventID
  ): QueryResult<CausalChain | undefined> {
    const chain = this.temporalQueryEngine.traceCausalChain(eventId);

    if (!chain) {
      return { data: undefined, filtered: false };
    }

    // Apply access control to all events in the chain
    const originalCount = chain.fullChain.length;
    const filteredFullChain = this.accessControl.filterEvents(user, chain.fullChain);
    const filteredPreceding = this.accessControl.filterEvents(user, chain.precedingEvents);
    const filteredCausing = this.accessControl.filterEvents(user, chain.causingEvents);
    const filteredGrouped = this.accessControl.filterEvents(user, chain.groupedEvents);

    // Check if root event is accessible
    const rootAccessDecision = this.accessControl.canAccessEvent(user, chain.rootEvent);
    if (!rootAccessDecision.allowed) {
      return { data: undefined, filtered: true };
    }

    return {
      data: {
        rootEvent: chain.rootEvent,
        precedingEvents: filteredPreceding,
        causingEvents: filteredCausing,
        groupedEvents: filteredGrouped,
        fullChain: filteredFullChain,
      },
      filtered: filteredFullChain.length < originalCount,
    };
  }

  /**
   * Filter organizational structure recursively based on access control
   */
  private filterOrganizationalStructure(
    user: UserContext,
    structure: OrganizationalStructure
  ): OrganizationalStructure | undefined {
    // Check if user can access the organization
    const orgAccessDecision = this.accessControl.canAccessHolon(user, structure.organization);
    if (!orgAccessDecision.allowed) {
      return undefined;
    }

    // Filter sub-organizations recursively
    const filteredSubOrgs: OrganizationalStructure[] = [];
    for (const subOrg of structure.subOrganizations) {
      const filtered = this.filterOrganizationalStructure(user, subOrg);
      if (filtered) {
        filteredSubOrgs.push(filtered);
      }
    }

    // Filter positions
    const filteredPositions = this.accessControl.filterHolons(user, structure.positions);

    // Filter assignments
    const filteredAssignments = structure.assignments.filter(assignment => {
      const positionAccess = this.accessControl.canAccessHolon(user, assignment.position);
      const personAccess = this.accessControl.canAccessHolon(user, assignment.person);
      const relAccess = this.accessControl.canAccessRelationship(user, assignment.relationship);
      return positionAccess.allowed && personAccess.allowed && relAccess.allowed;
    });

    return {
      organization: structure.organization,
      subOrganizations: filteredSubOrgs,
      positions: filteredPositions,
      assignments: filteredAssignments,
      asOfTimestamp: structure.asOfTimestamp,
    };
  }

  /**
   * Check if organizational structure was filtered
   */
  private isStructureFiltered(
    original: OrganizationalStructure,
    filtered: OrganizationalStructure | undefined
  ): boolean {
    if (!filtered) {
      return true;
    }

    if (original.subOrganizations.length !== filtered.subOrganizations.length) {
      return true;
    }

    if (original.positions.length !== filtered.positions.length) {
      return true;
    }

    if (original.assignments.length !== filtered.assignments.length) {
      return true;
    }

    // Check sub-organizations recursively
    for (let i = 0; i < original.subOrganizations.length; i++) {
      if (this.isStructureFiltered(original.subOrganizations[i], filtered.subOrganizations[i])) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Create a new query layer instance
 */
export function createQueryLayer(
  temporalQueryEngine: TemporalQueryEngine,
  graphStore: GraphStore,
  accessControl: AccessControlEngine,
  eventStore: EventStore
): QueryLayer {
  return new QueryLayer(temporalQueryEngine, graphStore, accessControl, eventStore);
}
