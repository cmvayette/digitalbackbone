/**
 * Event type definitions for the Semantic Operating Model
 */

import { HolonID, DocumentID, Timestamp, EventID } from './holon';
export { EventID };

export enum EventType {
  // Structural
  OrganizationCreated = 'OrganizationCreated',
  OrganizationRealigned = 'OrganizationRealigned',
  OrganizationDeactivated = 'OrganizationDeactivated',
  PositionCreated = 'PositionCreated',
  PositionModified = 'PositionModified',
  PositionDeactivated = 'PositionDeactivated',
  PersonCreated = 'PersonCreated',
  PersonModified = 'PersonModified',

  // Assignment
  AssignmentStarted = 'AssignmentStarted',
  AssignmentEnded = 'AssignmentEnded',
  AssignmentCorrected = 'AssignmentCorrected',

  // Qualification
  QualificationAwarded = 'QualificationAwarded',
  QualificationRenewed = 'QualificationRenewed',
  QualificationExpired = 'QualificationExpired',
  QualificationRevoked = 'QualificationRevoked',
  QualificationDefined = 'QualificationDefined',

  // Mission
  MissionPlanned = 'MissionPlanned',
  MissionApproved = 'MissionApproved',
  MissionLaunched = 'MissionLaunched',
  MissionPhaseTransition = 'MissionPhaseTransition',
  MissionCompleted = 'MissionCompleted',
  MissionDebriefed = 'MissionDebriefed',

  // System/Asset
  SystemDeployed = 'SystemDeployed',
  SystemUpdated = 'SystemUpdated',
  SystemOutage = 'SystemOutage',
  SystemDeprecated = 'SystemDeprecated',
  AssetMaintenance = 'AssetMaintenance',
  AssetFailure = 'AssetFailure',
  AssetUpgrade = 'AssetUpgrade',

  // Objective/LOE
  ObjectiveCreated = 'ObjectiveCreated',
  ObjectiveRescoped = 'ObjectiveRescoped',
  ObjectiveClosed = 'ObjectiveClosed',
  LOECreated = 'LOECreated',
  LOEReframed = 'LOEReframed',

  // Initiative/Task
  InitiativeStageChange = 'InitiativeStageChange',
  TaskCreated = 'TaskCreated',
  TaskAssigned = 'TaskAssigned',
  TaskStarted = 'TaskStarted',
  TaskBlocked = 'TaskBlocked',
  TaskCompleted = 'TaskCompleted',
  TaskCancelled = 'TaskCancelled',

  // Governance
  DocumentIssued = 'DocumentIssued',
  DocumentUpdated = 'DocumentUpdated',
  DocumentRescinded = 'DocumentRescinded',
  ConstraintViolation = 'ConstraintViolation',

  // Measurement
  MeasureEmitted = 'MeasureEmitted',
  LensEvaluated = 'LensEvaluated',

  // Process
  ProcessDefined = 'ProcessDefined'
}

export interface Event {
  id: EventID;
  type: EventType;
  occurredAt: Timestamp;
  recordedAt: Timestamp;
  actor: HolonID; // Person, Position, or System
  subjects: HolonID[]; // Holons or Relationships affected
  payload: Record<string, any>;
  sourceSystem: string;
  sourceDocument?: DocumentID;
  validityWindow?: { start: Timestamp; end: Timestamp };
  causalLinks: {
    precededBy?: EventID[];
    causedBy?: EventID[];
    groupedWith?: EventID[];
  };
}
