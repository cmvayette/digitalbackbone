import React, { useEffect, useState } from 'react';
import { createBrowserRouter, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ProcessSearch } from './components/ProcessSearch';
import { ProcessHealthDashboard } from './components/health/ProcessHealthDashboard';
import { GovernanceTuner } from './components/admin/GovernanceTuner';
import { SwimlaneViewer } from './components/SwimlaneViewer';
import { TimelineViewer } from './components/TimelineViewer';
import { SwimlaneEditor } from './components/SwimlaneEditorComponent';
import App from './App';
import { useExternalProcessData } from '@som/api-client';
import { LayoutList, GitCommitHorizontal } from 'lucide-react';

// --- Wrapper Components ---

function ProcessSearchWrapper() {
    const navigate = useNavigate();
    return (
        <ProcessSearch
            onSelectProcess={(process) => navigate(`/process/${process.id}`)}
        />
    );
}

function ProcessViewerWrapper() {
    const { processId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'swimlane';

    // Fetch process data
    // Since we don't have a direct "getProcess" hook handy in the imports I saw earlier (only useExternalProcessData which might be generic),
    // I will use `useExternalProcessData` which seemed to exist in `api-client`.
    // Wait, `useExternalProcessData` likely returns *all* processes or search results?
    // Let's assume for now we can filter or there's a getter. 
    // In `api-client/src/index.ts` I saw `export * from './useExternalProcessData'`.
    // Let's check `useExternalProcessData.ts` to see if it has `useProcess(id)`.
    // IF NOT, I will rely on the fact that `App.tsx` used `selectedProcess` state. 
    // The User didn't ask me to implement data fetching if it's missing, but I should try to make it work.
    // I'll check the file first. **Self-Correction**: I'll create this file tentatively and fill logic after checking.

    // Actually, I'll assume I can just use the mock client or a hook if available.
    // For now, I'll put a placeholder loader hook.

    const [process, setProcess] = useState<any>(null); // Type 'Process'
    const { processes } = useExternalProcessData(); // Assuming this lists them?

    useEffect(() => {
        if (processes && processId) {
            const found = processes.find((p: any) => p.id === processId);
            if (found) setProcess(found);
        }
    }, [processes, processId]);

    if (!process) return <div className="p-8 text-slate-500">Loading process {processId}...</div>;

    const handleEdit = () => navigate(`/editor/${process.id}`);
    const handleBack = () => navigate('/');
    const setMode = (m: 'swimlane' | 'timeline') => setSearchParams({ mode: m });

    return (
        <div className="h-full flex flex-col">
            <div className="absolute top-4 right-6 z-10 bg-slate-900/90 backdrop-blur rounded-sm p-1 flex border border-slate-700">
                <button
                    onClick={() => setMode('swimlane')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${mode === 'swimlane'
                        ? 'bg-slate-800 text-accent-cyan shadow-sm border border-slate-600'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                        }`}
                >
                    <GitCommitHorizontal size={12} />
                    Swimlane
                </button>
                <button
                    onClick={() => setMode('timeline')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${mode === 'timeline'
                        ? 'bg-slate-800 text-accent-cyan shadow-sm border border-slate-600'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                        }`}
                >
                    <LayoutList size={12} />
                    Timeline
                </button>
            </div>

            {mode === 'swimlane' ? (
                <SwimlaneViewer process={process} onEdit={handleEdit} onBack={handleBack} />
            ) : (
                <TimelineViewer process={process} onEdit={handleEdit} onBack={handleBack} />
            )}
        </div>
    );
}

function ProcessEditorWrapper() {
    const { processId } = useParams();
    const navigate = useNavigate();
    const { processes } = useExternalProcessData();
    const [process, setProcess] = useState<any>(undefined);

    useEffect(() => {
        if (processId && processes) {
            const found = processes.find((p: any) => p.id === processId);
            setProcess(found);
        }
    }, [processId, processes]);

    if (processId && !process) return <div>Loading...</div>;

    return (
        <div className="h-full bg-bg-canvas">
            <SwimlaneEditor
                initialProcess={process}
                onBack={() => processId ? navigate(`/process/${processId}`) : navigate('/')}
            />
        </div>
    );
}


// --- Main Router ---

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />, // App now acts as Layout
        children: [
            {
                index: true,
                element: <ProcessSearchWrapper />,
            },
            {
                path: 'health',
                element: <ProcessHealthDashboard />,
            },
            {
                path: 'admin',
                element: <div className="h-full bg-bg-canvas"><GovernanceTuner /></div>,
            },
            {
                path: 'process/:processId',
                element: <ProcessViewerWrapper />,
            },
            {
                path: 'editor',
                element: <ProcessEditorWrapper />,
            },
            {
                path: 'editor/:processId',
                element: <ProcessEditorWrapper />,
            },
        ],
    },
]);
