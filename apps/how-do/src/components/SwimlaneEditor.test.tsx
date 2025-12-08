import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwimlaneEditor } from './SwimlaneEditorComponent';
import { Process } from '../types/process';

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

        expect(screen.getByText(/ID: JIRA-123/)).toBeDefined();
    });

    it('allows assigning a step to an agent', async () => {
        render(<SwimlaneEditor />);

        const editButtons = screen.getAllByRole('button', { name: /Change Owner/i });
        const firstEditBtn = editButtons[0];

        fireEvent.click(firstEditBtn);

        // Now we have the OwnerPicker open
        const agentOption = screen.getByText('Logistics Bot');
        expect(agentOption).toBeDefined();

        fireEvent.click(agentOption);

        // Use a timeout or check if the owner text updated
        // The picker closes on selection, and the badge should filter to the new owner
        // We can check if "Logistics Bot" is visible in the badge
        expect(screen.getByText('Logistics Bot')).toBeDefined();
    });
});
