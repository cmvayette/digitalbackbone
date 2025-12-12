# Auth & Hardening Implementation Status

**Date**: 2025-12-11
**Status**: Partial (Phase 1 Complete)

## Completed Work
1.  **Identity Management**: Local Keycloak instance configured (`som-digital-backbone` realm).
2.  **OIDC Integration**:
    *   `@som/api-client` supports `authConfig` and `login()`.
    *   `how-do` application implements `AuthGuard` and `AuthCallback`.
    *   Blank page startup issue resolved (Vite config/exports fixed).
3.  **Authorization**:
    *   OPA container running with `authz.rego` policy.
    *   `SwimlaneViewer` implements redaction for "Secret" steps.
    *   Fail-closed behavior verified.

## Next Step: Data Persistence (Postgres)
We have stopped **BEFORE** migrating to PostgreSQL.
The current application state uses:
*   `localStorage` for `how-do` (simulated persistence).
*   In-memory / JSON-server for `api-server` (if running).

**Immediate Next Task**:
*   Provision PostgreSQL container in `docker-compose.yml`.
*   Implement `PostgresPersistenceAdapter` in `packages/som-backend` (or equivalent).
*   Create migration scripts for the schema (Holons, Events, Relationships).

## Known Issues
*   Redirect flow test was interrupted, but manual verification should confirm `AuthGuard` works.
*   "Fail-closed" means if you run `how-do` without OPA, you will see "Redacted" or "Access Denied" by default in protected areas.
