/**
 * Property-based tests for State Projection Engine
 * 
 * These tests verify the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { StateProjectionEngine, createStateProjectionEngine } from './index';
import { createEventStore } from '../event-store';
import { Event, EventType } from '@som/shared-types';
import { HolonType } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';

describe('State Projection Engine - Property-Based Tests', () => {
  /**
   * **Feature: semantic-operating-model, Property 13: State derivation from events**
   * **Validates: Requirements 3.4**
   * 
   * For any sequence of events, folding them in time order must produce the correct
   * current state of all affected holons and relationships.
   */
  describe('Property 13: State derivation from events', () => {
    it('should derive correct state from a sequence of holon creation events', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 1000000 }), { minLength: 1, maxLength: 20 }),
          fc.array(
            fc.record({
              type: fc.constantFrom(
                EventType.OrganizationCreated,
                EventType.PositionCreated,
                EventType.ObjectiveCreated
              ),
              holonType: fc.constantFrom(...Object.values(HolonType)),
              properties: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer()))
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holonIds, timeOffsets, eventConfigs) => {
            const eventStore = createEventStore();
            const projectionEngine = createStateProjectionEngine(eventStore);

            const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
            const count = Math.min(holonIds.length, timeOffsets.length, eventConfigs.length);

            // Create events for each holon
            for (let i = 0; i < count; i++) {
              const timestamp = new Date(baseTime + timeOffsets[i] * 1000);
              const config = eventConfigs[i];
              
              const event: Omit<Event, 'id' | 'recordedAt'> = {
                type: config.type,
                occurredAt: timestamp,
                actor: 'test-actor',
                subjects: [holonIds[i]],
                payload: {
                  holonType: config.holonType,
                  properties: config.properties
                },
                sourceSystem: 'test-system',
                causalLinks: {}
              };

              eventStore.submitEvent(event);
            }

            // Replay events to derive state
            const state = projectionEngine.replayAllEvents();

            // Verify all holons are in the projected state
            for (let i = 0; i < count; i++) {
              const holonState = state.holons.get(holonIds[i]);
              if (!holonState) {
                return false;
              }

              // Verify holon has correct ID and is active
              if (holonState.holon.id !== holonIds[i] || holonState.holon.status !== 'active') {
                return false;
              }
            }

            // Verify count matches
            return state.holons.size === count;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply events in chronological order regardless of submission order', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 3, max: 10 }),
          (holonId, eventCount) => {
            // Create two event stores with same events in different orders
            const eventStore1 = createEventStore();
            const eventStore2 = createEventStore();

            const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
            
            // Create unique timestamps (no duplicates)
            const timestamps: Date[] = [];
            for (let i = 0; i < eventCount; i++) {
              timestamps.push(new Date(baseTime + i * 1000));
            }

            // Create a sequence of events
            const events: Omit<Event, 'id' | 'recordedAt'>[] = [];
            
            // First event: creation
            events.push({
              type: EventType.OrganizationCreated,
              occurredAt: timestamps[0],
              actor: 'test-actor',
              subjects: [holonId],
              payload: {
                holonType: HolonType.Organization,
                properties: { name: 'initial', version: 0 }
              },
              sourceSystem: 'test-system',
              causalLinks: {}
            });

            // Subsequent events: modifications
            for (let i = 1; i < timestamps.length; i++) {
              events.push({
                type: EventType.OrganizationRealigned,
                occurredAt: timestamps[i],
                actor: 'test-actor',
                subjects: [holonId],
                payload: {
                  properties: { version: i }
                },
                sourceSystem: 'test-system',
                causalLinks: {}
              });
            }

            // Submit events in chronological order to store 1
            for (const event of events) {
              eventStore1.submitEvent(event);
            }

            // Submit events in reverse order to store 2
            for (let i = events.length - 1; i >= 0; i--) {
              eventStore2.submitEvent(events[i]);
            }

            // Replay both stores
            const engine1 = createStateProjectionEngine(eventStore1);
            const engine2 = createStateProjectionEngine(eventStore2);

            const state1 = engine1.replayAllEvents();
            const state2 = engine2.replayAllEvents();

            // Both should produce the same final state
            const holon1 = state1.holons.get(holonId);
            const holon2 = state2.holons.get(holonId);

            if (!holon1 || !holon2) {
              return false;
            }

            // Compare final properties
            return JSON.stringify(holon1.holon.properties) === JSON.stringify(holon2.holon.properties);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly track modification events for each holon', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1, max: 10 }),
          (holonId, modificationCount) => {
            const eventStore = createEventStore();
            const projectionEngine = createStateProjectionEngine(eventStore);

            const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

            // Create holon
            eventStore.submitEvent({
              type: EventType.OrganizationCreated,
              occurredAt: new Date(baseTime),
              actor: 'test-actor',
              subjects: [holonId],
              payload: {
                holonType: HolonType.Organization,
                properties: { name: 'test' }
              },
              sourceSystem: 'test-system',
              causalLinks: {}
            });

            // Modify holon multiple times
            for (let i = 0; i < modificationCount; i++) {
              eventStore.submitEvent({
                type: EventType.OrganizationRealigned,
                occurredAt: new Date(baseTime + (i + 1) * 1000),
                actor: 'test-actor',
                subjects: [holonId],
                payload: {
                  properties: { version: i }
                },
                sourceSystem: 'test-system',
                causalLinks: {}
              });
            }

            // Replay events
            const state = projectionEngine.replayAllEvents();
            const holonState = state.holons.get(holonId);

            if (!holonState) {
              return false;
            }

            // Should have creation event + modification events
            return holonState.modificationEvents.length === modificationCount + 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle relationship creation and end events correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (sourceHolonId, targetHolonId, relationshipId) => {
            const eventStore = createEventStore();
            const projectionEngine = createStateProjectionEngine(eventStore);

            const baseTime = new Date('2024-01-01T00:00:00Z');
            const startTime = new Date(baseTime.getTime() + 1000);
            const endTime = new Date(baseTime.getTime() + 5000);

            // Create relationship
            eventStore.submitEvent({
              type: EventType.AssignmentStarted,
              occurredAt: startTime,
              actor: 'test-actor',
              subjects: [sourceHolonId, targetHolonId],
              payload: {
                relationshipId,
                relationshipType: RelationshipType.OCCUPIES,
                properties: { role: 'test' }
              },
              sourceSystem: 'test-system',
              causalLinks: {}
            });

            // End relationship
            eventStore.submitEvent({
              type: EventType.AssignmentEnded,
              occurredAt: endTime,
              actor: 'test-actor',
              subjects: [sourceHolonId, targetHolonId],
              payload: {
                relationshipId,
                relationshipType: RelationshipType.OCCUPIES,
                endDate: endTime
              },
              sourceSystem: 'test-system',
              causalLinks: {}
            });

            // Replay events
            const state = projectionEngine.replayAllEvents();
            const relationshipState = state.relationships.get(relationshipId);

            if (!relationshipState) {
              return false;
            }

            // Verify relationship has correct start and end times
            const hasCorrectStart = relationshipState.relationship.effectiveStart.getTime() === startTime.getTime();
            const hasCorrectEnd = relationshipState.relationship.effectiveEnd?.getTime() === endTime.getTime();

            return hasCorrectStart && hasCorrectEnd;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle holon deactivation events correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (holonId) => {
            const eventStore = createEventStore();
            const projectionEngine = createStateProjectionEngine(eventStore);

            const baseTime = new Date('2024-01-01T00:00:00Z');
            const createTime = new Date(baseTime.getTime() + 1000);
            const deactivateTime = new Date(baseTime.getTime() + 5000);

            // Create holon
            eventStore.submitEvent({
              type: EventType.OrganizationCreated,
              occurredAt: createTime,
              actor: 'test-actor',
              subjects: [holonId],
              payload: {
                holonType: HolonType.Organization,
                properties: { name: 'test' }
              },
              sourceSystem: 'test-system',
              causalLinks: {}
            });

            // Deactivate holon
            eventStore.submitEvent({
              type: EventType.OrganizationDeactivated,
              occurredAt: deactivateTime,
              actor: 'test-actor',
              subjects: [holonId],
              payload: { reason: 'test deactivation' },
              sourceSystem: 'test-system',
              causalLinks: {}
            });

            // Replay events
            const state = projectionEngine.replayAllEvents();
            const holonState = state.holons.get(holonId);

            if (!holonState) {
              return false;
            }

            // Verify holon is inactive
            return holonState.holon.status === 'inactive';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce consistent state when replaying the same events multiple times', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 5, maxLength: 15 }),
          (holonIds) => {
            const eventStore = createEventStore();

            const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

            // Create events
            for (let i = 0; i < holonIds.length; i++) {
              eventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt: new Date(baseTime + i * 1000),
                actor: 'test-actor',
                subjects: [holonIds[i]],
                payload: {
                  holonType: HolonType.Organization,
                  properties: { name: `org-${i}` }
                },
                sourceSystem: 'test-system',
                causalLinks: {}
              });
            }

            // Replay multiple times
            const engine1 = createStateProjectionEngine(eventStore);
            const engine2 = createStateProjectionEngine(eventStore);
            const engine3 = createStateProjectionEngine(eventStore);

            const state1 = engine1.replayAllEvents();
            const state2 = engine2.replayAllEvents();
            const state3 = engine3.replayAllEvents();

            // All states should be identical
            const holonCount1 = state1.holons.size;
            const holonCount2 = state2.holons.size;
            const holonCount3 = state3.holons.size;

            if (holonCount1 !== holonCount2 || holonCount2 !== holonCount3) {
              return false;
            }

            // Check each holon
            for (const holonId of holonIds) {
              const holon1 = state1.holons.get(holonId);
              const holon2 = state2.holons.get(holonId);
              const holon3 = state3.holons.get(holonId);

              if (!holon1 || !holon2 || !holon3) {
                return false;
              }

              const props1 = JSON.stringify(holon1.holon.properties);
              const props2 = JSON.stringify(holon2.holon.properties);
              const props3 = JSON.stringify(holon3.holon.properties);

              if (props1 !== props2 || props2 !== props3) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly handle incremental state updates with new events', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 5, maxLength: 15 }),
          fc.integer({ min: 1, max: 10 }),
          (holonIds, splitIndex) => {
            const eventStore = createEventStore();
            const projectionEngine = createStateProjectionEngine(eventStore);

            const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
            const splitPoint = Math.min(splitIndex, holonIds.length - 1);

            // Submit first batch of events
            const firstBatch = holonIds.slice(0, splitPoint);
            for (let i = 0; i < firstBatch.length; i++) {
              eventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt: new Date(baseTime + i * 1000),
                actor: 'test-actor',
                subjects: [firstBatch[i]],
                payload: {
                  holonType: HolonType.Organization,
                  properties: { name: `org-${i}` }
                },
                sourceSystem: 'test-system',
                causalLinks: {}
              });
            }

            // Replay first batch
            projectionEngine.replayAllEvents();

            // Submit second batch incrementally
            const secondBatch = holonIds.slice(splitPoint);
            for (let i = 0; i < secondBatch.length; i++) {
              const eventId = eventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt: new Date(baseTime + (splitPoint + i) * 1000),
                actor: 'test-actor',
                subjects: [secondBatch[i]],
                payload: {
                  holonType: HolonType.Organization,
                  properties: { name: `org-${splitPoint + i}` }
                },
                sourceSystem: 'test-system',
                causalLinks: {}
              });
              
              const fullEvent = eventStore.getEvent(eventId);
              if (fullEvent) {
                projectionEngine.applyNewEvent(fullEvent);
              }
            }

            // Get current state
            const state = projectionEngine.getCurrentState();

            // Verify all holons are present
            return state.holons.size === holonIds.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect event validity windows when projecting state', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (holonId) => {
            const eventStore = createEventStore();
            const projectionEngine = createStateProjectionEngine(eventStore);

            const baseTime = new Date('2024-01-01T00:00:00Z');
            const eventTime = new Date(baseTime.getTime() + 5000);
            const validityStart = new Date(baseTime.getTime() + 3000);
            const validityEnd = new Date(baseTime.getTime() + 7000);

            // Create event with validity window
            eventStore.submitEvent({
              type: EventType.OrganizationCreated,
              occurredAt: eventTime,
              actor: 'test-actor',
              subjects: [holonId],
              payload: {
                holonType: HolonType.Organization,
                properties: { name: 'test' }
              },
              sourceSystem: 'test-system',
              causalLinks: {},
              validityWindow: { start: validityStart, end: validityEnd }
            });

            // Query before validity window
            const stateBefore = projectionEngine.replayEventsAsOf(new Date(baseTime.getTime() + 2000));
            
            // Query during validity window
            const stateDuring = projectionEngine.replayEventsAsOf(new Date(baseTime.getTime() + 5000));
            
            // Query after validity window
            const stateAfter = projectionEngine.replayEventsAsOf(new Date(baseTime.getTime() + 8000));

            // Holon should not exist before or after validity window
            const notBeforeWindow = !stateBefore.holons.has(holonId);
            const existsDuringWindow = stateDuring.holons.has(holonId);
            const notAfterWindow = !stateAfter.holons.has(holonId);

            return notBeforeWindow && existsDuringWindow && notAfterWindow;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
