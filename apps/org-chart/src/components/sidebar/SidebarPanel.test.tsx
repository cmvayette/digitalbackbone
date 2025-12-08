import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarPanel } from './SidebarPanel';
import { ReactFlowProvider } from '@xyflow/react';

const mockNode = {
    id: 'n1',
    data: {
        label: 'Test Node',
        type: 'Organization',
        properties: { uic: 'TEST', stats: { totalSeats: 10, vacancies: 2 } }
    },
    type: 'organization',
    selected: true,
    position: { x: 0, y: 0 },
    zIndex: 1
} as any;

describe('SidebarPanel', () => {
    it('renders placeholder when no node is selected', () => {
        render(<SidebarPanel selectedNode={null} />);
        expect(screen.getByText(/select an organization/i)).toBeInTheDocument();
    });

    it('renders organization content when org node selected', () => {
        render(
            <ReactFlowProvider>
                <SidebarPanel selectedNode={mockNode} />
            </ReactFlowProvider>
        );
        expect(screen.getByText('Test Node')).toBeInTheDocument();
        expect(screen.getByText('TEST')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(
            <ReactFlowProvider>
                <SidebarPanel selectedNode={mockNode} onClose={onClose} />
            </ReactFlowProvider>
        );

        // Find close button by label
        const closeBtn = screen.getByLabelText('Close sidebar');
        fireEvent.click(closeBtn);

        expect(onClose).toHaveBeenCalled();
    });
});
