import React, { useState } from 'react';
import { usePolicyStore } from './store/policyStore';
import { PolicyList } from './components/PolicyList';
import { PolicyEditor } from './components/editor/PolicyEditor';
import { ComplianceDashboard } from './components/dashboard/ComplianceDashboard';
import { Layout, FileText, BarChart2 } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExternalPolicyData } from './hooks/useExternalPolicyData';

const queryClient = new QueryClient();

function AppContent() {
  const { currentPolicy, selectPolicy, setPolicies } = usePolicyStore();
  const [view, setView] = React.useState<'list' | 'editor' | 'dashboard'>('list');

  // Use mock mode by default for now (or drive via env)
  const { policies, createPolicy, publishPolicy, addObligation, updateObligation } = useExternalPolicyData({ mode: 'mock' });

  // Sync external data to store
  React.useEffect(() => {
    setPolicies(policies);
  }, [policies, setPolicies]);

  // If a policy is selected in the store, we should probably be in editor mode if we were in list
  React.useEffect(() => {
    if (currentPolicy && view === 'list') {
      setView('editor');
    }
  }, [currentPolicy, view]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex text-sm">
      {/* Simple Sidebar Navigation */}
      <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 shrink-0 z-50">
        <div className="p-2 bg-blue-600 rounded-lg text-white mb-4">
          <Layout size={20} />
        </div>

        <button
          onClick={() => setView('dashboard')}
          className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-slate-800 text-blue-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Dashboard"
        >
          <BarChart2 size={20} />
        </button>

        <button
          onClick={() => setView('list')}
          className={`p-3 rounded-xl transition-all ${view === 'list' || view === 'editor' ? 'bg-slate-800 text-blue-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Policies"
        >
          <FileText size={20} />
        </button>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {view === 'dashboard' && <ComplianceDashboard />}
        {view === 'list' && (
          <PolicyList
            onSelectPolicy={() => setView('editor')}
            onCreatePolicy={createPolicy}
          />
        )}
        {view === 'editor' && (
          <PolicyEditor
            onBack={() => {
              selectPolicy(''); // Clear selection
              setView('list');
            }}
            onPublish={publishPolicy}
            onAddObligation={addObligation}
            onUpdateObligation={updateObligation}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
