
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
    submitEvent(event: Omit<Event, 'id' | 'recordedAt'>): EventID;

    /**
     * Get an event by ID
     */
    getEvent(id: EventID): Event | undefined;

    /**
     * Get all events matching filter
     */
    getEvents(filter?: EventFilter): Event[];

    /**
     * Get all events (for state replay)
     */
    getAllEvents(): Event[];
}
