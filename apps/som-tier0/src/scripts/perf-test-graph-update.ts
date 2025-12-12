
import { InMemoryEventStore } from '../event-store/index'; // Use index to reach InMemory
import { StateProjectionEngine } from '../state-projection';
import { GraphStore } from '../graph-store';
import { Event, EventType, HolonType } from '@som/shared-types';
import { randomUUID } from 'crypto';

async function runPerfTest() {
    console.log('Starting GraphStore Performance Test...');

    // 1. Setup
    const eventStore = new InMemoryEventStore();
    const projectionEngine = new StateProjectionEngine(eventStore);
    const graphStore = new GraphStore(projectionEngine);

    // 2. Pre-load 1000 events
    console.log('Pre-loading 1000 events...');
    const COUNT = 1000;
    const startLoad = performance.now();

    for (let i = 0; i < COUNT; i++) {
        const id = randomUUID();
        const event: any = {
            type: EventType.OrganizationCreated,
            actor: 'system',
            subjects: [id],
            payload: {
                type: HolonType.Organization,
                name: `Org ${i}`,
                properties: {}
            },
            causalLinks: {},
            occurredAt: new Date()
        };
        await eventStore.submitEvent(event);
    }
    const endLoad = performance.now();
    console.log(`Loaded ${COUNT} events in ${(endLoad - startLoad).toFixed(2)}ms`);

    // 3. Rebuild Indices (baseline)
    console.log('Building initial indices...');
    await graphStore.initialize();

    // 4. Measure Incremental Update
    console.log('Measuring incremental update for 1 new event...');

    const newId = randomUUID();
    const newEventData: any = {
        type: EventType.OrganizationCreated,
        actor: 'system',
        subjects: [newId],
        payload: {
            type: HolonType.Organization,
            name: `New Org`,
            properties: {}
        },
        causalLinks: {},
        occurredAt: new Date()
    };

    // Submit event (this adds to store, but we want to measure graphStore.updateFromNewEvent specifically)
    const eventId = await eventStore.submitEvent(newEventData);
    const newEvent = await eventStore.getEvent(eventId);

    if (!newEvent) throw new Error("Failed to create event");

    // Manually trigger update (simulating server subscription)
    const updateStart = performance.now();
    await graphStore.updateFromNewEvent(newEvent);
    const updateEnd = performance.now();

    const duration = updateEnd - updateStart;
    console.log(`updateFromNewEvent took: ${duration.toFixed(4)}ms`);

    if (duration > 50) { // arbitrary threshold, 50ms is huge for in-memory O(1)
        console.error('FAIL: Update took too long, likely O(N) replay happening.');
        process.exit(1);
    } else {
        console.log('PASS: Update was fast (O(1)).');
        process.exit(0);
    }
}

runPerfTest().catch(console.error);
