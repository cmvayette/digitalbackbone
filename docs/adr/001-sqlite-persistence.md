# 001-Use SQLite for Local Persistence

* Status: accepted
* Deciders: Antigravity, User
* Date: 2025-12-10

Technical Story: Phase 3 of C-ATO Readiness Roadmap

## Context and Problem Statement

The `som-tier0` service currently uses an `InMemoryEventStore`. This means that all data (Events, Holons, Relationships) is lost whenever the server restarts. This hinders meaningful development, testing of multi-step workflows, and demonstrations of the system's capabilities. We need a persistence mechanism that is durable across restarts but lightweight enough for local development and eventual containerization.

## Decision Drivers

* **Durability**: Data must survive process restarts.
* **Simplicity**: Setup should be minimal for developers (no external DB process required for local dev).
* **Compatibility**: The event sourcing model (append-only log) must be supported.
* **Future Proofing**: Should pave the way for a robust production database (Postgres) later.

## Considered Options

* **InMemoryEventStore**: Current solution. Fast, but no durability.
* **JSON File Store**: Simple, human-readable, but poor performance and concurrency handling.
* **SQLiteEventStore**: Embedded SQL database. Robust, single-file, zero-configuration.
* **PostgresEventStore**: Full production database. High complexity for current dev stage.

## Decision Outcome

Chosen option: "**SQLiteEventStore**", because it provides robust ACID compliance and SQL querying capabilities in a single file (`som.db`), balancing durability with ease of use for the current Phase 3 requirements.

### Positive Consequences

* **Data Persistence**: restart-proof development.
* **Zero Config**: No need to run `docker compose` just to start the API.
* **SQL Standard**: Uses standard SQL, making migration to Postgres easier later.

### Negative Consequences

* **File System Dependency**: Requires a writable file system (stateful container), which requires care during containerization (Phase 4).
* **Concurrency Limits**: SQLite writes are serialized (single writer), acceptable for current Tier-0 scale.

## Pros and Cons of the Options

### SQLiteEventStore

* Good, because it is serverless and embedded.
* Good, because it is widely supported in Node.js via `better-sqlite3`.
* Good, because it supports relational queries for projections if needed.
* Bad, because it is not suitable for high-availability distributed deployment (future concern).
