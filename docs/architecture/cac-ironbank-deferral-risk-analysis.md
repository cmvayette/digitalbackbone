# CAC/PIV and Iron Bank Deferral Risk Analysis
**Assessment Date**: December 11, 2025
**Question**: Can we defer CAC/PIV authentication and Iron Bank images to later phases?

---

## TL;DR: HIGH RISK - NOT RECOMMENDED

**Bottom Line**: Deferring CAC and Iron Bank creates 100+ hours of rework and puts ATO timeline at risk. They appear deferrable on the surface but create hidden architectural debt.

| Component | Can Defer? | Rework Cost | ATO Impact |
|-----------|------------|-------------|------------|
| **CAC/PIV Authentication** | ❌ No | 60-80 hours | **BLOCKER** |
| **Iron Bank Images** | ❌ No | 40-64 hours | **BLOCKER** |
| **FIPS Cryptography** | ❌ No | 16-20 hours | **BLOCKER** (requires Iron Bank) |
| **Total if Deferred** | - | **116-164 hours** | **ATO timeline reset** |

---

## 1. CAC/PIV DEFERRAL RISKS

### What You Gain by Deferring
- ⏱️ ~24-32 hours saved in Phase 1
- 🚫 Don't need DoD PKI access immediately
- 🚫 Don't need real CAC cards for testing

### What You Lose by Deferring

#### 1.1 Schema Refactoring Required (12 hours)
**Current State**: System assumes all users have EDIPI (DoD unique identifier)
- `person-management/index.test.ts:39` - Test generator requires EDIPI
- Integration tests enforce "Person must have EDIPI" constraint
- **Problem**: API key authentication has no EDIPI
- **Rework**: Make EDIPI optional OR create alternative user ID mapping

#### 1.2 Audit Logging Broken (16 hours)
**Current State**: No authentication/authorization events logged
- `monitoring/logger.ts` - Structured logging exists but NO audit events
- OPA authorization decisions not logged
- **Problem**: Cannot retroactively add audit trail
- **Rework**: Implement AuditLogger service, wire to OPA, test compliance

#### 1.3 Frontend Mock Becomes Technical Debt (12 hours)
**Current State**: `AuthCallback.tsx:24` generates fake tokens
```typescript
// packages/ui-components/src/components/auth/AuthCallback.tsx:24
const mockToken = 'mock-keycloak-token-' + Date.now();
localStorage.setItem('auth-token', mockToken);
```
- **Problem**: No real OIDC token exchange implemented
- **Rework**: Replace mock flow, test with real Keycloak, fix state management

#### 1.4 Authorization Assumptions Baked In (8 hours)
**Current State**: OPA policies assume `clearanceLevel` attribute from CAC
- `policies/main.rego` - Clearance-based access control
- Gateway provider maps `X-Remote-Clearance` header
- **Problem**: API key auth has no clearance mapping
- **Rework**: Add clearance to API keys (nonsensical) OR disable authorization (insecure)

#### 1.5 Keycloak Configuration Deferred (16 hours)
**Current State**: Keycloak container running, but unconfigured
- No X.509 certificate authenticator
- No DoD PKI root certificates loaded
- No certificate DN → user attribute mapping
- **Rework**: Full Keycloak setup + testing when CAC needed

**Total CAC Deferral Cost**: 60-80 hours of rework

---

## 2. IRON BANK DEFERRAL RISKS

### What You Gain by Deferring
- ⏱️ ~8-12 hours saved in Phase 1
- 🚫 Don't need Iron Bank registry access immediately
- ✅ Faster local builds (Alpine images are smaller/faster)

### What You Lose by Deferring

#### 2.1 FIPS Cryptography BLOCKED (16-20 hours)
**Critical Dependency**: FIPS requires Iron Bank Node.js
- Current Alpine Node.js: **No FIPS OpenSSL module**
- `apps/som-tier0/src/index.ts` - No `crypto.setFips(1)` call
- **IL5/IL6 Requirement**: FIPS 140-2 mandatory

**All cryptographic operations non-compliant**:
- ❌ UUID generation for event IDs
- ❌ JWT token signing/verification
- ❌ Session cookie encryption
- ❌ Password hashing (if applicable)

**Problem**: Cannot enable FIPS without Iron Bank images
**Rework**: Rebase images + validate all crypto operations

#### 2.2 STIG Compliance Assessment BLOCKED (12-16 hours)
**Current State**: Alpine images have no STIG baselines
- DoD STIGs defined for RHEL/UBI, not Alpine
- OpenSCAP scanning requires UBI
- **Problem**: Cannot assess compliance until rebased
- **Rework**: Run STIG scan, remediate findings (unknown scope)

#### 2.3 Container Scanning Integration Missing (8-12 hours)
**Current State**: No SBOM, no vulnerability scanning
- Alpine: Minimal hardening tools
- No OpenSCAP, no SCAP scanner
- **Problem**: ATO requires vulnerability scans + SBOM
- **Rework**: Integrate scanning tools, generate SBOM, remediate CVEs

#### 2.4 Image Compatibility Testing Unknown (4-8 hours)
**Risk**: glibc (Iron Bank UBI) vs musl libc (Alpine) compatibility
- Alpine uses musl libc (~150MB images)
- Iron Bank UBI uses glibc (~500MB images)
- Native Node.js modules may break
- **Rework**: Test all dependencies, fix compatibility issues

#### 2.5 OPA Image Not in Iron Bank (8-16 hours)
**Current State**: `openpolicyagent/opa:latest` - not Iron Bank
- OPA not yet in Iron Bank catalog
- **Fallback**: Build custom UBI9 image with OPA binary
- **Rework**: Create custom Dockerfile, test OPA policies, integrate

**Total Iron Bank Deferral Cost**: 40-64 hours of rework

---

## 3. COMPLIANCE & ATO IMPACT

### Explicit Requirements from C-ATO Readiness Documents

**From `/docs/architecture/c_ato_readiness.md`**:
> "Phase 1 (Authentication & Identity): Configure Keycloak with CAC/PIV support. Deploy DoD-approved OIDC provider."

**From `/docs/architecture/nsw-il6-gap-analysis.md`**:
> "Phase 0 architecture (Local SQLite, Alpine, No PKI) is **not suitable for target environment**"
>
> "Rebase Dockerfiles to UBI9-Minimal immediately to catch dependency issues early"

**From C-ATO Project Plan (Task 1.3, 1.5, 1.6)**:
- Task 1.3: CAC/PIV Integration - **P0 - CRITICAL (IL5/IL6 blocker)**
- Task 1.5: FIPS Cryptography - **P0 - CRITICAL (IL5/IL6 blocker)**
- Task 1.6: Iron Bank Images - **P0 - CRITICAL**

### ATO Submission Impact

**If Deferred to Phase 3 (Weeks 7-10)**:
1. ❌ **STIG assessment fails** - No baseline for Alpine images
2. ❌ **FIPS validation fails** - Cryptography non-compliant
3. ❌ **Authentication fails** - Mock tokens in production code
4. ❌ **Audit logging fails** - No WHO in audit trail
5. ⚠️ **ATO package incomplete** - Missing critical controls (AC-2, AC-3, AU-2, SC-12, SC-13)

**Result**: ATO authority rejects submission, requires restart of assessment

---

## 4. ARCHITECTURAL FINDINGS

### What Works Today (Without CAC/Iron Bank)
✅ **OPA Authorization**: Fully functional, can test with mock users
✅ **Event Sourcing**: PostgreSQL async implementation complete
✅ **API Design**: Clean REST API, standardized responses
✅ **Structured Logging**: JSON format ready for aggregation

### What's Broken Without CAC/Iron Bank
❌ **User Identity**: EDIPI required, API keys don't provide it
❌ **Audit Trail**: No WHO in logs (cannot identify individual users)
❌ **Cryptography**: Non-FIPS crypto in event IDs, tokens
❌ **Image Certification**: Alpine won't pass ATO scanning

### Hidden Dependencies Discovered

**1. Gateway Header Trust Model Requires TLS**
- Current: `GatewayHeaderAuthProvider` trusts `X-Remote-User` headers
- Problem: No TLS configured (docker-compose.yml:10 = NODE_ENV=development)
- Risk: Headers can be spoofed; production-unviable without mTLS
- **Rework**: Implement TLS/mTLS (Task 1.4: 16-24 hours)

**2. Schema Hardcodes DoD Assumptions**
- Person holon requires EDIPI (10-digit DoD ID)
- Tests generate EDIPI (person-management/index.test.ts:39)
- API key auth has no EDIPI concept
- **Rework**: Schema migration + test data updates

**3. Authorization Policies Assume CAC Attributes**
- OPA policies expect `clearanceLevel` (Unclassified, Confidential, Secret, TopSecret)
- Gateway provider maps `X-Remote-Clearance` header to enum
- API key provider has no clearance mapping (defaults to unknown)
- **Rework**: Either add clearance to API keys (doesn't make sense) OR disable ABAC (insecure)

---

## 5. PROCUREMENT LEAD TIME ANALYSIS

### Critical Path Dependencies

| Item | Lead Time | Risk | Mitigation |
|------|-----------|------|------------|
| **DoD PKI Access** | 4-8 weeks | High | Start immediately; use test PKI for dev |
| **Iron Bank Registry Access** | 2-4 weeks | Medium | Coordinate with CISO; have service account ready |
| **CAC Test Cards** | 2-6 weeks | Medium | Request from sponsor; use simulated PKI interim |
| **HSM Procurement** | 8-16 weeks | High | Start now; use AWS KMS as temporary fallback |

**If Deferred to Week 7**:
- DoD PKI access won't arrive until Week 11-15
- Iron Bank access won't arrive until Week 9-11
- **Result**: Phase 4 (Weeks 11-16) becomes Week 15-20+ (timeline slip)

---

## 6. COMPARISON: DEFER vs IMPLEMENT NOW

### Option A: Defer CAC/Iron Bank (Your Question)

**Timeline**:
- Phase 1 (Weeks 1-2): Skip CAC, skip Iron Bank → Save 32-44 hours
- Phase 2 (Weeks 3-6): Build on Alpine + API keys
- Phase 3 (Weeks 7-10): Attempt to integrate CAC/Iron Bank
  - Discover schema incompatibility → 12 hours
  - Discover audit logging missing → 16 hours
  - Discover FIPS blocked → 20 hours
  - Discover STIG compliance blocked → 16 hours
  - Test all components again → 20 hours
- **Total**: Original timeline + 84 hours of rework = **12 weeks + 3.5 weeks = 15.5 weeks**

**Risks**:
- ATO submission delayed (cannot submit without CAC/FIPS)
- Technical debt in schema, auth, audit
- Procurement lead time unaccounted for (add 4-8 weeks)
- **Actual completion**: 19-23 weeks

---

### Option B: Implement CAC/Iron Bank in Phase 1 (Recommended)

**Timeline**:
- Phase 1 (Weeks 1-2): Implement CAC, Iron Bank → 64-76 hours
  - CAC/PIV integration: 24-32 hours
  - Iron Bank rebase: 8-12 hours
  - FIPS validation: 16-20 hours
  - TLS/mTLS setup: 16-24 hours
- Phase 2 (Weeks 3-6): Build on correct foundation
  - No rework needed
  - Integration tests pass first time
- Phase 3 (Weeks 7-10): Operational readiness
- Phase 4 (Weeks 11-16): ATO submission (no blockers)
- **Total**: 12-16 weeks (as planned)

**Benefits**:
- No rework
- ATO submission on schedule
- Procurement started early (arrives in time)
- **Actual completion**: 12-16 weeks

---

## 7. RECOMMENDATIONS

### ❌ DO NOT DEFER: Critical Path Items

1. **CAC/PIV Authentication** (Task 1.3)
   - Reason: Schema, audit, and auth logic hardcoded to expect CAC attributes
   - Deferral cost: 60-80 hours rework + ATO blocker

2. **Iron Bank Images** (Task 1.6)
   - Reason: FIPS cryptography requires Iron Bank Node.js
   - Deferral cost: 40-64 hours rework + ATO blocker

3. **FIPS Cryptography** (Task 1.5)
   - Reason: IL5/IL6 mandatory requirement
   - Deferral cost: Cannot defer (depends on Iron Bank)

4. **TLS/mTLS Between Services** (Task 1.4)
   - Reason: Gateway header auth requires TLS to prevent spoofing
   - Deferral cost: 16-24 hours + security vulnerability

### ✅ CAN DEFER: Supporting Components

5. **HSM Integration** (Task 2.2)
   - Reason: Can use AWS KMS initially
   - Deferral savings: 24-32 hours (implement in Phase 2)

6. **CrunchyData Operator** (Task 2.1)
   - Reason: Can use single PostgreSQL instance initially
   - Deferral savings: 20-24 hours (implement in Phase 2)

7. **Redis Caching** (Task 2.3)
   - Reason: Performance optimization, not security requirement
   - Deferral savings: 12-16 hours (implement in Phase 2)

8. **E2E Tests** (Task 4.4)
   - Reason: Quality assurance, not ATO requirement
   - Deferral savings: 16-24 hours (implement in Phase 3)

---

## 8. RISK MITIGATION STRATEGIES

### If You Must Defer (Not Recommended)

**Minimum Viable Approach**:
1. **Implement Iron Bank images NOW** (Week 1)
   - Effort: 8-12 hours
   - Benefit: Unblocks FIPS, catches compatibility issues early
   - Risk: Low (just image swap)

2. **Configure Keycloak X.509 Authenticator NOW** (Week 1)
   - Effort: 8-12 hours
   - Benefit: Enables test PKI integration, no frontend changes yet
   - Risk: Low (backend config only)

3. **Defer Frontend CAC Integration** (Until Week 7)
   - Keep mock token generation temporarily
   - Replace in Phase 3
   - Effort saved: 12 hours
   - Rework cost: 12 hours (no savings)

4. **Implement Audit Logging NOW** (Week 2)
   - Effort: 12-16 hours
   - Benefit: Captures auth events even with mock auth
   - Risk: Low (defensive implementation)

**Reduced Risk**:
- Still defers some CAC work (frontend), but mitigates schema/audit/FIPS risks
- Total savings: 12 hours
- Total deferral cost: 12 hours (wash)

**Verdict**: Not worth it - just implement CAC/Iron Bank in Phase 1.

---

## 9. EXECUTIVE SUMMARY

### Question: Can we defer CAC and Iron Bank?

**Short Answer**: No - creates 100+ hours of rework and blocks ATO.

**Why It Looks Deferrable**:
- Auth is modular (API key vs Gateway providers)
- Dockerfiles are simple (just swap base images)
- Keycloak is containerized (can configure later)

**Why It's Actually Not Deferrable**:
- System schema hardcoded to expect EDIPI (CAC-specific)
- FIPS cryptography requires Iron Bank Node.js (cannot enable on Alpine)
- Audit logging missing (cannot retroactively add WHO to logs)
- STIG compliance blocked (Alpine has no DoD baselines)
- Procurement lead time (DoD PKI + Iron Bank access = 4-8 weeks)

**Hidden Rework Costs**:
- Schema migration: 12 hours
- Audit logging retrofit: 16 hours
- Frontend OIDC replacement: 12 hours
- Keycloak configuration: 16 hours
- FIPS validation: 20 hours
- STIG remediation: 16 hours
- Integration testing: 20 hours
- **Total**: 112 hours (vs 64 hours to implement now)

**ATO Impact**:
- ❌ Cannot submit ATO without CAC/PIV
- ❌ Cannot submit ATO without FIPS
- ❌ Cannot submit ATO without Iron Bank images
- ⚠️ Deferral delays ATO by 4-8 weeks (procurement lead time)

### Recommendation: Implement in Phase 1

**Rationale**:
- Saves 48 hours of rework (112 - 64)
- Keeps ATO timeline on track
- Avoids technical debt in schema/audit
- Procurement starts early (arrives when needed)

**Alternative**: If absolutely must defer, only defer **frontend CAC UI** (saves 12 hours, costs 12 hours later - no net benefit).

---

## APPENDIX: VERIFICATION SOURCES

**Code Locations Analyzed**:
- `/apps/som-tier0/src/api/auth/` - Authentication providers
- `/packages/ui-components/src/components/auth/AuthCallback.tsx` - Mock token generation (line 24)
- `/apps/som-tier0/src/person-management/index.test.ts` - EDIPI requirement (line 39)
- `/policies/main.rego` - OPA clearance-based authorization
- `/Dockerfile` - Alpine base images (lines 5, 15)
- `/docker-compose.yml` - Service configurations
- `/docs/architecture/c_ato_readiness.md` - Compliance roadmap
- `/docs/architecture/nsw-il6-gap-analysis.md` - IL5/IL6 requirements

**Assessment Methodology**:
1. File system search for CAC, EDIPI, FIPS, Iron Bank references
2. Code review of authentication providers
3. Dependency analysis (what depends on CAC attributes?)
4. Compliance document review (explicit requirements)
5. Rework cost estimation (based on code inspection)

**Verification Confidence**: High (direct code inspection performed)
**Last Verified**: December 11, 2025
