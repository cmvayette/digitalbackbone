/**
 * Specific payload definitions for SOM Events
 */
import { EventType } from './event';
import { HolonID } from './holon';
export interface BasePayload {
    [key: string]: any;
}
export interface TaskCreatedPayload extends BasePayload {
    taskId: HolonID;
    title: string;
    description: string;
    assigneeId: HolonID;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate: string;
}
export interface ObjectiveSetPayload extends BasePayload {
    objectiveId: HolonID;
    statement: string;
    ownerId: HolonID;
    timeHorizon: string;
    status: string;
}
export interface ProcessDefinedPayload extends BasePayload {
    processId: HolonID;
    name: string;
    steps: Array<{
        id: string;
        title: string;
    }>;
}
export interface DocumentIssuedPayload extends BasePayload {
    title: string;
    content: string;
    status: 'active' | 'draft' | 'archived';
    documentType: string;
}
export type EventPayloadMap = {
    [EventType.TaskCreated]: TaskCreatedPayload;
    [EventType.ObjectiveCreated]: ObjectiveSetPayload;
    [EventType.DocumentIssued]: DocumentIssuedPayload;
    [EventType.ProcessDefined]: ProcessDefinedPayload;
};
//# sourceMappingURL=event-payloads.d.ts.map