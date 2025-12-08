import React from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { ShieldAlert, ShieldCheck, FileText, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

export const ComplianceDashboard: React.FC = () => {
    const { policies } = usePolicyStore();

    // Aggregate Metrics
    const activePolicies = policies.filter(p => p.status === 'active');
    const allObligations = policies.flatMap(p => p.obligations);
    const highCriticality = allObligations.filter(o => o.criticality === 'high');

    // Mock "At Risk" calculation (e.g., high criticality with no deadline or specific mock flag)
    // For MVP, let's say "At Risk" are high crit obligations.
    const atRiskCount = highCriticality.length;

    // Mock Compliance Percentage
    const complianceScore = Math.round((1 - (atRiskCount / (allObligations.length || 1))) * 100);

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Compliance Dashboard</h1>
                <p className="text-slate-400">Organization-wide governance posture and risk assessment.</p>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg"><FileText size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Active Policies</p>
                            <p className="text-2xl font-bold text-white">{activePolicies.length} <span className="text-sm text-slate-500 font-normal">/ {policies.length}</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-indigo-900/30 text-indigo-400 rounded-lg"><Activity size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Obligations</p>
                            <p className="text-2xl font-bold text-white">{allObligations.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-900/30 text-red-400 rounded-lg"><AlertTriangle size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Critical Risks</p>
                            <p className="text-2xl font-bold text-white">{atRiskCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-lg"><CheckCircle size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Compliance Score</p>
                            <p className="text-2xl font-bold text-white">{complianceScore}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* High Priority Obligations */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-white">Critical Obligations Matrix</h2>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase font-bold text-slate-500 bg-slate-950/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Statement</th>
                                    <th className="px-4 py-3">Actor</th>
                                    <th className="px-4 py-3">Deadline</th>
                                    <th className="px-4 py-3 rounded-r-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {highCriticality.map(obl => (
                                    <tr key={obl.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-200">{obl.statement}</td>
                                        <td className="px-4 py-3">{obl.actor.name}</td>
                                        <td className="px-4 py-3">{obl.deadline || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-red-900/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold uppercase">At Risk</span>
                                        </td>
                                    </tr>
                                ))}
                                {highCriticality.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">No critical obligations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actor Breakdown (Simple list for now) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-white">Top Risk Owners</h2>
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {/* Mock analysis of "who owns the most critical items" */}
                        {Array.from(new Set(highCriticality.map(o => o.actor.name))).map(actorName => {
                            const count = highCriticality.filter(o => o.actor.name === actorName).length;
                            return (
                                <div key={actorName} className="flex justify-between items-center bg-slate-800/50 p-3 rounded hover:bg-slate-800 transition-colors">
                                    <span className="text-slate-200 font-medium">{actorName}</span>
                                    <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold">{count} Risks</span>
                                </div>
                            )
                        })}
                        {highCriticality.length === 0 && (
                            <div className="text-center text-slate-500 italic mt-8">No risk data available.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
