import type { Organization as SharedOrganization, Position as SharedPosition, Person as SharedPerson } from '@som/shared-types';

// Helper to match legacy Service
export interface Service {
    id: string;
    name: string;
    icon: string;
    url: string;
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
