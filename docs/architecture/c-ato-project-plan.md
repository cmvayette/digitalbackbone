# C-ATO Readiness Project Plan
## Digital Backbone - DoD IL5/IL6 Deployment

**Document Version**: 1.0
**Assessment Date**: December 11, 2025
**Target Deployment**: NSW IL5/IL6, 20,000-30,000 users
**Estimated Timeline**: 12-16 weeks
**Total Effort**: 220-340 person-hours

---

## VERIFICATION STATUS SUMMARY

**Status as of December 11, 2025:**

| Category | Complete | Partial | Not Started |
|----------|----------|---------|-------------|
| Type Safety & Code Quality | 0 | 1 | 2 |
| Security & Authentication | 0 | 2 | 3 |
| Infrastructure & Persistence | 1 | 0 | 3 |
| Audit & Monitoring | 0 | 3 | 0 |
| Operational Readiness | 0 | 0 | 2 |
| Testing & Documentation | 1 | 0 | 1 |
| **TOTAL** | **2/19** | **6/19** | **11/19** |

**Overall Readiness: 10% Complete, 32% Partial, 58% Not Started**

---

## PHASE 1: CRITICAL SECURITY & CODE QUALITY (Weeks 1-2)
**Goal**: Fix P0 blocking issues for security accreditation
**Effort**: 60-80 hours
**Team**: 2-3 engineers + 1 security specialist

### Task 1.1: Type Safety Remediation ⚠️ VERIFIED NEEDED
**Status**: 60+ `any` types found in codebase
**Priority**: P0 - CRITICAL
**Effort**: 16-24 hours
**Owner**: Backend Lead

**Subtasks**:
- [ ] `apps/som-tier0/src/event-store/postgres-event-store.ts` (lines 100, 161)
  - Replace `any` with proper database row types
  - Create `DatabaseEventRow` interface
- [ ] `apps/som-tier0/src/semantic-access-layer/ingestion/adapters/api-adapter.ts` (lines 29, 31, 36, 46)
  - Type API response schemas with Zod
  - Create typed interfaces for external API responses
- [ ] `packages/api-client/src/hooks/useProcessEditor.ts` (line 48)
  - Type error handling with proper Error types
- [ ] `apps/how-do/src/hooks/useProcess.ts` (line 11)
  - Define `Obligation` interface
- [ ] `apps/policy-governance/src/components/editor/ObligationsSidecar.tsx`
  - Remove type casting, use proper inference
- [ ] Upgrade ESLint config to error on `@typescript-eslint/no-explicit-any`
  - Change `eslint.config.js` from "warn" to "error"

**Acceptance Criteria**:
- Zero `any` types in production code (test fixtures allowed)
- `npm run lint` passes with no errors
- TypeScript strict mode enabled in all tsconfig.json

**Risk**: Medium - Could reveal hidden bugs requiring additional fixes

---

### Task 1.2: Fix Silent API Failures ⚠️ VERIFIED NEEDED
**Status**: Multiple files return `[]` instead of throwing errors
**Priority**: P0 - CRITICAL
**Effort**: 8-12 hours
**Owner**: Frontend Lead

**Affected Files**:
- [ ] `apps/task-management/src/hooks/useExternalTaskData.ts` (lines 35, 57)
- [ ] `apps/policy-governance/src/hooks/useExternalPolicyData.ts` (line 33)
- [ ] `apps/org-chart/src/App.tsx` (line 73)
- [ ] `apps/how-do/src/hooks/useDriftDetection.ts` (line 33)

**Implementation Pattern**:
```typescript
// BEFORE (Silent Failure)
try {
  const data = await fetchData();
  return data;
} catch (error) {
  return []; // Silent failure!
}

// AFTER (Explicit Error Handling)
try {
  const data = await fetchData();
  return data;
} catch (error) {
  logger.error('Failed to fetch data', { error, context });
  throw new APIError('Data fetch failed', { cause: error });
}
```

**Acceptance Criteria**:
- All API failures throw typed errors
- Error boundaries catch and display user-friendly messages
- Audit log captures all API failures

**Risk**: Low - Requires UI error boundary updates

---

### Task 1.3: CAC/PIV Smart Card Integration ⚠️ VERIFIED NEEDED
**Status**: Mock implementation only; real PKI integration missing
**Priority**: P0 - CRITICAL (IL5/IL6 blocker)
**Effort**: 24-32 hours
**Owner**: Security Engineer + Backend Lead

**Current State**:
- ✅ Keycloak container running (quay.io/keycloak/23.0)
- ✅ OIDC integration in `@som/api-client`
- ✅ AuthGuard components in Tier-1 apps
- ❌ Mock CAC login (packages/ui-components/src/components/auth/AuthCallback.tsx:24)
- ❌ No X.509 certificate validation

**Subtasks**:
- [ ] Configure Keycloak for X.509 client certificate authentication
  - Enable direct grant authenticator
  - Add X509 certificate authenticator to browser flow
  - Map certificate DN to user attributes
- [ ] Update `gateway-provider.ts` to extract certificate headers
  - Extract `SSL_CLIENT_S_DN`, `SSL_CLIENT_VERIFY`
  - Validate certificate against DoD PKI trust store
- [ ] Remove mock token generation in `AuthCallback.tsx`
  - Replace lines 24-30 with real OIDC token exchange
- [ ] Test with DoD test CAC (or simulated PKI)
  - Verify certificate validation
  - Verify EDIPI extraction from certificate
- [ ] Document CAC/PIV setup in operational runbook

**Dependencies**:
- DoD PKI root certificates (JITC approved)
- Test CAC or simulated PKI environment

**Acceptance Criteria**:
- Real X.509 certificate validation
- EDIPI extracted from certificate DN
- Mock login flow removed
- Integration tested with DoD test PKI

**Risk**: High - Requires DoD PKI environment; may need coordination with CISO

---

### Task 1.4: Implement TLS/mTLS Between Services ❌ VERIFIED NEEDED
**Status**: No TLS configured; development only
**Priority**: P0 - CRITICAL
**Effort**: 16-24 hours
**Owner**: DevOps/SRE Lead

**Current State**:
- ✅ Non-root user, read-only filesystem (Dockerfile)
- ✅ Healthchecks configured
- ❌ Keycloak on plain HTTP (port 8080)
- ❌ No TLS certificates
- ❌ No mTLS between Tier-0 ↔ OPA, Tier-0 ↔ PostgreSQL

**Subtasks**:
- [ ] Generate TLS certificates for development (self-signed)
  - Create CA certificate
  - Generate service certificates (som-tier0, keycloak, opa, postgres)
- [ ] Update docker-compose.yml for TLS
  - Add certificate volumes
  - Configure TLS ports (443 vs 80, 5432→5433 for Postgres SSL)
  - Update environment variables (NODE_TLS_CERT_FILE, etc.)
- [ ] Configure Hono server for HTTPS
  - Add TLS options to server config
  - Redirect HTTP→HTTPS
- [ ] Configure PostgreSQL for SSL connections
  - Set `ssl=true` in connection string
  - Mount server certificate
- [ ] Configure OPA for TLS
  - Use `--tls-cert-file`, `--tls-private-key-file` flags
- [ ] Update API client to use HTTPS
  - Change baseUrl from http:// → https://
- [ ] Document certificate rotation procedures

**For Production (Kubernetes + Istio)**:
- [ ] Implement Istio mTLS strict mode
  - PeerAuthentication policy: `mode: STRICT`
  - Automatic mTLS between all services
- [ ] Configure cert-manager for certificate lifecycle
  - Auto-renewal before expiry
  - Integration with DoD PKI if required

**Acceptance Criteria**:
- All inter-service communication encrypted (TLS 1.2+)
- Certificate validation enforced
- Plain HTTP disabled
- mTLS working in Kubernetes/Istio

**Risk**: Medium - Requires coordination with network team for cert signing

---

### Task 1.5: FIPS 140-2 Cryptography Compliance ❌ VERIFIED NEEDED
**Status**: No FIPS modules found
**Priority**: P0 - CRITICAL (IL5/IL6 blocker)
**Effort**: 16-20 hours
**Owner**: Security Engineer + Infrastructure Lead

**Current State**:
- ❌ Standard Node.js crypto module (not FIPS validated)
- ❌ No FIPS mode environment variable
- ❌ No FIPS-enabled OpenSSL

**Subtasks**:
- [ ] Build Node.js with FIPS-enabled OpenSSL
  ```bash
  # Use Iron Bank Node.js image with FIPS or build custom
  docker pull registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:20.x.x
  ```
- [ ] Enable FIPS mode in Node.js runtime
  ```javascript
  // In server startup (apps/som-tier0/src/index.ts)
  import crypto from 'crypto';
  crypto.setFips(1); // Enable FIPS mode
  ```
- [ ] Validate FIPS mode is active
  ```javascript
  if (!crypto.getFips()) {
    throw new Error('FIPS mode required but not enabled');
  }
  ```
- [ ] Audit all cryptographic operations
  - Event ID generation (UUID v4) - verify FIPS-compliant RNG
  - Password hashing (if applicable) - use FIPS-approved algorithms
  - Token generation - use FIPS-approved RNG
- [ ] Update Dockerfile to use FIPS-enabled base image
  - Replace `node:20-alpine` with `registry1.dso.mil/ironbank/opensource/nodejs/nodejs20`
- [ ] Document FIPS configuration in deployment guide

**FIPS-Approved Algorithms** (Reference):
- AES (128, 192, 256 bit)
- SHA-2 (SHA-256, SHA-384, SHA-512)
- RSA (2048, 3072, 4096 bit)
- ECDSA (P-256, P-384, P-521)

**Acceptance Criteria**:
- `crypto.getFips()` returns `true`
- All cryptographic operations use FIPS-approved algorithms
- Node.js running on FIPS-validated OpenSSL
- FIPS compliance documented

**Risk**: High - May require custom Node.js build; potential compatibility issues

---

### Task 1.6: Rebase to Iron Bank Container Images ❌ VERIFIED NEEDED
**Status**: Alpine images used; not Iron Bank compliant
**Priority**: P0 - CRITICAL
**Effort**: 8-12 hours
**Owner**: DevOps Lead

**Current State**:
- ❌ `Dockerfile` uses `node:20-alpine` (lines 5, 15)
- ❌ docker-compose.yml uses upstream images (postgres:16-alpine, keycloak:23.0, openpolicyagent/opa)

**Subtasks**:
- [ ] Rebase Tier-0 Dockerfile to Iron Bank Node.js
  ```dockerfile
  # BEFORE
  FROM node:20-alpine AS builder

  # AFTER
  FROM registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:20.11.1 AS builder
  ```
- [ ] Rebase PostgreSQL to Iron Bank image
  ```yaml
  # docker-compose.yml
  postgres:
    image: registry1.dso.mil/ironbank/opensource/postgres/postgresql:16
  ```
- [ ] Rebase Keycloak to Iron Bank image
  ```yaml
  keycloak:
    image: registry1.dso.mil/ironbank/opensource/keycloak/keycloak:23.0.7
  ```
- [ ] Rebase OPA to Iron Bank image (if available, else request approval)
  ```yaml
  opa:
    # Check Iron Bank registry for OPA; if not available, use hardened UBI base
    image: registry1.dso.mil/ironbank/redhat/ubi/ubi9-minimal:latest
  ```
- [ ] Update CI/CD pipeline to pull from Iron Bank
  - Configure registry credentials (pull secret)
  - Update GitHub Actions workflow
- [ ] Test all services with new images
  - Verify compatibility
  - Run integration tests
- [ ] Document Iron Bank image versions in deployment guide

**Iron Bank Registry Access**:
- Requires DoD PKI certificate or approved service account
- Coordinate with CISO for registry access

**Acceptance Criteria**:
- All base images from `registry1.dso.mil/ironbank/*`
- No Alpine or upstream Docker Hub images
- CI/CD pipeline uses Iron Bank images
- SBOM generated for all images

**Risk**: Medium - Requires Iron Bank access; potential image compatibility issues

---

## PHASE 2: INFRASTRUCTURE & PERSISTENCE (Weeks 3-6)
**Goal**: Deploy production-ready infrastructure with HA, encryption, monitoring
**Effort**: 80-120 hours
**Team**: 2 SRE + 1 backend engineer + 1 security specialist

### Task 2.1: Deploy CrunchyData Postgres Operator ❌ VERIFIED NEEDED
**Status**: Documented in ADR 012, not implemented
**Priority**: P1 - HIGH
**Effort**: 20-24 hours
**Owner**: SRE Lead

**Current State**:
- ✅ PostgreSQL async event store implemented (`postgres-event-store.ts`)
- ✅ docker-compose.yml has PostgreSQL 16
- ❌ No Kubernetes deployment
- ❌ No CrunchyData operator configured
- ❌ No high availability

**Subtasks**:
- [ ] Install CrunchyData Postgres Operator in Kubernetes
  ```bash
  # Using Helm
  helm repo add crunchydata https://crunchydata.github.io/postgres-operator
  helm install pgo crunchydata/postgres-operator -n postgres-operator
  ```
- [ ] Create PostgresCluster manifest
  ```yaml
  # k8s/postgres-cluster.yaml
  apiVersion: postgres-operator.crunchydata.com/v1beta1
  kind: PostgresCluster
  metadata:
    name: som-postgres
  spec:
    postgresVersion: 16
    instances:
      - replicas: 3  # HA with 3 nodes
        dataVolumeClaimSpec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 500Gi
    backups:
      pgbackrest:
        repos:
          - name: repo1
            schedules:
              full: "0 1 * * 0"  # Weekly full backup
              incremental: "0 1 * * 1-6"  # Daily incremental
    patroni:
      dynamicConfiguration:
        postgresql:
          parameters:
            ssl: "on"
            ssl_cert_file: /etc/ssl/certs/server.crt
            ssl_key_file: /etc/ssl/private/server.key
  ```
- [ ] Configure encryption at rest
  - Enable PostgreSQL data encryption (LUKS or storage-level)
  - Mount encrypted volumes
- [ ] Create Kubernetes Secret for database credentials
  ```bash
  kubectl create secret generic som-postgres-creds \
    --from-literal=username=som_user \
    --from-literal=password=$(openssl rand -base64 32) \
    -n som
  ```
- [ ] Update Tier-0 deployment to use PostgresCluster connection
  - Update DATABASE_URL to point to service endpoint
  - Use SSL connection string: `?sslmode=require`
- [ ] Configure connection pooling (PgBouncer)
  - CrunchyData includes PgBouncer
  - Configure pool size for 20k-30k users
- [ ] Test failover scenarios
  - Kill primary node, verify automatic failover
  - Verify read replicas continue serving during failover
- [ ] Document backup/restore procedures

**Dependencies**:
- Kubernetes cluster (staging or production)
- Persistent volume provisioner (AWS EBS, GCP PD, or on-prem storage)

**Acceptance Criteria**:
- 3-node PostgreSQL cluster running
- Automatic failover verified
- Encryption at rest enabled
- Backups running (full + incremental)
- Connection pooling configured
- Tier-0 connected to cluster

**Risk**: Medium - Requires K8s cluster; storage provisioning coordination

---

### Task 2.2: Implement HSM Integration for Key Management ❌ VERIFIED NEEDED
**Status**: No HSM code found
**Priority**: P0 - CRITICAL (IL5/IL6 requirement)
**Effort**: 24-32 hours
**Owner**: Security Engineer

**Current State**:
- ❌ No HSM integration
- ❌ Using Node.js crypto module for key generation

**Subtasks**:
- [ ] Select HSM solution
  - **Option A**: AWS CloudHSM (if cloud deployment)
  - **Option B**: Thales Luna HSM (on-prem DoD standard)
  - **Option C**: AWS KMS with FIPS endpoints (for key storage)
- [ ] Install HSM client library
  ```bash
  # For AWS CloudHSM
  npm install @aws-sdk/client-cloudhsm-v2

  # For generic PKCS#11
  npm install pkcs11js
  ```
- [ ] Create HSM key management service
  ```typescript
  // apps/som-tier0/src/security/hsm-key-manager.ts
  export interface IKeyManager {
    generateKey(keyId: string, algorithm: string): Promise<string>;
    signData(keyId: string, data: Buffer): Promise<Buffer>;
    verifySignature(keyId: string, data: Buffer, signature: Buffer): Promise<boolean>;
    rotateKey(keyId: string): Promise<void>;
  }
  ```
- [ ] Integrate HSM for encryption keys
  - Use HSM-generated keys for database encryption
  - Store master encryption key (MEK) in HSM
- [ ] Integrate HSM for signing
  - Sign audit log entries for non-repudiation
  - Sign event store entries (optional, for integrity)
- [ ] Implement key rotation procedures
  - Automated 90-day rotation
  - Document emergency key rotation process
- [ ] Configure HSM backups
  - Backup HSM keys to secure offline storage
  - Document key recovery procedures
- [ ] Test HSM failover (if clustered)

**For DoD Deployment**:
- Verify HSM is on FIPS 140-2 Level 3 approved product list
- Coordinate with CISO for HSM procurement

**Acceptance Criteria**:
- All encryption keys stored in HSM
- Master encryption key (MEK) in HSM, not filesystem
- Key rotation automated
- HSM failover tested (if applicable)
- Audit logging of all key operations

**Risk**: High - HSM procurement may have long lead time; cost consideration

---

### Task 2.3: Implement Distributed Caching (Redis) ❌ VERIFIED NEEDED
**Status**: No Redis or distributed cache found
**Priority**: P2 - MEDIUM (for 20k-30k users)
**Effort**: 12-16 hours
**Owner**: Backend Engineer

**Current State**:
- ❌ No distributed cache
- ❌ In-memory rate limiting (won't scale across pods)
- ⚠️ State projection rebuilds on every query (performance issue at scale)

**Subtasks**:
- [ ] Add Redis to docker-compose.yml
  ```yaml
  redis:
    image: registry1.dso.mil/ironbank/opensource/redis/redis7:7.2.4
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
  ```
- [ ] Install Redis client
  ```bash
  npm install ioredis @types/ioredis
  ```
- [ ] Create caching service
  ```typescript
  // apps/som-tier0/src/infrastructure/cache-service.ts
  import Redis from 'ioredis';

  export class CacheService {
    private redis: Redis;

    async get<T>(key: string): Promise<T | null>;
    async set(key: string, value: any, ttlSeconds: number): Promise<void>;
    async del(key: string): Promise<void>;
    async invalidatePattern(pattern: string): Promise<void>;
  }
  ```
- [ ] Cache OPA authorization decisions
  ```typescript
  // Cache key: `opa:${userId}:${action}:${resourceType}`
  // TTL: 300 seconds (5 minutes)
  const cacheKey = `opa:${user.id}:${action}:${resource.type}`;
  const cached = await cache.get<boolean>(cacheKey);
  if (cached !== null) return cached;

  const decision = await opaClient.checkAccess(user, action, resource);
  await cache.set(cacheKey, decision, 300);
  return decision;
  ```
- [ ] Cache state projections
  ```typescript
  // Cache holons by type
  const cacheKey = `holons:${holonType}:${timestamp}`;
  const cached = await cache.get<Holon[]>(cacheKey);
  if (cached) return cached;

  const holons = await stateProjection.getHolonsByType(holonType);
  await cache.set(cacheKey, holons, 600); // 10 min TTL
  return holons;
  ```
- [ ] Implement cache invalidation on event submission
  ```typescript
  // When event submitted, invalidate related caches
  await cache.invalidatePattern(`holons:${event.subjects[0].type}:*`);
  ```
- [ ] Migrate rate limiting to Redis
  - Use Redis counters instead of in-memory Map
  - Use sliding window rate limiting
- [ ] Configure Redis persistence (AOF + RDB)
- [ ] Configure Redis Sentinel for HA (3-node cluster)

**For Production (Kubernetes)**:
- [ ] Deploy Redis cluster with Bitnami Helm chart
  ```bash
  helm install redis bitnami/redis -n som \
    --set architecture=replication \
    --set replica.replicaCount=2
  ```

**Acceptance Criteria**:
- OPA decisions cached (p95 latency < 50ms)
- State projections cached (p95 query latency < 500ms)
- Rate limiting distributed across pods
- Redis HA verified (failover tested)
- Cache invalidation working correctly

**Risk**: Low - Standard implementation; need to monitor cache hit rates

---

### Task 2.4: Implement Explicit Audit Event Logging ⚠️ VERIFIED NEEDED
**Status**: Event store provides implicit audit trail; explicit decision logging missing
**Priority**: P1 - HIGH (AU-2, AU-3 compliance)
**Effort**: 12-16 hours
**Owner**: Backend Engineer

**Current State**:
- ✅ Structured JSON logging (`monitoring/logger.ts`)
- ✅ Event store provides state change audit
- ⚠️ OPA decisions not logged to audit trail
- ⚠️ No explicit login/logout events
- ⚠️ `traceId` field defined but not propagated

**Subtasks**:
- [ ] Define audit event types
  ```typescript
  // apps/som-tier0/src/monitoring/audit-events.ts
  export enum AuditEventType {
    // Authentication
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    LOGIN_FAILED = 'LOGIN_FAILED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',

    // Authorization
    ACCESS_GRANTED = 'ACCESS_GRANTED',
    ACCESS_DENIED = 'ACCESS_DENIED',

    // Data Operations
    EVENT_SUBMITTED = 'EVENT_SUBMITTED',
    EVENT_REJECTED = 'EVENT_REJECTED',
    QUERY_EXECUTED = 'QUERY_EXECUTED',

    // Administrative
    SCHEMA_MODIFIED = 'SCHEMA_MODIFIED',
    CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  }

  export interface AuditEvent {
    type: AuditEventType;
    timestamp: Date;
    userId: string;
    userRoles: string[];
    clearanceLevel: string;
    action: string;
    resource: {
      type: string;
      id?: string;
      classification?: string;
    };
    outcome: 'success' | 'failure';
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    traceId: string;
    metadata?: Record<string, any>;
  }
  ```
- [ ] Create audit logger service
  ```typescript
  // apps/som-tier0/src/monitoring/audit-logger.ts
  export class AuditLogger {
    logAuthenticationEvent(event: AuditEvent): Promise<void>;
    logAuthorizationEvent(event: AuditEvent): Promise<void>;
    logDataAccessEvent(event: AuditEvent): Promise<void>;
  }
  ```
- [ ] Integrate with OPA client
  ```typescript
  // packages/api-client/src/services/OPAClient.ts
  async checkAccess(user, action, resource): Promise<boolean> {
    const decision = await this.checkPolicy(user, action, resource);

    // Log authorization decision
    await auditLogger.logAuthorizationEvent({
      type: decision ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED,
      timestamp: new Date(),
      userId: user.id,
      userRoles: user.roles,
      clearanceLevel: user.clearanceLevel,
      action,
      resource: {
        type: resource.type,
        id: resource.id,
        classification: resource.classification
      },
      outcome: decision ? 'success' : 'failure',
      reason: decision ? undefined : 'Insufficient clearance or role',
      traceId: context.traceId
    });

    return decision;
  }
  ```
- [ ] Log authentication events in auth providers
  ```typescript
  // apps/som-tier0/src/api/auth/gateway-provider.ts
  async authenticate(request): Promise<User> {
    try {
      const user = await this.extractUser(request);
      await auditLogger.logAuthenticationEvent({
        type: AuditEventType.USER_LOGIN,
        userId: user.id,
        outcome: 'success',
        ipAddress: request.headers.get('x-forwarded-for'),
        traceId: request.headers.get('x-trace-id')
      });
      return user;
    } catch (error) {
      await auditLogger.logAuthenticationEvent({
        type: AuditEventType.LOGIN_FAILED,
        userId: 'unknown',
        outcome: 'failure',
        reason: error.message,
        ipAddress: request.headers.get('x-forwarded-for'),
        traceId: request.headers.get('x-trace-id')
      });
      throw error;
    }
  }
  ```
- [ ] Configure audit log persistence
  - Send to WORM (write-once-read-many) storage
  - Integrate with centralized logging (Splunk/ELK)
  - Ensure tamper-evident storage (optionally sign with HSM)
- [ ] Document audit log retention policy
  - Minimum retention: 1 year (NIST baseline)
  - DoD may require 7 years for classified systems

**Acceptance Criteria**:
- All authentication events logged
- All authorization decisions logged
- All state-changing operations logged
- Audit logs include WHO, WHAT, WHEN, WHERE, WHY
- Audit logs sent to immutable storage
- Audit log retention policy documented

**Risk**: Low - Straightforward implementation

---

### Task 2.5: Implement Distributed Tracing (Correlation IDs) ⚠️ VERIFIED NEEDED
**Status**: `traceId` field defined but not propagated
**Priority**: P2 - MEDIUM
**Effort**: 8-12 hours
**Owner**: Backend Engineer

**Current State**:
- ⚠️ `traceId?: string` in LogEntry interface (monitoring/logger.ts:12)
- ⚠️ `actor`, `sourceSystem` in AuditParams
- ❌ No middleware generating trace IDs
- ❌ No trace collection system (Jaeger, Zipkin, etc.)

**Subtasks**:
- [ ] Install trace ID generation library
  ```bash
  npm install uuid
  ```
- [ ] Create trace ID middleware
  ```typescript
  // apps/som-tier0/src/api/middleware/trace-middleware.ts
  import { v4 as uuidv4 } from 'uuid';

  export const traceMiddleware = async (c, next) => {
    // Extract or generate trace ID
    const traceId = c.req.header('X-Trace-ID') ||
                    c.req.header('X-Request-ID') ||
                    uuidv4();

    // Store in request context
    c.set('traceId', traceId);

    // Add to response headers
    c.header('X-Trace-ID', traceId);

    // Log request start
    logger.info('Request started', {
      traceId,
      method: c.req.method,
      path: c.req.path,
      userId: c.get('user')?.id
    });

    await next();

    // Log request end
    logger.info('Request completed', {
      traceId,
      statusCode: c.res.status
    });
  };
  ```
- [ ] Register middleware in Hono app
  ```typescript
  // apps/som-tier0/src/api/routes.ts
  app.use('*', traceMiddleware);
  ```
- [ ] Propagate trace ID through logging
  ```typescript
  // Update logger calls to include trace ID from context
  logger.info('Event submitted', {
    traceId: c.get('traceId'),
    eventId: event.id
  });
  ```
- [ ] Propagate trace ID to OPA calls
  ```typescript
  // Include trace ID in OPA request metadata
  const decision = await opaClient.checkAccess(user, action, resource, {
    traceId: c.get('traceId')
  });
  ```
- [ ] Add trace ID to API responses (optional, for debugging)
  ```typescript
  return c.json({
    success: true,
    data: holons,
    metadata: {
      traceId: c.get('traceId'),
      timestamp: new Date()
    }
  });
  ```
- [ ] (Optional) Integrate OpenTelemetry for distributed tracing
  ```bash
  npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
  ```
  - Automatically instruments HTTP requests, database queries
  - Export traces to Jaeger or AWS X-Ray

**Acceptance Criteria**:
- Every request has unique trace ID
- Trace ID propagated through all log entries
- Trace ID in response headers for client debugging
- Distributed tracing integrated (if OpenTelemetry added)
- Trace ID searchable in log aggregation system

**Risk**: Low - Standard implementation

---

### Task 2.6: Configure Centralized Log Aggregation ⚠️ VERIFIED NEEDED
**Status**: JSON logging implemented, no aggregation system
**Priority**: P1 - HIGH (operational visibility)
**Effort**: 12-16 hours
**Owner**: SRE Lead

**Current State**:
- ✅ Structured JSON logging (`monitoring/logger.ts`)
- ✅ Logs sent to stdout
- ❌ No centralized collection (ELK, Splunk, Datadog)

**Subtasks**:
- [ ] Select log aggregation solution
  - **Option A**: ELK Stack (Elasticsearch + Logstash + Kibana) - open source
  - **Option B**: Splunk Enterprise - DoD standard
  - **Option C**: AWS CloudWatch Logs - if cloud deployment
  - **Option D**: Grafana Loki - lightweight alternative
- [ ] Deploy log aggregation infrastructure
  ```yaml
  # Example: ELK Stack in Kubernetes (Helm)
  helm repo add elastic https://helm.elastic.co

  # Elasticsearch
  helm install elasticsearch elastic/elasticsearch -n logging \
    --set replicas=3 \
    --set volumeClaimTemplate.resources.requests.storage=100Gi

  # Kibana
  helm install kibana elastic/kibana -n logging

  # Filebeat (log shipper)
  helm install filebeat elastic/filebeat -n logging
  ```
- [ ] Configure log shipping from containers
  ```yaml
  # Kubernetes DaemonSet for log collection
  # Filebeat reads logs from /var/log/containers/*.log
  # Parses JSON and sends to Elasticsearch
  ```
- [ ] Create log parsing pipeline
  ```yaml
  # Logstash pipeline (if using ELK)
  input {
    beats {
      port => 5044
    }
  }

  filter {
    json {
      source => "message"
    }

    # Extract fields
    mutate {
      rename => { "[level]" => "log_level" }
      rename => { "[userId]" => "user_id" }
      rename => { "[traceId]" => "trace_id" }
    }

    # Tag sensitive operations
    if [action] in ["submit_event", "modify_schema"] {
      mutate { add_tag => ["sensitive"] }
    }
  }

  output {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "som-logs-%{+YYYY.MM.dd}"
    }
  }
  ```
- [ ] Create Kibana dashboards
  - Error rate by endpoint
  - Authentication failures
  - Authorization denials
  - Query latency (p50, p95, p99)
  - Event submission rate
- [ ] Configure log retention policy
  - Hot storage: 30 days (fast SSD)
  - Warm storage: 90 days (slower HDD)
  - Cold storage: 1 year (archival, WORM if compliance required)
- [ ] Set up alerting
  ```yaml
  # Example: Alert on high error rate
  - name: high_error_rate
    condition: error_count > 100 in 5 minutes
    action: send_email, send_slack
  ```
- [ ] Document log search procedures for incident response

**For DoD Deployment**:
- Splunk is commonly approved; ELK may require ATO
- Ensure log aggregation system meets IL5/IL6 requirements
- Configure WORM storage for audit logs (compliance requirement)

**Acceptance Criteria**:
- All Tier-0 and Tier-1 logs centralized
- Search by trace ID, user ID, event type working
- Dashboards showing key metrics
- Alerts configured for critical errors
- Log retention policy enforced
- Audit logs in tamper-evident storage

**Risk**: Medium - Requires infrastructure; storage costs

---

## PHASE 3: OPERATIONAL READINESS (Weeks 7-10)
**Goal**: Document procedures, create runbooks, test disaster recovery
**Effort**: 60-80 hours
**Team**: 2 SRE + 1 security specialist + 1 technical writer

### Task 3.1: Create Operational Runbooks ❌ VERIFIED NEEDED
**Status**: No runbooks found
**Priority**: P1 - HIGH
**Effort**: 24-32 hours
**Owner**: SRE Lead + Technical Writer

**Current State**:
- ✅ Developer onboarding guide (`docs/guides/developer_onboarding.md`)
- ❌ No operational runbooks
- ❌ No incident response procedures

**Runbooks to Create**:

#### 3.1.1: Deployment Runbook
- [ ] Document deployment procedure
  - Pre-deployment checklist
  - Blue-green deployment steps
  - Canary deployment steps
  - Rollback procedure
  - Post-deployment verification
- [ ] Include configuration management
  - Environment variable setup
  - Secrets injection (Kubernetes secrets)
  - Feature flags (if applicable)
- [ ] Document smoke tests
  - Health check validation
  - End-to-end transaction test
  - Performance baseline verification

#### 3.1.2: Backup & Recovery Runbook
- [ ] Document backup procedures
  - PostgreSQL backup schedule (full + incremental)
  - Backup verification process
  - Backup encryption requirements
  - Off-site backup storage
- [ ] Document restore procedures
  - Point-in-time recovery (PITR)
  - Full restore from backup
  - Partial restore (single database)
  - Recovery time objective (RTO): <1 hour
  - Recovery point objective (RPO): <15 minutes
- [ ] Document backup testing schedule
  - Monthly restore drill
  - Quarterly disaster recovery exercise

#### 3.1.3: Database Failover Runbook
- [ ] Document automatic failover
  - Patroni automatic failover (CrunchyData)
  - Failover detection (health checks)
  - Failover time: <30 seconds
- [ ] Document manual failover procedure
  - When to trigger manual failover
  - Patroni switchover command
  - Verification steps
  - Rollback procedure
- [ ] Document split-brain prevention
  - Fencing mechanisms
  - Quorum requirements (3-node cluster)

#### 3.1.4: Certificate Rotation Runbook
- [ ] Document TLS certificate rotation
  - Certificate expiry monitoring (alert 30 days before)
  - New certificate generation
  - Certificate deployment (zero-downtime)
  - Validation procedure
- [ ] Document CAC/PIV certificate updates
  - DoD PKI root certificate updates
  - CRL (Certificate Revocation List) refresh
- [ ] Document automation
  - cert-manager auto-renewal (if using)
  - Manual steps if automation fails

#### 3.1.5: Secrets Rotation Runbook
- [ ] Document database credential rotation
  - Generate new credentials
  - Update Kubernetes secrets
  - Rolling restart of Tier-0 pods
  - Verify connectivity
- [ ] Document API key rotation
  - Generate new keys
  - Update client configurations
  - Deprecation timeline (allow overlap period)
  - Revoke old keys
- [ ] Document HSM key rotation
  - Generate new encryption key
  - Re-encrypt data with new key (if necessary)
  - Archive old key (retain for data recovery)
- [ ] Rotation schedule
  - Database credentials: 90 days
  - API keys: 180 days
  - Encryption keys: 1 year

#### 3.1.6: Incident Response Runbook
- [ ] Document incident severity levels
  - P0 (Critical): System down, data breach
  - P1 (High): Major feature unavailable, performance degraded
  - P2 (Medium): Minor feature broken, workaround available
  - P3 (Low): Cosmetic issue, no user impact
- [ ] Document incident response procedure
  - Detection (alerts, user reports)
  - Triage (assess severity, assign owner)
  - Investigation (logs, traces, metrics)
  - Mitigation (immediate fix or workaround)
  - Resolution (root cause fix, testing)
  - Post-mortem (blameless, action items)
- [ ] Document communication plan
  - Internal notification (Slack, email, phone)
  - External notification (status page, user email)
  - Stakeholder updates (CISO, program manager)
- [ ] Document on-call rotation
  - Primary on-call engineer
  - Secondary on-call (escalation)
  - Manager escalation path

#### 3.1.7: Scaling Runbook
- [ ] Document horizontal scaling
  - Increase Tier-0 pod replicas
  - Increase PostgreSQL read replicas
  - Increase Redis cluster nodes
  - Load balancer configuration updates
- [ ] Document vertical scaling
  - Increase pod CPU/memory limits
  - Increase database instance size
  - Rolling restart procedure
- [ ] Document auto-scaling configuration
  - HorizontalPodAutoscaler (HPA) based on CPU/memory
  - Custom metrics (request rate, queue depth)
- [ ] Document capacity planning
  - Baseline metrics (current usage)
  - Growth projections (user growth rate)
  - Resource reservation (overhead buffer)

#### 3.1.8: Security Patching Runbook
- [ ] Document vulnerability scanning
  - Container image scanning (Twistlock, Prisma Cloud)
  - Dependency scanning (npm audit, Dependabot)
  - Weekly vulnerability review
- [ ] Document patch application
  - Critical patches: <24 hours
  - High patches: <7 days
  - Medium/low patches: next maintenance window
- [ ] Document patch testing
  - Test in staging environment
  - Regression testing
  - Rollback plan
- [ ] Document emergency patching
  - Zero-day vulnerability response
  - Out-of-band patching procedure
  - Communication to stakeholders

**Acceptance Criteria**:
- All 8 runbooks created in `/docs/operations/runbooks/`
- Runbooks reviewed by SRE team
- Runbooks tested (dry-run exercises)
- Runbooks accessible to on-call engineers

**Risk**: Low - Documentation task; requires SME time

---

### Task 3.2: Document Disaster Recovery Plan ❌ VERIFIED NEEDED
**Status**: No DR plan documented
**Priority**: P1 - HIGH (compliance requirement)
**Effort**: 16-24 hours
**Owner**: SRE Lead + Security Specialist

**Current State**:
- ❌ No disaster recovery plan
- ❌ RTO/RPO not defined
- ❌ No DR testing procedures

**Subtasks**:
- [ ] Define disaster scenarios
  - Data center failure
  - Regional outage (AWS/Azure region down)
  - Database corruption
  - Ransomware attack
  - Insider threat (malicious deletion)
- [ ] Define RTO/RPO targets
  - **RTO (Recovery Time Objective)**: <1 hour (time to restore service)
  - **RPO (Recovery Point Objective)**: <15 minutes (acceptable data loss)
- [ ] Document backup strategy
  - Continuous archiving (WAL archiving for PostgreSQL)
  - Full backup: Daily
  - Incremental backup: Hourly
  - Off-site backup: Replicate to different region
  - Backup encryption: AES-256
  - Backup retention: 30 days hot, 1 year cold
- [ ] Document recovery procedures
  - **Scenario 1: Database failure**
    - Restore from most recent backup
    - Replay WAL logs (PITR)
    - Verify data integrity
    - Reconnect applications
  - **Scenario 2: Data center failure**
    - Failover to secondary region
    - Update DNS to point to secondary load balancer
    - Restore database from off-site backup
    - Verify service health
  - **Scenario 3: Ransomware**
    - Isolate infected systems
    - Restore from clean backup (before infection)
    - Scan for malware
    - Reset all credentials
- [ ] Document communication plan
  - Declare disaster (authority: SRE lead or manager)
  - Notify stakeholders (CISO, program manager, users)
  - Status updates every 30 minutes during recovery
  - Post-recovery report
- [ ] Create DR testing schedule
  - Quarterly DR drill (tabletop exercise)
  - Annual full DR test (actual restore in secondary region)
- [ ] Document lessons learned process
  - After each DR test or actual disaster
  - Update DR plan based on findings

**Acceptance Criteria**:
- DR plan documented in `/docs/operations/disaster-recovery.md`
- RTO/RPO defined and approved by stakeholders
- DR procedures tested (tabletop exercise)
- DR plan reviewed annually

**Risk**: Low - Documentation; testing requires coordination

---

### Task 3.3: Conduct Load Testing for 20k-30k Users ❌ VERIFIED NEEDED
**Status**: No load testing evidence
**Priority**: P1 - HIGH (scalability validation)
**Effort**: 16-24 hours
**Owner**: SRE + Backend Engineer

**Current State**:
- ✅ Health check monitoring implemented
- ✅ Metrics tracked (latency, error rate)
- ❌ No load testing performed
- ❌ Performance baselines not established

**Subtasks**:
- [ ] Select load testing tool
  - **Option A**: k6 (scripting in JavaScript, Grafana integration)
  - **Option B**: JMeter (GUI-based, DoD familiar)
  - **Option C**: Gatling (Scala-based, detailed reports)
  - **Recommended**: k6 for ease of use and CI/CD integration
- [ ] Install k6
  ```bash
  brew install k6  # macOS
  # or
  docker pull grafana/k6
  ```
- [ ] Create load test scenarios
  ```javascript
  // tests/load/scenario-read-heavy.js
  import http from 'k6/http';
  import { check, sleep } from 'k6';

  export const options = {
    stages: [
      { duration: '2m', target: 5000 },   // Ramp up to 5k users
      { duration: '5m', target: 5000 },   // Stay at 5k
      { duration: '2m', target: 10000 },  // Ramp to 10k
      { duration: '5m', target: 10000 },  // Stay at 10k
      { duration: '2m', target: 20000 },  // Ramp to 20k
      { duration: '10m', target: 20000 }, // Stay at 20k (target load)
      { duration: '2m', target: 0 },      // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
      http_req_failed: ['rate<0.01'],  // Error rate < 1%
    },
  };

  export default function () {
    const baseUrl = 'https://som-tier0.example.mil/api/v1';

    // Scenario: User queries org chart
    const holonsRes = http.get(`${baseUrl}/holons/Person`, {
      headers: { 'Authorization': 'Bearer ${API_KEY}' }
    });
    check(holonsRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);  // Think time

    // Scenario: User queries relationships
    const relRes = http.get(`${baseUrl}/relationships?type=ReportsTo`);
    check(relRes, { 'status is 200': (r) => r.status === 200 });

    sleep(2);
  }
  ```
- [ ] Create write-heavy scenario (event submission)
  ```javascript
  // tests/load/scenario-write-heavy.js
  export default function () {
    const event = {
      type: 'PersonUpdated',
      occurredAt: new Date().toISOString(),
      actor: `user-${__VU}`,  // Virtual user ID
      subjects: [{ type: 'Person', id: `person-${__VU}` }],
      payload: { name: 'Test User', rank: 'E-5' }
    };

    const res = http.post(`${baseUrl}/events/submit`, JSON.stringify(event), {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` }
    });

    check(res, {
      'status is 201': (r) => r.status === 201,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });
  }
  ```
- [ ] Run load tests
  ```bash
  # Run locally (for small scale)
  k6 run tests/load/scenario-read-heavy.js

  # Run in k6 Cloud (for 20k+ users)
  k6 cloud tests/load/scenario-read-heavy.js
  ```
- [ ] Analyze results
  - Identify bottlenecks (database queries, OPA lookups, state projection)
  - Check resource utilization (CPU, memory, network)
  - Review error logs during load test
- [ ] Optimize based on findings
  - Add database indexes if slow queries detected
  - Increase connection pool size
  - Enable Redis caching (Task 2.3)
  - Scale up/out infrastructure
- [ ] Re-run load tests to verify improvements
- [ ] Document performance baselines
  ```markdown
  ## Performance Baselines (20k concurrent users)

  - Query latency p95: 450ms
  - Query latency p99: 850ms
  - Event submission latency p95: 900ms
  - Error rate: 0.3%
  - CPU utilization (Tier-0): 65%
  - Memory utilization (Tier-0): 55%
  - Database connections: 450/500 max
  ```

**Acceptance Criteria**:
- Load tests run with 20k-30k concurrent users
- p95 latency < 500ms for queries
- p95 latency < 1s for event submission
- Error rate < 1%
- No crashes or OOM errors
- Performance baselines documented

**Risk**: Medium - May reveal performance issues requiring optimization

---

## PHASE 4: COMPLIANCE & CERTIFICATION (Weeks 11-16)
**Goal**: Complete security assessments, STIG compliance, prepare ATO package
**Effort**: 80-120 hours
**Team**: 1 security specialist + 1 compliance officer + 1 SRE + external auditors

### Task 4.1: STIG Compliance Assessment ❌ VERIFIED NEEDED
**Status**: No STIG assessment performed
**Priority**: P0 - CRITICAL (ATO requirement)
**Effort**: 24-32 hours
**Owner**: Security Specialist + Compliance Officer

**Applicable STIGs**:
- Application Security and Development STIG (V5R3)
- Red Hat Enterprise Linux (RHEL) 9 STIG (if using UBI)
- PostgreSQL STIG (V2R5)
- Kubernetes STIG (V1R11)
- Docker Enterprise STIG (V2R2)
- NGINX STIG (if using as load balancer)
- Keycloak: No official STIG; use Application STIG

**Subtasks**:
- [ ] Install STIG scanning tools
  - OpenSCAP (for Linux and container scanning)
  - DISA SCAP Compliance Checker (SCC)
  - Nessus (vulnerability scanning)
- [ ] Scan containers with OpenSCAP
  ```bash
  # Scan Tier-0 container image
  oscap-docker image-cve registry1.dso.mil/som/tier0:latest \
    --report /tmp/som-tier0-cve-report.html

  # Scan against STIG profile
  oscap-docker image registry1.dso.mil/som/tier0:latest \
    xccdf eval \
    --profile xccdf_org.ssgproject.content_profile_stig \
    --report /tmp/som-tier0-stig-report.html \
    /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml
  ```
- [ ] Review STIG findings
  - Categorize: Cat I (high), Cat II (medium), Cat III (low)
  - Prioritize Cat I and Cat II findings
- [ ] Remediate STIG findings
  - Update Dockerfile (remove unnecessary packages, harden configs)
  - Update PostgreSQL configuration (ssl, log settings, etc.)
  - Update Kubernetes configs (pod security standards, network policies)
- [ ] Document STIG compliance
  ```markdown
  # STIG Compliance Report

  ## Application Security STIG (V5R3)
  - Total Checks: 120
  - Passed: 115
  - Failed: 3
  - Not Applicable: 2

  ### Failed Checks:
  1. **V-222542** (Cat II): Application must enforce minimum password complexity
     - Status: Not Applicable (CAC/PIV authentication, no passwords)
     - Justification: System uses DoD PKI certificates, not passwords

  2. **V-222650** (Cat II): Session IDs must be 128-bit
     - Status: OPEN
     - Remediation: Update Keycloak session ID length config
  ```
- [ ] Create STIG checklist (CKL file)
  - Use DISA STIG Viewer to generate .ckl files
  - Document findings, mitigations, justifications
- [ ] Submit STIG checklist to ATO authority

**Acceptance Criteria**:
- All applicable STIGs assessed
- Cat I findings: 0 open
- Cat II findings: <5 open (with approved mitigation plan)
- STIG checklist (.ckl) generated
- STIG compliance report documented

**Risk**: High - May reveal significant compliance gaps; remediation time unpredictable

---

### Task 4.2: Penetration Testing & Red Team Assessment ❌ VERIFIED NEEDED
**Status**: No penetration testing performed
**Priority**: P0 - CRITICAL (ATO requirement)
**Effort**: 40-60 hours (external team) + 20-30 hours (internal remediation)
**Owner**: Security Specialist + External Pen Test Firm

**Subtasks**:
- [ ] Engage DoD-approved penetration testing firm
  - Verify firm has DoD clearances
  - Provide Rules of Engagement (ROE)
  - Schedule testing window (non-production hours preferred)
- [ ] Provide scope to pen testers
  - In-scope: Tier-0 API, Tier-1 apps, Keycloak, OPA
  - Out-of-scope: Infrastructure (AWS, K8s control plane)
  - Test types: Web app testing, API testing, authentication bypass, authorization bypass
- [ ] Conduct penetration test (external firm)
  - OWASP Top 10 testing
  - Authentication/authorization testing
  - Input validation testing
  - Session management testing
  - API security testing
- [ ] Review pen test report
  - Categorize findings by severity (Critical, High, Medium, Low)
  - Prioritize remediation
- [ ] Remediate findings
  - Example: SQL injection found → Use parameterized queries
  - Example: XSS found → Implement Content Security Policy (CSP)
  - Example: IDOR found → Enforce authorization checks
- [ ] Re-test to verify fixes
- [ ] Document pen test results in ATO package

**Common Vulnerabilities to Address**:
- [ ] Injection attacks (SQL, NoSQL, command injection)
- [ ] Broken authentication (weak session management, no MFA)
- [ ] Sensitive data exposure (PII in logs, unencrypted transmission)
- [ ] XML External Entities (XXE)
- [ ] Broken access control (IDOR, privilege escalation)
- [ ] Security misconfiguration (default credentials, verbose errors)
- [ ] Cross-Site Scripting (XSS)
- [ ] Insecure deserialization
- [ ] Using components with known vulnerabilities
- [ ] Insufficient logging and monitoring

**Acceptance Criteria**:
- Penetration test conducted by DoD-approved firm
- Critical and High findings remediated
- Medium findings mitigated or accepted as risk
- Pen test report included in ATO package

**Risk**: High - May reveal critical vulnerabilities; remediation may be time-consuming

---

### Task 4.3: Prepare ATO/C-ATO Package ❌ VERIFIED NEEDED
**Status**: Not started
**Priority**: P0 - CRITICAL
**Effort**: 40-60 hours
**Owner**: Compliance Officer + Security Specialist + SRE Lead

**ATO Package Components** (per RMF/NIST SP 800-37):

#### System Security Plan (SSP)
- [ ] Document system overview
  - Purpose, mission, users
  - System boundary diagram
  - Data flows
- [ ] Document security controls
  - Implemented controls (AC, AU, SC, SI, etc.)
  - Inherited controls (from cloud provider or platform)
  - Control implementation statements
- [ ] Document system architecture
  - Network diagram
  - Container architecture
  - Data flow diagrams
- [ ] Document security requirements
  - FIPS 140-2 compliance
  - CAC/PIV authentication
  - Encryption at rest and in transit
  - Audit logging

#### Security Assessment Plan (SAP)
- [ ] Define assessment scope
- [ ] Define assessment procedures
  - Control testing methodology
  - Penetration testing
  - STIG compliance verification
- [ ] Define roles and responsibilities

#### Security Assessment Report (SAR)
- [ ] Document assessment results
  - Control test results (pass/fail)
  - STIG compliance results
  - Penetration test results
- [ ] Document findings
  - Vulnerabilities discovered
  - Risk ratings
- [ ] Document recommendations
  - Remediation actions
  - Compensating controls

#### Plan of Action and Milestones (POA&M)
- [ ] Document open findings
  - Finding description
  - Severity/risk rating
  - Remediation plan
  - Estimated completion date
  - Responsible party
- [ ] Track milestones
  - Monthly updates to ATO authority

#### Continuous Monitoring Plan
- [ ] Define continuous monitoring strategy
  - Vulnerability scanning frequency (weekly)
  - Configuration compliance checks (daily)
  - Security event monitoring (real-time)
  - Access reviews (quarterly)
- [ ] Define incident response procedures
  - Detection, containment, eradication, recovery
- [ ] Define change management procedures
  - Change approval process
  - Security impact analysis

#### Supporting Documentation
- [ ] Policies and procedures
  - Access control policy
  - Incident response plan
  - Disaster recovery plan
  - Configuration management plan
- [ ] Architecture diagrams
  - Network diagram
  - Data flow diagram
  - Container architecture
- [ ] STIG checklists (.ckl files)
- [ ] Penetration test report
- [ ] Vulnerability scan reports
- [ ] Disaster recovery test results
- [ ] Contingency plan test results

**Subtasks**:
- [ ] Create SSP using NIST template or RMF tool
- [ ] Populate SSP with control implementations
  - Reference code locations (e.g., "AC-3 implemented in /apps/som-tier0/src/access-control/")
  - Include configuration screenshots
- [ ] Create SAP defining test procedures
- [ ] Conduct control testing
- [ ] Create SAR documenting test results
- [ ] Create POA&M for open findings
- [ ] Create Continuous Monitoring Plan
- [ ] Compile all supporting documentation
- [ ] Review package with CISO/ATO authority
- [ ] Submit package to ATO authority

**Acceptance Criteria**:
- Complete ATO package assembled
- All required artifacts included
- Package reviewed by CISO
- Package submitted to ATO authority
- ATO granted (or conditional ATO with POA&M)

**Risk**: High - ATO approval unpredictable; may require multiple iterations

---

### Task 4.4: Implement E2E Tests (Playwright) ❌ VERIFIED NEEDED
**Status**: No E2E tests found
**Priority**: P2 - MEDIUM (quality assurance)
**Effort**: 16-24 hours
**Owner**: QA Engineer + Frontend Engineer

**Current State**:
- ✅ Unit tests (Vitest) - 50 test files
- ✅ Integration tests (api-integration.test.ts, phase2-e2e.test.ts)
- ❌ No browser-based E2E tests

**Subtasks**:
- [ ] Install Playwright
  ```bash
  npm install -D @playwright/test
  npx playwright install  # Install browsers
  ```
- [ ] Create Playwright config
  ```typescript
  // playwright.config.ts
  import { defineConfig, devices } from '@playwright/test';

  export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
      baseURL: 'http://localhost:5173',
      trace: 'on-first-retry',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
    ],
  });
  ```
- [ ] Create E2E test: Org Chart Navigation
  ```typescript
  // tests/e2e/org-chart.spec.ts
  import { test, expect } from '@playwright/test';

  test.describe('Org Chart Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/org-chart');
    });

    test('should display org chart on load', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Organization Chart');
      await expect(page.locator('[data-testid="org-chart-canvas"]')).toBeVisible();
    });

    test('should navigate to person detail on click', async ({ page }) => {
      await page.click('[data-testid="person-card-john-doe"]');
      await expect(page.locator('[data-testid="person-detail"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('John Doe');
    });

    test('should filter by clearance level', async ({ page }) => {
      await page.selectOption('[data-testid="clearance-filter"]', 'Secret');
      await expect(page.locator('[data-testid="person-card"]')).toHaveCount(15);  // Expect only Secret+ users
    });
  });
  ```
- [ ] Create E2E test: How-Do Process Editing
  ```typescript
  // tests/e2e/how-do.spec.ts
  test.describe('How-Do Process Editing', () => {
    test('should create new process', async ({ page }) => {
      await page.goto('/how-do');
      await page.click('[data-testid="new-process-button"]');
      await page.fill('[data-testid="process-name-input"]', 'Test Process');
      await page.click('[data-testid="add-step-button"]');
      await page.fill('[data-testid="step-description"]', 'Step 1: Do something');
      await page.click('[data-testid="save-process-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="process-list"]')).toContainText('Test Process');
    });
  });
  ```
- [ ] Create E2E test: Authentication Flow
  ```typescript
  // tests/e2e/auth.spec.ts
  test.describe('Authentication', () => {
    test('should redirect to login if unauthenticated', async ({ page }) => {
      await page.goto('/org-chart');
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('should allow CAC login', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="cac-login-button"]');
      // Mock CAC authentication (in real test, use test PKI)
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-jwt-token');
      });
      await page.goto('/org-chart');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });
  ```
- [ ] Run E2E tests
  ```bash
  npx playwright test
  npx playwright show-report  # View HTML report
  ```
- [ ] Integrate E2E tests into CI/CD
  ```yaml
  # .github/workflows/ci.yml
  - name: Run E2E Tests
    run: |
      npm run build
      npm run preview &  # Start preview server
      npx playwright test
  ```

**Acceptance Criteria**:
- E2E tests cover critical user flows (auth, org chart, how-do)
- Tests run in CI/CD
- Tests pass in Chrome and Firefox
- Test reports generated (HTML)

**Risk**: Low - Standard implementation

---

## TASK SUMMARY & PRIORITIZATION

### P0 - Critical (Must Complete for IL5/IL6 Deployment)

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| 1.1: Type Safety Remediation | 16-24h | Backend Lead | None |
| 1.2: Fix Silent API Failures | 8-12h | Frontend Lead | None |
| 1.3: CAC/PIV Integration | 24-32h | Security Eng | DoD PKI |
| 1.4: TLS/mTLS | 16-24h | DevOps Lead | Certificates |
| 1.5: FIPS Cryptography | 16-20h | Security Eng | Iron Bank Node.js |
| 1.6: Iron Bank Images | 8-12h | DevOps Lead | Iron Bank Access |
| 2.2: HSM Integration | 24-32h | Security Eng | HSM procurement |
| 4.1: STIG Compliance | 24-32h | Security Specialist | STIG tools |
| 4.2: Penetration Testing | 40-60h | External + Internal | Pen test firm |
| 4.3: ATO Package | 40-60h | Compliance Officer | All other tasks |

**Total P0 Effort**: 216-308 hours

---

### P1 - High (Required for Production Readiness)

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| 2.1: CrunchyData Operator | 20-24h | SRE Lead | K8s cluster |
| 2.4: Explicit Audit Logging | 12-16h | Backend Eng | None |
| 2.6: Centralized Logging | 12-16h | SRE Lead | Log aggregation infra |
| 3.1: Operational Runbooks | 24-32h | SRE + Tech Writer | None |
| 3.2: Disaster Recovery Plan | 16-24h | SRE + Security | None |
| 3.3: Load Testing | 16-24h | SRE + Backend | None |

**Total P1 Effort**: 100-136 hours

---

### P2 - Medium (Recommended for Quality & Scalability)

| Task | Effort | Owner | Dependencies |
|------|--------|-------|--------------|
| 2.3: Distributed Caching (Redis) | 12-16h | Backend Eng | None |
| 2.5: Distributed Tracing | 8-12h | Backend Eng | None |
| 4.4: E2E Tests (Playwright) | 16-24h | QA + Frontend | None |

**Total P2 Effort**: 36-52 hours

---

## TOTAL EFFORT ESTIMATE

| Priority | Effort Range |
|----------|--------------|
| P0 (Critical) | 216-308 hours |
| P1 (High) | 100-136 hours |
| P2 (Medium) | 36-52 hours |
| **TOTAL** | **352-496 hours** |

**Revised Estimate**: 352-496 hours (~9-12 weeks with 4-5 FTE)

---

## GANTT CHART (HIGH LEVEL)

```
Week 1-2: Phase 1 - Critical Security & Code Quality
  [1.1 Type Safety            ████████░░]
  [1.2 Silent Failures        ██████░░░░]
  [1.3 CAC/PIV                ████████████████]
  [1.4 TLS/mTLS               ████████████░░]
  [1.5 FIPS                   ████████████░░]
  [1.6 Iron Bank              ██████░░░░]

Week 3-6: Phase 2 - Infrastructure & Persistence
  [2.1 CrunchyData            ████████████░░░░]
  [2.2 HSM                    ████████████████████]
  [2.3 Redis (optional)       ████████░░]
  [2.4 Audit Logging          ████████░░]
  [2.5 Tracing (optional)     ██████░░]
  [2.6 Centralized Logging    ████████░░]

Week 7-10: Phase 3 - Operational Readiness
  [3.1 Runbooks               ████████████████████████]
  [3.2 DR Plan                ████████████░░]
  [3.3 Load Testing           ████████████░░]

Week 11-16: Phase 4 - Compliance & Certification
  [4.1 STIG Compliance        ████████████████░░]
  [4.2 Pen Testing            ████████████████████████████████]
  [4.3 ATO Package            ████████████████████████████████]
  [4.4 E2E Tests (optional)   ████████████░░]
```

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **DoD PKI access delayed** | Medium | High | Start procurement early; use test PKI for development |
| **HSM procurement takes >4 weeks** | High | High | Use AWS KMS as interim; plan for HSM later |
| **Iron Bank access not granted** | Medium | Critical | Coordinate with CISO week 1; have fallback (hardened UBI) |
| **STIG findings reveal major gaps** | Medium | High | Budget 2 extra weeks for remediation |
| **Pen test reveals critical vulns** | Medium | High | Conduct internal security review first |
| **ATO package rejected** | Low | Critical | Engage ATO authority early for guidance |
| **Load testing reveals perf issues** | Medium | Medium | Implement Redis caching (Task 2.3) |
| **Type safety fixes break features** | Medium | Medium | Comprehensive testing after each fix |

---

## DEPENDENCIES & PREREQUISITES

### External Dependencies
- [ ] DoD PKI access (for CAC/PIV integration)
- [ ] Iron Bank registry access (for compliant container images)
- [ ] HSM procurement (for key management)
- [ ] Kubernetes cluster (staging + production)
- [ ] Penetration testing firm engagement
- [ ] ATO authority engagement
- [ ] CISO/security team collaboration

### Internal Prerequisites
- [ ] PostgreSQL async migration (✅ COMPLETE - Task 1.8 verified)
- [ ] OPA integration (✅ COMPLETE - verified in codebase)
- [ ] Structured logging (✅ COMPLETE - verified in codebase)
- [ ] Docker containerization (✅ COMPLETE - verified in codebase)

---

## SUCCESS CRITERIA

### Phase 1 Success Criteria
- ✅ Zero `any` types in production code
- ✅ All API failures throw typed errors
- ✅ Real CAC/PIV authentication working
- ✅ TLS/mTLS enabled between all services
- ✅ FIPS mode verified
- ✅ All images from Iron Bank

### Phase 2 Success Criteria
- ✅ PostgreSQL 3-node HA cluster deployed
- ✅ HSM integrated for encryption keys
- ✅ Redis caching reduces OPA latency to <50ms
- ✅ All authorization decisions logged to audit trail
- ✅ Distributed tracing with correlation IDs
- ✅ Centralized logging with searchable trace IDs

### Phase 3 Success Criteria
- ✅ All 8 operational runbooks created
- ✅ Disaster recovery plan tested (tabletop exercise)
- ✅ Load testing passes with 20k-30k users (p95 < 500ms)

### Phase 4 Success Criteria
- ✅ STIG compliance: 0 Cat I, <5 Cat II findings
- ✅ Penetration test: Critical/High findings remediated
- ✅ ATO package submitted
- ✅ **ATO/C-ATO GRANTED**

---

## NEXT STEPS

1. **Week 0 (Immediate)**:
   - [ ] Review this plan with stakeholders
   - [ ] Assign task owners
   - [ ] Initiate DoD PKI access request
   - [ ] Initiate Iron Bank access request
   - [ ] Initiate HSM procurement
   - [ ] Engage ATO authority for initial consultation

2. **Week 1 (Start Phase 1)**:
   - [ ] Kick off Task 1.1 (Type Safety)
   - [ ] Kick off Task 1.2 (Silent Failures)
   - [ ] Kick off Task 1.3 (CAC/PIV)
   - [ ] Daily standups to track progress

3. **Week 2 (Continue Phase 1)**:
   - [ ] Complete Tasks 1.1-1.3
   - [ ] Kick off Tasks 1.4-1.6
   - [ ] Weekly stakeholder update

4. **Week 3 (Start Phase 2)**:
   - [ ] Complete Phase 1
   - [ ] Phase 1 retrospective
   - [ ] Kick off Phase 2 tasks
   - [ ] Engage penetration testing firm

5. **Ongoing**:
   - [ ] Weekly project status reports
   - [ ] Bi-weekly risk review
   - [ ] Monthly stakeholder demo
   - [ ] Track all tasks in project management tool (Jira, GitHub Projects, etc.)

---

## APPENDIX: VERIFICATION METHODOLOGY

This project plan was created after comprehensive codebase verification (December 11, 2025). Each task's "VERIFIED NEEDED" or "VERIFIED COMPLETE" status was determined by:

1. **File System Search**: Searched for keywords, patterns, file names
2. **Code Review**: Read implementation files to verify functionality
3. **Configuration Review**: Checked docker-compose.yml, Dockerfile, package.json
4. **Documentation Review**: Read ADRs, architecture docs, guides
5. **Test Coverage Review**: Examined test files for evidence of implementation

**Verification Confidence**: High (direct code inspection performed)

**Last Verified**: December 11, 2025

---

**Document Control**:
- Version: 1.0
- Author: Claude Code (AI Assistant)
- Reviewed By: [Pending]
- Approved By: [Pending]
- Next Review Date: Weekly during execution
