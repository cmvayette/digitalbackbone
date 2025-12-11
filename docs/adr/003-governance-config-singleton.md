# ADR 003: Governance Configuration as a Singleton Holon

## Status
Accepted

## Context
Command Leadership requires the ability to "tune" the behavior of the software ecosystem—specifically search relevance, health scoring, and compliance sensitivity—without requiring code changes or deployments. This reflects a "Commander's Intent" that shifts over time (e.g., shifting focus from "Innovation" to "Compliance" before an inspection).

Traditionally, these heuristics are hardcoded ("Magic Numbers") or hidden in environment variables, making them inaccessible to operational leadership.

## Decision
We will model the global governance configuration as a **Singleton Holon** (`HolonType.GovernanceConfig`) within the graph itself.

### 1. Singleton Pattern
While Holons are typically numerous (People, Assets, Tasks), the `GovernanceConfig` Holon will typically have only one active instance per Organization or Tenant. This instance acts as the "Source of Truth" for system behavior.

### 2. Graph Persistence
By storing configuration as a Holon (`GovernanceConfig`), we leverage existing graph capabilities:
*   **Versioning/History**: We can track *who* changed the settings and *when* (Audit Trail).
*   **Versioning**: We can rollback to previous configurations easily.
*   **Access Control**: Standard RBAC applied to Holons can restrict write access to Command Staff.
*   **Unified API**: The frontend consumes it via `SOMClient` just like any other data entity, simplifying the architecture (no separate "Config Service").

### 3. Client-Side Consumption
*   Clients (e.g., `apps/how-do`) will fetch the active `GovernanceConfig` on startup/mount.
*   Components (Search, Health Dashboard) will reactively update their algorithms based on the current loaded config.
*   This enables "Real-time" tuning where changes in the Admin UI propagate to users (on next fetch/search).

## Consequences
### Positive
*   **No new infrastructure**: Uses existing Graph/Holon storage.
*   **Auditability**: Every tweak to the system is recorded as an event in the graph.
*   **Flexibility**: New tuning parameters can be added to the Holon properties schema without database migrations (assuming NoSQL/JSON properties).

### Negative
*   **Latency**: Fetching config from the graph might add initial load time compared to baked-in constants. (Mitigation: Aggressive caching, distinct from volatile operational data).
*   **Complexity**: Components must handle "Loading" or "Error" states for configuration, defaulting to sensible hardcoded fallbacks if the config fetch fails.
