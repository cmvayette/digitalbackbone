import React, { useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { User, Briefcase, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Task } from '../types/domain';
import { TaskDetailPanel } from './TaskDetailPanel';

// Mock Identity Context
const CURRENT_USER_ID = 'person-1';
const CURRENT_USER_POSITIONS = ['pos-hr-mgr', 'pos-eng-lead', 'pos-1'];

const StatusIcon = ({ status }: { status: Task['state'] }) => {
    switch (status) {
        case 'done': return <CheckCircle className="text-green-500" size={16} />;
        case 'in-progress': return <Circle className="text-blue-500 fill-blue-500/20" size={16} />;
        case 'blocked': return <AlertCircle className="text-red-500" size={16} />;
        default: return <Circle className="text-slate-500" size={16} />;
    }
};

export const MyTasksView: React.FC = () => {
    const { getTasksForMember, updateTaskStatus } = useTaskStore();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const myTasks = getTasksForMember(CURRENT_USER_ID, CURRENT_USER_POSITIONS);

    // Group tasks
    const personalTasks = myTasks.filter(t => t.ownerType === 'Person');
    const positionTasks = myTasks.filter(t => t.ownerType === 'Position');

    const TaskRow = ({ task }: { task: Task }) => (
        <div
            onClick={() => setSelectedTaskId(task.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-sm mb-2 ${task.state === 'done' ? 'bg-slate-900/30 border-slate-800 opacity-60' :
                    selectedTaskId === task.id ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/50' :
                        'bg-slate-900 border-slate-700 hover:border-slate-500'
                }`}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    updateTaskStatus(task.id, task.state === 'done' ? 'todo' : 'done');
                }}
                className="shrink-0 hover:scale-110 transition-transform"
            >
                <StatusIcon status={task.state} />
            </button>
            <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${task.state === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className={task.priority === 'critical' ? 'text-red-400 font-bold uppercase' : 'text-slate-500'}>{task.priority}</span>
                    <span>•</span>
                    <span>{task.source}</span>
                </div>
            </div>
            <div className="text-right shrink-0">
                {task.dueDate && <span className="text-xs text-slate-500">{task.dueDate}</span>}
            </div>
        </div>
    );

    return (
        <div className="flex h-full">
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-200">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-600 rounded-lg text-white">
                            <User size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Hub</h1>
                            <p className="text-slate-400 text-sm">Your personal work queue across all roles.</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Direct Assignments */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-slate-300 font-semibold uppercase text-xs tracking-wider">
                            <User size={14} />
                            Directly Assigned
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">{personalTasks.length}</span>
                        </div>
                        <div className="space-y-1">
                            {personalTasks.length === 0 ? (
                                <p className="text-slate-600 italic text-sm">No direct tasks.</p>
                            ) : personalTasks.map(t => <TaskRow key={t.id} task={t} />)}
                        </div>
                    </div>

                    {/* Position Assignments */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-slate-300 font-semibold uppercase text-xs tracking-wider">
                            <Briefcase size={14} />
                            Role Assignments
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">{positionTasks.length}</span>
                        </div>
                        <div className="space-y-1">
                            {positionTasks.length === 0 ? (
                                <p className="text-slate-600 italic text-sm">No position tasks.</p>
                            ) : positionTasks.map(t => <TaskRow key={t.id} task={t} />)}
                        </div>
                    </div>
                </div>
            </div>

            {selectedTaskId && (
                <TaskDetailPanel
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
};
