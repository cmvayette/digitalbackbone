import React from 'react';
import { Search, Activity, Edit3 } from 'lucide-react';
import { ViewMode } from '../App';

interface HeaderProps {
    view: ViewMode;
    setView: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView }) => {
    if (view !== 'search' && view !== 'health') return null;

    return (
        <div className="h-14 border-b border-border-color flex items-center px-4 justify-between bg-bg-panel/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-accent-cyan rounded-sm shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                <div className="font-bold text-lg tracking-tight text-white uppercase font-ui">How-Do</div>
            </div>

            <div className="flex gap-1">
                <button
                    onClick={() => setView('search')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${view === 'search' ? 'bg-cyan-900/20 text-accent-cyan border-accent-cyan/50' : 'bg-transparent text-text-secondary border-transparent hover:text-white hover:bg-slate-800'}`}
                >
                    <Search size={14} /> Discovery
                </button>
                <button
                    onClick={() => setView('health')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${view === 'health' ? 'bg-amber-900/20 text-accent-orange border-accent-orange/50' : 'bg-transparent text-text-secondary border-transparent hover:text-white hover:bg-slate-800'}`}
                >
                    <Activity size={14} /> Health
                </button>
                <div className="w-px h-6 bg-slate-800 mx-1"></div>
                <button
                    onClick={() => setView('editor')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border border-slate-700 bg-slate-900 text-text-secondary hover:text-white hover:border-slate-500`}
                >
                    <Edit3 size={14} /> New Process
                </button>
            </div>
        </div>
    );
};
