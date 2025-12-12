/**
 * Temporal Query Engine for the Semantic Operating Model
 * Provides as-of queries, historical state reconstruction, and causal chain traversal
 */

import { IEventStore as EventStore } from '../event-store';
import { StateProjectionEngine, HolonState, RelationshipState } from '../state-projection';
import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { Holon, HolonID, HolonType, Timestamp } from '@som/shared-types';
import { Relationship, RelationshipID, RelationshipType } from '@som/shared-types';
import { Event, EventID } from '@som/shared-types';

/**
 * Organizational structure at a specific point in time
 */
export interface OrganizationalStructure {
  organization: Holon;
  subOrganizations: OrganizationalStructure[];
  positions: Holon[];
  assignments: Array<{
    position: Holon;
    person: Holon;
    relationship: Relationship;
  }>;
  asOfTimestamp: Timestamp;
}

/**
 * Causal chain showing how events led to a specific event
 */
export interface CausalChain {
  rootEvent: Event;
  precedingEvents: Event[];
  causingEvents: Event[];
  groupedEvents: Event[];
  fullChain: Event[]; // All events in causal order
}

/**
 * Event history for a holon or relationship
 */
export interface EventHistory {
  subjectId: HolonID | RelationshipID;
  events: Event[];
  startDate: Timestamp;
  endDate: Timestamp;
}

/**
 * Temporal Query Engine
 * Supports as-of queries and historical state reconstruction
 */
export class TemporalQueryEngine {
  private eventStore: EventStore;
  private stateProjection: StateProjectionEngine;
  private holonRegistry: HolonRegistry;
  private relationshipRegistry: RelationshipRegistry;

  constructor(
    eventStore: EventStore,
    stateProjection: StateProjectionEngine,
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry
  ) {
    this.eventStore = eventStore;
    this.stateProjection = stateProjection;
    this.holonRegistry = holonRegistry;
    this.relationshipRegistry = relationshipRegistry;
  }

  /**
   * Get a holon's state as of a specific timestamp
   * Replays events up to that point to reconstruct historical state
   */
  async getHolonAsOf(holonId: HolonID, timestamp: Timestamp): Promise<Holon | undefined> {
    const historicalState = await this.stateProjection.replayEventsAsOf(timestamp);
    const holonState = historicalState.holons.get(holonId);
    return holonState?.holon;
  }

  /**
   * Get all relationships for a holon as of a specific timestamp
   * Returns relationships that were effective at that time
   */
  async getRelationshipsAsOf(
    holonId: HolonID,
    timestamp: Timestamp,
    relationshipType?: RelationshipType
  ): Promise<Relationship[]> {
    const historicalState = await this.stateProjection.replayEventsAsOf(timestamp);
    const relationships: Relationship[] = [];

    // Check all relationships in the historical state
    for (const relState of historicalState.relationships.values()) {
      const rel = relState.relationship;

      // Check if this relationship involves the holon
      const involvesHolon =
        rel.sourceHolonID === holonId || rel.targetHolonID === holonId;

      if (!involvesHolon) {
        continue;
      }

      // Check if relationship type matches (if specified)
      if (relationshipType && rel.type !== relationshipType) {
        continue;
      }

      // Check if relationship was effective at the timestamp
      const isEffective =
        rel.effectiveStart <= timestamp &&
        (!rel.effectiveEnd || rel.effectiveEnd >= timestamp);

      if (isEffective) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  /**
   * Reconstruct organizational structure at a specific timestamp
   * Shows which organizations, positions, and assignments existed at that time
   */
  /**
   * Reconstruct organizational structure at a specific timestamp
   * Shows which organizations, positions, and assignments existed at that time
   */
  async getOrganizationStructureAsOf(
    organizationId: HolonID,
    timestamp: Timestamp
  ): Promise<OrganizationalStructure | undefined> {
    // Optimization: Fetch state once
    const historicalState = await this.stateProjection.replayEventsAsOf(timestamp);
    return this.buildOrganizationStructure(organizationId, historicalState, timestamp);
  }

  /**
   * Internal recursive helper using pre-fetched state
   */
  private async buildOrganizationStructure(
    organizationId: HolonID,
    historicalState: import('../state-projection').ProjectedState,
    timestamp: Timestamp
  ): Promise<OrganizationalStructure | undefined> {
    // Get the organization holon
    const orgState = historicalState.holons.get(organizationId);
    if (!orgState || orgState.holon.type !== HolonType.Organization) {
      return undefined;
    }

    // Find sub-organizations (CONTAINS relationships)
    const subOrganizations: OrganizationalStructure[] = [];
    for (const relState of historicalState.relationships.values()) {
      const rel = relState.relationship;

      if (
        rel.type === RelationshipType.CONTAINS &&
        rel.sourceHolonID === organizationId &&
        rel.effectiveStart <= timestamp &&
        (!rel.effectiveEnd || rel.effectiveEnd >= timestamp)
      ) {
        const subOrgStructure = await this.buildOrganizationStructure(rel.targetHolonID, historicalState, timestamp);
        if (subOrgStructure) {
          subOrganizations.push(subOrgStructure);
        }
      }
    }

    // Find positions (BELONGS_TO relationships)
    const positions: Holon[] = [];
    const assignments: Array<{
      position: Holon;
      person: Holon;
      relationship: Relationship;
    }> = [];

    for (const relState of historicalState.relationships.values()) {
      const rel = relState.relationship;

      if (
        rel.type === RelationshipType.BELONGS_TO &&
        rel.targetHolonID === organizationId &&
        rel.effectiveStart <= timestamp &&
        (!rel.effectiveEnd || rel.effectiveEnd >= timestamp)
      ) {
        const positionState = historicalState.holons.get(rel.sourceHolonID);
        if (positionState && positionState.holon.type === HolonType.Position) {
          positions.push(positionState.holon);

          // Find person assigned to this position (OCCUPIES relationships)
          for (const assignRelState of historicalState.relationships.values()) {
            const assignRel = assignRelState.relationship;

            if (
              assignRel.type === RelationshipType.OCCUPIES &&
              assignRel.targetHolonID === rel.sourceHolonID &&
              assignRel.effectiveStart <= timestamp &&
              (!assignRel.effectiveEnd || assignRel.effectiveEnd >= timestamp)
            ) {
              const personState = historicalState.holons.get(assignRel.sourceHolonID);
              if (personState && personState.holon.type === HolonType.Person) {
                assignments.push({
                  position: positionState.holon,
                  person: personState.holon,
                  relationship: assignRel,
                });
              }
            }
          }
        }
      }
    }

    return {
      organization: orgState.holon,
      subOrganizations,
      positions,
      assignments,
      asOfTimestamp: timestamp,
    };
  }

  /**
   * Get complete event history for a holon
   * Returns all events that affected the holon in chronological order
   */
  async getHolonEventHistory(
    holonId: HolonID,
    timeRange?: { start: Timestamp; end: Timestamp }
  ): Promise<EventHistory> {
    const events = await this.eventStore.getEvents({ subjects: [holonId], startTime: timeRange?.start, endTime: timeRange?.end });

    // Sort events chronologically
    const sortedEvents = [...events].sort((a, b) =>
      a.occurredAt.getTime() - b.occurredAt.getTime()
    );

    const startDate = sortedEvents.length > 0
      ? sortedEvents[0].occurredAt
      : new Date();
    const endDate = sortedEvents.length > 0
      ? sortedEvents[sortedEvents.length - 1].occurredAt
      : new Date();

    return {
      subjectId: holonId,
      events: sortedEvents,
      startDate,
      endDate,
    };
  }

  /**
   * Get complete event history for a relationship
   * Returns all events that affected the relationship in chronological order
   */
  async getRelationshipEventHistory(
    relationshipId: RelationshipID,
    timeRange?: { start: Timestamp; end: Timestamp }
  ): Promise<EventHistory> {
    const relationship = await this.relationshipRegistry.getRelationship(relationshipId);
    if (!relationship) {
      return {
        subjectId: relationshipId,
        events: [],
        startDate: new Date(),
        endDate: new Date(),
      };
    }

    // Get events for both holons involved in the relationship
    const sourceEvents = await this.eventStore.getEvents({ subjects: [relationship.sourceHolonID], startTime: timeRange?.start, endTime: timeRange?.end });
    const targetEvents = await this.eventStore.getEvents({ subjects: [relationship.targetHolonID], startTime: timeRange?.start, endTime: timeRange?.end });

    // Filter events that mention this relationship in their payload
    const relationshipEvents = [...sourceEvents, ...targetEvents].filter(event =>
      event.payload.relationshipId === relationshipId
    );

    // Remove duplicates and sort chronologically
    const uniqueEvents = Array.from(
      new Map(relationshipEvents.map(e => [e.id, e])).values()
    ).sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    const startDate = uniqueEvents.length > 0
      ? uniqueEvents[0].occurredAt
      : new Date();
    const endDate = uniqueEvents.length > 0
      ? uniqueEvents[uniqueEvents.length - 1].occurredAt
      : new Date();

    return {
      subjectId: relationshipId,
      events: uniqueEvents,
      startDate,
      endDate,
    };
  }

  /**
   * Trace causal chain through event links
   * Shows what structural changes led to a specific event
   */
  async traceCausalChain(eventId: EventID): Promise<CausalChain | undefined> {
    const rootEvent = await this.eventStore.getEvent(eventId);
    if (!rootEvent) {
      return undefined;
    }

    const precedingEvents: Event[] = [];
    const causingEvents: Event[] = [];
    const groupedEvents: Event[] = [];
    const visited = new Set<EventID>();

    // Recursively traverse causal links
    const traverse = async (event: Event) => {
      if (visited.has(event.id)) {
        return;
      }
      visited.add(event.id);

      // Get preceding events
      if (event.causalLinks.precededBy) {
        for (const precededById of event.causalLinks.precededBy) {
          const precededByEvent = await this.eventStore.getEvent(precededById);
          if (precededByEvent) {
            precedingEvents.push(precededByEvent);
            await traverse(precededByEvent);
          }
        }
      }

      // Get causing events
      if (event.causalLinks.causedBy) {
        for (const causedById of event.causalLinks.causedBy) {
          const causedByEvent = await this.eventStore.getEvent(causedById);
          if (causedByEvent) {
            causingEvents.push(causedByEvent);
            await traverse(causedByEvent);
          }
        }
      }

      // Get grouped events
      if (event.causalLinks.groupedWith) {
        for (const groupedWithId of event.causalLinks.groupedWith) {
          const groupedWithEvent = await this.eventStore.getEvent(groupedWithId);
          if (groupedWithEvent) {
            groupedEvents.push(groupedWithEvent);
            await traverse(groupedWithEvent);
          }
        }
      }
    };

    await traverse(rootEvent);

    // Build full chain in causal order
    const allEvents = [
      ...precedingEvents,
      ...causingEvents,
      ...groupedEvents,
      rootEvent,
    ];

    // Remove duplicates and sort chronologically
    const fullChain = Array.from(
      new Map(allEvents.map(e => [e.id, e])).values()
    ).sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    return {
      rootEvent,
      precedingEvents,
      causingEvents,
      groupedEvents,
      fullChain,
    };
  }

  /**
   * Query holons with temporal constraints
   * Supports as-of queries and time-range queries
   */
  async queryHolonsAsOf(
    type: HolonType,
    timestamp: Timestamp,
    filters?: Record<string, any>
  ): Promise<Holon[]> {
    const historicalState = await this.stateProjection.replayEventsAsOf(timestamp);
    const holons: Holon[] = [];

    for (const holonState of historicalState.holons.values()) {
      if (holonState.holon.type === type) {
        // Apply filters if provided
        if (filters && !this.matchesFilters(holonState.holon, filters)) {
          continue;
        }
        holons.push(holonState.holon);
      }
    }

    return holons;
  }

  /**
   * Query relationships with temporal constraints
   * Returns relationships that were effective at the specified time
   */
  async queryRelationshipsAsOf(
    type: RelationshipType,
    timestamp: Timestamp,
    filters?: Record<string, any>
  ): Promise<Relationship[]> {
    const historicalState = await this.stateProjection.replayEventsAsOf(timestamp);
    const relationships: Relationship[] = [];

    for (const relState of historicalState.relationships.values()) {
      const rel = relState.relationship;

      if (rel.type !== type) {
        continue;
      }

      // Check if relationship was effective at the timestamp
      const isEffective =
        rel.effectiveStart <= timestamp &&
        (!rel.effectiveEnd || rel.effectiveEnd >= timestamp);

      if (!isEffective) {
        continue;
      }

      // Apply filters if provided
      if (filters && !this.matchesFilters(rel, filters)) {
        continue;
      }

      relationships.push(rel);
    }

    return relationships;
  }

  /**
   * Check if an object matches the provided filters
   */
  private matchesFilters(obj: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      // Support nested property access with dot notation
      const keys = key.split('.');
      let current = obj;

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return false;
        }
      }

      if (current !== value) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Create a new temporal query engine instance
 */
export function createTemporalQueryEngine(
  eventStore: EventStore,
  stateProjection: StateProjectionEngine,
  holonRegistry: HolonRegistry,
  relationshipRegistry: RelationshipRegistry
): TemporalQueryEngine {
  return new TemporalQueryEngine(
    eventStore,
    stateProjection,
    holonRegistry,
    relationshipRegistry
  );
}
