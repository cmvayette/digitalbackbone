import React, { useState } from 'react';
import { useExternalProcessData } from '@som/api-client';
import type { Process } from '../types/process';
import { useDriftDetection } from '../hooks/useDriftDetection';
import { useGovernanceConfig } from '../hooks/useGovernanceConfig';
import { AlertOctagon } from 'lucide-react';

interface ProcessSearchProps {
    onSelectProcess: (process: Process) => void;
}

const ProcessListItem: React.FC<{ process: Process; onSelect: (p: Process) => void; relevance?: number; recommendationThreshold?: number }> = ({ process, onSelect, relevance = 0, recommendationThreshold = 10 }) => {
    const { hasDrift } = useDriftDetection(process);
    const isRecommended = relevance >= recommendationThreshold;

    return (
        <div
            className={`process-card flex justify-between items-center p-3 mb-2 bg-bg-panel/50 backdrop-blur-sm rounded-sm hover:bg-bg-surface/40 cursor-pointer border transition-all duration-200 group ${isRecommended ? 'border-accent-cyan/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-border-color hover:border-slate-500'}`}
            onClick={() => onSelect(process)}
        >
            <div>
                <h3 className="flex items-center gap-2 font-bold text-text-primary tracking-tight font-ui">
                    {process.properties.name}
                    {hasDrift && (
                        <span title="Governance Drift Detected" className="text-accent-orange flex items-center gap-1 text-[10px] bg-amber-900/20 px-2 py-0.5 rounded-sm border border-accent-orange/50 uppercase font-mono font-bold tracking-wider animate-pulse">
                            <AlertOctagon size={10} /> DRIFT
                        </span>
                    )}
                    {isRecommended && (
                        <span className="text-accent-cyan flex items-center gap-1 text-[10px] bg-cyan-900/20 px-2 py-0.5 rounded-sm border border-accent-cyan/50 uppercase font-mono font-bold tracking-wider">
                            RECOMMENDED
                        </span>
                    )}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">{process.properties.description}</p>
                {/* Debug Tags Display */}
                <div className="flex gap-1 mt-1">
                    {process.properties.tags?.map(tag => (
                        <span key={tag} className="text-[9px] text-text-secondary bg-bg-surface px-1 rounded">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
                <span className={`status-badge block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border font-mono ${process.status === 'active' ? 'bg-emerald-900/20 text-accent-valid border-accent-valid/30' : 'bg-bg-surface text-text-secondary border-border-color'}`}>
                    {process.status}
                </span>
                <span className="step-count text-[10px] font-mono text-slate-600">{process.properties.steps.length} Steps</span>
            </div>
        </div>
    );
};

// Mock User Context (In a real app, this comes from Auth store)
const MOCK_USER_CONTEXT = {
    rank: 'E-4',
    roleTag: 'Logistics',
    tags: ['Enlisted', 'Junior', 'Logistics']
};

// MOCK_USER_CONTEXT declaration remains


export const ProcessSearch: React.FC<ProcessSearchProps> = ({ onSelectProcess }) => {
    const { config } = useGovernanceConfig({ mode: 'mock' });

    // Dynamic Scoring with Tuner Config
    const calculateRelevance = (process: Process, context: typeof MOCK_USER_CONTEXT): number => {
        if (!config) return 0;

        let score = 0;
        const pTags = process.properties.tags || [];

        // Dynamic Weights from Governance Config
        const { rankMatch, roleMatch, tagMatch } = config.properties.search.weights;

        // Exact Rank Match
        if (pTags.includes(context.rank)) score += rankMatch;

        // Role/Domain Match
        if (pTags.includes(context.roleTag)) score += roleMatch;

        // Class Match (Enlisted vs Officer)
        if (pTags.some(t => context.tags.includes(t))) score += tagMatch;

        return score;
    };

    // Filter and Sort Logic
    React.useEffect(() => {
        if (!config) return; // Wait for config to load

        const baseList = processes;

        const filterAndSort = async () => {
            let results = baseList;
            if (searchTerm.trim()) {
                setIsSearching(true);
                results = await searchProcesses(searchTerm);
                setIsSearching(false);
            }

            // Apply Weighted Sort
            const sorted = [...results].sort((a, b) => {
                const scoreA = calculateRelevance(a, MOCK_USER_CONTEXT);
                const scoreB = calculateRelevance(b, MOCK_USER_CONTEXT);
                return scoreB - scoreA; // Descending
            });

            setDisplayProcesses(sorted);
        };

        filterAndSort();

    }, [searchTerm, processes, searchProcesses, config]);

    return (
        <div className="process-search p-8 max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2 text-text-primary tracking-tight font-ui">How Do I...</h1>
                <p className="text-text-secondary">Find and execute operational workflows.</p>
                <div className="mt-2 text-xs font-mono text-slate-500 bg-bg-panel inline-block px-2 py-1 rounded">
                    DETECTED CONTEXT: {MOCK_USER_CONTEXT.rank} / {MOCK_USER_CONTEXT.roleTag}
                </div>
            </div>

            <div className="relative mb-8">
                <input
                    type="text"
                    placeholder="SEARCH PROCESSES..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input w-full p-4 pl-6 rounded-sm bg-bg-panel/80 backdrop-blur-md border border-border-color text-text-primary placeholder:text-slate-600 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30 text-lg font-mono uppercase tracking-wide transition-all"
                    autoFocus
                />
                {(isLoading || isSearching) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-cyan text-xs font-mono animate-pulse">SEARCHING...</div>
                )}
            </div>

            <div className="results-list space-y-2">
                {displayProcesses.length === 0 && !isLoading && !isSearching && (
                    <div className="text-center p-8 border border-dashed border-border-color rounded-sm">
                        <p className="text-slate-600 font-mono">NO SIGNAL FOUND.</p>
                    </div>
                )}
                {displayProcesses.map(process => (
                    <ProcessListItem
                        key={process.id}
                        process={process}
                        onSelect={onSelectProcess}
                        relevance={config ? calculateRelevance(process, MOCK_USER_CONTEXT) : 0}
                        recommendationThreshold={config?.properties.search.recommendationMinScore}
                    />
                ))}
            </div>
        </div>
    );
};
