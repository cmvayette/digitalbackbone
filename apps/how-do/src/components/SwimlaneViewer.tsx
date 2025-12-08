import React, { useState } from 'react';
import './SwimlaneEditor.css';
import { StepCard } from './viewer/StepCard';
import mockData from '../mocks/mock-policy.json';
import type { Process } from '../types/process';

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

                            <StepCard
                                step={step}
                                index={index}
                                ownerName={ownerName}
                                isAgent={isAgent}
                                obligations={obligations as any}
                                viewMode="swimlane"
                            />

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
