import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { useTooltip, HolonTooltip } from '../tooltip/HolonTooltip';



export function OrganizationNode({ id, data }: NodeProps<GraphNode>) {
    const { tooltipState, showTooltip, hideTooltip } = useTooltip();

    // Data Properties
    const orgName = data.label || 'Unknown Organization';
    const uic = data.properties?.uic || data.subtitle || 'N/A';
    const commanderName = data.properties?.commanderName || 'Vacant';
    const parentOrg = data.properties?.parentOrg || 'Higher HQ';
    const isTigerTeam = data.properties?.isTigerTeam || false;
    const isCollapsed = data.collapsed || false;
    const onToggle = data.onToggle;
    const echelon = data.properties?.echelonLevel || 'Directorate';

    // Tier Logic
    const isCompact = echelon === 'Division'; // Tier 3
    const isCommand = echelon === 'Command';  // Tier 1

    // Metrics
    const totalSeats = data.properties?.stats?.totalSeats ?? 0;
    const vacancies = data.properties?.stats?.vacancies ?? 0;

    const onMouseEnter = (e: React.MouseEvent) => {
        showTooltip(e, (
            <div>
                <div className="font-bold text-text-primary mb-1">{orgName}</div>
                <div className="text-xs text-text-secondary">Click to view services and roster details.</div>
            </div>
        ));
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggle) onToggle(id);
    };

    return (
        <div
            className={clsx(
                "w-full h-full bg-bg-panel border rounded flex flex-col overflow-hidden group relative transition-all duration-200",
                isCompact ? "p-2" : "p-3 shadow-sm hover:shadow-md",
                isTigerTeam ? "border-amber-500/50 border-dashed" : "border-slate-700", // Subtler border
                // Command: Slightly lighter background header effect? Or just clean.
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={hideTooltip}
        >
            <HolonTooltip {...tooltipState} />
            <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-2 !h-2" />

            {/* Header */}
            <div className={clsx("flex justify-between items-start", isCompact ? "mb-1" : "mb-3")}>
                <div>
                    <span className={clsx(
                        "uppercase tracking-wider rounded font-semibold",
                        isCompact ? "text-[9px] text-text-secondary" : "text-[10px] px-1.5 py-0.5 bg-bg-surface text-text-secondary",
                        isTigerTeam && "text-amber-500 bg-transparent"
                    )}>
                        {uic}
                    </span>
                    <h3 className={clsx(
                        "font-semibold text-text-primary leading-tight mt-0.5",
                        isCompact ? "text-[13px]" : "text-base",
                        isCommand && "text-lg"
                    )}>
                        {orgName}
                    </h3>
                </div>
            </div>

            {/* Context */}
            <div className={clsx("mb-auto", isCompact ? "text-[10px]" : "text-xs text-text-secondary")}>
                <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-text-secondary">Cmdr:</span>
                    <span className="text-accent-orange font-medium cursor-pointer hover:underline truncate">
                        {commanderName}
                    </span>
                </div>
                {!isCompact && (
                    <div className="flex items-center gap-1">
                        <span className="text-text-secondary">Parent:</span>
                        <span className="text-accent-orange font-medium cursor-pointer hover:underline">
                            {parentOrg}
                        </span>
                    </div>
                )}
            </div>

            {/* Stats (Inline for Compact, Block for Standard) */}
            {isCompact ? (
                <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary border-t border-slate-700/50 pt-1.5">
                    <span><b>{totalSeats}</b> Seats</span>
                    <span className={vacancies > 0 ? "text-accent-orange font-bold" : ""}><b>{vacancies}</b> Vacant</span>
                </div>
            ) : (
                <div className="bg-bg-surface/50 p-2.5 rounded border border-transparent mb-3 mt-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-sm text-text-primary">{totalSeats}</span>
                            <span className="text-xs text-text-secondary">Total Seats</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className={clsx("font-bold text-sm", vacancies > 0 ? "text-accent-orange" : "text-text-primary")}>
                                {vacancies}
                            </span>
                            <span className="text-xs text-text-secondary">Vacancies</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions (Standard Only) */}
            {!isCompact && (
                <div className="flex gap-2 mt-auto">
                    <button className="flex-1 py-1 px-2 rounded bg-bg-surface border border-slate-700 text-text-secondary text-xs font-medium hover:bg-slate-700 hover:text-text-primary transition-colors">
                        View Details
                    </button>
                    <button className="flex-1 py-1 px-2 rounded bg-bg-surface border border-slate-700 text-text-secondary text-xs font-medium hover:bg-slate-700 hover:text-text-primary transition-colors">
                        Org Chart
                    </button>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-2 !h-2" />

            {/* Collapse Toggle */}
            <button
                onClick={handleToggle}
                className={clsx(
                    "absolute left-1/2 -translate-x-1/2 rounded-full bg-bg-panel border border-slate-600 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-slate-700 transition-colors z-50 cursor-pointer shadow-sm",
                    isCompact ? "w-5 h-5 -bottom-2.5" : "w-6 h-6 -bottom-3"
                )}
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
        </div>
    );
}
