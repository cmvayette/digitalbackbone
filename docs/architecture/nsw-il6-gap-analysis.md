# Enterprise Gap Analysis: NSW Deployment (IL5/6)

## Overview
**Target**: Naval Special Warfare (NSW) Enterprise
**Scale**: ~20,000 Users
**Compliance**: IL5 (CUI) / IL6 (Secret)

The current "Phase 0" architecture (Local SQLite, Mock APIs, Client-heavy logic) is designed for rapid prototyping. It is **not** suitable for the target environment. Below is the breakdown of critical gaps and **mitigation options**.

---

## 1. Authentication & Identity (Critical)
**Gap**: No PKI/CAC integration.
**Requirement**: DoD PKI (CAC/PIV/ALT) via P1/PIM, strict session management.

### Mitigation Options
- **Option A: Keycloak (Recommended Immedatiely)**
  - **Description**: Deploy Keycloak as the Identity Broker. Configure it to trust DoD Root CA and map certificates to user roles.
  - **Pros**: Open-source, widely used in DoD (Iron Bank image available), abstracts auth complexity from the app.
  - **Cons**: Requires management/maintenance of the Keycloak instance.
- **Option B: Platform One SSO (P1-Auth)**
  - **Description**: Delegate auth entirely to Platform One’s existing SSO (if reachable).
  - **Pros**: Zero maintenance, instant compliance.
  - **Cons**: Dependency on external availability; dev/test experience is harder without connectivity.

## 2. Authorization & Governance
**Gap**: Implicit logic, no clearance-based filtering.
**Requirement**: ABAC (Attribute-Based Access Control) for Classification and Need-to-Know.

### Mitigation Options
- **Option A: Open Policy Agent (OPA) (Recommended)**
  - **Description**: Service-sidecar that intercepts every API call. Policies (`.rego` files) define "If User.Clearance < Resource.Class then DENY".
  - **Pros**: Industry standard, decoupled policy from code, audit-ready logs.
  - **Cons**: Learning curve for Rego language.
- **Option B: Hardcoded Middleware**
  - **Description**: Write specific Express/NestJS middleware to check scopes.
  - **Pros**: Simple to start.
  - **Cons**: brittle, hard to audit, "spaghetti code" risk as rules overflow.

## 3. Data Persistence & Integrity
**Gap**: Local SQLite file.
**Requirement**: HA Database, Encryption at Rest/Transit, Immutable Audit.

### Mitigation Options
- **Option A: PostgreSQL with CrunchyData Operator (Recommended)**
  - **Description**: Deploy Postgres on K8s using the PGO operator (Iron Bank certified).
  - **Pros**: Auto-HA, backups, encryption, and compliance out-of-the-box.
  - **Cons**: K8s resource heavy.
- **Option B: Managed SQL (AWS RDS / Azure SQL)**
  - **Description**: Use the CSP's managed database service.
  - **Pros**: Lowest operational overhead.
  - **Cons**: Vendor lock-in, distinct IL5/6 configuration requirements (Customer Managed Keys).

## 4. API & Backend Architecture
**Gap**: Monolithic Mock Client / Direct-to-DB.
**Requirement**: Scalable gateway, Rate limiting, Observability.

### Mitigation Options
- **Option A: Kong Gateway + Istio Mesh**
  - **Description**: Kong handles ingress/auth-check; Istio handles mTLS and traffic splitting.
  - **Pros**: The "Gold Standard" for DoD implementations.
  - **Cons**: High complexity (Sidecars, CRDs).
- **Option B: Nginx Ingress Only**
  - **Description**: Simple Nginx ingress controller.
  - **Pros**: Lightweight, easy.
  - **Cons**: Lack of deep observability or advanced traffic shifting (Canary) without plugins.

## 5. DevSecOps & Security
**Gap**: Basic CI.
**Requirement**: Container Hardening, SBOM, Scanning.

### Mitigation Options
- **Option A: Iron Bank "From Scratch"**
  - **Description**: Rebase all `Dockerfile`s to use `registry1.dso.mil/ironbank/redhat/ubi9-minimal` or `chainguard` images.
  - **Pros**: Pre-hardened, faster ATO/IATT.
  - **Cons**: Strict package compatibility checks.
- **Option B: Custom Hardening**
  - **Description**: Build from public Alpine/Debian and run custom hardening scripts.
  - **Pros**: Familiar dev experience.
  - **Cons**: High risk of findings during rigorous scanning; likely rejected by security gatekeepers.

## 6. Frontend Specifics
**Gap**: Unsafe data handling.
**Requirement**: No spillover risk.

### Mitigation Options
- **Option A: Backend-For-Frontend (BFF) Pattern (Recommended)**
  - **Description**: A lightweight node service specifically for the UI that strictly filters data types.
  - **Pros**: Decouples UI from complex backend domains; security checkpoint.
  - **Cons**: Another service to manage.

---

## Consolidated Recommendation strategy
1.  **Identity**: Spin up **Keycloak** local container immediately to permit "Mock CAC" dev flows.
2.  **AuthZ**: Integrate **OPA** sidecar (or library) now to start writing `.rego` policies for classification.
3.  **Data**: Migrate seed logic to generic TypeORM/Prisma compliant adapter, then swap SQLite for **Postgres (Docker)** locally.
4.  **Base**: Rebase Dockerfiles to **UBI9-Minimal** immediately to catch dependency issues early.
