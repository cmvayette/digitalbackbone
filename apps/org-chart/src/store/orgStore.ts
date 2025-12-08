import { create } from 'zustand';
import type { Organization, Position, Person } from '../types/domain';
import { Faker, en } from '@faker-js/faker';

// --- MOCK GENERATOR ---
const faker = new Faker({ locale: [en] });

const generateMockData = () => {
    const orgs: Organization[] = [];
    const positions: Position[] = [];
    const people: Person[] = [];

    // 1. Create Root Org
    const rootId = 'org-root';
    orgs.push({
        id: rootId,
        type: 'Command',
        name: 'Digital Transformation Command',
        description: 'Leading the enterprise modernization efforts.',
        parentId: null,
        services: [],
        health: 'healthy'
    });

    // 2. Create Directorates
    const directorates = ['Operations', 'Strategy', 'Technology', 'Logistics'];
    directorates.forEach((dirName, idx) => {
        const dirId = `org-dir-${idx}`;
        orgs.push({
            id: dirId,
            type: 'Directorate',
            name: `${dirName} Directorate`,
            description: `Responsible for all ${dirName.toLowerCase()} activities.`,
            parentId: rootId,
            services: [{ id: `svc-${idx}`, name: `${dirName} Portal`, icon: 'Globe', url: '#' }],
            health: Math.random() > 0.8 ? 'warning' : 'healthy'
        });

        // 3. Create Divisions
        for (let i = 0; i < 3; i++) {
            const divId = `org-div-${idx}-${i}`;
            orgs.push({
                id: divId,
                type: 'Division',
                name: `${dirName} Div ${i + 1}`,
                description: 'Focused execution unit.',
                parentId: dirId,
                services: [],
                health: Math.random() > 0.9 ? 'critical' : 'healthy'
            });

            // 4. Create Positions for Division
            for (let p = 0; p < 5; p++) {
                const posId = `pos-${divId}-${p}`;
                const isVacant = Math.random() > 0.8;

                let personId: string | null = null;
                if (!isVacant) {
                    const psnId = `psn-${posId}`;
                    personId = psnId;
                    people.push({
                        id: psnId,
                        name: faker.person.fullName(),
                        rank: faker.helpers.arrayElement(['GS-12', 'GS-13', 'Capt', 'Maj', 'Ctr']),
                        type: faker.helpers.arrayElement(['Mil', 'Civ', 'Ctr']),
                        certificates: ['Sec+', 'PMP'],
                        primaryPositionId: posId,
                        tigerTeamIds: []
                    });
                }

                positions.push({
                    id: posId,
                    orgId: divId,
                    title: faker.person.jobTitle(),
                    billetStatus: Math.random() > 0.9 ? 'unfunded' : 'funded',
                    state: isVacant ? 'vacant' : 'filled',
                    assignedPersonId: personId,
                    qualifications: ['TS/SCI'],
                    isLeadership: p === 0
                });
            }
        }
    });

    return { orgs, positions, people };
};

// --- STORE ---
interface OrgState {
    organizations: Organization[];
    positions: Position[];
    people: Person[];

    // Actions
    addOrganization: (parentId: string, name: string, uic: string) => void;
    addPosition: (orgId: string, title: string, billetCode: string) => void;
    updatePosition: (id: string, updates: Partial<Position>) => void;
    assignPerson: (positionId: string, name: string, rank: string) => void;

    // Selectors helpers
    getOrgChildren: (orgId: string) => Organization[];
    getOrgPositions: (orgId: string) => Position[];
}

export const useOrgStore = create<OrgState>((set, get) => {
    const initialData = generateMockData();

    return {
        organizations: initialData.orgs,
        positions: initialData.positions,
        people: initialData.people,

        addOrganization: (parentId, name, uic) => set((state) => {
            const newOrg: Organization = {
                id: `org-${Date.now()}`,
                type: 'Division', // Default for now
                name: name,
                description: `Newly created unit: ${name}`,
                parentId: parentId,
                services: [],
                health: 'healthy',
                // Custom prop not in interface but used in sidebars/mocks
                // @ts-ignore
                uic: uic
            };
            return { organizations: [...state.organizations, newOrg] };
        }),

        addPosition: (orgId, title, billetCode) => set((state) => {
            const newPos: Position = {
                id: `pos-${Date.now()}`,
                orgId: orgId,
                title: title,
                billetStatus: 'unfunded',
                state: 'vacant',
                assignedPersonId: null,
                qualifications: [],
                isLeadership: false,
                // @ts-ignore
                billetCode: billetCode
            };
            return { positions: [...state.positions, newPos] };
        }),

        updatePosition: (id, updates) => set((state) => ({
            positions: state.positions.map(p => p.id === id ? { ...p, ...updates } : p)
        })),

        assignPerson: (positionId, name, rank) => set((state) => {
            // 1. Create new Person
            const newPerson: Person = {
                id: `psn-${Date.now()}`,
                name: name,
                rank: rank,
                type: 'Mil',
                certificates: [],
                primaryPositionId: positionId,
                tigerTeamIds: []
            };

            // 2. Update Position to link to Person
            const updatedPositions = state.positions.map(p =>
                p.id === positionId
                    ? { ...p, state: 'filled' as const, assignedPersonId: newPerson.id }
                    : p
            );

            return {
                people: [...state.people, newPerson],
                positions: updatedPositions
            };
        }),

        getOrgChildren: (orgId) => get().organizations.filter(o => o.parentId === orgId),
        getOrgPositions: (orgId) => get().positions.filter(p => p.orgId === orgId),
    };
});
