
import { UserContext } from '../../access-control';
import { Timestamp } from '@som/shared-types';

export interface QueryOptions {
    limit?: number;
    offset?: number;
    sort?: Record<string, 'asc' | 'desc'>;
    user?: UserContext;
    page?: number;
    timeRange?: { start: Timestamp; end: Timestamp };
}

export interface IRepository<T> {
    save(item: T): Promise<void>;
    findById(id: string): Promise<T | null>;
    find(query: Record<string, any>, options?: QueryOptions): Promise<T[]>;
    delete(id: string): Promise<void>;
}
