import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectList } from './ProjectList';
import { useTaskStore } from '../store/taskStore';
import React from 'react';

describe('ProjectList', () => {
    beforeEach(() => {
        useTaskStore.setState({
            projects: [
                {
                    id: 'p1',
                    name: 'Alpha Project',
                    description: 'Test Description',
                    status: 'active',
                    ownerId: 'org-1',
                    ownerType: 'Organization',
                    startDate: '2023-01-01',
                    targetEndDate: '2023-12-31',
                    progress: 50,
                    tags: []
                }
            ],
            tasks: []
        });
    });

    it('renders project cards', () => {
        render(<ProjectList />);
        expect(screen.getByText('Alpha Project')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
    });
});
