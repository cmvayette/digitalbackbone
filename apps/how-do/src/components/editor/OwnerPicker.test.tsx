import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OwnerPicker } from './OwnerPicker';

// Mock api-client hook
const mockGetCandidates = vi.fn();
vi.mock('@som/api-client', () => ({
    useExternalOrgData: () => ({
        getCandidates: mockGetCandidates,
        isLoading: false
    })
}));

describe('OwnerPicker', () => {
    it('renders correctly and focuses input', () => {
        mockGetCandidates.mockReturnValue([]);
        render(<OwnerPicker value="" onChange={() => { }} onClose={() => { }} />);
        expect(screen.getByPlaceholderText('Search...')).toHaveFocus();
    });

    it('filters by tab', () => {
        mockGetCandidates.mockReturnValue([
            { id: 'p1', name: 'John', type: 'Person', subtitle: 'Engineer' },
            { id: 'a1', name: 'OptimizerBot', type: 'Agent', subtitle: 'AI' }
        ]);

        render(<OwnerPicker value="" onChange={() => { }} onClose={() => { }} />);

        // Default tab is Staff
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.queryByText('OptimizerBot')).not.toBeInTheDocument();

        // Switch to Agents
        fireEvent.click(screen.getByText('Agents'));
        expect(screen.getByText('OptimizerBot')).toBeInTheDocument();
        expect(screen.queryByText('John')).not.toBeInTheDocument();
    });

    it('calls onChange when selecting', () => {
        mockGetCandidates.mockReturnValue([
            { id: 'p1', name: 'John', type: 'Person' }
        ]);
        const onChange = vi.fn();
        const onClose = vi.fn();

        render(<OwnerPicker value="" onChange={onChange} onClose={onClose} />);
        fireEvent.click(screen.getByText('John'));

        expect(onChange).toHaveBeenCalledWith('p1');
        expect(onClose).toHaveBeenCalled();
    });
});
