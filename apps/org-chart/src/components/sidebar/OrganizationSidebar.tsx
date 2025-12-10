import type { Node } from '@xyflow/react';
import { Building } from 'lucide-react';
import { useState } from 'react';
// import { useOrgStore } from '../../store/orgStore';
import { useExternalOrgData } from '@som/api-client';
import type { Organization } from '../../types/domain';
import { CreateOrgModal } from '../modals/CreateOrgModal';
import { CreatePositionModal } from '../modals/CreatePositionModal';
import { ServiceTile } from './ServiceTile';
import { toDomainPosition } from '../../utils/mappers';

export function OrganizationSidebar({ node }: { node: Node }) {
    const props = node.data.properties as Organization['properties'];
    const { organizations, positions } = useExternalOrgData({ mode: 'mock' });

    // const { getOrgChildren, getOrgPositions, addOrganization, addPosition } = useOrgStore();

    const addOrganization = (_parentId: string, _name: string, _uic: string) => console.log('Mock add org');
    const addPosition = (_orgId: string, _title: string, _roleCode: string) => console.log('Mock add pos');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatePosModalOpen, setIsCreatePosModalOpen] = useState(false);

    // Note: getOrgChildren expects orgId, but we only have props here.
    // We need the ID. The ID is on the node itself: node.id
    const children = organizations.filter(o => o.parentId === node.id);
    const orgPositions = positions
        .filter(p => p.orgId === node.id)
        .map(toDomainPosition);

    const filledPositions = orgPositions.filter(p => p.properties.state !== 'vacant').length;
    const vacancyCount = orgPositions.filter(p => p.properties.state === 'vacant').length;
    const totalPositions = orgPositions.length;

    return (
        <div className="flex flex-col h-full bg-bg-panel border-l border-border-color shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
            {/* Header: Max Density Unit Identity */}
            <div className="p-6 border-b border-border-color bg-gradient-to-b from-bg-surface to-bg-panel">
                <div className="flex items-center gap-4">
                    {/* Unit Logo */}
                    <div className="h-16 w-16 flex-shrink-0 rounded-full border border-border-color bg-bg-canvas flex items-center justify-center text-text-secondary font-bold shadow-sm">
                        <Building size={32} />
                    </div>
                    {/* Unit Title Block */}
                    <div className="flex flex-col justify-center">
                        <span className="font-mono text-[10px] text-orange-500 uppercase tracking-widest mb-0.5">
                            {props.type}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-50 leading-none mb-1 tracking-tight">
                            {props.name}
                        </h2>
                        {props.uics && (
                            <span className="text-xs text-slate-400 font-mono opacity-80">
                                {(props.uics || []).join(' • ') || 'NO UIC'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-900">

                {/* Services Grid - Issue 1.2 Integration */}
                {props.services?.length > 0 && (
                    <section>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                            Available Services & POCs
                        </h3>
                        <div className="flex flex-col gap-2">
                            {(props.services || []).map((svc) => (
                                <ServiceTile key={svc.id} service={svc} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Tiger Team Details - Issue 3.1 */}
                {props.isTigerTeam && (
                    <section className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                        <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2 font-mono">
                            Tiger Team Scope
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Duration</span>
                                <span className="text-sm font-medium text-slate-200">{props.duration || 'Indefinite'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Sponsor</span>
                                <span className="text-sm font-medium text-slate-200">{props.sponsorOrgId || 'Command'}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Mission */}
                <section>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2 font-mono">
                        Mission
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-3">
                        {props.missionStatement || 'No mission statement available.'}
                    </p>
                </section>

                {/* Health & Stats */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Manning</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-slate-50">{Math.round((filledPositions / (totalPositions || 1)) * 100)}%</span>
                            <span className="text-xs text-slate-500 mb-1">filled</span>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded border border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Vacancies</span>
                        <div className="flex items-end gap-1">
                            <span className={`text-2xl font-bold ${vacancyCount > 0 ? 'text-amber-500' : 'text-slate-50'}`}>
                                {vacancyCount}
                            </span>
                            <span className="text-xs text-slate-500 mb-1">open</span>
                        </div>
                    </div>
                </section>

                {/* Sub-Organizations Preview */}
                <section>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                        Structure
                    </h3>
                    <div className="bg-slate-800/50 rounded border border-slate-700 p-4">
                        <div className="flex justify-between text-sm mb-2 pb-2 border-b border-slate-700/50">
                            <span className="text-slate-400">Direct Units</span>
                            <span className="font-mono text-slate-200">{children.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Direct Billets</span>
                            <span className="font-mono text-slate-200">{totalPositions}</span>
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <section className="pt-4 border-t border-slate-800">
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded font-medium text-xs hover:bg-slate-700 hover:text-white transition-colors uppercase tracking-wide"
                        >
                            + Sub-Unit
                        </button>
                        <button
                            onClick={() => setIsCreatePosModalOpen(true)}
                            className="w-full py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded font-medium text-xs hover:bg-slate-700 hover:text-white transition-colors uppercase tracking-wide"
                        >
                            + Position
                        </button>
                    </div>
                </section>
            </div>

            <CreateOrgModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={(name, uic) => addOrganization(node.id, name, uic)}
                parentName={props.name}
            />

            <CreatePositionModal
                isOpen={isCreatePosModalOpen}
                onClose={() => setIsCreatePosModalOpen(false)}
                onSubmit={(title, roleCode) => addPosition(node.id, title, roleCode)}
                parentName={props.name}
            />
        </div>
    );
}
