import { snapshotQueue, snapshotQueueName } from './queue';

export async function scheduleSnapshotJob() {
    console.log('[SnapshotScheduler] Configuring background snapshot job...');

    // Remove existing repeatable jobs to avoid duplicates if configuration changes
    const repeatableJobs = await snapshotQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        if (job.name === 'hourly-snapshot') {
            await snapshotQueue.removeRepeatableByKey(job.key);
        }
    }

    // Add the job to run every hour
    await snapshotQueue.add(
        'hourly-snapshot',
        {},
        {
            repeat: {
                pattern: '0 * * * *', // Every hour at minute 0
            },
            removeOnComplete: true,
            removeOnFail: 100, // Keep last 100 failed jobs for debugging
        }
    );

    console.log('[SnapshotScheduler] Job scheduled: hourly-snapshot (Cron: 0 * * * *)');
}
