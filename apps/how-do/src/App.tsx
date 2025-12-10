import React, { useState } from 'react';
import './App.css';
import { SwimlaneEditor } from './components/SwimlaneEditorComponent';
import { SwimlaneViewer } from './components/SwimlaneViewer';
import { TimelineViewer } from './components/TimelineViewer';
import { ProcessSearch } from './components/ProcessSearch';
import { ProcessHealthDashboard } from './components/health/ProcessHealthDashboard';
import type { Process } from './types/process';
import { LayoutList, GitCommitHorizontal, Activity, Search, Edit3 } from 'lucide-react';

type ViewMode = 'search' | 'viewer' | 'editor' | 'health';
type ViewerType = 'swimlane' | 'timeline';

function App() {
  const [view, setView] = useState<ViewMode>('search');
  const [viewerType, setViewerType] = useState<ViewerType>('swimlane');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  const handleSelectProcess = (process: Process) => {
    setSelectedProcess(process);
    setView('viewer');
  };

  const handleEditProcess = () => {
    setView('editor');
  };

  const handleBackToSearch = () => {
    setSelectedProcess(null);
    setView('search');
  };

  const handleBackToViewer = () => {
    setView('viewer');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-canvas text-text-primary font-ui flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar - Glass Effect */}
      {(view === 'search' || view === 'health') && (
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
      )}

      <div className="flex-1 overflow-auto relative bg-bg-canvas">
        {view === 'search' && (
          <ProcessSearch onSelectProcess={handleSelectProcess} />
        )}

        {view === 'health' && (
          <ProcessHealthDashboard />
        )}

        {view === 'viewer' && selectedProcess && (
          <div className="h-full flex flex-col">
            {/* View Toggle - Positioned Absolute or in a Header */}
            <div className="absolute top-4 right-6 z-10 bg-slate-900/90 backdrop-blur rounded-sm p-1 flex border border-slate-700">
              <button
                onClick={() => setViewerType('swimlane')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${viewerType === 'swimlane'
                  ? 'bg-slate-800 text-accent-cyan shadow-sm border border-slate-600'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                title="Swimlane View"
              >
                <GitCommitHorizontal size={12} />
                Swimlane
              </button>
              <button
                onClick={() => setViewerType('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${viewerType === 'timeline'
                  ? 'bg-slate-800 text-accent-cyan shadow-sm border border-slate-600'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                title="Timeline View"
              >
                <LayoutList size={12} />
                Timeline
              </button>
            </div>

            {viewerType === 'swimlane' ? (
              <SwimlaneViewer
                process={selectedProcess}
                onEdit={handleEditProcess}
                onBack={handleBackToSearch}
              />
            ) : (
              <TimelineViewer
                process={selectedProcess}
                onEdit={handleEditProcess}
                onBack={handleBackToSearch}
              />
            )}
          </div>
        )}

        {view === 'editor' && (
          <div className="h-full bg-bg-canvas">
            <SwimlaneEditor
              initialProcess={selectedProcess || undefined}
              onBack={selectedProcess ? handleBackToViewer : handleBackToSearch}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
