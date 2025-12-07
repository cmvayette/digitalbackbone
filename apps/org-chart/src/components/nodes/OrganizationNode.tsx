import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNode } from '../../types/graph';
import clsx from 'clsx';

export function OrganizationNode({ data }: NodeProps<GraphNode>) {
    // Use data.properties to populate fields if available, fallbacks otherwise
    const orgName = data.label || 'Unknown Organization';
    const uic = data.properties?.uic || data.subtitle || 'N/A';
    const commanderName = data.properties?.commanderName || 'Vacant';
    const parentOrg = data.properties?.parentOrg || 'Higher HQ';
    const isTigerTeam = data.properties?.isTigerTeam || false;

    // Resource Metrics (Mocked for now if real data not present)
    const totalSeats = data.properties?.stats?.totalSeats ?? 0;
    const vacancies = data.properties?.stats?.vacancies ?? 0;

    return (
        <div className={clsx(
            "w-[350px] bg-bg-panel border rounded shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group",
            isTigerTeam ? "border-accent-purple border-dashed border-2" : "border-border-color"
        )}>
            {/* Input Handle (Top) */}
            <Handle type="target" position={Position.Top} className="!bg-border-color !w-3 !h-3" />

            {/* Header */}
            <div className="flex justify-between items-start p-3 pb-2">
                <div>
                    <span className={clsx(
                        "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold",
                        isTigerTeam ? "bg-accent-purple text-text-primary" : "bg-bg-surface text-text-secondary"
                    )}>
                        {isTigerTeam ? 'TIGER TEAM' : uic}
                    </span>
                    <h3 className="font-bold text-base text-text-primary mt-1 leading-tight">
                        {orgName}
                    </h3>
                </div>
            </div>

            {/* Context Links */}
            <div className="border-t border-border-color pt-2 px-3 pb-2 mb-2">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Commander:</span>
                    <span className="text-accent-orange font-medium cursor-pointer hover:underline">
                        {commanderName}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                    <span>Parent Org:</span>
                    <span className="text-accent-orange font-medium cursor-pointer hover:underline">
                        {parentOrg}
                    </span>
                </div>
            </div>

            {/* Stats Block (Resource View) */}
            <div className="mx-3 mb-3 bg-bg-surface p-2 rounded border-none">
                <span className="text-[10px] font-bold text-text-secondary uppercase block mb-2">
                    Manning Snapshot
                </span>
                <div className="flex justify-between">
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

            {/* Actions */}
            <div className="flex gap-2 px-3 pb-3 mt-auto">
                <button className="flex-1 py-1.5 rounded bg-accent-orange text-bg-panel text-xs font-semibold hover:bg-orange-400 transition-colors border-none cursor-pointer">
                    View Services
                </button>
                <button className="flex-1 py-1.5 rounded bg-bg-surface border border-border-color text-text-secondary text-xs font-semibold hover:bg-border-color hover:text-text-primary transition-colors cursor-pointer">
                    View Org Chart
                </button>
            </div>

            {/* Output Handle (Bottom) */}
            <Handle type="source" position={Position.Bottom} className="!bg-border-color !w-3 !h-3" />
        </div>
    );
}
