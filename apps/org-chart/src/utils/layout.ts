import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { GraphNode } from '../types/graph';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const DEFAULT_NODE_HEIGHT = 160;

const getTypeWidth = (node: GraphNode | Node) => {
    const data = node.data as any;
    const level = data?.properties?.echelonLevel;
    if (level === 'Command') return 320;
    if (level === 'Directorate') return 280;
    if (level === 'Division') return 240;
    return 280; // Default
};

const getTypeHeight = (node: GraphNode | Node) => {
    const data = node.data as any;
    const level = data?.properties?.echelonLevel;
    if (level === 'Command') return 200;
    if (level === 'Directorate') return 180;
    if (level === 'Division') return 120; // Reduced to 120
    return DEFAULT_NODE_HEIGHT;
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    // Epic 10: Tighter ranksep of 60 for density
    dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: getTypeWidth(node), height: getTypeHeight(node) });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = getTypeWidth(node);
        const height = getTypeHeight(node);

        const newNode = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
            // Pass explicit dimensions to style so the component matches layout
            style: { ...node.style, width: width, height: height },
        };

        return newNode;
    });

    return { nodes: newNodes, edges };
};
