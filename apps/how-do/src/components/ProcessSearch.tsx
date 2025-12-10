import React, { useState } from 'react';
import { useExternalProcessData } from '@som/api-client';
import type { Process } from '../types/process';
import { useDriftDetection } from '../hooks/useDriftDetection';
import { AlertOctagon } from 'lucide-react';

interface ProcessSearchProps {
    onSelectProcess: (process: Process) => void;
}

const ProcessListItem: React.FC<{ process: Process; onSelect: (p: Process) => void }> = ({ process, onSelect }) => {
    const { hasDrift } = useDriftDetection(process);
    // Deep Void Card Pattern
    return (
        <div
            className="process-card flex justify-between items-center p-3 mb-2 bg-slate-950/50 backdrop-blur-sm rounded-sm hover:bg-slate-900/40 cursor-pointer border border-slate-700 hover:border-slate-500 transition-all duration-200 group"
            onClick={() => onSelect(process)}
        >
            <div>
                <h3 className="flex items-center gap-2 font-bold text-white tracking-tight font-ui">
                    {process.properties.name}
                    {hasDrift && (
                        <span title="Governance Drift Detected" className="text-accent-orange flex items-center gap-1 text-[10px] bg-amber-900/20 px-2 py-0.5 rounded-sm border border-accent-orange/50 uppercase font-mono font-bold tracking-wider animate-pulse">
                            <AlertOctagon size={10} /> DRIFT
                        </span>
                    )}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">{process.properties.description}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
                <span className={`status-badge block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border font-mono ${process.status === 'active' ? 'bg-emerald-900/20 text-accent-valid border-accent-valid/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    {process.status}
                </span>
                <span className="step-count text-[10px] font-mono text-slate-600">{process.properties.steps.length} Steps</span>
            </div>
        </div>
    );
};

export const ProcessSearch: React.FC<ProcessSearchProps> = ({ onSelectProcess }) => {
    const { processes, searchProcesses, isLoading } = useExternalProcessData({ mode: 'mock' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Process[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Initial load
    React.useEffect(() => {
        setSearchResults(processes);
    }, [processes]);

    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim()) {
                setIsSearching(true);
                try {
                    const results = await searchProcesses(searchTerm);
                    setSearchResults(results);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(processes);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm, processes, searchProcesses]);

    const displayProcesses = searchResults || processes;

    return (
        <div className="process-search p-8 max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2 text-white tracking-tight font-ui">How Do I...</h1>
                <p className="text-text-secondary">Find and execute operational workflows.</p>
            </div>

            <div className="relative mb-8">
                <input
                    type="text"
                    placeholder="SEARCH PROCESSES..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input w-full p-4 pl-6 rounded-sm bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30 text-lg font-mono uppercase tracking-wide transition-all"
                    autoFocus
                />
                {(isLoading || isSearching) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-cyan text-xs font-mono animate-pulse">SEARCHING...</div>
                )}
            </div>

            <div className="results-list space-y-2">
                {displayProcesses.length === 0 && !isLoading && !isSearching && (
                    <div className="text-center p-8 border border-dashed border-slate-800 rounded-sm">
                        <p className="text-slate-600 font-mono">NO SIGNAL FOUND.</p>
                    </div>
                )}
                {displayProcesses.map(process => (
                    <ProcessListItem key={process.id} process={process} onSelect={onSelectProcess} />
                ))}
            </div>
        </div>
    );
};
