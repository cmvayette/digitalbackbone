import { vi } from 'vitest';

// Mock the @som/api-client
vi.mock('@som/api-client', () => {
    const mockProcesses = [
        {
            id: 'proc-1',
            status: 'active',
            properties: {
                name: 'Test Process',
                description: 'Description',
                steps: [
                    { id: 's1', title: 'First Step', description: 'Do first thing', owner: 'pos-1', obligations: [{ id: 'obl-deprecated-999' }] },
                    { id: 's2', title: 'Second Step', description: 'Do second thing', owner: 'pos-2', obligations: [] }
                ]
            }
        },
        {
            id: 'p2',
            status: 'draft',
            properties: {
                name: 'New Operational Workflow',
                description: 'Draft process',
                steps: []
            }
        },
        {
            id: 'p3',
            status: 'active',
            properties: {
                name: 'Onboarding Checklist',
                description: 'HR Onboarding',
                steps: []
            }
        }
    ];

    return {
        useExternalOrgData: () => ({
            getCandidates: () => [
                { id: 'pos-1', name: 'Command Duty Officer', type: 'position' },
                { id: 'agent-logistics', name: 'Logistics Bot', type: 'agent' },
                { id: 'pos-2', name: 'Operations Officer', type: 'position' }, // Added to match pos-2 owner
                { id: 'pos-ops', name: 'Director of Operations', type: 'position' },
                { id: 'pos-strat', name: 'Chief Strategy Officer', type: 'position' }
            ],
            getOrgStructure: () => ({ nodes: [], edges: [] }),
        }),
        useExternalPolicyData: () => ({
            getObligationsForOwner: () => [],
            getPolicies: () => []
        }),
        useExternalProcessData: () => ({
            processes: mockProcesses,
            getProcess: () => mockProcesses[0],
            saveProcess: vi.fn(),
            validateProcess: vi.fn().mockReturnValue({ isValid: true, errors: [] })
        }),
        SOMClient: {
            getInstance: () => ({
                getOrgStructure: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
                getPolicies: vi.fn().mockResolvedValue([]),
                queryHolons: vi.fn().mockResolvedValue([])
            })
        }
    };
});
