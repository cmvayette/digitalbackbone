import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    EventType,
    HolonID,
    type ObjectiveCreatedPayload,
    type KeyResultDefinedPayload
} from '@som/shared-types';
import { type SubmitEventRequest, SOMClientOptions } from '@som/api-client';
import { v4 as uuidv4 } from 'uuid';
import { getClient } from '../api/client';

export function useStrategyComposer(options: SOMClientOptions = { mode: 'mock' }) {
    const queryClient = useQueryClient();
    const client = getClient(options.mode);

    const createObjectiveMutation = useMutation({
        mutationFn: async (vars: {
            statement: string,
            narrative: string,
            ownerId: HolonID,
            level: 'strategic' | 'operational' | 'tactical',
            timeHorizon: Date,
            actorId: HolonID
        }) => {
            const objectiveId = uuidv4();
            const event: SubmitEventRequest<EventType.ObjectiveCreated> = {
                type: EventType.ObjectiveCreated,
                occurredAt: new Date(),
                actor: vars.actorId,
                subjects: [objectiveId],
                payload: {
                    objectiveId,
                    statement: vars.statement,
                    narrative: vars.narrative,
                    level: vars.level,
                    ownerId: vars.ownerId,
                    timeHorizon: vars.timeHorizon.toISOString(),
                    status: 'active'
                } as ObjectiveCreatedPayload,
                sourceSystem: 'som-objectives-okr'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create objective');
            }
            return objectiveId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategy'] });
        }
    });

    const createKeyResultMutation = useMutation({
        mutationFn: async (vars: {
            objectiveId: HolonID,
            statement: string,
            target: number,
            baseline: number,
            ownerId: HolonID,
            actorId: HolonID
        }) => {
            const krId = uuidv4();
            const event: SubmitEventRequest<EventType.KeyResultDefined> = {
                type: EventType.KeyResultDefined,
                occurredAt: new Date(),
                actor: vars.actorId,
                subjects: [krId, vars.objectiveId],
                payload: {
                    krId,
                    objectiveId: vars.objectiveId,
                    statement: vars.statement,
                    target: vars.target,
                    baseline: vars.baseline,
                    ownerId: vars.ownerId
                } as KeyResultDefinedPayload,
                sourceSystem: 'som-objectives-okr'
            };

            const result = await client.submitEvent(event);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create key result');
            }
            return krId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategy'] });
        }
    });

    return {
        createObjective: (statement: string, narrative: string, ownerId: HolonID, level: 'strategic' | 'operational' | 'tactical', timeHorizon: Date, actorId: HolonID) =>
            createObjectiveMutation.mutateAsync({ statement, narrative, ownerId, level, timeHorizon, actorId }),

        createKeyResult: (objectiveId: HolonID, statement: string, target: number, baseline: number, ownerId: HolonID, actorId: HolonID) =>
            createKeyResultMutation.mutateAsync({ objectiveId, statement, target, baseline, ownerId, actorId }),

        isSubmitting: createObjectiveMutation.isPending || createKeyResultMutation.isPending,
        lastError: createObjectiveMutation.error?.message || createKeyResultMutation.error?.message
    };
}
