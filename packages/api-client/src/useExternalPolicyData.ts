import { useState, useCallback, useEffect, useMemo } from 'react';
import { HolonType, type Holon } from '@som/shared-types';
import { createSOMClient } from './factory';

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

export function useExternalPolicyData(options?: import('./factory').SOMClientOptions) {
    const [policies, setPolicies] = useState<ExternalPolicy[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPolicies = useCallback(async () => {
        try {
            const client = createSOMClient(
                options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
                options
            );
            const response = await client.queryHolons(HolonType.Document, {
                properties: { documentType: 'Policy' }
            });

            if (response.success && response.data) {
                const mappedPolicies: ExternalPolicy[] = response.data.map((h: Holon) => {
                    // Map Holon to ExternalPolicy view model
                    // Assuming obligations are linked or embedded. For MVP, we might parse text or look for linked Obligation holons.
                    // Ideally, we'd fetch linked obligations. For now, we'll default to empty or mock if not in payload.
                    // This aligns with "Read" side flexibility.
                    return {
                        id: h.id,
                        title: h.properties.title as string || h.properties.name as string || 'Untitled Policy',
                        status: (h.properties.status as any) || 'draft',
                        obligations: (h.properties.obligations as any[]) || []
                    };
                });
                setPolicies(mappedPolicies);
            }
        } catch (err) {
            console.error("Failed to fetch policies", err);
        } finally {
            setLoading(false);
        }
    }, [options]);

    useEffect(() => {
        fetchPolicies();
        const interval = setInterval(fetchPolicies, 5000); // 5s polling
        return () => clearInterval(interval);
    }, [fetchPolicies]);

    const allObligations = useMemo(() => policies.flatMap(p => p.obligations), [policies]);

    return {
        policies,
        obligations: allObligations,
        getObligationsForOwner: useCallback((ownerId: string) => {
            return allObligations.filter(o => o.assignedTo === ownerId);
        }, [allObligations]),
        refresh: fetchPolicies,
        loading
    };
}
