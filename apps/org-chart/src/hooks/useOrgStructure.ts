import { useQuery } from '@tanstack/react-query';
import { client } from '../api/client';
import { transformStructureToGraph } from '../api/transformer';
import type { GraphData } from '../types/graph';

export function useOrgStructure(orgId: string | undefined) {
    return useQuery<GraphData, Error>({
        queryKey: ['orgStructure', orgId],
        queryFn: async () => {
            if (!orgId) throw new Error('Organization ID is required');

            const result = await client.getOrgStructure(orgId);
            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Failed to fetch organization structure');
            }
            return transformStructureToGraph(result.data);
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
