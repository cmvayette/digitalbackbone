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
import { Edit2 } from 'lucide-react';

interface SwimlaneEditorProps {
    initialProcess?: Process;
    onBack?: () => void;
}

export const SwimlaneEditor: React.FC<SwimlaneEditorProps> = ({ initialProcess, onBack }) => {
    // Shared Data Hooks
    const { getCandidates } = useExternalOrgData({ mode: 'mock' });
    // (Note: Editor currently doesn't list obligations directly in the main view in the loop, 
    // mostly delegates to internal components, but we set it up anyway if needed later)

    // Basic Process State
    const [process, setProcess] = useState<Process>(initialProcess || {
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
            estimatedDuration: 3600,
            steps: [
                { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1', obligations: [] },
                { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2', obligations: [] },
            ]
        }
    });

    const [editingStepId, setEditingStepId] = useState<string | null>(null); // For Owner Picker
    const [detailsEditingStepId, setDetailsEditingStepId] = useState<string | null>(null); // For Modal
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

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
        if (issues.length === 0) {
            alert('Process is valid! (Mock Save)');
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
        <div className="swimlane-editor flex flex-col h-full bg-slate-900 text-slate-100 p-4">
            <div className="toolbar flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {onBack && <button className="text-slate-400 hover:text-slate-200" onClick={onBack}>← Back</button>}
                    <div>
                        <h1 className="text-xl font-bold">Process Designer</h1>
                        <p className="text-xs text-slate-500">Edit and validate your workflow.</p>
                    </div>
                </div>
                <div className="actions flex gap-2">
                    <button className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm hover:bg-slate-700" onClick={addStep}>+ Add Step</button>
                    <button
                        className={`px-3 py-1 rounded text-sm font-medium ${validationIssues.filter(i => i.type === 'error').length > 0 ? 'bg-red-600/50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
                        onClick={runValidation}
                    >
                        Validate & Save
                    </button>
                </div>
            </div>

            {validationIssues.length > 0 && (
                <div className="mb-4 bg-slate-800 border border-slate-700 rounded p-2">
                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-400" /> Validation Issues
                    </h4>
                    <div className="space-y-1">
                        {validationIssues.map((issue, idx) => (
                            <div key={idx} className={`text-xs flex items-center gap-2 ${issue.type === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                                {issue.type === 'error' ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                                {issue.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {detailsEditingStepId && (
                <EditStepModal
                    step={process.properties.steps.find(s => s.id === detailsEditingStepId)!}
                    onSave={updateStepDetails}
                    onCancel={() => setDetailsEditingStepId(null)}
                    onDelete={deleteStep}
                />
            )}
        </div>
    );
};
