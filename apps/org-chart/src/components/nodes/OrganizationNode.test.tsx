import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrganizationNode } from './OrganizationNode';
import { ReactFlowProvider } from '@xyflow/react';

const mockNode = {
    id: '1',
    type: 'organization',
    data: {
        label: 'Test Org',
        properties: {
            uic: 'TEST',
            stats: { totalSeats: 10, vacancies: 2 } // 20% > 15% -> Red
        }
    },
    position: { x: 0, y: 0 },
    zIndex: 1
} as any;

const safeMockNode = {
    ...mockNode,
    data: {
        ...mockNode.data,
        properties: { ...mockNode.data.properties, stats: { totalSeats: 10, vacancies: 0 } }
    }
} as any;

describe('OrganizationNode', () => {
    it('renders health dot when vacancies exist', () => {
        render(
            <ReactFlowProvider>
                <OrganizationNode {...mockNode} />
            </ReactFlowProvider>
        );
        // Check for red dot (based on simple logic >15% is red)
        const dot = screen.getByTitle('2 Vacancies');
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-red-500');
    });

    it('does not render health dot when no vacancies', () => {
        render(
            <ReactFlowProvider>
                <OrganizationNode {...safeMockNode} />
            </ReactFlowProvider>
        );
        const dot = screen.queryByTitle(/vacancies/i);
        expect(dot).not.toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
        render(
            <ReactFlowProvider>
                <OrganizationNode {...mockNode} />
            </ReactFlowProvider>
        );

        const node = screen.getByText('Test Org').closest('.group');
        if (!node) throw new Error('Node not found');

        fireEvent.mouseEnter(node);

        // Tooltip uses Portal, so look in document
        await waitFor(() => {
            expect(screen.getByText('Click to view services and roster details.')).toBeInTheDocument();
        });
    });
});
