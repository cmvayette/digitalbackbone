import { describe, it, expect, beforeEach } from 'vitest';
import { GraphStore, createGraphStore } from './index';
import { StateProjectionEngine, createStateProjectionEngine } from '../state-projection';
import { IEventStore as EventStore, createEventStore } from '../event-store';
import { HolonType, EventType, RelationshipType, Event } from '@som/shared-types';

describe('GraphStore Incremental Updates', () => {
    let eventStore: EventStore;
    let stateProjection: StateProjectionEngine;
    let graphStore: GraphStore;

    beforeEach(() => {
        eventStore = createEventStore();
        stateProjection = createStateProjectionEngine(eventStore);
        graphStore = createGraphStore(stateProjection);
        // Do NOT call rebuildIndices here, we want to test incremental addition
    });

    it('should update indices incrementally when a new holon is created', async () => {
        const holonId = 'inc-holon-1';
        const event: Event = {
            id: 'evt-1',
            type: EventType.OrganizationCreated,
            occurredAt: new Date(),
            recordedAt: new Date(),
            actor: 'system',
            subjects: [holonId],
            payload: {
                holonType: HolonType.Organization,
                name: 'Incremental Org', // Added name
                type: 'Organization', // Added type
                properties: { name: 'Incremental Org' },
            },
            sourceSystem: 'test',
            causalLinks: {},
        };

        // 1. Apply to State Projection (Pre-requisite)
        stateProjection.applyNewEvent(event);

        // 2. Incremental Update (The Fix)
        await graphStore.updateFromNewEvent(event);

        // 3. Verify it exists in Graph Store
        const result = await graphStore.getHolon(holonId);
        expect(result).toBeDefined();
        expect(result?.id).toBe(holonId);
        expect(result?.properties.name).toBe('Incremental Org');

        // Verify Type Index
        const typeResults = await graphStore.queryHolonsByType(HolonType.Organization);
        expect(typeResults).toHaveLength(1);
        expect(typeResults[0].id).toBe(holonId);
    });

    it('should update indices incrementally when a relationship is created', async () => {
        const sourceId = 'inc-source-1';
        const targetId = 'inc-target-1';
        const relationshipId = 'inc-rel-1';

        // Setup Holons
        const event1: Event = {
            id: 'evt-1',
            type: EventType.OrganizationCreated,
            occurredAt: new Date(),
            recordedAt: new Date(),
            actor: 'system',
            subjects: [sourceId],
            payload: { holonType: HolonType.Organization, properties: {}, name: 'Source', type: 'Organization' },
            sourceSystem: 'test', causalLinks: {}
        };
        const event2: Event = {
            id: 'evt-2',
            type: EventType.OrganizationCreated,
            occurredAt: new Date(),
            recordedAt: new Date(),
            actor: 'system',
            subjects: [targetId],
            payload: { holonType: HolonType.Organization, properties: {}, name: 'Target', type: 'Organization' },
            sourceSystem: 'test', causalLinks: {}
        };

        stateProjection.applyNewEvent(event1);
        await graphStore.updateFromNewEvent(event1);
        stateProjection.applyNewEvent(event2);
        await graphStore.updateFromNewEvent(event2);

        // Create Relationship Event
        const relEvent: Event = {
            id: 'evt-3',
            type: EventType.AssignmentStarted,
            occurredAt: new Date(),
            recordedAt: new Date(),
            actor: 'system',
            subjects: [sourceId, targetId],
            payload: {
                relationshipId,
                relationshipType: RelationshipType.OCCUPIES,
                properties: {},
            },
            sourceSystem: 'test', causalLinks: {}
        };

        // 1. Apply to State Projection
        stateProjection.applyNewEvent(relEvent);

        // 2. Incremental Update
        await graphStore.updateFromNewEvent(relEvent);

        // 3. Verify Relationship
        const result = await graphStore.getHolonRelationships(sourceId);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(relationshipId);
        expect(result[0].targetHolonID).toBe(targetId);

        // Verify Traversal
        const incoming = await graphStore.traverseRelationships(targetId, undefined, 'incoming');
        expect(incoming).toHaveLength(1);
        expect(incoming[0].sourceHolonID).toBe(sourceId);
    });
});
