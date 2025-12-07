# Developer Stories: Epic 5 - Interactive Graph (Phase 3)

## Story 3.1: Implement Graph Data Hook
**As a** Frontend Developer
**I want to** fetch organizational structure data from the API
**So that** I can feed the graph visualization.

**Acceptance Criteria**:
1.  **Create Hook**: `useOrgStructure(orgId: string)`.
2.  **API Integration**: Call `GET /api/v1/temporal/organizations/:id/structure`.
3.  **Transformation**: Convert the API response (nested `OrganizationalStructure`) into a flat list of `nodes` and `edges` compatible with React Flow/React G6.
    *   Nodes: Org, Positions, People.
    *   Edges: Hierarchy, Reporting lines, Assignments.
15: 
16: ## Story 3.4: Integrate Real Data & Layout
17: **As a** User
18: **I want to** see the actual organizational structure automatically arranged
19: **So that** I don't have to manually position every node.
20: 
21: **Acceptance Criteria**:
22: 1.  **Integration**: Replace mock data in `App.tsx` with `useOrgStructure` hook.
23: 2.  **Auto-Layout**: Implement `dagre` or `elkjs` to calculate node positions from the flat list.
24: 3.  **Interactivity**: Ensure expanding/collapsing nodes triggers a re-layout.

## Story 3.2: Create Base Graph Canvas
**As a** User
**I want to** see a visual canvas that I can pan and zoom
**So that** I can explore the structure.

**Acceptance Criteria**:
1.  **Install Library**: Install `reactflow` (or `@xyflow/react`).
2.  **Component**: Create `GraphCanvas.tsx`.
3.  **Controls**: Enable Pan, Zoom, parsing of initial node positions (Dagre layout or similar).
4.  **Theme**: Style the background using the "Blueprint" aesthetic (dots/grid pattern).

## Story 3.3: Implement Custom Node Components
**As a** User
**I want to** see rich cards for each entity type
**So that** I can understand the hierarchy at a glance.

**Acceptance Criteria**:
1.  **OrgNode**: Implement `OrganizationCard` as a custom graph node.
2.  **PositionNode**: Implement `PositionCard` as a custom graph node.
3.  **PersonNode**: Implement `PersonCard` (or unified into Position).
4.  **Styling**: Use the CSS variables and DOM structure defined in `org_chart_ui_components.md`.
