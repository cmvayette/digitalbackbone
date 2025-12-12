
import {
    Event,
    EventType,
    ObligationDefinedPayload,
    CalendarEventCreatedPayload,
    HolonID
} from '@som/shared-types';
import { IEventStore } from '../core/interfaces/event-store';

/**
 * GovernanceCalendarAdapter
 * Listens for Policy/Obligation events and projects them onto the Calendar
 */
export class GovernanceCalendarAdapter {
    private eventStore: IEventStore;

    constructor(eventStore: IEventStore) {
        this.eventStore = eventStore;
    }

    /**
     * Process an incoming event to see if it triggers calendar generation
     */
    async handleEvent(event: Event): Promise<void> {
        if (event.type === EventType.ObligationDefined) {
            await this.processObligation(event as any);
        }
    }

    private async processObligation(event: Event & { payload: ObligationDefinedPayload }): Promise<void> {
        const payload = event.payload;

        // Skip if no scheduling info
        if (!payload.frequency || !payload.firstDueDate) {
            return;
        }

        console.log(`[GovernanceAdapter] Processing obligation: ${payload.description}`);

        // Calculate next 12 months of occurrences
        // Strict casting to string since we checked for existence above
        const occurrences = this.calculateOccurrences(
            new Date(payload.firstDueDate as string),
            payload.frequency as string,
            12
        );

        // Generate Calendar Events
        for (const date of occurrences) {
            const calendarEventId = `evt_cal_gov_${payload.obligationId}_${date.toISOString().split('T')[0]}`;

            // Define the event
            // Note: In a real system we might check if it already exists to avoid dupes on replay,
            // but for now we assume this runs on "new" events or handles idempotency at store level.

            const calendarPayload: CalendarEventCreatedPayload = {
                eventId: calendarEventId,
                title: payload.description,
                startTime: this.adjustTime(date, 8).toISOString(), // 08:00
                endTime: this.adjustTime(date, 17).toISOString(), // 17:00
                type: 'governance',
                classification: 'unclassified',
                participants: [
                    {
                        id: 'target_audience_placeholder', // TODO: Resolve responsibleRole to actual HolonIDs?
                        type: 'role',
                        role: payload.responsibleRole
                    }
                ]
            };

            const newEvent: Event = {
                id: `evt_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: EventType.CalendarEventCreated,
                occurredAt: new Date(),
                recordedAt: new Date(),
                actor: 'system:governance-adapter',
                subjects: [calendarEventId],
                sourceSystem: 'som-governance',
                payload: calendarPayload,
                causalLinks: {
                    causedBy: [event.id]
                }
            } as any; // Cast because TS might complain about partial matches if schemas are strict

            await this.eventStore.submitEvent(newEvent);
        }
    }

    private calculateOccurrences(start: Date, frequency: string, count: number): Date[] {
        const dates: Date[] = [];
        let current = new Date(start);

        for (let i = 0; i < count; i++) {
            dates.push(new Date(current));

            // Advance date
            switch (frequency) {
                case 'daily': current.setDate(current.getDate() + 1); break;
                case 'weekly': current.setDate(current.getDate() + 7); break;
                case 'monthly': current.setMonth(current.getMonth() + 1); break;
                case 'quarterly': current.setMonth(current.getMonth() + 3); break;
                case 'annual': current.setFullYear(current.getFullYear() + 1); break;
                case 'one-time': return dates; // Stop after first
            }
        }
        return dates;
    }

    private adjustTime(date: Date, hour: number): Date {
        const d = new Date(date);
        d.setHours(hour, 0, 0, 0);
        return d;
    }
}
