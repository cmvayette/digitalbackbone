import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../api/client';
import { transformStructureToGraph } from '../api/transformer';
import type { OrganizationalStructureDTO } from '../types/api';
import type { GraphData } from '../types/graph';

export function useOrgStructure(orgId: string | undefined) {
    return useQuery<GraphData, Error>({
        queryKey: ['orgStructure', orgId],
        queryFn: async () => {
            if (!orgId) throw new Error('Organization ID is required');

            const response = await fetchJson<OrganizationalStructureDTO>(`/temporal/organizations/${orgId}/structure`);
            return transformStructureToGraph(response);
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
