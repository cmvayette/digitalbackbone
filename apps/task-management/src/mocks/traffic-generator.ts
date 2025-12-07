// This script generates mock events to simulate a busy task environment

export interface MockTask {
    id: string;
    title: string;
    assigneeId: string; // Position ID
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate: string;
    source: string;
    status: 'pending' | 'completed';
}

const MOCK_TITLES = [
    "Review Daily SitRep",
    "Approve Leave Request #402",
    "Update Logistics Forecast",
    "Prepare Briefing for Commander",
    "Verify Inventory Audit",
    "Sign off on Safety Report"
];

const MOCK_POSITIONS = ["pos-1", "pos-2", "pos-3", "pos-4"];

export const generateMockTasks = (count: number = 10): MockTask[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `task-${Date.now()}-${i}`,
        title: MOCK_TITLES[Math.floor(Math.random() * MOCK_TITLES.length)],
        assigneeId: MOCK_POSITIONS[Math.floor(Math.random() * MOCK_POSITIONS.length)],
        priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        dueDate: new Date(Date.now() + Math.random() * 86400000 * 5).toISOString(),
        source: Math.random() > 0.5 ? "Policy Obligation" : "Standard Process",
        status: 'pending'
    }));
};
