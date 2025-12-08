import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { Folder, Calendar, PieChart } from 'lucide-react';

export const ProjectList: React.FC = () => {
    const { projects } = useTaskStore();

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-950 text-slate-200">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white">Projects & Initiatives</h1>
                <p className="text-slate-400 text-sm">Strategic work containers.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-colors shadow-lg flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-900/30 text-indigo-400 rounded-lg">
                                <Folder size={20} />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${project.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                {project.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                        <p className="text-sm text-slate-400 mb-6 line-clamp-2">{project.description}</p>

                        <div className="mt-auto space-y-4">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Calendar size={12} /> Due {project.targetEndDate}</span>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-white font-bold">{project.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
