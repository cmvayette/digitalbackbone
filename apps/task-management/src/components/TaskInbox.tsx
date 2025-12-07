import React, { useState } from 'react';
import './TaskInbox.css';
import { generateMockTasks } from '../mocks/traffic-generator';
import type { Task } from '@som/shared-types';

export const TaskInbox: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);

    const handleGenerateTraffic = () => {
        const newTasks = generateMockTasks(3);
        console.log('Emitting TaskCreated Events:', newTasks.map(t => ({
            type: 'TaskCreated',
            payload: {
                taskId: t.id,
                ...t.properties
            }
        })));
        setTasks(prev => [...newTasks, ...prev]);
    };

    const handleComplete = (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? {
                ...t,
                properties: { ...t.properties, status: 'completed' }
            } : t
        ));

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            console.log('Emitting TaskCompleted Event:', {
                type: 'TaskCompleted',
                payload: {
                    taskId: task.id,
                    completionTime: new Date().toISOString(),
                    completedBy: 'current-user-id'
                }
            });
        }
    };

    const activeTasks = tasks.filter(t => t.properties.status !== 'completed');
    const completedTasks = tasks.filter(t => t.properties.status === 'completed');

    return (
        <div className="task-inbox">
            <div className="inbox-header">
                <div className="title-area">
                    <h1>Unified Inbox</h1>
                    <div className="sub-title">Manage your obligations and process steps</div>
                </div>

                <div className="simulator-controls">
                    <span>Dev Tools:</span>
                    <button className="sim-btn" onClick={handleGenerateTraffic}>
                        + Generate Incoming Tasks
                    </button>
                </div>
            </div>

            <div className="task-list">
                {activeTasks.length === 0 && completedTasks.length === 0 && (
                    <div className="empty-state">
                        Inbox Zero (or disconnected). Try generating traffic!
                    </div>
                )}

                {activeTasks.map(task => (
                    <div key={task.id} className="task-card">
                        <div className="task-info">
                            <div className="task-title">{task.properties.title}</div>
                            <div className="task-meta">
                                <span className={`priority-badge priority-${task.properties.priority}`}>
                                    {task.properties.priority} Priority
                                </span>
                                <span>Due: {new Date(task.properties.dueDate).toLocaleDateString()}</span>
                                <span>Source: {task.properties.type}</span>
                            </div>
                        </div>
                        <div className="task-actions">
                            <button
                                className="complete-btn"
                                onClick={() => handleComplete(task.id)}
                            >
                                Mark Complete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
