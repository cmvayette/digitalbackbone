import React from 'react';
import './SwimlaneEditor.css';
import { StepCard } from './viewer/StepCard';
import { useExternalOrgData, useExternalPolicyData } from '@som/api-client';
import type { Process } from '../types/process';

interface SwimlaneViewerProps {
    process: Process;
    onEdit: () => void;
    onBack: () => void;
}

export const SwimlaneViewer: React.FC<SwimlaneViewerProps> = ({ process, onEdit, onBack }) => {
    // Shared Data Hooks
    const { getCandidates } = useExternalOrgData();
    const { getObligationsForOwner } = useExternalPolicyData();

    // Helper to resolve owner names (Agents or Positions)
    const resolveOwnerName = (ownerId: string): { name: string; isAgent: boolean } => {
        // In this MVP, we assume Org/Position IDs are distinct.
        // Also, we don't have a direct "Agent" types in the Org hook yet,
        // so we'll check if the ownerId is an "Agent" ID pattern or rely on getCandidates()
        // For now, let's just search the candidates list.
        const candidates = getCandidates();
        const found = candidates.find(c => c.id === ownerId);

        // Simulating "Agent" detection by ID convention or type if we had it.
        // Real app would have a dedicated separate "Agents" hook or merged directory.
        // For MVP, if it starts with 'agent-', it's an agent.
        const isAgent = ownerId.startsWith('agent-');

        return {
            name: found ? found.name : ownerId,
            isAgent
        };
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
                    const obligations = getObligationsForOwner(step.owner);
                    const { name: ownerName, isAgent } = resolveOwnerName(step.owner);

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
