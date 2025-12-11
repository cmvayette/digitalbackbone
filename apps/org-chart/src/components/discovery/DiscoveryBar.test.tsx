import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiscoveryBar } from './DiscoveryBar';

vi.mock('../../hooks/useSearch', () => ({
    useSearch: (query: string) => {
        // Simple mock behavior
        if (query === 'loading') return { results: [], isLoading: true, error: null };
        if (!query) return { results: [], isLoading: false, error: null };

        return {
            isLoading: false,
            error: null,
            results: [{
                id: '1',
                label: query === 'Logistics' ? 'Logistics Unit' : 'Sarah Miller',
                type: query === 'Logistics' ? 'organization' : 'person',
                subtitle: 'Test Subtitle'
            }]
        };
    }
}));

describe('DiscoveryBar', () => {
    it('renders search input', () => {
        render(<DiscoveryBar onResultSelect={() => { }} viewMode="reporting" onViewModeChange={() => { }} />);
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('expands on focus', () => {
        render(<DiscoveryBar onResultSelect={() => { }} viewMode="reporting" onViewModeChange={() => { }} />);
        const input = screen.getByPlaceholderText(/search/i);
        const container = input.parentElement?.parentElement; // The div wrapping everything

        fireEvent.focus(input);
        expect(container).toHaveClass('w-[500px]');
    });

    it('shows results when typing', async () => {
        render(<DiscoveryBar onResultSelect={() => { }} viewMode="reporting" onViewModeChange={() => { }} />);
        const input = screen.getByPlaceholderText(/search/i);

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Logistics' } });

        expect(screen.getByText('Logistics Unit')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<DiscoveryBar onResultSelect={() => { }} viewMode="reporting" onViewModeChange={() => { }} />);
        const input = screen.getByPlaceholderText(/search/i);

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'loading' } });

        expect(screen.getByText('SEARCHING...')).toBeInTheDocument();
    });

    it('clears query when result selected', () => {
        const onSelect = vi.fn();
        render(<DiscoveryBar onResultSelect={onSelect} viewMode="reporting" onViewModeChange={() => { }} />);
        const input = screen.getByPlaceholderText(/search/i);

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Sarah' } });

        const result = screen.getByText('Sarah Miller');
        fireEvent.click(result);

        expect(onSelect).toHaveBeenCalled();
        expect(input).toHaveValue('');
    });
});
