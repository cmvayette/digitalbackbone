import type { Node } from '@xyflow/react';
import { User, Shield, Award } from 'lucide-react';
import { useState } from 'react';
import { useOrgStore } from '../../store/orgStore';
import type { Position } from '../../types/domain';
import { RosterBuilderPanel } from './RosterBuilderPanel';

export function PositionSidebar({ node }: { node: Node }) {
    const position = node.data.properties as Position;
    const { people } = useOrgStore();
    const [isRosterBuilderOpen, setIsRosterBuilderOpen] = useState(false);

    const occupant = position.properties.assignedPersonId ? people.find(p => p.id === position.properties.assignedPersonId) : null;
    const isVacant = position.properties.state === 'vacant';

    if (isRosterBuilderOpen) {
        return <RosterBuilderPanel position={position} onClose={() => setIsRosterBuilderOpen(false)} />;
    }

    return (
        <div className="flex flex-col h-full bg-bg-panel text-text-primary">
            {/* Header */}
            <div className="p-6 border-b border-border-color">
                <h2 className="text-xl font-bold leading-tight mb-2">{position.properties.title}</h2>
                <div className="flex gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border-color ${position.properties.billetStatus === 'funded' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {position.properties.billetStatus}
                    </span>
                    {position.properties.isLeadership && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-900/30 text-indigo-400 border border-indigo-500/30">
                            Key Leadership
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Occupant Status */}
                <section className="bg-bg-surface p-4 rounded border border-border-color">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Current Occupant</h3>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isVacant ? 'border-dashed border-border-color' : 'border-transparent bg-border-color overflow-hidden'}`}>
                            {occupant?.properties.avatarUrl ? (
                                <img src={occupant.properties.avatarUrl} alt={occupant.properties.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} className={isVacant ? 'text-text-secondary' : 'text-text-primary'} />
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-lg">{occupant ? occupant.properties.name : 'Vacant'}</div>
                            <div className="text-xs text-text-secondary">
                                {occupant ? `${occupant.properties.designatorRating} • ${occupant.properties.category}` : 'Open for assignment'}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Requirements */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Shield size={12} /> Requirements
                    </h3>
                    <ul className="text-sm space-y-3">
                        {position.properties.qualifications?.map((qual, idx) => (
                            <li key={idx} className="flex flex-col gap-1 text-text-primary">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${qual.strictness === 'mandatory' ? 'bg-red-400' : 'bg-accent-blue'}`} />
                                    <span>{qual.name}</span>
                                </div>
                                <span className="text-[10px] text-text-secondary ml-3.5 block">
                                    Source: {qual.source}
                                </span>
                            </li>
                        ))}
                        {(!position.properties.qualifications || position.properties.qualifications.length === 0) && (
                            <li className="text-text-secondary italic">No specific qualifications listed.</li>
                        )}
                    </ul>
                </section>

                {/* Actions */}
                {isVacant && (
                    <section className="mt-6 border-t border-border-color pt-6">
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Management</h3>
                        <button
                            onClick={() => setIsRosterBuilderOpen(true)}
                            className="w-full py-2 bg-accent-blue text-bg-panel rounded font-bold text-sm hover:bg-blue-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <Award size={16} />
                            <span>Find Eligible Candidates</span>
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}
