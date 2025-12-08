import { useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Node,
    type Edge,
} from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { OrganizationNode } from '../nodes/OrganizationNode';
import { PositionNode } from '../nodes/PositionNode';
import { PersonNode } from '../nodes/PersonNode';
import { TigerTeamEdge } from '../edges/TigerTeamEdge';

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
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

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
                onNodeClick={onNodeClick}
                fitView
                className="bg-bg-canvas"
                colorMode="dark"
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { stroke: '#475569', strokeWidth: 1.5 }, // border-color
                    markerEnd: {
                        type: 'arrowclosed' as any,
                        color: '#475569',
                    },
                }}
            >
                <Controls />
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
