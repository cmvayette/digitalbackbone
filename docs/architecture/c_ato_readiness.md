# Way Ahead Design Specification: SOM-Tier0 C-ATO Readiness

## 1. Executive Summary
This document outlines the technical design and roadmap for transitioning the `som-tier0` application from a prototype to a deployment-ready, compliant artifact ("C-ATO Ready"). The focus is on implementing required security controls, hardening the runtime environment, and ensuring scalability through persistence and containerization.

## 2. Current State Assessment
- **Architecture**: In-memory event sourcing monolith with Node.js/TypeScript.
- **Authentication**: **[UPDATED]** Adapter-based Middleware supporting API Keys (Dev) and Gateway Headers (Prod).
- **Persistence**: Application state is lost on restart (In-Memory stores).
- **Deployment**: Local Node.js execution.
- **Compliance**: Lacks structured logging, health probes. Identity propagation is **Ready**.

## 3. C-ATO Architecture Design

### 3.1 Authentication & Identity Propagation
**Requirement**: Support "Identity Propagation" where an upstream API Gateway (e.g., Istio/Envoy) performs mTLS/OIDC and injects identity headers (`X-Remote-User`, `X-Remote-Groups`).

**Design Pattern**: Adapter Pattern for `AuthenticationMiddleware`.

**Proposed Interface**:
```typescript
interface IAuthProvider {
  authenticate(request: Request): Promise<AuthenticationResult>;
}
```

**Implementations**:
1.  **`ApiKeyAuthProvider`** (Current/Dev): Existing API Key logic.
2.  **`GatewayHeaderAuthProvider`** (Prod):
    -   Trusts upstream headers (configured via whitelist).
    -   Extracts `userId` from `X-Remote-User`.
    -   Maps `X-Remote-Groups` (or JWT claims) to `som-tier0` Roles (`Role.Administrator`, etc.).
    -   Maps clearance levels from claims.

**Configuration**:
-   `AUTH_PROVIDER`: `apikey` | `gateway`
-   `TRUSTED_PROXIES`: CIDR list to accept headers from.

### 3.2 Containerization & Hardening
**Requirement**: Non-root execution, immutable filesystem, minimal base image.

**Strategy**:
-   **Base Image**: Use DoD Iron Bank `nodejs` or `distroless` equivalent.
-   **Multi-Stage Build**:
    1.  `build`: Install deps, compile TS -> JS.
    2.  `production`: Copy `dist`, `node_modules` (pruned), run as `UID 1001`.
-   **Filesystem**: Read-only root. Write only to `/tmp` (or emptyDir volume) if absolutely necessary.
-   **Secrets**: All config via `process.env`.

### 3.3 Persistence Layer
**Requirement**: Data persistence across restarts.

**Design**:
-   **EventStore Adapter**: Move from `InMemoryEventStore` to `PostgresEventStore` (or MongoDB).
-   **Event Sourcing**:
    -   Events table: `id`, `stream_id`, `type`, `payload`, `meta`, `timestamp`.
    -   Snapshots table (optional optimisation).
-   **Projections**: Rebuild state on startup from DB, or persist projections (Snapshotting).

### 3.4 Observability
**Requirement**: AU-2/AU-3 Compliance (Audit Events).

**Design**:
-   **Structured Logging**: All logs must be JSON.
-   **Audit Log**: Dedicated logger for security events (Access Allowed/Denied, Data Modifications).
    -   Fields: `timestamp`, `actor`, `action`, `resource`, `status`, `correlationId`.
-   **Probes**:
    -   `/health/liveness`: Simple "I am running".
    -   `/health/readiness`: "Can I connect to DB?".

## 4. Implementation Roadmap

### Phase 1: Authentication Refactor (Completed)
- [x] Refactor `middleware.ts` to use `IAuthProvider`.
- [x] Implement `GatewayHeaderAuthProvider`.
- [x] Add tests with mock headers.

### Phase 2: Observability & Configuration
1.  Replace `console.log` with a structured logger (`pino` or `winston`).
2.  Standardize `config` module (dotenv + environment variables).
3.  Add Health Checks (`/health`).

### Phase 3: Persistence
1.  Design SQL Schema for Events.
2.  Implement `PostgresEventStore`.
3.  Update `som-tier0` initialization to support async store loading.

### Phase 4: Containerization & CI/CD
1.  Write `Dockerfile`.
2.  Create `docker-compose.yaml` (App + Postgres + Mock Gateway).
3.  Configure CI pipeline (Lint, Test, Build, Scan).

## 5. Next Steps
1.  **Observability**: Begin Phase 2 (Logging & Health Checks).
2.  **Persistence**: Plan Phase 3 (Postgres).

## 6. Tier-1 Ecosystem Strategy

### 6.1 Overview
The digital backbone hosts five core Tier-1 applications that provide domain-specific user interfaces while relying on Tier-0 for semantic state.
*   **Org Chart**: Organizational Explorer.
*   **How-Do**: Process & Qualification management.
*   **Policy Governance**: Compliance & Document management.
*   **Task Management**: Initiative & Task tracking.
*   **Objectives/OKR**: Strategy alignment.

### 6.2 Standardization Roadmap
To (C-ATO) compliance, all Tier-1 apps must adhere to the following standard:

1.  **API Integration**:
    *   Deprecate direct fetch calls.
    *   Migrate all apps to use the `@som/api-client` package.
    *   Update `@som/api-client` to handle the new `GatewayHeaderAuthProvider` logic (forwarding identity headers if locally emulating, or handling cookies).

2.  **Containerization (Frontend)**:
    *   **Base Image**: `nginxinc/nginx-unprivileged` (Iron Bank equivalent).
    *   **Build**: Multi-stage (Node build -> Nginx serve).
    *   **Configuration**: Runtime variable injection (for `API_URL`) via `env.js` pattern (since static files can't read `process.env`).

3.  **Security**:
    *   **CSP**: Strict Content Security Policy headers.
    *   **Auth**: No local auth logic; rely on Gateway injection/Tier-0 validation.

### 6.3 Implementation Plan (Tier-1)
*   **Phase 1 (Concurrent with Auth)**: Update `@som/api-client` to support new Auth mechanisms. **(Completed)**
*   **Phase 2**: Refactor `org-chart` and `how-do` to use updated client. **(Completed)**
*   **Phase 2 Extension**: Refactor `policy-governance`, `task-management`, and `objectives-okr` to use updated client. **(Completed)**
*   **Phase 3**: Dockerize all Tier-1 apps and add to `docker-compose`.

### 6.4 Scalability & Onboarding (New Systems)
This architecture is designed to be a repeatable "factory" for new Tier-1 applications.

*   **Reference Architecture**: `apps/org-chart` will serve as the Golden Master template. New apps clone this structure.
*   **Shared Libraries**:
    *   `@som/api-client`: Pre-built authentication and semantic data fetching.
    *   `@som/ui-components`: Shared "Blueprint" UI library ensuring consistent look-and-feel.
*   **Onboarding Workflow**:
    1.  **Duplicate Template**: Copy standard Vite+React+TS boilerplate.
    2.  **Install Deps**: Add `@som/api-client` and `@som/ui-components`.
    3.  **Configure**: Set `APP_ID` and Docker build args.
    4.  **Deploy**: App automatically inherits C-ATO compliance via the standardized container/auth pattern.
