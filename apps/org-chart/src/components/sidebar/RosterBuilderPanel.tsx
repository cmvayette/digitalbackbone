import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, User, Award, Circle } from 'lucide-react';
import type { Position } from '../../types/domain';
import { useOrgStore } from '../../store/orgStore';
import { reconcileCompetence } from '../../utils/reconciliation';

interface RosterBuilderPanelProps {
    position: Position;
    onClose: () => void;
}

export function RosterBuilderPanel({ position, onClose }: RosterBuilderPanelProps) {
    const { people, assignPerson } = useOrgStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter people and calculate scores
    const candidates = people
        .filter(p =>
            p.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.properties.designatorRating.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(person => {
            const match = reconcileCompetence(person, position);
            return { person, match };
        })
        .sort((a, b) => b.match.score - a.match.score); // Sort by best match

    return (
        <div className="flex bg-bg-panel h-full border-t border-border-color">
            {/* Left Column: Requirements */}
            <div className="w-1/3 border-r border-border-color p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={12} /> Requirements
                </h3>
                <div className="space-y-4">
                    {position.properties.qualifications?.length === 0 && (
                        <p className="text-sm text-text-secondary italic">No explicit qualifications.</p>
                    )}
                    {position.properties.qualifications?.map((qual, idx) => (
                        <div key={idx} className="bg-bg-surface p-3 rounded border border-border-color">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${qual.strictness === 'mandatory' ? 'bg-red-500' : 'bg-blue-400'}`} />
                                <span className="font-bold text-sm">{qual.name}</span>
                            </div>
                            <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                                {qual.source}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Talent Pool */}
            <div className="w-2/3 p-4 flex flex-col">
                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search personnel..."
                        className="w-full bg-bg-surface border border-border-color rounded p-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {candidates.map(({ person, match }) => {
                        const isHighLoad = person.properties.workLoad >= 80;
                        const scoreColor = match.score === 100 ? 'text-green-400' : match.score > 50 ? 'text-yellow-400' : 'text-red-400';

                        return (
                            <div key={person.id} className="bg-bg-surface p-3 rounded border border-border-color hover:bg-bg-canvas transition-colors group flexflex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-border-color flex items-center justify-center overflow-hidden">
                                                {person.properties.avatarUrl ? (
                                                    <img src={person.properties.avatarUrl} alt={person.properties.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} className="text-text-secondary" />
                                                )}
                                            </div>
                                            {/* Load Dot */}
                                            <div
                                                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-surface flex items-center justify-center text-[8px] font-bold ${isHighLoad ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}
                                                title={`Load: ${person.properties.workLoad}%`}
                                            >
                                                {person.properties.workLoad > 0 ? person.properties.workLoad : ''}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{person.properties.name}</div>
                                            <div className="text-xs text-text-secondary">{person.properties.designatorRating} • {person.properties.certificates.length} Certs</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Score */}
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${scoreColor}`}>{match.score}%</div>
                                            <div className="text-[10px] text-text-secondary uppercase">Match</div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (confirm(`Assign ${person.properties.name} to ${position.properties.title}?`)) {
                                                    assignPerson(position.id, person.properties.name, person.properties.designatorRating);
                                                    onClose();
                                                }
                                            }}
                                            className="p-2 bg-accent-blue/10 text-accent-blue rounded hover:bg-accent-blue hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            title="Assign"
                                        >
                                            <Award size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Gap Analysis (Missing Skills) */}
                                {match.score < 100 && (
                                    <div className="mt-2 pl-14 hidden group-hover:block animate-in fade-in slide-in-from-top-1">
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <AlertTriangle size={10} className="text-orange-400" />
                                            Acquisition Targets
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {match.details.filter(d => !d.isSatisfied).map((gap, i) => (
                                                <span key={i} className="text-[10px] text-orange-300 bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-900/30">
                                                    {gap.qualificationName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
