
import jsonLogic from 'json-logic-js';
import { Holon, Relationship, Event } from '@som/shared-types';

export type JsonLogicRule = Record<string, any>;

export interface EvaluationContext {
    target: Holon | Relationship | Event;
    params?: Record<string, any>; // Extra parameters like 'now', 'config', etc.
}

export class JsonLogicEvaluator {
    /**
     * Evaluate a rule against a context
     * @param rule - The JSON Logic rule
     * @param context - The context object (data)
     * @returns boolean - True if the rule passes (or returns truthy), false otherwise
     */
    evaluate(rule: JsonLogicRule, context: EvaluationContext): boolean {
        try {
            // We pass the entire context as the data object to json-logic
            // This allows rules to access "target.properties.rank" or "params.now"
            return jsonLogic.apply(rule, context) === true;
        } catch (error) {
            console.error('Error evaluating JSON Logic rule:', error);
            // In a strict security model, error = failure
            return false;
        }
    }

    /**
     * Validate that a rule is structurally valid (basic check)
     */
    validateRule(rule: JsonLogicRule): boolean {
        // json-logic doesn't have a strict schema validator, checking if it's an object
        return typeof rule === 'object' && rule !== null;
    }
}

export const jsonLogicEvaluator = new JsonLogicEvaluator();
