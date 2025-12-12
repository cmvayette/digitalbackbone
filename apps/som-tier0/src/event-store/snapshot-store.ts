import { ISnapshotStore, Snapshot } from '../core/interfaces/event-store';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { Timestamp } from '@som/shared-types';

export class SQLiteSnapshotStore implements ISnapshotStore {
    private db: Database.Database;

    constructor(dbPath: string = 'som.db') {
        this.db = new Database(dbPath);
        this.initialize();
    }

    private initialize() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY,
                timestamp INTEGER NOT NULL,
                last_event_id TEXT NOT NULL,
                state TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON snapshots(timestamp);
        `);
    }

    async saveSnapshot(snapshot: Snapshot): Promise<void> {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO snapshots (id, timestamp, last_event_id, state)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(
            snapshot.id,
            snapshot.timestamp.getTime(),
            snapshot.lastEventId,
            JSON.stringify(snapshot.state)
        );
    }

    async getLatestSnapshot(timestamp: Timestamp): Promise<Snapshot | undefined> {
        const stmt = this.db.prepare(`
            SELECT * FROM snapshots 
            WHERE timestamp <= ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        const row = stmt.get(timestamp.getTime()) as any;

        if (!row) return undefined;

        return {
            id: row.id,
            timestamp: new Date(row.timestamp),
            lastEventId: row.last_event_id,
            state: JSON.parse(row.state)
        };
    }
}

export class PostgresSnapshotStore implements ISnapshotStore {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
        this.initialize();
    }

    private async initialize() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY,
                timestamp TIMESTAMPTZ NOT NULL,
                last_event_id TEXT NOT NULL,
                state JSONB NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON snapshots(timestamp);
        `);
    }

    async saveSnapshot(snapshot: Snapshot): Promise<void> {
        await this.pool.query(`
            INSERT INTO snapshots (id, timestamp, last_event_id, state)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE 
            SET timestamp = EXCLUDED.timestamp, 
                last_event_id = EXCLUDED.last_event_id, 
                state = EXCLUDED.state
        `, [
            snapshot.id,
            snapshot.timestamp,
            snapshot.lastEventId,
            snapshot.state
        ]);
    }

    async getLatestSnapshot(timestamp: Timestamp): Promise<Snapshot | undefined> {
        const res = await this.pool.query(`
            SELECT * FROM snapshots 
            WHERE timestamp <= $1
            ORDER BY timestamp DESC 
            LIMIT 1
        `, [timestamp]);

        if (res.rows.length === 0) return undefined;
        const row = res.rows[0];

        return {
            id: row.id,
            timestamp: row.timestamp,
            lastEventId: row.last_event_id,
            state: row.state
        };
    }
}
