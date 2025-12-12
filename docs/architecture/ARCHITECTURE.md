# Digital Backbone System Architecture

**Version:** 1.0
**Date:** 2025-12-12
**Status:** Living Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Component Architecture](#3-component-architecture)
4. [Data Flow](#4-data-flow)
5. [Design Decisions](#5-design-decisions)
6. [System Constraints & Limitations](#6-system-constraints--limitations)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Security Architecture](#8-security-architecture)

---

## 1. Executive Summary

The **Digital Backbone** is a Semantic Operating Model (SOM) that provides a unified, computable representation of organizational structure, behavior, intent, and constraints. It acts as an interpretation layer above existing systems of record, mapping disparate data into a coherent semantic graph.

### Core Capabilities

- **Semantic Graph**: Model organizations as interconnected Holons (entities) and Relationships
- **Event Sourcing**: Complete audit trail with temporal query capability ("as-of" any timestamp)
- **Computable Governance**: Policies encoded as machine-enforceable constraints
- **Multi-Application Platform**: Unified backend serving specialized frontend applications

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS 4, TypeScript |
| API | Hono (Node.js) |
| Event Store | PostgreSQL 16 |
| Graph Store | Neo4j 5.15 |
| Cache | Redis 7 |
| Authorization | OPA (Open Policy Agent) |
| Identity | Keycloak 23 (optional) |

---

## 2. High-Level Architecture

### 2.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SYSTEMS                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │  NSIPS  │  │  DRRS   │  │Training │  │Logistics│  │   JIRA  │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
└───────┼────────────┼────────────┼────────────┼────────────┼─────────────────┘
        │            │            │            │            │
        └────────────┴────────────┴─────┬──────┴────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEMANTIC ACCESS LAYER                                │
│                    (Translation & Validation Gateway)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TIER-0 CORE                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Event Store   │  │   Graph Store   │  │   Query Layer   │              │
│  │   (PostgreSQL)  │  │    (Neo4j)      │  │                 │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           └────────────────────┴────────────────────┘                        │
│                                │                                             │
│  ┌─────────────────┐  ┌───────┴───────┐  ┌─────────────────┐                │
│  │ Constraint      │  │    API        │  │  Access Control │                │
│  │ Engine          │  │   Server      │  │     (OPA)       │                │
│  └─────────────────┘  └───────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TIER-1 APPLICATIONS                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Org-Chart │  │  How-Do   │  │  Policy   │  │   Task    │  │Objectives │ │
│  │   :3001   │  │   :3002   │  │   :3003   │  │   :3004   │  │   :3005   │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Three-Tier Model

| Tier | Purpose | Components |
|------|---------|------------|
| **External** | Systems of Record | NSIPS, DRRS, Training DBs, Logistics, JIRA |
| **Tier-0** | Semantic Core | Event Store, Graph Store, Query Layer, APIs |
| **Tier-1** | User Applications | Org-Chart, How-Do, Policy, Task, Objectives |

---

## 3. Component Architecture

### 3.1 Core Domain Model

#### Holons (Persistent Entities)

Holons are the fundamental unit of meaning in SOM. Everything that "exists" is a Holon.

```typescript
interface Holon<T extends HolonType> {
  id: HolonID;           // UUID
  type: T;               // Discriminator
  properties: Props<T>;  // Type-specific properties
  status: 'active' | 'inactive' | 'archived' | 'draft';
  createdAt: Timestamp;
  createdBy: EventID;
  sourceDocuments: DocumentID[];
}
```

**Holon Types (21 types):**

| Category | Types |
|----------|-------|
| Organizational | Organization, Position, Person |
| Work | Task, Initiative, Objective, LOE, KeyResult |
| Military | Mission, Capability, Location |
| Personnel | Qualification, Agent |
| Governance | Document, Constraint, GovernanceConfig, Process |
| Infrastructure | System, Asset |
| Measurement | MeasureDefinition, LensDefinition |

#### Relationships (First-Class Edges)

Relationships are explicit, typed connections between Holons with their own lifecycle.

```typescript
interface Relationship {
  id: RelationshipID;
  type: RelationshipType;
  sourceHolonID: HolonID;
  targetHolonID: HolonID;
  properties: Record<string, any>;
  effectiveFrom?: Timestamp;
  effectiveUntil?: Timestamp;
  status: 'active' | 'inactive' | 'superseded';
  createdBy: EventID;
}
```

**Relationship Types (30+ types):**

| Category | Types |
|----------|-------|
| Structural | CONTAINS, HAS, OCCUPIES, MEMBER_OF, PART_OF |
| Authority | ADCON, TACON, OPCON, REPORTS_TO |
| Responsibility | RESPONSIBLE_FOR, OWNED_BY, OPERATED_BY |
| Governance | DEFINES, AUTHORIZES, SUPERSEDES, DERIVES_FROM |
| Temporal | CAUSED_BY, FOLLOWS, GROUPED_WITH |
| Work | ASSIGNED_TO, PARTICIPATES_IN, PRODUCES, DEPENDS_ON |

#### Events (Immutable Facts)

Events are the atomic unit of change. All state is derived from the event log.

```typescript
interface Event<T extends EventType> {
  id: EventID;
  type: T;
  occurredAt: Timestamp;    // When it happened
  recordedAt: Timestamp;    // When we learned about it
  actor: HolonID;           // Who/what caused it
  subjects: HolonID[];      // What was affected
  payload: PayloadFor<T>;   // Type-specific data
  causalLinks: {
    precededBy?: EventID[];
    causedBy?: EventID[];
    groupedWith?: EventID[];
  };
  sourceSystem: string;
  sourceDocument?: DocumentID;
}
```

**Event Types (50+ types)** organized by domain.

### 3.2 Backend Components (som-tier0)

```
apps/som-tier0/src/
├── server.ts                 # Entry point (Hono app)
├── config.ts                 # Environment configuration
├── api/
│   ├── api-server.ts         # Route registration & middleware
│   ├── routes.ts             # Route handlers (1000+ lines)
│   ├── middleware.ts         # Auth, validation, rate limiting
│   └── auth/                 # API key & gateway providers
├── event-store/
│   ├── index.ts              # IEventStore interface
│   ├── sqlite-store.ts       # SQLite implementation (dev)
│   ├── postgres-event-store.ts # PostgreSQL implementation (prod)
│   └── snapshot-store.ts     # State snapshots for performance
├── graph-store/
│   ├── interface.ts          # ISemanticGraphStore interface
│   ├── index.ts              # Core implementation
│   ├── neo4j-store.ts        # Neo4j implementation
│   └── cached-store.ts       # Redis caching layer
├── state-projection/
│   └── index.ts              # Event replay & state derivation
├── query/
│   ├── query-layer.ts        # Unified query interface
│   └── temporal-query-engine.ts # As-of queries
├── access-control/
│   └── index.ts              # OPA integration
├── constraint-engine/
│   └── index.ts              # Rule validation
├── semantic-access-layer/
│   ├── index.ts              # External system integration
│   └── ingestion/            # Adapters & transformers
├── background-jobs/
│   └── index.ts              # Snapshot workers, job scheduling
└── [domain]-management/      # Domain-specific logic
    ├── person-management/
    ├── organization-management/
    ├── mission-management/
    └── ...
```

### 3.3 Frontend Applications

| App | Port | Purpose | Key Technologies |
|-----|------|---------|------------------|
| **org-chart** | 3001 | Organization visualization | @xyflow/react, dagre |
| **how-do** | 3002 | Process management & drift detection | @dnd-kit |
| **policy-governance** | 3003 | Computable policy editor | @tiptap/react |
| **task-management** | 3004 | Task & initiative tracking | date-fns |
| **objectives-okr** | 3005 | Strategy & OKR management | - |

### 3.4 Shared Packages

```
packages/
├── som-shared-types/     # Core type definitions (Holons, Events, Relationships)
├── api-client/           # HTTP client with React hooks
├── ui-components/        # Shared React component library
└── semantic-linter/      # Architecture compliance tool
```

---

## 4. Data Flow

### 4.1 Write Path (Event Submission)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ API Server  │────▶│ Constraint  │────▶│ Event Store │
│  (Tier-1)   │     │ (Validate)  │     │   Engine    │     │ (Postgres)  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                           ┌───────────────────────────────────────┘
                           ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │    State    │────▶│ Graph Store │────▶│    Cache    │
                    │ Projection  │     │   (Neo4j)   │     │   (Redis)   │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

**Steps:**
1. Client submits event via REST API
2. API Server authenticates and authorizes request
3. Constraint Engine validates against governance rules
4. Event appended to PostgreSQL (immutable)
5. State Projection replays event to update derived state
6. Neo4j graph updated with new/modified Holons & Relationships
7. Redis cache invalidated for affected entities

### 4.2 Read Path (Query)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ API Server  │────▶│   Access    │────▶│ Query Layer │
│  (Tier-1)   │     │  (Auth)     │     │  Control    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                    ┌──────────────────────────────────────────────┤
                    │                                              │
                    ▼                                              ▼
             ┌─────────────┐                               ┌─────────────┐
             │    Cache    │◀──────────────────────────────│ Graph Store │
             │   (Redis)   │         (cache miss)          │   (Neo4j)   │
             └─────────────┘                               └─────────────┘
```

**Query Types:**
- **Current State**: Query Neo4j for live Holon/Relationship state
- **Temporal (As-Of)**: Replay events to reconstruct historical state
- **Pattern Matching**: Cypher queries for complex graph patterns
- **Full-Text Search**: Indexed search across Holon properties

### 4.3 External System Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SEMANTIC ACCESS LAYER (SAL)                          │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ API Adapter │  │File Adapter │  │ Webhook     │  │  Scheduled  │   │
│  │   (REST)    │  │   (CSV)     │  │  Listener   │  │   Polling   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │          │
│         └────────────────┴────────┬───────┴────────────────┘          │
│                                   ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    TRANSFORMATION PIPELINE                       │  │
│  │  [Raw Data] → [Normalize] → [Map to SOM Types] → [Validate]     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                   │                                    │
│                                   ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    ID MAPPING SERVICE                            │  │
│  │  External ID (NSIPS-123) ←→ Internal ID (uuid-xxx)              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          [Event Submission]
```

---

## 5. Design Decisions

### 5.1 Event Sourcing (ADR-001)

**Decision:** Use immutable event log as single source of truth.

**Rationale:**
- Complete audit trail for compliance
- Temporal queries ("as-of" any timestamp)
- Causal reasoning (trace event chains)
- Supports disconnected operations (log sync on reconnect)

**Trade-offs:**
- Higher storage requirements
- Eventual consistency between event store and projections
- Complexity in event schema evolution

### 5.2 Polyglot Persistence (ADR-014)

**Decision:** Use PostgreSQL + Neo4j + Redis instead of single database.

| Database | Purpose | Why |
|----------|---------|-----|
| PostgreSQL | Event Store | ACID, JSONB, proven reliability |
| Neo4j | Graph Queries | Native graph traversals, Cypher |
| Redis | Caching | Sub-millisecond lookups |

**Trade-offs:**
- Operational complexity (3 databases)
- Eventual consistency between stores
- Higher infrastructure cost

### 5.3 OPA for Authorization (ADR-011)

**Decision:** Use Open Policy Agent for policy-as-code authorization.

**Rationale:**
- Declarative policies in Rego
- Separation of policy from code
- Audit trail of authorization decisions
- Supports complex attribute-based access control

### 5.4 Monorepo with Workspaces (ADR-013)

**Decision:** Single repository with npm workspaces.

**Structure:**
```
digital-backbone/
├── apps/           # Deployable applications
├── packages/       # Shared libraries
└── docs/           # Documentation
```

**Benefits:**
- Atomic cross-package changes
- Shared tooling and configuration
- Single CI/CD pipeline

### 5.5 Document-Grounded Governance

**Decision:** All constraints must reference an authoritative source document.

**Rationale:**
- Traceability to human-readable policy
- Automatic constraint invalidation when documents are rescinded
- Clear ownership and accountability

---

## 6. System Constraints & Limitations

### 6.1 Scalability Constraints

| Dimension | Current Limit | Notes |
|-----------|---------------|-------|
| Events/second | ~1,000 | PostgreSQL write throughput |
| Holons | 1,000,000+ | Neo4j handles well |
| Concurrent users | ~1,000 | Limited by API server instances |
| Graph depth | ~20 levels | Deep traversals become expensive |
| Event replay | ~100,000 events | Beyond this, use snapshots |

### 6.2 Known Limitations

1. **Eventual Consistency**
   - Delay (milliseconds) between event commit and graph update
   - Mitigated with causal consistency tokens (future work)

2. **Temporal Query Performance**
   - Full event replay for historical state is O(n)
   - Mitigated with periodic snapshots

3. **Single-Level Security**
   - Each instance runs at one classification level
   - Cross-domain requires external ETL process

4. **No Real-Time Push**
   - Frontend polls for updates
   - WebSocket support planned for future

5. **Schema Evolution**
   - Event payloads require careful versioning
   - Breaking changes require migration scripts

### 6.3 Operational Constraints

| Constraint | Requirement |
|------------|-------------|
| Node.js Version | 20 LTS |
| PostgreSQL | 16+ |
| Neo4j | 5.15+ |
| Redis | 7+ |
| Memory (som-tier0) | 1GB minimum, 4GB recommended |
| Storage (events) | ~1KB per event average |

### 6.4 Security Constraints

1. **Authentication**
   - API key or gateway-provided identity
   - OIDC via Keycloak (optional)

2. **Authorization**
   - OPA policies evaluate every request
   - Fail-closed (deny by default)

3. **Data Classification**
   - Single-level per instance
   - No MLS (Multi-Level Security)

4. **Network**
   - All traffic should be TLS 1.3
   - Backend services on private network

---

## 7. Deployment Architecture

### 7.1 Docker Compose (Development)

```yaml
services:
  som-tier0:     # API Server (port 3000)
  org-chart:     # Frontend (port 3001)
  how-do:        # Frontend (port 3002)
  policy-governance: # Frontend (port 3003)
  task-management:   # Frontend (port 3004)
  objectives-okr:    # Frontend (port 3005)
  postgres:      # Event Store (port 5432)
  neo4j:         # Graph Store (port 7474, 7687)
  redis:         # Cache (port 6379)
  keycloak:      # Identity (port 8080)
  opa:           # Authorization (port 8181)
```

### 7.2 Production Topology

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (ALB/NLB)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ som-tier0│  │ som-tier0│  │ som-tier0│
        │    #1    │  │    #2    │  │    #3    │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ Postgres │      │  Neo4j   │      │  Redis   │
  │ (RDS)    │      │ (Aura/EC2)│     │(Elasticache)│
  └──────────┘      └──────────┘      └──────────┘
```

### 7.3 C-ATO Hardening

The Docker image includes:
- Non-root user execution
- Read-only root filesystem
- Resource limits (CPU, memory)
- Health checks
- Minimal base image (Alpine)

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│API Server│────▶│  Auth    │────▶│ Extract  │
│          │     │          │     │Middleware│     │UserContext│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
                 ▼                                             ▼
          ┌──────────┐                                  ┌──────────┐
          │ API Key  │                                  │ Gateway  │
          │ Provider │                                  │ Provider │
          │          │                                  │ (OIDC)   │
          └──────────┘                                  └──────────┘
```

### 8.2 Authorization Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Request  │────▶│  Authz   │────▶│   OPA    │────▶│ Policy   │
│ + User   │     │Middleware│     │  Query   │     │ Decision │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │ Allow /  │
                                                  │  Deny    │
                                                  └──────────┘
```

### 8.3 Data Access Control

```
Query Request
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL LAYER                      │
│                                                              │
│  1. Authentication: Who is making the request?               │
│  2. Authorization: Is this action allowed?                   │
│  3. Data Filtering: Remove unauthorized results              │
│  4. Classification: Match user clearance to data level       │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
 Filtered Response
```

---

## Appendix A: ADR Index

| ADR | Title | Status |
|-----|-------|--------|
| 001 | Event Idempotency | Accepted |
| 001 | SQLite Persistence (Dev) | Accepted |
| 002 | Unified Client Architecture | Accepted |
| 003 | Governance Config Singleton | Accepted |
| 004 | Semantic Proxy Pattern | Accepted |
| 005 | Declarative Routing | Accepted |
| 010 | Seed Persistence Adapter | Accepted |
| 011 | Authorization via OPA | Accepted |
| 012 | Postgres Migration & Async EventStore | Accepted |
| 013 | Monorepo CommonJS Standardization | Accepted |
| 014 | Polyglot Persistence (Neo4j, Redis) | Accepted |

---

## Appendix B: Technology Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.9 | Language |
| React | 19 | UI Framework |
| Vite | 6/7 | Build Tool |
| Tailwind CSS | 4 | Styling |
| Hono | 4.10 | API Framework |
| PostgreSQL | 16 | Event Store |
| Neo4j | 5.15 | Graph Store |
| Redis | 7 | Cache |
| OPA | Latest | Authorization |
| Keycloak | 23 | Identity |

---

## Appendix C: Port Allocations

| Service | Port | Protocol |
|---------|------|----------|
| som-tier0 | 3000 | HTTP |
| org-chart | 3001 | HTTP |
| how-do | 3002 | HTTP |
| policy-governance | 3003 | HTTP |
| task-management | 3004 | HTTP |
| objectives-okr | 3005 | HTTP |
| PostgreSQL | 5432 | TCP |
| Neo4j HTTP | 7474 | HTTP |
| Neo4j Bolt | 7687 | TCP |
| Redis | 6379 | TCP |
| Keycloak | 8080 | HTTP |
| OPA | 8181 | HTTP |
