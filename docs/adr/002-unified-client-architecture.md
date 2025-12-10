# ADR 002: Unified Client Architecture

## Status
Accepted

## Context
We have multiple frontend applications (`task-management`, `objectives-okr`, `policy-governance`, `org-chart`) that need to access the Semantic Operating Model (SOM) data.
Initially, apps used ad-hoc data fetching, hardcoded mocks, or inconsistent state management patterns (Redux, Zustand with fetch loops, raw Context).
We need a standard way to interface with the core data layer.

## Decision
We will standardize all Tier-1 Applications on the following stack:

1.  **`@som/api-client`**: The single source of truth for API communication (HTTP/socket).
    -   Must enable switching between `RealSOMClient` (HTTP) and `MockSOMClient` (In-Memory Faker) via config.
2.  **`@tanstack/react-query`**: The standard for server-state management in React apps.
    -   Handles caching, deduping, loading states, and invalidation.
3.  **Domain Hooks**: Apps should consume data via domain-specific hooks (e.g., `useExternalTaskData`, `useStrategyData`) that wrap `react-query` logic.
4.  **Pure Stores**: Client-side stores (Zustand) should only be used for *UI state* (selection, view modes) or as a sync target for data if complex derivation is needed. They should *not* contain data fetching logic.

## Consequences
- **Positive**: Consistent developer experience across apps.
- **Positive**: "Mock First" development enabled by the unified MockClient.
- **Positive**: Reduced boilerplate in individual apps.
- **Negative**: Adds `react-query` dependency to all apps (small bundle size cost).
- **Negative**: Requires refactoring existing apps (Streams 10, 11, 12).
