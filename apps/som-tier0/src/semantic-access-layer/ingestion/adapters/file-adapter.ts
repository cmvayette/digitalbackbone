import { promises as fs } from 'fs';
import { IngestionAdapter } from '../interfaces';

/**
 * Adapter for reading local files
 * Currently supports JSON. CSV support can be added.
 */
export class FileIngestionAdapter<T = unknown> implements IngestionAdapter<T> {
    constructor(private filePath: string) { }

    async fetch(): Promise<T[]> {
        const content = await fs.readFile(this.filePath, 'utf-8');

        // Auto-detect JSON
        if (this.filePath.endsWith('.json')) {
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : [parsed];
        }

        // Fallback: throw for now
        throw new Error('Unsupported file format. Only .json is currently supported.');
    }
}
