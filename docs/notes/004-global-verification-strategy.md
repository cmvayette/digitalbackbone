# Note 004: Global Verification Strategy

* **Date:** 2025-12-10
* **Author:** Antigravity
* **Status:** Done
* **Tags:** #verification #ci #quality

## Summary
To ensure high quality across the unified "One Backbone" monorepo, we established a Global Verification step following the migration of Tier-1 apps.

## Findings
During the initial global verification run:
1.  **Missing Scripts**: Several shared packages (`@som/shared-types`, `@som/ui-components`, `@som/semantic-linter`) were missing `lint` scripts.
2.  **Lint Errors**: `npm run lint` revealed unused variables in `useExternalPolicyData` and other minor formatting issues, which were fixed.
3.  **Build Configuration**: `packages/ui-components` encountered TS build errors that were not caught by individual app builds (investigation ongoing).

## Decisions
- Enforce `npm run lint` and `npm run build` at the workspace root as a standard pre-merge gating content.
- Standardized `lint` script to `tsc --noEmit` for TypeScript packages that don't need full ESLint (unless otherwise specified).

## Action Items
- [x] Add missing `lint` scripts to shared packages.
- [x] Fix identified lint errors.
- [ ] Resolve `packages/ui-components` build failure.
