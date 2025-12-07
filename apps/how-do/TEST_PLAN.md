# Test Plan: How-Do App & Semantic Proxies

## 1. Objectives
Verify that the `How-Do` application and `som-shared-types` support the "Semantic Proxy" and "IActor" strategies defined in the Design Strategy.

## 2. Shared Type Verification (Pre-requisite)
**Location**: `packages/som-shared-types/src/holon.test.ts` (New file needed if not exists)

### Scenario: Actor Unification
*   **Test**: Define a `Position` that accepts an `Agent` as an occupant.
*   **Expectation**: Typescript should allow `assignee: Agent` where `assignee: IActor` is expected.
*   **Code**:
    ```typescript
    const agent: Agent = { type: HolonType.Agent, ... };
    const task: Task = { assignee: agent ... }; // Should pass
    ```

### Scenario: Semantic Proxy
*   **Test**: Create a `Task` that represents a JIRA ticket.
*   **Expectation**: It must have `source: 'external'` and `externalRefId`.
*   **Code**:
    ```typescript
    const jiraTask: Task = {
      type: HolonType.Task,
      source: 'jira',
      externalId: 'PROJ-123',
      ...
    };
    ```

## 3. How-Do App Verification
**Location**: `apps/how-do/src/components/SwimlaneEditor.test.tsx`

### Scenario: Rendering Proxy Tasks
*   **User Story**: "As a user, I want to see JIRA tickets in my swimlane alongside native tasks."
*   **Setup**: Mock specific `Task` objects with `source: 'jira'`.
*   **Action**: Render `SwimlaneEditor` with these tasks.
*   **Verification**:
    *   Find element with text "PROJ-123".
    *   Verify it has a visual indicator (e.g., "JIRA" badge or different border).

### Scenario: Agent Assignment
*   **User Story**: "As a user, I want to assign a step to an AI Agent."
*   **Action**: Open "Owner Picker".
*   **Verification**:
    *   List includes `Agent` holons.
    *   Selecting an Agent correctly updates the step's `ownerId`.

## 4. Integration Verification (Manual/E2E)
*   **Command**: `npm run dev` in `apps/how-do`.
*   **Manual Step**:
    1.  Create a Process.
    2.  Add a Step.
    3.  Set Owner to an "AI Logistics Agent" (Mocked).
    4.  Save.
    5.  Verify JSON output contains the Agent's ID.
