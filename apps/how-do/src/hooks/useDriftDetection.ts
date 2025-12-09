import { useMemo } from 'react';
import type { Process } from '../types/process';
import { useExternalPolicyData } from '@som/api-client';
import { useExternalOrgData } from '@som/api-client';

export enum DriftType {
    PolicyUpdate = 'POLICY_UPDATE',
    MissingObligation = 'MISSING_OBLIGATION',
    Deprecated = 'DEPRECATED',
    OrphanedOwner = 'ORPHANED_OWNER'
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

    const issues = useMemo(() => {
        const detectedIssues: DriftIssue[] = [];

        // Avoid drift checks if context is still loading
        if (isOrgLoading) return [];

        const validOwners = getCandidates().map(c => c.id);

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
        // If a step owner has obligations assigned in policy that are NOT linked to the step
        process.properties.steps.forEach(step => {
            if (!step.owner) return;

            // Find all obligations assigned to this owner in the policy
            const expectedObligations = policyObligations.filter(o => o.assignedTo === step.owner);

            expectedObligations.forEach(expected => {
                const isLinked = step.obligations?.some(link => link.id === expected.id);

                // If the owner matches AND the criticality is high, we expect it to be linked
                // This is a naive heuristic: "All high crit obligations for a role must be explicitly linked/handled"
                if (!isLinked && expected.criticality === 'high') {
                    detectedIssues.push({
                        type: DriftType.MissingObligation,
                        stepId: step.id,
                        obligationId: expected.id,
                        message: `High priority obligation ${expected.id} ("${expected.statement}") assigned to ${step.owner} is not linked.`,
                        severity: 'medium'
                    });
                }
            });
        });

        return detectedIssues;
    }, [process, policyObligations, getCandidates, isOrgLoading]);

    return { issues, hasDrift: issues.length > 0 };
};
