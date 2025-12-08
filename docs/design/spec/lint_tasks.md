# Task List: Tooling & Governance Implementation

Based on `tooling_improvement_spec.md`, the following tasks verify the implementation of repo-wide sustainability improvements.

## 1. CI/CD Repairs (Issue #8)
- [x] **Root Package**: Add `"coverage"` script to `package.json` invoking `vitest --coverage`.
- [x] **Validation**: Run `npm run coverage` locally to verify report generation.

## 2. Core Backend Linting (`apps/som-tier0`) (Issue #9)
- [x] **Dependencies**: Install `eslint`, `prettier`, and TS plugins in `custom` or root (if not already present).
- [x] **Config**: Create/Update `.eslintrc` in `apps/som-tier0` to extend standard TS rules.
- [x] **Scripts**: Add `"lint": "eslint . --ext .ts"` to `apps/som-tier0/package.json`.
- [ ] **Fixes**: Run the linter and auto-fix (`--fix`) existing style issues in `som-tier0`.

## 3. Root Level Governance (Issue #10)
- [x] **Root Script**: Add `"lint": "npm run lint --workspaces"` to root `package.json`.
- [ ] **Pre-commit (Optional)**: If `husky` exists, add `lint:semantic` to pre-commit hook.

## 4. Verification
- [ ] Push to branch and ensure GitHub Action `build_and_test` passes all steps including `Check Test Coverage`.
