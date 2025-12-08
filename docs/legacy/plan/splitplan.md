# Parallel Execution Plan

## Executive Summary
To accelerate development, we will split the remaining work into 4 Parallel Workstreams. Each workstream can be executed by a separate agent (or developer) simultaneously.

**Key Enabler**: The **Hub-and-Spoke** architecture allows us to treat each App as a client of the SOM Tier-0. As long as the "Contract" (Schemas & Events) is agreed upon, apps do not need to wait for each other.

---

## 1. The Rules of Engagement
To prevent conflicts and integration hell, all Agents must adhere to these rules:

1.  **Immutable Shared Core**: Agents may **NOT** modify `apps/som-tier0` or `packages/som-shared-types` core logic.
    *   *Exception*: New event types defined in the Plan can be added, but must follow the specific pattern.
2.  **Mock Dependencies**: Agents must not wait for another app to exist.
    *   *Example*: The Task App needs "Obligations" from the Policy App. The Task App Agent **MUST** write a `seeder.ts` script to inject fake "Obligation Events" into the local SOM to build against.
3.  **Strict Directories**: Each Agent owns exactly one directory within `apps/` (e.g., `apps/policy-governance`).

---

## 2. Workstreams

### **Workstream A: Policy & Governance Agent**
*   **Focus**: `apps/policy-governance`
*   **Goal**: A UI to author policies and extract obligations.
*   **Dependencies**: Needs OrgStructure (Positions) to assign obligations.
*   **Mocking**: Use the existing OrgChart data.
*   **Output**: Emits `DocumentIssued` and `ObligationDefined` events.

### **Workstream B: How-Do (Process) Agent**
*   **Focus**: `apps/how-do`
*   **Goal**: A UI to define processes (swimlanes) and link steps to roles.
*   **Dependencies**: Needs OrgStructure (Roles) and Policy (Constraints).
*   **Mocking**: Create a local `mock-policy.json` loader to simulate existing policies to link against.
*   **Output**: Emits `ProcessDefined` and `ProcessExecuted` events.

### **Workstream C: Task & Execution Agent**
*   **Focus**: `apps/task-management` AND `apps/calendar`
*   **Goal**: A Unified Inbox and Calendar for a Position.
*   **Dependencies**: Needs Obligations (from Policy), ProcessSteps (from How-Do), and Objectives (from OKR).
*   **Mocking**: **HEAVY MOCKING REQUIRED**. Must create a `seed-workload.ts` that triggers:
    *   "Daily Standup" (Process Step)
    *   "Submit Report" (Policy Obligation)
*   **Output**: Emits `TaskCreated`, `TaskCompleted`, `TaskReassigned`.

### **Workstream D: Strategy & Insights Agent**
*   **Focus**: `apps/objectives-okr` AND `apps/measures-lenses`
*   **Goal**: Dashboards showing hierarchy of Intent and Performance.
*   **Dependencies**: Needs TaskCompletion events and ResourceState (from Org Chart).
*   **Mocking**: Needs a "Traffic Generator" that simulates 100 tasks being completed over the last 30 days to populate the graphs.
*   **Output**: Emits `ObjectiveSet`, `KeyResultUpdated`, `LensEvaluated`.

---

## 3. The "Contract": Shared Event Catalog
All agents agree to consume and emit these events.

| Event Type | Owner | Structure Preview |
| :--- | :--- | :--- |
| `DocumentIssued` | Policy Agent | `{ title: string, content: string, status: 'active' }` |
| `ObligationExtract` | Policy Agent | `{ statement: string, assignedTo: PositionID, sourceDoc: ID }` |
| `ProcessDefined` | How-Do Agent | `{ steps: [{ name: string, owner: PositionID }] }` |
| `TaskCreated` | Task Agent | `{ title: string, due: Date, priority: 'High' }` |
| `TaskCompleted` | Task Agent | `{ completionTime: Date, outputArtifacts: [] }` |
| `ObjectiveSet` | Strategy Agent | `{ statement: string, targetMetric: string }` |

---

## 4. Setup Instructions for Each Agent

### Pre-Flight:
1.  Ensures `npm install` and `npm build` (shared types) is run.
2.  Read `SystemPlan.md` and `apps/som-tier0/schemas/v1/*.json`.

### Agent A Init:
"Your goal is to scaffold `apps/policy-governance` using Vite + React. Focus on the Policy Editor."

### Agent B Init:
"Your goal is to scaffold `apps/how-do` using Vite + React. Focus on the Swimlane Editor."

### Agent C Init:
"Your goal is to scaffold `apps/task-management`. First, create a script `scripts/seed-tasks.ts` to push mock events to SOM, then build the Inbox UI."

### Agent D Init:
"Your goal is to scaffold `apps/objectives-okr`. First, create a script `scripts/seed-history.ts` to generate historical event data, then build the Dashboard."