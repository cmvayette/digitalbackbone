# 14. Polyglot Persistence Architecture (Neo4j, Redis, Postgres)

Date: 2025-12-12

## Status

Accepted

## Context

The initial implementation of `som-tier0` used in-memory stores (`InMemoryEventStore`, `GraphStore`) for rapid prototyping. However, to meet production requirements for scalability (20,000 users), persistence, and deep relationship traversals, a robust architecture is required.

As decisioned in ADR-012, Postgres is the Event Store. However, Postgres is not optimized for deep graph traversals required by the "Holon" relationships. Using in-memory graph projection limits scalability to the memory of a single container.

## Decision

We have decided to adopt a **Polyglot Persistence** architecture:

1.  **Event Store (Write/Audit)**: **PostgreSQL** (via `PostgresEventStore`).
    *   Single Source of Truth.
    *   Immutable Event Log.
    *   Supports JSONB for payloads.

2.  **Graph Store (Read/Query)**: **Neo4j** (via `Neo4jGraphStore`).
    *   Materialized view of the current state.
    *   Optimized for graph traversals (`getHolonRelationships`, `matchPattern`).
    *   Updated asynchronously via Event Sourcing projection.
    *   Deployed as a stateful container (volume mounted) or managed service.

3.  **Caching Layer (Reference)**: **Redis** (via `CachedGraphStore`).
    *   Read-through cache specific to high-volume identity lookups (`getHolon`).
    *   Cache-Aside pattern.
    *   Invalidation triggered by incoming Events.

4.  **Interface Abstraction**:
    *   The core application interacts with `ISemanticGraphStore` and `IEventStore`, unaware of the underlying infrastructure.

## Consequences

### Positive
*   **Scalability**: Graph queries run on Neo4j's native engine; State is not bound by RAM.
*   **Performance**: Redis provides sub-millisecond access for hot Holons.
*   **Resilience**: Data persists across service restarts.
*   **Query Power**: Cypher (Neo4j query language) enables complex semantic queries impossible in SQL/In-memory.

### Negative
*   **Operational Complexity**: Requires managing 3 stateful services (Postgres, Neo4j, Redis).
*   **Eventual Consistency**: There is a slight delay (ms) between Event Commit (Postgres) and Graph Update (Neo4j). Application logic must tolerate this or use causal consistency tokens (future work).
*   **Infrastructure Cost**: Higher resource footprint than a monolithic DB.

## Implementation Details
*   **Docker Compose**: The local stack orchestrates `som-tier0`, `postgres`, `neo4j`, and `redis`.
*   **Infrastructure as Code**: Terraform modules will provision these resources on AWS (ECS + RDS + ElastiCache + self-hosted Neo4j on Fargate/EC2).
