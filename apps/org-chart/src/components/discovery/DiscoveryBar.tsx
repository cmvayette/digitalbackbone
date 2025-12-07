import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch, type SearchResult } from '../../hooks/useSearch';
import type { Node } from '@xyflow/react';

interface DiscoveryBarProps {
    nodes: Node[];
    onResultSelect: (result: SearchResult) => void;
}

export function DiscoveryBar({ nodes, onResultSelect }: DiscoveryBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const results = useSearch(nodes, query);

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

    return (
        <div
            className={`
                absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 transition-all duration-300
                ${isFocused ? 'w-[500px]' : 'w-[400px]'}
            `}
        >
            {/* Search Input Box */}
            <div className={`
                w-full h-12 bg-bg-panel border rounded-lg shadow-lg flex items-center px-4 gap-3 relative
                ${isFocused ? 'border-accent-orange ring-1 ring-accent-orange' : 'border-border-color'}
            `}>
                <Search size={18} className="text-text-secondary" />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    // onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click
                    placeholder="Search organizations, people, positions... (/)"
                    className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary text-sm h-full"
                />

                {query && (
                    <button onClick={() => setQuery('')} className="text-text-secondary hover:text-text-primary">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isFocused && query && (
                <div className="w-full mt-2 bg-bg-panel border border-border-color rounded-lg shadow-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                className="w-full text-left px-4 py-3 hover:bg-bg-surface border-b border-border-color last:border-0 flex items-center justify-between group"
                            >
                                <div>
                                    <div className="text-sm font-bold text-text-primary group-hover:text-accent-orange transition-colors">
                                        {result.label}
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                        {result.subtitle}
                                    </div>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary bg-bg-canvas px-1.5 py-0.5 rounded border border-border-color">
                                    {result.type}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-4 text-sm text-text-secondary text-center">
                            No results found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
