import React, { useState } from 'react';
import { StrategyMap } from './components/views/StrategyMap';
import { ObjectiveComposer } from './components/composers/ObjectiveComposer';
import { Plus } from 'lucide-react';
import './App.css';

function App() {
  const [showObjectiveComposer, setShowObjectiveComposer] = useState(false);

  return (
    <div className="app-container min-h-screen bg-slate-950">
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowObjectiveComposer(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-lg flex items-center gap-2 font-bold transition-transform hover:scale-105"
        >
          <Plus size={24} /> New Objective
        </button>
      </div>

      <StrategyMap />

      {showObjectiveComposer && (
        <ObjectiveComposer onClose={() => setShowObjectiveComposer(false)} />
      )}
    </div>
  );
}

export default App;
