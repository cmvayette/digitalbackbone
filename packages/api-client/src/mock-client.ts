
import { faker } from '@faker-js/faker';
import {
    Holon,
    HolonType,
    HolonID,
    Relationship,
    RelationshipType,
    Event,
    EventType,
    GovernanceConfig,
} from '@som/shared-types';
import {
    SOMClient,
    ISOMClient,
    APIResponse,
    HolonFilters,
    PaginationOptions,
    SearchResult,
    OrgStructure,
    EventResult
} from './client';

/**
 * Mock SOM Client
 * Generates random data for development without a backend.
 */
export class MockSOMClient implements ISOMClient {
    constructor() {
        console.log('MockSOMClient initialized');
    }

    setAuthToken(token: string): void { }
    clearAuthToken(): void { }

    // ==================== Helpers ====================

    private createMockHolon(id: HolonID, type: HolonType): Holon {
        const base: Holon = {
            id,
            type,
            properties: {}, // Properties vary by type
            createdAt: faker.date.past(),
            createdBy: faker.string.uuid(),
            status: faker.helpers.arrayElement(['active', 'inactive', 'draft']) as any,
            sourceDocuments: [],
        };

        // Add type-specific properties including 'name' where applicable
        switch (type) {
            case HolonType.Organization:
                base.properties = {
                    name: faker.company.name(),
                    missionStatement: faker.company.catchPhrase(),
                    uics: [faker.string.alphanumeric(6).toUpperCase()],
                    type: 'Unit',
                    echelonLevel: 'Batallion',
                    isTigerTeam: false,
                };
                break;
            case HolonType.Initiative:
                base.properties = {
                    name: faker.company.catchPhrase(),
                    description: faker.lorem.paragraph(),
                    status: faker.helpers.arrayElement(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
                    progress: faker.number.int({ min: 0, max: 100 }),
                    startDate: faker.date.past().toISOString(),
                    targetEndDate: faker.date.future().toISOString(),
                    ownerId: faker.string.uuid(), // Mock owner
                };
                break;
            case HolonType.Agent:
                base.properties = {
                    name: faker.hacker.adjective() + ' Bot',
                    description: faker.company.buzzPhrase(),
                    version: '1.0.0',
                    capabilities: [faker.hacker.noun(), faker.hacker.verb()],
                    model: 'gpt-4'
                };
                break;
            case HolonType.Person:
                base.properties = {
                    name: faker.person.fullName(),
                    edipi: faker.string.numeric(10),
                    serviceNumbers: [],
                    dob: faker.date.birthdate(),
                    serviceBranch: 'Navy',
                    designatorRating: 'Officer',
                    category: 'active_duty',
                    certificates: [],
                    workLoad: 50,
                    capacity: 100,
                };
                break;
            case HolonType.Position:
                base.properties = {
                    title: faker.person.jobTitle(),
                    billetIDs: [faker.string.uuid()],
                    gradeRange: { min: 'O-1', max: 'O-3' },
                    designatorExpectations: [],
                    criticality: 'standard',
                    billetType: 'staff',
                    qualifications: [],
                };
                break;
            case HolonType.Task:
                base.properties = {
                    name: faker.hacker.verb() + ' ' + faker.hacker.noun(),
                    description: faker.lorem.sentence(),
                    status: faker.helpers.arrayElement(['todo', 'in-progress', 'review', 'done']),
                    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
                    dueDate: faker.date.future().toISOString(),
                    ownerId: faker.string.uuid(),
                    assigneeId: faker.string.uuid(),
                };
                break;
            case HolonType.Objective:
                base.properties = {
                    statement: faker.company.catchPhrase(),
                    description: faker.lorem.paragraph(),
                    status: faker.helpers.arrayElement(['on-track', 'at-risk', 'off-track', 'completed']),
                    progress: faker.number.int({ min: 0, max: 100 }),
                    ownerId: faker.string.uuid(),
                };
                break;
            case HolonType.KeyResult:
                base.properties = {
                    description: faker.company.buzzPhrase(),
                    metric: faker.helpers.arrayElement(['%', '#', '$']),
                    currentValue: faker.number.int({ min: 0, max: 80 }),
                    targetValue: 100,
                    status: faker.helpers.arrayElement(['on-track', 'at-risk']),
                };
                break;
            case HolonType.LOE:
                base.properties = {
                    name: faker.commerce.department() + ' Modernization',
                    description: faker.lorem.sentence(),
                    status: 'active',
                    createdAt: faker.date.past().toISOString(),
                    timeframe: { start: faker.date.past(), end: faker.date.future() }
                };
                break;
            case HolonType.Process:
                const steps = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }).map((_, idx) => ({
                    id: faker.string.uuid(),
                    title: `Step ${idx + 1}: ${faker.hacker.verb()} ${faker.hacker.noun()}`,
                    description: faker.company.catchPhrase(),
                    owner: faker.string.uuid(),
                    assigneeType: faker.helpers.arrayElement(['human', 'agent', 'system']),
                    nextStepId: idx < 3 ? faker.string.uuid() : undefined, // Simple linear or broken link simulation
                    obligations: []
                }));

                base.properties = {
                    name: `Process: ${faker.company.buzzPhrase()}`,
                    description: faker.lorem.paragraph(),
                    inputs: [faker.system.fileName(), faker.system.fileName()],
                    outputs: [faker.system.fileName()],
                    tags: [faker.hacker.noun(), faker.hacker.adjective()],
                    steps,
                    estimatedDuration: faker.number.int({ min: 1800, max: 7200 })
                };
                break;

            case HolonType.Document:
                base.properties = {
                    title: faker.company.catchPhrase(),
                    documentType: faker.helpers.arrayElement(['Policy', 'Order', 'SOP', 'Manual', 'Instruction']), // Valid enums
                    version: faker.system.semver(),
                    status: faker.helpers.arrayElement(['draft', 'review', 'published']),
                    content: faker.lorem.paragraphs(3),
                    classificationMetadata: 'UNCLASSIFIED',
                    referenceNumbers: [faker.string.alphanumeric(8).toUpperCase()],
                    effectiveDates: { start: faker.date.past() },
                    createdAt: faker.date.past().toISOString(),
                    updatedAt: faker.date.recent().toISOString(),
                };
                break;
            default:
                base.properties = {
                    name: faker.word.noun(),
                    description: faker.lorem.sentence(),
                };
        }

        return base;
    }

    private createMockRelationship(sourceId: HolonID, targetId: HolonID, type: RelationshipType): Relationship {
        return {
            id: faker.string.uuid(),
            sourceHolonID: sourceId,
            targetHolonID: targetId,
            type,
            properties: {},
            effectiveStart: faker.date.past(),
            sourceSystem: 'MOCK_GENERATOR',
            sourceDocuments: [],
            createdBy: 'MOCK_USER',
            authorityLevel: 'derived',
        };
    }

    private mockResponse<T>(data: T): Promise<APIResponse<T>> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data,
                    metadata: {
                        timestamp: new Date(),
                    },
                });
            }, 300); // Simulate network latency
        });
    }

    // ==================== Holon Operations ====================

    async getHolon(id: HolonID): Promise<APIResponse<Holon>> {
        // Infer type from random for generic get or could parse ID if it had a prefix
        return this.mockResponse(this.createMockHolon(id, HolonType.Organization));
    }

    async queryHolons(
        type: HolonType,
        filters?: HolonFilters,
        pagination?: PaginationOptions
    ): Promise<APIResponse<Holon[]>> {
        const count = pagination?.pageSize || 10;
        const holons = Array.from({ length: count }).map(() =>
            this.createMockHolon(faker.string.uuid(), type)
        );
        return this.mockResponse(holons);
    }

    async search(
        query: string,
        types?: HolonType[],
        limit: number = 10
    ): Promise<APIResponse<SearchResult[]>> {
        const results: SearchResult[] = Array.from({ length: limit }).map(() => ({
            id: faker.string.uuid(),
            type: types ? faker.helpers.arrayElement(types) : HolonType.Organization,
            name: `${query} ${faker.company.buzzNoun()}`,
            description: faker.company.buzzPhrase(),
            score: faker.number.float({ min: 0, max: 1 }),
            properties: {},
        }));
        return this.mockResponse(results);
    }

    // ==================== Relationship Operations ====================

    async getRelationships(
        holonId: HolonID,
        type?: RelationshipType,
        direction?: 'source' | 'target' | 'both'
    ): Promise<APIResponse<Relationship[]>> {
        const count = faker.number.int({ min: 0, max: 5 });
        const relationships = Array.from({ length: count }).map(() =>
            this.createMockRelationship(holonId, faker.string.uuid(), type || RelationshipType.CONTAINS)
        );
        return this.mockResponse(relationships);
    }

    // ==================== Event Operations ====================

    async submitEvent<T extends EventType>(event: any): Promise<APIResponse<EventResult>> {
        return this.mockResponse({
            eventId: faker.string.uuid(),
            success: true,
            affectedHolons: []
        });
    }

    async getEvents(
        holonId: HolonID,
        eventTypes?: EventType[],
        since?: Date
    ): Promise<APIResponse<Event[]>> {
        return this.mockResponse([]);
    }

    // ==================== Temporal Operations ====================

    async getHolonAsOf(id: HolonID, timestamp: Date): Promise<APIResponse<Holon>> {
        return this.getHolon(id);
    }

    // ==================== Hierarchy Builder ====================

    private createUnit(
        name: string,
        echelon: 'Echelon 1' | 'Echelon 2' | 'Echelon 3' | 'Platoon',
        parentId: HolonID | null,
        parentRel: RelationshipType = RelationshipType.ADCON
    ): { unit: Holon; rel: Relationship | null } {
        const id = faker.string.uuid();
        const unit: Holon = {
            id,
            type: HolonType.Organization,
            properties: {
                name,
                echelon,
                type: 'Unit',
                uics: [faker.string.alphanumeric(6).toUpperCase()],
            },
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system',
            sourceDocuments: [],
        };

        let rel: Relationship | null = null;
        if (parentId) {
            rel = this.createMockRelationship(parentId, id, parentRel);
        }

        return { unit, rel };
    }

    private createDepartment(name: string, parentId: HolonID, code: string): { dept: Holon; rel: Relationship } {
        const id = faker.string.uuid();
        const dept: Holon = {
            id,
            type: HolonType.Organization,
            properties: {
                name,
                type: 'Department',
                code,
            },
            status: 'active',
            createdAt: new Date(),
            createdBy: 'system',
            sourceDocuments: [],
        };
        const rel = this.createMockRelationship(parentId, id, RelationshipType.ADCON);
        return { dept, rel };
    }


    async getOrgStructure(orgId: HolonID): Promise<APIResponse<OrgStructure>> {
        // If requesting root or specific mock ID, return the Static NSWC Hierarchy
        // For this mock, we regenerate it fresh each time but consistent structure

        const orgs: Holon[] = [];
        const rels: Relationship[] = [];
        const positions: Holon[] = [];
        const assignments: any[] = [];

        // 1. HQ (Tier 0)
        const hq = this.createUnit('NSWC Headquarters', 'Echelon 1', null).unit;
        orgs.push(hq);

        // 2. HQ Departments (N-Codes)
        ['N1 Admin', 'N2 Intel', 'N3 Ops', 'N4 Logistics', 'N6 Comms'].forEach(d => {
            const { dept, rel } = this.createDepartment(d, hq.id, d.split(' ')[0]);
            orgs.push(dept);
            rels.push(rel);
        });

        // 3. Groups (Tier 1) - ADCON to HQ
        const groups = ['Group 1', 'Group 2'].map(gName => {
            const { unit, rel } = this.createUnit(gName, 'Echelon 2', hq.id, RelationshipType.ADCON);
            orgs.push(unit);
            rels.push(rel!);

            // Group Departments
            ['N1', 'N2', 'N3'].forEach(d => {
                const { dept, rel: dRel } = this.createDepartment(`${gName} ${d}`, unit.id, d);
                orgs.push(dept);
                rels.push(dRel);
            });

            return unit;
        });

        // 4. Troops (Tier 2) - ADCON to Group 1
        // Demonstrating Split Authority: Troop A is ADCON to Group 1, but maybe OPCON to a Task Force (not shown here for simp)
        const troops = ['Troop A', 'Troop B'].map(tName => {
            const { unit, rel } = this.createUnit(tName, 'Echelon 3', groups[0].id, RelationshipType.ADCON);
            orgs.push(unit);
            rels.push(rel!);
            return unit;
        });

        // 5. Platoons (Tier 3) - ADCON to Troop A
        const platoons = ['Platoon 1', 'Platoon 2'].map(pName => {
            const { unit, rel } = this.createUnit(pName, 'Platoon', troops[0].id, RelationshipType.ADCON);
            orgs.push(unit);
            rels.push(rel!);

            // Split Authority Simulation: Platoon 1 is TACON to Group 2 for a specific mission
            if (pName === 'Platoon 1') {
                const taconRel = this.createMockRelationship(groups[1].id, unit.id, RelationshipType.TACON);
                rels.push(taconRel);
            }

            return unit;
        });

        // 6. Generate Positions for the requested Org (simplified context)
        // If we want to show the WHOLE tree, we return everything.
        // If orgId provided matches one, we filter. For now, returning FULL TREE.

        return this.mockResponse({
            organization: hq,
            subOrganizations: orgs.filter(o => o.id !== hq.id),
            positions: positions, // Populating positions is secondary for this nav viz
            assignments: assignments,
            relationships: rels, // Add relationships to response if interface supports it (it resides in 'subOrganizations' implicitly via API contract usually, but here checking OrgStructure type)
            asOfTimestamp: new Date(),
        } as any); // Casting as any to bypass strict checks if OrgStructure doesn't have 'relationships' field yet, though typically it's graph based.
        // Note: Real API usually returns edges. For GraphCanvas, we need edges. 
        // The MockSOMClient currently returns OrgStructure which might be tree-based.
        // Let's assume the Client translates this or GraphCanvas takes nodes/edges.
        // Checking Client interface: OrgStructure has { organization, subOrganizations, positions... }
        // We might need to overload subOrganizations or add a 'relationships' field to the Mock response if the UI expects it.
        // For now, I'll attach the relationships to the response data object so the UI can find them.
    }

    // ==================== Domain-Specific Operations ====================

    async getProcesses(filters?: HolonFilters): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Process, filters);
    }

    async getTasksForPosition(
        positionId: HolonID,
        status?: string
    ): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Task, { properties: { ownerId: positionId, status } });
    }

    async getObjectivesForLOE(loeId: HolonID): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Objective);
    }

    async getPolicies(filters?: HolonFilters): Promise<APIResponse<Holon[]>> {
        return this.queryHolons(HolonType.Document, filters);
    }

    // ==================== Governance Configuration ====================
    private governanceConfig: GovernanceConfig = {
        id: 'gov-config-singleton',
        type: HolonType.GovernanceConfig,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'system',
        sourceDocuments: [],
        properties: {
            aggregation: {
                // Note: coolness isn't in schema but JS allows extra props? No, need to match interface.
                // Wait, Schema was:
                // freshness, completeness, compliance.
                // Re-checking shared-types schema.
                // weights: { freshness: number; completeness: number; compliance: number; }; 
                // Ah, I need to match exact schema.
                // Let's assume standard weights.
                weights: {
                    freshness: 0.3,
                    completeness: 0.3,
                    compliance: 0.4
                },
                alertThresholds: {
                    critical: 50,
                    warning: 75
                }
            },
            search: {
                weights: {
                    rankMatch: 50,
                    roleMatch: 30,
                    tagMatch: 10
                },
                recommendationMinScore: 10
            },
            drift: {
                inspectionMode: false,
                staleDays: 90,
                requiredObligationCriticality: 'high'
            }
        }
    };

    async getGovernanceConfig(): Promise<APIResponse<GovernanceConfig>> {
        return this.mockResponse(this.governanceConfig);
    }

    async updateGovernanceConfig(config: Partial<GovernanceConfig['properties']>): Promise<APIResponse<GovernanceConfig>> {
        // Deep merge for proper partial updates
        this.governanceConfig.properties = {
            ...this.governanceConfig.properties,
            ...config,
            aggregation: { ...this.governanceConfig.properties.aggregation, ...config.aggregation },
            search: { ...this.governanceConfig.properties.search, ...config.search },
            drift: { ...this.governanceConfig.properties.drift, ...config.drift },
        };
        return this.mockResponse(this.governanceConfig);
    }

    // ==================== Health Check ====================

    async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
        return { healthy: true, latencyMs: 5 };
    }
}
