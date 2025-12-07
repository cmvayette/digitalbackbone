import { useMemo } from 'react';
import type { Node } from '@xyflow/react';

export interface SearchResult {
    id: string;
    label: string;
    type: string;
    subtitle?: string;
    node: Node;
}

export function useSearch(nodes: Node[], query: string): SearchResult[] {
    return useMemo(() => {
        if (!query || query.trim().length === 0) return [];

        const lowerQuery = query.toLowerCase();

        return nodes
            .filter((node) => {
                const data = node.data;
                const label = (data.label as string || '').toLowerCase();
                const type = (node.type || '').toLowerCase();
                // Check specialized properties based on type
                const properties = (data.properties as any) || {};
                const subtitle = (properties.rank || properties.uic || properties.billetCode || '').toLowerCase();

                return label.includes(lowerQuery) ||
                    type.includes(lowerQuery) ||
                    subtitle.includes(lowerQuery);
            })
            .map((node) => {
                const data = node.data;
                const properties = (data.properties as any) || {};
                let subtitle = '';

                if (node.type === 'organization') subtitle = properties.uic || 'Organization';
                else if (node.type === 'person') subtitle = properties.rank || 'Person';
                else if (node.type === 'position') subtitle = properties.billetCode || 'Position';

                return {
                    id: node.id,
                    label: data.label as string,
                    type: node.type || 'unknown',
                    subtitle,
                    node
                };
            })
            .slice(0, 10); // Limit to 10 results
    }, [nodes, query]);
}
