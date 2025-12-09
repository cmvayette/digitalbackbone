import { createSOMClient } from './client';
import { HolonType } from '@som/shared-types';

async function verify() {
    console.log('Verifying SOM Client connectivity...');

    // Explicitly point to the running backend
    const client = createSOMClient('http://localhost:3333/api/v1');
    client.setAuthToken('dev-token-123');

    // 1. Health Check
    const health = await client.healthCheck();
    console.log('Health Check:', health);

    if (!health.healthy) {
        console.error('Server is not healthy. Is it running on port 3333?');
        process.exit(1);
    }

    // 2. Query Orgs
    console.log('Querying Organizations...');
    const result = await client.queryHolons(HolonType.Organization);

    if (result.success && result.data) {
        console.log(`Success! Found ${result.data.length} organizations.`);
        // List names
        result.data.slice(0, 5).forEach(o => console.log(` - ${o.properties.name}`));
    } else {
        console.error('Query failed:', result.error);
        process.exit(1);
    }
}

verify();
