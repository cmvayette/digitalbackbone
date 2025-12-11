import { Process } from '@som/shared-types';
import { noDeadLinks, noCircularDependencies } from './rules/process-rules';

export interface ValidationRule {
    code: string;
    message: string;
    level: 'error' | 'warning';
}

export interface ValidationViolation {
    ruleCode: string;
    message: string;
    path: string[]; // e.g., ['steps', 'step-1', 'transitions']
    level: 'error' | 'warning';
}

export interface ValidationResult {
    passed: boolean;
    violations: ValidationViolation[];
}

export type ProcessValidator = (process: Process) => ValidationViolation[];

export class Validator {
    private rules: ProcessValidator[] = [];

    registerRule(rule: ProcessValidator) {
        this.rules.push(rule);
    }

    validate(process: Process): ValidationResult {
        const violations: ValidationViolation[] = [];
        for (const rule of this.rules) {
            violations.push(...rule(process));
        }

        return {
            passed: violations.every(v => v.level !== 'error'),
            violations
        };
    }
}

export const validateProcess = (process: Process): ValidationViolation[] => {
    const validator = new Validator();
    validator.registerRule(noDeadLinks);
    validator.registerRule(noCircularDependencies);
    return validator.validate(process).violations;
};
