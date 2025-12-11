import { useMemo } from 'react';
import type { Process } from '../types/process';
import { useExternalPolicyData } from '@som/api-client';
import { useExternalOrgData } from '@som/api-client';
import { useGovernanceConfig } from './useGovernanceConfig';

export enum DriftType {
    PolicyUpdate = 'POLICY_UPDATE',
    MissingObligation = 'MISSING_OBLIGATION',
    Deprecated = 'DEPRECATED',
    OrphanedOwner = 'ORPHANED_OWNER',
    Stale = 'STALE_DATA'
}

export interface DriftIssue {
    type: DriftType;
    stepId?: string; // If specific to a step
    obligationId?: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
}

export const useDriftDetection = (process: Process) => {
    // Hooks for external context
    const { obligations: policyObligations } = useExternalPolicyData();
    const { getCandidates, isLoading: isOrgLoading } = useExternalOrgData();
    const { config } = useGovernanceConfig({ mode: 'mock' });

    const issues = useMemo(() => {
        const detectedIssues: DriftIssue[] = [];

        // Avoid drift checks if context is still loading
        if (isOrgLoading || !config) return [];

        const validOwners = getCandidates().map(c => c.id);
        const { staleDays, requiredObligationCriticality, inspectionMode } = config.properties.drift;

        // 0. Check for Staleness
        if (process.createdAt) { // Assuming createdAt is proxy for last updated in this mock
            const daysOld = (new Date().getTime() - new Date(process.createdAt).getTime()) / (1000 * 3600 * 24);
            if (daysOld > staleDays) {
                detectedIssues.push({
                    type: DriftType.Stale,
                    message: `Process hasn't been updated in ${Math.floor(daysOld)} days (Threshold: ${staleDays}d)`,
                    severity: 'medium'
                });
            }
        }

        // 1. Check for linked obligations that don't exist anymore or have changed
        process.properties.steps.forEach(step => {
            // A. Check for Structural Drift (Orphaned Steps)
            if (step.owner && !validOwners.includes(step.owner) && !step.owner.startsWith('agent-')) {
                detectedIssues.push({
                    type: DriftType.OrphanedOwner,
                    stepId: step.id,
                    message: `Step "${step.title}" is owned by "${step.owner}", which no longer exists in the Org Chart.`,
                    severity: 'high'
                });
            }

            if (!step.obligations) return;

            step.obligations.forEach(link => {
                const currentPolicy = policyObligations.find(p => p.id === link.id);

                if (!currentPolicy) {
                    detectedIssues.push({
                        type: DriftType.Deprecated,
                        stepId: step.id,
                        obligationId: link.id,
                        message: `Obligation ${link.id} linked to step "${step.title}" no longer exists in policy.`,
                        severity: 'high'
                    });
                }
            });
        });

        // 2. Check for Missing Obligations (Governance Check)
        const criticalityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
        const minLevel = criticalityLevels[requiredObligationCriticality] || 3;

        process.properties.steps.forEach(step => {
            if (!step.owner) return;

            // Find all obligations assigned to this owner in the policy
            const expectedObligations = policyObligations.filter(o => o.assignedTo === step.owner);

            expectedObligations.forEach(expected => {
                const isLinked = step.obligations?.some(link => link.id === expected.id);
                const obligLevel = criticalityLevels[expected.criticality as keyof typeof criticalityLevels] || 1;

                // IF (Not Linked) AND (Level >= Threshold OR InspectionMode is ON)
                if (!isLinked && (obligLevel >= minLevel || inspectionMode)) {
                    detectedIssues.push({
                        type: DriftType.MissingObligation,
                        stepId: step.id,
                        obligationId: expected.id,
                        message: `Priority obligation ${expected.id} ("${expected.statement}") assigned to ${step.owner} is not linked.`,
                        severity: expected.criticality === 'high' ? 'high' : 'medium'
                    });
                }
            });
        });

        return detectedIssues;
    }, [process, policyObligations, getCandidates, isOrgLoading, config]);

    return { issues, hasDrift: issues.length > 0 };
};
