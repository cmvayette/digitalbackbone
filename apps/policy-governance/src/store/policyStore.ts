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

    createPolicy: (policyData) => set((state) => {
        const newPolicy: PolicyDocument = {
            ...policyData,
            id: `pol-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return { policies: [...state.policies, newPolicy] };
    }),

    updatePolicy: (id, updates) => set((state) => ({
        policies: state.policies.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
        currentPolicy: state.currentPolicy?.id === id
            ? { ...state.currentPolicy, ...updates, updatedAt: new Date().toISOString() }
            : state.currentPolicy
    })),

    publishPolicy: (id) => set((state) => {
        const policy = state.policies.find(p => p.id === id);
        if (!policy) return {};

        const publishedPolicy: PolicyDocument = {
            ...policy,
            status: 'active',
            effectiveDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // In a real app, we'd keep the old version as a separate record. 
        // For MVP, we just update the current one to Active.
        // Future: Create a new 'Draft' version linked to this one?

        return {
            policies: state.policies.map(p => p.id === id ? publishedPolicy : p),
            currentPolicy: state.currentPolicy?.id === id ? publishedPolicy : state.currentPolicy
        };
    }),

    deletePolicy: (id) => set((state) => ({
        policies: state.policies.filter(p => p.id !== id),
        currentPolicy: state.currentPolicy?.id === id ? null : state.currentPolicy
    })),

    addObligation: (policyId, obligationData) => set((state) => {
        const newObligation: Obligation = {
            ...obligationData,
            id: `obl-${Date.now()}`
        };
        return {
            policies: state.policies.map(p => {
                if (p.id !== policyId) return p;
                return {
                    ...p,
                    obligations: [...p.obligations, newObligation],
                    updatedAt: new Date().toISOString()
                };
            }),
            currentPolicy: state.currentPolicy?.id === policyId
                ? {
                    ...state.currentPolicy,
                    obligations: [...state.currentPolicy.obligations, newObligation],
                    updatedAt: new Date().toISOString()
                }
                : state.currentPolicy
        };
    }),

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
