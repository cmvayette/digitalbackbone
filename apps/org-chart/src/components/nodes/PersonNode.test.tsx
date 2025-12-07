import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PersonNode } from './PersonNode';
import { ReactFlowProvider } from '@xyflow/react';

const mockNodeProps = {
    id: 'p1',
    data: {
        label: 'Alice Bob',
        holon: { id: 'p1', type: 'Person', name: 'Alice Bob' } as any,
        properties: {
            rank: 'CPT',
            primaryPosition: 'Logistics Officer',
            isQualMatch: true
        }
    },
    selected: false,
    type: 'person',
    zIndex: 1000,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    dragHandle: undefined,
};

describe('PersonNode', () => {
    it('renders the person name and rank', () => {
        render(
            <ReactFlowProvider>
                <PersonNode {...mockNodeProps as any} />
            </ReactFlowProvider>
        );
        expect(screen.getByText('Alice Bob')).toBeInTheDocument();
        expect(screen.getByText('CPT')).toBeInTheDocument();
        expect(screen.getByText('Logistics Officer')).toBeInTheDocument();
    });

    it('displays qualified status correctly', () => {
        render(
            <ReactFlowProvider>
                <PersonNode {...mockNodeProps as any} />
            </ReactFlowProvider>
        );
        expect(screen.getByText('Qualified')).toBeInTheDocument();
    });

    it('displays mismatch status correctly when isQualMatch is false', () => {
        const mismatchProps = {
            ...mockNodeProps,
            data: {
                ...mockNodeProps.data,
                properties: { ...mockNodeProps.data.properties, isQualMatch: false }
            }
        };
        render(
            <ReactFlowProvider>
                <PersonNode {...mismatchProps as any} />
            </ReactFlowProvider>
        );
        expect(screen.getByText('Qual Mismatch')).toBeInTheDocument();
    });
});
