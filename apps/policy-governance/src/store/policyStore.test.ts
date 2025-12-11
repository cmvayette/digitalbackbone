import { describe, it, expect, beforeEach } from 'vitest';
import { usePolicyStore } from './policyStore';
import type { PolicyDocument } from '../types/policy';

describe('policyStore', () => {
    beforeEach(() => {
        usePolicyStore.setState({
            policies: [],
            currentPolicy: null
        });
    });

    it('sets policies', () => {
        const store = usePolicyStore.getState();
        const policies: PolicyDocument[] = [{
            id: '1',
            title: 'Test',
            obligations: [],
            documentType: 'Instruction',
            version: '1.0',
            status: 'draft',
            sections: [],
            createdAt: '',
            updatedAt: ''
        }];
        store.setPolicies(policies);
        expect(usePolicyStore.getState().policies).toHaveLength(1);
    });

    it('updates a policy locally', () => {
        usePolicyStore.getState().setPolicies([{
            id: 'p1',
            title: 'Old Title',
            documentType: 'Instruction',
            version: '1.0',
            status: 'draft',
            sections: [],
            obligations: [],
            createdAt: '',
            updatedAt: ''
        }]);

        usePolicyStore.getState().updatePolicy('p1', { title: 'New Title' });

        expect(usePolicyStore.getState().policies[0].title).toBe('New Title');
    });

    it('updates an obligation locally', () => {
        usePolicyStore.getState().setPolicies([{
            id: 'p1',
            title: 'Test',
            documentType: 'Instruction',
            version: '1.0',
            status: 'draft',
            sections: [],
            obligations: [{
                id: 'o1',
                statement: 'Old Statement',
                actor: { id: 'a1', name: 'Actor', type: 'Person' },
                criticality: 'medium',
                status: 'draft'
            }],
            createdAt: '',
            updatedAt: ''
        }]);

        usePolicyStore.getState().updateObligation('p1', 'o1', { statement: 'New Statement' });

        expect(usePolicyStore.getState().policies[0].obligations[0].statement).toBe('New Statement');
    });
});
