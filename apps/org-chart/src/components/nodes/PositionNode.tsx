import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';
import { HelpCircle } from 'lucide-react';



export function PositionNode({ data }: NodeProps<GraphNode>) {
    const roleTitle = data.label || 'Unknown Position';
    const personName = data.subtitle || 'Vacant';
    const isVacant = data.isVacant;
    const isFunctional = data.type === 'position' && (roleTitle.includes('Lead') || roleTitle.includes('Liaison')); // Simple heuristic for demo

    // Additional mock properties
    const rank = data.properties?.rank || (isVacant ? 'Est. O-3 / GS-12' : 'Unknown Rank');
    const reportsTo = data.properties?.reportsTo || 'N/A';
    const location = data.properties?.location || 'Bldg 401, Coronado';
    const status = isVacant ? 'Open for 14 Days' : 'Active';

    return (
        <div className={clsx(
            "w-[350px] bg-bg-panel border border-border-color rounded shadow-lg transition-all duration-200 flex flex-col overflow-hidden group hover:-translate-y-0.5 hover:shadow-xl",
            isVacant && "bg-bg-surface border-dashed opacity-90 border-2"
        )}>
            <Handle type="target" position={Position.Top} className="!bg-border-color !w-3 !h-3" />

            {/* Header */}
            <div className="flex justify-between items-start p-3 pb-2">
                <div>
                    <div className="flex gap-2 mb-1">
                        {isFunctional ? (
                            <span className="bg-accent-green text-bg-panel text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold">Functional</span>
                        ) : (
                            <span className="bg-accent-orange text-bg-panel text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold">Billet</span>
                        )}
                        {isVacant && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold">VACANT</span>
                        )}
                    </div>
                    <h3 className="font-bold text-base text-text-primary leading-tight">
                        {roleTitle}
                    </h3>
                </div>
            </div>

            {/* Identity */}
            <div className="flex items-center gap-3 px-3 mb-3">
                <div className={clsx(
                    "w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border-2",
                    isVacant ? "bg-transparent border-dashed border-border-color text-border-color" : "bg-border-color border-transparent"
                )}>
                    {isVacant ? <HelpCircle size={20} /> : <div className="text-[10px] text-text-secondary font-bold">IMG</div>}
                </div>
                <div className="flex flex-col">
                    <span className={clsx("font-semibold text-sm", isVacant ? "text-text-secondary uppercase tracking-wide font-bold text-[13px]" : "text-text-primary")}>
                        {personName}
                    </span>
                    <span className="text-xs text-text-secondary">{rank}</span>
                </div>
            </div>

            {/* Context */}
            <div className="border-t border-border-color pt-2 px-3 pb-2 mb-2">
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
            <div className="flex gap-2 px-3 pb-3 mt-auto">
                {isVacant ? (
                    <>
                        <button className="flex-1 py-1.5 rounded bg-bg-surface border border-border-color text-text-secondary text-xs font-semibold hover:bg-border-color hover:text-text-primary transition-colors cursor-pointer">
                            View Requirements
                        </button>
                        <button className="flex-1 py-1.5 rounded bg-bg-surface border border-border-color text-text-secondary text-xs font-semibold hover:bg-border-color hover:text-text-primary transition-colors cursor-pointer">
                            Suggest Candidate
                        </button>
                    </>
                ) : (
                    <>
                        <button className="flex-1 py-1.5 rounded bg-accent-orange text-bg-panel text-xs font-semibold hover:bg-orange-400 transition-colors border-none cursor-pointer">
                            Connect
                        </button>
                        <button className="flex-1 py-1.5 rounded bg-bg-surface border border-border-color text-text-secondary text-xs font-semibold hover:bg-border-color hover:text-text-primary transition-colors cursor-pointer">
                            View Profile
                        </button>
                    </>
                )}

            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-border-color !w-3 !h-3" />
        </div>
    );
}
