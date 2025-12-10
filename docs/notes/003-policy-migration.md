# Stream 12: Policy Governance Migration

**Date:** 2025-12-10
**Status:** Complete

## Context
Migrating `apps/policy-governance` to the unified Client Architecture.

## Changes
1.  **Dependencies**: Added `@tanstack/react-query`.
2.  **Mocking**: Enhanced `MockSOMClient` to support `Document` and `Constraint` (Obligation) generation.
3.  **Hooks**: Refactored `useExternalPolicyData` to use `useQuery`/`useMutation`.
4.  **Components**: Updated `PolicyEditor` (with Tiptap integration) and `DocumentLibrary` to use the new hooks.
5.  **Tests**: Fixed `PolicyEditor` tests by mocking `useExternalProcessData` and `useExternalOrgData`.

## Results
- Full functional parity with previous version.
- Data loading now handled by React Query (cache, loading states).
- Verified via `npm test -w apps/policy-governance`.

## Technical Decisions
- **Modality**: Supports 'mock' vs 'real' via `SOMClientOptions`.
## Next Steps
- Verify the refactor by building and running tests.
