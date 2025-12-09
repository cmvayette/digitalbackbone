import { IngestionAdapter } from '../interfaces';

/**
 * Simple Generic API Adapter
 * Fetches data from a URL
 */
export class ApiIngestionAdapter<T = unknown> implements IngestionAdapter<T> {
    constructor(
        private url: string,
        private headers: Record<string, string> = {},
        private dataPath?: string // Optional dot-notation path to array in response (e.g. "data.items")
    ) { }

    async fetch(): Promise<T[]> {
        const response = await fetch(this.url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...this.headers
            }
        });

        if (!response.ok) {
            throw new Error(`API fetch failed: ${response.status} ${response.statusText}`);
        }

        const json: any = await response.json(); // Explicit any for raw API response

        if (this.dataPath) {
            // Resolve path
            const parts = this.dataPath.split('.');
            let current: any = json;
            for (const part of parts) {
                current = current?.[part];
            }
            return (Array.isArray(current) ? current : [current]) as T[];
        }

        return (Array.isArray(json) ? json : [json]) as T[];
    }
}
