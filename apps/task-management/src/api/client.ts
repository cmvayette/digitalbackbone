import { createSOMClient, SOMClient } from '@som/api-client';

// Single instance of the client
let clientInstance: SOMClient | null = null;

export function getClient(mode: 'real' | 'mock' = 'mock'): SOMClient {
    if (!clientInstance) {
        // In a real app, 'mode' might come from env vars
        clientInstance = createSOMClient('/api/v1', {
            mode,
            // includeCredentials: true // Uncomment for Gateway auth
        });
    }
    return clientInstance;
}
