import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwimlaneViewer } from './SwimlaneViewer';
import { mockProcesses } from '../mocks/mock-processes';

describe('SwimlaneViewer', () => {
    const mockProcess = mockProcesses[0];

    it('renders process details correctly', () => {
        render(
            <SwimlaneViewer
                process={mockProcess}
                onEdit={() => { }}
                onBack={() => { }}
            />
        );

        expect(screen.getByText(new RegExp(mockProcess.properties.name))).toBeDefined();
        // Check for steps
        expect(screen.getByText('Initiate Request')).toBeDefined();
        expect(screen.getByText('Review & Approve')).toBeDefined();
    });

    it('renders agent badge for agent-owned steps', () => {
        // Mock a step owned by an agent (using mock-policy.json data implicitly via component logic)
        // We know from mock-policy.json that agent-1 (Logistics Bot) exists.
        // Let's modify the process prop for this test to force an agent owner
        const agentProcess = {
            ...mockProcess,
            properties: {
                ...mockProcess.properties,
                steps: [
                    { id: 's1', title: 'Agent Step', description: 'desc', owner: 'agent-logistics' } // agent-logistics is Logistics Bot
                ]
            }
        };

        render(
            <SwimlaneViewer
                process={agentProcess}
                onEdit={() => { }}
                onBack={() => { }}
            />
        );

        expect(screen.getByText(/Logistics Bot/)).toBeDefined();
        expect(screen.getByText(/🤖/)).toBeDefined();
    });

    it('calls onEdit when Edit button is clicked', () => {
        const handleEdit = vi.fn();
        render(
            <SwimlaneViewer
                process={mockProcess}
                onEdit={handleEdit}
                onBack={() => { }}
            />
        );

        fireEvent.click(screen.getByText('Edit Process'));
        expect(handleEdit).toHaveBeenCalled();
    });

    it('calls onBack when Back button is clicked', () => {
        const handleBack = vi.fn();
        render(
            <SwimlaneViewer
                process={mockProcess}
                onEdit={() => { }}
                onBack={handleBack}
            />
        );

        fireEvent.click(screen.getByText('← Back'));
        expect(handleBack).toHaveBeenCalled();
    });
});
