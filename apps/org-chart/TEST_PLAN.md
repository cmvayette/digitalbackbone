# Test Plan - Org Chart MVP

## 1. Person Node Component
**Goal**: Verify the visual representation of a Person in the graph.

- [ ] **Render Properties**:
    - Input: `{ label: "Sarah Miller", properties: { rank: "LCDR", role: "Ops Officer" } }`
    - Check: Text "Sarah Miller" exists.
    - Check: Text "LCDR" exists.
    - Check: Blueprint styling applied (monoline border).

- [ ] **Selection Highlighting**:
    - Action: Click on Person Node.
    - Check: Node border color changes (or visual indicator of selection).

## 2. Sidebar Panel
**Goal**: Verify dynamic content display based on selection.

- [ ] **Context Switching**:
    - Action: Select Organization Node.
    - Check: Title "N3 Administration" (from mock) appears.
    - Action: Select Person Node.
    - Check: Title "Sarah Miller" appears.
    - Action: Deselect (Click background / Press Esc).
    - Check: Sidebar disappears.

## 3. Selection State Integration
**Goal**: Verify the `selectedNode` state drives the UI.

- [ ] **Keyboard Interaction**:
    - Action: Select a node. Press `Escape`.

## 4. Discovery Bar (Phase 2)
**Goal**: Verify search and navigation functionality.

- [ ] **Search Interaction**:
    - Action: Press `/`.
    - Check: Search input gains focus.
    - Action: Type "Supp".
    - Check: Results list appears with matches (e.g., "Logistics Support Unit").

- [ ] **Navigation**:
    - Action: Click a search result.
    - Check: Graph centers on the target node.

## 5. Visual Enhancements (Phase 3)
**Goal**: Verify health indicators and tooltips.

- [ ] **Organization Health**:
    - Setup: Mock organization with >20% vacancies.
    - Check: Red health dot appears on Organization Node.

- [ ] **Vacancy Badge**:
    - Setup: Mock position as vacant (unfilled).
    - Check: "VACANT" badge or specific styling is visible on Position Node.

- [ ] **Hover Tooltip**:
    - Action: Hover over Organization Node.

## 6. Edit & Management (Phase 4)
**Goal**: Verify creation and undo actions.

- [ ] **Create Organization**:
    - Action: Open "Add Sub-Unit" modal from Sidebar.
    - Input: Name="Test Unit", UIC="TST-1".
    - Action: Submit.
    - Check: New node appears in graph.

- [ ] **Undo Action**:

- [ ] **Create Position**:
    - Action: Open "Add Position" modal from Organization Sidebar.
    - Input: Title="Ops Officer", Code="1110".
    - Action: Submit.
    - Check: New Position node appears connected to Organization.

- [ ] **Assign Person**:
    - Action: Select Vacant Position.
    - Action: Click "Fill Position".
    - Input: Name="John Doe".
    - Action: Submit.
    - Check: Position node updates to show "John Doe".
    - Check: "VACANT" badge disappears.




