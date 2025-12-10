# Stream 2: Frontend Brief
**Role**: The Product Builder
**Focus**: `apps/org-chart`, `apps/how-do`, `apps/policy-governance`

## Context
You are building the user-facing Experience Layer. To avoid being blocked by the backend team, you will use the **Mock Mode** of the API Client.

## Objectives
1.  **Org Chart Application**:
    -   Refactor/Build `apps/org-chart` to use `packages/api-client` instead of local store logic.
    -   **Critical**: Initialize the client with `createSOMClient({ mode: 'mock' })` (once available) or use the mock hooks provided.

2.  **UI Components**:
    -   Use and contribute to `packages/ui-components`.

## Rules of Engagement
-   **Mock First**: Assume the backend is broken or nonexistent. If you need data the mock doesn't provide, **update the Mock Generator in `packages/api-client`** (or ask the Tooling Agent) rather than waiting for the real backend.
-   **Visual Excellence**: Your output is what the user sees. Prioritize `index.css` vars and responsive layout.
