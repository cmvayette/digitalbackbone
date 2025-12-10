# Audit: Frontend Applications & Shared UI

* **Date:** 2025-12-10
* **Author:** Antigravity
* **Status:** Draft
* **Tags:** #audit #frontend #org-chart #how-do

## Summary
Audit of Tier-1 Frontend applications (`org-chart`, `how-do`) and the shared `ui-components` package.

## Discussion / Thinking

### `apps/org-chart`
*   **State**: Relies heavily on `useExternalOrgData` (React Query) and local `useState` in `App.tsx`.
*   **Architecture**: `GraphCanvas` consumes flat lists of Nodes/Edges derived from `organizations` data.
*   **Gap**: No dedicated "Store" for complex selection state sharing beyond prop drilling or Context. `useGraphNavigation` provides some help.

### `apps/how-do`
*   **State**: Similar pattern. `useExternalProcessData` manages data.
*   **Components**: `ProcessSearch`, `SwimlaneEditor`.
*   **Gap**: Duplication of "Deep Void" styling logic (Tailwind config copied). Should be centralized.

### `packages/ui-components`
*   **Status**: Exists but implementation details need verification.
*   **Opportunity**: Move common "Deep Void" cards, buttons, and layouts here to share between apps.

## Decisions / Action Items
- [ ] **Refactor**: Move "Deep Void" Tailwind config to a shared preset in `packages/ui-components` or `packages/config`.
- [ ] **Refactor**: Extract `Card` and `Button` components to `ui-components` to enforce design system.
