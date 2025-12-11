import React, { useMemo } from 'react';
import { mockProcesses } from '../../mocks/mock-processes';
import { calculateProcessHealth } from '../../utils/health-calculator';
import { useDriftDetection } from '../../hooks/useDriftDetection';
import { Activity, CheckCircle, Clock, FileText, Globe } from 'lucide-react';
import type { Process } from '../../types/process';

import { useGovernanceConfig } from '../../hooks/useGovernanceConfig';

const HealthCard: React.FC<{ process: Process; weights?: any }> = ({ process, weights }) => {
    const { hasDrift } = useDriftDetection(process);
    const maturity = useMemo(() => calculateProcessHealth(process, hasDrift, weights), [process, hasDrift, weights]);

    const levelColors = {
        1: { bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500' },
        2: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
        3: { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
        4: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
        5: { bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500' }
    };

    const styles = levelColors[maturity.level];

    return (
        <div className="bg-bg-panel rounded-lg p-4 border border-border-color flex flex-col gap-4 relative overflow-hidden group hover:border-slate-500 transition-all">
            {/* Level Badge Background */}
            <div className={`absolute top-0 right-0 p-2 opacity-10 font-black text-6xl ${styles.text} select-none`}>
                {maturity.level}
            </div>

            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="font-bold text-text-primary text-lg">{process.properties.name}</h3>
                    <p className="text-text-secondary text-sm truncate max-w-[200px]">{process.properties.description}</p>
                </div>
                <div className={`flex flex-col items-center justify-center w-8 h-8 rounded shadow-lg ${styles.bg} bg-opacity-20 border ${styles.border}`}>
                    <span className={`font-bold text-sm ${styles.text}`}>L{maturity.level}</span>
                </div>
            </div>

            {/* Maturity Status */}
            <div className="z-10">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>
                        {maturity.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">SCORE: {maturity.score}</span>
                </div>
                <div className="w-full h-1.5 bg-bg-canvas rounded-full overflow-hidden">
                    {/* Progress bar based on Maturity Level (20% per level) */}
                    <div className={`h-full ${styles.bg} opacity-80`} style={{ width: `${maturity.level * 20}%` }} />
                </div>
            </div>

            {/* Factors Breakdown key=value */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-text-secondary z-10">
                <div>Freshness: <span className="text-slate-300">{Math.round(maturity.factors.freshness)}%</span></div>
                <div>Ownership: <span className="text-slate-300">{Math.round(maturity.factors.completeness)}%</span></div>
                <div>Compliance: <span className="text-slate-300">{Math.round(maturity.factors.compliance)}%</span></div>
                {hasDrift && <div className="text-accent-orange font-bold col-span-2">⚠️ DRIFT DETECTED</div>}
            </div>

            {/* Next Step Action */}
            <div className="mt-auto pt-3 border-t border-border-color z-10">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Next Action:</p>
                <div className="text-xs text-text-secondary flex justify-between items-center bg-bg-canvas p-2 rounded border border-border-color">
                    <span>{maturity.nextStep}</span>
                    <button className="text-accent-cyan hover:text-white transition-colors">
                        →
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ProcessHealthDashboard: React.FC = () => {
    const { config } = useGovernanceConfig({ mode: 'mock' });

    // Sort processes by health score (lowest first)
    const sortedProcesses = useMemo(() => {
        return [...mockProcesses].sort((a, b) => {
            // For now just sort by name as placeholder
            return a.properties.name.localeCompare(b.properties.name);
        });
    }, []);

    return (
        <div className="p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="text-blue-400" />
                    Process Health Dashboard
                </h1>
                <p className="text-slate-400">Monitor the quality and compliance of your process portfolio.</p>
                {config && (
                    <div className="mt-2 text-xs font-mono text-slate-500 bg-bg-panel inline-block px-2 py-1 rounded">
                        TUNER ACTIVE: Compliance Weight {(config.properties.aggregation.weights.compliance * 100).toFixed(0)}%
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedProcesses.map(process => (
                    <HealthCard
                        key={process.id}
                        process={process}
                        weights={config?.properties.aggregation.weights}
                    />
                ))}
            </div>
        </div>
    );
};
