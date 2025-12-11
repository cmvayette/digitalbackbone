# Note: Org Chart Search Strategy

## Context
The current `useSearch` hook in `apps/org-chart` filters *loaded* graph nodes. The proposed refactor is to use `api-client.search`.

## Discrepancy
- **Current**: Filters `@xyflow/react` nodes already in memory. Instant feedback.
- **Proposed**: Calls API. Returns global results.
- **Problem**: API results might not be in the current graph.

## Resolution Strategy
1. **Hybrid Approach**:
    - If the user is searching *within* the context (e.g. "Find where 'Bob' is in this chart"), we might want client-side.
    - However, for "Discovery", we likely want global search.
2. **Decision**: The component is named `DiscoveryBar`. This implies looking for things *outside* or *inside*.
    - If `api.search` returns an ID, and that ID is in the graph, we focus it.
    - If it's NOT in the graph, we might want to *load* it (navigation).
    - I will proceed with switching to `api-client` because "Tier-1" assumes we don't hold the whole world in memory.

## TODO
- Ensure `DiscoveryBar` handles results that are just "References" (ID/Label) rather than full Nodes.
