import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSOMClient, SOMClientOptions } from '@som/api-client';
import { HolonType, EventType } from '@som/shared-types';
import { Task, Project } from '../types/domain';
import { v4 as uuidv4 } from 'uuid';

export function useExternalTaskData(options: SOMClientOptions = { mode: 'mock' }) {
    const queryClient = useQueryClient();
    const client = createSOMClient(
        options.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
        options
    );

    // --- Queries ---

    const tasksQuery = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const response = await client.queryHolons(HolonType.Task);
            if (response.success && response.data) {
                return response.data.map((h: any) => ({
                    id: h.id,
                    title: h.properties.name || 'Untitled Task',
                    description: h.properties.description,
                    state: h.properties.status || 'todo',
                    priority: h.properties.priority || 'medium',
                    ownerId: h.properties.assigneeId || h.properties.ownerId,
                    ownerType: 'Person',
                    projectId: h.properties.projectId,
                    source: 'Manual',
                    dueDate: h.properties.dueDate,
                    createdAt: h.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tags: []
                })) as Task[];
            }
            return [];
        }
    });

    const projectsQuery = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await client.queryHolons(HolonType.Initiative);
            if (response.success && response.data) {
                return response.data.map((h: any) => ({
                    id: h.id,
                    name: h.properties.name || 'Untitled Project',
                    description: h.properties.description,
                    status: h.properties.status || 'planning',
                    progress: h.properties.progress || 0,
                    startDate: h.properties.startDate,
                    targetEndDate: h.properties.targetEndDate,
                    ownerId: h.properties.ownerId,
                    ownerType: 'Organization',
                    tags: []
                })) as Project[];
            }
            return [];
        }
    });

    // --- Mutations ---

    const createTaskMutation = useMutation({
        mutationFn: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
            const taskId = uuidv4();
            await client.submitEvent({
                type: EventType.TaskCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [taskId],
                payload: {
                    taskId,
                    title: task.title || 'Untitled Task',
                    description: task.description || '',
                    assigneeId: task.ownerId,
                    priority: task.priority,
                    dueDate: task.dueDate || new Date().toISOString(), // Fallback
                    projectId: task.projectId
                },
                sourceSystem: 'som-task-mgr'
            });
            return taskId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const updateTaskStatusMutation = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string; status: Task['state'] }) => {
            let eventType = EventType.TaskStarted; // Default to started if unknown, or handle appropriately
            if (status === 'in-progress') eventType = EventType.TaskStarted;
            else if (status === 'done') eventType = EventType.TaskCompleted;
            else if (status === 'blocked') eventType = EventType.TaskBlocked;
            else if (status === 'cancelled') eventType = EventType.TaskCancelled;
            else if (status === 'todo') {
                // No event for resetting to todo in current schema? 
                // Maybe just return? Or log?
                return;
            }

            await client.submitEvent({
                type: eventType,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [taskId],
                payload: {
                    taskId,
                    status, // Extra properties allowed by BasePayload
                    updatedAt: new Date().toISOString()
                },
                sourceSystem: 'som-task-mgr'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    return {
        tasks: tasksQuery.data || [],
        projects: projectsQuery.data || [],
        isLoading: tasksQuery.isLoading || projectsQuery.isLoading,
        error: tasksQuery.error || projectsQuery.error,
        refresh: () => {
            tasksQuery.refetch();
            projectsQuery.refetch();
        },
        createTask: createTaskMutation.mutateAsync,
        updateTaskStatus: (taskId: string, status: Task['state']) => updateTaskStatusMutation.mutateAsync({ taskId, status }),

        isCreating: createTaskMutation.isPending,
        isUpdating: updateTaskStatusMutation.isPending
    };
}
