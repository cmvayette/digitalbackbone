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
        const schemaPath = path.resolve(__dirname, '../db/schema.sql');

        try {
            if (fs.existsSync(schemaPath)) {
                try {
                    this.db.exec("PRAGMA journal_mode = WAL");
                } catch { /* ignore */ }
                try {
                    this.db.exec("PRAGMA synchronous = NORMAL");
                } catch { /* ignore */ }
                const schema = fs.readFileSync(schemaPath, 'utf-8');
                this.db.exec(schema);
            } else {
                // Fallback for robustness during dev/test if file is moved
                console.warn(`[SQLiteEventStore] Schema file not found at ${schemaPath}, using fallback.`);
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS events (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL,
                        occurred_at INTEGER NOT NULL,
                        recorded_at INTEGER NOT NULL,
                        actor TEXT NOT NULL,
                        subjects TEXT NOT NULL,
                        payload TEXT NOT NULL,
                        causal_links TEXT,
                        source_system TEXT,
                        source_document TEXT,
                        validity_window TEXT
                    );
                    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
                    CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
                 `);

                // Auto-migration for existing databases
                try { this.db.exec('ALTER TABLE events ADD COLUMN source_system TEXT'); } catch { /* ignore */ }
                try { this.db.exec('ALTER TABLE events ADD COLUMN source_document TEXT'); } catch { /* ignore */ }
                try { this.db.exec('ALTER TABLE events ADD COLUMN validity_window TEXT'); } catch { /* ignore */ }
            }
        } catch (e) {
            console.error("[SQLiteEventStore] Failed to initialize schema", e);
            throw e; // Critical failure
        }
    }

    async submitEvent(eventData: Omit<Event, 'id' | 'recordedAt'>): Promise<EventID> {
        const id = randomUUID();
        const recordedAt = new Date();

        const stmt = this.db.prepare(`
            INSERT INTO events (id, type, occurred_at, recorded_at, actor, subjects, payload, causal_links, source_system, source_document, validity_window)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Wrapping internal sync call
        const info = stmt.run(
            id,
            eventData.type,
            eventData.occurredAt.getTime(),
            recordedAt.getTime(),
            eventData.actor,
            JSON.stringify(eventData.subjects),
            JSON.stringify(eventData.payload),
            JSON.stringify(eventData.causalLinks || {}),
            eventData.sourceSystem,
            eventData.sourceDocument || null,
            eventData.validityWindow ? JSON.stringify(eventData.validityWindow) : null
        );

        return id;
    }

    async getEvent(id: EventID): Promise<Event | undefined> {
        const row = this.db.prepare('SELECT * FROM events WHERE id = ?').get(id) as any;
        if (!row) return undefined;
        return this.mapRowToEvent(row);
    }

    async getEvents(filter?: EventFilter): Promise<Event[]> {
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

    async getAllEvents(): Promise<Event[]> {
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
            causalLinks: row.causal_links ? JSON.parse(row.causal_links) : undefined,
            sourceSystem: row.source_system,
            sourceDocument: row.source_document,
            validityWindow: row.validity_window ? (() => {
                const parsed = JSON.parse(row.validity_window);
                return {
                    start: new Date(parsed.start),
                    end: new Date(parsed.end)
                };
            })() : undefined
        } as Event;
    }
}
