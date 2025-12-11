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

    // 2. Permission Check
    const [permissions, setPermissions] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        const checkPermissions = async () => {
            // In a real app, use the actual authenticated user context
            const mockUser = {
                id: 'user-123',
                properties: { clearance: 'UNCLASSIFIED' } // Simulating low clearance
            };

            const client = (window as any).somClient || new (await import('@som/api-client')).SOMClient('http://localhost:3000/api/v1', { mode: 'real' });

            const checks = await Promise.all(process.properties.steps.map(async (step) => {
                // Heuristic: If step description contains "SECRET", classify it high
                const classification = step.description.includes('SECRET') ? 'SECRET' : 'UNCLASSIFIED';

                const allowed = await client.checkAccess({
                    user: mockUser,
                    resource: {
                        id: step.id,
                        type: 'Step', // or HolonType.Task
                        properties: { classification }
                    },
                    action: 'read'
                });
                return { id: step.id, allowed };
            }));

            const permMap: Record<string, boolean> = {};
            checks.forEach(c => permMap[c.id] = c.allowed);
            setPermissions(permMap);
        };

        checkPermissions();
    }, [process]);

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
                        const isAllowed = permissions[step.id] ?? true; // Default allow while loading

                        return (
                            <div
                                key={step.id}
                                className="step-wrapper"
                                style={{
                                    gridRow: ownerIndex + 1,
                                    gridColumn: colStart
                                }}
                            >
                                {isAllowed ? (
                                    <StepCard
                                        step={step}
                                        index={index}
                                        ownerName={ownerName}
                                        isAgent={isAgent}
                                        obligations={obligations as any}
                                        viewMode="swimlane"
                                    />
                                ) : (
                                    <div className="p-4 bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center h-full opacity-70">
                                        <span className="text-3xl">🔒</span>
                                        <span className="text-xs font-mono text-red-900 mt-2 uppercase tracking-widest font-bold">Redacted</span>
                                        <span className="text-[10px] text-slate-600 mt-1">Need-to-Know Required</span>
                                    </div>
                                )}

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
