# Event Store Design Spec
**Backend Persistence Layer for the Semantic Operating Model**

## 1. Overview
The Event Store is the immutable source of truth for the digital backbone. It stores every state change as an append-only event, enabling auditability, time-travel queries, and causal reasoning.

Current Status: `apps/som-tier0` contains an in-memory or file-based simulation.
Target State: A PostgreSQL-backed event store optimized for high-throughput appending and efficient replay by Holon ID.

## 2. Core Schema (Postgres)

We will use a single narrow `events` table with JSONB payloads for flexibility.

```sql
CREATE TABLE events (
    global_offset     BIGSERIAL PRIMARY KEY,      -- Absolute ordering
    event_id          UUID NOT NULL UNIQUE,       -- Immutable ID
    event_type        VARCHAR(64) NOT NULL,       -- "TaskCreated", "PersonModified"
    stream_id         UUID NOT NULL,              -- Primary aggregate (HolonID)
    version           INTEGER NOT NULL,           -- Optimistic concurrency check
    
    -- Metadata
    actor_id          UUID NOT NULL,              -- Who caused this?
    source_system     VARCHAR(32) NOT NULL,       -- "Apps/Policy", "JIRA", "System"
    occurred_at       TIMESTAMPTZ NOT NULL,       -- Business time
    recorded_at       TIMESTAMPTZ DEFAULT NOW(),  -- System availability time
    
    -- Validity Validation
    valid_from        TIMESTAMPTZ,                
    valid_to          TIMESTAMPTZ,
    
    -- The Content
    payload           JSONB NOT NULL,             -- The actual data change
    metadata          JSONB,                      -- Tracing context, reasons, signatures
    
    -- Indices
    INDEX idx_stream_version (stream_id, version),
    INDEX idx_global_offset (global_offset),
    INDEX idx_event_type (event_type),
    INDEX idx_occurred_at (occurred_at)
);
```

## 3. Interfaces & Behaviors

### 3.1 Appending Events (Write)
**Function**: `append(streamId, expectedVersion, eventPayload)`
1.  **Concurrency Check**: Ensure `MAX(version)` for `stream_id` == `expectedVersion`. If not, throw `OptimisticLockError`.
2.  **Validation**: Validates `payload` against the JSON Schema for `event_type`.
3.  **Commit**: Insert row.
4.  **Publish**: Emit notification (e.g., via Postgres `NOTIFY` or Redis Pub/Sub) to Projection Engines.

### 3.2 Reading Events (Replay)
**Function**: `readStream(streamId, fromVersion=0)`
*   Returns ordered list of events for a specific Holon.
*   Used by Aggregates to rebuild their current state in memory.

### 3.3 Subscriptions (Catch-Up)
**Function**: `subscribeToAll(fromGlobalOffset)`
*   Used by Projections (e.g., "Active Task List", "Org Chart Graph") to update their read models.
*   Projections track their own `last_processed_offset`.

## 4. Projection Strategy ("The Read Side")
The Event Store is for *writing*. To support fast queries (e.g., "Find all Tasks due today"), we will project events into specialized Read Models.

*   **Graph Store (Neo4j / Memgraph)**: Projections update nodes/edges for complex relationship queries.
*   **Search Index (Elastic/Meilisearch)**: Projections update text documents for full-text search.
*   **Relational View (Postgres)**: Flattened tables for standard analytical dashboards (e.g., `tasks_view`, `compliance_stats`).

## 5. Security & Partitioning
*   **Immutability**: The `events` table should be `GRANT INSERT, SELECT` only. No `UPDATE` or `DELETE`.
*   **Encryption**: Sensitive payloads (PII) should be encrypted at the application layer before insertion, or column-level encrypted in Postgres.
*   **Partitioning**: Partition by `occurred_at` (Year/Month) for archival efficiency as the dataset grows.

## 6. Migration Plan
1.  **Dockerize Postgres**: Add `docker-compose.yml` with Postgres 16.
2.  **Knex/TypeORM Migration**: Write schema definition scripts in `apps/som-tier0`.
3.  **Adapter Implementation**: Create `PostgresEventStore` class implementing the `EventStore` interface.
4.  **Wiring**: Swap `InMemoryEventStore` for `PostgresEventStore` in `index.ts` based on `ENV=PRODUCTION`.
