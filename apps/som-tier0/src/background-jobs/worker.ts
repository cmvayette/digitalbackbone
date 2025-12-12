import { Worker, Job } from 'bullmq';
import { StateProjectionEngine } from '../state-projection';
import { config } from '../config';
import { snapshotQueueName } from './queue';

export function createSnapshotWorker(stateProjection: StateProjectionEngine) {
    const worker = new Worker(
        snapshotQueueName,
        async (job: Job) => {
            console.log(`[SnapshotWorker] Processing job ${job.id}: ${job.name}`);

            try {
                const start = Date.now();
                await stateProjection.createSnapshot();
                const duration = Date.now() - start;
                console.log(`[SnapshotWorker] Snapshot created in ${duration}ms`);
            } catch (error) {
                console.error('[SnapshotWorker] Failed to create snapshot:', error);
                throw error;
            }
        },
        {
            connection: {
                host: config.redis.host,
                port: config.redis.port,
            },
            concurrency: 1, // Ensure only one snapshot is created at a time per worker instance
        }
    );

    worker.on('completed', (job) => {
        console.log(`[SnapshotWorker] Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[SnapshotWorker] Job ${job?.id} failed: ${err.message}`);
    });

    return worker;
}
