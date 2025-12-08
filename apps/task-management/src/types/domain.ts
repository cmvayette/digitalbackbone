// Based on Design Spec v1

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'Manual' | 'Governance' | 'HowDo' | 'OKR' | 'WorkPackage' | 'Request' | 'Calendar' | 'External';
export type TaskImpact = 'readiness' | 'admin_load' | 'compliance' | 'risk';

export interface Task {
    id: string;
    title: string;
    description?: string;
    state: TaskStatus; // Spec uses 'state', keeping aligned
    priority: TaskPriority;

    // Ownership & Assignment
    ownerId: string;
    ownerType: 'Person' | 'Position' | 'Organization';

    // Hierarchy
    projectId?: string;
    parentId?: string;

    // Context (The "Why")
    source: TaskSource;
    sourceRefId?: string; // ID of the triggering entity (e.g., Obligation ID)

    // Timeline
    dueDate?: string; // ISO Date
    completedAt?: string; // ISO Date
    createdAt: string;
    updatedAt: string;

    // Metadata
    tags: string[];
    classification?: string; // e.g. "Unclassified", "FOUO"
    impactType?: TaskImpact;
    effortEstimate?: number; // Hours or points
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
