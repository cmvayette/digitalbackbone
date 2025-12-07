
import { Relationship, RelationshipID, RelationshipType, HolonID, EventID, DocumentID, Timestamp } from '@som/shared-types';
import { IRepository } from './repository';
import { ValidationResult } from '../../constraint-engine';

export interface CreateRelationshipParams {
    type: RelationshipType;
    sourceHolonID: HolonID;
    targetHolonID: HolonID;
    properties: Record<string, any>;
    effectiveStart: Timestamp;
    effectiveEnd?: Timestamp;
    sourceSystem: string;
    sourceDocuments: DocumentID[];
    authorityLevel?: 'authoritative' | 'derived' | 'inferred';
    confidenceScore?: number;
    actor: HolonID;
}

export interface EndRelationshipParams {
    relationshipID: RelationshipID;
    endDate: Timestamp;
    reason: string;
    actor: HolonID;
    sourceSystem: string;
}

export interface RelationshipQueryFilters {
    effectiveAt?: Timestamp;
    includeEnded?: boolean;
    authorityLevel?: 'authoritative' | 'derived' | 'inferred';
}

export interface RelationshipOperationResult {
    relationship?: Relationship;
    validation: ValidationResult;
    event?: EventID;
    success?: boolean; // For endRelationship
}

export interface IRelationshipRepository extends IRepository<Relationship> {
    createRelationship(params: CreateRelationshipParams): Promise<RelationshipOperationResult>;
    getRelationship(relationshipID: RelationshipID): Promise<Relationship | undefined>;
    getRelationshipsFrom(holonID: HolonID, relationshipType?: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]>;
    getRelationshipsTo(holonID: HolonID, relationshipType?: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]>;
    getRelationshipsByType(type: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]>;
    endRelationship(params: EndRelationshipParams): Promise<RelationshipOperationResult>;
    getAllRelationships(): Promise<Relationship[]>;
    clear(): Promise<void>;
}
