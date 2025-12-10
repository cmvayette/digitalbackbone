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
    const dimmingClass = isDimmed ? "opacity-20 grayscale blur-[1px] pointer-events-none" : "opacity-100 grayscale-0";

    const cardBase = clsx(
        "border rounded flex flex-col overflow-hidden transition-all duration-500 relative backdrop-blur-sm",
        dimmingClass
    );

    const mannedClasses = "bg-slate-950/50 border-slate-700 hover:border-slate-500 hover:bg-slate-900/40";

    // Vacant base classes - handle highlighting
    const vacantDefault = "bg-slate-900/30 border-dashed border-slate-700/50 opacity-90 hover:border-slate-500";
    const vacantCompatible = "bg-emerald-900/20 border-dashed border-accent-valid ring-1 ring-accent-valid/30 opacity-100 scale-105 z-10 box-shadow-[0_0_15px_rgba(52,211,153,0.1)]";

    // "Risky" / Incompatible but Droppable style
    const vacantIncompatible = "bg-amber-900/10 border-dashed border-accent-orange/70 ring-1 ring-accent-orange/20 opacity-100 z-10";

    const vacantClasses = isCompatible ? vacantCompatible : (isIncompatible ? vacantIncompatible : vacantDefault);

    // LOD 0: Minimal Block (Zoom < 0.4)
    if (!showBasic) {
        return (
            <div className={clsx("w-4 h-4 rounded-sm border",
                isVacant ? (isCompatible ? "bg-accent-valid border-accent-valid" : "bg-slate-900 border-slate-700") : "bg-cyan-900/50 border-cyan-500")}>
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
                    <div className="font-bold truncate max-w-[80%] font-ui tracking-tight text-white">{roleTitle}</div>
                    {isCompatible && <CheckCircle2 size={12} className="text-accent-valid animate-pulse" />}
                    {isIncompatible && <AlertTriangle size={12} className="text-accent-orange" />}
                </div>
                <div className="text-text-secondary truncate font-mono text-[10px]">{personName}</div>
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
                <div className="absolute top-2 right-2 text-accent-valid animate-pulse bg-slate-950/80 rounded-full p-1 border border-accent-valid">
                    <CheckCircle2 size={20} />
                </div>
            )}
            {isIncompatible && (
                <div className="absolute top-2 right-2 text-accent-orange bg-slate-950/80 rounded-full p-1 border border-accent-orange">
                    <AlertTriangle size={20} />
                </div>
            )}

            <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-2 !h-2" />

            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="mb-1">
                        {isFunctional ? (
                            <span className="text-accent-valid text-[10px] uppercase tracking-wider border border-accent-valid/30 px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-900/10">Functional</span>
                        ) : (
                            <span className="text-accent-orange text-[10px] uppercase tracking-wider border border-accent-orange/30 px-1.5 py-0.5 rounded font-mono font-medium bg-amber-900/10">Billet</span>
                        )}
                    </div>
                    <h3 className="font-bold text-base text-white leading-tight mt-1 tracking-tight">
                        {roleTitle}
                    </h3>
                </div>
            </div>

            {/* Identity */}
            <div className="flex items-center gap-3 mb-3">
                <div className={clsx(
                    "w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border",
                    isVacant ? "bg-transparent border-dashed border-slate-700 text-slate-600" : "bg-slate-800 border-slate-600 text-slate-400"
                )}>
                    {isVacant ? (
                        <span className="text-xl font-bold font-mono">?</span>
                    ) : (
                        <div className="text-[10px] text-text-secondary font-bold font-mono">IMG</div>
                    )}
                </div>
                <div className="flex flex-col">
                    {isVacant ? (
                        <span className="text-text-secondary font-bold text-[13px] uppercase tracking-wide font-mono">Vacant</span>
                    ) : (
                        <span className="font-semibold text-sm text-white">{personName}</span>
                    )}
                    <span className="text-xs text-text-secondary font-mono">{rank}</span>
                </div>
            </div>

            {/* Context */}
            <div className="border-t border-slate-700/50 pt-2 mb-2">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Reports To:</span>
                    <span className="text-white font-medium cursor-pointer hover:text-accent-cyan">
                        {reportsTo}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                    <span>{isVacant ? "Status:" : "Location:"}</span>
                    <span className="font-mono">{isVacant ? status : location}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-1 px-2 rounded border border-slate-700 text-text-secondary text-[10px] uppercase tracking-wider font-medium hover:border-slate-500 hover:text-white transition-colors cursor-pointer">
                    {isVacant ? 'Requirements' : 'Connect'}
                </button>
                <button className="flex-1 py-1 px-2 rounded border border-slate-700 text-text-secondary text-[10px] uppercase tracking-wider font-medium hover:border-slate-500 hover:text-white transition-colors cursor-pointer">
                    {isVacant ? 'Suggest' : 'Profile'}
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-2 !h-2" />
        </div>
    );
}
