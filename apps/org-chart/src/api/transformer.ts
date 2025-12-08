import type { OrganizationalStructureDTO } from '../types/api';
import type { GraphData, GraphNode, GraphEdge } from '../types/graph';

export function transformStructureToGraph(data: OrganizationalStructureDTO): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const processedIds = new Set<string>();

    // Helper to add node if not defined
    const addNode = (node: GraphNode) => {
        if (!processedIds.has(node.id)) {
            nodes.push(node);
            processedIds.add(node.id);
        }
    };

    // Helper to add edge
    const addEdge = (edge: GraphEdge) => {
        edges.push(edge);
    };

    // Processing Queue
    // const queue = [data]; 

    // Starting position (simple layout placeholder, dagre will run later)
    let yOffset = 0;

    function processStructure(structure: OrganizationalStructureDTO, parentOrgId?: string) {
        const org = structure.organization;

        // 1. Add Organization Node
        addNode({
            id: org.id,
            type: 'organization',
            data: {
                label: org.properties.name || 'Unknown Org',
                subtitle: org.properties.uics?.join(', '),
                properties: org
            },
            position: { x: 0, y: yOffset * 100 }
        });

        if (parentOrgId) {
            addEdge({
                id: `${parentOrgId}-${org.id}`,
                source: parentOrgId,
                target: org.id,
                type: 'smoothstep'
            });
        }

        yOffset++;

        // 2. Add Positions and Assignments
        structure.positions.forEach(pos => {
            // Find assignment for this position
            const assignment = structure.assignments.find(a => a.position.id === pos.id);
            const person = assignment?.person;

            // Add Position Node
            addNode({
                id: pos.id,
                type: 'position',
                data: {
                    label: pos.properties.title,
                    subtitle: 'Vacant', // Will be overwritten if filled
                    isVacant: true,
                    properties: pos,
                    isBillet: pos.properties.billetStatus === 'billet',
                    billetIDs: pos.properties.billetIDs?.join(', ')
                },
                position: { x: 100, y: yOffset * 100 }
            });

            // Edge: Org -> Position
            addEdge({
                id: `${org.id}-${pos.id}`,
                source: org.id,
                target: pos.id,
                type: 'smoothstep'
            });

            // If occupied, do we show person as separate node? 
            // Spec says "Position Card" shows identity. So Person Node might be implicit in Position Node.
            // BUT for graph purity, let's keep them separate if we want "Person" entities to be clickable independent of position.
            // However, the "Position Card" UI spec combines them.
            // Let's stick to the spec: Position Card shows the person.
            // We will inject the person data INTO the position node data.
            if (person) {
                // Transform data already done above? 
                // Actually, let's add person data to the node data for rendering
                // We do NOT add a separate 'person' node unless strictly required.
                const nodeIndex = nodes.findIndex(n => n.id === pos.id);
                if (nodeIndex >= 0 && person && nodes[nodeIndex].data.properties) {
                    nodes[nodeIndex].data.subtitle = person.properties.name; // Override subtitle or add extra prop
                    nodes[nodeIndex].data.properties['rank'] = person.properties.designatorRating;
                }
            }
        });

        // 3. Recurse for Sub-Orgs
        structure.subOrganizations.forEach(sub => processStructure(sub, org.id));
    }

    processStructure(data);

    return { nodes, edges };
}
