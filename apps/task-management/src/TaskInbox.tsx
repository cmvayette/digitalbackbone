import React, { useState, useEffect } from 'react';
import { generateTasks, Task } from '../mocks/traffic-generator';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    Filter,
    Inbox
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export default function TaskInbox() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'All' | 'ProcessStep' | 'Obligation'>('All');

    useEffect(() => {
        // Load mock traffic
        setTasks(generateTasks());
    }, []);

    const completeTask = (id: string) => {
        setTasks(current => current.map(t =>
            t.id === id ? { ...t, status: 'Completed' } : t
        ));
    };

    const filteredTasks = tasks.filter(t =>
        filter === 'All' ? true : t.type === filter
    ).filter(t => t.status === 'Pending'); // Only showing pending for now

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Sidebar (Simple Filter) */}
            <aside className="w-64 border-r border-slate-700 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-2 py-4 mb-4">
                    <Inbox className="w-6 h-6 text-primary-400" />
                    <h1 className="text-xl font-bold tracking-tight">My Tasks</h1>
                </div>

                <div className="space-y-1">
                    <button
                        onClick={() => setFilter('All')}
                        className={clsx(
                            "w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between",
                            filter === 'All' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
                        )}
                    >
                        All Pending
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                            {tasks.filter(t => t.status === 'Pending').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('ProcessStep')}
                        className={clsx(
                            "w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors",
                            filter === 'ProcessStep' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
                        )}
                    >
                        Process Steps
                    </button>
                    <button
                        onClick={() => setFilter('Obligation')}
                        className={clsx(
                            "w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors",
                            filter === 'Obligation' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
                        )}
                    >
                        Obligations
                    </button>
                </div>
            </aside>

            {/* Main List */}
            <main className="flex-1 overflow-auto bg-slate-900">
                <div className="max-w-4xl mx-auto p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Inbox</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Filter className="w-4 h-4" />
                            <span>Sorted by Priority</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filteredTasks.length === 0 && (
                            <div className="text-center py-20 text-slate-500">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                                <p>All caught up!</p>
                            </div>
                        )}

                        {filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="group flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-all shadow-sm"
                            >
                                {/* Checkbox / Action */}
                                <button
                                    onClick={() => completeTask(task.id)}
                                    className="flex-shrink-0 text-slate-500 hover:text-primary-400 transition-colors"
                                >
                                    <Circle className="w-6 h-6" />
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-slate-100 truncate">{task.title}</h3>
                                        {task.priority === 'High' && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">High</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-400">
                                        <span className={clsx(
                                            "flex items-center gap-1",
                                            task.type === 'Obligation' ? "text-amber-500/80" : "text-blue-400/80"
                                        )}>
                                            {task.type === 'Obligation' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {task.type}
                                        </span>
                                        <span>•</span>
                                        <span className="truncate">{task.source}</span>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex-shrink-0 text-right">
                                    <p className={clsx(
                                        "text-sm font-medium",
                                        task.dueDate < new Date() ? "text-red-400" : "text-slate-400"
                                    )}>
                                        {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
