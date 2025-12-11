# Consolidated Project Roadmap & Strategy

This document serves as the **single source of truth** for the Digital Backbone project roadmap, consolidating tasks from:
- `ROADMAP.md` (High Level)
- `design/roadmap.md` (Application Phases)
- `design/specs/som_tasks.md` (Tier-0 Implementation)
- `way_ahead_design.md` (Infrastructure & Compliance)

---

## 1. High-Level Goals (Executive Summary)

**Goal**: Deliver a "C-ATO Ready" Semantic Operating Model (SOM) and Tier-1 Application Ecosystem suitable for IL4/IL5 deployment.

### Critical Milestones
- [ ] **Tier-1 Migration**: Refactor all Tier-1 apps to use updated client.
    - [x] Org Chart
    - [x] How-Do
    - [x] Policy Governance
    - [ ] Task Management
    - [ ] Objectives/OKR
- [ ] **Observability**: Structured Logging & Health Checks (AU-2/AU-3).
- [ ] **Containerization**: Hardened images, non-root execution.
- [ ] **Persistence**: Postgres/SQL integration.

---

## 2. Prioritized Execution Plan

Based on C-ATO requirements and the dependency graph, the following priority order is established:

### 🔴 Priority 1: Critical Path (Backend Connection)
**Blocking all real data flows.**
- [ ] **Tier-1 Migration**: Replace mock `useExternal*` hooks with real `SOMClient` across all apps.
- [ ] **Persistence**: Implement `PostgresEventStore` (Tier-0) to stop losing data on restart.
- [ ] **Shared Types**: Sync `api-client` with `shared-types` perfectly.

### 🟡 Priority 2: Compliance & Hardening (C-ATO)
**Required for deployment authorization.**
- [ ] **Observability**: Implement structured JSON logging (AU-2/AU-3).
- [ ] **Health Checks**: Add `/health/liveness` & `/health/readiness`.
- [ ] **Containerization**: Create hardened non-root Docker images.

### 🔵 Priority 3: Major Feature Gaps
**Missing functionality required for initial capability.**
- [ ] **Task Management**: Calendar Integration (Bidirectional Sync).
- [ ] **Task Management**: Shadow Task Logic (JIRA/ADO).
- [ ] **Policy Governance**: Obligation Engine (Text-to-Constraint).
- [ ] **Org Chart**: Dynamic Visualization Modes.

### 🟢 Priority 4: Polish & Optimization
**UX improvements and non-blocking features.**
- [ ] **Frontend Refactor**: Extract "Deep Void" styles to shared config.
- [ ] **Advanced Features**: Dashboards, Search, Health Indicators.
- [ ] **Documentation**: User Guides.

---

## 3. Tier-1 Ecosystem Roadmap (Applications)

*From `design/roadmap.md`*

### Phase 0: Foundation (Shared Infrastructure)
- [ ] Backend simplifications complete
- [ ] `packages/ui-components` created with core components
- [ ] `packages/api-client` created with SOMClient
- [ ] Seed data script populates realistic test data
- [ ] All apps can import shared packages

### Phase 1: Core Read (Data Visualization)
- [ ] All 5 apps fetch and display real data from SOM API
- [ ] Selection/detail pattern works in all apps
- [ ] No mock data in production code paths
- [ ] Shared components used consistently

#### App-Specific Read Status
- **Org Chart**: [ ] Connect API, [ ] Person Nodes, [ ] Sidebars
- **How-Do**: [ ] Process List, [ ] Swimlanes, [ ] Step Cards
- **Policy**: [ ] Policy List, [ ] Document Viewer
- **Task Mgmt**: [ ] Inbox, [ ] Task Detail
- **OKR**: [ ] LOE List, [ ] Objective Cards

### Phase 2: Core Write (CRUD & Events)
- [ ] All 5 apps can create their primary entities
- [ ] All 5 apps can edit/update entities
- [ ] Events flow through SOM API correctly
- [ ] Optimistic updates provide responsive UX

#### App-Specific Write Status
- **Org Chart**: [ ] Create Org/Position, [ ] Assign Person
- **How-Do**: [ ] Create Process, [ ] Editor, [ ] Drag Reorder, [ ] Save Event
- **Policy**: [ ] Draft/Publish, [ ] Section Editor
- **Task Mgmt**: [ ] Create/Complete Task, [ ] Reassign
- **OKR**: [ ] Create LOE/Objective/KR, [ ] Update Progress

### Phase 3: Cross-App Integration
- [ ] Owner picker works from any app
- [ ] Deep links between apps work
- [ ] Semantic relationships visible across apps
- [ ] Universal search returns results from all apps

### Phase 4: Advanced Features
- [ ] Search and filters work in all apps
- [ ] Health indicators visible (Freshness, Compliance, Load)
- [ ] Dashboards and visualizations work

### Phase 5: Polish & Performance
- [ ] UX Polish (Loading states, Error handling)
- [ ] Performance (Query caching, Lazy loading)
- [ ] Testing (>70% coverage)
- [ ] Documentation (User guide, API docs)

---

## 4. Tier-0 / Backend Implementation Plan

*Derived from `design/specs/som_tasks.md`. See that file for detailed requirement validation and property test mappings.*

### Core Architecture
- [x] 1. Project structure & Type definitions
- [x] 2. Holon ID management
    - [x] 2.1 Test: ID uniqueness
    - [x] 2.2 Test: Query completeness
    - [x] 2.3 Test: Inactive preservation
- [x] 3. Event Store (Immutability)
    - [x] 3.1 Test: Event immutability
    - [x] 3.2 Test: Event completeness

### Domain Logic & Governance
- [x] 4. Document Registry
- [x] 5. Constraint Engine
    - [x] 5.1 Test: Constraint document linkage
    - [x] 5.2 Test: Holon validation
    - [x] 5.3 Test: Relationship enforcement
- [x] 6. Relationship Management
- [x] 7. State Projection Engine
- [x] 8. Temporal Query Engine
    - [x] 8.1 Test: Temporal round-trip
    - [x] 8.2 Test: Relationship reconstruction
    - [x] 8.3 Test: Causal chain
- [x] 9. Semantic Graph Store

### Entity Implementation
- [x] 10. Person Holons
- [x] 11. Position & Org Holons
- [x] 12. Mission/Capability/Asset Holons
- [x] 13. Qualification Holons
- [x] 14. Objective & LOE Holons
- [x] 15. Initiative & Task Holons
    - [x] 15.1 Test: Initiative completeness
    - [x] 15.2 Test: Task completeness
    - [x] 15.3 Test: Dependency validity

### Advanced Features
- [x] 16. Measure & Lens Engine
- [x] 17. Semantic Access Layer (SAL)
- [x] 18. Validation & Error Handling
- [x] 19. Schema Versioning
- [x] 20. Governance Change Proposals
- [x] 21. Access Control (RBAC/ABAC)
- [x] 22. Advanced Query Layer

### Validation & Integration
- [x] 23. Checkpoint: Unit Tests
- [x] 24. Integration Test Suite
- [x] 25. Monitoring & Observability
- [x] 26. Tier-1 API Layer
- [x] 27. Final Checkpoint

---

## 5. Infrastructure ## 4. Infrastructure & C-ATO Readiness C-ATO Readiness (Way Ahead)

*From `way_ahead_design.md`*

### Authentication & Identity
- [x] Refactor `middleware.ts` to use `IAuthProvider`.
- [x] Implement `GatewayHeaderAuthProvider`.
- [x] Add tests with mock headers.

### Phase 2: Observability
- [ ] **Structured Logging**: Replace `console.log` with JSON logger (`pino` or `winston`).
- [ ] **Configuration**: Standardize `dotenv` and environment variable handling.
- [ ] **Health Checks**: `/health/liveness` and `/health/readiness`.

### Phase 3: Persistence
- [ ] Design SQL Schema for Events.
- [ ] Implement `PostgresEventStore`.
- [ ] Async store loading support.

### Phase 4: Containerization
- [ ] Write `Dockerfile` (Iron Bank/Distroless base).
- [ ] Create `docker-compose.yaml`.
- [ ] Configure CI pipeline (Lint, Test, Build, Scan).
- [ ] Read-only filesystem configuration.

---

## 6. Ad-Hoc / Technical Debt

### Org Chart Search (from `notes/006-org-chart-search-refactor.md`)
- [ ] Ensure `DiscoveryBar` handles results that are just "References" (ID/Label) rather than full Nodes.
- [ ] Consolidate local graph filtering with API-based global search.

---

## 7. Audit Findings ## 6. Audit Findings & Technical Debt Technical Debt

*Extracted from `docs/reports/*` and `docs/notes/audit_*.md` (Dec 2025)*

### Frontend Architecture
- [ ] **Refactor**: Move "Deep Void" Tailwind config to `packages/ui-components` or shared config.
- [ ] **Refactor**: Extract `Card` and `Button` components to `ui-components` to enforce design system.

### Shared Packages
- [ ] **Maintenance**: Ensure `api-client` types strictly match `shared-types`.
- [ ] **Linter**: Add rules to `semantic-linter` (e.g. forbid direct DB access).

### SOM Tier-0 (Backend)
- [ ] **Data Integrity**: Verify Event Store idempotency mechanism.
- [ ] **Extensibility**: Review SAL Transformer pattern for extensibility.
- [ ] **Persistence**: Full Event Store persistence validation.

### Org Chart
- [ ] **Visualization**: Verify dynamic modes (Mission/Process views) - *Gap Analysis 008*.
- [ ] **Integration**: Integrate with "Manpower" service (remove mock `orgStore`) - *Review 2025-12-08*.

### How-Do
- [ ] **Execution**: Improve "Execution Mode" persistence - *Gap Analysis 008*.
- [ ] **Integration**: Full integration of `ObligationLinker` with real Policy App data - *Review 2025-12-08*.

### Policy Governance
- [ ] **Feature**: Develop Policy Obligation engine (Text-to-Constraint) - *Major Gap*.
- [ ] **Feature**: Implement Impact Preview (Blast Radius) component - *Gap Analysis 008*.
- [ ] **Feature**: Publication workflow / PDF export - *Review 2025-12-08*.

### Task Management
- [ ] **Feature**: Calendar Integration (Bidirectional sync) - *Major Gap*.
- [ ] **Feature**: Shadow Task logic (JIRA/ADO integration) - *Major Gap*.
- [ ] **Feature**: Workload Dashboard / Heatmaps - *Review 2025-12-08*.

### Objectives & OKR
- [ ] **Feature**: KR Composer Linter (Measurability intelligence) - *Gap Analysis 008*.
- [ ] **Feature**: Evidence Log / Check-in interface - *Review 2025-12-08*.
