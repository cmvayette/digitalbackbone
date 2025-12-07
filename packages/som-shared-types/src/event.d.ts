/**
 * Event type definitions for the Semantic Operating Model
 */
import { HolonID, DocumentID, Timestamp, EventID } from './holon';
export { EventID };
export declare enum EventType {
    OrganizationCreated = "OrganizationCreated",
    OrganizationRealigned = "OrganizationRealigned",
    OrganizationDeactivated = "OrganizationDeactivated",
    PositionCreated = "PositionCreated",
    PositionModified = "PositionModified",
    PositionDeactivated = "PositionDeactivated",
    PersonCreated = "PersonCreated",
    PersonModified = "PersonModified",
    AssignmentStarted = "AssignmentStarted",
    AssignmentEnded = "AssignmentEnded",
    AssignmentCorrected = "AssignmentCorrected",
    QualificationAwarded = "QualificationAwarded",
    QualificationRenewed = "QualificationRenewed",
    QualificationExpired = "QualificationExpired",
    QualificationRevoked = "QualificationRevoked",
    QualificationDefined = "QualificationDefined",
    MissionPlanned = "MissionPlanned",
    MissionApproved = "MissionApproved",
    MissionLaunched = "MissionLaunched",
    MissionPhaseTransition = "MissionPhaseTransition",
    MissionCompleted = "MissionCompleted",
    MissionDebriefed = "MissionDebriefed",
    SystemDeployed = "SystemDeployed",
    SystemUpdated = "SystemUpdated",
    SystemOutage = "SystemOutage",
    SystemDeprecated = "SystemDeprecated",
    AssetMaintenance = "AssetMaintenance",
    AssetFailure = "AssetFailure",
    AssetUpgrade = "AssetUpgrade",
    ObjectiveCreated = "ObjectiveCreated",
    ObjectiveRescoped = "ObjectiveRescoped",
    ObjectiveClosed = "ObjectiveClosed",
    LOECreated = "LOECreated",
    LOEReframed = "LOEReframed",
    InitiativeStageChange = "InitiativeStageChange",
    TaskCreated = "TaskCreated",
    TaskAssigned = "TaskAssigned",
    TaskStarted = "TaskStarted",
    TaskBlocked = "TaskBlocked",
    TaskCompleted = "TaskCompleted",
    TaskCancelled = "TaskCancelled",
    DocumentIssued = "DocumentIssued",
    DocumentUpdated = "DocumentUpdated",
    DocumentRescinded = "DocumentRescinded",
    ConstraintViolation = "ConstraintViolation",
    MeasureEmitted = "MeasureEmitted",
    LensEvaluated = "LensEvaluated",
    ProcessDefined = "ProcessDefined"
}
export interface Event {
    id: EventID;
    type: EventType;
    occurredAt: Timestamp;
    recordedAt: Timestamp;
    actor: HolonID;
    subjects: HolonID[];
    payload: Record<string, any>;
    sourceSystem: string;
    sourceDocument?: DocumentID;
    validityWindow?: {
        start: Timestamp;
        end: Timestamp;
    };
    causalLinks: {
        precededBy?: EventID[];
        causedBy?: EventID[];
        groupedWith?: EventID[];
    };
}
//# sourceMappingURL=event.d.ts.map