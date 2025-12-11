/**
 * Tests for Temporal Query Engine
 * Includes property-based tests for temporal query correctness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TemporalQueryEngine, createTemporalQueryEngine } from './temporal-query-engine';
import { IEventStore as EventStore, createEventStore } from '../event-store';
import { StateProjectionEngine, createStateProjectionEngine } from '../state-projection';
import { InMemoryHolonRepository as HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

describe('TemporalQueryEngine', () => {
  let eventStore: EventStore;
  let stateProjection: StateProjectionEngine;
  let holonRegistry: HolonRegistry;
  let relationshipRegistry: RelationshipRegistry;
  let temporalQueryEngine: TemporalQueryEngine;
  let constraintEngine: ConstraintEngine;
  let documentRegistry: DocumentRegistry;

  beforeEach(() => {
    eventStore = createEventStore();
    stateProjection = createStateProjectionEngine(eventStore);
    holonRegistry = new HolonRegistry();
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    temporalQueryEngine = createTemporalQueryEngine(
      eventStore,
      stateProjection,
      holonRegistry,
      relationshipRegistry
    );
  });

  describe('Basic functionality', () => {
    it('should get holon state as of a specific timestamp', async () => {
      // Create a holon
      const holon = await holonRegistry.createHolon({
        type: HolonType.Person,
        properties: { name: 'John Doe', edipi: '1234567890' },
        createdBy: 'event-1',
        sourceDocuments: ['doc-1'],
      });

      // Submit creation event
      const creationTime = new Date('2024-01-01T10:00:00Z');
      await eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: creationTime,
        actor: 'system',
        subjects: [holon.id],
        payload: {
          holonType: HolonType.Person,
          properties: holon.properties,
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      // Query as of creation time
      const result = await temporalQueryEngine.getHolonAsOf(holon.id, creationTime);
      expect(result).toBeDefined();
      expect(result?.id).toBe(holon.id);
    });

    it('should get relationships as of a specific timestamp', async () => {
      // Create holons
      const person = await holonRegistry.createHolon({
        type: HolonType.Person,
        properties: { name: 'Jane Doe' },
        createdBy: 'event-1',
        sourceDocuments: ['doc-1'],
      });

      const position = await holonRegistry.createHolon({
        type: HolonType.Position,
        properties: { title: 'Manager' },
        createdBy: 'event-2',
        sourceDocuments: ['doc-1'],
      });

      // Create relationship
      const startTime = new Date('2024-01-01T10:00:00Z');
      const result = await relationshipRegistry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: person.id,
        targetHolonID: position.id,
        properties: {},
        effectiveStart: startTime,
        sourceSystem: 'test',
        sourceDocuments: ['doc-1'],
        actor: 'system',
      });

      expect(result.validation.valid).toBe(true);

      // Query relationships as of start time
      const relationships = await temporalQueryEngine.getRelationshipsAsOf(
        person.id,
        startTime
      );

      expect(relationships.length).toBeGreaterThan(0);
    });

    it('should trace causal chain through event links', async () => {
      // Create events with causal links
      const event1Id = await eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01T10:00:00Z'),
        actor: 'system',
        subjects: ['holon-1'],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const event2Id = await eventStore.submitEvent({
        type: EventType.PositionCreated,
        occurredAt: new Date('2024-01-01T11:00:00Z'),
        actor: 'system',
        subjects: ['holon-2'],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {
          precededBy: [event1Id],
        },
      });

      const event3Id = await eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2024-01-01T12:00:00Z'),
        actor: 'system',
        subjects: ['holon-3'],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {
          causedBy: [event2Id],
        },
      });

      // Trace causal chain
      const chain = await temporalQueryEngine.traceCausalChain(event3Id);
      expect(chain).toBeDefined();
      expect(chain?.rootEvent.id).toBe(event3Id);
      expect(chain?.causingEvents.length).toBeGreaterThan(0);
    });

    it('should get event history for a holon', async () => {
      const holon = await holonRegistry.createHolon({
        type: HolonType.Person,
        properties: { name: 'Test Person' },
        createdBy: 'event-1',
        sourceDocuments: ['doc-1'],
      });

      // Submit multiple events
      await eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01T10:00:00Z'),
        actor: 'system',
        subjects: [holon.id],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      await eventStore.submitEvent({
        type: EventType.PositionModified,
        occurredAt: new Date('2024-01-02T10:00:00Z'),
        actor: 'system',
        subjects: [holon.id],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const history = await temporalQueryEngine.getHolonEventHistory(holon.id);
      expect(history.events.length).toBe(2);
      expect(history.events[0].occurredAt.getTime()).toBeLessThan(
        history.events[1].occurredAt.getTime()
      );
    });
  });

  describe('Property-based tests', () => {
    /**
     * **Feature: semantic-operating-model, Property 5: Temporal query round-trip**
     * **Validates: Requirements 1.5, 3.5, 14.1**
     * 
     * For any holon state at timestamp T, querying as-of T after subsequent 
     * modifications must return the original state at T.
     */
    it('Property 5: Temporal query round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            holonType: fc.constantFrom(...Object.values(HolonType)),
            properties: fc.dictionary(fc.string(), fc.anything()),
            timestamps: fc.array(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), { minLength: 2, maxLength: 5 }),
          }),
          async (data) => {
            // Sort timestamps and ensure they are unique
            const uniqueTimestamps = Array.from(
              new Set(data.timestamps.map(t => t.getTime()))
            ).map(t => new Date(t)).sort((a, b) => a.getTime() - b.getTime());

            // Need at least 2 unique timestamps
            if (uniqueTimestamps.length < 2) {
              return true; // Skip this test case
            }

            const [firstTimestamp, ...laterTimestamps] = uniqueTimestamps;

            // Create holon at first timestamp
            const holon = await holonRegistry.createHolon({
              type: data.holonType,
              properties: data.properties,
              createdBy: 'event-initial',
              sourceDocuments: ['doc-1'],
            });

            // Submit creation event at first timestamp
            await eventStore.submitEvent({
              type: EventType.OrganizationCreated,
              occurredAt: firstTimestamp,
              actor: 'system',
              subjects: [holon.id],
              payload: {
                holonType: data.holonType,
                properties: data.properties,
              },
              sourceSystem: 'test',
              causalLinks: {},
            });

            // Get state at first timestamp
            const stateAtT = await temporalQueryEngine.getHolonAsOf(holon.id, firstTimestamp);

            // Make modifications at later timestamps (strictly after firstTimestamp)
            for (const laterTimestamp of laterTimestamps) {
              await eventStore.submitEvent({
                type: EventType.PositionModified,
                occurredAt: laterTimestamp,
                actor: 'system',
                subjects: [holon.id],
                payload: {
                  properties: { modified: true, timestamp: laterTimestamp.toISOString() },
                },
                sourceSystem: 'test',
                causalLinks: {},
              });
            }

            // Query as-of first timestamp again
            const stateAtTAfterModifications = await temporalQueryEngine.getHolonAsOf(holon.id, firstTimestamp);

            // The state at T should be the same before and after modifications
            if (stateAtT && stateAtTAfterModifications) {
              expect(stateAtT.id).toBe(stateAtTAfterModifications.id);
              expect(stateAtT.type).toBe(stateAtTAfterModifications.type);
              // Properties should match the original state
              expect(JSON.stringify(stateAtT.properties)).toBe(
                JSON.stringify(stateAtTAfterModifications.properties)
              );
            }

            // Clean up for next iteration
            holonRegistry.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 9: Relationship temporal reconstruction**
     * **Validates: Requirements 2.4, 14.2**
     * 
     * For any relationship graph at timestamp T, querying as-of T after subsequent 
     * changes must reconstruct the exact graph at T.
     */
    it('Property 9: Relationship temporal reconstruction', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            numRelationships: fc.integer({ min: 1, max: 5 }),
            timestamps: fc.array(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), { minLength: 2, maxLength: 4 }),
          }),
          async (data) => {
            const sortedTimestamps = [...data.timestamps].sort((a, b) => a.getTime() - b.getTime());
            const [firstTimestamp, ...laterTimestamps] = sortedTimestamps;

            // Create holons
            const holons = await Promise.all(Array.from({ length: data.numRelationships * 2 }, (_, i) =>
              holonRegistry.createHolon({
                type: i % 2 === 0 ? HolonType.Person : HolonType.Position,
                properties: { index: i },
                createdBy: `event-${i}`,
                sourceDocuments: ['doc-1'],
              })
            ));

            // Create relationships at first timestamp
            const relationshipIds: string[] = [];
            for (let i = 0; i < data.numRelationships; i++) {
              const result = await relationshipRegistry.createRelationship({
                type: RelationshipType.OCCUPIES,
                sourceHolonID: holons[i * 2].id,
                targetHolonID: holons[i * 2 + 1].id,
                properties: { index: i },
                effectiveStart: firstTimestamp,
                sourceSystem: 'test',
                sourceDocuments: ['doc-1'],
                actor: 'system',
              });

              if (result.relationship) {
                relationshipIds.push(result.relationship.id);
              }
            }

            // Get relationships at first timestamp
            const relationshipsAtT = (await Promise.all(holons.map(holon =>
              temporalQueryEngine.getRelationshipsAsOf(holon.id, firstTimestamp)
            ))).flat();

            // Make changes at later timestamps
            for (const laterTimestamp of laterTimestamps) {
              // End some relationships
              if (relationshipIds.length > 0) {
                const relToEnd = relationshipIds[0];
                await relationshipRegistry.endRelationship({
                  relationshipID: relToEnd,
                  endDate: laterTimestamp,
                  reason: 'test',
                  actor: 'system',
                  sourceSystem: 'test',
                });
              }
            }

            // Query relationships as-of first timestamp again
            const relationshipsAtTAfterChanges = (await Promise.all(holons.map(holon =>
              temporalQueryEngine.getRelationshipsAsOf(holon.id, firstTimestamp)
            ))).flat();

            // The relationship graph at T should be the same
            expect(relationshipsAtT.length).toBe(relationshipsAtTAfterChanges.length);

            // Clean up
            holonRegistry.clear();
            relationshipRegistry.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 41: Causal chain traversal**
     * **Validates: Requirements 14.3**
     * 
     * For any event with causal links, following the links must produce a valid 
     * causal chain showing what led to the event.
     */
    it('Property 41: Causal chain traversal', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            chainLength: fc.integer({ min: 2, max: 5 }),
          }),
          async (data) => {
            // Create a chain of events with causal links
            const eventIds: string[] = [];
            const baseTime = new Date('2024-01-01T10:00:00Z');

            for (let i = 0; i < data.chainLength; i++) {
              const occurredAt = new Date(baseTime.getTime() + i * 60000); // 1 minute apart
              const causalLinks = i > 0 ? { precededBy: [eventIds[i - 1]] } : {};

              const eventId = await eventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt,
                actor: 'system',
                subjects: [`holon-${i}`],
                payload: { step: i },
                sourceSystem: 'test',
                causalLinks,
              });

              eventIds.push(eventId);
            }

            // Trace causal chain from the last event
            const lastEventId = eventIds[eventIds.length - 1];
            const chain = await temporalQueryEngine.traceCausalChain(lastEventId);

            // Verify chain exists and contains all events
            expect(chain).toBeDefined();
            expect(chain?.rootEvent.id).toBe(lastEventId);

            // The full chain should contain all events in the sequence
            expect(chain?.fullChain.length).toBeGreaterThanOrEqual(data.chainLength);

            // Events should be in chronological order
            for (let i = 1; i < chain!.fullChain.length; i++) {
              expect(chain!.fullChain[i].occurredAt.getTime()).toBeGreaterThanOrEqual(
                chain!.fullChain[i - 1].occurredAt.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 42: Audit completeness**
     * **Validates: Requirements 14.4**
     * 
     * For any holon or relationship, querying its event history must return all 
     * events that affected it in chronological order.
     */
    it('Property 42: Audit completeness', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            numEvents: fc.integer({ min: 1, max: 10 }),
          }),
          async (data) => {
            // Create a holon
            const holon = await holonRegistry.createHolon({
              type: HolonType.Person,
              properties: { name: 'Test' },
              createdBy: 'event-initial',
              sourceDocuments: ['doc-1'],
            });

            // Submit multiple events affecting this holon
            const eventIds: string[] = [];
            const baseTime = new Date('2024-01-01T10:00:00Z');

            for (let i = 0; i < data.numEvents; i++) {
              const occurredAt = new Date(baseTime.getTime() + i * 60000);
              const eventId = await eventStore.submitEvent({
                type: i === 0 ? EventType.OrganizationCreated : EventType.PositionModified,
                occurredAt,
                actor: 'system',
                subjects: [holon.id],
                payload: { step: i },
                sourceSystem: 'test',
                causalLinks: {},
              });

              eventIds.push(eventId);
            }

            // Get event history
            const history = await temporalQueryEngine.getHolonEventHistory(holon.id);

            // All events should be present
            expect(history.events.length).toBe(data.numEvents);

            // Events should be in chronological order
            for (let i = 1; i < history.events.length; i++) {
              expect(history.events[i].occurredAt.getTime()).toBeGreaterThanOrEqual(
                history.events[i - 1].occurredAt.getTime()
              );
            }

            // All submitted event IDs should be in the history
            const historyEventIds = new Set(history.events.map(e => e.id));
            for (const eventId of eventIds) {
              expect(historyEventIds.has(eventId)).toBe(true);
            }

            // Clean up
            holonRegistry.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 43: Validity window respect**
     * **Validates: Requirements 14.5**
     * 
     * For any event with a validity window, as-of queries outside that window 
     * must not include the event's effects.
     */
    it('Property 43: Validity window respect', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            validityStart: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
            validityEnd: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }),
            queryBefore: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
            queryAfter: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          }),
          async (data) => {
            // Create a holon
            const holon = await holonRegistry.createHolon({
              type: HolonType.Person,
              properties: { name: 'Test' },
              createdBy: 'event-initial',
              sourceDocuments: ['doc-1'],
            });

            // Submit event with validity window
            const eventTime = new Date((data.validityStart.getTime() + data.validityEnd.getTime()) / 2);
            await eventStore.submitEvent({
              type: EventType.OrganizationCreated,
              occurredAt: eventTime,
              actor: 'system',
              subjects: [holon.id],
              payload: {
                holonType: HolonType.Person,
                properties: { validityTest: true },
              },
              sourceSystem: 'test',
              validityWindow: {
                start: data.validityStart,
                end: data.validityEnd,
              },
              causalLinks: {},
            });

            // Query before validity window
            const stateBefore = await temporalQueryEngine.getHolonAsOf(holon.id, data.queryBefore);

            // Query after validity window
            const stateAfter = await temporalQueryEngine.getHolonAsOf(holon.id, data.queryAfter);

            // Query within validity window
            const stateWithin = await temporalQueryEngine.getHolonAsOf(holon.id, eventTime);

            // State should not exist or not have the validity test property outside the window
            if (stateBefore) {
              expect(stateBefore.properties.validityTest).toBeUndefined();
            }
            if (stateAfter) {
              expect(stateAfter.properties.validityTest).toBeUndefined();
            }

            // State within the window should have the property
            if (stateWithin) {
              expect(stateWithin.properties.validityTest).toBe(true);
            }

            // Clean up
            holonRegistry.clear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
