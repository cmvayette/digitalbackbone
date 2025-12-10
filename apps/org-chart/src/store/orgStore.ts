import { create } from 'zustand';
import type { Organization, Position, Person } from '../types/domain';
import { HolonType, EventType } from '@som/shared-types';
import type { TypedEvent } from '@som/shared-types';
import { createSOMClient } from '@som/api-client';
import { v4 as uuidv4 } from 'uuid';

// Initialize API Client
// In a real app, this URL would come from env vars
const client = createSOMClient();

// Type for the current user context
interface UserContext {
    id: string;
    name: string;
    role: string;
}

interface OrgState {
    organizations: Organization[];
    positions: Position[];
    people: Person[];
    items: any[]; // Placeholder for generic items if needed, or remove
    currentUser: UserContext; // Dynamic user context
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchInitialData: () => Promise<void>;
    setCurrentUser: (user: UserContext) => void;
    addOrganization: (parentId: string, name: string, uic: string) => Promise<void>;
    addPosition: (orgId: string, title: string, billetCode: string) => Promise<void>;
    updatePosition: (id: string, updates: Partial<Position['properties']>) => Promise<void>;
    assignPerson: (positionId: string, name: string, rank: string) => Promise<void>;

    // Helpers
    // Centralized event submission to reduce boilerplate
    submitEvent: <T extends EventType>(
        type: T,
        subjects: string[],
        payload: TypedEvent<T>['payload']
    ) => Promise<boolean>;

    // Selectors helpers
    getOrgChildren: (orgId: string) => Organization[];
    getOrgPositions: (orgId: string) => Position[];
}

export const useOrgStore = create<OrgState>((set, get) => {

    return {
        organizations: [],
        positions: [],
        people: [],
        items: [],
        currentUser: {
            id: 'user-default-001', // Default until auth is hooked up
            name: 'Default User',
            role: 'admin'
        },
        isLoading: false,
        error: null,

        setCurrentUser: (user) => set({ currentUser: user }),

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

        // Helper to centralize event submission
        submitEvent: async <T extends EventType>(
            type: T,
            subjects: string[],
            payload: TypedEvent<T>['payload']
        ): Promise<boolean> => {
            try {
                const response = await client.submitEvent({
                    type,
                    occurredAt: new Date(),
                    actor: get().currentUser.id,
                    subjects,
                    sourceSystem: 'som-org-chart',
                    payload
                } as any); // Cast because client.submitEvent might still expect the loose Event type depending on package version, but we are enforcing strictness here.

                if (!response.success) {
                    throw new Error(response.error?.message || 'Event submission failed');
                }
                return true;
            } catch (error) {
                console.error(`Failed to submit event ${type}:`, error);
                set({ error: error instanceof Error ? error.message : 'Unknown error' });
                return false;
            }
        },

        addOrganization: async (parentId, name, uic) => {
            const newOrgId = uuidv4();

            const success = await get().submitEvent(
                EventType.OrganizationCreated,
                [newOrgId],
                {
                    name,
                    parentId,
                    uic,
                    missionStatement: `Newly created unit: ${name}`,
                    type: 'Division'
                }
            );

            if (success) {
                await get().fetchInitialData();
            }
        },

        addPosition: async (orgId, title, billetCode) => {
            const newPosId = uuidv4();

            const success = await get().submitEvent(
                EventType.PositionCreated,
                [newPosId],
                {
                    orgId,
                    title,
                    billetIDs: [billetCode],
                    billetType: 'staff',
                    criticality: 'standard'
                }
            );

            if (success) {
                await get().fetchInitialData();
            }
        },

        updatePosition: async (id, updates) => {
            // Using PositionModified which is now fully supported
            const success = await get().submitEvent(
                EventType.PositionModified,
                [id],
                {
                    positionId: id,
                    updates: updates as Record<string, unknown> // Ensure compatibility with Record<string, unknown>
                }
            );

            if (success) {
                await get().fetchInitialData();
            }
        },

        assignPerson: async (positionId, name, rank) => {
            // In a real flow, we might select an existing person or create a new one.
            // Here we assume creating a new person for the assignment if they don't exist.
            // For rigorous SOM compliance, we should probably emit PersonCreated then AssignmentStarted.

            const newPersonId = uuidv4();
            const relationshipId = uuidv4(); // Explicit relationship ID if needed, or backend generates

            // 1. Create Person
            const personCreated = await get().submitEvent(
                EventType.PersonCreated,
                [newPersonId],
                {
                    name,
                    rank,
                    identifiers: {}
                }
            );

            if (!personCreated) return;

            // 2. Assign to Position
            const assigned = await get().submitEvent(
                EventType.AssignmentStarted,
                [positionId, newPersonId],
                {
                    personId: newPersonId,
                    positionId: positionId,
                    relationshipId,
                    personName: name,
                    rank: rank,
                    role: 'assigned',
                    authorityLevel: 'authoritative'
                }
            );

            if (assigned) {
                await get().fetchInitialData();
            }
        },

        getOrgChildren: (orgId) => get().organizations.filter(o => o.properties.parentId === orgId),
        getOrgPositions: (orgId) => get().positions.filter(p => p.properties.orgId === orgId),
    };
});
