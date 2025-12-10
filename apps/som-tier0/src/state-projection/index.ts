/**
 * State Projection Engine for the Semantic Operating Model
 * Derives current state from events through event replay
 */

import { Event, EventType } from '@som/shared-types';
import { Holon, HolonID, HolonType, Timestamp } from '@som/shared-types';
import { Relationship, RelationshipID } from '@som/shared-types';
import { IEventStore } from '../core/interfaces/event-store';

/**
 * Projected state of a holon at a specific point in time
 */
export interface HolonState {
  holon: Holon;
  lastModified: Timestamp;
  modificationEvents: string[]; // Event IDs that modified this holon
}

/**
 * Projected state of a relationship at a specific point in time
 */
export interface RelationshipState {
  relationship: Relationship;
  lastModified: Timestamp;
  modificationEvents: string[]; // Event IDs that modified this relationship
}

/**
 * Complete projected state at a point in time
 */
export interface ProjectedState {
  holons: Map<HolonID, HolonState>;
  relationships: Map<RelationshipID, RelationshipState>;
  asOfTimestamp: Timestamp;
}

/**
 * State Projection Engine
 * Derives current state from immutable event log
 */
export class StateProjectionEngine {
  private eventStore: IEventStore;
  private currentState: ProjectedState;

  constructor(eventStore: IEventStore) {
    this.eventStore = eventStore;
    this.currentState = {
      holons: new Map(),
      relationships: new Map(),
      asOfTimestamp: new Date(),
    };
  }

  /**
   * Replay all events to compute current state
   * Events are processed in time order
   */
  replayAllEvents(): ProjectedState {
    const allEvents = this.eventStore.getAllEvents();


    // Sort events by occurredAt timestamp to ensure correct ordering
    const sortedEvents = [...allEvents].sort((a, b) =>
      a.occurredAt.getTime() - b.occurredAt.getTime()
    );

    // Reset state
    this.currentState = {
      holons: new Map(),
      relationships: new Map(),
      asOfTimestamp: new Date(),
    };

    // Process each event in order
    for (const event of sortedEvents) {
      this.applyEvent(event);
    }

    // Update as-of timestamp to current time
    this.currentState.asOfTimestamp = new Date();

    return this.currentState;
  }

  /**
   * Replay events up to a specific timestamp to reconstruct historical state
   */
  replayEventsAsOf(timestamp: Timestamp): ProjectedState {
    const allEvents = this.eventStore.getAllEvents();

    // Filter events up to the specified timestamp
    const eventsUpToTimestamp = allEvents.filter(event =>
      event.occurredAt <= timestamp
    );

    // Sort events by occurredAt timestamp
    const sortedEvents = [...eventsUpToTimestamp].sort((a, b) =>
      a.occurredAt.getTime() - b.occurredAt.getTime()
    );

    // Create new state for this point in time
    const historicalState: ProjectedState = {
      holons: new Map(),
      relationships: new Map(),
      asOfTimestamp: timestamp,
    };

    // Process each event in order
    for (const event of sortedEvents) {
      this.applyEventToState(event, historicalState);
    }

    return historicalState;
  }

  /**
   * Get the current projected state
   */
  getCurrentState(): ProjectedState {
    return this.currentState;
  }

  /**
   * Get a specific holon's current state
   */
  getHolonState(holonId: HolonID): HolonState | undefined {
    return this.currentState.holons.get(holonId);
  }

  /**
   * Get a specific relationship's current state
   */
  getRelationshipState(relationshipId: RelationshipID): RelationshipState | undefined {
    return this.currentState.relationships.get(relationshipId);
  }

  /**
   * Incrementally update state with a new event
   * This is more efficient than full replay for real-time updates
   */
  applyNewEvent(event: Event): void {
    this.applyEvent(event);
    this.currentState.asOfTimestamp = new Date();
  }

  /**
   * Apply a single event to the current state
   */
  private applyEvent(event: Event): void {
    this.applyEventToState(event, this.currentState);
  }

  /**
   * Apply a single event to a specific state (used for both current and historical states)
   */
  private applyEventToState(event: Event, state: ProjectedState): void {
    // Skip events outside validity window if specified
    if (event.validityWindow) {
      const now = state.asOfTimestamp;
      if (now < event.validityWindow.start || now > event.validityWindow.end) {
        return;
      }
    }

    switch (event.type) {
      // Structural events
      case EventType.OrganizationCreated:
      case EventType.PositionCreated:
      case EventType.PersonCreated:
        this.handleHolonCreation(event, state);
        break;

      case EventType.OrganizationRealigned:
      case EventType.PositionModified:
        this.handleHolonModification(event, state);
        break;

      case EventType.OrganizationDeactivated:
      case EventType.PositionDeactivated:
        this.handleHolonDeactivation(event, state);
        break;

      // Assignment events (relationships)
      case EventType.AssignmentStarted:
        this.handleRelationshipCreation(event, state);
        break;

      case EventType.AssignmentEnded:
        this.handleRelationshipEnd(event, state);
        break;

      case EventType.AssignmentCorrected:
        this.handleRelationshipCorrection(event, state);
        break;

      // Qualification events
      case EventType.QualificationAwarded:
      case EventType.QualificationRenewed:
        this.handleQualificationChange(event, state, 'active');
        break;

      case EventType.QualificationExpired:
      case EventType.QualificationRevoked:
        this.handleQualificationChange(event, state, 'inactive');
        break;

      // Mission events
      case EventType.MissionPlanned:
      case EventType.MissionApproved:
      case EventType.MissionLaunched:
        this.handleMissionStateChange(event, state);
        break;

      case EventType.MissionPhaseTransition:
        this.handleMissionPhaseTransition(event, state);
        break;

      case EventType.MissionCompleted:
      case EventType.MissionDebriefed:
        this.handleMissionCompletion(event, state);
        break;

      // System/Asset events
      case EventType.SystemDeployed:
      case EventType.AssetMaintenance:
        this.handleSystemAssetChange(event, state);
        break;

      // Objective/LOE events
      case EventType.ObjectiveCreated:
      case EventType.LOECreated:
        this.handleHolonCreation(event, state);
        break;

      case EventType.ObjectiveRescoped:
      case EventType.LOEReframed:
        this.handleHolonModification(event, state);
        break;

      case EventType.ObjectiveClosed:
        this.handleHolonDeactivation(event, state);
        break;

      // Initiative/Task events
      case EventType.InitiativeStageChange:
      case EventType.TaskCreated:
      case EventType.TaskAssigned:
      case EventType.TaskStarted:
      case EventType.TaskBlocked:
      case EventType.TaskCompleted:
      case EventType.TaskCancelled:
        this.handleTaskInitiativeChange(event, state);
        break;

      // Document events
      case EventType.DocumentIssued:
        this.handleHolonCreation(event, state);
        break;

      case EventType.DocumentUpdated:
        this.handleHolonModification(event, state);
        break;

      case EventType.DocumentRescinded:
        this.handleHolonDeactivation(event, state);
        break;

      // Measurement events
      case EventType.MeasureEmitted:
      case EventType.LensEvaluated:
        this.handleMeasurementEvent(event, state);
        break;

      // Process events
      case EventType.ProcessDefined:
      case EventType.ProcessUpdated:
      case EventType.ProcessArchived:
        this.handleHolonCreation(event, state); // Unified handler for now, refined later
        break;

      // New Governance events
      case EventType.DocumentCreated:
      case EventType.DocumentPublished:
      case EventType.ObligationDefined:
        this.handleHolonCreation(event, state);
        break;

      // New Task/Initiative Events
      case EventType.InitiativeCreated:
      case EventType.TaskCreated:
      case EventType.KeyResultDefined: // KR is a Holon
        this.handleHolonCreation(event, state);
        break;

      // Task & Initiative Updates
      case EventType.InitiativeStageChange:
      case EventType.TaskStarted:
      case EventType.TaskBlocked:
      case EventType.TaskCompleted:
      case EventType.TaskCancelled:
        this.handleTaskInitiativeChange(event, state);
        break;

      default:
      // Unknown event type - log but don't fail
      // console.warn(`Unknown event type: ${event.type}`);
    }
  }

  /**
   * Handle holon creation events
   */
  private handleHolonCreation(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    // Cast payload for loose access
    const payload = event.payload as any;

    // Extract specific structural fields to avoid duplicating them in properties if desired,
    // but generally we want to capturing the payload content into properties.
    const { holonType, type, properties, ...otherPayloadFields } = payload;

    const holon: Holon = {
      id: holonId,
      type: payload.holonType || payload.type || this.inferHolonTypeFromEvent(event),
      properties: { ...otherPayloadFields, ...(properties || {}) },
      createdAt: event.occurredAt,
      createdBy: event.id,
      status: 'active',
      sourceDocuments: event.sourceDocument ? [event.sourceDocument] : [],
    };

    state.holons.set(holonId, {
      holon,
      lastModified: event.occurredAt,
      modificationEvents: [event.id],
    });
  }

  /**
   * Handle holon modification events
   */
  private handleHolonModification(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    if (!holonState) return;

    const payload = event.payload as any;

    // Update properties from event payload
    if (payload.properties || payload.updates || payload.diff) {
      holonState.holon.properties = {
        ...holonState.holon.properties,
        ...(payload.properties || payload.updates || payload.diff),
      };
    }

    // Update modification tracking
    holonState.lastModified = event.occurredAt;
    holonState.modificationEvents.push(event.id);
  }

  /**
   * Handle holon deactivation events
   */
  private handleHolonDeactivation(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    if (!holonState) return;

    // Mark as inactive
    holonState.holon.status = 'inactive';
    holonState.lastModified = event.occurredAt;
    holonState.modificationEvents.push(event.id);
  }

  /**
   * Handle relationship creation events
   */
  private handleRelationshipCreation(event: Event, state: ProjectedState): void {
    const payload = event.payload as any;
    const relationshipId = payload.relationshipId;
    if (!relationshipId) return;

    const relationship: Relationship = {
      id: relationshipId,
      type: payload.relationshipType || 'Unknown',
      sourceHolonID: event.subjects[0],
      targetHolonID: event.subjects[1],
      properties: payload.properties || {},
      effectiveStart: event.occurredAt,
      sourceSystem: event.sourceSystem,
      sourceDocuments: event.sourceDocument ? [event.sourceDocument] : [],
      createdBy: event.id,
      authorityLevel: payload.authorityLevel || 'authoritative',
      confidenceScore: payload.confidenceScore,
    };

    state.relationships.set(relationshipId, {
      relationship,
      lastModified: event.occurredAt,
      modificationEvents: [event.id],
    });
  }

  /**
   * Handle relationship end events
   */
  private handleRelationshipEnd(event: Event, state: ProjectedState): void {
    const payload = event.payload as any;
    const relationshipId = payload.relationshipId;
    if (!relationshipId) return;

    const relationshipState = state.relationships.get(relationshipId);
    if (!relationshipState) return;

    // Set end date
    relationshipState.relationship.effectiveEnd = payload.endDate || event.occurredAt;
    relationshipState.lastModified = event.occurredAt;
    relationshipState.modificationEvents.push(event.id);
  }

  /**
   * Handle relationship correction events
   */
  private handleRelationshipCorrection(event: Event, state: ProjectedState): void {
    const payload = event.payload as any;
    const relationshipId = payload.relationshipId;
    if (!relationshipId) return;

    const relationshipState = state.relationships.get(relationshipId);
    if (!relationshipState) return;

    // Apply corrections
    if (payload.corrections) {
      Object.assign(relationshipState.relationship.properties, payload.corrections);
    }

    relationshipState.lastModified = event.occurredAt;
    relationshipState.modificationEvents.push(event.id);
  }

  /**
   * Handle qualification change events
   */
  private handleQualificationChange(event: Event, state: ProjectedState, status: 'active' | 'inactive'): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    if (!holonState) return;

    const payload = event.payload as any;

    if (!holonState.holon.properties.qualifications) {
      holonState.holon.properties.qualifications = {};
    }

    const qualificationId = payload.qualificationId;
    if (qualificationId) {
      holonState.holon.properties.qualifications[qualificationId] = {
        status,
        lastUpdated: event.occurredAt,
      };
    }

    holonState.lastModified = event.occurredAt;
    holonState.modificationEvents.push(event.id);
  }

  /**
   * Handle mission state change events
   */
  private handleMissionStateChange(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    const payload = event.payload as any;

    if (holonState) {
      if (payload.missionState) {
        holonState.holon.properties.missionState = payload.missionState;
      }
      holonState.lastModified = event.occurredAt;
      holonState.modificationEvents.push(event.id);
    } else {
      this.handleHolonCreation(event, state);
    }
  }

  /**
   * Handle mission phase transition events
   */
  private handleMissionPhaseTransition(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    if (!holonState) return;

    const payload = event.payload as any;

    if (payload.phase || payload.toPhase) {
      holonState.holon.properties.currentPhase = payload.phase || payload.toPhase;
      holonState.holon.properties.phaseTransitionTime = event.occurredAt;
    }

    holonState.lastModified = event.occurredAt;
    holonState.modificationEvents.push(event.id);
  }

  /**
   * Handle mission completion events
   */
  private handleMissionCompletion(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    if (!holonState) return;

    holonState.holon.properties.completionStatus = event.type === EventType.MissionCompleted ? 'completed' : 'debriefed';
    holonState.holon.properties.completionTime = event.occurredAt;

    holonState.lastModified = event.occurredAt;
    holonState.modificationEvents.push(event.id);
  }

  /**
   * Handle system/asset change events
   */
  private handleSystemAssetChange(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    const payload = event.payload as any;

    if (holonState) {
      if (payload.status) {
        holonState.holon.properties.status = payload.status;
      }
      if (payload.configuration) {
        holonState.holon.properties.configuration = payload.configuration;
      }
      holonState.lastModified = event.occurredAt;
      holonState.modificationEvents.push(event.id);
    } else {
      this.handleHolonCreation(event, state);
    }
  }

  /**
   * Handle task/initiative change events
   */
  private handleTaskInitiativeChange(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    const payload = event.payload as any;

    if (holonState) {
      if (payload.status) {
        holonState.holon.properties.status = payload.status;
      }
      if (payload.stage) {
        holonState.holon.properties.stage = payload.stage;
      }
      holonState.lastModified = event.occurredAt;
      holonState.modificationEvents.push(event.id);
    } else {
      this.handleHolonCreation(event, state);
    }
  }

  /**
   * Handle measurement events
   */
  private handleMeasurementEvent(event: Event, state: ProjectedState): void {
    const holonId = event.subjects[0];
    if (!holonId) return;

    const holonState = state.holons.get(holonId);
    if (!holonState) return;

    const payload = event.payload as any;

    if (!holonState.holon.properties.measurements) {
      holonState.holon.properties.measurements = [];
    }

    holonState.holon.properties.measurements.push({
      type: event.type,
      value: payload.value,
      timestamp: event.occurredAt,
      measureId: payload.measureId || payload.measureDefinitionID,
    });

    holonState.lastModified = event.occurredAt;
    holonState.modificationEvents.push(event.id);
  }

  /**
   * Infer holon type from event type
   */
  private inferHolonTypeFromEvent(event: Event): HolonType {
    switch (event.type) {
      case EventType.OrganizationCreated:
      case EventType.OrganizationRealigned:
      case EventType.OrganizationDeactivated:
        return HolonType.Organization;

      case EventType.PositionCreated:
      case EventType.PositionModified:
      case EventType.PositionDeactivated:
        return HolonType.Position;

      case EventType.PersonCreated:
        return HolonType.Person;

      case EventType.MissionPlanned:
      case EventType.MissionApproved:
      case EventType.MissionLaunched:
      case EventType.MissionPhaseTransition:
      case EventType.MissionCompleted:
      case EventType.MissionDebriefed:
        return HolonType.Mission;

      case EventType.ObjectiveCreated:
      case EventType.ObjectiveRescoped:
      case EventType.ObjectiveClosed:
        return HolonType.Objective;

      case EventType.LOECreated:
      case EventType.LOEReframed:
        return HolonType.LOE;

      case EventType.TaskCreated:
      case EventType.TaskAssigned:
      case EventType.TaskStarted:
      case EventType.TaskBlocked:
      case EventType.TaskCompleted:
      case EventType.TaskCancelled:
        return HolonType.Task;

      case EventType.DocumentIssued:
      case EventType.DocumentUpdated:
      case EventType.DocumentRescinded:
      case EventType.DocumentCreated:
      case EventType.DocumentPublished:
        return HolonType.Document;

      case EventType.ProcessDefined:
      case EventType.ProcessUpdated:
      case EventType.ProcessArchived:
        return HolonType.Process;

      case EventType.InitiativeCreated:
      case EventType.InitiativeStageChange:
        return HolonType.Initiative;

      case EventType.TaskCreated:
        return HolonType.Task;

      case EventType.KeyResultDefined:
        return HolonType.KeyResult;

      case EventType.ObligationDefined:
        return HolonType.Constraint; // Or specialized type if available

      default:
        return HolonType.System; // Default fallback
    }
  }
}

/**
 * Create a new state projection engine instance
 */
export function createStateProjectionEngine(eventStore: IEventStore): StateProjectionEngine {
  return new StateProjectionEngine(eventStore);
}
