import React, { useState } from 'react';
import './SwimlaneEditor.css';
import mockData from '../mocks/mock-policy.json';
import { HolonType } from '@som/shared-types';
import type { Process } from '@som/shared-types';

const { agents, policies } = mockData;

interface SwimlaneViewerProps {
    process: Process;
    onEdit: () => void;
    onBack: () => void;
}

export const SwimlaneViewer: React.FC<SwimlaneViewerProps> = ({ process, onEdit, onBack }) => {

    // Helper to find relevant obligations for a position
    const getObligationsForPosition = (posId: string) => {
        return policies.obligations.filter(o => o.assignedTo === posId);
    };

    return (
        <div className="swimlane-editor">
            <div className="toolbar">
                <button className="secondary-btn" onClick={onBack}>← Back</button>
                <h1>{process.properties.name} (View Only)</h1>
                <div className="actions">
                    <button className="primary-btn" onClick={onEdit}>Edit Process</button>
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
                                    <h4>Obligations:</h4>
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
