import React, { useState } from 'react';
import { SwimlaneEditor } from './components/SwimlaneEditorComponent';
import { SwimlaneViewer } from './components/SwimlaneViewer';
import { TimelineViewer } from './components/TimelineViewer';
import { ProcessSearch } from './components/ProcessSearch';
import { ProcessHealthDashboard } from './components/health/ProcessHealthDashboard';
import type { Process } from './types/process';
import { LayoutList, GitCommitHorizontal } from 'lucide-react';
import { GovernanceTuner } from './components/admin/GovernanceTuner';
import { Header } from './components/Header';

export type ViewMode = 'search' | 'viewer' | 'editor' | 'health' | 'admin';
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
      <Header view={view} setView={setView} />

      <div className="flex-1 overflow-auto relative bg-bg-canvas">
        {view === 'search' && (
          <ProcessSearch onSelectProcess={handleSelectProcess} />
        )}

        {view === 'health' && (
          <ProcessHealthDashboard />
        )}

        {view === 'admin' && (
          <div className="h-full bg-bg-canvas">
            <GovernanceTuner />
          </div>
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
