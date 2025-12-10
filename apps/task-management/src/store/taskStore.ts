import { create } from 'zustand';
import { Project, Task, Milestone } from '../types/domain';
import { v4 as uuidv4 } from 'uuid';

interface TaskState {
    projects: Project[];
    tasks: Task[];
    milestones: Milestone[];

    // Actions
    loadData: () => Promise<void>;
    addProject: (project: Omit<Project, 'id' | 'progress'>) => void;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTaskStatus: (taskId: string, status: Task['state']) => void;

    // Computed/Selectors (can be derived in components, but helpers here useful)
    getTasksByProject: (projectId: string) => Task[];
    getTasksByOwner: (ownerId: string) => Task[];
    getTasksForMember: (personId: string, positionIds: string[]) => Task[];
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
        state: 'done',
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
        state: 'in-progress',
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
        state: 'todo',
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
    projects: [],
    tasks: [],
    milestones: [],

    loadData: async () => {
        try {
            const { createSOMClient } = await import('@som/api-client');
            const client = createSOMClient();

            // Using string literals matching the enum to avoid complex dynamic imports
            const [tasksRes, initiativesRes] = await Promise.all([
                client.queryHolons('Task' as any),
                client.queryHolons('Initiative' as any)
            ]);

            if (tasksRes.success && tasksRes.data) {
                const tasks = tasksRes.data.map((h: any) => ({
                    id: h.id,
                    ...h.properties,
                    // Ensure defaults if missing
                    state: h.properties.state || 'todo',
                    priority: h.properties.priority || 'medium',
                    ownerId: h.properties.assigneeId || h.properties.ownerId, // Map assignee to owner for Task
                    projectId: h.subjects?.[1] || h.properties.projectId // Map subject linkage to Project ID
                })) as Task[];
                set({ tasks });
            }

            if (initiativesRes.success && initiativesRes.data) {
                const projects = initiativesRes.data.map((h: any) => ({
                    id: h.id,
                    ...h.properties,
                    status: h.properties.status || 'planning',
                    progress: h.properties.progress || 0,
                    ownerType: 'Organization' // Default or infer
                })) as Project[];
                set({ projects });
            }
        } catch (error) {
            console.error("Failed to load task data", error);
            // Fallback for demo if API fails
            set({ projects: generateMockProjects(), tasks: generateMockTasks() });
        }
    },

    addProject: async (project) => {
        const tempId = `proj-${Date.now()}`;
        set((state) => ({
            projects: [...state.projects, { ...project, id: tempId, progress: 0 }]
        }));

        try {
            const { createSOMClient } = await import('@som/api-client');
            const { EventType } = await import('@som/shared-types');
            const { v4: uuidv4 } = await import('uuid');

            const client = createSOMClient();
            const initiativeId = uuidv4();

            await client.submitEvent({
                type: EventType.InitiativeCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [initiativeId],
                payload: {
                    initiativeId,
                    name: project.name,
                    description: project.description,
                    ownerId: project.ownerId,
                    startDate: project.startDate,
                    targetEndDate: project.targetEndDate,
                    status: 'planning'
                },
                sourceSystem: 'som-task-management'
            });
            console.log(`[TaskStore] Created Initiative ${initiativeId}`);
        } catch (error) {
            console.error("Failed to create initiative", error);
        }
    },

    addTask: async (task) => {
        const tempId = `t-${Date.now()}`;
        const newTask: Task = {
            ...task,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        try {
            const { createSOMClient } = await import('@som/api-client');
            const { EventType } = await import('@som/shared-types');
            const { v4: uuidv4 } = await import('uuid');

            const client = createSOMClient();
            const taskId = uuidv4();
            const projectId = task.projectId || 'unknown'; // Should handle missing project

            await client.submitEvent({
                type: EventType.TaskCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [taskId, projectId],
                payload: {
                    taskId,
                    title: task.title,
                    description: task.description || '',
                    assigneeId: task.ownerId, // Mapping owner to assignee
                    priority: task.priority,
                    dueDate: task.dueDate || ''
                },
                sourceSystem: 'som-task-management'
            });
            console.log(`[TaskStore] Created Task ${taskId}`);
        } catch (error) {
            console.error("Failed to create task", error);
        }
    },

    updateTaskStatus: async (taskId, status) => {
        set((state) => ({
            tasks: state.tasks.map(t =>
                t.id === taskId ? { ...t, state: status, updatedAt: new Date().toISOString() } : t
            )
        }));

        try {
            const { createSOMClient } = await import('@som/api-client');
            const { EventType } = await import('@som/shared-types');
            const client = createSOMClient();

            let eventType: any;
            let payload: any = {};

            switch (status) {
                case 'in-progress':
                    eventType = EventType.TaskStarted;
                    payload = { startTime: new Date().toISOString() };
                    break;
                case 'done':
                    eventType = EventType.TaskCompleted;
                    payload = { outcome: 'Completed via UI' };
                    break;
                case 'blocked':
                    eventType = EventType.TaskBlocked;
                    payload = { reason: 'Blocked in UI' };
                    break;
                case 'cancelled':
                    eventType = EventType.TaskCancelled;
                    payload = { reason: 'Cancelled in UI' };
                    break;
                default:
                    return; // No event for todo/reset yet
            }

            await client.submitEvent({
                type: eventType,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [taskId], // We should use real UUID if available, need mapping if using temp IDs
                payload: payload,
                sourceSystem: 'som-task-management'
            });

        } catch (error) {
            console.error("Failed to update task status", error);
        }
    },

    getTasksByProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
    getTasksByOwner: (ownerId) => get().tasks.filter(t => t.ownerId === ownerId),
    getTasksForMember: (personId, positionIds) => get().tasks.filter(t =>
        (t.ownerType === 'Person' && t.ownerId === personId) ||
        (t.ownerType === 'Position' && positionIds.includes(t.ownerId))
    )
}));
