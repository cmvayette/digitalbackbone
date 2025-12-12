# Work Log: Phase 0 Backend Connection

**Date**: 2025-12-10
**Focus**: Priority 1 - Critical Path (Backend Connection)

## Accomplished
1.  **Prioritized Roadmap**: Updated `CONSOLIDATED_ROADMAP.md` with a clear execution plan (Critical, Compliance, Features, Polish).
2.  **Backend Seeding**:
    *   Identified that `apps/som-tier0` lacked a runner for its seed logic.
    *   Created `apps/som-tier0/src/seed/persistence-adapter.ts` to bridge existing logic with SQLite persistence.
    *   Created `apps/som-tier0/src/seed/run-seed.ts` as the entry point.
    *   Added `npm run seed:dev` to `package.json`.
3.  **Frontend Connection**:
    *   Refactored `apps/org-chart` to use `mode: 'real'` in `App.tsx`.
    *   Verified `DiscoveryBar` handles connection mode switching.

## Technical Details
*   **Persistence Adapter**: Intercepts `createHolon` calls to emit `EventType.*` events to `SQLiteEventStore`. This ensures `som.db` is populated with a full event history, satisfying the Event Sourcing architecture.
*   **Mock vs Real**: The frontend `useExternalOrgData` hook handles the switch seamlessly. Future work will involve removing the 'mock' mode entirely once all apps are migrated.

## Next Steps
*   Run `npm run seed:dev` to populate the DB.
*   Verify `apps/org-chart` loads data.
*   Repeat the "Real API Connection" process for:
    *   `apps/how-do`
    *   `apps/polic-governance`
    *   `apps/task-management`
    *   `apps/objectives-okr`
