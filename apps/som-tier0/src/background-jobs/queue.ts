import { Queue } from 'bullmq';
import { config } from '../config';

export const snapshotQueueName = 'snapshot-generation';

export const snapshotQueue = new Queue(snapshotQueueName, {
    connection: {
        host: config.redis.host,
        port: config.redis.port,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
