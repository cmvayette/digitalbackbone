import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { generateTaskHistory, MOCK_OBJECTIVES } from '../scripts/seed-history';
import type { HistoricalEvent } from '../scripts/seed-history';

export const Dashboard: React.FC = () => {
    const [history, setHistory] = useState<HistoricalEvent[]>([]);

    useEffect(() => {
        // "Seed" the history on mount
        const data = generateTaskHistory(20);
        setHistory(data);
    }, []);

    const maxVal = Math.max(...history.map(h => h.count), 1);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Strategy & Insights</h1>
                <p className="dashboard-subtitle">Commander's Intent vs. Operational Performance</p>
            </div>

            <div className="grid-container">
                <div className="card">
                    <h2 className="card-title">Task Velocity (Last 20 Days)</h2>
                    <div className="chart-area">
                        {history.map((day, i) => (
                            <div
                                key={i}
                                className="bar"
                                style={{ height: `${(day.count / maxVal) * 100}%` }}
                            >
                                <div className="bar-tooltip">
                                    {day.date}: {day.count} tasks
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2 className="card-title">Strategic Objectives</h2>
                    <div className="obj-list">
                        {MOCK_OBJECTIVES.map(obj => (
                            <div key={obj.id} className="obj-item">
                                <div className="obj-statement">{obj.statement}</div>
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${obj.progress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-text">{obj.progress}% Complete</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
