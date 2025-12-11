import React from 'react';
import { Paperclip, ShieldAlert, GitBranch, CheckCircle2, User, FileText } from 'lucide-react';


interface StepCardProps {
    step: {
        id: string;
        title: string;
        description: string;
        owner: string;
        source?: 'native' | 'external';
        externalId?: string;
        externalSource?: string;
        attachments?: Array<{ name: string; url: string }>;
        decision?: { label: string; paths: string[] };
    };
    ownerName?: string;
    isAgent?: boolean;
    obligations?: Array<{ id: string; statement: string; criticality: 'high' | 'medium' | 'low' }>;
    index: number;
    viewMode?: 'swimlane' | 'timeline';
}

export const StepCard: React.FC<StepCardProps> = ({
    step,
    ownerName,
    isAgent,
    obligations = [],
    index,
    viewMode = 'swimlane'
}) => {
    return (
        <div className={`
            step-card-component relative bg-slate-800/50 border border-slate-700 rounded-lg p-5
            hover:border-slate-600 hover:bg-slate-800 transition-all shadow-lg backdrop-blur-sm
            ${viewMode === 'swimlane' ? 'min-w-[280px] w-full' : ''}
        `}>
            {/* Step Number Badge */}
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-800 border-2 border-blue-500 rounded-full flex items-center justify-center font-bold text-blue-400 shadow-md z-10 text-sm">
                {index + 1}
            </div>

            {/* Header: Owner & Type */}
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-3 pl-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isAgent ? <CheckCircle2 size={14} className="text-purple-400" /> : <User size={14} className="text-blue-400" />}
                    <span className={isAgent ? "text-purple-300" : "text-blue-300"}>
                        {ownerName || step.owner}
                    </span>
                </div>
                {step.source === 'external' && (
                    <span className="text-[10px] bg-slate-700/50 px-2 py-0.5 rounded text-slate-400 font-mono">
                        {step.externalSource}
                    </span>
                )}
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{step.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.description}</p>

            {/* Reference ID */}
            {step.source === 'external' && step.externalId && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 w-fit px-3 py-1.5 rounded mb-4">
                    <FileText size={12} />
                    ID: {step.externalId}
                </div>
            )}

            {/* Attachments */}
            {step.attachments && step.attachments.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        <Paperclip size={12} />
                        Attachments
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {step.attachments.map((att, i) => (
                            <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-300 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                <FileText size={10} />
                                {att.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Decision Tree Visualization */}
            {step.decision && (
                <div className="mb-4 bg-slate-900/40 p-3 rounded border border-slate-700/50 border-l-4 border-l-yellow-500">
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">
                        <GitBranch size={14} />
                        Decision Point
                    </div>
                    <p className="text-xs text-slate-300 italic mb-2">"{step.decision.label}"</p>
                    <div className="flex flex-col gap-1">
                        {step.decision.paths.map((path, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="text-yellow-600">↳</span>
                                {path}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Obligations */}
            {obligations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">
                        <ShieldAlert size={14} />
                        Obligations
                    </div>
                    <ul className="space-y-2">
                        {obligations.map(obl => (
                            <li key={obl.id} className="flex items-start gap-2 text-xs text-slate-400 bg-orange-950/20 px-3 py-2 rounded border border-orange-900/30 group cursor-help transition-colors hover:bg-orange-950/30">
                                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${obl.criticality === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                <span className="line-clamp-2 md:line-clamp-none transition-all">
                                    {obl.statement}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
