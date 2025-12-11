import React from 'react';
import { Search, Activity, Edit3, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine view from path
    const path = location.pathname;
    let view = 'search';
    if (path.startsWith('/health')) view = 'health';
    else if (path.startsWith('/admin')) view = 'admin';
    else if (path.startsWith('/editor')) view = 'editor';
    // else if (path.startsWith('/process')) view = 'search'; // Or 'process'? Original header didn't have 'process' specific tab highlighting other than search maybe? 
    // In original App.tsx, selecting a process set view to 'viewer'.
    // But the Header `if (view !== 'search' ...)` logic HID the header unless in those modes?
    // Wait, original Header.tsx line 11: `if (view !== 'search' && view !== 'health' && view !== 'admin') return null;`
    // So Header was HIDDEN in viewer mode?
    // Let's re-read the original View logic.
    // Yes, Step 94: `if (view !== 'search' && view !== 'health' && view !== 'admin') return null;`
    // Wait, `view` state could be 'viewer' or 'editor'.
    // So Header is NOT shown in Viewer or Editor?
    // Let's check App.tsx Step 89.
    // Line 41: `<Header view={view} setView={setView} />`
    // Line 12 defines ViewMode = 'search' | 'viewer' | 'editor' | 'health' | 'admin'.
    // So yes, Header was missing in Viewer and Editor.
    // BUT, the new layout might want it? The user didn't ask to change behavior, just refactor.
    // However, hiding the header seems like a specific design choice (distraction free).
    // Let's preserve that logic.

    const isHidden = path.startsWith('/process') || (path.startsWith('/editor') && path !== '/editor'); // Hide on viewer and editor?
    // Actually, simply map path to view.

    if (path.includes('/process/')) view = 'viewer';
    if (path.includes('/editor')) view = 'editor';

    // Original logic: Hide if NOT search/health/admin.
    // So if viewer or editor, return null.
    // Wait, if I'm on /editor (new process), I probably want header?
    // Original App.tsx: handleEditProcess -> setView('editor'). So Editor hides header.
    // Okay, I will respect that.

    if (view === 'viewer' || view === 'editor') return null;

    const navigateTo = (v: string) => {
        if (v === 'search') navigate('/');
        else navigate(`/${v}`);
    };

    return (
        <div className="h-14 border-b border-border-color flex items-center px-4 justify-between bg-bg-panel/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-accent-cyan rounded-sm shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                <div className="font-bold text-lg tracking-tight text-white uppercase font-ui">How-Do</div>
            </div>

            <div className="flex gap-1">
                <button
                    onClick={() => navigateTo('search')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${view === 'search' ? 'bg-cyan-900/20 text-accent-cyan border-accent-cyan/50' : 'bg-transparent text-text-secondary border-transparent hover:text-white hover:bg-slate-800'}`}
                >
                    <Search size={14} /> Discovery
                </button>
                <button
                    onClick={() => navigateTo('health')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${view === 'health' ? 'bg-amber-900/20 text-accent-orange border-accent-orange/50' : 'bg-transparent text-text-secondary border-transparent hover:text-white hover:bg-slate-800'}`}
                >
                    <Activity size={14} /> Health
                </button>
                <div className="w-px h-6 bg-slate-800 mx-1"></div>
                <button
                    onClick={() => navigateTo('editor')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border border-slate-700 bg-slate-900 text-text-secondary hover:text-white hover:border-slate-500`}
                >
                    <Edit3 size={14} /> New Process
                </button>
                <div className="w-px h-6 bg-slate-800 mx-1"></div>
                <button
                    onClick={() => navigateTo('admin')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${view === 'admin' ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-transparent text-slate-600 border-transparent hover:text-slate-400'}`}
                    title="Governance Administration"
                >
                    <Settings size={14} />
                </button>
            </div>
        </div>
    );
};
