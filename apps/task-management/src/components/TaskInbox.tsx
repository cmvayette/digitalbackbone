import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { Task } from '../types/domain';

const StatusIcon = ({ status }: { status: Task['status'] }) => {
    switch (status) {
        case 'done': return <CheckCircle className="text-green-500" size={20} />;
        case 'in-progress': return <Circle className="text-blue-500 fill-blue-500/20" size={20} />;
        case 'blocked': return <AlertCircle className="text-red-500" size={20} />;
        default: return <Circle className="text-slate-500" size={20} />;
    }
};

export const TaskInbox: React.FC = () => {
    const { tasks, updateTaskStatus } = useTaskStore();

    // Grouping could happen here, for MVP just a flat sorted list
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.priority === 'critical' && b.priority !== 'critical') return -1;
        if (a.priority === 'high' && b.priority === 'low') return -1;
        return 0;
    });

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-950 text-slate-200">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Tasks</h1>
                    <p className="text-slate-400 text-sm">Action items assigned to your positions.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-400">
                        {tasks.filter(t => t.status === 'done').length} / {tasks.length} Completed
                    </span>
                </div>
            </header>

            <div className="space-y-3">
                {sortedTasks.map(task => (
                    <div
                        key={task.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:bg-slate-900 ${task.status === 'done' ? 'bg-slate-900/30 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700 shadow-sm'
                            }`}
                    >
                        <button
                            onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                            className="shrink-0 hover:scale-110 transition-transform"
                        >
                            <StatusIcon status={task.status} />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-base truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span className={`uppercase font-bold tracking-wider ${task.priority === 'critical' ? 'text-red-400' :
                                        task.priority === 'high' ? 'text-amber-400' : 'text-slate-500'
                                    }`}>
                                    {task.priority}
                                </span>
                                <span>•</span>
                                <span>{task.source}</span>
                                {task.dueDate && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {task.dueDate}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
                                {task.ownerType === 'Position' ? 'Pos' : 'Pers'}
                            </span>
                        </div>
                    </div>
                ))}

                {sortedTasks.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        <p>No tasks found. You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
