import type { Node, Edge } from '@xyflow/react';

export type GraphNodeData = {
    label: string;
    subtitle?: string;
    type?: 'organization' | 'position' | 'person';
    isVacant?: boolean;
    isBillet?: boolean;
    billetIDs?: string;
    properties?: Record<string, any>;
};

export type GraphNode = Node<GraphNodeData>;

export type GraphEdge = Edge;

export type GraphData = {
    nodes: GraphNode[];
    edges: GraphEdge[];
};
