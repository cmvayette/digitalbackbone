# Audit: Shared Packages

* **Date:** 2025-12-10
* **Author:** Antigravity
* **Status:** Draft
* **Tags:** #audit #shared #api-client

## Summary
Audit of shared infrastructure packages (`api-client`, `shared-types`, `ui-components`, `semantic-linter`).

## Discussion / Thinking

### `packages/api-client`
*   **Role**: Abstraction layer for Tier-0 API.
*   **Design**: Uses `ISOMClient` interface with `RealSOMClient` (Http) and `MockSOMClient` (Faker).
*   **Observation**: Mock client is well developed. Real client needs to keep pace with `som-tier0` API changes.

### `packages/shared-types`
*   **Role**: Source of truth for TypeScript interfaces (Holons, Events, Relationships).
*   **Observation**: Critical dependency. Must be kept perfectly in sync with `som-tier0` internal logic.

### `packages/semantic-linter`
*   **Role**: Architectural compliance.
*   **Observation**: Good initiative to enforce constraints at build time.

## Decisions / Action Items
- [ ] **Maintenance**: Ensure `api-client` types strictly match `shared-types`.
- [ ] **Expansion**: Add more rules to `semantic-linter` as the architecture matures (e.g., forbidding direct database access in Apps).
