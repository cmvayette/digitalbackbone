// Simulates a history of completed tasks to populate performance graphs

export interface HistoricalEvent {
    date: string;
    count: number;
}

export const generateTaskHistory = (days: number = 30): HistoricalEvent[] => {
    const history: HistoricalEvent[] = [];
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
        statement: "Achieve Operational Readiness for Q4",
        progress: 75,
        status: "active"
    },
    {
        id: "obj-2",
        statement: "Modernize Digital Backbone Infrastructure",
        progress: 40,
        status: "active"
    },
    {
        id: "obj-3",
        statement: "Ensure Personnel Compliance",
        progress: 90,
        status: "active"
    }
];
