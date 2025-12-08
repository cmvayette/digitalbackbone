import { useMemo } from 'react';

// Replicating types locally/shared for MVP
export interface ExternalOrganization {
    id: string;
    name: string;
    type: string;
    uic?: string;
}

export interface ExternalPosition {
    id: string;
    title: string;
    billetCode?: string;
    orgId: string;
}

// Mock data mirrored from Org Chart app
const MOCK_ORGS: ExternalOrganization[] = [
    { id: 'org-root', name: 'Digital Transformation Command', type: 'Command' },
    { id: 'org-dir-0', name: 'Operations Directorate', type: 'Directorate' },
    { id: 'org-dir-1', name: 'Strategy Directorate', type: 'Directorate' },
    { id: 'org-div-0-0', name: 'Operations Div 1', type: 'Division' }
];

const MOCK_POSITIONS: ExternalPosition[] = [
    { id: 'pos-1', title: 'Director of Operations', billetCode: '0203', orgId: 'org-dir-0' },
    { id: 'pos-2', title: 'Chief Strategy Officer', billetCode: '11A', orgId: 'org-dir-1' },
    { id: 'pos-3', title: 'Operations Officer', billetCode: '0203', orgId: 'org-div-0-0' },
    { id: 'pos-4', title: 'Training Officer', billetCode: '8832', orgId: 'org-div-0-0' }
];

export function useExternalOrgData() {
    return useMemo(() => {
        return {
            organizations: MOCK_ORGS,
            positions: MOCK_POSITIONS,
            // Helper to get formatted candidates for dropdowns/pickers
            getCandidates: () => {
                const orgs = MOCK_ORGS.map(o => ({
                    id: o.id,
                    name: o.name,
                    type: 'Organization' as const,
                    subtitle: o.type
                }));
                const pos = MOCK_POSITIONS.map(p => ({
                    id: p.id,
                    name: p.title,
                    type: 'Position' as const,
                    subtitle: p.billetCode || 'Billet'
                }));
                return [...orgs, ...pos];
            }
        };
    }, []);
}
