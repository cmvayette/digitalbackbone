CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    occurred_at INTEGER NOT NULL,
    recorded_at INTEGER NOT NULL,
    actor TEXT NOT NULL,
    subjects TEXT NOT NULL, -- JSON array of HolonIDs
    payload TEXT NOT NULL,  -- JSON object
    causal_links TEXT       -- JSON object
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
-- Cannot easily index inside JSON arrays in SQLite without json1 extension (usually enabled but safer to filter in app for now if needed, or rely on full scans for specific holons which is fine for Phase 1)
-- Actually, a common query is "Events for Holon X". Ideally we'd have a lookup table but for simplicity we can filter or use LIKE '%ID%' if IDs are unique UUIDs. Use filtering for now.
