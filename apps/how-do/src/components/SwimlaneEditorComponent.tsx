import React, { useState } from 'react';
import './SwimlaneEditor.css';
import mockData from '../mocks/mock-policy.json';
import { HolonType } from '@som/shared-types';
import type { Process } from '@som/shared-types';

const { policies, agents } = mockData;

export const SwimlaneEditor: React.FC = () => {
    // Basic Process State
    const [process, setProcess] = useState<Process>({
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

    return (
        <div className="swimlane-editor">
            <div className="toolbar">
                <h1>Process Designer</h1>
                <div className="actions">
                    <button className="primary-btn" onClick={addStep}>+ Add Step</button>
                    <button className="secondary-btn">Save Process</button>
                </div>
            </div>

            <div className="canvas">
                {process.properties.steps.map((step, index) => {
                    const obligations = getObligationsForPosition(step.owner);
                    const isAgent = agents?.some(a => a.id === step.owner);
                    const ownerName = isAgent
                        ? agents.find(a => a.id === step.owner)?.name
                        : step.owner;

                    return (
                        <div key={step.id} className="swimlane-column">
                            <div className="swimlane-header">
                                <div className={`role-badge ${isAgent ? 'agent-badge' : ''}`}>
                                    {ownerName}
                                    {isAgent && " 🤖"}
                                </div>
                            </div>

                            <div className="step-card">
                                <div className="step-number">{index + 1}</div>

                                <div className="step-controls">
                                    {editingStepId === step.id ? (
                                        <select
                                            autoFocus
                                            value={step.owner}
                                            onChange={(e) => updateStepOwner(step.id, e.target.value)}
                                            onBlur={() => setEditingStepId(null)}
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
                                            className="edit-owner-btn"
                                            onClick={() => setEditingStepId(step.id)}
                                            aria-label="Edit Owner"
                                        >
                                            ✎
                                        </button>
                                    )}
                                </div>

                                <h3>
                                    {step.source === 'external' && (
                                        <span className="proxy-badge" title={`Source: ${step.externalSource}`}>
                                            {step.externalSource || 'EXT'}
                                        </span>
                                    )}
                                    {step.title}
                                </h3>
                                {(step.source === 'external' && step.externalId) && (
                                    <div className="external-ref" style={{ fontSize: '0.8em', color: '#666', marginBottom: '4px' }}>
                                        REF: {step.externalId}
                                    </div>
                                )}
                                <p>{step.description}</p>
                            </div>

                            {obligations.length > 0 && (
                                <div className="obligation-hint">
                                    <h4>Suggested Obligations:</h4>
                                    <ul>
                                        {obligations.map(obl => (
                                            <li key={obl.id}>
                                                <span className={`criticality-${obl.criticality}`} />
                                                {obl.statement.substring(0, 50)}...
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {index < process.properties.steps.length - 1 && (
                                <div className="connector-arrow">→</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
