# 001-Task Management App Migration Strategy

* **Date:** 2025-12-10
* **Author:** Antigravity
* **Status:** Done
* **Tags:** #migration #react #api-client

## Summary
Strategy for migrating the `apps/task-management` application from local state/mock logic to the unified `@som/api-client`.

## Discussion / Thinking

The `apps/task-management` app currently uses a `taskStore.ts` that mixes data fetching (via a primitive direct SOM client or mocks) and local state management. To align with the Tier-1 Architecture Strategy, we need to separate these concerns.

### Current State
- `taskStore.ts`: Handles fetching, mocking, and state updates.
- Data Models: `Task`, `Project` (conceptually), `Milestone`.
- Backend: Partial support in `som-tier0` (Events defined, but query model might be thin).

### Migration Strategy
1.  **Mock First**: Update `@som/api-client` to natively support `HolonType.Initiative` (Projects) and `Task` data generation in its `MockSOMClient`. This decouples frontend work from backend readiness.
2.  **Hook Exclusion**: create `useExternalTaskData` to encapsulate all `SOMClient` interactions. This hook will own the verification of "Loading/Error/Success" states.
3.  **Store simplification**: Reduce `taskStore` to a "dumb" client-side cache that just holds the data passed to it by the hook/subscriptions.
4.  **Standardization**: Ensure `App.tsx` follows the same "Hook -> Store Sync" pattern used in `apps/org-chart` and `apps/policy-governance`.

### Logic Mapping
- **Projects** -> Map to `HolonType.Initiative`.
- **Tasks** -> Map to `HolonType.Task`.
- **Milestones** -> Keep as property of Initiative or separate Holon? *Decision: For now, keep as simplified properties or mock data until backend schema matures.*

## Decisions / Action Items
- [x] Update `MockSOMClient` to generate `Initiative` holons.
- [ ] Create `useExternalTaskData` hook.
- [ ] Refactor `taskStore` to remove internal fetching logic.
- [ ] Update `App.tsx` to integrate.
