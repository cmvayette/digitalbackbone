import type { Holon, Relationship, Timestamp } from '@som/shared-types';

export interface OrganizationalStructureDTO {
    organization: Holon;
    subOrganizations: OrganizationalStructureDTO[];
    positions: Holon[];
    assignments: Array<{
        position: Holon;
        person: Holon;
        relationship: Relationship;
    }>;
    asOfTimestamp: Timestamp;
}
