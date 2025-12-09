import { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Node,
    type Edge,
    type ReactFlowInstance,
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { OrganizationNode } from '../nodes/OrganizationNode';
import { PositionNode } from '../nodes/PositionNode';
import { PersonNode } from '../nodes/PersonNode';
import { TigerTeamEdge } from '../edges/TigerTeamEdge';
import { getLayoutedElements } from '../../utils/layout';

const nodeTypes = {
    organization: OrganizationNode,
    position: PositionNode,
    person: PersonNode,
};

const edgeTypes = {
    tigerTeam: TigerTeamEdge,
};

interface GraphCanvasProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

export function GraphCanvas({ initialNodes, initialEdges, onNodeClick }: GraphCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

    // Collapse Logic
    const onNodeToggle = useCallback((nodeId: string) => {
        setNodes((nds) => {
            const target = nds.find((n) => n.id === nodeId);
            if (!target) return nds;

            const isCollapsing = !target.data.collapsed;

            // 1. Update the toggle state of the clicked node
            const updatedNodes = nds.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, collapsed: isCollapsing } } : n,
            );

            // 2. Recursive Visibility Update
            const findChildren = (parentId: string) => edges.filter((e) => e.source === parentId).map((e) => e.target);

            const updateChildren = (parentId: string, shouldHide: boolean) => {
                const children = findChildren(parentId);
                children.forEach((childId) => {
                    const child = updatedNodes.find((n) => n.id === childId);
                    if (child) {
                        child.hidden = shouldHide;
                        // If we are hiding, hide children.
                        // If showing, show children ONLY if this child IS NOT collapsed.
                        const childCollapsed = child.data.collapsed;
                        const nextHide = shouldHide ? true : !!childCollapsed;
                        updateChildren(childId, nextHide);
                    }
                });
            };

            updateChildren(nodeId, isCollapsing);

            // 3. Re-Layout Visible Nodes
            const visibleNodes = updatedNodes.filter((n) => !n.hidden);
            const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
            const visibleEdges = edges.filter(
                (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
            );

            const layouted = getLayoutedElements(visibleNodes, visibleEdges);

            return updatedNodes.map((n) => {
                const layoutedNode = layouted.nodes.find((ln) => ln.id === n.id);
                // Return layouted position if visible, else keep old (or hidden)
                return layoutedNode ? { ...n, position: layoutedNode.position, style: layoutedNode.style } : n;
            });
        });
    }, [edges, setNodes]);

    // FOCUS MODE LOGIC
    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        // 1. Notify Parent
        if (onNodeClick) onNodeClick(event, node);

        // 2. Calculate Neighborhood
        const neighborhood = new Set<string>();
        neighborhood.add(node.id);

        // Parent (Incoming)
        const parentEdge = edges.find((e) => e.target === node.id);
        if (parentEdge) {
            neighborhood.add(parentEdge.source);
            // Peers (Siblings)
            edges.filter((e) => e.source === parentEdge.source).forEach((e) => neighborhood.add(e.target));
        }

        // Children (Outgoing)
        edges.filter((e) => e.source === node.id).forEach((e) => neighborhood.add(e.target));

        // 3. Update Visibility & Layout
        setNodes((nds) => {
            const focusedNodes = nds.map((n) => ({
                ...n,
                hidden: !neighborhood.has(n.id),
            }));

            // Re-layout focused subset to center them nicely
            const visibleNodes = focusedNodes.filter((n) => !n.hidden);
            const visibleEdges = edges.filter(
                (e) => neighborhood.has(e.source) && neighborhood.has(e.target)
            );

            const layouted = getLayoutedElements(visibleNodes, visibleEdges);

            return focusedNodes.map((n) => {
                const layoutedNode = layouted.nodes.find((ln) => ln.id === n.id);
                return layoutedNode ? { ...n, position: layoutedNode.position, style: layoutedNode.style } : n;
            });
        });

        // 4. Animate Camera
        setTimeout(() => {
            if (rfInstance) {
                rfInstance.fitView({
                    nodes: [{ id: node.id }], // Center roughly on the node
                    padding: 0.5,
                    duration: 800
                });
            }
        }, 50);
    }, [edges, onNodeClick, rfInstance, setNodes]);

    const handlePaneClick = useCallback(() => {
        // Reset Focus: Show all nodes and re-layout.
        setNodes((nds) => {
            const allVisible = nds.map(n => ({ ...n, hidden: false }));
            const layouted = getLayoutedElements(allVisible, edges);
            return allVisible.map((n) => {
                const layoutedNode = layouted.nodes.find((ln) => ln.id === n.id);
                return layoutedNode ? { ...n, position: layoutedNode.position, style: layoutedNode.style } : n;
            });
        });
        setTimeout(() => rfInstance?.fitView({ duration: 800 }), 50);
    }, [edges, rfInstance, setNodes]);

    useEffect(() => {
        // Inject onToggle into initial nodes
        const nodesWithHandler = initialNodes.map((n) => ({
            ...n,
            data: { ...n.data, onToggle: onNodeToggle },
        }));

        // Initial Layout (Safety)
        const layouted = getLayoutedElements(nodesWithHandler, initialEdges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
    }, [initialNodes, initialEdges, setNodes, setEdges, onNodeToggle]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="h-full w-full bg-bg-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick} // Use the new handler
                onPaneClick={handlePaneClick} // Add pane click handler
                onInit={setRfInstance} // Initialize rfInstance
                className="bg-bg-canvas"
                colorMode="dark"
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{
                    type: 'default',
                    style: { stroke: '#475569', strokeWidth: 1.5 }, // border-color
                    markerEnd: {
                        type: 'arrowclosed' as any,
                        color: '#475569',
                    },
                }}
                minZoom={0.1}
            >
                <Controls className="bg-bg-panel border-border-color fill-text-primary" />
                <MiniMap
                    className="bg-bg-panel border border-border-color"
                    maskColor="rgba(15, 23, 42, 0.7)" // bg-canvas with opacity
                    nodeColor={(n) => {
                        if (n.type === 'organization') return '#10b981'; // accent-green
                        if (n.type === 'position') return '#f97316'; // accent-orange
                        return '#94a3b8'; // text-secondary
                    }}
                />
            </ReactFlow>
        </div>
    );
}
