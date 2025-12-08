import type { Node } from '@xyflow/react';
import { Briefcase, Building, Activity, Users } from 'lucide-react';
import { useState } from 'react';
import { useOrgStore } from '../../store/orgStore';
import type { Organization } from '../../types/domain';
import { CreateOrgModal } from '../modals/CreateOrgModal';
import { CreatePositionModal } from '../modals/CreatePositionModal';

export function OrganizationSidebar({ node }: { node: Node }) {
    const org = node.data.properties as Organization;
    const { getOrgChildren, getOrgPositions, addOrganization, addPosition } = useOrgStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatePosModalOpen, setIsCreatePosModalOpen] = useState(false);

    const children = getOrgChildren(org.id);
    const positions = getOrgPositions(org.id);

    const filledPositions = positions.filter(p => p.properties.state !== 'vacant').length;
    const vacancyCount = positions.filter(p => p.properties.state === 'vacant').length;
    const totalPositions = positions.length;

    return (
        <div className="flex flex-col h-full bg-bg-panel text-text-primary">
            {/* Header */}
            <div className="p-6 border-b border-border-color bg-gradient-to-b from-bg-surface to-bg-panel">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded border border-border-color bg-bg-canvas flex items-center justify-center font-bold text-text-secondary">
                        <Building size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{org.properties.name}</h2>
                        <span className="text-sm text-text-secondary uppercase tracking-wider">{org.properties.type}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Mission */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                        Mission
                    </h3>
                    <p className="text-sm text-text-primary leading-relaxed opacity-90">
                        {org.properties.missionStatement || 'No mission statement available.'}
                    </p>
                </section>

                {/* Health & Stats */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-surface p-3 rounded border border-border-color">
                        <span className="text-xs text-text-secondary block mb-1">Manning</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold">{Math.round((filledPositions / (totalPositions || 1)) * 100)}%</span>
                            <span className="text-xs text-text-secondary mb-1">filled</span>
                        </div>
                    </div>
                    <div className="bg-bg-surface p-3 rounded border border-border-color">
                        <span className="text-xs text-text-secondary block mb-1">Vacancies</span>
                        <div className="flex items-end gap-1">
                            <span className={`text-2xl font-bold ${vacancyCount > 0 ? 'text-accent-orange' : 'text-text-primary'}`}>
                                {vacancyCount}
                            </span>
                            <span className="text-xs text-text-secondary mb-1">open</span>
                        </div>
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

                {/* Services */}
                {org.properties.services.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Briefcase size={12} /> Functional Services
                        </h3>
                        <div className="space-y-2">
                            {org.properties.services.map((svc) => (
                                <div key={svc.id} className="flex items-center justify-between p-3 bg-bg-surface border border-border-color rounded hover:bg-slate-700 cursor-pointer transition-colors group">
                                    <span className="text-sm font-medium text-text-primary">{svc.name}</span>
                                    <Activity size={14} className="text-text-secondary group-hover:text-accent-green transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sub-Organizations Preview */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Users size={12} /> Structure
                    </h3>
                    <div className="bg-bg-surface rounded border border-border-color p-4 bg-opacity-40">
                        <div className="flex justify-between text-sm mb-2 pb-2 border-b border-border-color">
                            <span className="text-text-secondary">Direct Units</span>
                            <span className="font-mono">{children.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Direct Billets</span>
                            <span className="font-mono">{totalPositions}</span>
                        </div>
                    </div>
                </section>
            </div>

            <CreateOrgModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={(name, uic) => addOrganization(node.id, name, uic)}
                parentName={org.properties.name}
            />

            <CreatePositionModal
                isOpen={isCreatePosModalOpen}
                onClose={() => setIsCreatePosModalOpen(false)}
                onSubmit={(title, roleCode) => addPosition(node.id, title, roleCode)}
                parentName={org.properties.name}
            />
        </div>
    );
}
