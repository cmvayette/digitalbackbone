import { useState, useCallback } from 'react';
import {
    HolonID,
    type ProcessDefinedPayload,
    type ProcessUpdatedPayload,
    type ProcessStep
} from '@som/shared-types';
import * as SharedTypes from '@som/shared-types';
import { type SubmitEventRequest } from '../client';
import { createSOMClient } from '../factory';
import { v4 as uuidv4 } from 'uuid';

export function useProcessEditor() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const client = createSOMClient();

    const createProcess = useCallback(async (
        name: string,
        description: string,
        steps: ProcessStep[],
        actorId: HolonID
    ): Promise<HolonID | null> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const processId = uuidv4();
            const event: SubmitEventRequest<SharedTypes.EventType.ProcessDefined> = {
                type: SharedTypes.EventType.ProcessDefined,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [processId],
                payload: {
                    processId,
                    name,
                    description,
                    steps
                } as ProcessDefinedPayload,
                sourceSystem: 'som-how-do'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create process');
            }
            return processId;
        } catch (err: any) {
            setLastError(err.message);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    }, [client]);

    const updateProcess = useCallback(async (
        processId: HolonID,
        updates: Record<string, any>,
        actorId: HolonID
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setLastError(null);
        try {
            const event: SubmitEventRequest<SharedTypes.EventType.ProcessUpdated> = {
                type: SharedTypes.EventType.ProcessUpdated,
                occurredAt: new Date(),
                actor: actorId,
                subjects: [processId],
                payload: {
                    updates
                } as ProcessUpdatedPayload,
                sourceSystem: 'som-how-do'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to update process');
            }
            return true;
        } catch (err: any) {
            setLastError(err.message);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [client]);

    return {
        createProcess,
        updateProcess,
        isSubmitting,
        lastError
    };
}
