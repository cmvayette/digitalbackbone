/**
 * Specific payload definitions for SOM Events
 */

import { EventType } from './event-enums';
import { HolonID } from './holon';

export interface BasePayload {
    [key: string]: unknown;
}

// --- Structural ---

export interface OrganizationCreatedPayload extends BasePayload {
    name: string;
    parentId?: HolonID;
    uic?: string;
    type: string;
    missionStatement?: string;
}

export interface OrganizationRealignedPayload extends BasePayload {
    organizationId: HolonID;
    newParentId: HolonID;
    effectiveDate: string;
    authorizationDocument?: string;
}

export interface OrganizationDeactivatedPayload extends BasePayload {
    organizationId: HolonID;
    reason: string;
    deactivationDate: string;
}

export interface PositionCreatedPayload extends BasePayload {
    orgId: HolonID;
    title: string;
    billetIDs?: string[];
    billetType?: string; // e.g. 'staff', 'command'
    criticality?: string;
}

export interface PositionModifiedPayload extends BasePayload {
    positionId?: HolonID; // Often implicit in subject, but helpful here
    title?: string;
    orgId?: HolonID;
    updates: Record<string, unknown>;
}

export interface PositionDeactivatedPayload extends BasePayload {
    positionId: HolonID;
    reason: string;
}

export interface PersonCreatedPayload extends BasePayload {
    name: string;
    rank?: string;
    email?: string;
    identifiers?: Record<string, string>; // e.g. dodId
}

export interface PersonModifiedPayload extends BasePayload {
    diff: Record<string, unknown>;
}

// --- Assignment ---

export interface AssignmentStartedPayload extends BasePayload {
    relationshipId?: string; // Optional if derived
    relationshipType?: string;
    personId?: HolonID; // If not in subjects
    positionId?: HolonID;
    role?: string; // 'assigned', 'acting'
    rank?: string; // Rank at time of assignment
    personName?: string; // Denormalized for convenience if needed
    properties?: Record<string, unknown>;
    authorityLevel?: 'authoritative' | 'derived' | 'inferred';
    confidenceScore?: number;
}

export interface AssignmentEndedPayload extends BasePayload {
    relationshipId?: string;
    endDate?: string;
    reason?: string;
}

export interface AssignmentCorrectedPayload extends BasePayload {
    relationshipId?: string;
    correctionReason: string;
    corrections?: Record<string, unknown>; // Changed from originalPayload to specific updates
    originalPayload?: Record<string, unknown>;
}

// --- Qualification ---

export interface QualificationAwardedPayload extends BasePayload {
    personId: HolonID;
    qualificationId: HolonID;
    awardedDate: string;
    expirationDate?: string;
}

export interface QualificationRenewedPayload extends BasePayload {
    qualificationId: HolonID;
    newExpirationDate: string;
}

export interface QualificationExpiredPayload extends BasePayload {
    qualificationId: HolonID;
}

export interface QualificationRevokedPayload extends BasePayload {
    qualificationId: HolonID;
    reason: string;
    revokedBy: HolonID;
}

export interface QualificationDefinedPayload extends BasePayload {
    name: string;
    code: string;
    prerequisites?: string[];
}

// --- Mission ---

export interface MissionPlannedPayload extends BasePayload {
    name: string;
    commanderId: HolonID;
    objectives?: string[];
}

export interface MissionApprovedPayload extends BasePayload {
    approverId: HolonID;
    approvalDate: string;
}

export interface MissionLaunchedPayload extends BasePayload {
    launchTime: string;
}

export interface MissionPhaseTransitionPayload extends BasePayload {
    fromPhase: string;
    toPhase: string;
}

export interface MissionCompletedPayload extends BasePayload {
    completionStatus: 'success' | 'failure' | 'partial';
    summary?: string;
}

export interface MissionDebriefedPayload extends BasePayload {
    reportId?: string;
    attendees?: HolonID[];
}

// --- System/Asset ---
// Grouping generic payload for less critical systems to save space, but explicit interfaces are better
export interface SystemPayload extends BasePayload {
    systemId: HolonID;
    status?: string;
    details?: string;
}

export type SystemDeployedPayload = SystemPayload;
export type SystemUpdatedPayload = SystemPayload & { version: string };
export type SystemOutagePayload = SystemPayload & { severity: string; estimatedResolution?: string };
export type SystemDeprecatedPayload = SystemPayload;
export type AssetMaintenancePayload = SystemPayload & { type: string };
export type AssetFailurePayload = SystemPayload & { failureCode: string };
export type AssetUpgradePayload = SystemPayload & { newSpecs: Record<string, unknown> };

// --- Objective/LOE ---

export interface ObjectiveCreatedPayload extends BasePayload {
    objectiveId: HolonID;
    statement: string;
    ownerId: HolonID;
    timeHorizon: string;
    status?: string;
}

export interface ObjectiveRescopedPayload extends BasePayload {
    newStatement?: string;
    newTimeHorizon?: string;
}

export interface ObjectiveClosedPayload extends BasePayload {
    result: string;
}

export interface LOECreatedPayload extends BasePayload {
    name: string;
    leadId: HolonID;
}

export interface LOEReframedPayload extends BasePayload {
    newName?: string;
}

// --- Initiative/Task ---

export interface TaskCreatedPayload extends BasePayload {
    taskId: HolonID;
    title: string;
    description: string;
    assigneeId: HolonID;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate: string;
}

export interface TaskAssignedPayload extends BasePayload {
    assigneeId: HolonID;
}

export interface TaskStartedPayload extends BasePayload {
    startTime: string;
}

export interface TaskBlockedPayload extends BasePayload {
    reason: string;
}

export interface TaskCompletedPayload extends BasePayload {
    outcome?: string;
}

export interface TaskCancelledPayload extends BasePayload {
    reason: string;
}

export interface InitiativeStageChangePayload extends BasePayload {
    newStage: string;
}

// --- Governance ---

export interface DocumentIssuedPayload extends BasePayload {
    title: string;
    content?: string; // URL or text
    status: 'active' | 'draft' | 'archived';
    documentType: string;
}

export interface DocumentUpdatedPayload extends BasePayload {
    changes: string;
}

export interface DocumentRescindedPayload extends BasePayload {
    reason: string;
}

export interface ConstraintViolationPayload extends BasePayload {
    ruleId: string;
    violationDetails: string;
    severity: string;
}

// --- Measurement ---

export interface MeasureEmittedPayload extends BasePayload {
    metricId: string;
    value: number | string;
    unit: string;
}

export interface LensEvaluatedPayload extends BasePayload {
    lensId: string;
    result: Record<string, unknown>;
}

// --- Process ---

export interface ProcessDefinedPayload extends BasePayload {
    processId: HolonID;
    name: string;
    steps: Array<{
        id: string;
        title: string;
    }>;
}

export interface ProcessUpdatedPayload extends BasePayload {
    updates: Record<string, unknown>;
}

export interface ProcessArchivedPayload extends BasePayload {
    reason?: string;
}


// --- Utility Types ---

export type PayloadFor<T extends EventType> =
    T extends EventType.OrganizationCreated ? OrganizationCreatedPayload :
    T extends EventType.OrganizationRealigned ? OrganizationRealignedPayload :
    T extends EventType.OrganizationDeactivated ? OrganizationDeactivatedPayload :
    T extends EventType.PositionCreated ? PositionCreatedPayload :
    T extends EventType.PositionModified ? PositionModifiedPayload :
    T extends EventType.PositionDeactivated ? PositionDeactivatedPayload :
    T extends EventType.PersonCreated ? PersonCreatedPayload :
    T extends EventType.PersonModified ? PersonModifiedPayload :
    T extends EventType.AssignmentStarted ? AssignmentStartedPayload :
    T extends EventType.AssignmentEnded ? AssignmentEndedPayload :
    T extends EventType.AssignmentCorrected ? AssignmentCorrectedPayload :
    T extends EventType.QualificationAwarded ? QualificationAwardedPayload :
    T extends EventType.QualificationRenewed ? QualificationRenewedPayload :
    T extends EventType.QualificationExpired ? QualificationExpiredPayload :
    T extends EventType.QualificationRevoked ? QualificationRevokedPayload :
    T extends EventType.QualificationDefined ? QualificationDefinedPayload :
    T extends EventType.MissionPlanned ? MissionPlannedPayload :
    T extends EventType.MissionApproved ? MissionApprovedPayload :
    T extends EventType.MissionLaunched ? MissionLaunchedPayload :
    T extends EventType.MissionPhaseTransition ? MissionPhaseTransitionPayload :
    T extends EventType.MissionCompleted ? MissionCompletedPayload :
    T extends EventType.MissionDebriefed ? MissionDebriefedPayload :
    T extends EventType.SystemDeployed ? SystemDeployedPayload :
    T extends EventType.SystemUpdated ? SystemUpdatedPayload :
    T extends EventType.SystemOutage ? SystemOutagePayload :
    T extends EventType.SystemDeprecated ? SystemDeprecatedPayload :
    T extends EventType.AssetMaintenance ? AssetMaintenancePayload :
    T extends EventType.AssetFailure ? AssetFailurePayload :
    T extends EventType.AssetUpgrade ? AssetUpgradePayload :
    T extends EventType.ObjectiveCreated ? ObjectiveCreatedPayload :
    T extends EventType.ObjectiveRescoped ? ObjectiveRescopedPayload :
    T extends EventType.ObjectiveClosed ? ObjectiveClosedPayload :
    T extends EventType.LOECreated ? LOECreatedPayload :
    T extends EventType.LOEReframed ? LOEReframedPayload :
    T extends EventType.TaskCreated ? TaskCreatedPayload :
    T extends EventType.TaskAssigned ? TaskAssignedPayload :
    T extends EventType.TaskStarted ? TaskStartedPayload :
    T extends EventType.TaskBlocked ? TaskBlockedPayload :
    T extends EventType.TaskCompleted ? TaskCompletedPayload :
    T extends EventType.TaskCancelled ? TaskCancelledPayload :
    T extends EventType.InitiativeStageChange ? InitiativeStageChangePayload :
    T extends EventType.DocumentIssued ? DocumentIssuedPayload :
    T extends EventType.DocumentUpdated ? DocumentUpdatedPayload :
    T extends EventType.DocumentRescinded ? DocumentRescindedPayload :
    T extends EventType.ConstraintViolation ? ConstraintViolationPayload :
    T extends EventType.MeasureEmitted ? MeasureEmittedPayload :
    T extends EventType.LensEvaluated ? LensEvaluatedPayload :
    T extends EventType.ProcessDefined ? ProcessDefinedPayload :
    T extends EventType.ProcessUpdated ? ProcessUpdatedPayload :
    T extends EventType.ProcessArchived ? ProcessArchivedPayload :
    BasePayload;
