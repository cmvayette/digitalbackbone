
import { ConstraintEngine } from './index';
import { DocumentRegistry } from '../document-registry';
import { HolonType, Holon, Timestamp, ConstraintType } from '@som/shared-types';

async function testDeclarativeConstraint() {
    const docRegistry = new DocumentRegistry();
    const engine = new ConstraintEngine(docRegistry);

    console.log('Registering declarative constraint...');
    // Rule: Rank must be one of O-1, O-2, O-3
    const rankRule = {
        "in": [
            { "var": "target.properties.rank" },
            ["O-1", "O-2", "O-3"]
        ]
    };

    engine.registerConstraint({
        type: ConstraintType.Policy,
        name: 'Valid Rank Policy',
        definition: 'Rank must be a junior officer rank',
        scope: { holonTypes: [HolonType.Person] },
        effectiveDates: { start: new Date() },
        sourceDocuments: [],
        rule: rankRule
    });

    const validPerson: Holon = {
        id: '1',
        type: HolonType.Person,
        properties: { rank: 'O-2' },
        createdAt: new Date(),
        createdBy: 'event-1',
        status: 'active',
        sourceDocuments: []
    };

    const invalidPerson: Holon = {
        id: '2',
        type: HolonType.Person,
        properties: { rank: 'E-4' }, // Invalid rank
        createdAt: new Date(),
        createdBy: 'event-1',
        status: 'active',
        sourceDocuments: []
    };

    console.log('Validating Valid Person...');
    const result1 = engine.validateHolon(validPerson);
    console.log('Result 1 (Expected Valid):', result1.valid);

    console.log('Validating Invalid Person...');
    const result2 = engine.validateHolon(invalidPerson);
    console.log('Result 2 (Expected Invalid):', result2.valid);
    if (!result2.valid) {
        console.log('Error:', result2.errors?.[0].message);
    }
}

testDeclarativeConstraint().catch(console.error);
