-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    occurred_at INTEGER NOT NULL,
    recorded_at INTEGER NOT NULL,
    actor TEXT NOT NULL,
    subjects TEXT NOT NULL, -- JSON Array of HolonIDs
    payload TEXT NOT NULL, -- JSON Object
    causal_links TEXT, -- JSON Object
    source_system TEXT,
    source_document TEXT, -- DocumentID
    validity_window TEXT -- JSON Object {start, end}
);

-- Indices for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_actor ON events(actor);
