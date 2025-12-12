import { Holon, HolonID, HolonType, Event, EventType } from '@som/shared-types';
import { IHolonRepository, CreateHolonParams, HolonQueryFilters } from '../core/interfaces/holon-repository';
import { InMemoryHolonRepository } from '../core/holon-registry';
import { IEventStore } from '../event-store';
import { QueryOptions } from '../core/interfaces/repository';

/**
 * A wrapper around InMemoryHolonRepository that also persists changes as events to the EventStore.
 * This is used during seeding to ensure that the valid NSW data we generate is actually saved to the DB.
 */
export class EventSourcingHolonRepository implements IHolonRepository {
    private inner: InMemoryHolonRepository;
    private eventStore: IEventStore;

    constructor(eventStore: IEventStore) {
        this.inner = new InMemoryHolonRepository();
        this.eventStore = eventStore;
    }

    // Delegate read operations directly to inner (which is kept in sync)
    async findById(id: string): Promise<Holon | null> { return this.inner.findById(id); }
    async find(query: Record<string, any>, options?: QueryOptions): Promise<Holon[]> { return this.inner.find(query, options); }
    async getHolon(holonID: HolonID): Promise<Holon | undefined> { return this.inner.getHolon(holonID); }
    async getHolonsByType(type: HolonType, filters?: HolonQueryFilters): Promise<Holon[]> { return this.inner.getHolonsByType(type, filters); }
    async getHolonHistory(holonID: HolonID): Promise<Holon | undefined> { return this.inner.getHolonHistory(holonID); }
    async getAllHolons(): Promise<Holon[]> { return this.inner.getAllHolons(); }
    async hasHolon(holonID: HolonID): Promise<boolean> { return this.inner.hasHolon(holonID); }
    async getHolonCount(type?: HolonType, includeInactive?: boolean): Promise<number> { return this.inner.getHolonCount(type, includeInactive); }

    // Intercept write operations to emit events
    async createHolon(params: CreateHolonParams): Promise<Holon> {
        // 1. Create in memory first to get the object
        const holon = await this.inner.createHolon(params);

        // 2. Map HolonType to EventType
        let eventType: EventType = EventType.OrganizationCreated; // Default fallback (safest cast for now)

        switch (params.type) {
            case HolonType.Organization: eventType = EventType.OrganizationCreated; break;
            case HolonType.Position: eventType = EventType.PositionCreated; break;
            case HolonType.Person: eventType = EventType.PersonCreated; break;
            case HolonType.Objective: eventType = EventType.ObjectiveCreated; break;
            case HolonType.LOE: eventType = EventType.LOECreated; break;
            case HolonType.Task: eventType = EventType.TaskCreated; break;
            case HolonType.Process: eventType = EventType.ProcessDefined; break;
            case HolonType.Document: eventType = EventType.DocumentCreated; break;
        }

        // 3. Persist Event
        const event: Omit<Event, 'id' | 'recordedAt'> = {
            type: eventType,
            occurredAt: new Date(),
            actor: params.createdBy || 'system-seed',
            subjects: [holon.id],
            payload: {
                holonType: holon.type,
                properties: holon.properties,
            },
            sourceSystem: 'seed-script',
            sourceDocument: params.sourceDocuments?.[0],
            causalLinks: {}
        };

        this.eventStore.submitEvent(event);

        return holon;
    }

    async markHolonInactive(holonID: HolonID, reason?: string): Promise<boolean> {
        const success = await this.inner.markHolonInactive(holonID, reason);
        const holon = await this.inner.getHolon(holonID);

        if (success && holon) {
            let eventType = EventType.OrganizationDeactivated;
            switch (holon.type) {
                case HolonType.Organization: eventType = EventType.OrganizationDeactivated; break;
                case HolonType.Position: eventType = EventType.PositionDeactivated; break;
                case HolonType.Process: eventType = EventType.ProcessArchived; break;
                default: break; // Other types might not have explicit deactivate events yet
            }

            // Emit Inactivated Event
            const event: Omit<Event, 'id' | 'recordedAt'> = {
                type: eventType,
                occurredAt: new Date(),
                actor: 'system-seed',
                subjects: [holonID],
                payload: { reason },
                sourceSystem: 'seed-script',
                causalLinks: {}
            };
            this.eventStore.submitEvent(event);
        }
        return success;
    }

    async save(item: Holon): Promise<void> {
        return this.inner.save(item);
    }

    async delete(id: string): Promise<void> {
        return this.inner.delete(id);
    }

    async clear(): Promise<void> {
        return this.inner.clear();
    }
}
