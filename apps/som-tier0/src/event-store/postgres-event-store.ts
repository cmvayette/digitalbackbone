import { Pool, PoolConfig, QueryResult } from 'pg';
import { IEventStore, EventFilter } from '../core/interfaces/event-store';
import { Event, EventID, Timestamp } from '@som/shared-types';
import { randomUUID } from 'crypto';

export class PostgresEventStore implements IEventStore {
    private pool: Pool;

    constructor(connectionString: string, config?: PoolConfig) {
        this.pool = new Pool({
            connectionString,
            ...config
        });
        this.initialize();
    }

    private async initialize() {
        const client = await this.pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS events (
                    id UUID PRIMARY KEY,
                    type TEXT NOT NULL,
                    occurred_at TIMESTAMPTZ NOT NULL,
                    recorded_at TIMESTAMPTZ NOT NULL,
                    actor TEXT NOT NULL,
                    subjects JSONB NOT NULL,
                    payload JSONB NOT NULL,
                    causal_links JSONB,
                    payload JSONB NOT NULL,
                    causal_links JSONB,
                    metadata JSONB,
                    source_system TEXT,
                    source_document TEXT,
                    validity_window JSONB
                );
                CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
                CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
                CREATE INDEX IF NOT EXISTS idx_events_subjects ON events USING gin (subjects);
                
                -- Auto-migration
                ALTER TABLE events ADD COLUMN IF NOT EXISTS source_system TEXT;
                ALTER TABLE events ADD COLUMN IF NOT EXISTS source_document TEXT;
                ALTER TABLE events ADD COLUMN IF NOT EXISTS validity_window JSONB;
            `);
        } catch (e) {
            console.error("[PostgresEventStore] Failed to initialize schema", e);
            throw e;
        } finally {
            client.release();
        }
    }

    async submitEvent(eventData: Omit<Event, 'id' | 'recordedAt'>): Promise<EventID> {
        const id = randomUUID();
        const recordedAt = new Date();

        const query = `
            INSERT INTO events (id, type, occurred_at, recorded_at, actor, subjects, payload, causal_links, metadata, source_system, source_document, validity_window)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;

        const values = [
            id,
            eventData.type,
            eventData.occurredAt,
            recordedAt,
            eventData.actor,
            JSON.stringify(eventData.subjects),
            eventData.payload, // pg driver stringifies objects for JSONB automatically usually, but let's see. 
            // Actually pg driver expects object for JSONB? Or string?
            // "If you are using version 8+ of pg... objects are stringified automatically"
            eventData.causalLinks || {},
            (eventData as any).metadata || {},
            eventData.sourceSystem,
            eventData.sourceDocument,
            eventData.validityWindow
        ];

        try {
            await this.pool.query(query, values);
            return id;
        } catch (e) {
            console.error("Failed to submit event", e);
            throw e;
        }
    }

    async getEvent(id: EventID): Promise<Event | undefined> {
        const query = 'SELECT * FROM events WHERE id = $1';
        const res = await this.pool.query(query, [id]);

        if (res.rows.length === 0) return undefined;
        return this.mapRowToEvent(res.rows[0]);
    }

    async getEvents(filter?: EventFilter): Promise<Event[]> {
        let sql = 'SELECT * FROM events WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (filter) {
            if (filter.type && filter.type.length > 0) {
                // filter.type is string[]
                sql += ` AND type = ANY($${paramIndex++})`;
                params.push(filter.type);
            }
            if (filter.startTime) {
                sql += ` AND occurred_at >= $${paramIndex++}`;
                params.push(filter.startTime);
            }
            if (filter.endTime) {
                sql += ` AND occurred_at <= $${paramIndex++}`;
                params.push(filter.endTime);
            }
            if (filter.actor) {
                sql += ` AND actor = $${paramIndex++}`;
                params.push(filter.actor);
            }
            if (filter.subjects && filter.subjects.length > 0) {
                // Postgres JSONB containment: subjects @> '["subjectId"]'
                // Assuming subjects is array of strings.
                // We can search if the JSON array contains any of the subjects?
                // The interface implies "subjects" are the ones associated with event.
                // If filter.subjects is provided, we want events that involve ANY of these subjects? Or ALL?
                // Typically "events involving X" -> X is in subjects array.
                // If filter.subjects = ['A', 'B'], do we want events with A OR B?
                // SQLite impl seemed tricky.
                // Using JSONB operator ?| for "exists any key/element"? No, ?| is for keys(top level).
                // For array containment: events whose subjects column contains specific subject.
                // Ideally `subjects @> '["A"]'` OR `subjects @> '["B"]'`.

                // Constructing OR clause for subjects
                const subjectConditions = filter.subjects.map(subj => {
                    params.push(JSON.stringify([subj]));
                    return `subjects @> $${paramIndex++}`;
                });
                if (subjectConditions.length > 0) {
                    sql += ` AND (${subjectConditions.join(' OR ')})`;
                }
            }
        }

        sql += ' ORDER BY occurred_at ASC, recorded_at ASC';

        const res = await this.pool.query(sql, params);
        return res.rows.map(this.mapRowToEvent);
    }

    async getAllEvents(): Promise<Event[]> {
        const query = 'SELECT * FROM events ORDER BY occurred_at ASC, recorded_at ASC';
        const res = await this.pool.query(query);
        return res.rows.map(this.mapRowToEvent);
    }

    async close() {
        await this.pool.end();
    }

    private mapRowToEvent(row: any): Event {
        return {
            id: row.id,
            type: row.type,
            occurredAt: row.occurred_at, // pg returns Date for TIMESTAMPTZ
            recordedAt: row.recorded_at,
            actor: row.actor,
            subjects: row.subjects, // pg parses JSONB to object/array automatically
            payload: row.payload,
            sourceSystem: row.source_system,
            sourceDocument: row.source_document,
            validityWindow: row.validity_window ? {
                start: new Date(row.validity_window.start),
                end: new Date(row.validity_window.end)
            } : undefined,
            causalLinks: row.causal_links,
            // metadata: row.metadata // If Event interface supports it
        } as Event;
    }
}
