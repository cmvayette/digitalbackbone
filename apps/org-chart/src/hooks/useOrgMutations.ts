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

    const addPosition = useCallback((parentId: string, title: string, roleCode: string) => {
        const id = `pos-${Date.now()}`;
        const newPosition: Node<GraphNode> = {
            id,
            type: 'position',
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
                label: title,
                isVacant: true,
                properties: { roleCode, parentOrg: parentId }
            }
        };

        const newEdge: Edge = {
            id: `e-${parentId}-${id}`,
            source: parentId,
            target: id,
            type: 'smoothstep'
        };

        setNodes((nodes) => [...nodes, newPosition]);
        setEdges((edges) => [...edges, newEdge]);

        addAction({
            type: 'CREATE_POS',
            description: `Created Position: ${title}`,
            undo: () => {
                setNodes((nodes) => nodes.filter((n) => n.id !== id));
                setEdges((edges) => edges.filter((e) => e.target !== id));
            }
        });

        return id;
    }, [setNodes, setEdges, addAction]);

    const assignPerson = useCallback((positionId: string, personName: string, rank: string) => {
        let previousNodeState: Node | undefined;

        setNodes((nodes) => {
            const nodeIndex = nodes.findIndex(n => n.id === positionId);
            if (nodeIndex === -1) return nodes;

            previousNodeState = nodes[nodeIndex];
            const prevData = previousNodeState.data as GraphNode; // Cast data to GraphNode
            const prevProps = prevData.properties || {};

            const updatedNode: Node = {
                ...previousNodeState,
                data: {
                    ...prevData,
                    label: personName,
                    isVacant: false,
                    properties: { ...prevProps, rank, title: prevData.label }
                }
            };

            const newNodes = [...nodes];
            newNodes[nodeIndex] = updatedNode;
            return newNodes;
        });

        if (previousNodeState) {
            const prevState = previousNodeState;
            addAction({
                type: 'ASSIGN_PERSON',
                description: `Assigned ${personName}`,
                undo: () => {
                    setNodes((nodes) => nodes.map(n => n.id === positionId ? prevState : n));
                }
            });
        }
    }, [setNodes, addAction]);

    return { addOrganization, addPosition, assignPerson };
}
