import { useState, useCallback } from 'react';
import { HolonType, type Process } from '@som/shared-types';

// Initial Mock Data
const INITIAL_PROCESSES: Process[] = [
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
                { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1', obligations: [] },
                { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2', obligations: [] },
                { id: 'step-JIRA-123', title: 'Provision Hardware', description: 'IT Dept Ticket', owner: 'pos-3', source: 'external', externalId: 'JIRA-123', externalSource: 'jira', obligations: [] },
                { id: 'step-3', title: 'Finalize Logistics', description: 'Supply check', owner: 'pos-3', obligations: [] }
            ]
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
            steps: [
                { id: 'step-1', title: 'Create Account', description: 'IT creates AD account', owner: 'pos-3', obligations: [] },
                { id: 'step-2', title: 'Issue Badge', description: 'Security issues badge', owner: 'pos-4', obligations: [] }
            ]
        }
    }
];

// Simple in-memory store for MVP visualization (resets on refresh)
// In a real app, this would be a React Query hook wrapping a fetch()
let SHARED_PROCESS_STORE = [...INITIAL_PROCESSES];
const listeners = new Set<(processes: Process[]) => void>();

const notifyListeners = () => {
    listeners.forEach(l => l([...SHARED_PROCESS_STORE]));
};

export function useExternalProcessData() {
    // This is a "fake" real-time subscription for the demo
    const [processes, setProcesses] = useState<Process[]>(SHARED_PROCESS_STORE);

    // Sync with external store changes
    // (Note: In a real app setup, useQuery would handle this)

    const addProcess = useCallback((process: Process) => {
        SHARED_PROCESS_STORE = [...SHARED_PROCESS_STORE, process];
        setProcesses(SHARED_PROCESS_STORE);
        notifyListeners(); // If we had multi-component sync needs
    }, []);

    const getProcessById = useCallback((id: string) => {
        return SHARED_PROCESS_STORE.find(p => p.id === id);
    }, []);

    return {
        processes,
        addProcess,
        getProcessById
    };
}
