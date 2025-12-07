import { HolonType } from '@som/shared-types';
export const generateTaskHistory = (days = 30) => {
    const history = [];
    const today = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Random fluctuation between 5 and 20 tasks per day
        const count = Math.floor(Math.random() * 15) + 5;
        history.push({
            date: date.toISOString().split('T')[0],
            count: count
        });
    }
    return history;
};
export const MOCK_OBJECTIVES = [
    {
        id: "obj-1",
        type: HolonType.Objective,
        createdAt: new Date(),
        createdBy: 'seed',
        status: 'active',
        sourceDocuments: [],
        properties: {
            statement: "Achieve Operational Readiness for Q4",
            description: "Main effort for Q4",
            level: 'operational',
            timeHorizon: new Date('2025-12-31'),
            status: 'active'
        }
    },
    {
        id: "obj-2",
        type: HolonType.Objective,
        createdAt: new Date(),
        createdBy: 'seed',
        status: 'active',
        sourceDocuments: [],
        properties: {
            statement: "Modernize Digital Backbone Infrastructure",
            description: "Tech refresh",
            level: 'strategic',
            timeHorizon: new Date('2026-06-30'),
            status: 'active'
        }
    },
    {
        id: "obj-3",
        type: HolonType.Objective,
        createdAt: new Date(),
        createdBy: 'seed',
        status: 'active',
        sourceDocuments: [],
        properties: {
            statement: "Ensure Personnel Compliance",
            description: "Training compliance",
            level: 'tactical',
            timeHorizon: new Date('2025-01-01'),
            status: 'active'
        }
    }
];
