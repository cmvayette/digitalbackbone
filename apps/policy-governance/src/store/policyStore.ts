import { create } from 'zustand';
import { PolicyDocument, Obligation } from '../types/policy';

interface PolicyState {
    policies: PolicyDocument[];
    currentPolicy: PolicyDocument | null;
    policyVersionHistory: Map<string, PolicyDocument[]>; // policyId -> versions

    // Actions
    setPolicies: (policies: PolicyDocument[]) => void;
    selectPolicy: (id: string) => void;

    // Local Updates (Synchronous/Optimistic)
    updatePolicy: (id: string, updates: Partial<PolicyDocument>) => void;
    updateObligation: (policyId: string, obligationId: string, updates: Partial<Obligation>) => void;

    // Version History
    saveVersion: (policyId: string, version: PolicyDocument) => void;
    getVersionHistory: (policyId: string) => PolicyDocument[];
    getPreviousVersion: (policyId: string) => PolicyDocument | null;

    // Server actions (create, publish) are handled via useExternalPolicyData hook
}

export const usePolicyStore = create<PolicyState>((set, get) => ({
    policies: [],
    currentPolicy: null,
    policyVersionHistory: new Map(),

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
    })),

    saveVersion: (policyId, version) => set((state) => {
        const history = state.policyVersionHistory.get(policyId) || [];
        const newHistory = new Map(state.policyVersionHistory);
        newHistory.set(policyId, [...history, version]);
        return { policyVersionHistory: newHistory };
    }),

    getVersionHistory: (policyId) => {
        return get().policyVersionHistory.get(policyId) || [];
    },

    getPreviousVersion: (policyId) => {
        const history = get().policyVersionHistory.get(policyId) || [];
        // Return the second-to-last version (previous, not oldest)
        return history.length > 1 ? history[history.length - 2] : null;
    }
}));
