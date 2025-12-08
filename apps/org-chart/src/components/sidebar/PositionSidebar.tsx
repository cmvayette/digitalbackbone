import type { Node } from '@xyflow/react';
import { User } from 'lucide-react';
import { useState } from 'react';
import { useOrgMutations } from '../../hooks/useOrgMutations';
import { AssignPersonModal } from '../modals/AssignPersonModal';

export function PositionSidebar({ node }: { node: Node }) {
    const data = node.data;
    const isVacant = (data as any).isVacant;
    const { assignPerson } = useOrgMutations();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-bg-panel">
            <div className="p-6 border-b border-border-color">
                <h2 className="text-xl font-bold text-text-primary leading-tight mb-1">{String(data.label)}</h2>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-bg-surface text-text-secondary border border-border-color">
                    {String((data.properties as any)?.billetCode || 'Billet')}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Occupant Status */}
                <section className="bg-bg-surface p-4 rounded border border-border-color">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Current Occupant</h3>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isVacant ? 'border-dashed border-border-color' : 'border-transparent bg-border-color'}`}>
                            <User size={20} className={isVacant ? 'text-text-secondary' : 'text-text-primary'} />
                        </div>
                        <div>
                            <div className="font-bold text-text-primary">{(data as any).subtitle || 'Vacant'}</div>
                            <div className="text-xs text-text-secondary">{isVacant ? 'Open for 14 days' : 'Assigned'}</div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Requirements</h3>
                    <ul className="text-sm text-text-primary space-y-2 list-disc list-inside">
                        <li>Rank: {(data.properties as any)?.rank || 'O-3'}</li>
                        <li>Clearance: TS/SCI</li>
                        <li>Cert: DAWIA Level II</li>
                    </ul>
                </section>
                {/* Actions */}
                {isVacant && (
                    <section className="mt-6 border-t border-border-color pt-6">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Management</h3>
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="w-full py-2 bg-accent-blue text-bg-panel rounded font-bold text-sm hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Fill Position</span>
                        </button>
                    </section>
                )}
            </div>

            <AssignPersonModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSubmit={(name, rank) => assignPerson(node.id, name, rank)}
                positionTitle={data.label as string}
            />
        </div>
    );
}
