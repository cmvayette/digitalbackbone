import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch, type SearchResult, type SearchFilters } from '../../hooks/useSearch';
import type { Node } from '@xyflow/react';

interface DiscoveryBarProps {
    nodes: Node[];
    onResultSelect: (result: SearchResult) => void;
}

export function DiscoveryBar({ nodes, onResultSelect }: DiscoveryBarProps) {
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
                w-full h-12 bg-slate-900 border rounded-lg shadow-lg flex items-center px-4 gap-3 relative transition-colors
                ${isFocused ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-slate-700'}
            `}>
                <Search size={18} className="text-slate-400" />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    // onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click
                    placeholder="Search organizations, people, or 'vacant'..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-50 placeholder:text-slate-500 text-sm h-full"
                />

                {/* Clear / Filter Actions */}
                <div className="flex items-center gap-2">
                    {query && (
                        <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Chips (Visible when focused or filtering) */}
            {(isFocused || filters.vacant || filters.tigerTeams) && (
                <div className="w-full flex items-center gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                        onClick={() => toggleFilter('vacant')}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                            ${filters.vacant
                                ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}
                        `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${filters.vacant ? 'bg-amber-500' : 'bg-slate-500'}`} />
                        Vacancies
                    </button>

                    <button
                        onClick={() => toggleFilter('tigerTeams')}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                            ${filters.tigerTeams
                                ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}
                        `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${filters.tigerTeams ? 'bg-orange-500' : 'bg-slate-500'}`} />
                        Tiger Teams
                    </button>
                </div>
            )}

            {/* Results Dropdown */}
            {isFocused && (query || filters.vacant || filters.tigerTeams) && (
                <div className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800 last:border-0 flex items-center justify-between group transition-colors"
                            >
                                <div>
                                    <div className="text-sm font-bold text-slate-50 group-hover:text-orange-500 transition-colors">
                                        {result.label}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {result.subtitle}
                                    </div>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    {result.type}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-sm text-slate-500 text-center flex flex-col items-center gap-2">
                            <Search size={24} className="opacity-20" />
                            <span>No results for your query.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
