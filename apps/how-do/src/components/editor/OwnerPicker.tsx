import React, { useState } from 'react';
import { User, Briefcase, Building } from 'lucide-react';
import { useExternalOrgData } from '../../hooks/useExternalOrgData';

interface OwnerOption {
    id: string;
    name: string;
    type: 'Organization' | 'Position' | 'Agent';
    subtitle?: string;
}

interface OwnerPickerProps {
    value: string;
    onChange: (ownerId: string) => void;
    onClose: () => void;
}

export const OwnerPicker: React.FC<OwnerPickerProps> = ({ value, onChange, onClose }) => {
    const { getCandidates } = useExternalOrgData();
    const [searchTerm, setSearchTerm] = useState('');

    // Load Candidates from Org Store Hook
    const candidates: OwnerOption[] = getCandidates().map(c => ({
        ...c,
        type: c.type === 'Organization' ? 'Organization' : 'Position' // Narrow types if needed
    }));

    // Add Agents (still mocked for now, as they aren't in Org Chart yet)
    const agents: OwnerOption[] = [
        { id: 'agent-1', name: 'Policy Bot', type: 'Agent', subtitle: 'Governance Check' },
        { id: 'agent-2', name: 'Ops Scheduler_AI', type: 'Agent', subtitle: 'Calendar Mgmt' }
    ];

    const allOptions = [...candidates, ...agents];

    const filteredOptions = allOptions.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOrgs = filteredOptions.filter(o => o.type === 'Organization');
    const filteredPositions = filteredOptions.filter(o => o.type === 'Position');
    const filteredAgents = filteredOptions.filter(o => o.type === 'Agent');

    return (
        <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-700 bg-slate-900/50">
                <input
                    type="text"
                    placeholder="Search owners (Units, Positions)..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="max-h-60 overflow-y-auto p-1">

                {filteredOrgs.length > 0 && (
                    <>
                        <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Organizations</div>
                        {filteredOrgs.map(org => (
                            <button
                                key={org.id}
                                onClick={() => { onChange(org.id); onClose(); }}
                                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${value === org.id ? 'bg-green-600/20 text-green-300' : 'text-slate-300 hover:bg-slate-700'}`}
                            >
                                <div className="w-6 h-6 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Building size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium">{org.name}</div>
                                    <div className="text-[10px] text-slate-500">{org.subtitle}</div>
                                </div>
                            </button>
                        ))}
                    </>
                )}

                {filteredPositions.length > 0 && (
                    <>
                        <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 mt-2">Positions</div>
                        {filteredPositions.map(pos => (
                            <button
                                key={pos.id}
                                onClick={() => { onChange(pos.id); onClose(); }}
                                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${value === pos.id ? 'bg-blue-600/20 text-blue-300' : 'text-slate-300 hover:bg-slate-700'}`}
                            >
                                <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Briefcase size={12} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium">{pos.name}</div>
                                    <div className="text-[10px] text-slate-500">{pos.subtitle}</div>
                                </div>
                            </button>
                        ))}
                    </>
                )}

                {filteredAgents.length > 0 && (
                    <>
                        <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 mt-2">Agents</div>
                        {filteredAgents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => { onChange(agent.id); onClose(); }}
                                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${value === agent.id ? 'bg-purple-600/20 text-purple-300' : 'text-slate-300 hover:bg-slate-700'}`}
                            >
                                <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center shrink-0">
                                    <User size={12} className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium">{agent.name}</div>
                                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{agent.subtitle}</div>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div >
        </div >
    );
};

