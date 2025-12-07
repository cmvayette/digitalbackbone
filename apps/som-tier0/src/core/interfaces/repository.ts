
export interface QueryOptions {
    limit?: number;
    offset?: number;
    sort?: Record<string, 'asc' | 'desc'>;
}

export interface IRepository<T> {
    save(item: T): Promise<void>;
    findById(id: string): Promise<T | null>;
    find(query: Record<string, any>, options?: QueryOptions): Promise<T[]>;
    delete(id: string): Promise<void>;
}
