import { create } from 'zustand';
import { Project, Task, Milestone } from '../types/domain';
import { v4 as uuidv4 } from 'uuid';

interface TaskState {
    projects: Project[];
    tasks: Task[];
    milestones: Milestone[];

    // Actions
    // Actions
    syncData: (tasks: Task[], projects: Project[]) => void;
    addProject: (project: Omit<Project, 'id' | 'progress'>) => void;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTaskStatus: (taskId: string, status: Task['state']) => void;

    // Computed/Selectors
    getTasksByProject: (projectId: string) => Task[];
    getTasksByOwner: (ownerId: string) => Task[];
    getTasksForMember: (personId: string, positionIds: string[]) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
    projects: [],
    tasks: [],
    milestones: [],

    syncData: (tasks, projects) => set({ tasks, projects }),

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
