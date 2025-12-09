import { useMemo, useState, useEffect } from 'react';
import { createSOMClient } from './client';
import { HolonType } from '@som/shared-types';

// Replicating types locally/shared for MVP (eventually refer to @som/shared-types)
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

export function useExternalOrgData() {
    const [organizations, setOrganizations] = useState<ExternalOrganization[]>([]);
    const [positions, setPositions] = useState<ExternalPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Use default localhost:3333 if not env var set
                // SOM Client implementation defaults to localhost:3000, we need 3333
                // Note: The client creation might need to be adjusted or we pass it here
                const client = createSOMClient('http://localhost:3333/api/v1');

                const [orgsResponse, posResponse] = await Promise.all([
                    client.queryHolons(HolonType.Organization),
                    client.queryHolons(HolonType.Position)
                ]);

                if (orgsResponse.success && orgsResponse.data) {
                    const mappedOrgs: ExternalOrganization[] = orgsResponse.data.map(h => ({
                        id: h.id,
                        name: h.properties.name as string || 'Unnamed Org',
                        type: h.properties.type as string || 'Organization',
                        uic: h.properties.uic as string
                    }));
                    setOrganizations(mappedOrgs);
                }

                if (posResponse.success && posResponse.data) {
                    const mappedPos: ExternalPosition[] = posResponse.data.map(h => ({
                        id: h.id,
                        title: h.properties.title as string || 'Untitled Position',
                        billetCode: (h.properties.billetIDs as string[])?.[0],
                        orgId: h.properties.orgId as string
                    }));
                    setPositions(mappedPos);
                }
            } catch (err) {
                console.error("Failed to fetch external org data", err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Memoize the return value to stabilize reference
    return useMemo(() => {
        return {
            organizations,
            positions,
            isLoading,
            error,
            // Helper to get formatted candidates for dropdowns/pickers
            getCandidates: () => {
                const orgCandidates = organizations.map(o => ({
                    id: o.id,
                    name: o.name,
                    type: 'Organization' as const,
                    subtitle: o.type,
                    uic: o.uic
                }));
                const posCandidates = positions.map(p => ({
                    id: p.id,
                    name: p.title,
                    type: 'Position' as const,
                    subtitle: p.billetCode || 'Billet',
                    orgId: p.orgId
                }));
                return [...orgCandidates, ...posCandidates];
            }
        };
    }, [organizations, positions, isLoading, error]);
}

