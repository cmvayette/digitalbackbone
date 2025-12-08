import { create } from 'zustand';
import { Project, Task, Milestone } from '../types/domain';
import { v4 as uuidv4 } from 'uuid';

interface TaskState {
    projects: Project[];
    tasks: Task[];
    milestones: Milestone[];

    // Actions
    addProject: (project: Omit<Project, 'id' | 'progress'>) => void;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTaskStatus: (taskId: string, status: Task['status']) => void;

    // Computed/Selectors (can be derived in components, but helpers here useful)
    getTasksByProject: (projectId: string) => Task[];
    getTasksByOwner: (ownerId: string) => Task[];
}

// Mock Data Generators
const generateMockProjects = (): Project[] => [
    {
        id: 'proj-1',
        name: 'Q3 Recruitment Drive',
        description: 'Hire 5 new engineers and 2 designers.',
        status: 'active',
        ownerId: 'org-hr',
        ownerType: 'Organization',
        startDate: '2023-07-01',
        targetEndDate: '2023-09-30',
        progress: 45,
        tags: ['HR', 'Growth']
    },
    {
        id: 'proj-2',
        name: 'Cloud Migration',
        description: 'Move legacy services to AWS.',
        status: 'planning',
        ownerId: 'org-eng',
        ownerType: 'Organization',
        startDate: '2023-08-15',
        targetEndDate: '2023-12-31',
        progress: 10,
        tags: ['Infra', 'Engineering']
    }
];

const generateMockTasks = (): Task[] => [
    {
        id: 't-1',
        title: 'Draft Job Descriptions',
        status: 'done',
        priority: 'high',
        ownerId: 'pos-hr-mgr',
        ownerType: 'Position',
        projectId: 'proj-1',
        source: 'Manual',
        createdAt: '2023-07-01',
        updatedAt: '2023-07-02',
        tags: ['hiring']
    },
    {
        id: 't-2',
        title: 'Screen Candidates',
        status: 'in-progress',
        priority: 'high',
        ownerId: 'pos-hr-recruiter',
        ownerType: 'Position',
        projectId: 'proj-1',
        source: 'Manual',
        createdAt: '2023-07-05',
        updatedAt: '2023-07-10',
        tags: ['hiring']
    },
    {
        id: 't-3',
        title: 'Review Legacy Codebase',
        status: 'todo',
        priority: 'medium',
        ownerId: 'pos-eng-lead',
        ownerType: 'Position',
        projectId: 'proj-2',
        source: 'OKR',
        createdAt: '2023-08-01',
        updatedAt: '2023-08-01',
        tags: ['discovery']
    }
];

export const useTaskStore = create<TaskState>((set, get) => ({
    projects: generateMockProjects(),
    tasks: generateMockTasks(),
    milestones: [],

    addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, id: uuidv4(), progress: 0 }]
    })),

    addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
            ...task,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }]
    })),

    updateTaskStatus: (taskId, status) => set((state) => ({
        tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
        )
    })),

    getTasksByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
    getTasksByOwner: (ownerId) => get().tasks.filter(t => t.ownerId === ownerId)
}));
