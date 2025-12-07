import type { Node } from '@xyflow/react';

export function PersonSidebar({ node }: { node: Node }) {
    const data = node.data;

    return (
        <div className="flex flex-col h-full bg-bg-panel">
            <div className="p-6 border-b border-border-color">
                <h2 className="text-xl font-bold text-text-primary leading-tight">{String(data.label || 'Unknown')}</h2>
                <span className="text-sm text-text-secondary">{String((data.properties as any)?.rank || 'Rank')}</span>
            </div>

            <div className="p-6">
                <p className="text-sm text-text-secondary">Detailed person profile view coming soon.</p>
            </div>
        </div>
    );
}
