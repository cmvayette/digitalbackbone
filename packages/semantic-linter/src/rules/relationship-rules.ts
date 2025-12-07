import { Analyzer } from '../analyzer';

export interface RuleResult {
    passed: boolean; // Did the rule pass overall?
    violations: string[]; // List of specific violations
}

export function checkRelationshipCompleteness(analyzer: Analyzer): RuleResult {
    const violations: string[] = [];

    // We look for "enum RelationshipType"
    let relEnum = analyzer.sharedTypesFile?.getEnum('RelationshipType');

    if (!relEnum) {
        // If not in the main file, search again
        for (const file of analyzer['project'].getSourceFiles()) {
            const e = file.getEnum('RelationshipType');
            if (e) {
                relEnum = e;
                break;
            }
        }
    }

    if (!relEnum) {
        return { passed: false, violations: ['Critical: Could not find "enum RelationshipType" definition.'] };
    }

    // NOTE: Relationship interfaces are not strictly 1:1 with Enum values in the current design (unlike Holons).
    // The current design uses a single "Relationship" interface with a "type" field.
    // HOWEVER, strict governance suggests we SHOULD have specific interfaces if they have specific properties.
    // For now, let's verify that the base "Relationship" interface exists and has the required fields.

    const baseRelInterface = analyzer.getInterface('Relationship');
    if (!baseRelInterface) {
        return { passed: false, violations: ['Critical: Missing base "Relationship" interface.'] };
    }

    // Check for required fields in base interface
    const requiredFields = ['id', 'type', 'sourceHolonID', 'targetHolonID', 'effectiveStart', 'sourceDocuments'];

    for (const field of requiredFields) {
        if (!baseRelInterface.getProperty(field)) {
            violations.push(`Base Interface "Relationship" is missing required field: "${field}".`);
        }
    }

    return {
        passed: violations.length === 0,
        violations
    };
}
