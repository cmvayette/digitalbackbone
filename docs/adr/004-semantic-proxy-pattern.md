# ADR 004: Semantic Proxy & Agent Actors

## Status
Accepted

## Date
2025-12-10

## Context
The Digital Backbone aims to unify operations across human and automated systems. Traditional process engines often treat "system steps" as hidden backend logic or generic API calls. However, in our "How-Do" operational workflow, we need to:
1.  Visually represent work happening in external systems (e.g., a ticket in Jira) without replicating all its data.
2.  Explicitly assign steps to specific AI Agents (e.g., "Logistics Bot") alongside human staff.
3.  Maintain a "Human-on-the-Loop" visibility where agents are first-class actors in the process.

## Decision

### 1. Semantic Proxy Pattern
We will implement a "Semantic Proxy" pattern where a `ProcessStep` can act as a lightweight pointer to an external entity.
-   **Structure**: The `ProcessStep` retains its standard `ProcessStep` interface but utilizes the `source`, `externalId`, and `externalSource` properties to link to the outside world.
-   **Rendering**: The UI will distinguish these steps visually (e.g., distinct borders, badges) to indicate "this work lives elsewhere."

### 2. Agents as First-Class Actors
We will treat AI Agents as distinct entities in the Organization Graph (`HolonType.Agent`).
-   To support this, we extend the `ProcessStep` interface with an explicit `assigneeType` property:
    ```typescript
    assigneeType: 'human' | 'agent' | 'system';
    ```
-   **'human'**: Refers to a `Person` or `Position` (traditional).
-   **'agent'**: Refers to a `HolonType.Agent`. This allows us to assign a specific bot (e.g., "Review Bot v1") to a step just like a human.
-   **'system'**: Refers to a generic automated process or headless service (future use).

## Consequences

### Positive
-   **Unified Visibility**: Commanders can see "who" is doing the work, whether it's a Private, a Bot, or an external Jira ticket, all in one swimlane view.
-   **Flexibility**: We can swap a human assignee for an agent assignee without changing the fundamental structure of the process step.
-   **Mock-First Development**: By defining `HolonType.Agent`, we can mock these actors effectively in `api-client` for frontend development before the actual agent backend is live.

### Negative
-   **Complexity**: The UI must now handle multiple assignee types, requiring more complex picker logic (e.g., tabs for Staff vs. Agents) and rendering logic.
-   **Data Consistency**: Proxy tasks rely on the external ID being valid. If the external system implementation changes, the proxy link might break (drift).
