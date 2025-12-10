# Stream 3: Tooling & Infra Brief
**Role**: The Toolsmith
**Focus**: `packages/api-client`, Root Configuration, CI/CD

## Context
You are the enabler. The other two agents cannot work fast without your infrastructure. Your priority is decoupling them and ensuring the build stays green.

## Objectives
1.  **Architecture Shift: Mock Client**:
    -   Modify `packages/api-client/src/client.ts` to accept a `mode` ('real' | 'mock').
    -   Implement a `MockSOMClient` class that implements the `SOMClient` interface but returns generated/fake data.
    -   *Why*: This allows Stream 2 (Frontend) to iterate while Stream 1 (Backend) is broken/incomplete.

2.  **CI Reliability**:
    -   Implement the missing `coverage` scripts in root `package.json` to satisfy `.github/workflows/ci.yml`.
    -   Fix Linting fragmentation (ESLint + Prettier) across the monorepo.

## Rules of Engagement
-   **Unblock Others**: If Stream 2 needs a new data type mocked, do it immediately.
-   **Green Build**: You own the operational excellence. If `npm run build` fails, it's your problem.
