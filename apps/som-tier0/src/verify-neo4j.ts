
import { Neo4jGraphStore } from './graph-store/neo4j-store';
import { InMemoryEventStore } from './event-store';
import { StateProjectionEngine } from './state-projection';
import { EventType, HolonType } from '@som/shared-types';

async function verify() {
    console.log('Starting Neo4j Verification...');

    // 1. Setup
    const eventStore = new InMemoryEventStore();
    const projectionEngine = new StateProjectionEngine(eventStore);
    const store = new Neo4jGraphStore(projectionEngine);

    try {
        // 2. Initialize
        console.log('Initializing Store...');
        await store.initialize();

        // 3. Create Event
        console.log('Submitting Event...');
        const eventId = await eventStore.submitEvent({
            type: EventType.OrganizationCreated,
            occurredAt: new Date(),
            actor: 'verifier',
            sourceSystem: 'script',
            subjects: ['org-verify-1'],
            payload: {
                holonType: HolonType.Organization,
                properties: {
                    id: 'org-verify-1',
                    name: 'Verification Org',
                    verified: true
                }
            },
            causalLinks: {}
        });

        // 4. Project
        console.log('Projecting Event...');
        // We need to ensure state projection has the event logic applied first if we rely on replay
        // But Neo4jGraphStore.rebuildIndices() calls projectionEngine.replayAllEvents()

        // Manually apply to projection engine first (since we bypassed full server wiring)
        const event = await eventStore.getEvent(eventId);
        projectionEngine.applyNewEvent(event!);

        await store.updateFromNewEvent({
            id: 'test-event-1',
            type: 'TestEvent',
            occurredAt: new Date(),
            recordedAt: new Date(),
            actor: 'system',
            subjects: ['test-holon'],
            payload: {}
        } as any); // Should trigger write to DB

        // 5. Query
        console.log('Querying Store...');
        const holon = await store.getHolon('org-verify-1');

        if (holon && holon.properties.name === 'Verification Org') {
            console.log('SUCCESS: Holon found in Neo4j!');
            console.log(JSON.stringify(holon, null, 2));
        } else {
            console.error('FAILURE: Holon not found or properties mismatch.');
            console.log('Found:', holon);
            process.exit(1);
        }

    } catch (err) {
        console.error('Verification Failed:', err);
        process.exit(1);
    } finally {
        await store.close();
    }
}

verify();
