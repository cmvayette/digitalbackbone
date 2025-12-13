import { describe, it, expect, vi } from 'vitest';
import { useDriftDetection, DriftType } from './useDriftDetection';
import { renderHook } from '@testing-library/react';
import { HolonType } from '@som/shared-types';
import { Process } from '../types/process';

// Mock dependencies
vi.mock('@som/api-client', () => ({
    useExternalPolicyData: () => ({
        obligations: [
            { id: 'obl-1', statement: 'Statement 1', assignedTo: 'pos-2', criticality: 'high' }
        ],
        loading: false
    }),
    useExternalOrgData: () => ({
        getCandidates: () => [{ id: 'pos-1' }, { id: 'pos-2' }],
        isLoading: false
    })
}));

vi.mock('./useGovernanceConfig', () => ({
    useGovernanceConfig: () => ({
        config: {
            properties: {
                drift: {
                    staleDays: 30, // Using 30 to match test cases if any rely on it, but default logic is 90. Let's stick to simple defaults.
                    requiredObligationCriticality: 'high',
                    inspectionMode: false
                }
            }
        }
    })
}));

describe('useDriftDetection', () => {
    const baseProcess: Process = {
        id: 'proc-1',
        type: HolonType.Process,
        createdAt: new Date(),
        createdBy: 'user',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: 'Test',
            description: '',
            inputs: [],
            outputs: [],
            estimatedDuration: 0,
            tags: [],
            steps: []
        }
    };

    it('detects deprecated obligations', () => {
        const process = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    {
                        id: 's1',
                        title: 'Step',
                        description: '',
                        owner: 'pos-1',
                        obligations: [{ id: 'non-existent-obl' }]
                    }
                ]
            }
        } as Process;

        const { result } = renderHook(() => useDriftDetection(process));

        expect(result.current.hasDrift).toBe(true);
        expect(result.current.issues[0].type).toBe(DriftType.Deprecated);
    });

    it('detects missing high-criticality obligations for owner', () => {
        // Mock policy has 'obl-1' assigned to 'pos-1' with 'high' criticality
        const process = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    {
                        id: 's1',
                        title: 'Step',
                        description: '',
                        owner: 'pos-2',
                        obligations: [] // Missing obl-1
                    }
                ]
            }
        } as Process;

        const { result } = renderHook(() => useDriftDetection(process));

        expect(result.current.hasDrift).toBe(true);
        const issue = result.current.issues.find(i => i.type === DriftType.MissingObligation);
        expect(issue).toBeDefined();
        expect(issue?.obligationId).toBe('obl-1');
    });

    it('returns no drift for compliant process', () => {
        const process = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    {
                        id: 's1',
                        title: 'Step',
                        description: '',
                        owner: 'pos-1',
                        obligations: [{ id: 'obl-1' }] // Compliant
                    }
                ]
            }
        } as Process;

        const { result } = renderHook(() => useDriftDetection(process));
        expect(result.current.hasDrift).toBe(false);
    });
});
