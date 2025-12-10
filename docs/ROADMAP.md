# Digital Backbone Roadmap

**Goal**: Deliver a "C-ATO Ready" Semantic Operating Model (SOM) and Tier-1 Application Ecosystem suitable for IL4/IL5 deployment.

## Active Engagement: C-ATO Readiness & Tier-1 Standardization

### Phase 1: Authentication & Identity (Status: In Progress 🟡)
- [x] **Auth Refactor**: Implement `IAuthProvider` interface.
- [x] **Gateway Auth**: Create `GatewayHeaderAuthProvider` for upstream identity injection.
- [x] **Tier-1 Client**: Update `@som/api-client` to support new auth modes.
- [ ] **Tier-1 Migration**: Refactor all Tier-1 apps to use updated client.
    - [x] Org Chart
    - [x] How-Do
    - [ ] Policy Governance
    - [ ] Task Management
    - [ ] Objectives/OKR

### Phase 2: Observability & Configuration (Status: Planned ⚪)
- [ ] **Structured Logging**: Replace `console.log` with JSON logger (compliant with AU-2/AU-3).
- [ ] **Health Checks**: Implement K8s-compatible `/health/liveness` and `/health/readiness` probes.
- [ ] **Configuration**: Standardize `dotenv` and environment variable handling.

### Phase 3: Persistence (Status: Planned ⚪)
- [ ] **Schema Design**: Design SQL schema for Events and Snapshots.
- [ ] **Postgres Implementation**: Create `PostgresEventStore` to replace in-memory store.
- [ ] **Migration**: Update initialization logic to support async store loading.

### Phase 4: Containerization & Hardening (Status: Planned ⚪)
- [ ] **Base Image**: Transition to DoD Iron Bank `nodejs` or `distroless` equivalent.
- [ ] **Multi-Stage Build**: Implement secure build pipeline.
- [ ] **Non-Root Execution**: Ensure execution as generic user (UID 1001).
- [ ] **Read-Only FS**: Configure file system to be immutable (except `/tmp`).
- [ ] **Artifact Signing**: Implement Cosign/Sigstore signing.

## Tier-1 Ecosystem Strategy
**Objective**: Create a repeatable "factory" for new applications.

1.  **Golden Master**: `apps/org-chart` serves as the template.
2.  **Shared Libs**: `@som/api-client` (Data) and `@som/ui-components` (UI).
3.  **Deployment**: All apps inherit C-ATO compliance via standardized container/auth patterns.

## Backlog / Future
- **CI/CD Security Pipeline**:
    - [ ] Static Analysis (SonarQube)
    - [ ] Dependency Scanning (OWASP Dependency Check)
    - [ ] SBOM Generation (CycloneDX)
- **Advanced Features**:
    - [ ] Event Replay API
    - [ ] Graph Visualization Engine
