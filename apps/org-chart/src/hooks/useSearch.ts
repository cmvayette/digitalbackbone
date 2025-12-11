import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createSOMClient, type SOMClientOptions } from '@som/api-client';

export interface SearchResult {
    id: string;
    label: string;
    type: string;
    subtitle?: string;
}

export interface SearchFilters {
    vacant?: boolean;
    tigerTeams?: boolean;
}

export function useSearch(query: string, filters: SearchFilters = {}, options?: SOMClientOptions) {
    // Stable client instance
    const client = useMemo(() => createSOMClient(
        options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
        options
    ), [options?.mode, options?.includeCredentials]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['search', query, filters],
        queryFn: async () => {
            // 1. Handle special local intent if API doesn't support it yet
            // For now, we assume simple text search + basic client side modification of query
            let activeQuery = query;
            if (filters.vacant) activeQuery += " vacant";
            if (filters.tigerTeams) activeQuery += " tiger team";

            const response = await client.search(activeQuery, undefined, 10);

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Search failed');
            }

            return response.data.map(r => ({
                id: r.id,
                label: r.name,
                type: r.type,
                subtitle: r.description || r.type
            }));
        },
        enabled: query.trim().length > 0,
        staleTime: 1000 * 60, // 1 minute
    });

    return { results: data || [], isLoading, error };
}
