import React, { useState } from 'react';
import './SwimlaneEditor.css';
import { useExternalOrgData, useExternalPolicyData } from '@som/api-client';
import { HolonType } from '@som/shared-types';
import type { Process, ProcessStep } from '../types/process';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableStep } from './editor/SortableStep';
import { StepCard } from './viewer/StepCard';
import { OwnerPicker } from './editor/OwnerPicker';
import { ObligationLinker } from './editor/ObligationLinker';
import { validateProcess, ValidationIssue } from '../utils/ProcessValidator';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { DriftAlert } from './alerts/DriftAlert';
import { useDriftDetection } from '../hooks/useDriftDetection';
import { EditStepModal } from './editor/EditStepModal';
import { Edit2, Save } from 'lucide-react';
import { useProcessPersistence } from '../hooks/useProcessPersistence';

interface SwimlaneEditorProps {
    initialProcess?: Process;
    onBack?: () => void;
}

export const SwimlaneEditor: React.FC<SwimlaneEditorProps> = ({ initialProcess, onBack }) => {
    // Shared Data Hooks
    const { getCandidates } = useExternalOrgData({ mode: 'mock' });
    // (Note: Editor currently doesn't list obligations directly in the main view in the loop, 
    // mostly delegates to internal components, but we set it up anyway if needed later)

    // Persistence
    const { saveProcess, loadLastActiveProcess } = useProcessPersistence();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    // Basic Process State
    const [process, setProcess] = useState<Process>(() => {
        if (initialProcess) return initialProcess;
        const last = loadLastActiveProcess();
        if (last) return last;

        return {
            id: 'new-process',
            type: HolonType.Process,
            createdAt: new Date(),
            createdBy: 'user',
            status: 'active',
            sourceDocuments: [],
            properties: {
                name: "New Operational Workflow",
                description: "",
                inputs: [],
                outputs: [],
                tags: [],
                estimatedDuration: 3600,
                steps: [
                    { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1', obligations: [] },
                    { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2', obligations: [] },
                ]
            }
        };
    });

    const [editingStepId, setEditingStepId] = useState<string | null>(null); // For Owner Picker
    const [detailsEditingStepId, setDetailsEditingStepId] = useState<string | null>(null); // For Modal
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

    // Reset save status on change
    React.useEffect(() => {
        if (saveStatus !== 'idle') setSaveStatus('idle');
    }, [process]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const updateStepOwner = (stepId: string, newOwnerId: string) => {
        setProcess((prev: Process) => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: prev.properties.steps.map(step =>
                    step.id === stepId ? { ...step, owner: newOwnerId } : step
                )
            }
        }));
        setEditingStepId(null);
    };

    const updateStepObligations = (stepId: string, action: 'add' | 'remove', obligationData: any) => {
        setProcess((prev: Process) => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: prev.properties.steps.map(step => {
                    if (step.id !== stepId) return step;

                    const currentObligations = step.obligations || [];
                    let newObligations = [...currentObligations];

                    if (action === 'add') {
                        if (!newObligations.some(o => o.id === obligationData.id)) {
                            newObligations.push({ id: obligationData.id });
                        }
                    } else if (action === 'remove') {
                        newObligations = newObligations.filter(o => o.id !== obligationData.id);
                    }

                    return { ...step, obligations: newObligations };
                })
            }
        }));
    };

    const addStep = () => {
        const newStep: ProcessStep = {
            id: `step-${Date.now()}`,
            title: 'New Step',
            description: 'Describe action',
            owner: 'pos-1', // Default to a human position
            obligations: []
        };
        setProcess((prev: Process) => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: [...prev.properties.steps, newStep]
            }
        }));
    };

    const updateStepDetails = (updatedStep: ProcessStep) => {
        setProcess((prev: Process) => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: prev.properties.steps.map(step =>
                    step.id === updatedStep.id ? updatedStep : step
                )
            }
        }));
        setDetailsEditingStepId(null);
    };

    const deleteStep = (stepId: string) => {
        setProcess((prev: Process) => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: prev.properties.steps.filter(step => step.id !== stepId)
            }
        }));
        setDetailsEditingStepId(null);
    };

    // Drift Detection
    const drift = useDriftDetection(process);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setProcess((prev) => {
                const oldIndex = prev.properties.steps.findIndex((step) => step.id === active.id);
                const newIndex = prev.properties.steps.findIndex((step) => step.id === over?.id);

                return {
                    ...prev,
                    properties: {
                        ...prev.properties,
                        steps: arrayMove(prev.properties.steps, oldIndex, newIndex)
                    }
                };
            });
        }
    };

    const runValidation = () => {
        const issues = validateProcess(process);
        setValidationIssues(issues);

        const errors = issues.filter(i => i.type === 'error');
        if (errors.length === 0) {
            const success = saveProcess(process);
            setSaveStatus(success ? 'saved' : 'error');
            if (success) {
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        }
    };

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
        <div className="swimlane-editor flex flex-col h-full bg-transparent p-4 overflow-hidden">
            <div className="toolbar flex justify-between items-center mb-6 bg-slate-900/50 p-3 rounded-sm border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    {onBack && <button className="text-text-secondary hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1" onClick={onBack}>← Back</button>}
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">Process Designer</h1>
                        <p className="text-[10px] text-text-secondary font-mono uppercase tracking-wide">Edit and validate your workflow</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {saveStatus === 'saved' && <span className="text-xs text-emerald-400 font-bold animate-pulse">Saved Locally ✓</span>}
                    <button
                        className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all font-mono border flex items-center gap-2 ${validationIssues.filter(i => i.type === 'error').length > 0 ? 'bg-red-900/20 text-accent-critical border-accent-critical/50 cursor-not-allowed' : 'bg-emerald-900/20 text-accent-valid border-accent-valid/50 hover:bg-emerald-900/30'}`}
                        onClick={runValidation}
                    >
                        <Save size={12} />
                        Validate & Save
                    </button>
                </div>
            </div>


            {
                validationIssues.length > 0 && (
                    <div className="mb-4 bg-slate-900/80 border border-slate-700 rounded-sm p-3 backdrop-blur-md">
                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide font-mono">
                            <AlertTriangle size={14} className="text-accent-orange" /> Validation Issues
                        </h4>
                        <div className="space-y-1">
                            {validationIssues.map((issue, idx) => (
                                <div key={idx} className={`text-[10px] font-mono flex items-center gap-2 ${issue.type === 'error' ? 'text-accent-critical' : 'text-accent-orange'}`}>
                                    {issue.type === 'error' ? <AlertCircle size={10} /> : <AlertTriangle size={10} />}
                                    {issue.message}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Governance Drift Alert */}
            <div className="mb-4">
                <DriftAlert
                    issues={drift.issues}
                    onFix={(issue) => alert(`Mock fix for: ${issue.message}`)}
                />
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="canvas flex gap-4 overflow-x-auto pb-4 items-start min-h-[400px]">
                    <SortableContext
                        items={process.properties.steps.map(s => s.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {process.properties.steps.map((step, index) => {
                            const { name: ownerName, isAgent } = resolveOwnerName(step.owner);

                            const stepIssues = validationIssues.filter(i => i.stepId === step.id);
                            const hasError = stepIssues.some(i => i.type === 'error');

                            return (
                                <SortableStep key={step.id} id={step.id}>
                                    <div className={`swimlane-column min-w-[320px] p-2 rounded relative group ${hasError ? 'bg-red-900/10 border border-red-900/50' : ''}`}>
                                        <div className="swimlane-header flex justify-between items-center mb-2">
                                            <div className={`role-badge ${isAgent ? 'agent-badge' : ''} text-xs font-mono bg-slate-800 px-2 py-1 rounded`}>
                                                {ownerName}
                                                {isAgent && " 🤖"}
                                            </div>

                                            <div className="step-controls relative">
                                                {editingStepId === step.id ? (
                                                    <OwnerPicker
                                                        value={step.owner}
                                                        onChange={(newOwner) => updateStepOwner(step.id, newOwner)}
                                                        onClose={() => setEditingStepId(null)}
                                                    />
                                                ) : (
                                                    <button
                                                        className="text-[10px] text-slate-500 hover:text-blue-400 uppercase font-bold tracking-wider"
                                                        onClick={() => setEditingStepId(step.id)}
                                                    >
                                                        Change Owner
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setDetailsEditingStepId(step.id)}
                                                className="bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600"
                                                title="Edit Details"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>

                                        <StepCard
                                            step={step}
                                            index={index}
                                            ownerName={ownerName}
                                            isAgent={isAgent}
                                            obligations={[]} // We pass empty here because StepCard shows badges, but we want the linker below
                                            viewMode="swimlane"
                                        />

                                        <div className="mt-2 border-t border-slate-700/50 pt-2">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Obligations</div>
                                            <ObligationLinker
                                                linkedObligationIds={step.obligations || []}
                                                onLink={(obl) => updateStepObligations(step.id, 'add', obl)}
                                                onUnlink={(id) => updateStepObligations(step.id, 'remove', { id })}
                                            />
                                        </div>

                                        {index < process.properties.steps.length - 1 && (
                                            <div className="connector-arrow text-center text-slate-600 mt-4 text-2xl">→</div>
                                        )}
                                    </div>
                                </SortableStep>
                            );
                        })}
                    </SortableContext>
                </div>
            </DndContext>

            {
                detailsEditingStepId && (
                    <EditStepModal
                        step={process.properties.steps.find(s => s.id === detailsEditingStepId)!}
                        onSave={updateStepDetails}
                        onCancel={() => setDetailsEditingStepId(null)}
                        onDelete={deleteStep}
                    />
                )
            }
        </div >
    );
};
