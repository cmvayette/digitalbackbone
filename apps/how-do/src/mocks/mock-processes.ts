import { HolonType } from '@som/shared-types';
import type { Process } from '../types/process';

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
            tags: ['Operations', 'Standard', 'Officer'],
            steps: [
                { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1', obligations: [] },
                { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2', obligations: [] },
                { id: 'step-JIRA-123', title: 'Provision Hardware', description: 'IT Dept Ticket', owner: 'pos-3', source: 'external', externalId: 'JIRA-123', externalSource: 'jira', obligations: [] },
                { id: 'step-3', title: 'Finalize Logistics', description: 'Supply check', owner: 'pos-3', obligations: [] }
            ],
            estimatedDuration: 3600
        }
    },
    {
        id: 'proc-2',
        type: HolonType.Process,
        createdAt: new Date('2023-10-05'),
        createdBy: 'user',
        status: 'archived',
        sourceDocuments: [],
        properties: {
            name: "Onboarding Checklist",
            description: "Steps to onboard a new team member.",
            inputs: [],
            outputs: [],
            estimatedDuration: 7200,
            tags: ['HR', 'Onboarding', 'All Hands'],
            steps: [
                { id: 'step-1', title: 'Create Account', description: 'IT creates AD account', owner: 'pos-3', obligations: [] },
                { id: 'step-2', title: 'Issue Badge', description: 'Security issues badge', owner: 'pos-4', obligations: [] }
            ]
        }
    },
    {
        id: 'proc-3',
        type: HolonType.Process,
        createdAt: new Date('2023-11-20'),
        createdBy: 'user',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: "Junior Enlisted Leave Request",
            description: "Standard leave request for E-1 to E-4 personnel.",
            inputs: [],
            outputs: [],
            estimatedDuration: 1800,
            tags: ['HR', 'Leave', 'Enlisted', 'E-1', 'E-2', 'E-3', 'E-4'],
            steps: [
                { id: 'step-1', title: 'Submit Request', description: 'Submit via NSIPS', owner: 'pos-10', obligations: [] },
                { id: 'step-2', title: 'LPO Review', description: 'Leading Petty Officer verification', owner: 'pos-11', obligations: [] },
                { id: 'step-3', title: 'Div Officer Approval', description: 'Division Officer signature', owner: 'pos-12', obligations: [] }
            ]
        }
    },
    {
        id: 'proc-4',
        type: HolonType.Process,
        createdAt: new Date('2023-11-22'),
        createdBy: 'user',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: "Officer Leave Request",
            description: "Standard leave request for Commissioned Officers.",
            inputs: [],
            outputs: [],
            estimatedDuration: 1800,
            tags: ['HR', 'Leave', 'Officer', 'Command'],
            steps: [
                { id: 'step-1', title: 'Submit to XO', description: 'Direct submission to Executive Officer', owner: 'pos-20', obligations: [] },
                { id: 'step-2', title: 'CO Approval', description: 'Commanding Officer signature', owner: 'pos-21', obligations: [] }
            ]
        }
    }
];
