import type { Node } from '@xyflow/react';
import type { Holon, Relationship } from '@som/shared-types';

export type NodeType = 'organization' | 'position' | 'person';

export interface GraphNodeData extends Record<string, unknown> {
    label: string;
    holon: Holon;
    // UI specific props
    isVacant?: boolean;
    isBillet?: boolean;
    rank?: string;
    subtitle?: string;
    // Generic properties bag from Holon
    properties?: any;
}

export type GraphNode = Node<GraphNodeData, NodeType>;

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: {
        relationship?: Relationship;
    };
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
