import { HolonType } from '@som/shared-types';
import type { Process } from '@som/shared-types';

export const mockProcesses: Process[] = [
    {
        id: 'proc-1',
        type: HolonType.Process,
        createdAt: new Date('2023-10-01'),
        createdBy: 'user',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: "New Operational Workflow",
            description: "Standard operating procedure for operations.",
            inputs: [],
            outputs: [],
            estimatedDuration: 3600,
            steps: [
                { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1' },
                { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2' },
                { id: 'step-JIRA-123', title: 'Provision Hardware', description: 'IT Dept Ticket', owner: 'pos-3', source: 'external', externalId: 'JIRA-123', externalSource: 'jira' },
                { id: 'step-3', title: 'Finalize Logistics', description: 'Supply check', owner: 'pos-3' }
            ]
        }
    },
    {
        id: 'proc-2',
        type: HolonType.Process,
        createdAt: new Date('2023-10-05'),
        createdBy: 'user',
        status: 'inactive',
        sourceDocuments: [],
        properties: {
            name: "Onboarding Checklist",
            description: "Steps to onboard a new team member.",
            inputs: [],
            outputs: [],
            estimatedDuration: 7200,
            steps: [
                { id: 'step-1', title: 'Create Account', description: 'IT creates AD account', owner: 'pos-3' },
                { id: 'step-2', title: 'Issue Badge', description: 'Security issues badge', owner: 'pos-4' }
            ]
        }
    }
];
