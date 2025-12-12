/**
 * Event type definitions for the Semantic Operating Model
 */

import type { HolonID, DocumentID, Timestamp, EventID } from './holon.js';
import { EventType } from './event-enums.js';
import type { PayloadFor } from './event-payloads.js';

export type { EventID };
export { EventType } from './event-enums.js';

export interface EventBase {
  id: EventID;
  occurredAt: Timestamp;
  recordedAt: Timestamp;
  actor: HolonID; // Person, Position, or System
  subjects: HolonID[]; // Holons or Relationships affected
  sourceSystem: string;
  sourceDocument?: DocumentID;
  validityWindow?: { start: Timestamp; end: Timestamp };
  causalLinks: {
    precededBy?: EventID[];
    causedBy?: EventID[];
    groupedWith?: EventID[];
  };
}

// Discriminated Union Factory
export type TypedEvent<T extends EventType> = EventBase & {
  type: T;
  payload: PayloadFor<T>;
};

// The Master Union Type
export type Event =
  | TypedEvent<EventType.OrganizationCreated>
  | TypedEvent<EventType.OrganizationRealigned>
  | TypedEvent<EventType.OrganizationDeactivated>
  | TypedEvent<EventType.PositionCreated>
  | TypedEvent<EventType.PositionModified>
  | TypedEvent<EventType.PositionDeactivated>
  | TypedEvent<EventType.PersonCreated>
  | TypedEvent<EventType.PersonModified>
  | TypedEvent<EventType.AssignmentStarted>
  | TypedEvent<EventType.AssignmentEnded>
  | TypedEvent<EventType.AssignmentCorrected>
  | TypedEvent<EventType.QualificationAwarded>
  | TypedEvent<EventType.QualificationRenewed>
  | TypedEvent<EventType.QualificationExpired>
  | TypedEvent<EventType.QualificationRevoked>
  | TypedEvent<EventType.QualificationDefined>
  | TypedEvent<EventType.MissionPlanned>
  | TypedEvent<EventType.MissionApproved>
  | TypedEvent<EventType.MissionLaunched>
  | TypedEvent<EventType.MissionPhaseTransition>
  | TypedEvent<EventType.MissionCompleted>
  | TypedEvent<EventType.MissionDebriefed>
  | TypedEvent<EventType.SystemDeployed>
  | TypedEvent<EventType.SystemUpdated>
  | TypedEvent<EventType.SystemOutage>
  | TypedEvent<EventType.SystemDeprecated>
  | TypedEvent<EventType.AssetMaintenance>
  | TypedEvent<EventType.AssetFailure>
  | TypedEvent<EventType.AssetUpgrade>
  | TypedEvent<EventType.ObjectiveCreated>
  | TypedEvent<EventType.KeyResultDefined>
  | TypedEvent<EventType.ObjectiveRescoped>
  | TypedEvent<EventType.ObjectiveClosed>
  | TypedEvent<EventType.LOECreated>
  | TypedEvent<EventType.LOEReframed>
  | TypedEvent<EventType.TaskCreated>
  | TypedEvent<EventType.TaskAssigned>
  | TypedEvent<EventType.TaskStarted>
  | TypedEvent<EventType.TaskBlocked>
  | TypedEvent<EventType.TaskCompleted>
  | TypedEvent<EventType.TaskCancelled>
  | TypedEvent<EventType.InitiativeCreated>
  | TypedEvent<EventType.InitiativeStageChange>
  | TypedEvent<EventType.DocumentCreated>
  | TypedEvent<EventType.DocumentPublished>
  | TypedEvent<EventType.ClauseExtracted>
  | TypedEvent<EventType.ObligationDefined>
  | TypedEvent<EventType.DocumentIssued>
  | TypedEvent<EventType.DocumentUpdated>
  | TypedEvent<EventType.DocumentRescinded>
  | TypedEvent<EventType.ConstraintViolation>
  | TypedEvent<EventType.MeasureEmitted>
  | TypedEvent<EventType.LensEvaluated>
  | TypedEvent<EventType.ProcessDefined>
  | TypedEvent<EventType.ProcessUpdated>
  | TypedEvent<EventType.ProcessArchived>
  | TypedEvent<EventType.CalendarEventCreated>
  | TypedEvent<EventType.CalendarEventModified>
  | TypedEvent<EventType.CalendarEventCancelled>;
