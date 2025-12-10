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
import { reconcileCompetence } from '../../utils/reconciliation';
// import { useOrgStore } from '../../store/orgStore';
import { useGraphFocus } from '../../hooks/useGraphFocus';
import type { Person, Position } from '../../types/domain';

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
    viewMode: 'reporting' | 'mission';
}

export function GraphCanvas({ initialNodes, initialEdges, onNodeClick, viewMode }: GraphCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

    console.log('GraphCanvas rendering. Nodes:', nodes.length);

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
    const { applyFocus } = useGraphFocus();

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        // 1. Notify Parent (Opens Sidebar)
        if (onNodeClick) onNodeClick(event, node);

        // 2. Apply Ghosting Focus
        setNodes(nds => applyFocus(node.id, nds, edges));

        // 3. Smart Zoom (Optional: slight pan to center?)
        if (rfInstance) {
            rfInstance.fitView({ nodes: [{ id: node.id }], duration: 800, padding: 2, minZoom: 0.5, maxZoom: 1.5 });
        }
    }, [onNodeClick, applyFocus, edges, setNodes, rfInstance]);

    // DRAG & DROP ASSIGNMENT LOGIC
    // const { assignPerson } = useOrgStore();
    const assignPerson = useCallback((positionId: string, personName: string, designatorRating: string) => {
        console.log(`[MOCK] Assigned ${personName} (${designatorRating}) to Position ${positionId}`);
    }, []);

    const onNodeDragStart = useCallback(
        (_: React.MouseEvent, node: Node) => {
            if (node.type !== 'person') return;

            const personData = node.data.properties as Person;

            setNodes((nds) =>
                nds.map((n) => {
                    // Only highlight vacant positions
                    if (n.type === 'position' && n.data.isVacant) {
                        const positionData = n.data.properties as Position;
                        const match = reconcileCompetence(personData, positionData);
                        // Threshold for "Green Light" is 100% match of mandatory reqs, or high score
                        // For now, let's use simple logic: Score > 60 is compatible, else incompatible
                        // Ideally we check if 'mandatory' reqs are met
                        const isCompatible = match.score >= 100 || match.details.every(d => d.strictness !== 'mandatory' || d.isSatisfied);

                        return {
                            ...n,
                            data: {
                                ...n.data,
                                highlightStatus: isCompatible ? 'compatible' : 'incompatible'
                            }
                        };
                    }
                    return n;
                })
            );
        },
        [setNodes]
    );

    const onNodeDragStop = useCallback(
        (_: React.MouseEvent, node: Node) => {
            // Reset Highlights
            setNodes((nds) =>
                nds.map((n) => ({
                    ...n,
                    data: { ...n.data, highlightStatus: 'neutral' }
                }))
            );

            if (node.type !== 'person' || !rfInstance) return;

            // Check intersection with Positions
            const intersections = rfInstance.getIntersectingNodes(node).filter((n) => n.type === 'position');

            if (intersections.length > 0) {
                // Find best match (closest or first)
                const targetPositionNode = intersections[0]; // Simplification: take first
                const personData = node.data.properties as Person;
                const positionData = targetPositionNode.data.properties as Position;

                // 1. Reconcile
                const match = reconcileCompetence(personData, positionData);

                // 2. Alert/Confirm (Mocking the Modal for Phase 1)
                // 2. Alert/Confirm (Mocking the Modal for Phase 1)
                const isPerfectMatch = match.score === 100;

                let message = `Match Score: ${match.score}%\n\n` +
                    match.details.map(d => `${d.isSatisfied ? '✅' : '⚠️'} ${d.qualificationName} (${d.source})`).join('\n');

                if (!isPerfectMatch) {
                    message += `\n\n⚠️ CAUTION: ${personData.properties.name} has skill gaps.\nProceeding will flag this assignment as "At Risk" (Waiver Required).`;
                }

                if (confirm(`Attempting to assign ${personData.properties.name} to ${positionData.properties.title}\n\n${message}\n\nProceed?`)) {
                    // 3. Execute Assignment
                    assignPerson(targetPositionNode.id, personData.properties.name, personData.properties.designatorRating);
                    alert('Assignment Successful!');

                    // Optional: Snap node back or re-layout
                    // For now, let's just re-center layout to clean up
                    setNodes(nds => {
                        const layouted = getLayoutedElements(nds, edges);
                        return nds.map(n => {
                            const ln = layouted.nodes.find(l => l.id === n.id);
                            return ln ? { ...n, position: ln.position } : n;
                        });
                    });
                }
            }
        },
        [rfInstance, assignPerson, setNodes, edges]
    );

    const handlePaneClick = useCallback(() => {
        // Reset Focus: Undim all nodes
        setNodes(nds => applyFocus(null, nds, edges));
    }, [applyFocus, edges, setNodes]);

    useEffect(() => {
        // Inject onToggle into initial nodes
        const nodesWithHandler = initialNodes.map((n) => ({
            ...n,
            data: { ...n.data, onToggle: onNodeToggle },
        }));

        // Layout calculation based on Mode
        const layouted = getLayoutedElements(nodesWithHandler, initialEdges, 'TB', viewMode);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);

        // Fit view after layout change
        setTimeout(() => rfInstance?.fitView({ duration: 800 }), 50);

    }, [initialNodes, initialEdges, setNodes, setEdges, onNodeToggle, viewMode, rfInstance]);

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
                onNodeDragStart={onNodeDragStart} // Start Smart Highlight
                onNodeDragStop={onNodeDragStop} // Enable DND Assignment & Reset
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
