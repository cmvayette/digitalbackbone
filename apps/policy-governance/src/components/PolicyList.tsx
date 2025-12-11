import React from 'react';
import { usePolicyStore } from '../store/policyStore';
import { FileText, Shield, ChevronRight, Plus } from 'lucide-react';
import type { PolicyDocument } from '../types/policy';

interface PolicyListProps {
    onSelectPolicy: (id: string) => void;
    onCreatePolicy: (policy: Partial<PolicyDocument>) => void;
}

export const PolicyList: React.FC<PolicyListProps> = ({ onSelectPolicy, onCreatePolicy }) => {
    const { policies, selectPolicy } = usePolicyStore();

    const handleCreate = () => {
        onCreatePolicy({
            title: 'New Policy',
            documentType: 'Instruction',
            version: '0.1',
            status: 'draft',
            sections: [],
            obligations: []
        });
    };

    const handleSelect = (id: string) => {
        selectPolicy(id);
        onSelectPolicy(id);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <Shield className="text-blue-500" />
                        Policy Governance
                    </h1>
                    <p className="text-slate-400 mt-1">Manage instructions, notices, and orders.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Policy
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {policies.map(policy => (
                    <div
                        key={policy.id}
                        onClick={() => handleSelect(policy.id)}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-5 flex items-center justify-between hover:border-slate-600 hover:bg-slate-750 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-900 rounded-lg text-blue-400">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors">
                                    {policy.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                    <span className="bg-slate-900 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider text-slate-500">
                                        {policy.documentType}
                                    </span>
                                    <span>Version {policy.version}</span>
                                    <span>Updated {new Date(policy.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Stats */}
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-200">{policy.obligations.length}</div>
                                <div className="text-xs text-slate-500 uppercase font-medium">Obligations</div>
                            </div>

                            {/* Status Badge */}
                            <StatusBadge status={policy.status} />

                            <ChevronRight className="text-slate-600 group-hover:text-slate-400" />
                        </div>
                    </div>
                ))}

                {policies.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No policies found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: PolicyDocument['status'] }> = ({ status }) => {
    const colors = {
        draft: 'bg-slate-700 text-slate-300',
        review: 'bg-amber-900/50 text-amber-400 border-amber-800',
        active: 'bg-green-900/50 text-green-400 border-green-800',
        superseded: 'bg-slate-800 text-slate-500 line-through',
        archived: 'bg-red-900/20 text-red-500'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border border-transparent ${colors[status] || colors.draft}`}>
            {status.toUpperCase()}
        </span>
    );
};
