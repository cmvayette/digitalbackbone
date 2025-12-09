# Phase 1: Backend Persistence Design Spec
**Target Maturity**: Level 2 (Persistence)
**Objective**: Transition the Digital Backbone from ephemeral in-memory mocks to a durable, event-sourced core backed by SQLite.

## 1. Architectural Overview

The "Level 2" system introduces a physical separation between the **Frontend Layer** (Apps) and the **Core Layer** (SOM Tier-0).

```mermaid
flowchart LR
    subgraph Frontend["Frontend Layer (Apps)"]
        UI[React UI]
        Hooks[useSOM Hooks]
        Client[SOMClient (HTTP)]
    end

    subgraph Core["SOM Tier-0 (Node Service)"]
        Server[Express/Hono Server]
        Cmd[Command Handlers]
        Proj[In-Memory Projections]
        Store[(SQLite Event Store)]
    end

    UI --> Hooks
    Hooks --> Client
    Client -- "POST /commands" --> Server
    Client -- "GET /queries" --> Server

    Server --> Cmd
    Cmd --> Store
    Store -- "On Startup / Live" --> Proj
    Server -- "Read State" --> Proj
```

## 2. Component Design

### 2.1 The Event Store (SQLite)
We will use **SQLite** for the event log. It provides single-file portability, ACID transactions, and sufficient performance for Phase 1 scaling (10k+ events).

**Schema (`events` table):**
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,           -- UUID
  type TEXT NOT NULL,            -- e.g., 'OrganizationCreated'
  stream_id TEXT NOT NULL,       -- Holon ID (Aggregate ID)
  timestamp INTEGER NOT NULL,    -- Unix epoch (ms)
  actor_id TEXT NOT NULL,        -- Who did it?
  payload JSON NOT NULL,         -- The data
  metadata JSON                  -- Causality, Source System, etc.
);
CREATE INDEX idx_stream ON events(stream_id);
CREATE INDEX idx_type ON events(type);
```

### 2.2 In-Memory Projections
Because we are Event Sourced, we do not query the database for current state. We query **Projections**.
*   **Startup**: The server reads `SELECT * FROM events ORDER BY timestamp ASC` and "plays" them into in-memory Objects/Maps.
*   **Runtime**: Every new event written to SQLite is immediately applied to the in-memory Map.
*   **Performance**: Reads are O(1) or O(log n). Writes are O(1) + Disk I/O.
*   **Rebuild Time**: For 10k events, startup replay will be < 500ms.

### 2.3 The `SOMClient` (Frontend)
The client library (`packages/api-client`) will govern the "Wire Contract".
*   **Commands**: `client.command.createOrganization(...)` -> `POST /commands`
*   **Queries**: `client.query.getOrganization(...)` -> `GET /holons/:id`
*   **Live Updates**: (Optional for Phase 1) Polling or SSE for real-time drift.

## 3. Implementation Strategy

### Step 1: "The Core" (`apps/som-tier0`)
1.  Initialize a new Node.js service (Fastify or Hono).
2.  Implement `SQLiteAdapter`.
3.  Implement `EventManager` (append, subscribe).
4.  Port the existing `holon.ts` types to server-side Domain Logic.

### Step 2: "The Wire" (`packages/api-client`)
1.  Create `SOMClient` class.
2.  Implement methods matching our current mock hooks:
    - `useExternalOrgData` -> `client.getOrgTree()`
    - `useExternalProcessData` -> `client.getProcesses()`

### Step 3: "The Migration" (Bootstrapping)
The current "Mock Data" (JSON files) is valuable. We will write a **bootstrap script**:
1.  Read current `mock/org-data.json`.
2.  Transform each node into a valid `OrganizationCreated` or `PositionCreated` event.
3.  Write these events to the SQLite DB as the "Genesis Block".
4.  **Result**: The server starts up with the exact same data we have now, but it's *persistent*.

## 4. Acceptance Criteria (Rubric Level 2)
1.  **Persistence**: I can restart the `som-tier0` process, and the Org Chart data is preserved.
2.  **Idempotency**: I can re-run the bootstrap script, and it detects existing data (or we wipe/re-init explicitly).
3.  **Latency**: Graph load time < 200ms for the full tree (500 nodes).
