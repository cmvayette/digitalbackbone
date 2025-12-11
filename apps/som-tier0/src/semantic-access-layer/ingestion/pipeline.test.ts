import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SemanticAccessLayer, ExternalData, ConflictResolutionStrategy } from '../index';
import { IngestionPipeline } from './pipeline';
import { DataTransformer } from './interfaces';
import { FileIngestionAdapter } from './adapters/file-adapter';
import { join } from 'path';
import { promises as fs } from 'fs';
import { EventType } from '@som/shared-types';

// Mocks
const mockEventStore = {
    submitEvent: vi.fn().mockReturnValue('evt-123'),
    getEvent: vi.fn().mockReturnValue({ id: 'evt-123', subjects: ['holon-123'] })
};
const mockConstraintEngine = {
    validateEvent: vi.fn().mockReturnValue({ valid: true })
};
const mockHolonRegistry = {};
const mockDocumentRegistry = {};

describe('SAL Ingestion Pipeline Integration', () => {
    let sal: SemanticAccessLayer;
    const testFilePath = join(__dirname, 'test-data.json');

    beforeEach(async () => {
        sal = new SemanticAccessLayer(
            mockEventStore as any,
            mockConstraintEngine as any,
            mockHolonRegistry as any,
            mockDocumentRegistry as any
        );

        // Create dummy file
        await fs.writeFile(testFilePath, JSON.stringify([
            { id: '101', name: 'John Doe', role: 'Pilot' },
            { id: '102', name: 'Jane Smith', role: 'Commander' }
        ]));
    });

    afterEach(async () => {
        try {
            await fs.unlink(testFilePath);
        } catch { /* ignore */ }
    });

    it('should ingest data from a JSON file and submit events', async () => {
        // 1. Setup Adapter
        const adapter = new FileIngestionAdapter<any>(testFilePath);

        // 2. Setup Transformer
        const transformer: DataTransformer<any> = {
            transform: (raw) => {
                return {
                    externalSystem: 'TEST_SYS',
                    externalID: raw.id,
                    dataType: 'person_created',
                    timestamp: new Date(),
                    payload: raw
                };
            }
        };

        // 3. Run Pipeline
        const pipeline = new IngestionPipeline(sal, adapter, transformer);
        const summary = await pipeline.run();

        // 4. Assertions
        expect(summary.totalProcessed).toBe(2);
        expect(summary.successCount).toBe(2);
        expect(summary.failureCount).toBe(0);

        // Verify SAL interactions
        expect(mockEventStore.submitEvent).toHaveBeenCalledTimes(2);
        // Verify Mapping
        expect(sal.getHolonID('TEST_SYS', '101')).toBeDefined();
    });
});
