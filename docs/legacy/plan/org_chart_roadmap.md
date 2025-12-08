# Build Roadmap: Org Chart Application

**Objective**: Deliver a production-ready, vision-aligned "Organizational Explorer" application (Tier-1) backed by the Semantic Operating Model (Tier-0).

---

## Phase 1: Tier-0 Foundation (The Substrate)
**Goal**: Ensure the Ontology and API Layer can support the specific data requirements of the Design Spec.

### 1.1 Ontology Updates (`packages/som-shared-types`)
*   **Update `Organization` Interface**:
    *   Add relationship: `PROVIDES` -> `Process` (The services offered).
    *   Add `isTigerTeam: boolean` property.
*   **New Holon Type: `Process`** (The "How-Do"):
    *   Properties: `name`, `description`, `inputs`, `outputs`, `estimatedDuration`.
    *   Defined By: `Document` (SOP/Instruction).
*   **Update `Position` Interface**:
    *   Ensure `billetStatus` and `occupantType` match the spec.

### 1.2 API Layer Enhancements (`apps/som-tier0/src/api`)
*   **New Endpoint: Unified Search (`GET /api/v1/search`)**:
    *   Why: The "Discovery Bar" needs to query Orgs, Positions, and People simultaneously.
    *   Input: `query`, `types[]`, `limit`.
    *   Output: `{ type, id, label, relevance }[]`.
*   **Enhance Org Structure Endpoint**:
    *   Verify `GET /api/v1/temporal/organizations/:id/structure` returns the "3-band window" (Parent, Self, Children) efficiently.

---

## Phase 2: Application Skeleton (The Frame)
**Goal**: Initialize the Tier-1 Workspace and set up the "Blueprint" aesthetic.

### 2.1 Workspace Setup
*   Initialize `apps/org-chart` (Vite + React + TypeScript).
*   Configure TailwindCSS with the "Blueprint" theme (Dark Mode default, Monoline styling).
*   Set up API Client (using `tanstack-query` for caching).

### 2.2 Core Layout Components
*   **`AppShell`**: Main container.
*   **`DiscoveryBar`**: Top-centered search input (visual shell only).
*   **`GraphCanvas`**: The main viewport (Zoom/Pan enabled).
*   **`SidePanel`**: Collapsible right-side detail view.

---

## Phase 3: The Interactive Graph (The "Map")
**Goal**: Render the Organization Chart visually and allow navigation.

### 3.1 Holon Cards
*   Implement `OrganizationCard` (Name, Health Dot, Child Count).
*   Implement `PositionCard` (Title, Vacancy Indicator).
*   Implement `PersonCard` (Name, Rank).

### 3.2 Graph Logic
*   Implement `useOrgStructure(orgId)` hook.
*   Implement Tree Layout algorithm (D3 or ReactFlow).
*   **Navigation**: Clicking a child re-centers the graph (fetches new structure).

### 3.3 Visual Polish
*   Implement "Smart Connections" (Monoline edges).
*   Implement "Smart Hover" tooltips.

---

## Phase 4: Discovery & Action (The "Work Surface")
**Goal**: Make the graph searchable and actionable.

### 4.1 Search Implementation
*   Wire up `DiscoveryBar` to `GET /api/v1/search`.
*   Implement "Jump to Node" behavior (select result -> load org -> center).

### 4.2 Sidebar Details
*   **Org Details**: Show Services list, Roster summary.
*   **Position Details**: Show Requirements, Assign Button.
*   **Person Details**: Show Quals, Assignments.

### 4.3 Actions (Mutations)
*   **Assign Person**: `POST /api/v1/events` (Type: `AssignmentStarted`).
*   **Create Org**: `POST /api/v1/events` (Type: `OrganizationCreated`).

---

## Phase 5: Refinement (The "Quality")
**Goal**: Align with the "Vision" (Intuitive, Effortless).

*   **Keyboard Navigation**: Arrow keys to traverse tree.
*   **"Where Am I?"**: Floating re-center button.
*   **Undo/Redo**: Toast notification for actions.
*   **Load Testing**: Ensure graph handles large hierarchies (100+ nodes).

---

## Technical Dependencies
*   `react-flow` or `visx` (for Graph rendering)
*   `framer-motion` (for smooth transitions)
*   `cmdk` (for the Command Palette/Discovery Bar)
