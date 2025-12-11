import React from 'react';
import { FileText, BarChart2, Plus } from 'lucide-react';

type ViewType = 'list' | 'editor' | 'dashboard';

interface HeaderProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  onNewPolicy: () => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView, onNewPolicy }) => {
  return (
    <div className="h-14 border-b border-border-color flex items-center px-4 justify-between bg-bg-panel/80 backdrop-blur-md z-50">
      {/* Branding */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-6 bg-blue-500 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
        <div className="font-bold text-lg tracking-tight text-white uppercase font-ui">
          Policy & Governance
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setView('dashboard')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${
            view === 'dashboard'
              ? 'bg-blue-900/20 text-accent-blue border-accent-blue/50'
              : 'bg-transparent text-text-secondary border-transparent hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart2 size={14} /> Dashboard
        </button>

        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${
            view === 'list' || view === 'editor'
              ? 'bg-blue-900/20 text-accent-blue border-accent-blue/50'
              : 'bg-transparent text-text-secondary border-transparent hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText size={14} /> Policies
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1"></div>

        <button
          onClick={onNewPolicy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border border-slate-700 bg-slate-900 text-text-secondary hover:text-white hover:border-slate-500"
        >
          <Plus size={14} /> New Policy
        </button>
      </div>
    </div>
  );
};
