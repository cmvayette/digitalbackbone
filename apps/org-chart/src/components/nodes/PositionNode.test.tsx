import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PositionNode } from './PositionNode';
import { ReactFlowProvider } from '@xyflow/react';

const vacantNode = {
    id: '2',
    type: 'position',
    data: {
        label: 'Ops Lead',
        isVacant: true
    },
    position: { x: 0, y: 0 }
} as any;

const filledNode = {
    ...vacantNode,
    data: { label: 'Ops Lead', isVacant: false }
} as any;

describe('PositionNode', () => {
    it('renders VACANT badge when isVacant is true', () => {
        render(
            <ReactFlowProvider>
                <PositionNode {...vacantNode} />
            </ReactFlowProvider>
        );
        expect(screen.getByText(/vacant/i)).toBeInTheDocument();
    });

    it('does not render VACANT badge when filled', () => {
        render(
            <ReactFlowProvider>
                <PositionNode {...filledNode} />
            </ReactFlowProvider>
        );
        expect(screen.queryByText('VACANT')).not.toBeInTheDocument();
    });
});
