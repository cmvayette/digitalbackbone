
import { schemaRegistry } from './index';
import { HolonType } from '@som/shared-types';

async function test() {
    console.log('Initializing Schema Registry...');
    await schemaRegistry.initialize();

    console.log('Loaded Types:', schemaRegistry.getLoadedTypes());

    const validPerson = {
        id: '123',
        type: 'Person',
        createdAt: new Date().toISOString(),
        createdBy: 'event-1',
        status: 'active',
        sourceDocuments: [],
        properties: {
            edipi: '1234567890',
            name: 'John Doe',
            // Note: rank is not in schema properties, but additionalProperties is false? 
            // Wait, in the schema viewed in Step 266, 'rank' is NOT in the properties list.
            // properties has: edipi, serviceNumbers, name, dob, serviceBranch, designatorRating, category.
            // I should align the test data with the actual schema.
            serviceNumbers: ['123'],
            dob: new Date().toISOString(),
            serviceBranch: 'Navy',
            designatorRating: '1110',
            category: 'active_duty'
        }
    };

    console.log('Test Object Properties:', Object.keys(validPerson.properties));
    console.log('Schema properties:', JSON.stringify(schemaRegistry.getSchema(HolonType.Person).properties.properties.properties, null, 2));

    console.log('Validating Valid Person...');
    const result1 = schemaRegistry.validate(HolonType.Person, validPerson);
    console.log('Result 1 (Expected True):', result1);

    const invalidPerson = {
        ...validPerson,
        properties: {
            ...validPerson.properties,
            category: 'INVALID_CATEGORY'
        }
    };

    console.log('Validating Invalid Person...');
    const result2 = schemaRegistry.validate(HolonType.Person, invalidPerson);
    console.log('Result 2 (Expected False):', result2);
}

test().catch(console.error);
