import type { Node } from '@xyflow/react';
import { Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useOrgMutations } from '../../hooks/useOrgMutations';
import { CreateOrgModal } from '../modals/CreateOrgModal';
import { CreatePositionModal } from '../modals/CreatePositionModal';

export function OrganizationSidebar({ node }: { node: Node }) {
    const data = node.data;
    const stats = (data.properties as any)?.stats || { totalSeats: 0, vacancies: 0 };
    const { addOrganization, addPosition } = useOrgMutations();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatePosModalOpen, setIsCreatePosModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-bg-panel">
            {/* Header */}
            <div className="p-6 border-b border-border-color bg-gradient-to-b from-bg-surface to-bg-panel">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded border border-border-color bg-bg-canvas flex items-center justify-center font-bold text-text-secondary">
                        ORG
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary leading-tight">{data.label}</h2>
                        <span className="text-sm text-text-secondary uppercase tracking-wider">{String((data.properties as any)?.uic || 'Unit')}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Mission */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Mission</h3>
                    <p className="text-sm text-text-primary leading-relaxed">
                        {(data.properties as any)?.description || 'No mission statement available.'}
                    </p>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-surface p-3 rounded border border-border-color">
                        <span className="text-xs text-text-secondary block mb-1">Total Seats</span>
                        <span className="text-2xl font-bold text-text-primary">{stats.totalSeats}</span>
                    </div>
                    <div className="bg-bg-surface p-3 rounded border border-border-color">
                        <span className="text-xs text-text-secondary block mb-1">Vacancies</span>
                        <span className="text-2xl font-bold text-accent-orange">{stats.vacancies}</span>
                    </div>
                </section>

                {/* Actions */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Management</h3>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full py-2 bg-accent-orange text-bg-panel rounded font-bold text-sm hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                        <span>Add Sub-Unit</span>
                    </button>
                    <button
                        onClick={() => setIsCreatePosModalOpen(true)}
                        className="w-full py-2 bg-bg-surface text-text-primary border border-border-color rounded font-bold text-sm hover:bg-bg-canvas transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Add Position</span>
                    </button>
                </section>

                {/* Services/Functions Mockup */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Functional Services</h3>
                    <div className="space-y-2">
                        {['Personnel Admin', 'Logistics Support', 'Travel Claims'].map((svc) => (
                            <div key={svc} className="flex items-center justify-between p-3 bg-bg-surface border border-border-color rounded hover:bg-slate-700 cursor-pointer transition-colors group">
                                <span className="text-sm font-medium text-text-primary">{svc}</span>
                                <Briefcase size={14} className="text-text-secondary group-hover:text-accent-orange transition-colors" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <CreateOrgModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={(name, uic) => addOrganization(node.id, name, uic)}
                parentName={data.label as string}
            />

            <CreatePositionModal
                isOpen={isCreatePosModalOpen}
                onClose={() => setIsCreatePosModalOpen(false)}
                onSubmit={(title, roleCode) => addPosition(node.id, title, roleCode)}
                parentName={data.label as string}
            />
        </div>
    );
}
