import type { Organization as SharedOrganization, Position as SharedPosition, Person as SharedPerson } from '@som/shared-types';

// Helper to match legacy Service
export interface ServiceOwnerMetadata {
    avatarUrl?: string; // For people
    iconName?: string; // For teams
    name: string;
    role?: string; // e.g. "LPO", "Clerk"
}

export interface Service {
    id: string;
    name: string;
    icon: string; // Lucide icon name or URL
    url: string;
    ownerType: 'person' | 'team';
    ownerId: string; // ID of Person OR Organization/TigerTeam
    ownerMetadata?: ServiceOwnerMetadata; // Snapshot for UI convenience
}

export type BilletStatus = 'funded' | 'unfunded';
export type PositionState = 'vacant' | 'filled' | 'acting' | 'archived';
export type OrgHealth = 'healthy' | 'warning' | 'critical';

export interface Organization extends SharedOrganization {
    properties: SharedOrganization['properties'] & {
        parentId: string | null;
        services: Service[];
        health: OrgHealth;
        // Legacy props potentially not in shared yet
        description?: string;
        purpose?: string;
        sponsorOrgId?: string;
        duration?: string;
    };
}

export interface Position extends SharedPosition {
    properties: SharedPosition['properties'] & {
        orgId: string;
        billetStatus: BilletStatus;
        state: PositionState;
        assignedPersonId: string | null;
        qualifications: string[];
        isLeadership: boolean;
    };
}

export interface Person extends SharedPerson {
    properties: SharedPerson['properties'] & {
        avatarUrl?: string;
        certificates: string[];
        primaryPositionId: string | null;
        tigerTeamIds: string[];
    };
}
