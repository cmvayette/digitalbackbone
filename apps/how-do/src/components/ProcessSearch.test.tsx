import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessSearch } from './ProcessSearch';
import { mockProcesses } from '../mocks/mock-processes';

// Mock useDriftDetection to force a drift state
vi.mock('../hooks/useDriftDetection', () => ({
    useDriftDetection: (process: any) => {
        // Mocking drift for a specific process ID or logic
        if (process.id === 'proc-1') {
            return { hasDrift: true, issues: [] };
        }
        return { hasDrift: false, issues: [] };
    }
}));

describe('ProcessSearch', () => {
    it('renders list of processes', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);
        expect(screen.getByText('New Operational Workflow')).toBeDefined();
        expect(screen.getByText('Onboarding Checklist')).toBeDefined();
    });

    it('shows DRIFT badge for drifting process', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);

        // proc-1 is mocked to have drift
        const driftBadges = screen.getAllByText('DRIFT');
        expect(driftBadges.length).toBeGreaterThan(0);
    });

    it('filters processes by search term', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);

        const input = screen.getByPlaceholderText('Search for a process...');
        fireEvent.change(input, { target: { value: 'Onboarding' } });

        expect(screen.queryByText('New Operational Workflow')).toBeNull();
        expect(screen.getByText('Onboarding Checklist')).toBeDefined();
    });

    it('calls onSelectProcess when clicked', () => {
        const onSelect = vi.fn();
        render(<ProcessSearch onSelectProcess={onSelect} />);

        fireEvent.click(screen.getByText('Onboarding Checklist'));
        expect(onSelect).toHaveBeenCalled();
    });
});
