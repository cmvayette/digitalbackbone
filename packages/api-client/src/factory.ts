import { SOMClient, SOMClientOptions } from './client';
export { SOMClientOptions } from './client';

/**
 * Create a SOM client instance
 */
export function createSOMClient(
    baseUrl?: string,
    options?: SOMClientOptions
): SOMClient {
    // @ts-ignore
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SOM_API_URL : undefined;
    const url = baseUrl || envUrl || 'http://localhost:3000/api/v1';

    return new SOMClient(url, options);
}
