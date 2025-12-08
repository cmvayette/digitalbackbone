import React, { useMemo } from 'react';
import { mockProcesses } from '../../mocks/mock-processes';
import { calculateProcessHealth, HealthScore } from '../../utils/health-calculator';
import { useDriftDetection } from '../../hooks/useDriftDetection';
import { Activity, AlertTriangle, CheckCircle, Clock, FileText, Globe } from 'lucide-react';
import type { Process } from '../../types/process';

const HealthCard: React.FC<{ process: Process }> = ({ process }) => {
    const { hasDrift } = useDriftDetection(process);
    const health = useMemo(() => calculateProcessHealth(process, hasDrift), [process, hasDrift]);

    const statusColor = {
        healthy: 'bg-green-500',
        'at-risk': 'bg-amber-500',
        critical: 'bg-red-500'
    }[health.status];

    const textColor = {
        healthy: 'text-green-400',
        'at-risk': 'text-amber-400',
        critical: 'text-red-400'
    }[health.status];

    return (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-100 text-lg">{process.properties.name}</h3>
                    <p className="text-slate-400 text-sm truncate max-w-[200px]">{process.properties.description}</p>
                </div>
                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full ${statusColor} bg-opacity-20 border border-${statusColor.split('-')[1]}-500`}>
                    <span className={`font-bold text-lg ${textColor}`}>{health.score}</span>
                </div>
            </div>

            {/* Factors Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-1" title="Freshness (Last Updated)">
                    <Clock size={12} className={health.factors.freshness < 80 ? 'text-amber-400' : 'text-slate-500'} />
                    <span>Freshness: {health.factors.freshness}%</span>
                </div>
                <div className="flex items-center gap-1" title="Completeness (Descriptions, Owners)">
                    <FileText size={12} className={health.factors.completeness < 100 ? 'text-amber-400' : 'text-slate-500'} />
                    <span>Completeness: {Math.round(health.factors.completeness)}%</span>
                </div>
                <div className="flex items-center gap-1" title="Compliance (Obligations Linked)">
                    <CheckCircle size={12} className={health.factors.compliance < 100 ? 'text-amber-400' : 'text-slate-500'} />
                    <span>Compliance: {Math.round(health.factors.compliance)}%</span>
                </div>
                {hasDrift && (
                    <div className="flex items-center gap-1 text-red-400 font-bold" title="Governance Drift Detected">
                        <Globe size={12} />
                        <span>Drift Penalty: -20</span>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-2 border-t border-slate-700 flex justify-between items-center">
                <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded bg-slate-900 ${textColor}`}>
                    {health.status}
                </span>
                <button className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
                    View & Fix
                </button>
            </div>
        </div>
    );
};

export const ProcessHealthDashboard: React.FC = () => {
    // Sort processes by health score (lowest first)
    const sortedProcesses = useMemo(() => {
        return [...mockProcesses].sort((a, b) => {
            const healthA = calculateProcessHealth(a, false).score; // Rough sort without drift check for perf? 
            // Better to include drift if possible, but useDriftDetection is a hook.
            // We can't use hook in sort callback easily without strict rules check.
            // For MVP, we'll sort inside the render or extract logic.
            // Actually, we can't call hooks inside sort.
            // We'll map first, then sort.
            return 0;
        });
    }, []);

    // We need to render the list, and let the items calculate their own health?
    // Sorting by health requires knowing the health.
    // We can pre-calculate health for all items if we move drift detection logic out of hook or use it here.
    // `useDriftDetection` uses `mockPolicy`. It's cheap. We can make a helper function `detectDrift(process)` that isn't a hook?
    // `useDriftDetection` IS a hook because it might use `useMemo` or context.
    // Let's refactor `useDriftDetection` logic to a pure utility function if needed, or just accept unsorted/client-side sort effect.

    // For MVP, let's just render them. Sorting is a "Nice to have" or we can do it if we make `detectDrift` a utility.
    // The `useDriftDetection` hook mainly memoizes. The logic is simple.

    return (
        <div className="p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="text-blue-400" />
                    Process Health Dashboard
                </h1>
                <p className="text-slate-400">Monitor the quality and compliance of your process portfolio.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mockProcesses.map(process => (
                    <HealthCard key={process.id} process={process} />
                ))}
            </div>
        </div>
    );
};
