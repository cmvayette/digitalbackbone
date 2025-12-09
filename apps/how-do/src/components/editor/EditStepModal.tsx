import React, { useState } from 'react';
import { ProcessStep } from '../../types/process';
import { X } from 'lucide-react';

interface EditStepModalProps {
    step: ProcessStep;
    onSave: (updatedStep: ProcessStep) => void;
    onCancel: () => void;
    onDelete: (stepId: string) => void;
}

export const EditStepModal: React.FC<EditStepModalProps> = ({ step, onSave, onCancel, onDelete }) => {
    const [title, setTitle] = useState(step.title);
    const [description, setDescription] = useState(step.description);

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({
            ...step,
            title,
            description
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-100">Edit Step</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
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

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this step?')) {
                                onDelete(step.id);
                            }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2"
                    >
                        Delete Step
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
