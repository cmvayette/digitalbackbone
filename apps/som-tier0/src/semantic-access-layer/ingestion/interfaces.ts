import { ExternalData, TransformationResult } from '../index';

/**
 * Adapter interface for fetching raw data from a source
 * T = Type of raw data (e.g., Record<string, any> or string)
 */
export interface IngestionAdapter<T = unknown> {
    /**
     * Fetch data from the source matches the configuration
     */
    fetch(): Promise<T[]>;

    /**
     * Optional cleanup/disconnect logic
     */
    disconnect?(): Promise<void>;
}

/**
 * Transformer interface for mapping raw data to SOM ExternalData format
 * T = Type of raw data (same as Adapter)
 */
export interface DataTransformer<T = unknown> {
    /**
     * Transform a single raw record into ExternalData
     * logical checks can return null to skip records
     */
    transform(raw: T): ExternalData | null;
}

/**
 * Configuration for an ingestion run
 */
export interface IngestionConfig {
    stopOnError?: boolean;
    batchSize?: number;
}

/**
 * Result of an ingestion run
 */
export interface IngestionSummary {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    errors: Array<{ index: number; error: string; data?: unknown }>;
    results: TransformationResult[];
}
