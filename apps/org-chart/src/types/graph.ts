import type { Node, Edge } from '@xyflow/react';

export type GraphNodeData = {
    label: string;
    subtitle?: string;
    type?: 'organization' | 'position' | 'person';
    isVacant?: boolean;
    isBillet?: boolean;
    billetIDs?: string;
    properties?: Record<string, any>;
    collapsed?: boolean;
    onToggle?: (id: string) => void; // Callback for collapse/expand
    highlightStatus?: 'compatible' | 'incompatible' | 'neutral';
    isDimmed?: boolean; // For Focus + Context (Ghosting)
};

export type GraphNode = Node<GraphNodeData>;

export type GraphEdge = Edge;

export type GraphData = {
    nodes: GraphNode[];
    edges: GraphEdge[];
};
