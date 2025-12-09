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

const getDagreLayout = (nodes: Node[], edges: Edge[], direction = 'TB') => {
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

    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = getTypeWidth(node);
        const height = getTypeHeight(node);

        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - width / 2, // Center the node
                y: nodeWithPosition.y - height / 2,
            },
            style: { ...node.style, width: width, height: height },
        };
    });
};

const getMissionLayout = (nodes: Node[], edges: Edge[]) => {
    // "Solar System" Layout: Orgs are stars, Positions orbit them.
    // 1. Find Orgs
    const orgNodes = nodes.filter(n => n.type === 'organization');
    const posNodes = nodes.filter(n => n.type === 'position');
    const personNodes = nodes.filter(n => n.type === 'person');

    const GRID_COLS = Math.ceil(Math.sqrt(orgNodes.length));
    const CELL_SIZE = 800; // Large space for orbits

    const newNodes: Node[] = [];

    // Place Organizations in a Grid
    orgNodes.forEach((org, idx) => {
        const row = Math.floor(idx / GRID_COLS);
        const col = idx % GRID_COLS;
        const centerX = col * CELL_SIZE;
        const centerY = row * CELL_SIZE;

        newNodes.push({
            ...org,
            position: { x: centerX, y: centerY },
            style: { ...org.style, width: getTypeWidth(org), height: getTypeHeight(org) }
        });

        // Find Children (Positions)
        // Heuristic: Edges source=org -> target=position (or vice versa depending on direction)
        // In our data: Org -> Position (via 'orgId' prop but graph edges are parent->child)
        const childEdges = edges.filter(e => e.source === org.id);
        const childIds = new Set(childEdges.map(e => e.target));

        const myPositions = posNodes.filter(n => childIds.has(n.id));

        // Place Positions in Orbit
        const RADIUS = 300;
        myPositions.forEach((pos, pIdx) => {
            const angle = (pIdx / myPositions.length) * 2 * Math.PI;
            const x = centerX + RADIUS * Math.cos(angle);
            const y = centerY + RADIUS * Math.sin(angle);

            newNodes.push({
                ...pos,
                position: { x, y },
                style: { ...pos.style, width: getTypeWidth(pos), height: getTypeHeight(pos) }
            });

            // Find People for this Position
            // Assuming Position -> Person edges? 
            // Actually assignedPersonId is on Position. Edges might be Position->Person?
            // Let's check edges. In store:
            // "Updated Position to link to Person" -> usually implies data prop. 
            // Logic: if Graph has Edge Position->Person, we handle it.
            // If not, we rely on Position Node displaying the person.
            // But if PersonNode exists separately in graph (it does), we need to place it.

            // Let's assume edges exist: Position -> Person
            const personEdges = edges.filter(e => e.source === pos.id);
            const personIds = new Set(personEdges.map(e => e.target));
            const myPeople = personNodes.filter(n => personIds.has(n.id));

            // Place People "Docked" to Position
            myPeople.forEach((person) => {
                newNodes.push({
                    ...person,
                    position: { x: x + 20, y: y + 20 }, // Slight offset "docked"
                    style: { ...person.style, width: getTypeWidth(person), height: getTypeHeight(person) }
                });
            });
        });
    });

    // Add any orphaned nodes at 0,0 for safety
    const processedIds = new Set(newNodes.map(n => n.id));
    nodes.forEach(n => {
        if (!processedIds.has(n.id)) {
            newNodes.push({ ...n, position: { x: 0, y: 0 } });
        }
    });

    return newNodes;
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB', mode: 'reporting' | 'mission' = 'reporting') => {
    if (nodes.length === 0) return { nodes, edges };

    if (mode === 'mission') {
        const layoutedNodes = getMissionLayout(nodes, edges);
        return { nodes: layoutedNodes, edges };
    }

    const layoutedNodes = getDagreLayout(nodes, edges, direction);
    return { nodes: layoutedNodes, edges };
};
