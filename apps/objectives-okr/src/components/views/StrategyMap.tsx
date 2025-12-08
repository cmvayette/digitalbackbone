import React, { useState } from 'react';
import { useStrategyData } from '@som/api-client';
import { ArrowRight, Target, TrendingUp, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { KRComposer } from '../composers/KRComposer';

export const StrategyMap = () => {
    const { loes, objectives, krs } = useStrategyData();
    const [addingKRToObjId, setAddingKRToObjId] = useState<string | null>(null);

    // Helper to get KRs for an objective
    const getKRsForObjective = (objId: string) => {
        return krs.filter(kr => objectives.find(o => o.id === objId)?.properties.linkedKRs?.includes(kr.id));
    };

    return (
        <div className="strategy-map p-6 bg-slate-900 min-h-screen text-slate-100">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Command Strategy
                </h1>
                <p className="text-slate-400 mt-2">Strategic Lines of Effort and Operational Objectives</p>
            </header>

            <div className="space-y-12">
                {loes.map(loe => (
                    <div key={loe.id} className="loe-section">
                        <div className="flex items-baseline gap-4 mb-4 border-b border-slate-700 pb-2">
                            <h2 className="text-2xl font-bold text-white">{loe.properties.name}</h2>
                            <span className="text-sm text-slate-400 uppercase tracking-widest font-mono">
                                {loe.properties.timeframe.start.getFullYear()} - {loe.properties.timeframe.end.getFullYear()}
                            </span>
                        </div>
                        <p className="text-slate-400 mb-6 max-w-4xl">{loe.properties.description}</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {objectives.filter(() => true /* MVP: All link to this LOE */).map(obj => (
                                <div key={obj.id} className="objective-card bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Target size={16} className="text-blue-400" />
                                                <span className="text-xs uppercase font-bold text-blue-400">{obj.properties.level}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-100">{obj.properties.statement}</h3>
                                        </div>
                                        <div className={`status-badge px-2 py-1 rounded text-xs uppercase font-bold ${obj.properties.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-slate-700'}`}>
                                            {obj.properties.status}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 mb-6 border-l-2 border-slate-600 pl-3 italic">
                                        "{obj.properties.narrative}"
                                    </p>

                                    <div className="flex justify-between items-center mt-6 mb-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Key Results</h4>
                                        <button
                                            onClick={() => setAddingKRToObjId(obj.id)}
                                            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Add KR
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {getKRsForObjective(obj.id).map(kr => (
                                            <div key={kr.id} className="kr-item bg-slate-900/50 p-3 rounded border border-slate-800 flex justify-between items-center group">
                                                <div>
                                                    <div className="text-sm font-medium text-slate-200 mb-1">{kr.properties.statement}</div>
                                                    <div className="text-xs text-slate-500 flex gap-3">
                                                        <span>Target: {kr.properties.target}</span>
                                                        <span>Current: {kr.properties.currentValue}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {kr.properties.health === 'on-track' && <CheckCircle className="text-emerald-500" size={18} />}
                                                    {kr.properties.health === 'at-risk' && <AlertTriangle className="text-amber-500" size={18} />}
                                                    {kr.properties.health === 'off-track' && <AlertTriangle className="text-red-500" size={18} />}
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 w-full rounded-b overflow-hidden">
                                                    <div
                                                        className={`h-full ${kr.properties.health === 'on-track' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${(kr.properties.currentValue / kr.properties.target) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {getKRsForObjective(obj.id).length === 0 && (
                                            <div className="text-xs text-slate-600 italic py-2 text-center border border-dashed border-slate-800 rounded">
                                                No Key Results defined yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {addingKRToObjId && (
                <KRComposer objectiveId={addingKRToObjId} onClose={() => setAddingKRToObjId(null)} />
            )}
        </div>
    );
};
