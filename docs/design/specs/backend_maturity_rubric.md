# Backend Readiness Rubric: From Simulation to Reality

**Objective**: Define the criteria for graduating the Digital Backbone from a generic "Frontend Demo" to a fully-functional "Mission System" backed by the SOM Event Store.

## Maturity Levels

### Level 0: Simulation (Current State)
*   **State**: Ephemeral (In-Memory).
*   **Logic**: Hardcoded mocks in `useExternal*` hooks.
*   **Persistence**: None. Refreshing the page resets data.
*   **Validation**: Client-side only (Zod schemas in forms).
*   **Verdict**: **Insufficient** for operational use. Good for UI prototyping.

### Level 1: Connectivity (The "Wire" Check)
*   **State**: External.
*   **Mechanism**: `api-client` makes real HTTP/RPC calls to `som-tier0`.
*   **Persistence**: In-Memory on Server (variable).
*   **Contract**: Shared Types (`Holon`, `Event`) are strictly enforced over the wire.
*   **Criterion**: "I can create an Org in the UI, verify network traffic, and see it in a raw 'GET /events' dump."

### Level 2: Persistence (The "Record" Check)
*   **State**: Durable.
*   **Mechanism**: `som-tier0` writes events to disk/database (SQLite/Postgres).
*   **Replay**: System restart restores state by replaying the Event Log.
*   **Criterion**: "I can restart the server container, and my Org Chart is exactly as I left it."

### Level 3: Enforcement (The "Rules" Check) — **TARGET STATE**
*   **State**: Validated.
*   **Mechanism**: The `Constraint Engine` rejects invalid events *before* they hit the log.
*   **Projections**: Optimized read-models (not just raw replays) power the UI.
*   **Criterion**: "If I try to assign an unqualified person to a billet via `curl`, the server rejects it with a Policy Error, and the UI never breaks."

---

## Technical Rubric (Definition of Done)

To consider the "Backend" sufficient for Phase 1 Release, we must hit **Level 2 (Persistence)** with the framework for Level 3 established.

| Component | Acceptance Criteria |
| :--- | :--- |
| **API Client** | - All `useExternal[Resource]` hooks replaced with `somClient.[resource]` calls.<br>- No mock data remaining in `apps/*/src/data`.<br>- Handles Network Errors gracefully (Toast/Retry). |
| **Event Store** | - Append-Only Log implemented (SQLite or File-based MVP).<br>- `POST /events` accepts valid payloads.<br>- `GET /events` returns chronological history. |
| **Projections** | - In-Memory "Current State" built from Event Log on startup.<br>- `GET /holons/[id]` returns 10ms response (no on-demand replay). |
| **Idempotency** | - Re-creating an existing Holon returns the existing ID (or error), not a duplicate. |

## Verification Plan

1.  **The "Kill Switch" Test**: Create data -> Kill Server -> Start Server -> Verify Data usage.
2.  **The "Bad Actor" Test**: Send malformed JSON to API -> Verify 400 Bad Request (not 500 crash).
3.  **The "Scale" Test**: Generate 1,000 events -> Verify UI loads in <1s.
