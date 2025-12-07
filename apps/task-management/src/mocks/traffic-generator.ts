export interface Task {
    id: string;
    title: string;
    type: 'ProcessStep' | 'Obligation';
    source: string; // e.g. "Instruction 101" or "Daily Standup Process"
    dueDate: Date;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'Completed';
    assignedTo: string; // Position ID
}

export function generateTasks(): Task[] {
    const today = new Date();

    return [
        {
            id: 'task_001',
            title: 'Submit Weekly Sitrep',
            type: 'ProcessStep',
            source: 'Weekly Reporting Flow',
            dueDate: new Date(today.getTime() + 2 * 60 * 60 * 1000), // +2 hours
            priority: 'High',
            status: 'Pending',
            assignedTo: 'pos_dh_ops'
        },
        {
            id: 'task_002',
            title: 'Verify Subordinate GTCC Status',
            type: 'Obligation',
            source: 'Instruction 101: Initial Onboarding',
            dueDate: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday (Overdue)
            priority: 'Medium',
            status: 'Pending',
            assignedTo: 'pos_dh_ops'
        },
        {
            id: 'task_003',
            title: 'Command Duty Officer Handover',
            type: 'ProcessStep',
            source: 'CDO Watchbill',
            dueDate: new Date(today.getTime() + 4 * 60 * 60 * 1000),
            priority: 'Medium',
            status: 'Pending',
            assignedTo: 'pos_dh_ops'
        },
        {
            id: 'task_004',
            title: 'Approve Leave Request #492',
            type: 'ProcessStep',
            source: 'Leave & Liberty',
            dueDate: new Date(today.getTime() + 48 * 60 * 60 * 1000),
            priority: 'Low',
            status: 'Pending',
            assignedTo: 'pos_dh_ops'
        },
        {
            id: 'task_005',
            title: 'Quarterly Cyber Awareness',
            type: 'Obligation',
            source: 'DoD Cyber Policy',
            dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
            priority: 'Medium',
            status: 'Completed', // Historical
            assignedTo: 'pos_dh_ops'
        }
    ];
}
