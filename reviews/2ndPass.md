# Codebase Review Findings - 2nd Pass

This document tracks issues, technical debt, and areas for improvement identified during the second pass review of the `digital_backbone` monorepo.


## 1. Systemic "Write" Disconnection in Tier-1 Apps
**Impact**: High | **Scope**: `how-do`, `objectives-okr`, `policy-governance`, `task-management`

While `org-chart` was refactored to emit events, the other four Tier-1 applications remain in a "prototype" state regarding data persistence. They manage state strictly locally (Zustand/React State) and do not emit events to the SOM Event Store.
- **Evidence**:
  - `apps/policy-governance/.../policyStore.ts`: `createPolicy` uses `Date.now()` IDs and updates local state only.
  - `apps/task-management/.../taskStore.ts`: `addProject` updates local state only.
  - `apps/objectives-okr`: `useStrategyData.ts` explicitly warns `Write to server not implemented yet`.
  - `apps/how-do`: `useProcess.ts` mutations are local-only.

**Recommendation**:
Refactor stores/hooks in these applications to use the `SOMClient.submitEvent` method, similar to the `org-chart` refactor.

## 2. Weak Type Safety in API Client
**Impact**: High | **Scope**: `packages/api-client`

The `api-client` package has not been updated to enforce the new strict strict validation patterns established in `som-shared-types`.
- **Evidence**:
  - `SubmitEventRequest` interface uses `payload: Record<string, unknown>` instead of the `TypedEvent` discriminated union.
  - This allows invalid payloads to be sent from the client side, relying entirely on backend validation (or crashing the ingestion adapter if validation is missing there).

**Recommendation**:
Refactor `SOMClient.submitEvent` to accept `TypedEvent<T>` generic arguments, enforcing type safety at the IDE level for application developers.

## 3. Mock Data & "Happy Path" Hardcoding
**Impact**: Medium | **Scope**: `packages/api-client`

The API client contains logic that bypasses the backend and returns hardcoded mocks, which misleads developers about the actual system readiness.
- **Evidence**:
  - `getObjectivesForLOE` implementation has code comments like `// Fix: If error, return error` and creates objects with `name: 'Mock Name'`.
  - `useStrategyData` (used by `objectives-okr`) relies on these potential mocks.

**Recommendation**:
Remove mock logic from the `api-client` and rely on the actual Tier-0 backend responses. Use local mocks (MSW) or a mock server mode if backend is unavailable, but do not mix mock logic into the production client.

## 4. Widespread use of Prototype Patterns
**Impact**: Low/Medium | **Scope**: All Tier-1 Apps

- **ID Generation**: `Date.now()` is still pervasive for ID generation (e.g., `obj-${Date.now()}`), which risks collisions.
- **Hardcoded Actors**: `'system'` or `'user'` strings are used instead of real user context.

**Recommendation**:
Standardize on `uuid` (as done in `org-chart`) and inject a user context provider across all apps.

