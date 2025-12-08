import { render, screen, fireEvent } from '@testing-library/react';
import { OwnerPicker } from './OwnerPicker';
import { describe, it, expect, vi } from 'vitest';

describe('OwnerPicker', () => {
    it('renders positions and agents from mock data', () => {
        // org-structure.json has Command Duty Officer
        // mock-policy.json has Logistics Bot
        render(<OwnerPicker value="" onChange={() => { }} onClose={() => { }} />);

        expect(screen.getByText('Command Duty Officer')).toBeDefined();
        expect(screen.getByText('Logistics Bot')).toBeDefined();
        expect(screen.getByText('Positions')).toBeDefined();
        expect(screen.getByText('Agents')).toBeDefined();
    });

    it('filters options based on search input', () => {
        render(<OwnerPicker value="" onChange={() => { }} onClose={() => { }} />);

        const input = screen.getByPlaceholderText('Search owners...');
        fireEvent.change(input, { target: { value: 'Logistics' } });

        expect(screen.getByText('Logistics Bot')).toBeDefined();
        expect(screen.queryByText('Command Duty Officer')).toBeNull();
    });

    it('calls onChange when an option is selected', () => {
        const handleChange = vi.fn();
        render(<OwnerPicker value="" onChange={handleChange} onClose={() => { }} />);

        fireEvent.click(screen.getByText('Logistics Bot'));
        expect(handleChange).toHaveBeenCalledWith('agent-logistics');
    });
});
