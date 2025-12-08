import { createSOMClient } from '@som/api-client';

// Initialize the SOM API Client
// In development, we use the local proxy or direct URL
// In production (C-ATO), this will be behind a gateway
export const client = createSOMClient('/api/v1', {
    includeCredentials: true, // Enable cookie auth for Gateway compatibility
});

// Helper for legacy code if needed, but preferred to use client methods directly
// export const fetchJson = ... (Removed, forcing refactor)
