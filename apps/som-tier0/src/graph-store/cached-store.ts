import { ISemanticGraphStore } from './interface';
import { HolonQueryFilters, RelationshipQueryFilters, GraphPattern, PatternMatch } from '.';
import { Holon, HolonID, HolonType, Relationship, RelationshipType } from '@som/shared-types';
import { RedisClient } from '../cache/redis-client';

export class CachedGraphStore implements ISemanticGraphStore {
    private inner: ISemanticGraphStore; // Could be Neo4jStore or InMemory
    private redis: RedisClient;
    private TTL = 3600; // 1 hour

    constructor(inner: ISemanticGraphStore, redis: RedisClient) {
        this.inner = inner;
        this.redis = redis;
    }

    async initialize(): Promise<void> {
        await this.inner.initialize(); // Forward initialization
    }

    async rebuildIndices(): Promise<void> {
        await this.inner.rebuildIndices();
        // Invalidate all cache on full rebuild?
        await this.redis.delPattern('holon:*');
    }

    async updateFromNewEvent(event?: any): Promise<void> {
        // 1. Invalidate cache based on event subjects
        if (event && event.subjects) {
            for (const subjectId of event.subjects) {
                await this.redis.del(`holon:${subjectId}`);
                // Also potentially invalidate relationship lists, but that's harder to track without parsing
            }
        }

        // 2. Delegate to inner store to update persistence
        await this.inner.updateFromNewEvent(event);
    }

    // --- Cached Methods ---

    async getHolon(holonId: HolonID): Promise<Holon | undefined> {
        const key = `holon:${holonId}`;

        // 1. Try Cache
        const cached = await this.redis.get(key);
        if (cached) {
            try {
                return JSON.parse(cached) as Holon;
            } catch (e) {
                console.warn('Cache parse error, fetching fresh:', e);
            }
        }

        // 2. Fallback to Inner Store
        const holon = await this.inner.getHolon(holonId);

        // 3. Set Cache
        if (holon) {
            await this.redis.set(key, JSON.stringify(holon), this.TTL);
        }

        return holon;
    }

    // --- Pass-through Methods (No Caching for MVP) ---

    async queryHolonsByType(type: HolonType, filters?: HolonQueryFilters): Promise<Holon[]> {
        return this.inner.queryHolonsByType(type, filters);
    }

    async getAllHolons(): Promise<Holon[]> {
        return this.inner.getAllHolons();
    }

    async queryRelationshipsByType(type: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]> {
        return this.inner.queryRelationshipsByType(type, filters);
    }

    async getAllRelationships(): Promise<Relationship[]> {
        return this.inner.getAllRelationships();
    }

    async getHolonRelationships(holonId: HolonID): Promise<Relationship[]> {
        return this.inner.getHolonRelationships(holonId);
    }

    async traverseRelationships(
        holonId: HolonID,
        relationshipType?: RelationshipType,
        direction: 'outgoing' | 'incoming' | 'both' = 'both',
        filters?: RelationshipQueryFilters
    ): Promise<Relationship[]> {
        return this.inner.traverseRelationships(holonId, relationshipType, direction, filters);
    }

    async getConnectedHolons(
        holonId: HolonID,
        relationshipType?: RelationshipType,
        direction: 'outgoing' | 'incoming' | 'both' = 'both',
        filters?: RelationshipQueryFilters
    ): Promise<Holon[]> {
        return this.inner.getConnectedHolons(holonId, relationshipType, direction, filters);
    }

    async matchPattern(pattern: GraphPattern): Promise<PatternMatch[]> {
        return this.inner.matchPattern(pattern);
    }
}
