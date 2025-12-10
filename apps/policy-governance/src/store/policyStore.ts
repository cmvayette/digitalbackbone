import { create } from 'zustand';
import { PolicyDocument, Obligation } from '../types/policy';

interface PolicyState {
    policies: PolicyDocument[];
    currentPolicy: PolicyDocument | null;

    // Actions
    setPolicies: (policies: PolicyDocument[]) => void;
    selectPolicy: (id: string) => void;

    // Local Updates (Synchronous/Optimistic)
    updatePolicy: (id: string, updates: Partial<PolicyDocument>) => void;
    updateObligation: (policyId: string, obligationId: string, updates: Partial<Obligation>) => void;

    // Server actions (create, publish) are handled via useExternalPolicyData hook
}

export const usePolicyStore = create<PolicyState>((set) => ({
    policies: [],
    currentPolicy: null,

    setPolicies: (policies) => set((state) => {
        // Preserve selection and merge if needed? 
        // For now, full replace but try to keep currentPolicy Ref if ID matches
        const currentId = state.currentPolicy?.id;
        const updatedCurrent = currentId ? policies.find(p => p.id === currentId) || null : null;
        return {
            policies,
            // If we have local unsaved changes in currentPolicy, we might lose them here if we just replace.
            // But since this is a migration, we accept "Server Wins" for now.
            currentPolicy: updatedCurrent || state.currentPolicy
        };
    }),

    selectPolicy: (id) => set((state) => ({
        currentPolicy: state.policies.find(p => p.id === id) || null
    })),

    updatePolicy: (id, updates) => set((state) => ({
        policies: state.policies.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
        currentPolicy: state.currentPolicy?.id === id
            ? { ...state.currentPolicy, ...updates, updatedAt: new Date().toISOString() }
            : state.currentPolicy
    })),

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
    }))
}));
