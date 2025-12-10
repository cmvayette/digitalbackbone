import { useMemo, useState, useEffect } from 'react';
import { createSOMClient, SOMClientOptions } from './factory';
import { HolonType } from '@som/shared-types';

// Replicating types locally/shared for MVP (eventually refer to @som/shared-types)
export interface ExternalOrganization {
    id: string;
    name: string;
    type: string;
    uic?: string;
    parentId?: string;
    properties?: Record<string, unknown>;
}

export interface ExternalPosition {
    id: string;
    title: string;
    billetCode?: string;
    orgId: string;
}

export interface ExternalPerson {
    id: string;
    name: string;
    type: string;
    designatorRating: string;
    avatarUrl?: string;
    properties?: Record<string, unknown>;
}

export function useExternalOrgData(options?: SOMClientOptions) {
    const [organizations, setOrganizations] = useState<ExternalOrganization[]>([]);
    const [positions, setPositions] = useState<ExternalPosition[]>([]);
    const [people, setPeople] = useState<ExternalPerson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Use default localhost:3333 if not env var set, or allow mock mode to handle it
                const client = createSOMClient(
                    options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
                    options
                );

                const [orgsResponse, posResponse, peopleResponse] = await Promise.all([
                    client.queryHolons(HolonType.Organization),
                    client.queryHolons(HolonType.Position),
                    client.queryHolons(HolonType.Person)
                ]);

                if (orgsResponse.success && orgsResponse.data) {
                    const mappedOrgs: ExternalOrganization[] = orgsResponse.data.map(h => ({
                        id: h.id,
                        name: h.properties.name as string || 'Unnamed Org',
                        type: h.properties.type as string || 'Organization',
                        uic: h.properties.uic as string,
                        parentId: h.properties.parentId as string,
                        properties: h.properties
                    }));
                    setOrganizations(mappedOrgs);
                }

                if (posResponse.success && posResponse.data) {
                    const mappedPos: ExternalPosition[] = posResponse.data.map(h => ({
                        id: h.id,
                        title: h.properties.title as string || 'Untitled Position',
                        billetCode: (h.properties.billetIDs as string[])?.[0],
                        orgId: h.properties.orgId as string,
                        properties: h.properties
                    }));
                    setPositions(mappedPos);
                }

                if (peopleResponse.success && peopleResponse.data) {
                    const mappedPeople: ExternalPerson[] = peopleResponse.data.map(h => ({
                        id: h.id,
                        name: h.properties.name as string || 'Unknown Person',
                        type: h.properties.type as string || 'Person',
                        designatorRating: h.properties.designatorRating as string || 'N/A',
                        avatarUrl: h.properties.avatarUrl as string,
                        properties: h.properties
                    }));
                    setPeople(mappedPeople);
                }
                if (peopleResponse.success && peopleResponse.data) {
                    const mappedPeople: ExternalPerson[] = peopleResponse.data.map(h => ({
                        id: h.id,
                        name: h.properties.name as string || 'Unknown Person',
                        type: h.properties.type as string || 'Person',
                        designatorRating: h.properties.designatorRating as string || 'N/A',
                        avatarUrl: h.properties.avatarUrl as string,
                        properties: h.properties
                    }));
                    setPeople(mappedPeople);
                }
            } catch (err) {
                console.error("Failed to fetch external org data", err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [options?.mode]); // Rerun if mode changes

    // Memoize the return value to stabilize reference
    return useMemo(() => {
        return {
            organizations,
            positions,
            people,
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
                const peopleCandidates = people.map(p => ({
                    id: p.id,
                    name: p.name,
                    type: 'Person' as const,
                    subtitle: p.designatorRating,
                    avatarUrl: p.avatarUrl
                }));
                return [...orgCandidates, ...posCandidates, ...peopleCandidates];
            }
        };
    }, [organizations, positions, people, isLoading, error]);
}

