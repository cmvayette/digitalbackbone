/**
 * Event type definitions for the Semantic Operating Model
 */
export var EventType;
(function (EventType) {
    // Structural
    EventType["OrganizationCreated"] = "OrganizationCreated";
    EventType["OrganizationRealigned"] = "OrganizationRealigned";
    EventType["OrganizationDeactivated"] = "OrganizationDeactivated";
    EventType["PositionCreated"] = "PositionCreated";
    EventType["PositionModified"] = "PositionModified";
    EventType["PositionDeactivated"] = "PositionDeactivated";
    EventType["PersonCreated"] = "PersonCreated";
    EventType["PersonModified"] = "PersonModified";
    // Assignment
    EventType["AssignmentStarted"] = "AssignmentStarted";
    EventType["AssignmentEnded"] = "AssignmentEnded";
    EventType["AssignmentCorrected"] = "AssignmentCorrected";
    // Qualification
    EventType["QualificationAwarded"] = "QualificationAwarded";
    EventType["QualificationRenewed"] = "QualificationRenewed";
    EventType["QualificationExpired"] = "QualificationExpired";
    EventType["QualificationRevoked"] = "QualificationRevoked";
    EventType["QualificationDefined"] = "QualificationDefined";
    // Mission
    EventType["MissionPlanned"] = "MissionPlanned";
    EventType["MissionApproved"] = "MissionApproved";
    EventType["MissionLaunched"] = "MissionLaunched";
    EventType["MissionPhaseTransition"] = "MissionPhaseTransition";
    EventType["MissionCompleted"] = "MissionCompleted";
    EventType["MissionDebriefed"] = "MissionDebriefed";
    // System/Asset
    EventType["SystemDeployed"] = "SystemDeployed";
    EventType["SystemUpdated"] = "SystemUpdated";
    EventType["SystemOutage"] = "SystemOutage";
    EventType["SystemDeprecated"] = "SystemDeprecated";
    EventType["AssetMaintenance"] = "AssetMaintenance";
    EventType["AssetFailure"] = "AssetFailure";
    EventType["AssetUpgrade"] = "AssetUpgrade";
    // Objective/LOE
    EventType["ObjectiveCreated"] = "ObjectiveCreated";
    EventType["ObjectiveRescoped"] = "ObjectiveRescoped";
    EventType["ObjectiveClosed"] = "ObjectiveClosed";
    EventType["LOECreated"] = "LOECreated";
    EventType["LOEReframed"] = "LOEReframed";
    // Initiative/Task
    EventType["InitiativeStageChange"] = "InitiativeStageChange";
    EventType["TaskCreated"] = "TaskCreated";
    EventType["TaskAssigned"] = "TaskAssigned";
    EventType["TaskStarted"] = "TaskStarted";
    EventType["TaskBlocked"] = "TaskBlocked";
    EventType["TaskCompleted"] = "TaskCompleted";
    EventType["TaskCancelled"] = "TaskCancelled";
    // Governance
    EventType["DocumentIssued"] = "DocumentIssued";
    EventType["DocumentUpdated"] = "DocumentUpdated";
    EventType["DocumentRescinded"] = "DocumentRescinded";
    EventType["ConstraintViolation"] = "ConstraintViolation";
    // Measurement
    EventType["MeasureEmitted"] = "MeasureEmitted";
    EventType["LensEvaluated"] = "LensEvaluated";
    // Process
    EventType["ProcessDefined"] = "ProcessDefined";
})(EventType || (EventType = {}));
