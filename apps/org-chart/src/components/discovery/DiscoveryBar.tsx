import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch, type SearchResult, type SearchFilters } from '../../hooks/useSearch';
import type { Node } from '@xyflow/react';

interface DiscoveryBarProps {
    nodes: Node[];
    onResultSelect: (result: SearchResult) => void;
    viewMode: 'reporting' | 'mission';
    onViewModeChange: (mode: 'reporting' | 'mission') => void;
}

export function DiscoveryBar({ nodes, onResultSelect, viewMode, onViewModeChange }: DiscoveryBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({ vacant: false, tigerTeams: false });
    const inputRef = useRef<HTMLInputElement>(null);

    const results = useSearch(nodes, query, filters);

    // Keyboard shortcut '/'
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !isFocused) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                inputRef.current?.blur();
                setIsFocused(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocused]);

    const handleSelect = (result: SearchResult) => {
        onResultSelect(result);
        setQuery('');
        setIsFocused(false);
        inputRef.current?.blur();
    };

    const toggleFilter = (key: keyof SearchFilters) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
        inputRef.current?.focus(); // Keep focus
    };

    return (
        <div
            className={`
                absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 transition-all duration-300
                ${isFocused || query ? 'w-[500px]' : 'w-[400px]'}
            `}
        >
            {/* Search Input Box */}
            <div className={`
                w-full h-10 bg-slate-900/90 backdrop-blur-md border rounded-sm shadow-none flex items-center px-3 gap-3 relative transition-colors
                ${isFocused ? 'border-accent-cyan ring-1 ring-accent-cyan/30' : 'border-slate-700 hover:border-slate-500'}
            `}>
                <Search size={16} className={isFocused ? "text-accent-cyan" : "text-slate-500"} />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="SEARCH (CMD+K)"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-sm font-mono h-full uppercase"
                />

                <div className="flex items-center gap-2">
                    {query && (
                        <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* View Mode Toggles */}
            {!isFocused && !query && (
                <div className="absolute -bottom-8 flex gap-2">
                    <button
                        onClick={() => onViewModeChange('reporting')}
                        className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-sm border transition-colors font-mono ${viewMode === 'reporting' ? 'bg-cyan-900/30 text-accent-cyan border-accent-cyan' : 'bg-slate-900/50 text-slate-500 border-slate-700 hover:border-slate-500'}`}
                    >
                        Reporting
                    </button>
                    <button
                        onClick={() => onViewModeChange('mission')}
                        className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-sm border transition-colors font-mono ${viewMode === 'mission' ? 'bg-amber-900/30 text-accent-orange border-accent-orange' : 'bg-slate-900/50 text-slate-500 border-slate-700 hover:border-slate-500'}`}
                    >
                        Mission
                    </button>
                </div>
            )}

            {/* Filter Chips (Visible when focused or filtering) */}
            {(isFocused || filters.vacant || filters.tigerTeams) && (
                <div className="w-full flex items-center gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                        onClick={() => toggleFilter('vacant')}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all font-mono
                            ${filters.vacant
                                ? 'bg-amber-900/20 border-accent-orange text-accent-orange'
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}
                        `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${filters.vacant ? 'bg-accent-orange' : 'bg-slate-500'}`} />
                        Vacancies
                    </button>

                    <button
                        onClick={() => toggleFilter('tigerTeams')}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all font-mono
                            ${filters.tigerTeams
                                ? 'bg-orange-900/20 border-orange-500 text-orange-500'
                                : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}
                        `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${filters.tigerTeams ? 'bg-orange-500' : 'bg-slate-500'}`} />
                        Tiger Teams
                    </button>
                </div>
            )}

            {/* Results Dropdown */}
            {isFocused && (query || filters.vacant || filters.tigerTeams) && (
                <div className="w-full mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-sm shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-0 flex items-center justify-between group transition-colors"
                            >
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-accent-cyan transition-colors font-ui tracking-tight">
                                        {result.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                        {result.subtitle}
                                    </div>
                                </div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded-sm border border-slate-800 font-mono">
                                    {result.type}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-sm text-slate-500 text-center flex flex-col items-center gap-2 font-mono">
                            <Search size={20} className="opacity-20" />
                            <span>NO SIGNAL FOUND</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
