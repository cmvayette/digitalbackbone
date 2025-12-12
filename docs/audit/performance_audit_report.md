# Performance Audit Report

## Executive Summary
The `digital_backbone` codebase (specifically `som-tier0` and `how-do`) exhibits significant performance bottlenecks rooted in "naive event sourcing" implementations. The current architecture relies on full history replays for both write updates and read queries, which will scale poorly (O(N) to O(N^2)) as the event log grows. Frontend applications also demonstrate over-fetching patterns.

## 1. Critical Backend Bottlenecks (`som-tier0`)

### A. Graph Store Updates (O(N^2) Cumulative)
- **Issue**: The `GraphStore.updateFromNewEvent` method calls `rebuildIndices()`, which in turn triggers `StateProjectionEngine.replayAllEvents()`.
- **Impact**: Every single event written to the system causes a **full replay of the entire event history**. As the number of events (N) grows, processing the N+1th event takes O(N) time. Total time to process N events is O(N^2). This will bring the system to a halt under even moderate load.
- **Recommendation**: Implement incremental state updates in `GraphStore`. Only apply the new event to the existing in-memory graph indices instead of rebuilding from scratch.

### B. Historical Queries (O(N) per Query)
- **Issue**: `TemporalQueryEngine` relies on `stateProjection.replayEventsAsOf(timestamp)` for time-travel queries. This method fetches all events and replays them from the beginning of time.
- **Impact**: Queries like "What was the org structure on date X?" become linearly slower as history grows.
- **Recommendation**: Implement **Periodic Snapshots**. Store full state snapshots every K events (e.g., every 1000 events) or daily. Replays should start from the nearest previous snapshot, not the beginning of time.

### C. In-Memory Event Store Efficiency
- **Issue**: `InMemoryEventStore.getEvents` maps ALL event IDs to event objects before applying any filters.
- **Impact**: High memory churn and unnecessary CPU usage for simple queries.
- **Recommendation**: Filter IDs first using the existing `eventsByHolon` / `eventsByType` indices before instantiating/mapping the full event objects.

### D. Serial Recursion in `AvailabilityService`
- **Issue**: `AvailabilityService.getAllParentHolons` iterates through relationship types and `await`s results sequentially inside a recursive loop.
- **Impact**: High latency for availability checks on deeply nested holons.
- **Recommendation**: Parallelize the fetching of parent holons using `Promise.all`. Cache the hierarchy structure with a short TTL.

## 2. Frontend Bottlenecks

### A. Data Over-Fetching in `apps/how-do`
- **Issue**: The `ProcessViewerWrapper` component uses `useExternalProcessData()` to fetch **all** processes and then filters client-side to find the specific process by ID.
- **Impact**: Bandwidth waste and slow initial load times for the process view page.
- **Recommendation**: Implement `getProcess(id)` endpoint in the API and update the client hook to fetch only the required process.

### B. Build Configuration Issues
- **Issue**: `vite.config.ts` files in multiple apps (`how-do`, `org-chart`) appear to be empty or effectively zero-byte files.
- **Impact**: Potential build failures or fallback to unoptimized defaults.
- **Recommendation**: Restore or properly centralize the Vite configuration in `@som/build-config`.

## 3. Caching Strategy
- **Current State**: Minimal caching observed. `CachedGraphStore` exists in code but usage is inconsistent. React Query is used on frontend but with potentially too-long stale times (5 min) for a collaborative system.
- **Recommendation**: 
    - **Backend**: Enable Redis for `GraphStore` reads. Cache "Organization Structure" query results with key based on `lastEventId` or short TTL.
    - **Frontend**: Tune React Query `staleTime` based on entity volatility (e.g., Tasks change often, Policies rarely).

## 4. Prioritized Optimization Plan
1.  **[High]** Fix `GraphStore` incremental updates (Stop full replays on write).
2.  **[High]** Implement specific API endpoints (e.g., `GET /process/:id`) to stop frontend over-fetching.
3.  **[Medium]** Implement Snapshots for `StateProjectionEngine`.
4.  **[Medium]** Parallelize `AvailabilityService` lookups.
5.  **[Low]** Investigate and fix empty `vite.config.ts` files.
