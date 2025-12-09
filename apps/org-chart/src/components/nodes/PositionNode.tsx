import { Handle, Position, useStore } from '@xyflow/react';
import type { NodeProps, ReactFlowState } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const zoomSelector = (s: ReactFlowState) => s.transform[2];

export function PositionNode({ data }: NodeProps<GraphNode>) {
    const zoom = useStore(zoomSelector);

    // Zoom Levels
    const showDetails = zoom >= 0.8;
    const showBasic = zoom >= 0.4;
    // < 0.4 shows only color block

    const roleTitle = data.label || 'Unknown Position';
    const personName = data.subtitle || 'Vacant';
    const isVacant = data.isVacant;
    const isFunctional = data.type === 'position' && (roleTitle.includes('Lead') || roleTitle.includes('Liaison') || data.label.includes('Lead'));

    // Highlight Status
    const highlight = data.highlightStatus;
    const isCompatible = highlight === 'compatible';
    const isIncompatible = highlight === 'incompatible';

    // Base classes
    const isDimmed = data.isDimmed;
    const dimmingClass = isDimmed ? "opacity-20 grayscale blur-[1px] pointer-events-none" : "opacity-100 grayscale-0 shadow-lg";

    const cardBase = clsx(
        "border rounded flex flex-col overflow-hidden transition-all duration-500 relative",
        dimmingClass
    );

    const mannedClasses = "bg-bg-panel border-slate-700";

    // Vacant base classes - handle highlighting
    const vacantDefault = "bg-bg-surface/50 border-dashed border-slate-700/50 opacity-90";
    const vacantCompatible = "bg-green-900/40 border-dashed border-accent-green ring-2 ring-accent-green/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] opacity-100 scale-105 z-10";

    // "Risky" / Incompatible but Droppable style
    const vacantIncompatible = "bg-orange-900/10 border-dashed border-orange-500/70 ring-2 ring-orange-500/20 opacity-100 z-10";

    const vacantClasses = isCompatible ? vacantCompatible : (isIncompatible ? vacantIncompatible : vacantDefault);

    // LOD 0: Minimal Block (Zoom < 0.4)
    if (!showBasic) {
        return (
            <div className={clsx("w-4 h-4 rounded-sm", isVacant ? (isCompatible ? "bg-accent-green" : "bg-slate-700 border border-slate-600") : "bg-accent-blue border border-blue-500")}>
                <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-1 !h-1 opacity-0" />
                <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-1 !h-1 opacity-0" />
            </div>
        );
    }

    // LOD 1: Basic Info (Zoom 0.4 - 0.8)
    if (!showDetails) {
        return (
            <div className={clsx("w-52 p-2 text-xs", cardBase, isVacant ? vacantClasses : mannedClasses)}>
                <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-2 !h-2" />
                <div className="flex items-center justify-between">
                    <div className="font-bold truncate max-w-[80%]">{roleTitle}</div>
                    {isCompatible && <CheckCircle2 size={12} className="text-accent-green animate-pulse" />}
                    {isIncompatible && <AlertTriangle size={12} className="text-orange-500" />}
                </div>
                <div className="text-text-secondary truncate">{personName}</div>
                <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-2 !h-2" />
            </div>
        );
    }

    // LOD 2: Full Detail (Zoom >= 0.8)
    // properties mapping
    const rank = data.properties?.rank || (isVacant ? 'Est. O-3 / GS-12' : 'Unknown Rank');
    const reportsTo = data.properties?.reportsTo || 'N/A';
    const location = data.properties?.location || 'Bldg 401, Coronado';
    const status = isVacant ? 'Open for 14 Days' : 'Active';

    return (
        <div className={clsx("w-96 p-3", cardBase, isVacant ? vacantClasses : mannedClasses)}>
            {/* Feedback Icon Overlay */}
            {isCompatible && (
                <div className="absolute top-2 right-2 text-accent-green animate-pulse bg-bg-panel/80 rounded-full p-1 border border-accent-green">
                    <CheckCircle2 size={20} />
                </div>
            )}
            {isIncompatible && (
                <div className="absolute top-2 right-2 text-orange-500 bg-bg-panel/80 rounded-full p-1 border border-orange-500">
                    <AlertTriangle size={20} />
                </div>
            )}

            <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-2 !h-2" />

            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="mb-1">
                        {isFunctional ? (
                            <span className="text-accent-green text-[10px] uppercase tracking-wider border border-green-900/50 px-1.5 py-0.5 rounded font-medium bg-green-900/10">Functional</span>
                        ) : (
                            <span className="text-accent-orange text-[10px] uppercase tracking-wider border border-orange-900/50 px-1.5 py-0.5 rounded font-medium bg-orange-900/10">Billet</span>
                        )}
                    </div>
                    <h3 className="font-bold text-base text-text-primary leading-tight mt-1">
                        {roleTitle}
                    </h3>
                </div>
            </div>

            {/* Identity */}
            <div className="flex items-center gap-3 mb-3">
                <div className={clsx(
                    "w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border",
                    isVacant ? "bg-transparent border-dashed border-slate-700 text-slate-600" : "bg-slate-700 border-transparent"
                )}>
                    {isVacant ? (
                        <span className="text-xl font-bold">?</span>
                    ) : (
                        <div className="text-[10px] text-text-secondary font-bold">IMG</div>
                    )}
                </div>
                <div className="flex flex-col">
                    {isVacant ? (
                        <span className="text-text-secondary font-bold text-[13px] uppercase tracking-wide">Vacant</span>
                    ) : (
                        <span className="font-semibold text-sm text-text-primary">{personName}</span>
                    )}
                    <span className="text-xs text-text-secondary">{rank}</span>
                </div>
            </div>

            {/* Context */}
            <div className="border-t border-slate-700/50 pt-2 mb-2">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Reports To:</span>
                    <span className="text-accent-orange font-medium cursor-pointer hover:underline">
                        {reportsTo}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                    <span>{isVacant ? "Status:" : "Location:"}</span>
                    <span>{isVacant ? status : location}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-1.5 rounded bg-transparent border border-slate-600 text-text-secondary text-xs font-medium hover:bg-slate-700 hover:text-text-primary transition-colors cursor-pointer">
                    {isVacant ? 'Requirements' : 'Connect'}
                </button>
                <button className="flex-1 py-1.5 rounded bg-transparent border border-slate-600 text-text-secondary text-xs font-medium hover:bg-slate-700 hover:text-text-primary transition-colors cursor-pointer">
                    {isVacant ? 'Suggest' : 'Profile'}
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-2 !h-2" />
        </div>
    );
}
