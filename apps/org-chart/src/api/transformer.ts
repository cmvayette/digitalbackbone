import type { OrgStructure } from '@som/api-client';
import type { GraphData, GraphNode, GraphEdge } from '../types/graph';

class GraphBuilder {
    private nodes: GraphNode[] = [];
    private edges: GraphEdge[] = [];
    private processedIds = new Set<string>();
    private yOffset = 0;

    constructor() { }

    public build(): GraphData {
        return { nodes: this.nodes, edges: this.edges };
    }

    private addNode(node: GraphNode) {
        if (!this.processedIds.has(node.id)) {
            this.nodes.push(node);
            this.processedIds.add(node.id);
        }
    }

    private addEdge(edge: GraphEdge) {
        this.edges.push(edge);
    }

    public processStructure(structure: OrgStructure, parentOrgId?: string) {
        const org = structure.organization;

        this.addOrganizationNode(org);

        if (parentOrgId) {
            this.addEdge({
                id: `${parentOrgId}-${org.id}`,
                source: parentOrgId,
                target: org.id,
                type: 'smoothstep'
            });
        }

        this.yOffset++;

        this.processPositions(structure.positions, structure.assignments, org.id);

        // Recurse for Sub-Orgs
        structure.subOrganizations.forEach(sub => this.processStructure(sub, org.id));
    }

    private addOrganizationNode(org: any) {
        this.addNode({
            id: org.id,
            type: 'organization',
            data: {
                label: org.properties.name || 'Unknown Org',
                subtitle: org.properties.uics?.join(', '),
                properties: org
            },
            position: { x: 0, y: this.yOffset * 100 }
        });
    }

    private processPositions(positions: any[], assignments: any[], orgId: string) {
        positions.forEach(pos => {
            // Find assignment for this position
            const assignment = assignments.find(a => a.position.id === pos.id);
            const person = assignment?.person;

            this.addPositionNode(pos, person);

            // Edge: Org -> Position
            this.addEdge({
                id: `${orgId}-${pos.id}`,
                source: orgId,
                target: pos.id,
                type: 'smoothstep'
            });
        });
    }

    private addPositionNode(pos: any, person: any) {
        const node: GraphNode = {
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
            position: { x: 100, y: this.yOffset * 100 }
        };

        // If occupied, inject person data into the position node.
        // "Position Card" shows identity, effectively merging Person into Position for the graph view.
        if (person) {
            node.data.subtitle = person.properties.name;
            if (node.data.properties) {
                node.data.properties['rank'] = person.properties.designatorRating;
            }
            node.data.isVacant = false;
        }

        this.addNode(node);
    }
}

export function transformStructureToGraph(data: OrgStructure): GraphData {
    const builder = new GraphBuilder();
    builder.processStructure(data);
    return builder.build();
}
