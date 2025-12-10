import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSOMClient, SOMClientOptions } from '@som/api-client';
import { HolonType, EventType } from '@som/shared-types';
import { PolicyDocument, Obligation } from '../types/policy';
import { v4 as uuidv4 } from 'uuid';

export function useExternalPolicyData(options: SOMClientOptions = { mode: 'mock' }) {
    const queryClient = useQueryClient();
    const client = createSOMClient(
        options.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
        options
    );

    // --- Queries ---

    const policiesQuery = useQuery({
        queryKey: ['policies'],
        queryFn: async () => {
            const response = await client.queryHolons(HolonType.Document);
            if (response.success && response.data) {
                return response.data.map((h: any) => ({
                    id: h.id,
                    title: h.properties.title || 'Untitled Policy',
                    documentType: h.properties.type || 'Instruction',
                    version: h.properties.version || '0.1',
                    status: h.properties.status || 'draft',
                    sections: h.properties.content ? [{ id: 'sec-1', title: 'Content', content: h.properties.content, order: 1 }] : [],
                    obligations: [], // TODO: Link obligations
                    createdAt: h.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })) as PolicyDocument[];
            }
            return [];
        }
    });

    // --- Mutations ---

    const createPolicyMutation = useMutation({
        mutationFn: async (policyData: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
            const documentId = uuidv4();
            await client.submitEvent({
                type: EventType.DocumentCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [documentId],
                payload: {
                    documentId,
                    title: policyData.title,
                    type: policyData.documentType,
                    format: 'markdown',
                    content: policyData.sections[0]?.content || '',
                    version: policyData.version
                },
                sourceSystem: 'som-policy-app'
            });
            return documentId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        }
    });

    const publishPolicyMutation = useMutation({
        mutationFn: async ({ id, version }: { id: string; version: string }) => {
            await client.submitEvent({
                type: EventType.DocumentPublished,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [id],
                payload: {
                    documentId: id,
                    version,
                    publishedAt: new Date(),
                    approverId: 'system'
                },
                sourceSystem: 'som-policy-app'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        }
    });

    const addObligationMutation = useMutation({
        mutationFn: async ({ policyId, obligationData }: { policyId: string; obligationData: Omit<Obligation, 'id'> }) => {
            const obligationId = uuidv4();
            await client.submitEvent({
                type: EventType.ObligationDefined,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [obligationId],
                payload: {
                    obligationId,
                    policyId,
                    sourceClauseId: uuidv4(),
                    description: obligationData.statement,
                    responsibleRole: obligationData.actor.name
                },
                sourceSystem: 'som-policy-app'
            });
            return obligationId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        }
    });

    // Stub for updateObligation as it wasn't fully implemented in original either
    const updateObligationMutation = useMutation({
        mutationFn: async (_variables: { policyId: string, obligationId: string, updates: Partial<Obligation> }) => {
            console.log('Update Obligation Not Implemented specifically on backend yet');
            return true;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] })
    });


    return {
        policies: policiesQuery.data || [],
        isLoading: policiesQuery.isLoading,
        error: policiesQuery.error ? (policiesQuery.error as Error).message : null,
        refresh: () => policiesQuery.refetch(),

        createPolicy: createPolicyMutation.mutateAsync,
        publishPolicy: (id: string, version: string) => publishPolicyMutation.mutateAsync({ id, version }),
        addObligation: (policyId: string, obligationData: Omit<Obligation, 'id'>) => addObligationMutation.mutateAsync({ policyId, obligationData }),
        updateObligation: (policyId: string, obligationId: string, updates: Partial<Obligation>) => updateObligationMutation.mutateAsync({ policyId, obligationId, updates }),

        // Expose mutations for loading states if needed
        isCreating: createPolicyMutation.isPending,
        isPublishing: publishPolicyMutation.isPending
    };
}
