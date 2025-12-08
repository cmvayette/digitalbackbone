import { describe, it, expect } from 'vitest';
import { calculateProcessHealth } from './health-calculator';
import { HolonType } from '@som/shared-types';
import type { Process } from '../types/process';

describe('calculateProcessHealth', () => {
    const baseProcess: Process = {
        id: 'test-proc',
        type: HolonType.Process,
        createdAt: new Date(), // Fresh
        createdBy: 'tester',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: 'Test Process',
            description: 'Test',
            inputs: [],
            outputs: [],
            estimatedDuration: 0,
            steps: [
                { id: 's1', title: 'S1', description: 'Desc', owner: 'pos-1', obligations: [{ id: 'obl-1' }] },
                { id: 's2', title: 'S2', description: 'Desc', owner: 'pos-1', obligations: [{ id: 'obl-2' }] }
            ]
        }
    };

    it('returns perfect score for perfect process', () => {
        const result = calculateProcessHealth(baseProcess);
        expect(result.score).toBe(100);
        expect(result.status).toBe('healthy');
    });

    it('penalizes for lack of obligations', () => {
        const poorComplianceProcess = {
            ...baseProcess,
            properties: {
                ...baseProcess.properties,
                steps: [
                    { id: 's1', title: 'S1', description: 'Desc', owner: 'pos-1', obligations: [] }, // No obligations
                    { id: 's2', title: 'S2', description: 'Desc', owner: 'pos-1', obligations: [] }
                ]
            }
        };
        // Compliance 0 * 0.4 = 0 contribution. Lost 40 points.
        // Freshness 100 * 0.3 = 30
        // Completeness 100 * 0.3 = 30
        // Total 60
        const result = calculateProcessHealth(poorComplianceProcess);
        expect(result.score).toBe(60);
        expect(result.status).toBe('at-risk');
    });

    it('penalizes for stale processes', () => {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - 100); // 100 days old (>90) -> score 40

        const staleProcess = {
            ...baseProcess,
            createdAt: staleDate
        };

        // Freshness 40 * 0.3 = 12
        // Completeness 100 * 0.3 = 30
        // Compliance 100 * 0.4 = 40
        // Total 82
        const result = calculateProcessHealth(staleProcess);
        expect(result.score).toBe(82);
    });

    it('applies drift penalty', () => {
        // Base 100 - 20 = 80
        const result = calculateProcessHealth(baseProcess, true); // hasDrift = true
        expect(result.score).toBe(80);
    });
});
