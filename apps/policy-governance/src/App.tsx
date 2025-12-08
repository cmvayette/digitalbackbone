import { useState } from 'react';
import './App.css';
import { PolicyList } from './components/PolicyList';
import { PolicyEditor } from './components/editor/PolicyEditor';
import { usePolicyStore } from './store/policyStore';

function App() {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const { currentPolicy, selectPolicy, createPolicy } = usePolicyStore();

  const handleSelectPolicy = (id: string) => {
    selectPolicy(id);
    setView('editor');
  };

  const handleBack = () => {
    selectPolicy(''); // Clear selection (adjust store to handle empty string or null)
    setView('list');
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      {view === 'list' && <PolicyList onSelectPolicy={handleSelectPolicy} />}
      {view === 'editor' && <PolicyEditor onBack={handleBack} />}
    </div>
  );
}

export default App;
