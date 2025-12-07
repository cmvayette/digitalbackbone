import type { Node } from '@xyflow/react';
import { OrganizationSidebar } from './OrganizationSidebar';
import { PositionSidebar } from './PositionSidebar';
import { PersonSidebar } from './PersonSidebar';

interface SidebarPanelProps {
    selectedNode: Node | null;
    onClose?: () => void;
}

export function SidebarPanel({ selectedNode, onClose }: SidebarPanelProps) {
    if (!selectedNode) {
        return (
            <aside className="w-[400px] h-full bg-bg-panel border-l border-border-color p-8 flex items-center justify-center text-center hidden lg:flex flex-col">
                <div className="text-text-secondary">
                    <h2 className="text-lg font-bold text-text-primary mb-2">Inspector</h2>
                    <p className="text-sm">Select an organization, position, or person to view details.</p>
                </div>
            </aside>
        );
    }

    const type = selectedNode.type;

    return (
        <aside className="w-[400px] h-full bg-bg-panel border-l border-border-color flex flex-col shadow-xl z-20 relative">
            <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-bg-surface text-text-secondary z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            {/* Dynamic Content based on type */}
            {type === 'organization' && <OrganizationSidebar node={selectedNode} />}
            {type === 'position' && <PositionSidebar node={selectedNode} />}
            {type === 'person' && <PersonSidebar node={selectedNode} />}
            {/* Fallback */}
            {!['organization', 'position', 'person'].includes(type || '') && (
                <div className="p-4">Unknown node type: {type}</div>
            )}
        </aside>
    );
}
