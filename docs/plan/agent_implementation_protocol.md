# Agent Implementation Protocol: The "Review-Verify-Task" Cycle

This protocol defines the standard operating procedure for AI Agents (including the primary Assistant) to operationalize the `Layered Design Strategy`.
It ensures that **no code is written without context**, and **no task is started without a test plan**.

---

## The 4-Step Architecture

For any given component (e.g., `How-Do`, `Policy Governance`), the Agent normally proceeds through these four distinct phases:

### Phase 1: Context Alignment (Input Phase)
**Goal**: Load the "Mental Model" of the system before looking at specific lines of code.

*   **Required Reading**:
    1.  `docs/design/layered_design_strategy.md` (The "Bible").
    2.  `docs/design/system_architecture.md` (The "Map").
    3.  `docs/design/specs/{component_name}.md` (The "Target").
*   **Output**: The agent acknowledges the *Intent* of the component (e.g., "I understand this component is a 'Semantic Proxy' for JIRA").

### Phase 2: Gap Analysis (Review Phase)
**Goal**: Compare the *Ideal State* (Specs) with the *Actual State* (Current Codebase).

*   **Action**:
    1.  Agent scans `apps/{component}/src` and `packages/som-shared-types`.
    2.  Agent identifies:
        *   **Missing Holons**: Types defined in Spec but not in Code.
        *   **Architectural Violations**: Places where Frontend writes to DB instead of emitting Events.
        *   **Missing Tests**: Features promised in Spec but absent in `vitest`.
*   **Output**: A **Delta Report** (Markdown list of missing capabilities).

### Phase 3: Verification Planning (The "Gate")
**Goal**: Define *how* we will know we are done. **We do not write code until we know how to test it.**

*   **Action**:
    1.  Agent writes (or updates) `apps/{component}/TEST_PLAN.md`.
    2.  Agent defines:
        *   **Scenario**: "User creates a JIRA Ticket via Webhook."
        *   **Expected Event**: `TaskCreated { source: 'external' }`.
        *   **Verification**: "Query `GET /tasks` entails the new task."
*   **Output**: A set of `describe(...)` blocks in a `.test.ts` file (even if empty/todo).

### Phase 4: Task Generation (Output Phase)
**Goal**: Explode the Gap Analysis into atomic, executable units of work.

*   **Action**:
    1.  Agent updates the global `task.md`.
    2.  Tasks are "Vertical Slices" (e.g., "Implement JIRA Webhook Listener"), not "Horizontal Layers" (e.g., "Add Database Column").
*   **Output**: Populated `task.md` with estimated complexity.

---

## Applied Workflow: "How to run this now"

To apply this to the current project, we will execute this loop for each Tier-1 Application:

1.  **Run Cycle for `apps/policy-governance`** (High Priority: Foundation).
    *   *Check*: Does it have `IActor`? Does it have "Draft" mode?
2.  **Run Cycle for `apps/how-do`** (High Priority: Process).
    *   *Check*: Does it allow "Semantic Proxies"?
3.  **Run Cycle for `som-shared-types`** (Critical Path).
    *   *Check*: Are `HolonType.Agent` and `IActor` defined?

## Review Checklist for Agents

When reviewing code against the Strategy, the Agent asks:

1.  **Event Source Check**: "Does this mutate state directly? If yes, FAIL. Must emit Event."
2.  **Proxy Check**: "Are we copying JIRA data we don't need? If yes, FAIL. Use Shadow/Proxy."
3.  **Governance Check**: "Is the logic hardcoded? If yes, FAIL. Must be driven by Policy/Constraint Engine."
