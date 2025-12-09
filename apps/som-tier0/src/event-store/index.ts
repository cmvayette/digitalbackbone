/**
 * Event Store module for the Semantic Operating Model
 * Provides immutable append-only log of all state changes
 */

import { Event, EventType } from '@som/shared-types';
import { EventID, HolonID, Timestamp } from '@som/shared-types';
import { randomUUID } from 'crypto';

/**
 * Event store interface with append-only semantics
 */
import { IEventStore, EventFilter } from '../core/interfaces/event-store';

export { IEventStore, EventFilter };
// export { InMemoryEventStore } from './index'; // Removed duplicate
export { SQLiteEventStore } from './sqlite-store';


/**
 * In-memory implementation of the event store
 * Events are immutable - no update or delete operations are provided
 */
export class InMemoryEventStore implements IEventStore {
  private events: Map<EventID, Event> = new Map();
  private eventsByHolon: Map<HolonID, EventID[]> = new Map();
  private eventsByType: Map<EventType, EventID[]> = new Map();
  private eventsInOrder: EventID[] = [];

  /**
   * Generate a unique event ID
   */
  private generateEventId(): EventID {
    return randomUUID();
  }

  /**
   * Validate event timestamp
   */
  private validateTimestamp(occurredAt: Timestamp): void {
    if (!(occurredAt instanceof Date)) {
      throw new Error('occurredAt must be a Date object');
    }

    if (isNaN(occurredAt.getTime())) {
      throw new Error('occurredAt must be a valid Date');
    }

    // Check if timestamp is not too far in the future (allow 1 hour clock skew)
    const now = new Date();
    const maxFuture = new Date(now.getTime() + 60 * 60 * 1000);
    if (occurredAt > maxFuture) {
      throw new Error('occurredAt cannot be more than 1 hour in the future');
    }
  }

  /**
   * Submit a new event to the store
   * Events are immutable once submitted
   */
  submitEvent(eventData: Omit<Event, 'id' | 'recordedAt'>): EventID {
    // Validate timestamp
    this.validateTimestamp(eventData.occurredAt);

    // Generate event ID and record timestamp
    const eventId = this.generateEventId();
    const recordedAt = new Date();

    // Create immutable event
    const event: Event = {
      ...eventData,
      id: eventId,
      recordedAt,
      // Deep clone to prevent external modifications
      subjects: [...eventData.subjects],
      payload: { ...eventData.payload },
      causalLinks: {
        precededBy: eventData.causalLinks.precededBy ? [...eventData.causalLinks.precededBy] : undefined,
        causedBy: eventData.causalLinks.causedBy ? [...eventData.causalLinks.causedBy] : undefined,
        groupedWith: eventData.causalLinks.groupedWith ? [...eventData.causalLinks.groupedWith] : undefined,
      },
    };

    // Store event (immutable)
    this.events.set(eventId, Object.freeze(event));
    this.eventsInOrder.push(eventId);

    // Index by holon
    for (const holonId of event.subjects) {
      if (!this.eventsByHolon.has(holonId)) {
        this.eventsByHolon.set(holonId, []);
      }
      this.eventsByHolon.get(holonId)!.push(eventId);
    }

    // Index by type
    if (!this.eventsByType.has(event.type)) {
      this.eventsByType.set(event.type, []);
    }
    this.eventsByType.get(event.type)!.push(eventId);

    return eventId;

  }

  /**
   * Get an event by its ID
   * Returns a frozen copy to maintain immutability
   */
  getEvent(eventId: EventID): Event | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get all events matching filter
   */
  getEvents(filter?: EventFilter): Event[] {
    let events = this.eventsInOrder.map(id => this.events.get(id)!);

    if (filter) {
      if (filter.type) {
        events = events.filter(e => filter.type!.includes(e.type));
      }
      if (filter.startTime) {
        events = events.filter(e => e.occurredAt >= filter.startTime!);
      }
      if (filter.endTime) {
        events = events.filter(e => e.occurredAt <= filter.endTime!);
      }
      if (filter.actor) {
        events = events.filter(e => e.actor === filter.actor);
      }
      if (filter.subjects) {
        events = events.filter(e => e.subjects.some(s => filter.subjects!.includes(s)));
      }
    }
    return events;
  }

  /**
    * Legacy strict methods (can delegate to getEvents)
    */

  getEventsByHolon(holonId: HolonID, timeRange?: { start: Timestamp; end: Timestamp }): Event[] {
    return this.getEvents({
      subjects: [holonId],
      startTime: timeRange?.start,
      endTime: timeRange?.end
    });
  }

  getEventsByType(eventType: EventType, timeRange?: { start: Timestamp; end: Timestamp }): Event[] {
    return this.getEvents({
      type: [eventType],
      startTime: timeRange?.start,
      endTime: timeRange?.end
    });
  }

  getEventsByTimeRange(timeRange: { start: Timestamp; end: Timestamp }): Event[] {
    return this.getEvents({
      startTime: timeRange.start,
      endTime: timeRange.end
    });
  }



  /**
   * Get all events (for testing/debugging)
   */
  getAllEvents(): Event[] {
    return this.eventsInOrder.map(id => this.events.get(id)!);
  }
}

/**
 * Create a new in-memory event store instance
 */
export function createEventStore(): IEventStore {
  return new InMemoryEventStore();
}
