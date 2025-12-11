import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditStepModal } from './EditStepModal';
import { ProcessStep } from '../../types/process';

describe('EditStepModal', () => {
    const mockStep: ProcessStep = {
        id: 'step-1',
        title: 'Test Step',
        description: 'Test Desc',
        owner: 'user-1',
        obligations: []
    };

    const mockSave = vi.fn();
    const mockCancel = vi.fn();
    const mockDelete = vi.fn();

    it('renders basic fields', () => {
        render(<EditStepModal step={mockStep} onSave={mockSave} onCancel={mockCancel} onDelete={mockDelete} />);

        expect(screen.getByDisplayValue('Test Step')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Desc')).toBeInTheDocument();
    });

    it('allows adding an attachment', () => {
        render(<EditStepModal step={mockStep} onSave={mockSave} onCancel={mockCancel} onDelete={mockDelete} />);

        // Fill attachment form
        const nameInput = screen.getByPlaceholderText('Name (e.g. Template)');
        const urlInput = screen.getByPlaceholderText('URL');

        fireEvent.change(nameInput, { target: { value: 'My Doc' } });
        fireEvent.change(urlInput, { target: { value: 'http://doc.com' } });

        // Click add button
        const addBtns = screen.getAllByRole('button');
        const plusBtn = addBtns.find(b => b.innerHTML.includes('lucide-plus')); // Rough way to find icon button if no aria-label
        // Better: use aria-label if I added it, or test ID. 
        // Or finding the button near the inputs.
        // Let's assume the button next to URL input is the one.
        fireEvent.click(urlInput.nextElementSibling!);

        expect(screen.getByText('My Doc')).toBeInTheDocument();
        expect(screen.getByText('http://doc.com')).toBeInTheDocument();

        // Save
        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
            attachments: [{ name: 'My Doc', url: 'http://doc.com' }]
        }));
    });

    it('allows toggling decision mode and adding paths', () => {
        render(<EditStepModal step={mockStep} onSave={mockSave} onCancel={mockCancel} onDelete={mockDelete} />);

        // Find Checkbox
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle);

        // Inputs should appear
        const labelInput = screen.getByPlaceholderText('e.g. Approved?');
        fireEvent.change(labelInput, { target: { value: 'Is Valid?' } });

        // Add a path
        const pathInput = screen.getByPlaceholderText('Add path (e.g. Rework)');
        fireEvent.change(pathInput, { target: { value: 'Maybe' } });
        fireEvent.keyDown(pathInput, { key: 'Enter', code: 'Enter' });

        expect(screen.getByText('Maybe')).toBeInTheDocument();

        // Save
        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
            decision: {
                label: 'Is Valid?',
                paths: ['Yes', 'No', 'Maybe'] // Default Yes/No + new one
            }
        }));
    });
});
