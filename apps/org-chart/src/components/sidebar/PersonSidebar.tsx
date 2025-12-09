import type { Node } from '@xyflow/react';
import { User, Award, Shield } from 'lucide-react';
import type { Person } from '../../types/domain';

export function PersonSidebar({ node }: { node: Node }) {
    const person = node.data.properties as Person;

    return (
        <div className="flex flex-col h-full bg-bg-panel text-text-primary">
            {/* Header */}
            <div className="p-6 border-b border-border-color bg-gradient-to-b from-bg-surface to-bg-panel">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-full border-2 border-border-color bg-bg-canvas flex items-center justify-center overflow-hidden">
                        {person.properties.avatarUrl ? (
                            <img src={person.properties.avatarUrl} alt={person.properties.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} className="text-text-secondary" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{person.properties.name}</h2>
                        <span className="text-sm text-text-secondary uppercase tracking-wider block">{person.properties.designatorRating} • {person.properties.category}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Certifications */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Award size={12} /> Certifications
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {person.properties.certificates.map((cert) => (
                            <span key={cert} className="px-2 py-1 bg-bg-surface border border-border-color rounded text-xs font-medium text-text-primary">
                                {cert}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Content */}
                <section>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Shield size={12} /> Assignments
                    </h3>
                    <div className="space-y-2">
                        <div className="p-3 bg-bg-surface border border-border-color rounded">
                            <span className="text-xs text-text-secondary block mb-1">Primary Duty</span>
                            <span className="text-sm font-bold text-text-primary">
                                {person.properties.primaryPositionId ? 'Assigned' : 'Unassigned'}
                            </span>
                        </div>

                        {/* Current Task Load Meter */}
                        <div className="p-3 bg-bg-surface border border-border-color rounded">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs text-text-secondary">Current Task Load</span>
                                <span className={`text-sm font-bold ${person.properties.workLoad > 90 ? 'text-red-400' : 'text-text-primary'}`}>
                                    {person.properties.workLoad}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-bg-canvas rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${person.properties.workLoad > 90 ? 'bg-red-500' : person.properties.workLoad > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(person.properties.workLoad, 100)}%` }}
                                />
                            </div>
                        </div>

                        {person.properties.tigerTeamIds.length > 0 && (
                            <div className="p-3 bg-bg-surface border border-border-color rounded">
                                <span className="text-xs text-text-secondary block mb-1">Tiger Teams</span>
                                <span className="text-sm font-bold text-accent-orange">
                                    {person.properties.tigerTeamIds.length} Active
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
