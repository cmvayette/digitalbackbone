
import { Neo4jGraphStore } from './graph-store/neo4j-store';
import { CachedGraphStore } from './graph-store/cached-store';
import { RedisClient } from './cache/redis-client';
import { StateProjectionEngine } from './state-projection';
import { InMemoryEventStore } from './event-store';
import { EventType, HolonType } from '@som/shared-types';

async function verifyCache() {
    console.log('Starting Cache Verification...');

    // 1. Setup
    const eventStore = new InMemoryEventStore();
    const projectionEngine = new StateProjectionEngine(eventStore);
    const neo4jStore = new Neo4jGraphStore(projectionEngine);
    const redisClient = RedisClient.getInstance();
    const cachedStore = new CachedGraphStore(neo4jStore, redisClient);

    try {
        await cachedStore.initialize();
        console.log('Stores Initialized.');

        // 2. Clear Cache for test
        await redisClient.del('holon:cache-test-1');

        // 3. Create Data (in Neo4j via Event)
        console.log('Creating Test Data...');
        const eventId = await eventStore.submitEvent({
            type: EventType.OrganizationCreated,
            occurredAt: new Date(),
            actor: 'verifier',
            sourceSystem: 'script',
            subjects: ['cache-test-1'],
            payload: {
                holonType: HolonType.Organization,
                properties: {
                    id: 'cache-test-1',
                    name: 'Cache Test Org',
                    refresh: 1
                }
            },
            causalLinks: {}
        });

        const event = await eventStore.getEvent(eventId);
        projectionEngine.applyNewEvent(event!);
        await cachedStore.updateFromNewEvent(event); // Should invalidate cache (if any) and write to Neo4j

        // 4. Test Miss (First Read)
        console.log('First Read (Should be Miss/DB Hit)...');
        const start = Date.now();
        const holon1 = await cachedStore.getHolon('cache-test-1');
        const time1 = Date.now() - start;
        console.log(`Read 1 Time: ${time1}ms`);

        if (!holon1) throw new Error('Holon not found on first read');

        // 5. Test Hit (Second Read)
        console.log('Second Read (Should be Cache Hit)...');
        const start2 = Date.now();
        const holon2 = await cachedStore.getHolon('cache-test-1');
        const time2 = Date.now() - start2;
        console.log(`Read 2 Time: ${time2}ms`);

        if (!holon2) throw new Error('Holon not found on second read');

        // 6. Test Invalidation
        console.log('Updating Data (Should Invalidate)...');
        const updateEventId = await eventStore.submitEvent({
            type: EventType.OrganizationCreated, // Using create as update for simplicity in this mock
            occurredAt: new Date(),
            actor: 'verifier',
            sourceSystem: 'script',
            subjects: ['cache-test-1'],
            payload: {
                holonType: HolonType.Organization,
                properties: {
                    id: 'cache-test-1',
                    name: 'Cache Test Org Updated',
                    refresh: 2
                }
            },
            causalLinks: {}
        });
        const updateEvent = await eventStore.getEvent(updateEventId);
        projectionEngine.applyNewEvent(updateEvent!);
        await cachedStore.updateFromNewEvent(updateEvent);

        // 7. Test Miss (Third Read)
        console.log('Third Read (Should be Miss/DB Hit after invalidation)...');
        const start3 = Date.now();
        const holon3 = await cachedStore.getHolon('cache-test-1');
        const time3 = Date.now() - start3;
        console.log(`Read 3 Time: ${time3}ms`);

        if (holon3?.properties.refresh !== 2) {
            console.error('Got stale data!', holon3);
            throw new Error('Cache Invalidation Failed');
        }

        console.log('SUCCESS: Caching logic verified.');

    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        await redisClient.quit();
        await neo4jStore.close();
    }
}

verifyCache();
