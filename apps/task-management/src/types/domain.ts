import { OwnerRef } from '@som/shared-types';
// Note: adjusting import based on assumptions, if @som/shared-types isn't set up as an alias yet, 
// I might need to define OwnerRef locally or import relatively. 
// For safety in this MVP step, I will define a local compatible interface or use 'any' if strictly needed, 
// but sticking to the plan's structure.

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'Manual' | 'Governance' | 'HowDo' | 'OKR' | 'External';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;

    // Ownership & Assignment
    ownerId: string; // The person/position responsible for doing it
    ownerType: 'Person' | 'Position';

    // Hierarchy
    projectId?: string;
    parentId?: string; // For sub-tasks

    // Context
    source: TaskSource;
    sourceReferenceId?: string; // ID of the triggering entity (e.g., Obligation ID)

    // Timeline
    dueDate?: string; // ISO Date
    completedAt?: string; // ISO Date
    createdAt: string;
    updatedAt: string;

    tags: string[];
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;

    // Ownership
    ownerId: string; // Organization or Leader Position
    ownerType: 'Organization' | 'Position';

    // Timeline
    startDate: string;
    targetEndDate: string;
    actualEndDate?: string;

    // Metrics (computed)
    progress: number; // 0-100

    tags: string[];
}

export interface Milestone {
    id: string;
    projectId: string;
    name: string;
    date: string;
    completed: boolean;
}
