# Note 007: Semantic Proxy Implementation Details

## Date
2025-12-10

## Overview
This note details the implementation of the Semantic Proxy and Agent Assignment features in the `how-do` application, following [ADR 004](../adr/004-semantic-proxy-pattern.md).

## Capabilities Implemented

### 1. Agent Assignment (`OwnerPicker.tsx`)
We refactored the `OwnerPicker` to support selecting Agents.
-   **Data Source**: Uses `useExternalOrgData` hook with `HolonType.Agent`.
-   **UI**: Introduced a tabbed interface splitting "Staff" (Person/Position) and "Agents".
-   **Filtering**: Clientside search filters both lists.

### 2. Visual Differentiation (`StepCard.tsx`)
The `StepCard` component was updated to visually distinguish task types:
-   **Standard Task**: Default appearance.
-   **Proxy Task**: 
    -   Conditions: `step.source === 'external'`.
    -   Visuals: Dashed border, `ExternalLink` icon in header, displays `externalSource` (e.g., "JIRA").
-   **Agent Assignee**:
    -   Conditions: `assigneeType === 'agent'` (inferred via mock logic currently, explicit property added to types).
    -   Visuals: Purple badge background, Robot/Bot icon instead of generic User icon.

### 3. Data Flow
-   **Mock Client**: Updated `MockSOMClient` to generate random `HolonType.Agent` entities (e.g., "Logistics Bot", "Optimizer Bot") with `capabilities` and `model` properties.
-   **Persistence**: The `SwimlaneEditor` maintains the `assigneeType` property in the local process state.

## Testing Strategy
-   **Unit Tests**: `StepCard.test.tsx` and `OwnerPicker.test.tsx` verify the rendering and interaction logic.
-   **Integration Test**: `SwimlaneEditor.test.tsx` verifies the end-to-end flow of assigning an agent to a step using the picker.

## Future Work
-   **Real Backend**: Connect `assigneeType` persistence to the real backend service.
-   **Agent Metadata**: Display agent capabilities or model details in a tooltip on hover.
