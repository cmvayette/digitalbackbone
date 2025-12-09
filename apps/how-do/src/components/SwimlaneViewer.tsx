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
        const candidates = getCandidates();
        const found = candidates.find(c => c.id === ownerId);
        const isAgent = ownerId.startsWith('agent-'); // Simple heuristic

        return {
            name: found ? found.name : ownerId,
            isAgent
        };
    };

    // 1. Identify Unique Owners (Rows)
    const uniqueOwners = Array.from(new Set(process.properties.steps.map(s => s.owner)));

    // Sort owners? Maybe Agents first, or just appearance order. Appearance order preserves flow logic better usually.
    // uniqueOwners.sort(); 

    return (
        <div className="swimlane-editor">
            <div className="toolbar">
                <button className="secondary-btn" onClick={onBack}>← Back</button>
                <h1>{process.properties.name} (View Only)</h1>
                <div className="actions">
                    <button className="primary-btn" onClick={onEdit}>Edit Process</button>
                </div>
            </div>

            <div className="swimlane-container">
                <div
                    className="swimlane-grid"
                    style={{
                        gridTemplateColumns: `250px repeat(${process.properties.steps.length}, 320px)`, // Header + 1 col per step
                        gridTemplateRows: `repeat(${uniqueOwners.length}, auto)`
                    }}
                >
                    {/* Render Lane Headers */}
                    {uniqueOwners.map((ownerId, rowIndex) => {
                        const { name, isAgent } = resolveOwnerName(ownerId);
                        return (
                            <div
                                key={`lane-${ownerId}`}
                                className="lane-header"
                                style={{ gridRow: rowIndex + 1, gridColumn: 1 }}
                            >
                                <div className={`lane-title ${isAgent ? 'agent-badge' : ''}`}>
                                    {isAgent ? "🤖 " : "👤 "}
                                    {name}
                                </div>
                            </div>
                        );
                    })}

                    {/* Render Steps */}
                    {process.properties.steps.map((step, index) => {
                        const ownerIndex = uniqueOwners.indexOf(step.owner);
                        const obligations = getObligationsForOwner(step.owner);
                        const { name: ownerName, isAgent } = resolveOwnerName(step.owner);

                        // Step Column = index + 2 (1 for header, then 1-based index)
                        const colStart = index + 2;

                        return (
                            <div
                                key={step.id}
                                className="step-wrapper"
                                style={{
                                    gridRow: ownerIndex + 1,
                                    gridColumn: colStart
                                }}
                            >
                                <StepCard
                                    step={step}
                                    index={index}
                                    ownerName={ownerName}
                                    isAgent={isAgent}
                                    obligations={obligations as any}
                                    viewMode="swimlane"
                                />

                                {/* Simple connector to next step if there is one */}
                                {index < process.properties.steps.length - 1 && (
                                    <div className="connector-line"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
