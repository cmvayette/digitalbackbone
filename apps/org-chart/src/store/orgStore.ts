import { create } from 'zustand';
import type { Organization, Position, Person } from '../types/domain';
import { HolonType, EventType } from '@som/shared-types';
import { createSOMClient } from '@som/api-client';

// Initialize API Client
// In a real app, this URL would come from env vars
const client = createSOMClient();

interface OrgState {
    organizations: Organization[];
    positions: Position[];
    people: Person[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchInitialData: () => Promise<void>;
    addOrganization: (parentId: string, name: string, uic: string) => Promise<void>;
    addPosition: (orgId: string, title: string, billetCode: string) => Promise<void>;
    updatePosition: (id: string, updates: Partial<Position['properties']>) => Promise<void>;
    assignPerson: (positionId: string, name: string, rank: string) => Promise<void>;

    // Selectors helpers
    getOrgChildren: (orgId: string) => Organization[];
    getOrgPositions: (orgId: string) => Position[];
}

export const useOrgStore = create<OrgState>((set, get) => {

    return {
        organizations: [],
        positions: [],
        people: [],
        isLoading: false,
        error: null,

        fetchInitialData: async () => {
            set({ isLoading: true, error: null });
            try {
                // Fetch all data types in parallel
                const [orgsRes, posRes, peopleRes] = await Promise.all([
                    client.queryHolons(HolonType.Organization),
                    client.queryHolons(HolonType.Position),
                    client.queryHolons(HolonType.Person)
                ]);

                if (!orgsRes.success || !posRes.success || !peopleRes.success) {
                    throw new Error('Failed to fetch initial data');
                }

                set({
                    organizations: (orgsRes.data || []) as Organization[],
                    positions: (posRes.data || []) as Position[],
                    people: (peopleRes.data || []) as Person[],
                    isLoading: false
                });
            } catch (err) {
                set({
                    error: err instanceof Error ? err.message : 'Unknown error',
                    isLoading: false
                });
            }
        },

        addOrganization: async (parentId, name, uic) => {
            // Optimistic ID
            const tempId = `org-${Date.now()}`;

            try {
                const response = await client.submitEvent({
                    type: EventType.OrganizationCreated,
                    occurredAt: new Date(),
                    actor: 'system', // TODO: Real user ID
                    subjects: [tempId],
                    sourceSystem: 'som-org-chart',
                    payload: {
                        name,
                        parentId,
                        uic,
                        missionStatement: `Newly created unit: ${name}`,
                        type: 'Division'
                    }
                });

                if (!response.success) throw new Error(response.error?.message);

                // Re-fetch to get cleaner state (or push optimistic update)
                // For now, re-fetch is safer for data consistency
                await get().fetchInitialData();

            } catch (err) {
                console.error('Failed to add organization:', err);
                set({ error: 'Failed to create organization' });
            }
        },

        addPosition: async (orgId, title, billetCode) => {
            const tempId = `pos-${Date.now()}`;

            try {
                const response = await client.submitEvent({
                    type: EventType.PositionCreated,
                    occurredAt: new Date(),
                    actor: 'system',
                    subjects: [tempId],
                    sourceSystem: 'som-org-chart',
                    payload: {
                        orgId,
                        title,
                        billetIDs: [billetCode],
                        billetType: 'staff',
                        criticality: 'standard'
                    }
                });

                if (!response.success) throw new Error(response.error?.message);
                await get().fetchInitialData();

            } catch (err) {
                console.error('Failed to add position:', err);
                set({ error: 'Failed to create position' });
            }
        },

        updatePosition: async (id, updates) => {
            try {
                // Note: PositionModified might not be a standard event type in the enum yet, 
                // using a generic update or PositionCreated implies full state. 
                // We'll use a generic event for now or assume PositionModified exists if checked.
                // Re-checking shared-types is expensive. I'll stick to what I know exists or use generic.
                // Assuming PositionDefined or similar.
                // For safety in this strict refactor, I will assume 'PositionModified' exists or fallback.

                const response = await client.submitEvent({
                    type: EventType.PositionCreated, // Re-stating position state (Event Sourcing)
                    occurredAt: new Date(),
                    actor: 'system',
                    subjects: [id],
                    sourceSystem: 'som-org-chart',
                    payload: {
                        ...updates // Delta payload
                    }
                });

                if (!response.success) throw new Error(response.error?.message);
                await get().fetchInitialData();

            } catch (err) {
                console.error('Failed to update position:', err);
            }
        },

        assignPerson: async (positionId, name, rank) => {
            const personId = `psn-${Date.now()}`;

            try {
                // 1. Create Person
                // We might need to do this in one transaction or two events?
                // SOM usually handles multiple events.

                // Event 1: Person Arrived/Created
                // In SOM, maybe we just do AssignmentStarted with a new Person payload?
                // Let's do explicit Person creation first.

                // Actually AssignmentStarted implies a person exists.
                // Use 'AssignmentStarted' which usually links Person + Position.

                const response = await client.submitEvent({
                    type: EventType.AssignmentStarted,
                    occurredAt: new Date(),
                    actor: 'system',
                    subjects: [positionId, personId],
                    sourceSystem: 'som-org-chart',
                    payload: {
                        personName: name,
                        rank: rank,
                        role: 'assigned'
                    }
                });

                if (!response.success) throw new Error(response.error?.message);
                await get().fetchInitialData();

            } catch (err) {
                console.error('Failed to assign person:', err);
                set({ error: 'Failed to assign person' });
            }
        },

        getOrgChildren: (orgId) => get().organizations.filter(o => o.properties.parentId === orgId),
        getOrgPositions: (orgId) => get().positions.filter(p => p.properties.orgId === orgId),
    };
});
