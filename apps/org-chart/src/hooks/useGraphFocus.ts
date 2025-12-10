import { useCallback, useState } from 'react';
import { type Node, type Edge } from '@xyflow/react';

export function useGraphFocus() {
    const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

    const applyFocus = useCallback((nodeId: string | null, nodes: Node[], edges: Edge[]) => {
        setFocusNodeId(nodeId);

        if (!nodeId) {
            // Reset: All visible
            return nodes.map(n => ({
                ...n,
                style: { ...n.style, opacity: 1, filter: 'none', transition: 'all 500ms ease-in-out' },
                data: { ...n.data, isGhosted: false }
            }));
        }

        // 1. Identify "Active" Network (Ancestors + Descendants + Direct Neighbors)
        const activeIds = new Set<string>();
        const visited = new Set<string>();

        // Helper: BFS/DFS Traversal
        const traverse = (currentId: string, direction: 'up' | 'down') => {
            if (visited.has(currentId + direction)) return;
            visited.add(currentId + direction);
            activeIds.add(currentId);

            if (direction === 'up') {
                // Find parents (where edge target === current)
                const parents = edges.filter(e => e.target === currentId).map(e => e.source);
                parents.forEach(p => traverse(p, 'up'));
            } else {
                // Find children (where edge source === current)
                const children = edges.filter(e => e.source === currentId).map(e => e.target);
                children.forEach(c => traverse(c, 'down'));
            }
        };

        // Start from Focus Node
        traverse(nodeId, 'up');
        traverse(nodeId, 'down');

        // 2. Apply Styles
        return nodes.map(n => {
            const isRelevant = activeIds.has(n.id);
            return {
                ...n,
                style: {
                    ...n.style,
                    opacity: isRelevant ? 1 : 0.2, // Ghost opacity
                    filter: isRelevant ? 'none' : 'grayscale(100%)', // Desaturate ghosts
                    transition: 'all 500ms ease-in-out'
                },
                data: {
                    ...n.data,
                    isGhosted: !isRelevant
                }
            };
        });
    }, []);

    return { focusNodeId, applyFocus };
}
