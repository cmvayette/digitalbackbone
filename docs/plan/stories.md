# Developer Stories: Epic 4 - Org Chart App (Phase 1)

## Story 1.1: Refine Tier-0 Ontology
**As a** System Architect
**I want to** update the SOM Ontology to support `Process` and `TigerTeam` concepts
**So that** the Org Chart has a valid semantic substrate.

**Acceptance Criteria**:
1.  **Modify `holon.ts`**:
    *   Add `HolonType.Process`.
    *   Define `Process { name, description, ... }`.
    *   Update `Organization` with `isTigerTeam` boolean.
2.  **Modify `relationship.ts`**:
    *   Add `RelationshipType.PROVIDES` (Org -> Process).
3.  **Run Linter**: Ensure no semantic violations.

## Story 1.2: Implement Cross-Type Search API
**As a** Frontend Developer
**I want to** query Organizations, Positions, and People in a single API call
**So that** the Discovery Bar can be "Google-like".

**Acceptance Criteria**:
1.  **Create Endpoint**: `GET /api/v1/search`.
2.  **Logic**:
    *   Accept `q` (query string).
    *   Search across `HolonType.Organization`, `Position`, `Person`.
    *   Return unified schema: `{ id, type, title, subtitle, matchScore }`.
3.  **Tests**: Unit tests covering relevance sorting.

## Story 1.3: Initialize Frontend Workspace
**As a** Frontend Developer
**I want to** have a clean, configured `apps/org-chart` workspace
**So that** I can start building UI components.

**Acceptance Criteria**:
1.  **Structure**: `apps/org-chart` created with Vite/React/TS.
2.  **Design System**: Tailwind configured with "Blueprint" colors (Dark Mode default).
3.  **Routing**: Basic router set up.
4.  **Harness**: Needs to run via `npm run dev`.
