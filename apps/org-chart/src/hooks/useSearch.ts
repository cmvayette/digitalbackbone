import { useMemo } from 'react';
import type { Node } from '@xyflow/react';

export interface SearchResult {
    id: string;
    label: string;
    type: string;
    subtitle?: string;
    node: Node;
}

export interface SearchFilters {
    vacant?: boolean;
    tigerTeams?: boolean;
}

export function useSearch(nodes: Node[], query: string, filters: SearchFilters = {}): SearchResult[] {
    return useMemo(() => {
        // 1. Parse Query for NL Intents
        let activeQuery = query.toLowerCase();
        let nlVacant = false;
        let nlTiger = false;

        // Detect "vacant"
        if (activeQuery.includes('vacant')) {
            nlVacant = true;
            activeQuery = activeQuery.replace('vacant', '').trim();
        }

        // Detect "tiger team"
        if (activeQuery.includes('tiger team')) {
            nlTiger = true;
            activeQuery = activeQuery.replace('tiger team', '').trim();
        }

        // Detect "in [Scope]" (Basic implementation)
        // e.g. "admin in N1" -> query: "admin", scope: "N1"
        // For now, we'll just treat the remaining query as a broad match against parent/path if we had that data.
        // Assuming simple string matching for now.

        const showVacant = filters.vacant || nlVacant;
        const showTiger = filters.tigerTeams || nlTiger;

        // If no query and no filters, return empty
        if (activeQuery.length === 0 && !showVacant && !showTiger) return [];

        return nodes
            .filter((node) => {
                const data = node.data;
                const props = (data.properties as any) || {};

                // -- Filter Checks --
                if (showVacant) {
                    // Must be a position AND be vacant
                    // Check explicit isVacant flag or property state
                    const isVacant = data.isVacant === true || props.state === 'vacant';
                    if (!isVacant) return false;
                }

                if (showTiger) {
                    // Must be a Tiger Team (Org) or related
                    const isTiger = props.isTigerTeam === true;
                    if (!isTiger) return false;
                }

                // -- Text Matching --
                // If we stripped everything away (e.g. "show vacant"), we match all (passed filters)
                if (activeQuery.length === 0) return true;

                // Otherwise, normal text search
                const label = (data.label as string || '').toLowerCase();
                const type = (node.type || '').toLowerCase();
                const subtitle = (props.rank || props.uic || props.billetCode || '').toLowerCase();
                const name = (props.name || '').toLowerCase(); // Org name / Person name

                return label.includes(activeQuery) ||
                    type.includes(activeQuery) ||
                    subtitle.includes(activeQuery) ||
                    name.includes(activeQuery);
            })
            .map((node) => {
                const data = node.data;
                const props = (data.properties as any) || {};
                let subtitle = '';

                if (node.type === 'organization') subtitle = props.uic || 'Organization';
                else if (node.type === 'person') subtitle = props.rank || 'Person';
                else if (node.type === 'position') subtitle = props.billetCode || 'Position';

                return {
                    id: node.id,
                    label: data.label as string,
                    type: node.type || 'unknown',
                    subtitle,
                    node
                };
            })
            .slice(0, 10);
    }, [nodes, query, filters]);
}
