import { ZodSchema } from 'zod';
import { IngestionAdapter } from '../interfaces';

/**
 * Simple Generic API Adapter
 * Fetches data from a URL and validates it against a Zod schema
 */
export class ApiIngestionAdapter<T = unknown> implements IngestionAdapter<T> {
    constructor(
        private url: string,
        private schema: ZodSchema<T>,
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

        let dataToValidate: any = json;

        if (this.dataPath) {
            // Resolve path
            const parts = this.dataPath.split('.');
            let current: any = json;
            for (const part of parts) {
                current = current?.[part];
            }
            dataToValidate = current;
        }

        const arrayData = Array.isArray(dataToValidate) ? dataToValidate : [dataToValidate];

        // Validate each item
        return arrayData.map((item: any, index: number) => {
            try {
                return this.schema.parse(item);
            } catch (error) {
                throw new Error(`Validation failed for item at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
}
