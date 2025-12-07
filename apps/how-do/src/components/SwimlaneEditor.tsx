import React, { useState } from 'react';
import './SwimlaneEditor.css';
import mockPolicy from '../mocks/mock-policy.json';

interface Step {
    id: string;
    name: string;
    description: string;
    ownerId: string; // Position ID mainly
    obligationId?: string;
}

interface Swimlane {
    id: string; // Position ID
    title: string;
    steps: Step[];
}

export const SwimlaneEditor: React.FC = () => {
    // Initial mock state
    const [lanes, setLanes] = useState<Swimlane[]>([
        {
            id: 'pos-1',
            title: 'Change Commander',
            steps: [
                { id: 's1', name: 'Approve Plan', description: 'Review and sign off', ownerId: 'pos-1' }
            ]
        },
        {
            id: 'pos-2',
            title: 'Operations Officer',
            steps: []
        },
        {
            id: 'pos-4',
            title: 'Training Officer',
            steps: []
        }
    ]);

    const handleAddStep = (laneId: string) => {
        const title = prompt("Enter step name:");
        if (!title) return;

        const newStep: Step = {
            id: `s-${Date.now()}`,
            name: title,
            description: 'New process step',
            ownerId: laneId
        };

        // Auto-link obligation if match found (simple keyword match for demo)
        const relevantObligation = mockPolicy.obligations.find(o =>
            o.assignedTo === laneId
        );

        if (relevantObligation) {
            newStep.obligationId = relevantObligation.id;
            newStep.description = `Satisfies: ${relevantObligation.statement.substring(0, 50)}...`;
        }

        setLanes(prev => prev.map(lane => {
            if (lane.id === laneId) {
                return { ...lane, steps: [...lane.steps, newStep] };
            }
            return lane;
        }));
    };

    const handleSave = () => {
        const processDefinedEvent = {
            type: 'ProcessDefined',
            payload: {
                processId: `proc-${Date.now()}`,
                name: 'New Standard Operating Procedure',
                steps: lanes.flatMap(l => l.steps.map(s => ({
                    name: s.name,
                    owner: s.ownerId,
                    obligationId: s.obligationId
                })))
            }
        };
        console.log('Emitting ProcessDefined:', processDefinedEvent);
        alert('Process Saved! Check console for event payload.');
    };

    return (
        <div className="swimlane-editor">
            <div className="editor-header">
                <h1 className="editor-title">Process Editor</h1>
                <p className="editor-subtitle">Define workflows and assign responsibilities</p>
            </div>

            <div className="kanban-board">
                {lanes.map(lane => (
                    <div key={lane.id} className="swimlane">
                        <div className="swimlane-header">{lane.title}</div>
                        {lane.steps.map(step => (
                            <div key={step.id} className="step-card">
                                <div className="step-title">{step.name}</div>
                                <div className="step-desc">{step.description}</div>
                                {step.obligationId && (
                                    <span className="obligation-badge">
                                        Has Linked Obligation
                                    </span>
                                )}
                            </div>
                        ))}
                        <button
                            className="add-step-btn"
                            onClick={() => handleAddStep(lane.id)}
                        >
                            + Add Step
                        </button>
                    </div>
                ))}
            </div>

            <div className="controls">
                <button className="save-btn" onClick={handleSave}>Publish Process</button>
            </div>
        </div>
    );
};
