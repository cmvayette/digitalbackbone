import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PolicyEditor } from './PolicyEditor';
import { usePolicyStore } from '../../store/policyStore';
import React from 'react';

// Mock dependencies
vi.mock('lucide-react', () => ({
    ArrowLeft: () => <span data-testid="icon-back">Back</span>,
    Edit3: () => <span>Edit</span>,
    Save: () => <span>Save</span>,
    Trash2: () => <span>Trash</span>,
    FileText: () => <span>File</span>,
    CheckSquare: () => <span>Obligations</span>,
    Plus: () => <span>Plus</span>
}));

describe('PolicyEditor', () => {
    beforeEach(() => {
        usePolicyStore.setState({
            policies: [],
            currentPolicy: {
                id: 'pol-1',
                title: 'Test Policy',
                documentType: 'Instruction',
                version: '1.0',
                status: 'draft',
                sections: [{ id: 's1', title: 'Sec 1', content: 'Content', order: 1 }],
                obligations: [],
                createdAt: '',
                updatedAt: ''
            }
        });
    });

    it('renders policy title', () => {
        render(<PolicyEditor onBack={() => { }} />);
        expect(screen.getByDisplayValue('Test Policy')).toBeDefined();
    });

    it('switches tabs', () => {
        render(<PolicyEditor onBack={() => { }} />);
        // Default is Document Text
        expect(screen.getByText('Policy Content')).toBeDefined();

        // Switch to Obligations
        fireEvent.click(screen.getByText(/Obligations \(/));
        expect(screen.getByText('Extracted Obligations')).toBeDefined();
    });

    it('opens and closes obligation composer', () => {
        render(<PolicyEditor onBack={() => { }} />);
        fireEvent.click(screen.getByText(/Obligations \(/)); // Switch tab

        fireEvent.click(screen.getByText('Add Obligation'));
        expect(screen.getByText('Requirement Statement')).toBeDefined();

        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Requirement Statement')).toBeNull();
    });
});
