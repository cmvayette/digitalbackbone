import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useExternalOrgData } from '@som/api-client';
import { Search, User, Bot, Briefcase, X } from 'lucide-react';

interface OwnerPickerProps {
    value: string;
    onChange: (ownerId: string) => void;
    onClose: () => void;
}

export const OwnerPicker: React.FC<OwnerPickerProps> = ({ value, onChange, onClose }) => {
    const { getCandidates, isLoading } = useExternalOrgData({ mode: 'mock' });
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'staff' | 'agents'>('staff');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [activeTab]);

    const candidates = useMemo(() => {
        const all = getCandidates();
        return all.filter(c => {
            if (activeTab === 'staff') {
                return c.type === 'Person' || c.type === 'Position' || c.type === 'Organization';
            } else {
                return c.type === 'Agent';
            }
        }).filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.subtitle || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [getCandidates, activeTab, search]);

    return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header / Search */}
            <div className="p-2 border-b border-slate-700 bg-slate-800/50">
                <div className="relative">
                    <Search className="absolute left-2 top-2 text-slate-500" size={14} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'staff' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                >
                    <User size={12} /> Staff
                </button>
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'agents' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                >
                    <Bot size={12} /> Agents
                </button>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
                ) : candidates.length > 0 ? (
                    candidates.map(candidate => (
                        <button
                            key={candidate.id}
                            onClick={() => {
                                onChange(candidate.id);
                                onClose();
                            }}
                            className="w-full text-left p-2 hover:bg-slate-800 border-b border-slate-800/50 last:border-0 flex items-center gap-3 transition-colors"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${candidate.type === 'Agent' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                {candidate.type === 'Person' && candidate.avatarUrl ? (
                                    <img src={candidate.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    candidate.type === 'Agent' ? <Bot size={16} /> :
                                        candidate.type === 'Position' ? <Briefcase size={16} /> : <User size={16} />
                                )}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-200">{candidate.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">{candidate.subtitle}</div>
                            </div>
                            {value === candidate.id && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-search-highlight" />
                            )}
                        </button>
                    ))
                ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                        No results found.
                    </div>
                )}
            </div>

            {/* Footer */}
            <button onClick={onClose} className="p-1.5 bg-slate-900 text-[10px] text-slate-500 hover:text-white uppercase tracking-wider font-bold border-t border-slate-700">
                Cancel / Close
            </button>
        </div>
    );
};

