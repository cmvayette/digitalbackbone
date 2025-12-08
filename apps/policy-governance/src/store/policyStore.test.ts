import { describe, it, expect, beforeEach } from 'vitest';
import { usePolicyStore } from './policyStore';

describe('policyStore', () => {
    beforeEach(() => {
        usePolicyStore.setState({
            policies: [],
            currentPolicy: null
        });
    });

    it('creates a policy', () => {
        const store = usePolicyStore.getState();
        store.createPolicy({
            title: 'Test Policy',
            documentType: 'Instruction',
            version: '1.0',
            status: 'draft',
            sections: [],
            obligations: []
        });

        expect(usePolicyStore.getState().policies).toHaveLength(1);
        expect(usePolicyStore.getState().policies[0].title).toBe('Test Policy');
    });

    it('adds an obligation to a policy', () => {
        const store = usePolicyStore.getState();
        store.createPolicy({
            title: 'Test Policy',
            documentType: 'Instruction',
            version: '1.0',
            status: 'draft',
            sections: [],
            obligations: []
        });

        const policyId = usePolicyStore.getState().policies[0].id;

        store.addObligation(policyId, {
            statement: 'Must do X',
            actor: { id: 'pos-1', name: 'Commander', type: 'Position' },
            criticality: 'high',
            status: 'draft'
        });

        const updatedPolicy = usePolicyStore.getState().policies[0];
        expect(updatedPolicy.obligations).toHaveLength(1);
        expect(updatedPolicy.obligations[0].statement).toBe('Must do X');
    });

    it('updates an obligation', () => {
        const store = usePolicyStore.getState();
        store.createPolicy({
            title: 'Test Policy',
            documentType: 'Instruction',
            version: '1.0',
            status: 'draft',
            sections: [],
            obligations: []
        });
        const policyId = usePolicyStore.getState().policies[0].id;
        store.addObligation(policyId, {
            statement: 'Must do X',
            actor: { id: 'pos-1', name: 'Commander', type: 'Position' },
            criticality: 'high',
            status: 'draft'
        });
        const obligationId = usePolicyStore.getState().policies[0].obligations[0].id;

        store.updateObligation(policyId, obligationId, { statement: 'Must do Y' });

        expect(usePolicyStore.getState().policies[0].obligations[0].statement).toBe('Must do Y');
    });
});
