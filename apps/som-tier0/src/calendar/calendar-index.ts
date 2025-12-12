import { Event, EventType, EventID, HolonID } from '@som/shared-types';
import { CalendarEventCreatedPayload, CalendarEventModifiedPayload, CalendarEventCancelledPayload } from '@som/shared-types';
import { IEventStore } from '../event-store';

export interface CalendarEventView {
    id: EventID; // ID of the Created event acts as the Entity ID
    title: string;
    startTime: Date;
    endTime: Date;
    type: string;
    classification: string;
    participants: Array<{ id: string; type: string; role: string }>;
    status: 'active' | 'cancelled';
    sourceEventId: EventID; // Provenance
}

export class CalendarIndex {
    private events: Map<EventID, CalendarEventView>;
    private eventStore: IEventStore;

    constructor(eventStore: IEventStore) {
        this.eventStore = eventStore;
        this.events = new Map();
    }

    /**
     * Rebuild the index by replaying all relevant events
     */
    async rebuild(): Promise<void> {
        this.events.clear();
        const allEvents = await this.eventStore.getEvents({});

        // Filter and sort chronologically
        const calendarEvents = allEvents
            .filter(e =>
                e.type === EventType.CalendarEventCreated ||
                e.type === EventType.CalendarEventModified ||
                e.type === EventType.CalendarEventCancelled
            )
            .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

        for (const event of calendarEvents) {
            this.processEvent(event);
        }
    }

    /**
     * Process a single event to update the view
     */
    processEvent(event: Event): void {
        if (event.type === EventType.CalendarEventCreated) {
            const payload = event.payload as CalendarEventCreatedPayload;
            this.events.set(event.id, {
                id: event.id,
                title: payload.title,
                startTime: new Date(payload.startTime),
                endTime: new Date(payload.endTime),
                type: payload.type,
                classification: payload.classification,
                participants: payload.participants,
                status: 'active',
                sourceEventId: event.id
            });
        } else if (event.type === EventType.CalendarEventModified) {
            // Logic to find the target event (usually via subject or payload ref)
            // For now, assuming we track modifications via subjects
            const targetId = event.subjects[0]; // Convention: Subject[0] is the target ID
            const target = this.events.get(targetId);
            if (target) {
                const payload = event.payload as CalendarEventModifiedPayload;
                Object.assign(target, payload.changes);
                // Re-parse dates if they changed
                if (payload.changes.startTime) target.startTime = new Date(payload.changes.startTime as string);
                if (payload.changes.endTime) target.endTime = new Date(payload.changes.endTime as string);
            }
        } else if (event.type === EventType.CalendarEventCancelled) {
            const targetId = event.subjects[0];
            const target = this.events.get(targetId);
            if (target) {
                target.status = 'cancelled';
            }
        }
    }

    /**
     * Query events overlapping a window
     */
    queryEvents(start: Date, end: Date, filters?: {
        classification?: string;
        participantId?: HolonID;
        type?: string;
    }): CalendarEventView[] {
        const results: CalendarEventView[] = [];

        for (const event of this.events.values()) {
            if (event.status !== 'active') continue;

            // Overlap check
            // (StartA <= EndB) and (EndA >= StartB)
            const overlaps = event.startTime <= end && event.endTime >= start;

            if (overlaps) {
                if (filters) {
                    if (filters.classification && event.classification !== filters.classification) continue;
                    if (filters.type && event.type !== filters.type) continue;
                    if (filters.participantId) {
                        const manualParticipant = event.participants.some(p => p.id === filters.participantId);
                        if (!manualParticipant) continue;
                    }
                }
                results.push(event);
            }
        }

        return results.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
}
