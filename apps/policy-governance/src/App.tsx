import React, { useState } from 'react';
import { usePolicyStore } from './store/policyStore';
import { PolicyList } from './components/PolicyList';
import { PolicyEditor } from './components/editor/PolicyEditor';
import { ComplianceDashboard } from './components/dashboard/ComplianceDashboard';
import { Header } from './components/Header';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExternalPolicyData } from './hooks/useExternalPolicyData';

const queryClient = new QueryClient();

function AppContent() {
  const { currentPolicy, selectPolicy, setPolicies } = usePolicyStore();
  const [view, setView] = React.useState<'list' | 'editor' | 'dashboard'>('dashboard');

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

  const handleNewPolicy = async () => {
    selectPolicy(''); // Clear selection
    await createPolicy({
      title: 'New Policy',
      documentType: 'Instruction',
      version: '0.1',
      sections: [],
      status: 'draft',
      obligations: []
    });
    setView('editor');
  };

  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary flex flex-col">
      <Header view={view} setView={setView} onNewPolicy={handleNewPolicy} />

      <main className="flex-1 overflow-hidden relative">
        {view === 'dashboard' && <ComplianceDashboard />}
        {view === 'list' && (
          <PolicyList
            onSelectPolicy={() => setView('editor')}
            onCreatePolicy={(p) => createPolicy({
              title: p.title || 'New Policy',
              documentType: p.documentType || 'Instruction',
              version: p.version || '0.1',
              sections: p.sections || [],
              status: 'draft',
              obligations: []
            })}
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
