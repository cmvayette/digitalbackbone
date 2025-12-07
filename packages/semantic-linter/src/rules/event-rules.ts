import { Analyzer } from '../analyzer';

export interface RuleResult {
    passed: boolean; // Did the rule pass overall?
    violations: string[]; // List of specific violations
}

export function checkEventCompleteness(analyzer: Analyzer): RuleResult {
    const violations: string[] = [];

    // We look for "enum EventType"
    let eventEnum = analyzer.sharedTypesFile?.getEnum('EventType');

    if (!eventEnum) {
        // If not in the main file, search again
        for (const file of analyzer['project'].getSourceFiles()) {
            const e = file.getEnum('EventType');
            if (e) {
                eventEnum = e;
                break;
            }
        }
    }

    if (!eventEnum) {
        return { passed: false, violations: ['Critical: Could not find "enum EventType" definition.'] };
    }

    const baseEventInterface = analyzer.getInterface('Event');
    if (!baseEventInterface) {
        return { passed: false, violations: ['Critical: Missing base "Event" interface.'] };
    }

    // Check for required fields in base interface
    // "sourceDocument" should be mandatory or strictly checked if optional
    const requiredFields = ['id', 'type', 'occurredAt', 'actor', 'subjects', 'sourceSystem'];

    for (const field of requiredFields) {
        if (!baseEventInterface.getProperty(field)) {
            violations.push(`Base Interface "Event" is missing required field: "${field}".`);
        }
    }

    return {
        passed: violations.length === 0,
        violations
    };
}
