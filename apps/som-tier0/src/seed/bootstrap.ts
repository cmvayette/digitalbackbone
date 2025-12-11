import { SQLiteEventStore } from '../event-store/sqlite-store';
import { Faker, en } from '@faker-js/faker';
import { Event, EventType, HolonType, RelationshipType, HolonID, Timestamp } from '@som/shared-types';
import path from 'path';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const faker = new Faker({ locale: [en] });

// --- MOCK DATA TYPES ---
interface MockOrg { id: string; properties: any; type: HolonType.Organization; }
interface MockPos { id: string; properties: any; type: HolonType.Position; }
interface MockPerson { id: string; properties: any; type: HolonType.Person; }

// --- GENERATOR LOGIC (Adapted from orgStore.ts) ---
const generateData = () => {
    const orgs: MockOrg[] = [];
    const positions: MockPos[] = [];
    const people: MockPerson[] = [];
    const relationships: any[] = []; // { source, target, type }

    // 1. Root
    const rootId = randomUUID();
    orgs.push({
        id: rootId,
        type: HolonType.Organization,
        properties: {
            name: 'Digital Transformation Command',
            uic: 'DTC01',
            type: 'Command',
            echelonLevel: 'Command',
            stats: { totalSeats: 120, vacancies: 15 } // Mock stats
        }
    });

    // 2. Directorates
    const directorates = ['Operations', 'Strategy', 'Technology', 'Logistics'];
    directorates.forEach((name, idx) => {
        const dirId = randomUUID();
        orgs.push({
            id: dirId,
            type: HolonType.Organization,
            properties: {
                name: `${name} Directorate`,
                uic: `DIR${idx + 1}`,
                type: 'Directorate',
                echelonLevel: 'Directorate',
                parentId: rootId,
                stats: { totalSeats: 30, vacancies: 5 }
            }
        });
        relationships.push({ source: rootId, target: dirId, type: RelationshipType.CONTAINS });

        // 3. Divisions
        for (let i = 0; i < 2; i++) {
            const divId = randomUUID();
            orgs.push({
                id: divId,
                type: HolonType.Organization,
                properties: {
                    name: `${name} Div ${i + 1}`,
                    uic: `DIV${idx}${i}`,
                    type: 'Division',
                    echelonLevel: 'Division',
                    parentId: dirId,
                    stats: { totalSeats: 15, vacancies: 2 }
                }
            });
            relationships.push({ source: dirId, target: divId, type: RelationshipType.CONTAINS });

            // 4. Positions
            for (let p = 0; p < 4; p++) {
                const posId = randomUUID();
                const isVacant = Math.random() > 0.7;

                positions.push({
                    id: posId,
                    type: HolonType.Position,
                    properties: {
                        title: faker.person.jobTitle(),
                        orgId: divId,
                        billetType: 'staff',
                        gradeRange: { min: 'GS-11', max: 'GS-13' }
                    }
                });
                relationships.push({ source: divId, target: posId, type: RelationshipType.CONTAINS });

                if (!isVacant) {
                    const personId = randomUUID();
                    people.push({
                        id: personId,
                        type: HolonType.Person,
                        properties: {
                            name: faker.person.fullName(),
                            rank: 'GS-12',
                            category: 'civilian'
                        }
                    });
                    // Person OCCUPIES Position
                    relationships.push({ source: personId, target: posId, type: RelationshipType.OCCUPIES });
                }
            }
        }
    });

    return { orgs, positions, people, relationships };
};

// --- BOOTSTRAPPER ---
async function bootstrap() {
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../som.db');
    console.log(`Bootstrapping Event Store at ${dbPath}...`);

    // Ensure DB is fresh? Optional. For now we append.
    const store = new SQLiteEventStore(dbPath);

    // Check if empty
    const existing = await store.getAllEvents();
    if (existing.length > 0) {
        console.log(`Store already has ${existing.length} events. Skipping bootstrap.`);
        process.exit(0);
    }

    const data = generateData();
    console.log(`Generated ${data.orgs.length} orgs, ${data.positions.length} positions, ${data.people.length} people.`);

    let count = 0;

    // Submitter Helper
    const submit = async (type: EventType, subjects: string[], payload: any) => {
        await store.submitEvent({
            type,
            occurredAt: new Date(),
            actor: 'system-bootstrap',
            subjects,
            payload,
            sourceSystem: 'bootstrap',
            causalLinks: {}
        });
        count++;
    };

    // 1. Orgs
    for (const org of data.orgs) {
        await submit(EventType.OrganizationCreated, [org.id], {
            holonType: HolonType.Organization,
            properties: org.properties
        });
    }

    // 2. Positions
    for (const pos of data.positions) {
        await submit(EventType.PositionCreated, [pos.id], {
            holonType: HolonType.Position,
            properties: pos.properties
        });
    }

    // 3. People
    for (const person of data.people) {
        await submit(EventType.PersonCreated, [person.id], {
            holonType: HolonType.Person,
            properties: person.properties
        });
    }

    // 4. Relationships
    for (const rel of data.relationships) {
        await submit(EventType.AssignmentStarted, [rel.source, rel.target], {
            relationshipId: randomUUID(),
            relationshipType: rel.type,
            properties: {}
        });
    }

    console.log(`Successfully submitted ${count} events.`);
}

bootstrap();
