import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { HolonTooltip } from '../tooltip/HolonTooltip';
import { useTooltip } from '../../hooks/useTooltip';



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
                "w-full h-full bg-slate-950/50 backdrop-blur-sm border rounded flex flex-col overflow-hidden group relative transition-all duration-200",
                isCompact ? "p-2" : "p-3",
                // Hover: brighter border, slight bg lift
                "hover:border-slate-500 hover:bg-slate-900/40",
                isTigerTeam ? "border-amber-500/50 border-dashed" : "border-slate-700",
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={hideTooltip}
        >
            <HolonTooltip {...tooltipState} />
            <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-2 !h-2" />

            {/* Header */}
            <div className={clsx("flex justify-between items-start", isCompact ? "mb-1" : "mb-3")}>
                <div>
                    <div className="flex gap-1 mb-0.5">
                        <span className={clsx(
                            "uppercase tracking-wider rounded font-mono font-medium",
                            isCompact ? "text-[9px] text-text-secondary" : "text-[10px] px-1.5 py-0.5 border border-slate-700 text-text-secondary",
                            isTigerTeam && "text-amber-500 border-amber-500/30"
                        )}>
                            {uic}
                        </span>
                        {!isCompact && (
                            <span className="text-[10px] px-1.5 py-0.5 border border-slate-700 text-cyan-400 rounded uppercase font-bold tracking-wider font-mono">
                                {echelon}
                            </span>
                        )}
                    </div>
                    <h3 className={clsx(
                        "font-semibold text-text-primary leading-tight mt-1 tracking-tight",
                        isCompact ? "text-[13px]" : "text-sm",
                        isCommand && "text-base"
                    )}>
                        {orgName}
                    </h3>
                </div>
            </div>

            {/* Context */}
            <div className={clsx("mb-auto", isCompact ? "text-[10px]" : "text-xs text-text-secondary")}>
                <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-text-secondary">Cmdr:</span>
                    <span className="text-white font-medium cursor-pointer hover:text-accent-cyan truncate">
                        {commanderName}
                    </span>
                </div>
                {!isCompact && (
                    <div className="flex items-center gap-1">
                        <span className="text-text-secondary">Parent:</span>
                        <span className="text-white font-medium cursor-pointer hover:text-accent-cyan">
                            {parentOrg}
                        </span>
                    </div>
                )}
            </div>

            {/* Stats (Inline for Compact, Block for Standard) */}
            {isCompact ? (
                <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary border-t border-slate-700/50 pt-1.5 font-mono">
                    <span><b className="text-white">{totalSeats}</b> Seats</span>
                    <span className={vacancies > 0 ? "text-accent-orange font-bold" : ""}><b>{vacancies}</b> Vacant</span>
                </div>
            ) : (
                <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800 mb-3 mt-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="font-bold text-sm text-text-primary">{totalSeats}</span>
                            <span className="text-[10px] uppercase text-text-secondary">Total</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 font-mono">
                            <span className={clsx("font-bold text-sm", vacancies > 0 ? "text-accent-orange" : "text-emerald-400")}>
                                {vacancies}
                            </span>
                            <span className="text-[10px] uppercase text-text-secondary">Vacant</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions (Standard Only) */}
            {!isCompact && (
                <div className="flex gap-2 mt-auto">
                    <button className="flex-1 py-1 px-2 rounded border border-slate-700 text-text-secondary text-[10px] uppercase tracking-wider font-medium hover:border-slate-500 hover:text-white transition-colors">
                        Details
                    </button>
                    <button className="flex-1 py-1 px-2 rounded border border-slate-700 text-text-secondary text-[10px] uppercase tracking-wider font-medium hover:border-slate-500 hover:text-white transition-colors">
                        Graph
                    </button>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-2 !h-2" />

            {/* Collapse Toggle */}
            <button
                onClick={handleToggle}
                className={clsx(
                    "absolute left-1/2 -translate-x-1/2 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-text-secondary hover:text-white hover:border-slate-400 transition-colors z-50 cursor-pointer",
                    isCompact ? "w-5 h-5 -bottom-2.5" : "w-6 h-6 -bottom-3"
                )}
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
        </div>
    );
}
