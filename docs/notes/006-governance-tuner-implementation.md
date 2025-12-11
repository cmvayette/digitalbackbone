# Note 006: Governance Tuner Implementation Details

## Overview
The Governance Tuner (`GovernanceTuner.tsx`) has been implemented as an embedded Admin view within `apps/how-do`. This allows valid users (mocked as admin) to adjust global system parameters.

## Implementation Specifics

### 1. Location & Access
*   **Entry Point**: A "Settings" (Gear) icon in the `Header.tsx` of `apps/how-do`.
*   **Route/Mode**: Switches the main internal view state to `'admin'`.
*   **Security**: Currently relies on client-side hiding. *Future Work: Implement proper RBAC check on the `user` object before rendering the button.*

### 2. State Management
*   **Hook**: `useGovernanceConfig` manages fetching (GET) and updating (PATCH) the configuration.
*   **Local State**: The UI uses a local copy of the config (`localConfig`) to allow for smooth slider dragging without thrashing the API. Changes are only committed when "APPLY CHANGES" is clicked.

### 3. Styling ("Deep Void")
*   The UI implements the "Deep Void" design language.
*   **Glassmorphism**: Heavy use of `backdrop-blur-sm`, `bg-bg-panel/50`, and white/opacity borders.
*   **Cyber-Aesthetics**: Custom-styled range inputs (`appearance-none` with custom thumbs), mono-spaced data displays, and neon accent colors (Cyan, Emerald, Amber).

### 4. Known Limitations
*   **Mock Backend**: The `MockSOMClient` persists changes in memory only. Reloading the page resets to default mock values.
*   **Property Mapping**: The `ProcessProperties` interface in TypeScript must typically match strictly; the mock data generator needs to ensure all fields (`inputs`, `outputs`, `estimatedDuration`) are present to avoid build errors in strict mode.

## Artifacts
*   `apps/how-do/src/components/admin/GovernanceTuner.tsx`
*   `apps/how-do/src/hooks/useGovernanceConfig.ts`
*   `packages/som-shared-types/src/holon.ts` (GovernanceConfig Schema)
