
export type BilletStatus = 'funded' | 'unfunded';
export type PositionState = 'vacant' | 'filled' | 'acting' | 'archived';
export type OrgHealth = 'healthy' | 'warning' | 'critical';

export interface Service {
    id: string;
    name: string;
    icon: string; // lucide icon name
    url: string;
}

export interface Organization {
    id: string;
    type: 'Command' | 'Directorate' | 'Division' | 'Branch' | 'TigerTeam';
    name: string;
    description: string;
    parentId: string | null;
    services: Service[];
    health: OrgHealth;

    // Tiger Team Specifics
    purpose?: string;
    sponsorOrgId?: string;
    duration?: string;
}

export interface Position {
    id: string;
    orgId: string;
    title: string;
    billetStatus: BilletStatus;
    state: PositionState;
    assignedPersonId: string | null;

    // Metadata
    qualifications: string[]; // e.g. "IAM Level 3", "PMP"
    isLeadership: boolean;
}

export interface Person {
    id: string;
    name: string;
    rank: string; // e.g. "GS-13", "Capt", "Ctr"
    type: 'Mil' | 'Civ' | 'Ctr';
    avatarUrl?: string; // Optional

    // Competency
    certificates: string[];

    // Affiliations
    primaryPositionId: string | null;
    tigerTeamIds: string[];
}
