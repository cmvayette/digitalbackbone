import type { ExternalPerson, ExternalPosition, ExternalOrganization } from '@som/api-client';
import type { Person, Position, Organization } from '../types/domain';

export function toDomainPerson(ext: ExternalPerson): Person {
    return {
        ...ext,
        createdAt: new Date(),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            // Defaults for missing properties to prevent crashes
            avatarUrl: ext.avatarUrl,
            certificates: [],
            tigerTeamIds: [],
            workLoad: 0,
            capacity: 100,
            primaryPositionId: null,
            ...ext.properties
        } as any
    } as unknown as Person;
}

export function toDomainPosition(ext: ExternalPosition): Position {
    return {
        ...ext,
        createdAt: new Date(),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            state: 'vacant',
            billetStatus: 'funded',
            assignedPersonId: null,
            qualifications: [],
            isLeadership: false,
            ...(ext as any).properties
        } as any
    } as unknown as Position;
}

export function toDomainOrganization(ext: ExternalOrganization): Organization {
    return {
        ...ext,
        createdAt: new Date(),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            services: [],
            health: 'healthy',
            parentId: ext.parentId || null,
            ...ext.properties
        } as any
    } as unknown as Organization;
}
