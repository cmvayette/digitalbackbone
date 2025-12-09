import { SQLiteEventStore } from '../event-store/sqlite-store';
import { EventType, HolonType, Process, ProcessProperties } from '@som/shared-types';
import path from 'path';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

// Mock Processes (adapted from the client mock)
const MOCK_PROCESSES: Partial<ProcessProperties>[] = [
    {
        name: "New Operational Workflow",
        description: "Standard operating procedure for operations.",
        inputs: [],
        outputs: [],
        estimatedDuration: 3600,
        steps: [
            { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1', obligations: [] },
            { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2', obligations: [] },
            { id: 'step-JIRA-123', title: 'Provision Hardware', description: 'IT Dept Ticket', owner: 'pos-3', source: 'external', externalId: 'JIRA-123', externalSource: 'jira', obligations: [] },
            { id: 'step-3', title: 'Finalize Logistics', description: 'Supply check', owner: 'pos-3', obligations: [] }
        ]
    },
    {
        name: "Onboarding Checklist",
        description: "Steps to onboard a new team member.",
        inputs: [],
        outputs: [],
        estimatedDuration: 7200,
        steps: [
            { id: 'step-1', title: 'Create Account', description: 'IT creates AD account', owner: 'pos-3', obligations: [] },
            { id: 'step-2', title: 'Issue Badge', description: 'Security issues badge', owner: 'pos-4', obligations: [] }
        ]
    }
];

async function seedProcesses() {
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../som.db');
    console.log(`Seeding Processes to Event Store at ${dbPath}...`);

    const store = new SQLiteEventStore(dbPath);
    // Initialize to ensure tables/indices exist (though we assume bootstrap ran)
    // await store.initialize(); // private method, handled by constructor/lazy init

    let count = 0;

    for (const props of MOCK_PROCESSES) {
        const processId = `proc-${randomUUID().substring(0, 8)}`;

        // Submit ProcessDefined event
        await store.submitEvent({
            type: EventType.ProcessDefined,
            occurredAt: new Date(),
            actor: 'system-seed',
            subjects: [processId],
            payload: {
                holonType: HolonType.Process,
                properties: props
            },
            sourceSystem: 'seed-script',
            causalLinks: {}
        });

        console.log(`Submitted Process: ${props.name} (${processId})`);
        count++;
    }

    console.log(`Successfully seeded ${count} processes.`);
}

seedProcesses().catch(console.error);
