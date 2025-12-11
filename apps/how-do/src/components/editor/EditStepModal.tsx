import React, { useState } from 'react';
import { ProcessStep } from '../../types/process';
import { X, Paperclip, GitBranch, Trash2, Plus, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface EditStepModalProps {
    step: ProcessStep;
    onSave: (updatedStep: ProcessStep) => void;
    onCancel: () => void;
    onDelete: (stepId: string) => void;
}

export const EditStepModal: React.FC<EditStepModalProps> = ({ step, onSave, onCancel, onDelete }) => {
    const [title, setTitle] = useState(step.title);
    const [description, setDescription] = useState(step.description);

    // Attachments State
    const [attachments, setAttachments] = useState<{ name: string; url: string }[]>(step.attachments || []);
    const [newAttName, setNewAttName] = useState('');
    const [newAttUrl, setNewAttUrl] = useState('');

    // Decision State
    const [isDecision, setIsDecision] = useState(!!step.decision);
    const [decisionLabel, setDecisionLabel] = useState(step.decision?.label || '');
    const [decisionPaths, setDecisionPaths] = useState<string[]>(step.decision?.paths || ['Yes', 'No']);
    const [newPath, setNewPath] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;

        onSave({
            ...step,
            title,
            description,
            attachments: attachments.length > 0 ? attachments : undefined,
            decision: isDecision ? { label: decisionLabel || 'Decision', paths: decisionPaths } : undefined
        });
    };

    const addAttachment = () => {
        if (newAttName && newAttUrl) {
            setAttachments([...attachments, { name: newAttName, url: newAttUrl }]);
            setNewAttName('');
            setNewAttUrl('');
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const addPath = () => {
        if (newPath.trim()) {
            setDecisionPaths([...decisionPaths, newPath.trim()]);
            setNewPath('');
        }
    };

    const removePath = (index: number) => {
        setDecisionPaths(decisionPaths.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-100">Edit Step</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Step Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. Review Document"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-blue-500 focus:outline-none h-24 resize-none"
                                placeholder="Describe the action required..."
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-700/50" />

                    {/* Attachments Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Paperclip size={14} className="text-blue-400" />
                            <label className="text-xs font-bold text-slate-300 uppercase">Attachments</label>
                        </div>

                        <div className="space-y-2 mb-3">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                    <div className="flex items-center gap-2 text-xs text-slate-300 overflow-hidden">
                                        <LinkIcon size={12} className="text-slate-500 flex-shrink-0" />
                                        <span className="font-medium">{att.name}</span>
                                        <span className="text-slate-500 truncate max-w-[150px]">{att.url}</span>
                                    </div>
                                    <button onClick={() => removeAttachment(idx)} className="text-slate-500 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newAttName}
                                onChange={(e) => setNewAttName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                                placeholder="Name (e.g. Template)"
                            />
                            <input
                                type="text"
                                value={newAttUrl}
                                onChange={(e) => setNewAttUrl(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                                placeholder="URL"
                            />
                            <button
                                onClick={addAttachment}
                                disabled={!newAttName || !newAttUrl}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-1.5 rounded disabled:opacity-50"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-700/50" />

                    {/* Decision Logic Section */}
                    <div className={`transition-all ${isDecision ? 'bg-yellow-900/10 p-3 rounded border border-yellow-900/30' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <GitBranch size={14} className={isDecision ? "text-yellow-500" : "text-slate-500"} />
                                <label className="text-xs font-bold text-slate-300 uppercase">Decision Point</label>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isDecision} onChange={(e) => setIsDecision(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600"></div>
                            </label>
                        </div>

                        {isDecision && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Decision Label</label>
                                    <input
                                        type="text"
                                        value={decisionLabel}
                                        onChange={(e) => setDecisionLabel(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 focus:border-yellow-500 focus:outline-none"
                                        placeholder="e.g. Approved?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Paths</label>
                                    <div className="space-y-2 mb-2">
                                        {decisionPaths.map((path, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700/50">
                                                <div className="flex items-center gap-2 text-xs text-yellow-500/80">
                                                    <span>↳</span>
                                                    <span className="text-slate-300">{path}</span>
                                                </div>
                                                <button onClick={() => removePath(idx)} className="text-slate-500 hover:text-red-400">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newPath}
                                            onChange={(e) => setNewPath(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addPath()}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-100 focus:border-yellow-500 focus:outline-none"
                                            placeholder="Add path (e.g. Rework)"
                                        />
                                        <button
                                            onClick={addPath}
                                            disabled={!newPath.trim()}
                                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-1.5 rounded disabled:opacity-50"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between flex-shrink-0">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this step?')) {
                                onDelete(step.id);
                            }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold"
                            disabled={!title.trim()}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
