import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExternalTaskData } from './hooks/useExternalTaskData';
import { useTaskStore } from './store/taskStore';
import { TaskInbox } from './components/TaskInbox';
import { ProjectList } from './components/ProjectList';
import { MyTasksView } from './components/MyTasksView';
import { CheckSquare, Folder, Layout, User } from 'lucide-react';

const queryClient = new QueryClient();

function AppContent() {
  const [view, setView] = React.useState<'inbox' | 'projects' | 'hub'>('hub');
  // Pass explicit mock or sync from env
  const { tasks, projects, isLoading, updateTaskStatus } = useExternalTaskData({ mode: 'mock' });
  const { setTasks, setProjects } = useTaskStore() as any; // Cast for extended setters

  // Sync hook data to store for components that rely on selectors
  React.useEffect(() => {
    if (tasks) setTasks(tasks);
    if (projects) setProjects(projects);
  }, [tasks, projects, setTasks, setProjects]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Tasks...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex text-sm">
      {/* Sidebar */}
      <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 shrink-0 z-50">
        <div className="p-2 bg-indigo-600 rounded-lg text-white mb-4">
          <Layout size={20} />
        </div>

        <button
          onClick={() => setView('hub')}
          className={`p - 3 rounded - xl transition - all ${view === 'hub' ? 'bg-slate-800 text-indigo-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'} `}
          title="My Hub"
        >
          <User size={20} />
        </button>

        <button
          onClick={() => setView('inbox')}
          className={`p - 3 rounded - xl transition - all ${view === 'inbox' ? 'bg-slate-800 text-indigo-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'} `}
          title="Position Inbox"
        >
          <CheckSquare size={20} />
        </button>

        <button
          onClick={() => setView('projects')}
          className={`p - 3 rounded - xl transition - all ${view === 'projects' ? 'bg-slate-800 text-indigo-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'} `}
          title="Projects"
        >
          <Folder size={20} />
        </button>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {view === 'hub' && <MyTasksView onUpdateStatus={updateTaskStatus} />}
        {view === 'inbox' && <TaskInbox onUpdateStatus={updateTaskStatus} />}
        {view === 'projects' && <ProjectList />}
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
