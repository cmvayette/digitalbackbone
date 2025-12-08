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
    <div className="app-container relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar (Visible in Search and Health modes) */}
      {(view === 'search' || view === 'health') && (
        <div className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur-sm z-50">
          <div className="font-bold text-xl tracking-tight text-blue-400">How-Do</div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'search' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Search size={18} /> Process Discovery
            </button>
            <button
              onClick={() => setView('health')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${view === 'health' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Activity size={18} /> Health Dashboard
            </button>
            <button
              onClick={() => setView('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800`}
            >
              <Edit3 size={18} /> New Process
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto relative">
        {view === 'search' && (
          <ProcessSearch onSelectProcess={handleSelectProcess} />
        )}

        {view === 'health' && (
          <ProcessHealthDashboard />
        )}

        {view === 'viewer' && selectedProcess && (
          <div className="h-full flex flex-col">
            {/* View Toggle */}
            <div className="absolute top-4 right-20 z-10 bg-slate-800 rounded-lg p-1 flex border border-slate-700 shadow-xl">
              <button
                onClick={() => setViewerType('swimlane')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewerType === 'swimlane'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
                title="Swimlane View"
              >
                <GitCommitHorizontal size={14} />
                Swimlane
              </button>
              <button
                onClick={() => setViewerType('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewerType === 'timeline'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
                title="Timeline View"
              >
                <LayoutList size={14} />
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
          <SwimlaneEditor
            initialProcess={selectedProcess || undefined}
            onBack={selectedProcess ? handleBackToViewer : handleBackToSearch}
          />
        )}
      </div>
    </div>
  );
}

export default App;
