# 12. Migration to PostgreSQL and Asynchronous EventStore

Date: 2025-12-11

## Status

Accepted

## Context

The SOM Tier-0 service initially utilized a synchronous `SQLiteEventStore` for simplicity and rapid prototyping. However, upcoming deployment requirements for IL6 (Secret) environments mandate robust High Availability (HA), Encryption at Rest/Transit, and Immutable Audit Logging. The chosen infrastructure solution is PostgreSQL 16+ managed by the CrunchyData Operator.

PostgreSQL interactions in Node.js (via `pg` driver) are inherently asynchronous (I/O bound). The existing `IEventStore` interface and its consumers (`GraphStore`, `QueryLayer`, etc.) were synchronous, blocking the migration.

## Decision

We have decided to:

1.  **Adopt PostgreSQL 16+** as the primary persistence layer for `som-tier0` in production environments.
2.  **Refactor `IEventStore` Interface** to be fully asynchronous, returning `Promise`s for all operations (`submitEvent`, `getEvent`, etc.).
3.  **Implement `PostgresEventStore`** using the `pg` library, supporting `JSONB` for flexible event payloads and metadata access.
4.  **Refactor Consumers**: Update all internal engines (`QueryLayer`, `StateProjection`, `SemanticAccessLayer`) to use `async/await` patterns.
5.  **Configurable Backend**: Implement dynamic switching between `sqlite` (dev/legacy) and `postgres` (prod/dev-docker) via `DB_TYPE` environment variable.

## Consequences

### Positive
*   **IL6 Compliance**: Enables meeting security and availability requirements via standard Postgres operators.
*   **Scalability**: Postgres handles higher write throughput and concurrency than SQLite.
*   **Observability**: Standard database monitoring tools can be used.
*   **Flexibility**: JSONB allows efficient querying of event payloads without rigid schema migrations for every event type change.

### Negative
*   **Complexity**: The codebase now requires `async/await` handling throughout the unified query layer and state projection, increasing cognitive load slightly.
*   **Dev Infrastructure**: Local development now suggests running Docker (though SQLite fallback is preserved for now).
*   **Latency**: Network hops to DB introduce latency compared to in-memory/disk SQLite, though negligible for current scale.

### Technical Notes
*   The `events` table in Postgres uses `TIMESTAMPTZ` for `occurred_at` and `recorded_at` to ensure timezone correctness.
*   `access-control` logic was deeply intertwined with synchronous getters; care was taken to ensure `await` is properly used before filtering results.
