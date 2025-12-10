import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';
import { User, Award, Shield } from 'lucide-react';



export function PersonNode({ data }: NodeProps<GraphNode>) {
    const name = data.label || 'Unknown Person';
    const rank = data.properties?.rank || 'Unknown Rank';
    const primaryPosition = data.properties?.primaryPosition || 'No Position';
    // const qualifications = data.properties?.qualifications || [];
    const isQualMatch = data.properties?.isQualMatch !== false; // Default to true for now

    return (
        <div className="w-[300px] bg-slate-950/50 backdrop-blur-sm border border-slate-700 rounded flex flex-col overflow-hidden group hover:border-slate-500 hover:bg-slate-900/40 transition-all duration-200">
            <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-3 !h-3" />

            {/* Header / Identity */}
            <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-slate-400">
                    <User size={20} />
                </div>
                <div className="flex flex-col">
                    <h3 className="font-bold text-base text-white leading-tight tracking-tight">
                        {name}
                    </h3>
                    <span className="text-xs text-text-secondary font-mono font-medium">{rank}</span>
                </div>
            </div>

            {/* Context / Details */}
            <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Role:</span>
                    <span className="font-medium text-white truncate max-w-[180px] font-mono tracking-tight">{primaryPosition}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <span className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-1 border",
                        isQualMatch ? "bg-emerald-900/20 text-accent-valid border-accent-valid/30" : "bg-red-900/20 text-accent-critical border-accent-critical/30"
                    )}>
                        <Shield size={10} />
                        {isQualMatch ? 'Qualified' : 'Qual Mismatch'}
                    </span>
                    {/* Placeholder for other badges */}
                    <span className="text-[10px] bg-slate-800/50 border border-slate-700 text-text-secondary px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Award size={10} />
                        Active
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-3 !h-3" />
        </div>
    );
}
