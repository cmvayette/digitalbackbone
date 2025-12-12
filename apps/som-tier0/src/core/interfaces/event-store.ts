
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

export interface Snapshot {
    id: string; // Unique ID for finding this snapshot (e.g. "latest", or timestamp based) - actually usually one snapshot per aggregate but here we are snapshotting the WHOLE projection mostly?
    // Wait, StateProjectionEngine projects ALL holons.
    // So a snapshot is a "Global State Snapshot"? Or per-holon?
    // Global state snapshot is easier for "replayAllEvents".
    // "replayEventsAsOf" would benefit from Global Snapshot at time T.

    timestamp: Timestamp;
    lastEventId: EventID;
    state: any; // The ProjectedState object serialized
}

export interface ISnapshotStore {
    /**
     * Save a snapshot
     */
    saveSnapshot(snapshot: Snapshot): Promise<void>;

    /**
     * Get the latest snapshot before or at a specific timestamp
     */
    getLatestSnapshot(timestamp: Timestamp): Promise<Snapshot | undefined>;
}
