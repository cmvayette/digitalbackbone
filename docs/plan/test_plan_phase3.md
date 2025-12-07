# Test Plan: Epic 5 - Interactive Graph (Phase 3)

Verification strategy for the Org Chart Graph implementation.

## 1. Unit Tests (Automated)

### 3.1 Data Hook & Transformer
- **File**: `apps/org-chart/src/api/transformer.test.ts`
- **Status**: ✅ Implemented & Basic Pass.
- **Coverage**:
  - Recursive organizational hierarchy flattening.
  - Position & Assignment handling (injecting Person data into Position nodes).
  - Basic Node/Edge generation.

### 3.2 Graph Interaction Logic
To be implemented alongside the Canvas.
- **Selection State**: Verify selecting a node updates the global store/URL.
- **Layout Calculation**: Test `dagre` layout integration (mocking `dagre` to ensure coordinates are updated).

## 2. Integration Tests (Browser/E2E)

Since `reactflow` is highly visual, relying solely on JSDom unit tests is insufficient.

### 3.2 Graph Rendering
- **Tool**: Playwright or Cypress (Future Scope) or Manual Verification via Browser Tool.
- **Test Cases**:
  1.  **Render**: Graph loads with correct number of nodes.
  2.  **Pan/Zoom**: Canvas responds to user input.
  3.  **Layout**: Tree structure is visually hierarchical (Org on top, positions below).

### 3.3 Custom Node Components
- **Test Cases**:
  1.  **Org Node**: Displays Name, UIC, and Color Band.
  2.  **Position Node**: Displays Title, Person Name (if occupied), Rank.
  3.  **Vacant State**: Visual distinction for vacant positions.

## 3. User Acceptance Testing (Manual)

**Story 3.1 Acceptance**:
- [x] Hook returns `GraphData` object.
- [x] Data contains correct Nodes and Edges from API response.

**Story 3.2 Acceptance**:
- [ ] Nodes are draggable (or locked if read-only).
- [ ] Minimap is visible (if implemented).
- [ ] Background pattern matches "Blueprint" theme.
