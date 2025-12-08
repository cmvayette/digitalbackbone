import { useCallback } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useUndo } from './useUndo';
import type { GraphNode } from '../types/graph';

export function useOrgMutations() {
    const { setNodes, setEdges } = useReactFlow();
    const { addAction } = useUndo();

    const addOrganization = useCallback((parentId: string, name: string, uic: string) => {
        const id = `org-${Date.now()}`;
        const newOrg: Node<GraphNode> = {
            id,
            type: 'organization',
            position: { x: Math.random() * 500, y: Math.random() * 500 }, // Random pos for now, layout will fix
            data: {
                label: name,
                properties: { uic, parentOrg: parentId }
            }
        };

        const newEdge: Edge = {
            id: `e-${parentId}-${id}`,
            source: parentId,
            target: id,
            type: 'smoothstep'
        };

        setNodes((nodes) => [...nodes, newOrg]);
        setEdges((edges) => [...edges, newEdge]);

        // Add to Undo History
        addAction({
            type: 'CREATE_ORG',
            description: `Created ${name}`,
            undo: () => {
                setNodes((nodes) => nodes.filter((n) => n.id !== id));
                setEdges((edges) => edges.filter((e) => e.target !== id));
            }
        });

        return id;
    }, [setNodes, setEdges, addAction]);

    return { addOrganization };
}
