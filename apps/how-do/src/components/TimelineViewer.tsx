import { HolonType } from '@som/shared-types';
import React from 'react';
import type { Process } from '../types/process';
import { useExternalOrgData, useExternalPolicyData } from '@som/api-client';
import { CheckCircle2 } from 'lucide-react';
import { StepCard } from './viewer/StepCard';

interface TimelineViewerProps {
    process: Process;
    onEdit: () => void;
    onBack: () => void;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ process, onEdit, onBack }) => {
    // Shared Data Hooks
    const { getCandidates } = useExternalOrgData();
    const { getObligationsForOwner } = useExternalPolicyData();

    // Helper to resolve owner names
    const resolveOwnerName = (ownerId: string): { name: string; isAgent: boolean } => {
        const candidates = getCandidates();
        const found = candidates.find(c => c.id === ownerId);
        const isAgent = ownerId.startsWith('agent-');
        return {
            name: found ? found.name : ownerId,
            isAgent
        };
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    ← Back
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {process.properties.name}
                    </h1>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Timeline View</div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
                    >
                        Edit Process
                    </button>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto relative">

                    {/* Vertical Line */}
                    <div className="absolute left-8 top-4 bottom-0 w-0.5 bg-slate-700" />

                    {process.properties.steps.map((step, index) => {
                        const obligations = getObligationsForOwner(step.owner);
                        const { name: ownerName, isAgent } = resolveOwnerName(step.owner);

                        return (
                            <div key={step.id} className="relative pl-24 pb-12 group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                <StepCard
                                    step={step}
                                    index={index}
                                    ownerName={ownerName}
                                    isAgent={isAgent}
                                    obligations={obligations}
                                    viewMode="timeline"
                                />
                            </div>
                        );
                    })}

                    {/* End Cap */}
                    <div className="absolute left-4 -bottom-1 w-9 h-9 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center z-10">
                        <CheckCircle2 className="text-green-500" />
                    </div>

                </div>
            </div>
        </div>
    );
};
