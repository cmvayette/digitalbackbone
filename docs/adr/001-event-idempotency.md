# ADR 001: Event Store Idempotency Strategy

* Status: proposed
* Deciders: Antigravity, User
* Date: 2025-12-10

Technical Story: [SOM-TIER0-audit]

## Context and Problem Statement

The `SQLiteEventStore` currently inserts events without strict unique constraints on the combination of (`type`, `subjects`, `occurred_at`, `payload_hash`). While `id` is unique (UUID), upstream retries or duplicate inputs from the SAL could lead to duplicate semantic events being recorded, polluting the immutable log.

## Decision Drivers

*   **Data Integrity**: The SOM must be the single source of truth.
*   **System Robustness**: Upstream systems (SAL adapters) may be "at least once" delivery.

## Considered Options

*   **Option 1: Database-level Unique Index**: Create a unique index on `(type, subjects_hash, occurred_at)`.
*   **Option 2: Application-level Deduction**: calculating a hash of the event payload and checking existence before insert.
*   **Option 3: Ignore (Status Quo)**: Rely on upstream to be perfect.

## Decision Outcome

Chosen option: **Option 1 (Database-level Unique Index)** (Proposed).

We should add a generated column (if sqlite supports) or just index on `deduplication_key` which is derived from content.

### Positive Consequences

*   Guarantees no semantic duplicates.
*   Simplifies client logic (just retry, if fail duplicate, ignore).

### Negative Consequences

*   Slight write performance penalty.
