import React, { useState } from 'react';
import type { Obligation, OwnerRef } from '../../types/policy';

interface ObligationComposerProps {
    initialStatement?: string;
    onSave: (obligation: Omit<Obligation, 'id'>) => void;
    onCancel: () => void;
}

export const ObligationComposer: React.FC<ObligationComposerProps> = ({ initialStatement = '', onSave, onCancel }) => {
    const [statement, setStatement] = useState(initialStatement);
    const [actorName, setActorName] = useState(''); // Simple text for MVP, replace with OwnerPicker later
    const [criticality, setCriticality] = useState<Obligation['criticality']>('medium');
    const [deadline, setDeadline] = useState('');

    const handleSave = () => {
        if (!statement || !actorName) return;

        const mockActor: OwnerRef = {
            id: 'mock-id',
            name: actorName,
            type: 'Position'
        };

        onSave({
            statement,
            actor: mockActor,
            criticality,
            deadline: deadline || undefined,
            status: 'draft'
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Requirement Statement</label>
                <textarea
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    placeholder="e.g. The Safety Officer must inspect gear weekly."
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsible Actor</label>
                    <input
                        type="text"
                        value={actorName}
                        onChange={(e) => setActorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                        placeholder="e.g. Safety Officer"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Criticality</label>
                    <select
                        value={criticality}
                        onChange={(e) => setCriticality(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deadline / Frequency (Optional)</label>
                <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    placeholder="e.g. Weekly, By Friday, Within 24 hours"
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-sm text-slate-400 hover:text-white px-3 py-1.5">Cancel</button>
                <button
                    onClick={handleSave}
                    disabled={!statement || !actorName}
                    className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-500 disabled:opacity-50"
                >
                    Add Obligation
                </button>
            </div>
        </div>
    );
};
