import { useMemo, useState, useEffect, useCallback } from 'react';
import { createSOMClient, SOMClientOptions } from '@som/api-client';
import { HolonType, EventType } from '@som/shared-types';
import { PolicyDocument, Obligation } from '../types/policy';
import { v4 as uuidv4 } from 'uuid';

export function useExternalPolicyData(options?: SOMClientOptions) {
    const [policies, setPolicies] = useState<PolicyDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create a stable client instance based on options
    const client = useMemo(() => {
        return createSOMClient(
            options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
            options
        );
    }, [options?.mode]);

    const fetchPolicies = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Documents
            const response = await client.queryHolons(HolonType.Document);

            if (response.success && response.data) {
                // Map Holons to PolicyDocuments
                // In a real app, we would also fetch Obligations (Constraints) and link them
                // For now, we assume obligations are embedded or fetched separately (simplified for this MVP)
                const mappedPolicies = response.data.map((h: any) => ({
                    id: h.id,
                    title: h.properties.title || 'Untitled Policy',
                    documentType: h.properties.type || 'Instruction',
                    version: h.properties.version || '0.1',
                    status: h.properties.status || 'draft',
                    sections: h.properties.content ? [{ id: 'sec-1', title: 'Content', content: h.properties.content, order: 1 }] : [],
                    obligations: [], // TODO: Fetch obligations
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })) as PolicyDocument[];

                setPolicies(mappedPolicies);
                setError(null);
            } else if (!response.success) {
                // In mock mode, queryHolons might return empty if no seed data, 
                // but client.getPolicies() (if it existed) or custom mock data would be better.
                // The mock client currently generates random data.
                const mappedPolicies = (response.data || []).map((h: any) => ({
                    id: h.id,
                    title: h.properties.title || 'Untitled Policy',
                    documentType: h.properties.type || 'Instruction',
                    version: h.properties.version || '0.1',
                    status: h.properties.status || 'draft',
                    sections: [],
                    obligations: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })) as PolicyDocument[];
                setPolicies(mappedPolicies);
            }
        } catch (err) {
            console.error("Failed to fetch policies", err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    // Initial Fetch
    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    // --- Mutations ---

    const createPolicy = useCallback(async (policyData: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
        const documentId = uuidv4();
        try {
            await client.submitEvent({
                type: EventType.DocumentCreated,
                occurredAt: new Date(),
                actor: 'system', // TODO: Get from auth context
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

            // Optimistic update or refresh?
            // Refreshing is safer for consistency
            await fetchPolicies();
            return documentId;
        } catch (e) {
            console.error("Failed to create policy", e);
            throw e;
        }
    }, [client, fetchPolicies]);

    const publishPolicy = useCallback(async (id: string, version: string) => {
        try {
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
            await fetchPolicies();
        } catch (e) {
            console.error("Failed to publish policy", e);
            throw e;
        }
    }, [client, fetchPolicies]);

    const addObligation = useCallback(async (policyId: string, obligationData: Omit<Obligation, 'id'>) => {
        const obligationId = uuidv4();
        // Constraints are complex; usually need a separate Holon.
        // For MVP, just firing the event.
        const sourceClauseId = uuidv4(); // Dummy for now

        try {
            await client.submitEvent({
                type: EventType.ObligationDefined,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [obligationId],
                // We should link this to the policy via subject or payload
                // but for now we just log it.
                payload: {
                    obligationId,
                    policyId, // Added policyId to payload to silence unused var and improve data
                    sourceClauseId,
                    description: obligationData.statement,
                    responsibleRole: obligationData.actor.name
                },
                sourceSystem: 'som-policy-app'
            });
            // Note: This won't automatically link to the Policy in the Query model unless 
            // the backend projects the relationship. 
            // In a real app we'd submit a Relationship event too.
            await fetchPolicies();
        } catch (e) {
            console.error("Failed to add obligation", e);
            throw e;
        }
    }, [client, fetchPolicies]);

    const updatePolicy = useCallback(async (id: string, updates: Partial<PolicyDocument>) => {
        try {
            await client.submitEvent({
                type: EventType.DocumentUpdated, // Assuming this exists or mapping to generic update
                occurredAt: new Date(),
                actor: 'system',
                subjects: [id],
                payload: {
                    documentId: id,
                    changes: JSON.stringify(updates)
                },
                sourceSystem: 'som-policy-app'
            });
            // We don't await fetch here to avoid jumping UI, just fire and forget or let polling handle it
        } catch (e) {
            console.error("Failed to update policy", e);
            throw e;
        }
    }, [client]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateObligation = useCallback(async (_policyId: string, obligationId: string, updates: Partial<Obligation>) => {
        try {
            // Mock implementation for now
            console.log('Updating obligation', obligationId, updates);
        } catch (e) {
            console.error("Failed to update obligation", e);
            throw e;
        }
    }, [client]);


    return {
        policies,
        isLoading,
        error,
        refresh: fetchPolicies,
        createPolicy,
        publishPolicy,
        updatePolicy,
        addObligation,
        updateObligation
    };
}
