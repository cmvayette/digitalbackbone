import { create } from 'zustand';
import { Project, Task, Milestone } from '../types/domain';
import { v4 as uuidv4 } from 'uuid';

interface TaskState {
    projects: Project[];
    tasks: Task[];
    milestones: Milestone[];

    // Actions
    // Actions
    // syncData: (tasks: Task[], projects: Project[]) => void; // Removed
    addProject: (project: Omit<Project, 'id' | 'progress'>) => void;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTaskStatus: (taskId: string, status: Task['state']) => void;

    // Computed/Selectors
    getTasksByProject: (projectId: string) => Task[];
    getTasksByOwner: (ownerId: string) => Task[];
    getTasksForMember: (personId: string, positionIds: string[]) => Task[];
}

export const useTaskStore = create<TaskState & {
    setTasks: (tasks: Task[]) => void;
    setProjects: (projects: Project[]) => void;
}>((set, get) => ({
    projects: [],
    tasks: [],
    milestones: [],

    // Simplified Actions - Store is now a "Receive Only" cache for the UI
    loadData: async () => { console.warn('loadData is deprecated, use useExternalTaskData'); }, // Deprecated placeholder

    setTasks: (tasks) => set({ tasks }),
    setProjects: (projects) => set({ projects }),

    addProject: (project) => {
        // Optimistic update example, though hook invalidation is preferred
        set((state) => ({ projects: [...state.projects, { ...project, id: `temp-${Date.now()}`, progress: 0 } as Project] }));
    },

    addTask: (task) => {
        // Optimistic
        const newTask: Task = { ...task, id: `temp-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Task;
        set((state) => ({ tasks: [...state.tasks, newTask] }));
    },

    updateTaskStatus: (taskId, status) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, state: status } : t)
        }));
    },

    getTasksByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
    getTasksByOwner: (ownerId) => get().tasks.filter(t => t.ownerId === ownerId),
    getTasksForMember: (personId, positionIds) => get().tasks.filter(t =>
        (t.ownerType === 'Person' && t.ownerId === personId) ||
        (t.ownerType === 'Position' && positionIds.includes(t.ownerId))
    )
}));
