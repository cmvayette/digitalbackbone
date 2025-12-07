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
    - Check: `selectedNode` becomes null.
