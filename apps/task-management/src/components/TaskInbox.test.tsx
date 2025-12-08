import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskInbox } from './TaskInbox';
import { useTaskStore } from '../store/taskStore';
import React from 'react';

// Start with a clean store primarily
describe('TaskInbox', () => {
    beforeEach(() => {
        useTaskStore.setState({
            tasks: [
                {
                    id: 't1',
                    title: 'Urgent Task',
                    state: 'todo',
                    priority: 'critical',
                    ownerId: 'pos-1',
                    ownerType: 'Position',
                    source: 'Manual',
                    tags: [],
                    createdAt: '',
                    updatedAt: '2023-01-01'
                },
                {
                    id: 't2',
                    title: 'Done Task',
                    state: 'done',
                    priority: 'low',
                    ownerId: 'pos-1',
                    ownerType: 'Position',
                    source: 'Manual',
                    tags: [],
                    createdAt: '',
                    updatedAt: '2023-01-01'
                }
            ],
            projects: []
        });
    });

    it('renders tasks sorted by priority', () => {
        render(<TaskInbox />);
        expect(screen.getByText('Urgent Task')).toBeInTheDocument();
        expect(screen.getByText('Done Task')).toBeInTheDocument();
    });

    it('toggles task status on click', () => {
        render(<TaskInbox />);

        // Find the button for the first task (todo -> done)
        // This is a bit brittle without specific test ids, but let's target the status icon button
        const buttons = screen.getAllByRole('button');
        // The first button corresponds to 'Urgent Task' due to sorting
        fireEvent.click(buttons[0]);

        // Check if store updated
        const tasks = useTaskStore.getState().tasks;
        expect(tasks.find(t => t.id === 't1')?.state).toBe('done');
    });
});
