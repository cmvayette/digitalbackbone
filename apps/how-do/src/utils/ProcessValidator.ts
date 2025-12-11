import type { Process, ProcessStep } from '../types/process';
import * as SemanticLinter from '@som/semantic-linter/runtime';
// Extract for easier usage, while handling potential CJS interop issues
const { validateProcess: validateProcessRules } = SemanticLinter;
// ValidationViolation is a type, need to access differently or just use any if strictly needed, but types might work from module
import type { ValidationViolation } from '@som/semantic-linter/runtime';

export interface ValidationIssue {
    type: 'error' | 'warning';
    stepId?: string;
    message: string;
}

export const validateProcess = (process: Process): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // 1. Run Semantic Linter Rules (Dead Links, Cycles)
    const ruleViolations = validateProcessRules(process);

    ruleViolations.forEach(v => {
        // Map path to stepId if possible. e.g. ['steps', 'step-1', ...]
        let stepId = undefined;
        if (v.path[0] === 'steps' && v.path[1]) {
            stepId = v.path[1];
        }

        issues.push({
            type: v.level,
            stepId,
            message: v.message // e.g. "Step 'A' points to non-existent..."
        });
    });

    // 2. Run Local Completeness Checks (Legacy/UI specific)
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

