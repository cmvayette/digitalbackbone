import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwimlaneEditor } from './SwimlaneEditorComponent';

// Using actual mock-policy.json content which now includes agents

describe('SwimlaneEditor', () => {
    it('renders native steps correctly', () => {
        render(<SwimlaneEditor />);
        // Check for default native steps
        expect(screen.getByText('Initiate Request')).toBeDefined();
        expect(screen.getByText('Review & Approve')).toBeDefined();
    });

    it('renders semantic proxy steps with badge', () => {
        render(<SwimlaneEditor />);

        // Check for the JIRA step title
        expect(screen.getByText('Provision Hardware')).toBeDefined();

        // Check for the badge text "jira"
        const badge = screen.getByText('jira');
        expect(badge).toBeDefined();
        expect(badge.className).toContain('proxy-badge');

        expect(screen.getByText(/REF: JIRA-123/)).toBeDefined();
    });

    it('allows assigning a step to an agent', async () => {
        render(<SwimlaneEditor />);

        const editButtons = screen.getAllByRole('button', { name: /Edit Owner/i });
        const firstEditBtn = editButtons[0];

        fireEvent.click(firstEditBtn);

        const select = screen.getByRole('combobox');
        expect(select).toBeDefined();

        // "Logistics Bot" is in the real mock-policy.json
        expect(screen.getByText('Logistics Bot')).toBeDefined();
    });
});
