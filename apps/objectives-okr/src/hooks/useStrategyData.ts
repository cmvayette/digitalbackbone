import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSOMClient, SOMClientOptions } from '@som/api-client';
import { HolonType, type LOE, type Objective, type KeyResult } from '@som/shared-types';

export function useStrategyData(options: SOMClientOptions = { mode: 'mock' }) {
    const queryClient = useQueryClient();
    const client = createSOMClient(
        options.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
        options
    );

    const loeQuery = useQuery({
        queryKey: ['strategy', 'loes'],
        queryFn: async () => {
            const res = await client.queryHolons(HolonType.LOE);
            return res.success && res.data
                ? res.data.map((h: any) => ({ ...h, properties: h.properties } as LOE))
                : [];
        }
    });

    const objQuery = useQuery({
        queryKey: ['strategy', 'objectives'],
        queryFn: async () => {
            const res = await client.queryHolons(HolonType.Objective);
            return res.success && res.data
                ? res.data.map((h: any) => ({ ...h, properties: h.properties } as Objective))
                : [];
        }
    });

    const krQuery = useQuery({
        queryKey: ['strategy', 'krs'],
        queryFn: async () => {
            const res = await client.queryHolons(HolonType.KeyResult);
            return res.success && res.data
                ? res.data.map((h: any) => ({ ...h, properties: h.properties } as KeyResult))
                : [];
        }
    });

    // Combined loading state
    const isLoading = loeQuery.isLoading || objQuery.isLoading || krQuery.isLoading;

    return {
        loes: loeQuery.data || [],
        objectives: objQuery.data || [],
        krs: krQuery.data || [],
        loading: isLoading,
        refresh: () => {
            loeQuery.refetch();
            objQuery.refetch();
            krQuery.refetch();
        },
        // Helpers for finding relationships can be simpler in consumers or select functions
        getTreeForLOE: (_loeId: string) => objQuery.data || []
    };
}
