import React, { useState } from 'react';
import './App.css';
import { SwimlaneEditor } from './components/SwimlaneEditorComponent';
import { SwimlaneViewer } from './components/SwimlaneViewer';
import { ProcessSearch } from './components/ProcessSearch';
import type { Process } from '@som/shared-types';

type ViewMode = 'search' | 'viewer' | 'editor';

function App() {
  const [view, setView] = useState<ViewMode>('search');
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
    <div className="app-container">
      {view === 'search' && (
        <ProcessSearch onSelectProcess={handleSelectProcess} />
      )}

      {view === 'viewer' && selectedProcess && (
        <SwimlaneViewer
          process={selectedProcess}
          onEdit={handleEditProcess}
          onBack={handleBackToSearch}
        />
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
