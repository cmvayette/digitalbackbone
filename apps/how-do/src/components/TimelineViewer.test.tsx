import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineViewer } from './TimelineViewer';
import { describe, it, expect, vi } from 'vitest';
import type { Process } from '@som/shared-types';
import { HolonType } from '@som/shared-types';
import '@testing-library/jest-dom';

const mockProcess: Process = {
    id: "proc-1",
    type: HolonType.Process,
    createdAt: new Date(),
    createdBy: "user-1",
    status: "active",
    sourceDocuments: [],
    properties: {
        name: "Test Process",
        description: "A test process description",
        inputs: [],
        outputs: [],
        estimatedDuration: 60,
        steps: [
            {
                id: "step-1",
                title: "First Step",
                description: "Do the first thing",
                owner: "pos-1"
            },
            {
                id: "step-2",
                title: "Second Step",
                description: "Do the next thing",
                owner: "pos-2"
            }
        ]
    }
};

describe('TimelineViewer', () => {
    it('renders process title and steps', () => {
        render(
            <TimelineViewer
                process={mockProcess}
                onEdit={() => { }}
                onBack={() => { }}
            />
        );

        expect(screen.getByText('Test Process')).toBeInTheDocument();
        expect(screen.getByText('First Step')).toBeInTheDocument();
        expect(screen.getByText('Second Step')).toBeInTheDocument();
        // Check for step numbers
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', () => {
        const handleBack = vi.fn();
        render(
            <TimelineViewer
                process={mockProcess}
                onEdit={() => { }}
                onBack={handleBack}
            />
        );

        fireEvent.click(screen.getByText('← Back'));
        expect(handleBack).toHaveBeenCalled();
    });

    it('calls onEdit when edit button is clicked', () => {
        const handleEdit = vi.fn();
        render(
            <TimelineViewer
                process={mockProcess}
                onEdit={handleEdit}
                onBack={() => { }}
            />
        );

        fireEvent.click(screen.getByText('Edit Process'));
        expect(handleEdit).toHaveBeenCalled();
    });
});
