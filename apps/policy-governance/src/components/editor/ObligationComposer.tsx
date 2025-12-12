import React, { useState, useMemo } from 'react';
import type { Obligation, OwnerRef } from '../../types/policy';
import { useExternalOrgData } from '@som/api-client';
import { OwnerPicker } from '@som/ui-components';
import { Building, User, ChevronDown } from 'lucide-react';

interface ObligationComposerProps {
    initialStatement?: string;
    onSave: (obligation: Omit<Obligation, 'id'>) => void;
    onCancel: () => void;
}

export const ObligationComposer: React.FC<ObligationComposerProps> = ({ initialStatement = '', onSave, onCancel }) => {
    const [statement, setStatement] = useState(initialStatement);
    const [selectedActorId, setSelectedActorId] = useState('');
    const [criticality, setCriticality] = useState<Obligation['criticality']>('medium');

    const [deadline, setDeadline] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Access External Org Data (Simulated Integration)
    const { getCandidates } = useExternalOrgData();
    const candidates = getCandidates();

    const handleSave = () => {
        if (!statement || !selectedActorId) return;

        const actor = candidates.find(c => c.id === selectedActorId);
        if (!actor) return;

        const ownerRef: OwnerRef = {
            id: actor.id,
            name: actor.name,
            type: actor.type as 'Organization' | 'Position' | 'RoleTag' | 'Person'
        };

        onSave({
            statement,
            actor: ownerRef,
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
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsible Actor</label>
                    <button
                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-blue-500 outline-none flex items-center justify-between"
                    >
                        <span>
                            {selectedActorId
                                ? candidates.find(c => c.id === selectedActorId)?.name
                                : <span className="text-slate-500">Select Actor...</span>}
                        </span>
                        <ChevronDown size={14} className="text-slate-500" />
                    </button>

                    {isPickerOpen && (
                        <OwnerPicker
                            value={selectedActorId}
                            onChange={(id: string) => setSelectedActorId(id)}
                            onClose={() => setIsPickerOpen(false)}
                            className="absolute top-full left-0 mt-1 w-full"
                        />
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Criticality</label>
                    <select
                        value={criticality}
                        onChange={(e) => setCriticality(e.target.value as Obligation['criticality'])}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            {selectedActorId && (
                <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded flex items-center gap-2">
                    {candidates.find(c => c.id === selectedActorId)?.type === 'Organization' ? <Building size={12} /> : <User size={12} />}
                    Mapped to: <span className="font-bold">{candidates.find(c => c.id === selectedActorId)?.name}</span>
                </div>
            )}

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
                    disabled={!statement || !selectedActorId}
                    className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-500 disabled:opacity-50"
                >
                    Add Obligation
                </button>
            </div>
        </div>
    );
};
