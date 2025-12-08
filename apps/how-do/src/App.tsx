import React, { useState } from 'react';
import './App.css';
import { SwimlaneEditor } from './components/SwimlaneEditorComponent';
import { SwimlaneViewer } from './components/SwimlaneViewer';
import { TimelineViewer } from './components/TimelineViewer';
import { ProcessSearch } from './components/ProcessSearch';
import type { Process } from '@som/shared-types';
import { LayoutList, GitCommitHorizontal } from 'lucide-react';

type ViewMode = 'search' | 'viewer' | 'editor';
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
    <div className="app-container relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {view === 'search' && (
        <ProcessSearch onSelectProcess={handleSelectProcess} />
      )}

      {view === 'viewer' && selectedProcess && (
        <div className="h-full flex flex-col">
          {/* View Toggle - Absolute positioned or in a top bar */}
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
  );
}

export default App;
