
import { faker } from '@faker-js/faker';
import {
    Holon,
    HolonType,
    HolonID,
    Relationship,
    RelationshipType,
    Event,
    EventType,
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

    async getOrgStructure(orgId: HolonID): Promise<APIResponse<OrgStructure>> {
        const org = this.createMockHolon(orgId, HolonType.Organization);
        const subOrgs = [
            this.createMockHolon(faker.string.uuid(), HolonType.Organization),
            this.createMockHolon(faker.string.uuid(), HolonType.Organization),
        ];

        const positions = Array.from({ length: 5 }).map(() => this.createMockHolon(faker.string.uuid(), HolonType.Position));
        const assignments: any[] = [];

        // Assign some people
        positions.forEach(pos => {
            if (Math.random() > 0.3) {
                const person = this.createMockHolon(faker.string.uuid(), HolonType.Person);
                assignments.push({
                    position: pos,
                    person: person,
                    relationship: this.createMockRelationship(pos.id, person.id, RelationshipType.ASSIGNED_TO)
                })
            }
        });

        return this.mockResponse({
            organization: org,
            subOrganizations: subOrgs as any,
            positions,
            assignments,
            asOfTimestamp: new Date(),
        });
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

    // ==================== Health Check ====================

    async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
        return { healthy: true, latencyMs: 5 };
    }
}
