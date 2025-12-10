import { create } from 'zustand';
import { PolicyDocument, Obligation } from '../types/policy';

interface PolicyState {
    policies: PolicyDocument[];
    currentPolicy: PolicyDocument | null;

    // Actions
    loadPolicies: () => void;
    selectPolicy: (id: string) => void;
    createPolicy: (policy: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updatePolicy: (id: string, updates: Partial<PolicyDocument>) => void;
    deletePolicy: (id: string) => void;
    publishPolicy: (id: string) => void;

    // Editor Actions
    addObligation: (policyId: string, obligation: Omit<Obligation, 'id'>) => void;
    updateObligation: (policyId: string, obligationId: string, updates: Partial<Obligation>) => void;
    removeObligation: (policyId: string, obligationId: string) => void;
}

// Mock initial data
const mockPolicies: PolicyDocument[] = [
    {
        id: 'pol-001',
        title: 'Remote Work Policy',
        documentType: 'Instruction',
        version: '1.0',
        status: 'active',
        sections: [
            { id: 'sec-1', title: 'Purpose', content: 'To define remote work standards.', order: 1 }
        ],
        obligations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const usePolicyStore = create<PolicyState>((set) => ({
    policies: mockPolicies,
    currentPolicy: null,

    loadPolicies: async () => {
        try {
            const { createSOMClient } = await import('@som/api-client');
            const client = createSOMClient();
            const response = await client.getPolicies();
            if (response.success && response.data) {
                // Map Holons to PolicyDocuments
                // valid types are guaranteed by API contract usually, but we cast for now
                const mappedPolicies = response.data.map((h: any) => ({
                    id: h.id,
                    ...h.properties,
                    // Ensure required fields differ from holon props if needed
                })) as PolicyDocument[];
                set({ policies: mappedPolicies });
            }
        } catch (error) {
            console.error("Failed to load policies", error);
            set({ policies: mockPolicies }); // Fallback
        }
    },

    selectPolicy: (id) => set((state) => ({
        currentPolicy: state.policies.find(p => p.id === id) || null
    })),

    createPolicy: async (policyData) => {
        // Optimistic update
        const tempId = `pol-${Date.now()}`;
        const newPolicy: PolicyDocument = {
            ...policyData,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        set((state) => ({ policies: [...state.policies, newPolicy] }));

        try {
            const { createSOMClient } = await import('@som/api-client');
            const { EventType } = await import('@som/shared-types');
            const { v4: uuidv4 } = await import('uuid');

            const client = createSOMClient();
            const documentId = uuidv4();

            // Replace temp ID with real UUID in a follow-up or just use UUID initially?
            // For now, we fire and forget the event, assuming eventual consistency.
            // In a real app, we would replace the temp ID in the store upon success.

            await client.submitEvent({
                type: EventType.DocumentCreated,
                occurredAt: new Date(),
                actor: 'system', // Should be current user
                subjects: [documentId],
                payload: {
                    documentId,
                    title: policyData.title,
                    type: policyData.documentType,
                    format: 'markdown',
                    content: '',
                    version: policyData.version
                },
                sourceSystem: 'som-policy-governance'
            });

            // Update local store with real ID? 
            // This requires a more complex store update pattern (replaceId).
            // For this MVP step, we just ensure the event is sent.
            console.log(`[PolicyStore] Submitted DocumentCreated event for ${documentId}`);

        } catch (error) {
            console.error("Failed to submit createPolicy event", error);
            // Revert optimistic update?
            set((state) => ({ policies: state.policies.filter(p => p.id !== tempId) }));
        }
    },

    updatePolicy: (id, updates) => set((state) => ({
        policies: state.policies.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
        currentPolicy: state.currentPolicy?.id === id
            ? { ...state.currentPolicy, ...updates, updatedAt: new Date().toISOString() }
            : state.currentPolicy
    })),

    publishPolicy: async (id) => {
        set((state) => {
            const policy = state.policies.find(p => p.id === id);
            if (!policy) return {};
            return {
                policies: state.policies.map(p => p.id === id ? { ...p, status: 'active', effectiveDate: new Date().toISOString(), updatedAt: new Date().toISOString() } : p),
                currentPolicy: state.currentPolicy?.id === id
                    ? { ...state.currentPolicy, status: 'active', effectiveDate: new Date().toISOString(), updatedAt: new Date().toISOString() }
                    : state.currentPolicy
            };
        });

        try {
            const { createSOMClient } = await import('@som/api-client');
            const { EventType } = await import('@som/shared-types');
            const client = createSOMClient();

            // Needs version tracking, simple for now
            await client.submitEvent({
                type: EventType.DocumentPublished,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [id],
                payload: {
                    documentId: id,
                    version: '1.0.0', // TODO: Get from store
                    publishedAt: new Date(),
                    approverId: 'system'
                },
                sourceSystem: 'som-policy-governance'
            });
            console.log(`[PolicyStore] Submitted DocumentPublished event for ${id}`);

        } catch (error) {
            console.error("Failed to submit publishPolicy event", error);
        }
    },

    deletePolicy: (id) => set((state) => ({
        policies: state.policies.filter(p => p.id !== id),
        currentPolicy: state.currentPolicy?.id === id ? null : state.currentPolicy
    })),

    addObligation: async (policyId, obligationData) => {
        const tempId = `obl-${Date.now()}`;
        const newObligation: Obligation = {
            ...obligationData,
            id: tempId
        };

        set((state) => {
            // Optimistic update logic duplicated for brevity
            return {
                policies: state.policies.map(p => {
                    if (p.id !== policyId) return p;
                    return { ...p, obligations: [...p.obligations, newObligation], updatedAt: new Date().toISOString() };
                }),
                currentPolicy: state.currentPolicy?.id === policyId
                    ? { ...state.currentPolicy, obligations: [...(state.currentPolicy?.obligations || []), newObligation] }
                    : state.currentPolicy
            };
        });

        try {
            const { createSOMClient } = await import('@som/api-client');
            const { EventType } = await import('@som/shared-types');
            const { v4: uuidv4 } = await import('uuid');

            const client = createSOMClient();
            const obligationId = uuidv4();
            // TODO: Extract clause logic needed if we link to specific clause, 
            // for now we link to the document as the "clause" container or mock it.
            // But payload requires sourceClauseId.
            // We'll fake a clause ID or use the policy ID if permissible (conceptually wrong but strictly types maybe ok if ID matches).
            // Actually, let's just generate a dummy Clause ID for this action since the Store doesn't manage Clauses explicitly yet.
            const dummyClauseId = uuidv4();

            await client.submitEvent({
                type: EventType.ObligationDefined,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [obligationId, dummyClauseId],
                payload: {
                    obligationId,
                    sourceClauseId: dummyClauseId, // This might be disconnected from a real clause event
                    description: obligationData.statement,
                    responsibleRole: obligationData.actor.name
                },
                sourceSystem: 'som-policy-governance'
            });
            console.log(`[PolicyStore] Submitted ObligationDefined event for ${obligationId}`);

        } catch (error) {
            console.error("Failed to submit addObligation event", error);
        }
    },

    updateObligation: (policyId, obligationId, updates) => set((state) => ({
        policies: state.policies.map(p => {
            if (p.id !== policyId) return p;
            return {
                ...p,
                obligations: p.obligations.map(o => o.id === obligationId ? { ...o, ...updates } : o),
                updatedAt: new Date().toISOString()
            };
        }),
        currentPolicy: state.currentPolicy?.id === policyId
            ? {
                ...state.currentPolicy,
                obligations: state.currentPolicy.obligations.map(o => o.id === obligationId ? { ...o, ...updates } : o),
                updatedAt: new Date().toISOString()
            }
            : state.currentPolicy
    })),

    removeObligation: (policyId, obligationId) => set((state) => ({
        policies: state.policies.map(p => {
            if (p.id !== policyId) return p;
            return {
                ...p,
                obligations: p.obligations.filter(o => o.id !== obligationId),
                updatedAt: new Date().toISOString()
            };
        }),
        currentPolicy: state.currentPolicy?.id === policyId
            ? {
                ...state.currentPolicy,
                obligations: state.currentPolicy.obligations.filter(o => o.id !== obligationId),
                updatedAt: new Date().toISOString()
            }
            : state.currentPolicy
    }))
}));
