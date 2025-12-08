# Design Spec: Tooling Consolidation and CI Reliability

## 1. Problem Statement
The current repository suffers from inconsistent developer experience (DX) and tooling gaps across workspaces:
- **Linting Fragmentation**: `apps/org-chart` uses ESLint, but the core `apps/som-tier0` and root do not. This risks code style divergence in the most critical components.
- **CI Failure Risk**: The `.github/workflows/ci.yml` invokes a `coverage` script that does not exist in the root `package.json`, guaranteeing pipeline failures.
- **Manual Governance**: The custom semantic linter (`npm run lint:semantic`) requires manual invocation, reducing compliance checks during the inner development loop.

## 2. Goals
1.  **Standardize Linting**: Enforce a unified linting/formatting strategy (ESLint + Prettier) across the monorepo, specifically adding it to the backend core.
2.  **Repair CI/CD**: Ensure the CI pipeline passes by implementing the missing coverage scripts.
3.  **Automate Compliance**: Integrate the semantic linter into the standard development workflow.

## 3. High-Level Design

### 3.1. Unified Linting Strategy
We will establish a root-level configuration to ensure consistency.

*   **Tools**: ESLint (for logic/quality) and Prettier (for style).
*   **Location**: Root-level `.eslintrc.json` and `.prettierrc` (if not present) or workspace-level updates.
*   **Target**: Add `rules` and `plugins` suitable for TypeScript/Node.js to `apps/som-tier0`.
*   **Scripts**:
    *   Root `package.json`: `"lint": "npm run lint --workspaces"`
    *   Basic Backend `package.json`: `"lint": "eslint . --ext .ts"`

### 3.2. CI/CD Repair
We will sync the `package.json` scripts with the GitHub Workflow expectations.

*   **Root `package.json`**:
    *   Add `"coverage": "npm run test --workspaces -- --coverage"`
    *   This leverages Vitest's workspace capability to collect coverage from all apps/packages.

### 3.3. Developer Experience (DX) Scripts
We will create convenience scripts to run critical checks in parallel.

*   **Root `package.json`**:
    *   `"dev:backend"`: Runs the TS compiler in watch mode AND the semantic linter (if possible, or just provides a shortcut for the linter).
    *   *Alternative*: Use `npm-run-all` or `concurrently` (if available) to run `tsc -w` and a linter watch. For now, we'll keep it simple and add the semantic check as a distinct easy-to-run command or pre-commit step.

## 4. Implementation Details

### 4.1. Configuration Changes

#### Root `package.json` Update
```json
{
  "scripts": {
    "lint": "npm run lint --workspaces",
    "coverage": "vitest run --coverage --workspaces" // or npm run test ...
  },
  "devDependencies": {
    "eslint": "...",
    "prettier": "...",
    "@typescript-eslint/parser": "...",
    "@typescript-eslint/eslint-plugin": "..."
  }
}
```

#### Backend (`apps/som-tier0`) `package.json` Update
```json
{
  "scripts": {
    "lint": "eslint src/**"
  }
}
```

#### GitHub Workflow (`.github/workflows/ci.yml`)
*   Verify the step `run: npm run coverage` matches the new script.

## 5. Verification Plan
*   **Manual**: Run `npm run lint` from root. Verify it checks `som-tier0`.
*   **Manual**: Run `npm run coverage` from root. Verify it generates a coverage report.
*   **Automated**: The next push to `main` should pass the CI workflow.
