
import {
    Event,
    EventType,
    TaskCreatedPayload,
    TaskCompletedPayload,
    CalendarEventCreatedPayload,
    CalendarEventCancelledPayload
} from '@som/shared-types';
import { IEventStore } from '../core/interfaces/event-store';

/**
 * HowDoCalendarAdapter
 * Listens for Task/Process events and projects them onto the Calendar
 */
export class HowDoCalendarAdapter {
    private eventStore: IEventStore;

    constructor(eventStore: IEventStore) {
        this.eventStore = eventStore;
    }

    /**
     * Process an incoming event to see if it triggers calendar generation
     */
    async handleEvent(event: Event): Promise<void> {
        switch (event.type) {
            case EventType.TaskCreated:
                await this.processTaskCreated(event as any);
                break;
            case EventType.TaskCompleted:
                await this.processTaskCompleted(event as any);
                break;
        }
    }

    private async processTaskCreated(event: Event & { payload: TaskCreatedPayload }): Promise<void> {
        const payload = event.payload;

        if (!payload.dueDate) {
            return; // No deadline, no calendar entry
        }

        console.log(`[HowDoAdapter] Processing task: ${payload.title}`);

        const dueDate = new Date(payload.dueDate);
        const calendarEventId = `evt_cal_task_${payload.taskId}`;

        // Create a 1-hour block ending at the due date for visibility
        // or just a point in time? Calendar usually expects a range.
        const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour before

        const calendarPayload: CalendarEventCreatedPayload = {
            eventId: calendarEventId,
            title: `Due: ${payload.title}`,
            startTime: startTime.toISOString(),
            endTime: dueDate.toISOString(),
            type: 'task_deadline',
            classification: 'unclassified',
            participants: [
                {
                    id: payload.assigneeId,
                    type: 'person',
                    role: 'assignee'
                }
            ]
        };

        const newEvent: Event = {
            id: `evt_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: EventType.CalendarEventCreated,
            occurredAt: new Date(),
            recordedAt: new Date(),
            actor: 'system:how-do-adapter',
            subjects: [calendarEventId],
            sourceSystem: 'som-how-do',
            payload: calendarPayload,
            causalLinks: {
                causedBy: [event.id]
            }
        } as any;

        await this.eventStore.submitEvent(newEvent);
    }

    private async processTaskCompleted(event: Event & { payload: TaskCompletedPayload }): Promise<void> {
        // Find the associated calendar event and cancel it or mark distinct?
        // Logic: If task is done, maybe remove from calendar or mark as "Completed" (if calendar supports status).
        // For now, let's just leave it or maybe cancel it if it's strictly a "To-Do" list.
        // Actually, users usually like to see completed items. 
        // We will skip this for now to keep existing history, unless 'CalendarEventModified' is needed.
        // Let's implement basics first.
        return;
    }
}
