# Note 005: How-Do UI Unification

* **Date:** 2025-12-10
* **Author:** Antigravity
* **Status:** In Progress
* **Tags:** #ui #migration #how-do #tailwind

## Context
The `apps/how-do` application is the last Tier-1 app not aligned with the "Deep Void" design system. Stream 8 focuses on unifying its UI configuration and layout.

## Changes
1.  **CSS/Tailwind**:
    - Updated `apps/how-do/src/index.css` to use standard `@theme` variables (Deep Void palette).
    - Upgraded `apps/how-do` to Tailwind v4 (matching `org-chart`).
2.  **Linting**:
    - Fixed ~35 lint errors in `apps/how-do` (unused variables, explicit any, hook rules).
    - Fixed `vite.config.ts` type error.
    - Updated `useProcess.ts` to avoid `setState` in effect loop (switched to `useRef`).

## Decisions
- Aligning `index.css` exactly with `apps/org-chart` pattern.
- Enforcing `npm run lint` cleanliness before refactoring.

## Issues / Troubleshooting
- Resolved `setState` loop in `useProcess` by using `useRef` for one-time initialization.
