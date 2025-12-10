# Audit: apps/som-tier0

* **Date:** 2025-12-10
* **Author:** Antigravity
* **Status:** Draft
* **Tags:** #audit #backend #som-tier0

## Summary
Initial investigation of the `apps/som-tier0` backend service. This service acts as the core Semantic Operating Model (SOM) engine, handling event ingestion, storage, and projections.

## Discussion / Thinking

### Architecture Overview
The server (`server.ts`) initializes a standard Hono application.

**Key Components identified:**
*   **Event Store**: In-memory (for now?) or SQLite? (`event-store`)
*   **SAL (Semantic Access Layer)**: Handles ingestion of external data.
*   **Graph Store**: `semantic-graph` for query capability.

### Observations
*   `server.ts` mounts `semanticAccessLayer` routes under `/api/v1/ingest`.
*   It mounts `api` routes under `/api/v1`.

### Potential Areas for ADRs
*   **Event Persistence**: `SQLiteEventStore` is implemented using `better-sqlite3`. Features:
    *   WAL mode enabled (good).
    *   Synchronous NORMAL (risk for durability vs perf?).
    *   `event_payload` stored as JSON text.
    *   **Decision needed**: Should we formalize the schema versions in the store itself beyond just the JSON payload?
*   **SAL Transformers**: Located in `ingestion/transformers`. Seems to imply a `Transformer` interface.
    *   Currently seeing `JsonPathTransformer` (Generic) and maybe others?
    *   **Decision**: Should we verify if we need a more specific transformer for complex legacy formats (e.g. XML/SOAP) or if JsonPath is sufficient via pre-conversion?
*   **Ingestion Pipeline**: `pipeline.ts` orchestrates the flow.

### Observations - Deep Dive
#### Event Store (`sqlite-store.ts`)
*   Uses `better-sqlite3`.
*   Table `events`: `id` (UUID), `type`, `occurred_at`, `actor`, `subjects` (JSON array), `payload` (JSON), `source_system`.
*   It does NOT seem to enforce unique constraints on `subjects` + `type` + `occurred_at` (idempotency risk?).
*   **Action**: Verify idempotency mechanism.

#### SAL Ingestion
*   Structure: `Adapter` -> `Transformer` -> `Pipeline`.
*   Clean separation of concerns.


#### Constraint Engine (`constraint-engine/index.ts`)
*   Uses `json-logic-js` for rule evaluation.
*   Enforces invariants on Events.
*   **Observation**: Seems robust, but need to ensure rules are versioned if they change (Schema Versioning handles this?).

## Decisions / Action Items
- [x] **ADR 001**: Event Idempotency Strategy (Proposed).
- [ ] Verify Event Store persistence guarantees (Actioned in ADR 001).
- [ ] Review SAL Transformer pattern for extensibility.
