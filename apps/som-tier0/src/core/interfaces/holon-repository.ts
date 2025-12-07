
import { Holon, HolonID, HolonType, EventID, DocumentID, Timestamp } from '@som/shared-types';
import { IRepository } from './repository';

export interface CreateHolonParams {
    id?: HolonID;
    type: HolonType;
    properties: Record<string, any>;
    createdBy: EventID;
    sourceDocuments: DocumentID[];
}

export interface HolonQueryFilters {
    status?: 'active' | 'inactive';
    createdAfter?: Timestamp;
    createdBefore?: Timestamp;
}

export interface IHolonRepository extends IRepository<Holon> {
    createHolon(params: CreateHolonParams): Promise<Holon>;
    getHolon(holonID: HolonID): Promise<Holon | undefined>;
    getHolonsByType(type: HolonType, filters?: HolonQueryFilters): Promise<Holon[]>;
    markHolonInactive(holonID: HolonID, reason?: string): Promise<boolean>;
    getHolonHistory(holonID: HolonID): Promise<Holon | undefined>;
    getAllHolons(): Promise<Holon[]>;
    hasHolon(holonID: HolonID): Promise<boolean>;
    getHolonCount(type?: HolonType, includeInactive?: boolean): Promise<number>;
    clear(): Promise<void>;
}
