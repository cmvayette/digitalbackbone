import React, { useState } from 'react';
import { Shield, Check, Search, Plus, X } from 'lucide-react';
import mockPolicy from '../../mocks/mock-policy.json';

// Define types based on mock-policy.json structure
interface Obligation {
    id: string;
    statement: string;
    assignedTo: string;
    sourceDocId: string;
    criticality: 'high' | 'medium' | 'low';
}

interface ObligationLinkerProps {
    linkedObligationIds: { id: string; }[]; // Matching the shape in ProcessStep (ObligationLink[])
    onLink: (obligation: Obligation) => void;
    onUnlink: (obligationId: string) => void;
    className?: string;
}

export const ObligationLinker: React.FC<ObligationLinkerProps> = ({
    linkedObligationIds = [],
    onLink,
    onUnlink,
    className
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const obligations = mockPolicy.policies.obligations as Obligation[];

    const filteredObligations = obligations.filter(obl =>
        obl.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obl.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLinked = (id: string) => linkedObligationIds.some(l => l.id === id);

    const getCriticalityColor = (level: string) => {
        switch (level) {
            case 'high': return 'text-red-400 bg-red-900/20 border-red-800';
            case 'medium': return 'text-amber-400 bg-amber-900/20 border-amber-800';
            case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-800';
            default: return 'text-slate-400 bg-slate-800 border-slate-700';
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="flex flex-wrap gap-2 mb-2">
                {linkedObligationIds.map(link => {
                    const obl = obligations.find(o => o.id === link.id);
                    if (!obl) return null;

                    return (
                        <div key={link.id} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300">
                            <Shield size={10} className={getCriticalityColor(obl.criticality).split(' ')[0]} />
                            <span className="truncate max-w-[150px]">{obl.statement}</span>
                            <button
                                onClick={() => onUnlink(link.id)}
                                className="ml-1 text-slate-500 hover:text-red-400"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-dashed border-blue-900 px-2 py-1 rounded bg-blue-900/10 hover:bg-blue-900/20 transition-colors"
                >
                    <Plus size={12} /> Link Obligation
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-80">
                    <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                        <Search size={14} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search obligations..."
                            className="bg-transparent border-none focus:outline-none text-xs text-slate-200 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-1 flex-1">
                        {filteredObligations.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">No obligations found</div>
                        ) : (
                            filteredObligations.map(obl => {
                                const linked = isLinked(obl.id);
                                return (
                                    <button
                                        key={obl.id}
                                        onClick={() => {
                                            if (linked) onUnlink(obl.id);
                                            else onLink(obl);
                                        }}
                                        className={`w-full text-left p-2 rounded text-xs mb-1 flex items-start gap-2 group ${linked ? 'bg-blue-900/20' : 'hover:bg-slate-800'}`}
                                    >
                                        <div className={`mt-0.5 shrink-0 ${linked ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                            {linked ? <Check size={14} /> : <div className="w-3.5 h-3.5 border border-current rounded-sm" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getCriticalityColor(obl.criticality)}`}>
                                                    {obl.criticality.toUpperCase()}
                                                </span>
                                                <span className="text-slate-500 font-mono text-[10px]">{obl.id}</span>
                                            </div>
                                            <div className={`line-clamp-2 ${linked ? 'text-slate-200' : 'text-slate-400'}`}>
                                                {obl.statement}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
