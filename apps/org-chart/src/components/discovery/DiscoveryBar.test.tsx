import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DiscoveryBar } from './DiscoveryBar';

// Mock useSearch to return predictable results
// We can't easily mock the hook implementation inside the component test file without more setup,
// so we'll rely on the actual hook logic with mock data, assuming the hook is pure.
// Alternatively, we can mock the module. Let's try mocking the module.

vi.mock('../../hooks/useSearch', () => ({
    useSearch: (nodes: any[], query: string) => {
        if (!query) return [];
        return nodes
            .filter(n => n.data.label.toLowerCase().includes(query.toLowerCase()))
            .map(n => ({ id: n.id, label: n.data.label, type: n.type, subtitle: 'Test Subtitle', node: n }));
    }
}));

const mockNodes = [
    { id: '1', type: 'organization', data: { label: 'Logistics Unit', properties: {} } },
    { id: '2', type: 'person', data: { label: 'Sarah Miller', properties: {} } },
] as any[];

describe('DiscoveryBar', () => {
    it('renders search input', () => {
        render(<DiscoveryBar nodes={mockNodes} onResultSelect={() => { }} />);
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('expands on focus', () => {
        render(<DiscoveryBar nodes={mockNodes} onResultSelect={() => { }} />);
        const input = screen.getByPlaceholderText(/search/i);
        const container = input.parentElement?.parentElement; // The div wrapping everything

        fireEvent.focus(input);
        expect(container).toHaveClass('w-[500px]'); // Check expansion class
    });

    it('shows results when typing', async () => {
        render(<DiscoveryBar nodes={mockNodes} onResultSelect={() => { }} />);
        const input = screen.getByPlaceholderText(/search/i);

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Logistics' } });

        // Wait for results to appear
        expect(screen.getByText('Logistics Unit')).toBeInTheDocument();
    });

    it('clears query when result selected', () => {
        const onSelect = vi.fn();
        render(<DiscoveryBar nodes={mockNodes} onResultSelect={onSelect} />);
        const input = screen.getByPlaceholderText(/search/i);

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Sarah' } });

        const result = screen.getByText('Sarah Miller');
        fireEvent.click(result);

        expect(onSelect).toHaveBeenCalled();
        expect(input).toHaveValue('');
    });
});
