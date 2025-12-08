import { describe, it, expect } from 'vitest';
import { transformStructureToGraph } from './transformer';
import type { OrgStructure } from '@som/api-client';
import { HolonType } from '@som/shared-types';
import type { Holon } from '@som/shared-types';

describe('Graph Transformer', () => {
    // Helper to create mock holons
    // const queue = [data]; // Unused BFS queue
    const createHolon = (id: string, type: HolonType, props: any = {}): Holon => ({
        id,
        type,
        properties: props,
        relationships: [],
        createdAt: new Date(),
        createdBy: 'system',
        status: 'active' as any,
        sourceDocuments: []
    } as unknown as Holon);

    it('should flatten a simple org structure into nodes and edges', () => {
        // 1. Mock Data: Root Org -> Child Org
        const mockData: OrgStructure = {
            organization: createHolon('org-root', HolonType.Organization, { name: 'Root Org' }),
            subOrganizations: [
                {
                    organization: createHolon('org-child', HolonType.Organization, { name: 'Child Org' }),
                    subOrganizations: [],
                    positions: [],
                    assignments: [],
                    asOfTimestamp: new Date()
                }
            ],
            positions: [],
            assignments: [],
            asOfTimestamp: new Date()
        };

        // 2. Transform
        const { nodes, edges } = transformStructureToGraph(mockData);

        // 3. Verify
        // Should have 2 Org nodes
        expect(nodes).toHaveLength(2);
        expect(nodes.find(n => n.id === 'org-root')).toBeDefined();
        expect(nodes.find(n => n.id === 'org-child')).toBeDefined();

        // Should have 1 Edge connecting them
        expect(edges).toHaveLength(1);
        expect(edges[0].source).toBe('org-root');
        expect(edges[0].target).toBe('org-child');
    });

    it('should handle positions and assignments', () => {
        // 1. Mock Data: Org -> Position (Occupied)
        const mockOrg = createHolon('org-1', HolonType.Organization, { name: 'Test Org' });
        const mockPos = createHolon('pos-1', HolonType.Position, { title: 'Commander', billetIDs: ['B-001'] });
        const mockPerson = createHolon('person-1', HolonType.Person, { name: 'John Doe', rank: 'CAPT' });

        const mockData: OrgStructure = {
            organization: mockOrg,
            subOrganizations: [],
            positions: [mockPos],
            assignments: [{
                position: mockPos,
                person: mockPerson,
                relationship: {} as any // simplified
            }],
            asOfTimestamp: new Date()
        };

        // 2. Transform
        const { nodes, edges } = transformStructureToGraph(mockData);

        // 3. Verify Nodes
        // Org Node
        const orgNode = nodes.find(n => n.id === 'org-1');
        expect(orgNode).toBeDefined();

        // Position Node
        const posNode = nodes.find(n => n.id === 'pos-1');
        expect(posNode).toBeDefined();
        expect(posNode?.type).toBe('position');
        expect(posNode?.data.label).toBe('Commander');
        expect(posNode?.data.subtitle).toBe('John Doe'); // Person name injected
        expect(posNode?.data.isVacant).toBe(false);

        // 4. Verify Edges
        // Org -> Position
        const orgPosEdge = edges.find(e => e.source === 'org-1' && e.target === 'pos-1');
        expect(orgPosEdge).toBeDefined();
    });
});
