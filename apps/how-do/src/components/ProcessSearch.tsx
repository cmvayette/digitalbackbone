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

    return (
        <div className="process-card flex justify-between items-center p-3 mb-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer border border-slate-700" onClick={() => onSelect(process)}>
            <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-200">
                    {process.properties.name}
                    {hasDrift && (
                        <span title="Governance Drift Detected" className="text-amber-500 flex items-center gap-1 text-[10px] bg-amber-900/30 px-2 py-0.5 rounded border border-amber-900/50 uppercase font-bold tracking-wider">
                            <AlertOctagon size={10} /> DRIFT
                        </span>
                    )}
                </h3>
                <p className="text-sm text-slate-400">{process.properties.description}</p>
            </div>
            <div className="text-right">
                <span className={`status-badge block mb-1 text-xs px-2 py-1 rounded ${process.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                    {process.status}
                </span>
                <span className="step-count text-xs text-slate-500">{process.properties.steps.length} Steps</span>
            </div>
        </div>
    );
};

export const ProcessSearch: React.FC<ProcessSearchProps> = ({ onSelectProcess }) => {
    const { processes } = useExternalProcessData();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProcesses = processes.filter(p =>
        p.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.properties.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="process-search p-4">
            <h1 className="text-xl font-bold mb-4 text-slate-100">How Do I...</h1>
            <input
                type="text"
                placeholder="Search for a process..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-100 mb-6 focus:outline-none focus:border-blue-500"
                autoFocus
            />

            <div className="results-list">
                {filteredProcesses.length === 0 && <p className="text-slate-500">No processes found.</p>}
                {filteredProcesses.map(process => (
                    <ProcessListItem key={process.id} process={process} onSelect={onSelectProcess} />
                ))}
            </div>
        </div>
    );
};
