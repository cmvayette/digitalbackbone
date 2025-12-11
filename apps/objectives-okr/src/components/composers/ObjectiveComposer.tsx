import React, { useState } from 'react';
import { HolonType, type Objective } from '@som/shared-types';
import { useExternalOrgData } from '@som/api-client';
import { useStrategyComposer } from '../../hooks/useStrategyComposer';

export const ObjectiveComposer = ({ onClose }: { onClose: () => void }) => {
    // const { addObjective } = useStrategyData(); // Deprecated
    const { createObjective, isSubmitting } = useStrategyComposer();
    const { getCandidates } = useExternalOrgData();

    const [statement, setStatement] = useState('');
    const [narrative, setNarrative] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [level, setLevel] = useState<'strategic' | 'operational' | 'tactical'>('operational');

    const handleSave = async () => {
        // Use hardcoded actor for MVP, should come from auth context
        const actorId = 'user-123';
        const timeHorizon = new Date(new Date().getFullYear(), 11, 31);

        await createObjective(statement, narrative, ownerId, level, timeHorizon, actorId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">Define New Objective</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State the Objective</label>
                        <input
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g., Achieve Information Dominance in Sector 7"
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">The Narrative (Why?)</label>
                        <textarea
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-24 focus:outline-none focus:border-blue-500"
                            placeholder="Explain the problem this solves..."
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                        />
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
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Level</label>
                            <select
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                value={level}
                                onChange={(e) => setLevel(e.target.value as any)}
                            >
                                <option value="strategic">Strategic</option>
                                <option value="operational">Operational</option>
                                <option value="tactical">Tactical</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t border-slate-800 pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                        disabled={!statement || !ownerId}
                    >
                        Create Objective
                    </button>
                </div>
            </div>
        </div>
    );
};
