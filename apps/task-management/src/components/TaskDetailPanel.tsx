import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { X, Calendar, User, Tag, ArrowRight, Clock } from 'lucide-react';

interface TaskDetailPanelProps {
    taskId: string;
    onClose: () => void;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ taskId, onClose }) => {
    const { tasks, updateTaskStatus } = useTaskStore();
    const task = tasks.find(t => t.id === taskId);

    if (!task) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl p-6 flex flex-col z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${task.priority === 'critical' ? 'bg-red-900/50 text-red-400' :
                            task.priority === 'high' ? 'bg-amber-900/50 text-amber-400' :
                                'bg-slate-800 text-slate-400'
                        }`}>
                        {task.priority}
                    </span>
                    <h2 className="text-xl font-bold text-white leading-tight">{task.title}</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Status & Action */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">Current State</label>
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${task.state === 'done' ? 'text-green-400' : 'text-blue-400'
                            }`}>
                            {task.state.replace('-', ' ').toUpperCase()}
                        </span>

                        {task.state !== 'done' ? (
                            <button
                                onClick={() => updateTaskStatus(task.id, 'done')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                            >
                                <ArrowRight size={14} /> Complete
                            </button>
                        ) : (
                            <button
                                onClick={() => updateTaskStatus(task.id, 'in-progress')}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded transition-colors"
                            >
                                Reopen
                            </button>
                        )}
                    </div>
                </div>

                {/* Metadata */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-300">
                        <Calendar size={16} className="text-slate-500" />
                        <div className="text-sm">
                            <span className="block text-xs text-slate-500">Due Date</span>
                            {task.dueDate || 'No deadline'}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300">
                        <User size={16} className="text-slate-500" />
                        <div className="text-sm">
                            <span className="block text-xs text-slate-500">Assigned To</span>
                            {task.ownerType === 'Position' ? 'Position: ' : 'Person: '} {task.ownerId}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300">
                        <Clock size={16} className="text-slate-500" />
                        <div className="text-sm">
                            <span className="block text-xs text-slate-500">Estimated Effort</span>
                            {task.effortEstimate ? `${task.effortEstimate} hours` : 'Not estimated'}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-xs text-slate-500 uppercase font-semibold mb-2">Description</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {task.description || 'No description provided.'}
                    </p>
                </div>

                {/* Context / Origin */}
                <div>
                    <h3 className="text-xs text-slate-500 uppercase font-semibold mb-2">Origin Context</h3>
                    <div className="bg-slate-900 border border-slate-800 rounded p-3 text-xs text-slate-400">
                        <div className="flex justify-between mb-1">
                            <span>Source System:</span>
                            <span className="text-indigo-400 font-medium">{task.source}</span>
                        </div>
                        {task.sourceRefId && (
                            <div className="flex justify-between">
                                <span>Reference ID:</span>
                                <span className="font-mono text-slate-300">{task.sourceRefId}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                    <div>
                        <h3 className="text-xs text-slate-500 uppercase font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {task.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-400 rounded-full text-xs flex items-center gap-1">
                                    <Tag size={10} /> {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
