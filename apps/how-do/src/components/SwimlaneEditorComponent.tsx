import React, { useState } from 'react';
import './SwimlaneEditor.css';
import mockData from '../mocks/mock-policy.json';
import { HolonType } from '@som/shared-types';
import type { Process } from '@som/shared-types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableStep } from './editor/SortableStep';
import { StepCard } from './viewer/StepCard';

const { policies, agents } = mockData;

interface SwimlaneEditorProps {
    initialProcess?: Process;
    onBack?: () => void;
}

export const SwimlaneEditor: React.FC<SwimlaneEditorProps> = ({ initialProcess, onBack }) => {
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
                { id: 'step-1', title: 'Initiate Request', description: 'Start the form', owner: 'pos-1' },
                { id: 'step-2', title: 'Review & Approve', description: 'Manager review', owner: 'pos-2' },
                { id: 'step-JIRA-123', title: 'Provision Hardware', description: 'IT Dept Ticket', owner: 'pos-3', source: 'external', externalId: 'JIRA-123', externalSource: 'jira' },
                { id: 'step-3', title: 'Finalize Logistics', description: 'Supply check', owner: 'pos-3' }
            ]
        }
    });

    const [editingStepId, setEditingStepId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Helper to find relevant obligations for a position
    const getObligationsForPosition = (posId: string) => {
        return policies.obligations.filter(o => o.assignedTo === posId);
    };

    const addStep = () => {
        const newStep = {
            id: `step-${Date.now()}`,
            title: 'New Step',
            description: 'Describe action',
            owner: 'pos-1' // Default to a human position
        };
        setProcess((prev: Process) => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: [...prev.properties.steps, newStep]
            }
        }));
    };

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

    return (
        <div className="swimlane-editor">
            <div className="toolbar">
                {onBack && <button className="secondary-btn" onClick={onBack}>← Back</button>}
                <h1>Process Designer</h1>
                <div className="actions">
                    <button className="primary-btn" onClick={addStep}>+ Add Step</button>
                    <button className="secondary-btn">Save Process</button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="canvas flex gap-4 overflow-x-auto pb-4">
                    <SortableContext
                        items={process.properties.steps.map(s => s.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {process.properties.steps.map((step, index) => {
                            const obligations = getObligationsForPosition(step.owner);
                            const isAgent = agents?.some(a => a.id === step.owner);
                            const ownerName = isAgent
                                ? agents.find(a => a.id === step.owner)?.name
                                : step.owner;

                            return (
                                <SortableStep key={step.id} id={step.id}>
                                    <div className="swimlane-column min-w-[300px]">
                                        <div className="swimlane-header flex justify-between items-center mb-2">
                                            <div className={`role-badge ${isAgent ? 'agent-badge' : ''}`}>
                                                {ownerName}
                                                {isAgent && " 🤖"}
                                            </div>

                                            {/* Inline Owner Edit Control (kept from original editor) */}
                                            <div className="step-controls relative">
                                                {editingStepId === step.id ? (
                                                    <select
                                                        autoFocus
                                                        value={step.owner}
                                                        onChange={(e) => updateStepOwner(step.id, e.target.value)}
                                                        onBlur={() => setEditingStepId(null)}
                                                        className="text-xs p-1 border rounded"
                                                    >
                                                        <optgroup label="Positions">
                                                            <option value="pos-1">pos-1</option>
                                                            <option value="pos-2">pos-2</option>
                                                            <option value="pos-3">pos-3</option>
                                                        </optgroup>
                                                        <optgroup label="Agents">
                                                            {agents?.map(agent => (
                                                                <option key={agent.id} value={agent.id}>
                                                                    {agent.name}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                ) : (
                                                    <button
                                                        className="text-xs text-slate-400 hover:text-blue-500"
                                                        onClick={() => setEditingStepId(step.id)}
                                                        aria-label="Edit Owner"
                                                    >
                                                        ✎ Change Owner
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <StepCard
                                            step={step}
                                            index={index}
                                            ownerName={ownerName}
                                            isAgent={isAgent}
                                            obligations={obligations as any}
                                            viewMode="swimlane"
                                        />

                                        {index < process.properties.steps.length - 1 && (
                                            <div className="connector-arrow text-center text-slate-400 mt-2">→</div>
                                        )}
                                    </div>
                                </SortableStep>
                            );
                        })}
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    );
};
