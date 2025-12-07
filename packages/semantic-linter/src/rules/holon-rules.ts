import { Analyzer } from '../analyzer';
import chalk from 'chalk';

export interface RuleResult {
    passed: boolean; // Did the rule pass overall?
    violations: string[]; // List of specific violations
}

export function checkHolonCompleteness(analyzer: Analyzer): RuleResult {
    const violations: string[] = [];
    const holonEnum = analyzer.getHolonTypeEnum();

    if (!holonEnum) {
        return { passed: false, violations: ['Critical: Could not find "enum HolonType" definition.'] };
    }

    const enumMembers = holonEnum.getMembers().map(m => m.getName());

    for (const memberName of enumMembers) {
        // Convention: If enum is "Person", interface should be "Person"
        // We ignore generic types like "Constraint" or "MeasureDefinition" if they rely on the base Holon interface
        // but strict governance suggests EVERY type should have an explicit Interface.

        const interfaceDef = analyzer.getInterface(memberName);

        if (!interfaceDef) {
            violations.push(`HolonType.${memberName} is defined in enum but missing Interface "${memberName}".`);
            continue;
        }

        // Check if it extends Holon
        const extendsClause = interfaceDef.getExtends();
        const isHolon = extendsClause.some(e => e.getText().includes('Holon'));

        if (!isHolon) {
            violations.push(`Interface "${memberName}" exists but does not extend "Holon".`);
        }

        // Check for sourceDocuments property (Core Governance Rule)
        // Note: It might inherit it from Holon, but let's check strictness if needed.
        // Actually, inheritance is fine. 
    }

    return {
        passed: violations.length === 0,
        violations
    };
}
