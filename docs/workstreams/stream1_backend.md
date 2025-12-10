# Stream 1: Backend & Ingestion Brief
**Role**: The Architect
**Focus**: `apps/som-tier0`, `packages/som-shared-types`

## Context
You are responsible for the core logic and data ingestion of the System of Models (SOM). The frontend team is working in parallel using mocks, so your primary contract is `packages/som-shared-types`.

## Objectives
1.  **Implement Semantic Access Layer (SAL)**:
    -   Location: `apps/som-tier0/src/semantic-access-layer`
    -   Pattern: Implement Adapters (fetch data) and Transformers (convert to SOM Events) for external data sources.
    -   Verification: Unit write tests for your transformers.

2.  **API Implementation**:
    -   Ensure the `som-tier0` server endpoints match the expectations of `packages/api-client` (which derives from generic shared types).

## Rules of Engagement
-   **Contract First**: Do not change `som-shared-types` without coordinating with the Team Lead (User), as it breaks the Frontend Agent.
-   **Ignore UI**: You do not need to run the frontend. Use `npm run test` in `som-tier0` to verify your work.
