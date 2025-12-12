
import { AccessControlEngine, Role, ClassificationLevel } from '../access-control';
import { DocumentRegistry } from '../document-registry';
import { Holon, HolonType } from '@som/shared-types';

async function main() {
    console.log('Starting OPA Verification...');

    // 1. Setup Dependencies
    const documentRegistry = new DocumentRegistry();
    const accessControl = new AccessControlEngine(documentRegistry);

    // 2. Define Test Cases
    const adminUser = {
        userId: 'admin-1',
        roles: [Role.Administrator],
        clearanceLevel: ClassificationLevel.TopSecret,
    };

    const operatorUser = {
        userId: 'operator-1',
        roles: [Role.Operator],
        clearanceLevel: ClassificationLevel.Confidential,
    };

    const unclassifiedHolon: Holon = {
        id: 'h1',
        type: HolonType.Mission,
        properties: {
            classificationMetadata: 'Unclassified',
        },
        sourceDocuments: [],
        createdBy: 'e1',
        createdAt: new Date(),
        status: 'active',
    };

    const secretHolon: Holon = {
        id: 'h2',
        type: HolonType.Mission,
        properties: {
            classificationMetadata: 'Secret',
        },
        sourceDocuments: [],
        createdBy: 'e1',
        createdAt: new Date(),
        status: 'active',
    };

    // 3. Run Tests
    try {
        console.log('\nTest 1: Admin should access Secret Holon');
        const result1 = await accessControl.canAccessHolon(adminUser, secretHolon);
        if (result1.allowed) {
            console.log('✅ PASS');
        } else {
            console.error('❌ FAIL', result1.reason);
        }

        console.log('\nTest 2: Operator (Confidential) should ACCESS Unclassified Holon');
        const result2 = await accessControl.canAccessHolon(operatorUser, unclassifiedHolon);
        if (result2.allowed) {
            console.log('✅ PASS');
        } else {
            console.error('❌ FAIL', result2.reason);
        }

        console.log('\nTest 3: Operator (Confidential) should NOT access Secret Holon');
        const result3 = await accessControl.canAccessHolon(operatorUser, secretHolon);
        if (!result3.allowed) {
            console.log('✅ PASS (Denied as expected)');
        } else {
            console.error('❌ FAIL (Allowed unexpectedly)');
        }

        console.log('\nOPA Verification Complete.');

    } catch (error) {
        console.error('Test execution failed. Is OPA running?');
        console.error(error);
    }
}

main().catch(console.error);
