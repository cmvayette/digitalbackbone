import { useState, useCallback } from 'react';
import {
    EventType,
    HolonID,
    type ObjectiveCreatedPayload,
    type KeyResultDefinedPayload
} from '@som/shared-types';
import { createSOMClient, type SubmitEventRequest } from '../client';
import { v4 as uuidv4 } from 'uuid';

export function useStrategyComposer() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const client = createSOMClient();

    const createObjective = useCallback(async (
        statement: string,
        narrative: string,
        ownerId: HolonID,
        level: 'strategic' | 'operational' | 'tactical',
        timeHorizon: Date,
        actorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const objectiveId = uuidv4();
            const event: SubmitEventRequest<EventType.ObjectiveCreated> = {
                type: EventType.ObjectiveCreated,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [objectiveId],
                payload: {
                    objectiveId,
                    statement,
                    narrative,
                    level,
                    ownerId,
                    timeHorizon: timeHorizon.toISOString(),
                    status: 'active'
                } as ObjectiveCreatedPayload,
                sourceSystem: 'som-objectives-okr'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create objective');
            }
            return objectiveId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [client]);

    const createKeyResult = useCallback(async (
        objectiveId: HolonID,
        statement: string,
        target: number,
        baseline: number,
        ownerId: HolonID,
        actorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const krId = uuidv4();
            // This event links KR to Objective via subjects or payload
            const event: SubmitEventRequest<EventType.KeyResultDefined> = {
                type: EventType.KeyResultDefined,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [krId, objectiveId],
                payload: {
                    krId,
                    objectiveId,
                    statement,
                    target,
                    baseline,
                    ownerId
                } as KeyResultDefinedPayload,
                sourceSystem: 'som-objectives-okr'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create key result');
            }
            return krId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [client]);

    return {
        createObjective,
        createKeyResult,
        isSubmitting,
        lastError
    };
}
