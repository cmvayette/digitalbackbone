import { useMemo } from 'react';

// Replicating types locally/shared for MVP (eventually refer to @som/shared-types)
export interface ExternalObligation {
    id: string;
    statement: string;
    assignedTo: string; // ID of Position/Org
    deadline?: string;
    criticality: 'high' | 'medium' | 'low';
}

export interface ExternalPolicy {
    id: string;
    title: string;
    status: 'draft' | 'active' | 'archived';
    obligations: ExternalObligation[];
}

// Mock data mirrored from Policy Governance app
const MOCK_POLICIES: ExternalPolicy[] = [
    {
        id: 'pol-1',
        title: 'Cybersecurity Incident Response',
        status: 'active',
        obligations: [
            { id: 'obl-1', statement: 'MUST report incidents within 1 hour', assignedTo: 'pos-1', criticality: 'high' },
            { id: 'obl-2', statement: 'SHALL maintain incident log', assignedTo: 'pos-3', criticality: 'medium' }
        ]
    },
    {
        id: 'pol-2',
        title: 'Remote Work Authorization',
        status: 'active',
        obligations: [
            { id: 'obl-3', statement: 'MUST use VPN for all external connections', assignedTo: 'pos-3', criticality: 'high' },
            { id: 'obl-4', statement: 'SHALL complete annual refresher training', assignedTo: 'pos-4', criticality: 'low' }
        ]
    }
];

export function useExternalPolicyData() {
    return useMemo(() => {
        // Flatten obligations for easier lookup
        const allObligations = MOCK_POLICIES.flatMap(p => p.obligations);

        return {
            policies: MOCK_POLICIES,
            obligations: allObligations,
            getObligationsForOwner: (ownerId: string) => {
                return allObligations.filter(o => o.assignedTo === ownerId);
            }
        };
    }, []);
}
