import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessSearch } from './ProcessSearch';
import { mockProcesses } from '../mocks/mock-processes';

describe('ProcessSearch', () => {
    it('renders search input', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);
        expect(screen.getByPlaceholderText('Search for a process...')).toBeDefined();
    });

    it('filters processes based on search term', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);
        const input = screen.getByPlaceholderText('Search for a process...');

        // Initial state should show all (or limited list), mockProcesses has 2 items
        expect(screen.getByText('New Operational Workflow')).toBeDefined();
        expect(screen.getByText('Onboarding Checklist')).toBeDefined();

        // Search for "provision" (in description of step or title) - wait, simple filter checks name/desc of process
        fireEvent.change(input, { target: { value: 'Onboarding' } });

        expect(screen.queryByText('New Operational Workflow')).toBeNull();
        expect(screen.getByText('Onboarding Checklist')).toBeDefined();
    });

    it('calls onSelectProcess when a result is clicked', () => {
        const handleSelect = vi.fn();
        render(<ProcessSearch onSelectProcess={handleSelect} />);

        fireEvent.click(screen.getByText('New Operational Workflow'));

        expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({
            id: mockProcesses[0].id
        }));
    });
});
