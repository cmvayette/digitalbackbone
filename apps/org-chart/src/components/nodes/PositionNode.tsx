import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';



export function PositionNode({ data }: NodeProps<GraphNode>) {
    const roleTitle = data.label || 'Unknown Position';
    const personName = data.subtitle || 'Vacant';
    const isVacant = data.isVacant;
    // Heuristic for "Functional" vs "Billet" - can be refined with data props
    const isFunctional = data.type === 'position' && (roleTitle.includes('Lead') || roleTitle.includes('Liaison') || data.label.includes('Lead'));

    // properties mapping
    const rank = data.properties?.rank || (isVacant ? 'Est. O-3 / GS-12' : 'Unknown Rank');
    const reportsTo = data.properties?.reportsTo || 'N/A';
    const location = data.properties?.location || 'Bldg 401, Coronado';
    const status = isVacant ? 'Open for 14 Days' : 'Active';

    // Base classes
    const cardBase = "w-[350px] border rounded flex flex-col overflow-hidden transition-colors duration-200 shadow-sm hover:shadow p-3";
    const mannedClasses = "bg-bg-panel border-slate-700";
    const vacantClasses = "bg-bg-surface/50 border-dashed border-slate-700/50 opacity-90"; // Ghost state softened

    return (
        <div className={clsx(cardBase, isVacant ? vacantClasses : mannedClasses)}>
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
