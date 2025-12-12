
import { Event, EventID, Timestamp } from '@som/shared-types';

export interface EventFilter {
    type?: string[];
    startTime?: Timestamp;
    endTime?: Timestamp;
    actor?: string;
    subjects?: string[];
}

export interface IEventStore {
    /**
     * Submit a new event to the store
     */
    submitEvent(event: Omit<Event, 'id' | 'recordedAt'>): Promise<EventID>;

    /**
     * Get an event by ID
     */
    getEvent(id: EventID): Promise<Event | undefined>;

    /**
     * Get all events matching filter
     */
    getEvents(filter?: EventFilter): Promise<Event[]>;

    /**
     * Get all events (for state replay)
     */
    getAllEvents(): Promise<Event[]>;
}
