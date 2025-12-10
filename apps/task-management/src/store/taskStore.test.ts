import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from './taskStore';

describe('useTaskStore', () => {
    beforeEach(() => {
        useTaskStore.setState({
            tasks: [],
            projects: [],
            milestones: []
        });
        vi.clearAllMocks();
    });

    it('should initialize with empty state', () => {
        const state = useTaskStore.getState();
        expect(state.tasks).toEqual([]);
        expect(state.projects).toEqual([]);
    });

    it('should sync data correctly', () => {
        const mockTasks: any[] = [{ id: 't1', title: 'Test Task' }];
        const mockProjects: any[] = [{ id: 'p1', name: 'Test Project' }];

        useTaskStore.getState().syncData(mockTasks, mockProjects);

        const state = useTaskStore.getState();
        expect(state.tasks).toEqual(mockTasks);
        expect(state.projects).toEqual(mockProjects);
    });

    it('should add a project optimistically', async () => {
        useTaskStore.getState().addProject({
            name: 'New Project',
            description: 'Desc',
            status: 'planning',
            ownerId: 'org-1',
            ownerType: 'Organization',
            startDate: '2023-01-01',
            targetEndDate: '2023-02-01',
            tags: []
        });

        const state = useTaskStore.getState();
        expect(state.projects).toHaveLength(1);
        expect(state.projects[0].name).toBe('New Project');
        // ID should be temp
        expect(state.projects[0].id).toMatch(/^proj-/);
    });

    // We mock the dynamic import of api-client for actions validation if we want deeper tests,
    // but for now verifying state updates is sufficient for the "Dumb Store" pattern.
});
