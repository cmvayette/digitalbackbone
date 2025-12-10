import React from 'react';
import { TaskInbox } from './components/TaskInbox';
import { useTaskStore } from './store/taskStore';
import { ProjectList } from './components/ProjectList';
import { MyTasksView } from './components/MyTasksView';
import { CheckSquare, Folder, Layout, User } from 'lucide-react';

function App() {
  const [view, setView] = React.useState<'inbox' | 'projects' | 'hub'>('hub');
  const { loadData } = useTaskStore();

  React.useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex text-sm">
      {/* Sidebar */}
      <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 shrink-0 z-50">
        <div className="p-2 bg-indigo-600 rounded-lg text-white mb-4">
          <Layout size={20} />
        </div>

        <button
          onClick={() => setView('hub')}
          className={`p-3 rounded-xl transition-all ${view === 'hub' ? 'bg-slate-800 text-indigo-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="My Hub"
        >
          <User size={20} />
        </button>

        <button
          onClick={() => setView('inbox')}
          className={`p-3 rounded-xl transition-all ${view === 'inbox' ? 'bg-slate-800 text-indigo-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Position Inbox"
        >
          <CheckSquare size={20} />
        </button>

        <button
          onClick={() => setView('projects')}
          className={`p-3 rounded-xl transition-all ${view === 'projects' ? 'bg-slate-800 text-indigo-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Projects"
        >
          <Folder size={20} />
        </button>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {view === 'hub' && <MyTasksView />}
        {view === 'inbox' && <TaskInbox />}
        {view === 'projects' && <ProjectList />}
      </main>
    </div>
  );
}

export default App;
