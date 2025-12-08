import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
    const mockPath = [
        { id: '1', label: 'Root' },
        { id: '2', label: 'Division' },
        { id: '3', label: 'Unit' },
    ];

    it('renders root button even if path has only root', () => {
        render(<Breadcrumb path={[{ id: '1', label: 'Root' }]} onNavigate={() => { }} />);
        expect(screen.getByTitle('Go to Root')).toBeInTheDocument();
    });

    it('renders breadcrumb items correctly', () => {
        render(<Breadcrumb path={mockPath} onNavigate={() => { }} />);

        // Should render Division and Unit (Root is skipped based on logic in component: path.slice(1))
        expect(screen.getByText('Division')).toBeInTheDocument();
        expect(screen.getByText('Unit')).toBeInTheDocument();
        expect(screen.queryByText('Root')).not.toBeInTheDocument();
    });

    it('calls onNavigate when an item is clicked', () => {
        const handleNavigate = vi.fn();
        render(<Breadcrumb path={mockPath} onNavigate={handleNavigate} />);

        const divisionButton = screen.getByText('Division');
        fireEvent.click(divisionButton);

        expect(handleNavigate).toHaveBeenCalledWith('2');
    });

    it('disables the last item', () => {
        const handleNavigate = vi.fn();
        render(<Breadcrumb path={mockPath} onNavigate={handleNavigate} />);

        const unitButton = screen.getByText('Unit');
        fireEvent.click(unitButton);

        expect(handleNavigate).not.toHaveBeenCalled();
        expect(unitButton).toBeDisabled();
        expect(unitButton).toHaveClass('font-bold');
    });
});
