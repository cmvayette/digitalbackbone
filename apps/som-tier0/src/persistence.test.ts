import { describe, it, expect, afterAll } from 'vitest';
import { SQLiteEventStore } from './event-store/sqlite-store';
import { EventType } from '@som/shared-types';
import fs from 'fs';
import path from 'path';

const TEST_DB = path.resolve(__dirname, 'test-persistence.db');

describe('Persistence Layer', () => {

    // Cleanup
    afterAll(() => {
        if (fs.existsSync(TEST_DB)) {
            // fs.unlinkSync(TEST_DB); // Keep for inspection if needed, or delete
            fs.unlinkSync(TEST_DB);
        }
    });

    it('persists events across store instances', () => {
        const eventId = 'evt-1';

        // 1. Initialize Store A
        const storeA = new SQLiteEventStore(TEST_DB);

        // 2. Write Event
        storeA.submitEvent({
            type: EventType.DocumentCreated,
            occurredAt: new Date(),
            actor: 'user-1',
            subjects: ['doc-1'],
            payload: { title: 'Persistent Doc' },
            causalLinks: {}
        });

        // 3. Close/Destroy Store A (simulate restart by just creating a new instance)
        // SQLite connection is usually robust, but let's ensure we just query from a new instance

        // 4. Initialize Store B
        const storeB = new SQLiteEventStore(TEST_DB);

        // 5. Read Event
        const storedEvents = storeB.getEvents();
        expect(storedEvents.length).toBeGreaterThan(0);

        const retrievedEvent = storedEvents.find(e => e.actor === 'user-1');
        expect(retrievedEvent).toBeDefined();
        expect(retrievedEvent?.payload.title).toBe('Persistent Doc');
    });
});
