import React, { useState } from 'react';
import { HolonType, type KeyResult } from '@som/shared-types';
import { useExternalOrgData } from '@som/api-client';
import { useStrategyComposer } from '../../hooks/useStrategyComposer';

interface KRComposerProps {
    objectiveId: string;
    onClose: () => void;
}

export const KRComposer: React.FC<KRComposerProps> = ({ objectiveId, onClose }) => {
    // const { addKR } = useStrategyData(); // Deprecated
    const { createKeyResult, isSubmitting } = useStrategyComposer();
    const { getCandidates } = useExternalOrgData();

    const [statement, setStatement] = useState('');
    const [baseline, setBaseline] = useState<number>(0);
    const [target, setTarget] = useState<number>(100);
    const [ownerId, setOwnerId] = useState('');
    const [cadence, setCadence] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');

    const handleSave = async () => {
        const actorId = 'user-123'; // Hardcoded for MVP
        await createKeyResult(objectiveId, statement, target, baseline, ownerId, actorId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-xl w-full p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">Add Key Result</h2>
                <div className="text-xs text-slate-500 mb-4 uppercase font-bold">Linked to Objective: {objectiveId}</div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outcome Statement (From X to Y by T)</label>
                        <input
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g., Increase sorting capacity from 100 to 500 units"
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Baseline (Start)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                value={baseline}
                                onChange={(e) => setBaseline(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target (Goal)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                value={target}
                                onChange={(e) => setTarget(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner</label>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                value={ownerId}
                                onChange={(e) => setOwnerId(e.target.value)}
                            >
                                <option value="">Select Owner...</option>
                                {getCandidates().map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cadence</label>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                value={cadence}
                                onChange={(e) => setCadence(e.target.value as any)}
                            >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t border-slate-800 pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                        disabled={!statement || !ownerId}
                    >
                        Save Key Result
                    </button>
                </div>
            </div>
        </div>
    );
};
