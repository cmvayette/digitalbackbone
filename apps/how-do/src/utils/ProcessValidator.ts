import type { Process, ProcessStep } from '../types/process';

export interface ValidationIssue {
    type: 'error' | 'warning';
    stepId?: string;
    message: string;
}

export const validateProcess = (process: Process): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    if (!process.properties.steps || process.properties.steps.length === 0) {
        issues.push({
            type: 'error',
            message: 'Process must have at least one step.'
        });
        return issues;
    }

    process.properties.steps.forEach((step: ProcessStep, index: number) => {
        // Error: Missing Title
        if (!step.title || step.title.trim() === '') {
            issues.push({
                type: 'error',
                stepId: step.id,
                message: `Step ${index + 1} is missing a title.`
            });
        }

        // Error: Missing Owner
        if (!step.owner || step.owner.trim() === '') {
            issues.push({
                type: 'error',
                stepId: step.id,
                message: `Step "${step.title || index + 1}" must have an assigned owner.`
            });
        }

        // Warning: No Description
        if (!step.description || step.description.trim() === '') {
            issues.push({
                type: 'warning',
                stepId: step.id,
                message: `Step "${step.title || index + 1}" should have a description.`
            });
        }

        // Warning: No Obligations (Governance Check)
        if (!step.obligations || step.obligations.length === 0) {
            issues.push({
                type: 'warning',
                stepId: step.id,
                message: `Step "${step.title || index + 1}" has no linked obligations.`
            });
        }
    });

    return issues;
};
