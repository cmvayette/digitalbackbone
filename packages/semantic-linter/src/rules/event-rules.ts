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

    // Check for "EventBase" interface (new strict architecture)
    const baseEventInterface = analyzer.getInterface('EventBase');

    // Also check if "Event" type alias exists (discriminated union)
    const eventTypeAlias = analyzer.getTypeAlias('Event');

    if (!baseEventInterface) {
        // Fallback: check for "Event" interface (old architecture)
        const legacyEventInterface = analyzer.getInterface('Event');
        if (!legacyEventInterface && !eventTypeAlias) {
            return { passed: false, violations: ['Critical: Missing base "Event" or "EventBase" definition.'] };
        }

        if (legacyEventInterface) {
            // Validate legacy interface
            const requiredFields = ['id', 'type', 'occurredAt', 'actor', 'subjects', 'sourceSystem'];
            for (const field of requiredFields) {
                if (!legacyEventInterface.getProperty(field)) {
                    violations.push(`Interface "Event" is missing required field: "${field}".`);
                }
            }
        }
    }

    if (baseEventInterface) {
        // Check for required fields in EventBase
        // "sourceDocument" should be mandatory or strictly checked if optional
        // Note: 'type' and 'payload' are in TypedEvent, not EventBase
        const requiredFields = ['id', 'occurredAt', 'actor', 'subjects', 'sourceSystem'];

        for (const field of requiredFields) {
            if (!baseEventInterface.getProperty(field)) {
                violations.push(`Interface "EventBase" is missing required field: "${field}".`);
            }
        }
    }

    if (!eventTypeAlias && !analyzer.getInterface('Event')) {
        violations.push('Critical: "Event" type/interface is not exported.');
    }

    return {
        passed: violations.length === 0,
        violations
    };
}
