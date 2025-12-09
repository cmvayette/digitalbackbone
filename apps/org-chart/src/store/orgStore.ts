import { create } from 'zustand';
import type { Organization, Position, Person } from '../types/domain';
import { HolonType } from '@som/shared-types';
import { Faker, en } from '@faker-js/faker';

// --- MOCK GENERATOR ---
const faker = new Faker({ locale: [en] });

const generateMockData = () => {
    const orgs: Organization[] = [];
    const positions: Position[] = [];
    const people: Person[] = [];

    // Helper to create basic Holon fields with strict type
    const createHolon = <T extends HolonType>(type: T) => ({
        createdAt: new Date(),
        createdBy: 'system',
        status: 'active' as const,
        sourceDocuments: [],
        type
    });

    // 1. Create Root Org
    const rootId = 'org-root';
    orgs.push({
        ...createHolon(HolonType.Organization),
        type: HolonType.Organization,
        id: rootId,
        properties: {
            name: 'Digital Transformation Command',
            missionStatement: 'Leading the enterprise modernization efforts.', // Mapped from description
            parentId: null,
            uics: [],
            services: [],
            health: 'healthy',
            type: 'Command',
            echelonLevel: 'Command',
            isTigerTeam: false
        }
    });

    // 2. Create Directorates
    const directorates = ['Operations', 'Strategy', 'Technology', 'Logistics'];
    directorates.forEach((dirName, idx) => {
        const dirId = `org-dir-${idx}`;
        orgs.push({
            ...createHolon(HolonType.Organization),
            type: HolonType.Organization,
            id: dirId,
            properties: {
                name: `${dirName} Directorate`,
                missionStatement: `Responsible for all ${dirName.toLowerCase()} activities.`,
                parentId: rootId,
                uics: [],
                services: [{
                    id: `svc-${idx}`,
                    name: `${dirName} Portal`,
                    icon: 'Globe',
                    url: '#',
                    ownerType: 'team',
                    ownerId: dirId,
                    ownerMetadata: {
                        name: `${dirName} Team`,
                        iconName: 'Users'
                    }
                }],
                health: Math.random() > 0.8 ? 'warning' : 'healthy',
                type: 'Directorate',
                echelonLevel: 'Directorate',
                isTigerTeam: false
            }
        });

        // 3. Create Divisions
        for (let i = 0; i < 3; i++) {
            const divId = `org-div-${idx}-${i}`;
            orgs.push({
                ...createHolon(HolonType.Organization),
                type: HolonType.Organization,
                id: divId,
                properties: {
                    name: `${dirName} Div ${i + 1}`,
                    missionStatement: 'Focused execution unit.',
                    parentId: dirId,
                    uics: [],
                    services: [],
                    health: Math.random() > 0.9 ? 'critical' : 'healthy',
                    type: 'Division',
                    echelonLevel: 'Division',
                    isTigerTeam: false
                }
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
                        ...createHolon(HolonType.Person),
                        type: HolonType.Person,
                        id: psnId,
                        properties: {
                            name: faker.person.fullName(),
                            designatorRating: faker.helpers.arrayElement(['GS-12', 'GS-13', 'Capt', 'Maj', 'Ctr']), // Mapped from rank
                            category: faker.helpers.arrayElement(['civilian', 'contractor', 'active_duty']), // Mapped from type
                            serviceBranch: 'USN',
                            edipi: '1234567890',
                            serviceNumbers: [],
                            dob: new Date(),
                            // Custom/Legacy props stored in properties for now
                            certificates: ['Sec+', 'PMP'],
                            primaryPositionId: posId,
                            tigerTeamIds: []
                        }
                    });
                }

                positions.push({
                    ...createHolon(HolonType.Position),
                    type: HolonType.Position,
                    id: posId,
                    properties: {
                        orgId: divId,
                        title: faker.person.jobTitle(),
                        billetType: 'staff',
                        gradeRange: { min: 'O-1', max: 'O-3' },
                        designatorExpectations: [],
                        criticality: 'standard',
                        billetIDs: [],
                        // Legacy props
                        billetStatus: Math.random() > 0.9 ? 'unfunded' : 'funded',
                        state: isVacant ? 'vacant' : 'filled',
                        assignedPersonId: personId,
                        qualifications: ['TS/SCI'],
                        isLeadership: p === 0
                    }
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
    // TODO: These must emit SOM Events in production:
    addOrganization: (parentId: string, name: string, uic: string) => void; // -> OrganizationCreated
    addPosition: (orgId: string, title: string, billetCode: string) => void; // -> PositionCreated
    updatePosition: (id: string, updates: Partial<Position['properties']>) => void; // -> PositionModified
    assignPerson: (positionId: string, name: string, rank: string) => void; // -> AssignmentStarted

    // Selectors helpers
    getOrgChildren: (orgId: string) => Organization[];
    getOrgPositions: (orgId: string) => Position[];
}

export const useOrgStore = create<OrgState>((set, get) => {
    const initialData = generateMockData();

    const createHolon = (type: HolonType) => ({
        createdAt: new Date(),
        createdBy: 'system',
        status: 'active' as const,
        sourceDocuments: [],
        type
    });

    return {
        organizations: initialData.orgs,
        positions: initialData.positions,
        people: initialData.people,

        addOrganization: (parentId, name, uic) => set((state) => {
            const newOrg: Organization = {
                ...createHolon(HolonType.Organization),
                type: HolonType.Organization,
                id: `org-${Date.now()}`,
                properties: {
                    name: name,
                    missionStatement: `Newly created unit: ${name}`,
                    parentId: parentId,
                    type: 'Division',
                    echelonLevel: 'Division',
                    uics: [uic],
                    services: [],
                    health: 'healthy',
                    isTigerTeam: false
                }
            };
            return { organizations: [...state.organizations, newOrg] };
        }),

        addPosition: (orgId, title, billetCode) => set((state) => {
            const newPos: Position = {
                ...createHolon(HolonType.Position),
                type: HolonType.Position,
                id: `pos-${Date.now()}`,
                properties: {
                    orgId: orgId,
                    title: title,
                    billetType: 'staff',
                    gradeRange: { min: 'O-1', max: 'O-3' },
                    designatorExpectations: [],
                    criticality: 'standard',
                    billetIDs: [billetCode],
                    billetStatus: 'unfunded',
                    state: 'vacant',
                    assignedPersonId: null,
                    qualifications: [],
                    isLeadership: false
                }
            };
            return { positions: [...state.positions, newPos] };
        }),

        updatePosition: (id, updates) => set((state) => ({
            positions: state.positions.map(p =>
                p.id === id
                    ? { ...p, properties: { ...p.properties, ...updates } }
                    : p
            )
        })),

        assignPerson: (positionId, name, rank) => set((state) => {
            // 1. Create new Person
            const newPerson: Person = {
                ...createHolon(HolonType.Person),
                type: HolonType.Person,
                id: `psn-${Date.now()}`,
                properties: {
                    name: name,
                    designatorRating: rank,
                    category: 'active_duty',
                    serviceBranch: 'USN',
                    edipi: 'generated',
                    serviceNumbers: [],
                    dob: new Date(),
                    certificates: [],
                    primaryPositionId: positionId,
                    tigerTeamIds: []
                }
            };

            // 2. Update Position to link to Person
            const updatedPositions = state.positions.map(p =>
                p.id === positionId
                    ? { ...p, properties: { ...p.properties, state: 'filled' as const, assignedPersonId: newPerson.id } }
                    : p
            );

            return {
                people: [...state.people, newPerson],
                positions: updatedPositions
            };
        }),

        getOrgChildren: (orgId) => get().organizations.filter(o => o.properties.parentId === orgId),
        getOrgPositions: (orgId) => get().positions.filter(p => p.properties.orgId === orgId),
    };
});
