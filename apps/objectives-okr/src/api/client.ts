import { createSOMClient, SOMClient } from '@som/api-client';

// Single instance of the client
let clientInstance: SOMClient | null = null;

export function getClient(mode: 'real' | 'mock' = 'mock'): SOMClient {
    if (!clientInstance) {
        clientInstance = createSOMClient('/api/v1', {
            mode,
            // includeCredentials: true // Enable for Gateway auth
        });
    }
    return clientInstance;
}
