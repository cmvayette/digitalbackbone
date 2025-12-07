import React, { useState } from 'react';
import './SwimlaneEditor.css';
import mockData from '../mocks/mock-policy.json';
import { HolonType } from '@som/shared-types';
// Access the nested structure correctly
const { policies } = mockData;
export const SwimlaneEditor = () => {
    // Basic Process State
    const [process, setProcess] = useState({
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
                { id: 'step-3', title: 'Finalize Logistics', description: 'Supply check', owner: 'pos-3' }
            ]
        }
    });
    // Helper to find relevant obligations for a position
    const getObligationsForPosition = (posId) => {
        return policies.obligations.filter(o => o.assignedTo === posId);
    };
    const addStep = () => {
        const newStep = {
            id: `step-${Date.now()}`,
            title: 'New Step',
            description: 'Describe action',
            owner: 'pos-1'
        };
        setProcess(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                steps: [...prev.properties.steps, newStep]
            }
        }));
    };
    return (<div className="swimlane-editor">
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
            return (<div key={step.id} className="swimlane-column">
                            <div className="swimlane-header">
                                <div className="role-badge">{step.owner}</div>
                            </div>

                            <div className="step-card">
                                <div className="step-number">{index + 1}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>

                            {obligations.length > 0 && (<div className="obligation-hint">
                                    <h4>Suggested Obligations:</h4>
                                    <ul>
                                        {obligations.map(obl => (<li key={obl.id}>
                                                <span className={`criticality-${obl.criticality}`}/>
                                                {obl.statement.substring(0, 50)}...
                                            </li>))}
                                    </ul>
                                </div>)}

                            {index < process.properties.steps.length - 1 && (<div className="connector-arrow">→</div>)}
                        </div>);
        })}
            </div>
        </div>);
};
