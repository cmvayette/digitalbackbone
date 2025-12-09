import React from 'react';
import { ExternalLink, Users, User } from 'lucide-react';
import type { Service } from '../../types/domain';

/**
 * ServiceTile Component
 * Renders a service entry with "Point of Contact" or "Team" owner information.
 */
interface ServiceTileProps {
    service: Service;
}

export const ServiceTile: React.FC<ServiceTileProps> = ({ service }) => {
    const { name, url, ownerType, ownerMetadata } = service;

    return (
        <div className="group relative flex h-14 w-full items-stretch rounded-md border border-border-color bg-bg-surface transition-all hover:border-slate-600 hover:shadow-md">

            {/* Main Trigger Area - Launches Service */}
            <a
                href={url || '#'}
                target={url && url !== '#' ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => {
                    if (!url || url === '#') {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                }}
                className="flex flex-1 items-center gap-3 px-4 border-r border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                title={url ? `Launch ${name}` : `${name} (No URL)`}
            >
                <div className={url ? "text-accent-orange" : "text-text-secondary"}>
                    <ExternalLink size={20} className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-medium text-text-primary line-clamp-1">
                    {name}
                </span>
            </a>

            {/* Owner Section - Hover for Details */}
            <div className="relative flex w-14 flex-col items-center justify-center cursor-pointer bg-black/10 text-text-secondary hover:bg-black/20 hover:text-text-primary transition-colors group/owner">

                {/* Owner Icon/Avatar */}
                <div className="flex items-center justify-center w-6 h-6">
                    {ownerMetadata?.avatarUrl ? (
                        <div
                            className="w-6 h-6 rounded-full border-2 border-bg-surface bg-cover bg-center bg-slate-500"
                            style={{ backgroundImage: `url(${ownerMetadata.avatarUrl})` }}
                        />
                    ) : (
                        ownerType === 'team' ? <Users size={20} /> : <User size={20} />
                    )}
                </div>

                {/* Label */}
                <span className="mt-1 font-mono text-[8px] uppercase tracking-wider text-text-secondary">
                    {ownerType === 'team' ? 'Team' : 'POC'}
                </span>

                {/* Team Popover */}
                <div className="absolute top-[50px] right-0 z-50 hidden w-56 flex-col gap-1 rounded-md border border-border-color bg-bg-panel p-2 shadow-xl group-hover/owner:flex animate-in fade-in slide-in-from-top-1 duration-150">

                    <div className="flex items-center justify-between border-b border-border-color pb-1 mb-1 px-1">
                        <span className="text-[10px] font-bold uppercase text-text-secondary">
                            {ownerMetadata?.name || (ownerType === 'team' ? 'Service Team' : 'Contact Info')}
                        </span>
                    </div>

                    {/* Mock Members */}
                    {ownerType === 'team' && (
                        <>
                            <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-bg-surface cursor-pointer">
                                <div className="h-5 w-5 rounded-full bg-slate-600" />
                                <div className="flex flex-col leading-none gap-0.5">
                                    <span className="text-[11px] font-medium text-text-primary">LS1 Miller</span>
                                    <span className="text-[9px] text-text-secondary">LPO</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-bg-surface cursor-pointer">
                                <div className="h-5 w-5 rounded-full bg-slate-600" />
                                <div className="flex flex-col leading-none gap-0.5">
                                    <span className="text-[11px] font-medium text-text-primary">LS2 Davis</span>
                                    <span className="text-[9px] text-text-secondary">Clerk</span>
                                </div>
                            </div>
                        </>
                    )}
                    {ownerType === 'person' && (
                        <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-bg-surface cursor-pointer">
                            {ownerMetadata?.avatarUrl && (
                                <div className="h-5 w-5 rounded-full bg-slate-600 bg-cover" style={{ backgroundImage: `url(${ownerMetadata.avatarUrl})` }} />
                            )}
                            <div className="flex flex-col leading-none gap-0.5">
                                <span className="text-[11px] font-medium text-text-primary">{ownerMetadata?.name || 'Unknown'}</span>
                                <span className="text-[9px] text-text-secondary">{ownerMetadata?.role || 'Service Owner'}</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
