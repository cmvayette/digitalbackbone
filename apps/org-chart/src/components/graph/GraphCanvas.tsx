import { useCallback, useEffect, useState } from 'react';
import { DiscoveryBar } from '../discovery/DiscoveryBar';
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
import { useOrgStore } from '../../store/orgStore';
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
}

export function GraphCanvas({ initialNodes, initialEdges, onNodeClick }: GraphCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const [viewMode, setViewMode] = useState<'reporting' | 'mission'>('reporting');

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

        // 3. Update Visibility & Layout (Ghosting Pattern)
        setNodes((nds) => {
            const focusedNodes = nds.map((n) => {
                const isNeighbor = neighborhood.has(n.id);
                return {
                    ...n,
                    // Don't hide, just dim. Ghosting!
                    // hidden: !isNeighbor, 
                    data: {
                        ...n.data,
                        isDimmed: !isNeighbor
                    },
                    // Push dimmed nodes to back, focused to front
                    zIndex: isNeighbor ? 10 : 0,
                };
            });

            // NOTE: We used to re-layout here. With ghosting, we might want to KEEP the layout helpful?
            // Or usually we usually just dim in place. Let's keep positions stable for now to avoid disorienting jumps.
            // If the user wants to "Zoom In", the fitView below handles it.

            return focusedNodes;
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

    // DRAG & DROP ASSIGNMENT LOGIC
    const { assignPerson } = useOrgStore();

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
        setNodes((nds) => {
            return nds.map((n) => ({
                ...n,
                hidden: false,
                zIndex: 1,
                data: { ...n.data, isDimmed: false }
            }));
        });
        setTimeout(() => rfInstance?.fitView({ duration: 800 }), 50);
    }, [rfInstance, setNodes]);

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
                <DiscoveryBar
                    nodes={nodes}
                    onResultSelect={(res) => {
                        // Focus on selected node
                        const node = nodes.find(n => n.id === res.id);
                        if (node && rfInstance) {
                            rfInstance.fitView({ nodes: [{ id: node.id }], padding: 0.5, duration: 800 });
                        }
                    }}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
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
