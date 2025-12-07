import { HolonType } from '@som/shared-types';
export const generateMockTasks = (count = 10) => {
    const MOCK_TITLES = [
        "Review Daily SitRep",
        "Approve Leave Request #402",
        "Update Logistics Forecast",
        "Prepare Briefing for Commander",
        "Verify Inventory Audit",
        "Sign off on Safety Report"
    ];
    const MOCK_POSITIONS = ["pos-1", "pos-2", "pos-3", "pos-4"];
    return Array.from({ length: count }).map((_, i) => ({
        id: `task-${Date.now()}-${i}`,
        type: HolonType.Task,
        createdAt: new Date(),
        createdBy: 'system-seed',
        status: 'active',
        sourceDocuments: [],
        properties: {
            title: MOCK_TITLES[Math.floor(Math.random() * MOCK_TITLES.length)],
            description: "Auto-generated task",
            assigneeId: MOCK_POSITIONS[Math.floor(Math.random() * MOCK_POSITIONS.length)],
            priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
            dueDate: new Date(Date.now() + Math.random() * 86400000 * 5),
            type: Math.random() > 0.5 ? "Policy Obligation" : "Standard Process",
            status: 'created'
        }
    }));
};
