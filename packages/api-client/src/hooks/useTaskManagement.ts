import { useState, useCallback } from 'react';
import {
    HolonID,
    type InitiativeCreatedPayload,
    type TaskCreatedPayload,
    type TaskAssignedPayload,
    type TaskStartedPayload,
    type TaskBlockedPayload,
    type TaskCompletedPayload,
    type TaskCancelledPayload
} from '@som/shared-types';
import * as SharedTypes from '@som/shared-types';
import { type SubmitEventRequest } from '../client';
import { createSOMClient } from '../factory';
import { v4 as uuidv4 } from 'uuid';

export function useTaskManagement() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const client = createSOMClient();

    const createInitiative = useCallback(async (
        name: string,
        description: string,
        ownerId: HolonID,
        startDate: string,
        targetEndDate: string,
        actorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const initiativeId = uuidv4();
            const event: SubmitEventRequest<SharedTypes.EventType.InitiativeCreated> = {
                type: SharedTypes.EventType.InitiativeCreated,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [initiativeId],
                payload: {
                    initiativeId,
                    name,
                    description,
                    ownerId,
                    startDate,
                    targetEndDate,
                    status: 'planning'
                } as InitiativeCreatedPayload,
                sourceSystem: 'som-task-management'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create initiative');
            }
            return initiativeId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const createTask = useCallback(async (
        title: string,
        description: string,
        assigneeId: HolonID,
        projectId: HolonID,
        priority: 'low' | 'medium' | 'high' | 'critical',
        dueDate: string,
        actorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const taskId = uuidv4();
            // Note: Project linkage is via 'subjects' (taskId, projectId) or payload property?
            // Event system usually links objects via subjects or explicitly in payload.
            // Shared types for TaskCreatedPayload doesn't strict link to project, but we can assume subjects[1] is parent or add property.
            // Let's use subjects[1] as parent context if payload doesn't support it, 
            // OR checks generic properties. Ideally payload should have parentId.
            // Checking payload definition.... it has: taskId, title, description, assigneeId, priority, dueDate. 
            // It lacks parentId. We should rely on subjects linkage for graph construction.

            const event: SubmitEventRequest<SharedTypes.EventType.TaskCreated> = {
                type: SharedTypes.EventType.TaskCreated,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [taskId, projectId], // Link task to project
                payload: {
                    taskId,
                    title,
                    description,
                    assigneeId,
                    priority,
                    dueDate
                } as TaskCreatedPayload,
                sourceSystem: 'som-task-management'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create task');
            }
            return taskId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const updateTaskStatus = useCallback(async (
        taskId: HolonID,
        status: 'in-progress' | 'blocked' | 'done' | 'cancelled' | 'todo', // 'todo' might mean reset
        actorId: HolonID,
        reason?: string
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            let event: SubmitEventRequest<any>;

            switch (status) {
                case 'in-progress':
                    event = {
                        type: SharedTypes.EventType.TaskStarted,
                        occurredAt: new Date(),
                        actor: actorId,
                        subjects: [taskId],
                        payload: {
                            startTime: new Date().toISOString()
                        } as TaskStartedPayload,
                        sourceSystem: 'som-task-management'
                    };
                    break;
                case 'blocked':
                    event = {
                        type: SharedTypes.EventType.TaskBlocked,
                        occurredAt: new Date(),
                        actor: actorId,
                        subjects: [taskId],
                        payload: {
                            reason: reason || 'Blocked by user'
                        } as TaskBlockedPayload,
                        sourceSystem: 'som-task-management'
                    };
                    break;
                case 'done':
                    event = {
                        type: SharedTypes.EventType.TaskCompleted,
                        occurredAt: new Date(),
                        actor: actorId,
                        subjects: [taskId],
                        payload: {
                            outcome: reason || 'Completed'
                        } as TaskCompletedPayload,
                        sourceSystem: 'som-task-management'
                    };
                    break;
                case 'cancelled':
                    event = {
                        type: SharedTypes.EventType.TaskCancelled,
                        occurredAt: new Date(),
                        actor: actorId,
                        subjects: [taskId],
                        payload: {
                            reason: reason || 'Cancelled by user'
                        } as TaskCancelledPayload,
                        sourceSystem: 'som-task-management'
                    };
                    break;
                default:
                    // For 'todo' or unknown, we might not emit an event or definition is needed.
                    // Assuming no op for now or maybe 'TaskUpdated' generic?
                    return true;
            }

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || `Failed to update task to ${status}`);
            }
            return true;
        } catch (err: any) {
            setLastError(err.message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const assignTask = useCallback(async (
        taskId: HolonID,
        assigneeId: HolonID,
        actorId: HolonID
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const event: SubmitEventRequest<SharedTypes.EventType.TaskAssigned> = {
                type: SharedTypes.EventType.TaskAssigned,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [taskId, assigneeId],
                payload: {
                    assigneeId
                } as TaskAssignedPayload,
                sourceSystem: 'som-task-management'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to assign task');
            }
            return true;
        } catch (err: any) {
            setLastError(err.message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        createInitiative,
        createTask,
        updateTaskStatus,
        assignTask,
        isSubmitting,
        lastError
    };
}
