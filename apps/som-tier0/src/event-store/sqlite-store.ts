import Database from 'better-sqlite3';
import { IEventStore, EventFilter } from '../core/interfaces/event-store';
import { Event, EventID, Timestamp } from '@som/shared-types';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export class SQLiteEventStore implements IEventStore {
    private db: Database.Database;

    constructor(dbPath: string = 'som.db') {
        this.db = new Database(dbPath);
        this.initialize();
    }

    private initialize() {
        // Load schema
        // Look for schema.sql in known locations (dist or src)
        try {
            const schemaPath = path.resolve(__dirname, '../db/schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf-8');
                this.db.exec(schema);
            } else {
                // Fallback if file not found (e.g. in development structure mismatch)
                // Or hardcode minimal schema here for safety
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS events (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL,
                        occurred_at INTEGER NOT NULL,
                        recorded_at INTEGER NOT NULL,
                        actor TEXT NOT NULL,
                        subjects TEXT NOT NULL,
                        payload TEXT NOT NULL,
                        causal_links TEXT
                    );
                    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
                    CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
                 `);
            }
        } catch (e) {
            console.error("Failed to load schema from file, using fallback execution.");
        }
    }

    submitEvent(eventData: Omit<Event, 'id' | 'recordedAt'>): EventID {
        const id = randomUUID();
        const recordedAt = new Date();

        const stmt = this.db.prepare(`
            INSERT INTO events (id, type, occurred_at, recorded_at, actor, subjects, payload, causal_links)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            id,
            eventData.type,
            eventData.occurredAt.getTime(),
            recordedAt.getTime(),
            eventData.actor,
            JSON.stringify(eventData.subjects),
            JSON.stringify(eventData.payload),
            JSON.stringify(eventData.causalLinks || {})
        );

        return id;
    }

    getEvent(id: EventID): Event | undefined {
        const row = this.db.prepare('SELECT * FROM events WHERE id = ?').get(id) as any;
        if (!row) return undefined;
        return this.mapRowToEvent(row);
    }

    getEvents(filter?: EventFilter): Event[] {
        let sql = 'SELECT * FROM events WHERE 1=1';
        const params: any[] = [];

        if (filter) {
            if (filter.type && filter.type.length > 0) {
                sql += ` AND type IN (${filter.type.map(() => '?').join(',')})`;
                params.push(...filter.type);
            }
            if (filter.startTime) {
                sql += ' AND occurred_at >= ?';
                params.push(filter.startTime.getTime());
            }
            if (filter.endTime) {
                sql += ' AND occurred_at <= ?';
                params.push(filter.endTime.getTime());
            }
            if (filter.actor) {
                sql += ' AND actor = ?';
                params.push(filter.actor);
            }
            // Subjects filtering is tricky with JSON array text.
            // For now, if subjects filter is present, we filter in memory after fetching potential candidates
            // Or we check textual inclusion which is a hack but works for UUIDs
            if (filter.subjects && filter.subjects.length > 0) {
                // Optimization: if filter has subjects, we might fetch more than needed and filter in code
            }
        }

        sql += ' ORDER BY occurred_at ASC';

        const rows = this.db.prepare(sql).all(...params) as any[];
        let events = rows.map(this.mapRowToEvent);

        if (filter && filter.subjects && filter.subjects.length > 0) {
            events = events.filter(e => e.subjects.some(s => filter.subjects!.includes(s)));
        }

        return events;
    }

    getAllEvents(): Event[] {
        const rows = this.db.prepare('SELECT * FROM events ORDER BY occurred_at ASC').all() as any[];
        return rows.map(this.mapRowToEvent);
    }

    private mapRowToEvent(row: any): Event {
        return {
            id: row.id,
            type: row.type,
            occurredAt: new Date(row.occurred_at),
            recordedAt: new Date(row.recorded_at),
            actor: row.actor,
            subjects: JSON.parse(row.subjects),
            payload: JSON.parse(row.payload),
            causalLinks: row.causal_links ? JSON.parse(row.causal_links) : undefined
        } as Event;
    }
}
