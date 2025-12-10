import { DataTransformer, IngestionAdapter } from '../interfaces';
import { ExternalData } from '../../index';
import { Timestamp } from '@som/shared-types';

export interface JsonPathConfig {
    externalSystem: string;
    targetDataType: string;
    paths: {
        externalID: string; // Path to ID (e.g. "id" or "data.user_id")
        timestamp?: string; // Path to timestamp (optional, defaults to now)
        payload?: string;   // Path to payload (optional, defaults to root object)
    };
    staticPayload?: Record<string, any>; // Static data to merge into payload
}

/**
 * Generic Transformer that uses simple path lookup (dot notation)
 * to extract required ExternalData fields from any JSON object.
 */
export class JsonPathTransformer implements DataTransformer<any> {
    constructor(private config: JsonPathConfig) { }

    transform(raw: any): ExternalData | null {
        if (!raw) return null;

        const externalID = this.getValueByPath(raw, this.config.paths.externalID);

        if (!externalID) {
            console.warn(`JsonPathTransformer: Could not resolve externalID at path '${this.config.paths.externalID}'`);
            return null; // Skip invalid records
        }

        const timestampRaw = this.config.paths.timestamp
            ? this.getValueByPath(raw, this.config.paths.timestamp)
            : new Date();

        const timestamp = timestampRaw instanceof Date ? timestampRaw : new Date(timestampRaw);

        // Determine payload
        let payload = this.config.paths.payload
            ? this.getValueByPath(raw, this.config.paths.payload)
            : raw;

        if (this.config.staticPayload) {
            payload = { ...payload, ...this.config.staticPayload };
        }

        return {
            externalSystem: this.config.externalSystem,
            externalID: String(externalID),
            dataType: this.config.targetDataType,
            timestamp: timestamp,
            payload: payload
        };
    }

    private getValueByPath(obj: any, path: string): any {
        if (!path || path === '.') return obj;

        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }

        return current;
    }
}
