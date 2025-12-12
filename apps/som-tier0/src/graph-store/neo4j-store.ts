import { ISemanticGraphStore } from './interface';
import { Driver, auth, driver as createDriver, Session } from 'neo4j-driver';
import { Holon, HolonID, HolonType, Timestamp, Relationship, RelationshipID, RelationshipType } from '@som/shared-types';
import { StateProjectionEngine } from '../state-projection';
import { RelationshipRegistry } from '../relationship-registry';
import { config } from '../config';
import { HolonQueryFilters, RelationshipQueryFilters, GraphPattern, PatternMatch } from './index';

export class Neo4jGraphStore implements ISemanticGraphStore {
    private driver: Driver;
    private stateProjection: StateProjectionEngine;

    constructor(stateProjection: StateProjectionEngine) {
        this.stateProjection = stateProjection;
        this.driver = createDriver(
            config.neo4j.uri,
            auth.basic(config.neo4j.user, config.neo4j.password)
        );
    }

    async getAllHolons(): Promise<Holon[]> {
        return this.queryHolonsByType('Organization' as HolonType); // Stub or impl full scan
    }

    async getAllRelationships(): Promise<Relationship[]> {
        return [];
    }

    async getHolonRelationships(holonId: HolonID): Promise<Relationship[]> {
        return this.traverseRelationships(holonId, undefined, 'both');
    }

    async close(): Promise<void> {
        await this.driver.close();
    }

    async initialize(): Promise<void> {
        const session = this.driver.session();
        try {
            // Create constraints for ID uniqueness
            await session.run('CREATE CONSTRAINT holon_id_unique IF NOT EXISTS FOR (h:Holon) REQUIRE h.id IS UNIQUE');
            await session.run('CREATE CONSTRAINT relationship_id_unique IF NOT EXISTS FOR (r:RELATIONSHIP) REQUIRE r.id IS UNIQUE');

            // Indexes for performance
            await session.run('CREATE INDEX holon_type_index IF NOT EXISTS FOR (h:Holon) ON (h.type)');
            await session.run('CREATE INDEX relationship_type_index IF NOT EXISTS FOR ()-[r:REL]-() ON (r.type)');

            console.log('Neo4j constraints and indexes initialized.');
            // Replay all events to sync DB
            await this.rebuildIndices();
        } catch (error) {
            console.error('Failed to initialize Neo4j:', error);
            throw error;
        } finally {
            await session.close();
        }
    }

    async rebuildIndices(): Promise<void> {
        const session = this.driver.session();
        try {
            console.log('Rebuilding GraphDB from Event Store...');
            // In a real prod environment, we might truncate/drop first or handle upserts gracefully
            // For now, we reuse updateFromNewEvent logic but applied to the whole state
            const currentState = await this.stateProjection.replayAllEvents();

            // 1. Holons
            for (const [id, state] of currentState.holons) {
                const h = state.holon;
                await session.run(
                    `
                MERGE (h:Holon {id: $id})
                SET h += $props, h.type = $type, h.updatedAt = $updatedAt
                `,
                    {
                        id: h.id,
                        props: this.serializeProperties(h.properties),
                        type: h.type,
                        updatedAt: new Date().toISOString(), // Mock timestamp if needed
                        label: h.type // Dynamic label? No, Cypher params don't support dynamic labels directly easily without APOC or string concat.
                        // For safety, we keep static :Holon label and store type as property, 
                        // AND we can add specific labels if safe strings.
                    }
                );
                // Add specific label safely
                if (/^[a-zA-Z0-9_]+$/.test(h.type)) {
                    await session.run(`MATCH (h:Holon {id: $id}) SET h:${h.type}`, { id: h.id });
                }
            }

            // 2. Relationships
            for (const [id, state] of currentState.relationships) {
                const r = state.relationship;
                await session.run(
                    `
                 MATCH (a:Holon {id: $sourceId}), (b:Holon {id: $targetId})
                 MERGE (a)-[r:REL {id: $id}]->(b)
                 SET r += $props, r.type = $type
                 `,
                    {
                        sourceId: r.sourceHolonID,
                        targetId: r.targetHolonID,
                        id: r.id,
                        props: this.serializeProperties(r.properties),
                        type: r.type
                    }
                );
            }
            console.log(`GraphDB Rebuild Complete. Syncing ${currentState.holons.size} holons.`);

        } finally {
            await session.close();
        }
    }

    async updateFromNewEvent(): Promise<void> {
        // Optimized: In a real Event Sourcing setup, we would take the *single* event passed here
        // and apply just that change.
        // However, the GraphStore interface signature for updateFromNewEvent currently takes void
        // and relies on StateProjection having the latest state.
        // To match the interface without changing it yet, we *could* rebuild, but that's slow.
        // Ideally we update the generic `updateFromNewEvent(event: DomainEvent)` signature.
        // For this POC, we will just call rebuildIndices() as the interface implies a refresh.
        // See `server.ts`: projectionEngine.subscribe(async (event) => ... graphStore.updateFromNewEvent())

        // NOTE: To make this performant for 20k, we MUST eventually consume the specific event.
        // I will implement a "Smart Refresh" here if I can get the Diff, or fallback to Rebuild.
        await this.rebuildIndices();
    }

    // --- Read API (Cypher) ---

    async getHolon(holonId: HolonID): Promise<Holon | undefined> {
        const session = this.driver.session();
        try {
            const result = await session.run(
                'MATCH (h:Holon {id: $id}) RETURN h',
                { id: holonId }
            );
            if (result.records.length === 0) return undefined;
            return this.mapNodeToHolon(result.records[0].get('h'));
        } finally {
            await session.close();
        }
    }

    async queryHolonsByType(type: HolonType, filters?: HolonQueryFilters): Promise<Holon[]> {
        const session = this.driver.session();
        try {
            // Construct query
            let query = `MATCH (h:Holon {type: $type})`;
            if (filters?.status) {
                query += ` WHERE h.status = $status`;
            }
            // Basic impl, ignoring complex filters for MVP
            query += ` RETURN h`;

            const result = await session.run(query, { type, status: filters?.status });
            return result.records.map(r => this.mapNodeToHolon(r.get('h')));
        } finally {
            await session.close();
        }
    }

    async traverseRelationships(
        holonId: HolonID,
        relationshipType?: RelationshipType,
        direction: 'outgoing' | 'incoming' | 'both' = 'both',
        filters?: RelationshipQueryFilters
    ): Promise<Relationship[]> {
        const session = this.driver.session();
        try {
            let dirStr = '-[r:REL]-';
            if (direction === 'outgoing') dirStr = '-[r:REL]->';
            if (direction === 'incoming') dirStr = '<-[r:REL]-';

            let query = `MATCH (a:Holon {id: $id})${dirStr}(b)`;
            const params: any = { id: holonId };

            if (relationshipType) {
                query += ` WHERE r.type = $type`;
                params.type = relationshipType;
            }

            query += ` RETURN r, startNode(r).id as sourceId, endNode(r).id as targetId`;

            const result = await session.run(query, params);
            return result.records.map(rec => this.mapRelToRelationship(rec.get('r'), rec.get('sourceId'), rec.get('targetId')));
        } finally {
            await session.close();
        }
    }

    // Stubs for interface compliance
    async queryRelationshipsByType(type: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]> {
        // Stub for now or impl basic Cypher
        return [];
    }

    async getConnectedHolons(holonId: HolonID): Promise<Holon[]> {
        // Implement using traverseRelationships logic + return nodes
        return [];
    }

    async matchPattern(pattern: GraphPattern): Promise<PatternMatch[]> {
        return [];
    }

    // Helpers
    private serializeProperties(props: any): any {
        // Neo4j doesn't like nested objects easily, might need stringify for complex prop bags
        // For simple keys, it's fine.
        return props || {};
    }

    private mapNodeToHolon(node: any): Holon {
        const p = node.properties;
        return {
            id: p.id,
            type: p.type as HolonType,
            name: p.name || 'Unknown', // Fallback
            description: p.description || '',
            properties: p,
            // Rehydrate other fields if stored properties
            status: p.status || 'active',
            orgID: p.orgID || '',
            createdBy: p.createdBy || 'system',
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),

        } as unknown as Holon; // Cast for now, refined mapping needed for prod
    }

    private mapRelToRelationship(rel: any, sourceId: string, targetId: string): Relationship {
        const p = rel.properties;
        return {
            id: p.id,
            type: p.type as RelationshipType,
            sourceHolonID: sourceId,
            targetHolonID: targetId,
            properties: p,
            priority: p.priority || 0,
            status: p.status || 'active',
            effectiveStart: p.effectiveStart || new Date().toISOString(),
        } as unknown as Relationship;
    }

}
