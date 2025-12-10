import { useQuery } from '@tanstack/react-query';
import { createSOMClient } from '@som/api-client';
import { Holon, HolonType } from '@som/shared-types';

const client = createSOMClient();

export interface Task extends Holon {
    properties: {
        name: string;
        description: string;
        status: 'todo' | 'in-progress' | 'review' | 'done';
        priority: 'low' | 'medium' | 'high' | 'critical';
        dueDate: string;
        assigneeId?: string;
    }
}

export interface Initiative extends Holon {
    properties: {
        name: string;
        description: string;
        status: string;
        progress: number;
        startDate: string;
        targetEndDate: string;
    }
}

export function useExternalTaskData(_options: { mode: 'mock' | 'real' } = { mode: 'mock' }) {
    // Queries
    const tasksQuery = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const response = await client.queryHolons(HolonType.Task);
            if (!response.success || !response.data) throw new Error('Failed to fetch tasks');
            return response.data as Task[];
        }
    });

    const projectsQuery = useQuery({
        queryKey: ['initiatives'],
        queryFn: async () => {
            const response = await client.queryHolons(HolonType.Initiative);
            if (!response.success || !response.data) throw new Error('Failed to fetch initiatives');
            return response.data as Initiative[];
        }
    });

    return {
        tasks: tasksQuery.data || [],
        projects: projectsQuery.data || [],
        isLoading: tasksQuery.isLoading || projectsQuery.isLoading,
        error: tasksQuery.error || projectsQuery.error,
        refetch: () => {
            tasksQuery.refetch();
            projectsQuery.refetch();
        }
    };
}
