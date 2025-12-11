import { describe, it, expect } from 'vitest';
import { noDeadLinks, noCircularDependencies } from './process-rules';
import { Process, HolonType } from '@som/shared-types';

const mockProcess = (steps: any[]): Process => ({
    id: 'proc-1',
    type: HolonType.Process,
    status: 'active',
    createdAt: new Date(),
    createdBy: 'user',
    sourceDocuments: [],
    properties: {
        name: 'Test Process',
        description: '',
        inputs: [],
        outputs: [],
        tags: [],
        estimatedDuration: 100,
        steps: steps
    }
});

describe('Process Rules', () => {
    describe('noDeadLinks', () => {
        it('should pass for valid links', () => {
            const process = mockProcess([
                { id: '1', title: 'Start', nextStepId: '2', owner: 'me', obligations: [] },
                { id: '2', title: 'End', owner: 'me', obligations: [] }
            ]);
            const violations = noDeadLinks(process);
            expect(violations).toHaveLength(0);
        });

        it('should fail for dead link', () => {
            const process = mockProcess([
                { id: '1', title: 'Start', nextStepId: '3', owner: 'me', obligations: [] },
                { id: '2', title: 'End', owner: 'me', obligations: [] }
            ]);
            const violations = noDeadLinks(process);
            expect(violations).toHaveLength(1);
            expect(violations[0].ruleCode).toBe('no-dead-links');
            expect(violations[0].path).toContain('nextStepId');
        });
    });

    describe('noCircularDependencies', () => {
        it('should pass for linear flow', () => {
            const process = mockProcess([
                { id: '1', nextStepId: '2', title: 'A', owner: 'me', obligations: [] },
                { id: '2', nextStepId: '3', title: 'B', owner: 'me', obligations: [] },
                { id: '3', title: 'C', owner: 'me', obligations: [] }
            ]);
            expect(noCircularDependencies(process)).toHaveLength(0);
        });

        it('should fail for direct cycle', () => {
            const process = mockProcess([
                { id: '1', nextStepId: '2', title: 'A', owner: 'me', obligations: [] },
                { id: '2', nextStepId: '1', title: 'B', owner: 'me', obligations: [] }
            ]);
            const violations = noCircularDependencies(process);
            expect(violations).toHaveLength(1);
            expect(violations[0].ruleCode).toBe('no-circular-dependencies');
        });

        it('should fail for indirect cycle', () => {
            const process = mockProcess([
                { id: '1', nextStepId: '2', title: 'A', owner: 'me', obligations: [] },
                { id: '2', nextStepId: '3', title: 'B', owner: 'me', obligations: [] },
                { id: '3', nextStepId: '1', title: 'C', owner: 'me', obligations: [] }
            ]);
            expect(noCircularDependencies(process)).toHaveLength(1);
        });
    });
});
