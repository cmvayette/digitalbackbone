import { SemanticAccessLayer } from '../index';
import { IngestionAdapter, DataTransformer, IngestionConfig, IngestionSummary } from './interfaces';

/**
 * Standard Pipeline for ingesting data into the SOM
 * Adapter -> Transformer -> SAL
 */
export class IngestionPipeline<T = unknown> {
    constructor(
        private sal: SemanticAccessLayer,
        private adapter: IngestionAdapter<T>,
        private transformer: DataTransformer<T>,
        private config: IngestionConfig = { stopOnError: false, batchSize: 50 }
    ) { }

    /**
     * Execute the ingestion pipeline
     */
    async run(): Promise<IngestionSummary> {
        const summary: IngestionSummary = {
            totalProcessed: 0,
            successCount: 0,
            failureCount: 0,
            errors: [],
            results: []
        };

        try {
            // 1. Fetch
            const rawData = await this.adapter.fetch();
            summary.totalProcessed = rawData.length;

            // 2. Process
            for (let i = 0; i < rawData.length; i++) {
                const item = rawData[i];

                try {
                    // Transform
                    const externalData = this.transformer.transform(item);

                    if (!externalData) {
                        // Transformer skipped this item (valid logic)
                        continue;
                    }

                    // Submit to SAL
                    const result = this.sal.submitExternalData(externalData);
                    summary.results.push(result);

                    if (result.success) {
                        summary.successCount++;
                    } else {
                        summary.failureCount++;
                        summary.errors.push({
                            index: i,
                            error: result.errors?.join(', ') || 'Unknown SAL error',
                            data: item
                        });

                        if (this.config.stopOnError) {
                            break;
                        }
                    }

                } catch (err) {
                    summary.failureCount++;
                    summary.errors.push({
                        index: i,
                        error: err instanceof Error ? err.message : String(err),
                        data: item
                    });

                    if (this.config.stopOnError) {
                        break;
                    }
                }
            }

        } catch (err) {
            // Adapter fetch failed
            summary.errors.push({
                index: -1,
                error: `Adapter fetch failed: ${err instanceof Error ? err.message : String(err)}`
            });
        } finally {
            if (this.adapter.disconnect) {
                await this.adapter.disconnect();
            }
        }

        return summary;
    }
}
