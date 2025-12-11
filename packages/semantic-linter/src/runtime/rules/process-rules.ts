import { Process, ProcessStep } from '@som/shared-types';
import { ValidationViolation, ProcessValidator } from '../validator';

export const noDeadLinks: ProcessValidator = (process: Process): ValidationViolation[] => {
    const violations: ValidationViolation[] = [];
    const stepIds = new Set(process.properties.steps.map(s => s.id));

    process.properties.steps.forEach(step => {
        if (step.nextStepId && !stepIds.has(step.nextStepId)) {
            violations.push({
                ruleCode: 'no-dead-links',
                message: `Step '${step.title}' points to non-existent next step '${step.nextStepId}'`,
                path: ['steps', step.id, 'nextStepId'],
                level: 'error'
            });
        }
    });

    return violations;
};

export const noCircularDependencies: ProcessValidator = (process: Process): ValidationViolation[] => {
    // Simple cycle detection for a graph
    // convert to adjacency list
    const violations: ValidationViolation[] = [];
    const adj = new Map<string, string[]>();

    process.properties.steps.forEach(step => {
        if (step.nextStepId) {
            adj.set(step.id, [step.nextStepId]);
        }
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function detectCycle(nodeId: string): boolean {
        // If node doesn't exist (dead link), we assume no cycle here
        if (!process.properties.steps.find(s => s.id === nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (detectCycle(neighbor)) return true;
            } else if (recursionStack.has(neighbor)) {
                return true;
            }
        }

        recursionStack.delete(nodeId);
        return false;
    }

    // Run DFS from each node in case of disconnected components
    for (const step of process.properties.steps) {
        if (!visited.has(step.id)) {
            if (detectCycle(step.id)) {
                violations.push({
                    ruleCode: 'no-circular-dependencies',
                    message: `Circular dependency detected involving step '${step.title}'`,
                    path: ['steps', step.id],
                    level: 'error'
                });
                break; // One cycle invalidates enough for now
            }
        }
    }

    return violations;
};
