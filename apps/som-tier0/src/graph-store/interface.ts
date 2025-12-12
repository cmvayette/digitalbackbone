
import { Holon, HolonID, HolonType, Relationship, RelationshipType } from '@som/shared-types';
import { HolonQueryFilters, RelationshipQueryFilters, GraphPattern, PatternMatch } from '.';

export interface ISemanticGraphStore {
    initialize(): Promise<void>;
    rebuildIndices(): Promise<void>;
    updateFromNewEvent(event?: any): Promise<void>;

    getHolon(holonId: HolonID): Promise<Holon | undefined>;
    queryHolonsByType(type: HolonType, filters?: HolonQueryFilters): Promise<Holon[]>;
    getAllHolons(): Promise<Holon[]>;

    getHolonRelationships(holonId: HolonID): Promise<Relationship[]>;
    traverseRelationships(
        holonId: HolonID,
        relationshipType?: RelationshipType,
        direction?: 'outgoing' | 'incoming' | 'both',
        filters?: RelationshipQueryFilters
    ): Promise<Relationship[]>;

    queryRelationshipsByType(type: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]>;
    getAllRelationships(): Promise<Relationship[]>;

    getConnectedHolons(
        holonId: HolonID,
        relationshipType?: RelationshipType,
        direction?: 'outgoing' | 'incoming' | 'both',
        filters?: RelationshipQueryFilters
    ): Promise<Holon[]>;

    matchPattern(pattern: GraphPattern): Promise<PatternMatch[]>;
}
