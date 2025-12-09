/**
 * Event Enums
 */

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
    ProcessDefined = 'ProcessDefined',
    ProcessUpdated = 'ProcessUpdated',
    ProcessArchived = 'ProcessArchived'
}
