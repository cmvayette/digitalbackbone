import { describe, it, expect } from 'vitest';
import { validateProcess } from './ProcessValidator';
import { HolonType } from '@som/shared-types';
import { Process } from '../types/process';

describe('ProcessValidator', () => {
    const baseProcess: Process = {
        id: 'proc-1',
        type: HolonType.Process,
        createdAt: new Date(),
        createdBy: 'user',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: 'Test Process',
            description: 'Test',
            inputs: [],
            outputs: [],
            estimatedDuration: 0,
            steps: []
        }
    };

    it('returns error if no steps exist', () => {
        const issues = validateProcess(baseProcess);
        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('at least one step');
    });

    it('validates missing title', () => {
        const process = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    { id: 's1', title: '', owner: 'pos-1', description: 'desc', obligations: [{ id: 'o1' }] }
                ]
            }
        } as Process;

        const issues = validateProcess(process);
        expect(issues.some(i => i.type === 'error' && i.message.includes('missing a title'))).toBe(true);
    });

    it('validates missing owner', () => {
        const process = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    { id: 's1', title: 'Step 1', owner: '', description: 'desc', obligations: [{ id: 'o1' }] }
                ]
            }
        } as Process;

        const issues = validateProcess(process);
        expect(issues.some(i => i.type === 'error' && i.message.includes('assigned owner'))).toBe(true);
    });

    it('warns on missing obligations', () => {
        const process = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    { id: 's1', title: 'Step 1', owner: 'pos-1', description: 'desc', obligations: [] }
                ]
            }
        } as Process;

        const issues = validateProcess(process);
        expect(issues.some(i => i.type === 'warning' && i.message.includes('no linked obligations'))).toBe(true);
    });
});
