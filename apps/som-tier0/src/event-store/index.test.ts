/**
 * Property-based tests for Event Store
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createEventStore, EventStore } from './index';
import { Event, EventType } from '../core/types/event';
import { HolonID, EventID } from '../core/types/holon';

// Generator for valid event types
const genEventType = (): fc.Arbitrary<EventType> => {
  const eventTypes = Object.values(EventType);
  return fc.constantFrom(...eventTypes);
};

// Generator for valid timestamps (within reasonable range)
const genTimestamp = (): fc.Arbitrary<Date> => {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneHourFromNow = now + 60 * 60 * 1000;
  return fc.integer({ min: oneYearAgo, max: oneHourFromNow }).map(ms => new Date(ms));
};

// Generator for holon IDs
const genHolonId = (): fc.Arbitrary<HolonID> => {
  return fc.uuid();
};

// Generator for event IDs
const genEventId = (): fc.Arbitrary<EventID> => {
  return fc.uuid();
};

// Generator for causal links
const genCausalLinks = (): fc.Arbitrary<Event['causalLinks']> => {
  return fc.record({
    precededBy: fc.option(fc.array(genEventId(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
    causedBy: fc.option(fc.array(genEventId(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
    groupedWith: fc.option(fc.array(genEventId(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  });
};

// Generator for event payload
const genPayload = (): fc.Arbitrary<Record<string, any>> => {
  return fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null)
    ),
    { minKeys: 0, maxKeys: 5 }
  );
};

// Generator for complete event data (without id and recordedAt)
const genEventData = (): fc.Arbitrary<Omit<Event, 'id' | 'recordedAt'>> => {
  return fc.record({
    type: genEventType(),
    occurredAt: genTimestamp(),
    actor: genHolonId(),
    subjects: fc.array(genHolonId(), { minLength: 1, maxLength: 5 }),
    payload: genPayload(),
    sourceSystem: fc.constantFrom('NSIPS', 'DRRS', 'TrainingSystem', 'LogisticsSystem', 'TestSystem'),
    sourceDocument: fc.option(genHolonId(), { nil: undefined }),
    validityWindow: fc.option(
      fc.record({
        start: genTimestamp(),
        end: genTimestamp(),
      }),
      { nil: undefined }
    ),
    causalLinks: genCausalLinks(),
  });
};

describe('Event Store', () => {
  let eventStore: EventStore;

  beforeEach(() => {
    eventStore = createEventStore();
  });

  describe('Basic Operations', () => {
    test('should submit and retrieve events', () => {
      const eventData: Omit<Event, 'id' | 'recordedAt'> = {
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'actor-123',
        subjects: ['subject-456'],
        payload: { name: 'Test Org' },
        sourceSystem: 'TestSystem',
        causalLinks: {},
      };

      const eventId = eventStore.submitEvent(eventData);
      const retrieved = eventStore.getEvent(eventId);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(eventId);
      expect(retrieved!.type).toBe(eventData.type);
    });

    test('should validate timestamps', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
      const eventData: Omit<Event, 'id' | 'recordedAt'> = {
        type: EventType.OrganizationCreated,
        occurredAt: futureDate,
        actor: 'actor-123',
        subjects: ['subject-456'],
        payload: {},
        sourceSystem: 'TestSystem',
        causalLinks: {},
      };

      expect(() => eventStore.submitEvent(eventData)).toThrow();
    });
  });

  describe('Property Tests', () => {
    /**
     * **Feature: semantic-operating-model, Property 10: Event immutability**
     * **Validates: Requirements 3.3**
     * 
     * For any event in the event store, it must never be modified;
     * corrections must be made via new compensating events.
     */
    test('Property 10: Event immutability - events cannot be modified after submission', () => {
      fc.assert(
        fc.property(
          genEventData(),
          (eventData) => {
            // Create a fresh event store for this test run
            const testStore = createEventStore();
            
            const eventId = testStore.submitEvent(eventData);
            const retrieved = testStore.getEvent(eventId);
            
            if (!retrieved) {
              return false;
            }

            // Attempt to modify the retrieved event
            const originalType = retrieved.type;
            const originalActor = retrieved.actor;
            const originalSubjectsLength = retrieved.subjects.length;
            const originalPayload = JSON.stringify(retrieved.payload);
            
            // Try to modify various fields (should fail due to Object.freeze)
            try {
              (retrieved as any).type = EventType.OrganizationDeactivated;
              (retrieved as any).actor = 'modified-actor';
              (retrieved as any).payload.modified = true;
              retrieved.subjects.push('new-subject');
            } catch (e) {
              // Modifications may throw in strict mode
            }
            
            // Retrieve again and verify nothing changed
            const retrievedAgain = testStore.getEvent(eventId);
            
            return (
              retrievedAgain !== undefined &&
              retrievedAgain.type === originalType &&
              retrievedAgain.actor === originalActor &&
              retrievedAgain.subjects.length === originalSubjectsLength &&
              JSON.stringify(retrievedAgain.payload) === originalPayload
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 11: Event completeness**
     * **Validates: Requirements 3.1**
     * 
     * For any state change, the generated event must contain event ID, type,
     * timestamp, actor, subjects, payload, source system, and source document.
     */
    test('Property 11: Event completeness - all required fields are present', () => {
      fc.assert(
        fc.property(
          genEventData(),
          (eventData) => {
            // Create a fresh event store for this test run
            const testStore = createEventStore();
            
            const eventId = testStore.submitEvent(eventData);
            const retrieved = testStore.getEvent(eventId);
            
            if (!retrieved) {
              return false;
            }

            // Verify all required fields are present
            const hasEventId = typeof retrieved.id === 'string' && retrieved.id.length > 0;
            const hasType = Object.values(EventType).includes(retrieved.type);
            const hasOccurredAt = retrieved.occurredAt instanceof Date;
            const hasRecordedAt = retrieved.recordedAt instanceof Date;
            const hasActor = typeof retrieved.actor === 'string' && retrieved.actor.length > 0;
            const hasSubjects = Array.isArray(retrieved.subjects) && retrieved.subjects.length > 0;
            const hasPayload = typeof retrieved.payload === 'object' && retrieved.payload !== null;
            const hasSourceSystem = typeof retrieved.sourceSystem === 'string' && retrieved.sourceSystem.length > 0;
            const hasCausalLinks = typeof retrieved.causalLinks === 'object' && retrieved.causalLinks !== null;
            
            // Verify recordedAt is set to a reasonable time (within last minute)
            const now = Date.now();
            const recordedAtTime = retrieved.recordedAt.getTime();
            const isRecordedAtRecent = recordedAtTime <= now && recordedAtTime >= now - 60000;
            
            return (
              hasEventId &&
              hasType &&
              hasOccurredAt &&
              hasRecordedAt &&
              hasActor &&
              hasSubjects &&
              hasPayload &&
              hasSourceSystem &&
              hasCausalLinks &&
              isRecordedAtRecent
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property: Event ID uniqueness - all submitted events have unique IDs', () => {
      fc.assert(
        fc.property(
          fc.array(genEventData(), { minLength: 2, maxLength: 50 }),
          (eventsData) => {
            // Create a fresh event store for this test run
            const testStore = createEventStore();
            
            const eventIds = eventsData.map(data => testStore.submitEvent(data));
            const uniqueIds = new Set(eventIds);
            
            return eventIds.length === uniqueIds.size;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property: Query by holon returns all events for that holon', () => {
      fc.assert(
        fc.property(
          genHolonId(),
          fc.array(
            fc.tuple(genEventData(), fc.boolean()),
            { minLength: 1, maxLength: 20 }
          ),
          (targetHolonId, eventsWithFlags) => {
            // Create a fresh event store for this test run
            const testStore = createEventStore();
            
            // Submit events, some including the target holon
            const eventIds: EventID[] = [];
            let expectedCount = 0;
            
            for (const [eventData, shouldIncludeHolon] of eventsWithFlags) {
              // Use the boolean flag to decide whether to include target holon
              if (shouldIncludeHolon) {
                eventData.subjects = [targetHolonId, ...eventData.subjects];
                expectedCount++;
              }
              eventIds.push(testStore.submitEvent(eventData));
            }
            
            // Query events by holon
            const holonEvents = testStore.getEventsByHolon(targetHolonId);
            
            // Verify all returned events include the target holon
            const allIncludeHolon = holonEvents.every(event => 
              event.subjects.includes(targetHolonId)
            );
            
            // Verify count matches
            return allIncludeHolon && holonEvents.length === expectedCount;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Property: Query by type returns all events of that type', () => {
      fc.assert(
        fc.property(
          genEventType(),
          fc.array(
            fc.tuple(genEventData(), fc.boolean()),
            { minLength: 1, maxLength: 20 }
          ),
          (targetType, eventsWithFlags) => {
            // Create a fresh event store for this test run
            const testStore = createEventStore();
            
            // Submit events, some with the target type
            let expectedCount = 0;
            
            for (const [eventData, shouldUseTargetType] of eventsWithFlags) {
              // Use the boolean flag to decide whether to use target type
              if (shouldUseTargetType) {
                eventData.type = targetType;
              } else {
                // Ensure it's NOT the target type
                const otherTypes = Object.values(EventType).filter(t => t !== targetType);
                if (otherTypes.length > 0) {
                  eventData.type = otherTypes[0];
                }
              }
              
              if (eventData.type === targetType) {
                expectedCount++;
              }
              
              testStore.submitEvent(eventData);
            }
            
            // Query events by type
            const typeEvents = testStore.getEventsByType(targetType);
            
            // Verify all returned events have the target type
            const allMatchType = typeEvents.every(event => event.type === targetType);
            
            // Verify count matches
            return allMatchType && typeEvents.length === expectedCount;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Property: Time range queries return only events within range', () => {
      fc.assert(
        fc.property(
          fc.array(genEventData(), { minLength: 5, maxLength: 20 }),
          (eventsData) => {
            // Create a fresh event store for this test run
            const testStore = createEventStore();
            
            // Submit all events
            eventsData.forEach(data => testStore.submitEvent(data));
            
            // Get all events and find min/max timestamps
            const allEvents = testStore.getAllEvents();
            if (allEvents.length === 0) return true;
            
            const timestamps = allEvents.map(e => e.occurredAt.getTime());
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            
            // Query with a range that should include some but not all events
            const midTime = minTime + (maxTime - minTime) / 2;
            const rangeStart = new Date(minTime);
            const rangeEnd = new Date(midTime);
            
            const rangeEvents = testStore.getEventsByTimeRange({
              start: rangeStart,
              end: rangeEnd,
            });
            
            // Verify all returned events are within range
            return rangeEvents.every(event => 
              event.occurredAt >= rangeStart && event.occurredAt <= rangeEnd
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
