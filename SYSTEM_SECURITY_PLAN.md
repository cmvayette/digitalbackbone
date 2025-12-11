# System Security Plan (SSP)
## Digital Backbone - SOM Tier-0
**Version:** 0.1.0
**Classification:** UNCLASSIFIED
**Impact Level:** IL4/IL5
**Date:** December 10, 2025
**Status:** DRAFT

---

## 1. SYSTEM IDENTIFICATION

### 1.1 System Name
**Digital Backbone - System of Management (SOM) Tier-0**

### 1.2 System Categorization
- **Impact Level:** IL4/IL5 (DoD Cloud Computing SRG)
- **Confidentiality:** MODERATE
- **Integrity:** MODERATE
- **Availability:** LOW

### 1.3 System Owner
- **Organization:** [Your Organization]
- **Owner Name:** [System Owner Name]
- **Email:** [owner@your-domain.mil]

### 1.4 Information System Security Manager (ISSM)
- **Name:** [ISSM Name]
- **Email:** [issm@your-domain.mil]
- **Phone:** [Contact Number]

### 1.5 Authorizing Official (AO)
- **Name:** [AO Name]
- **Email:** [ao@your-domain.mil]

---

## 2. SYSTEM DESCRIPTION

### 2.1 Purpose
The Digital Backbone provides a unified, event-sourced system of record for managing organizational holons (entities) including personnel, organizations, missions, tasks, and policies with full temporal query capabilities and audit trails.

### 2.2 System Boundary
**Included Components:**
- SOM Tier-0 Core API (Node.js/Hono)
- Event Store (SQLite)
- Frontend Applications (React)
  - Policy Governance UI
  - Task Management UI
  - Objectives/OKR UI
  - Organization Chart UI

**Excluded Components:**
- External authentication provider (CAC/PIV)
- External SIEM (Splunk)
- External secret management (Vault)
- Infrastructure (handled by platform team)

### 2.3 System Environment
- **Development:** Local development environments
- **Staging:** Pre-production testing environment
- **Production:** [Production environment details]

### 2.4 System Architecture
```
┌─────────────┐         ┌──────────────┐
│   Browser   │────────▶│  Frontend    │
│   (User)    │◀────────│  (React)     │
└─────────────┘         └──────────────┘
                               │
                               │ HTTPS
                               ▼
                        ┌──────────────┐
                        │ SOM Tier-0   │
                        │ API Server   │
                        │ (Hono)       │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Event Store  │
                        │ (SQLite)     │
                        └──────────────┘
```

---

## 3. SECURITY CONTROLS IMPLEMENTATION

### 3.1 Access Control (AC) Family

#### AC-2: Account Management
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- User authentication via API keys (development)
- CAC/PIV integration points ready for production
- Role-based access control (RBAC)
  - Administrator
  - Data Submitter
  - Schema Designer
  - Governance Officer
  - System Integrator
  - Viewer

**Evidence:**
- `apps/som-tier0/src/access-control/index.ts`
- `apps/som-tier0/src/api/auth/api-key-provider.ts`
- `apps/som-tier0/src/api/auth/gateway-provider.ts`

#### AC-3: Access Enforcement
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- Authorization middleware enforces permissions
- Access control decisions logged in audit trail
- Query results filtered based on user context

**Evidence:**
- `apps/som-tier0/src/api/middleware.ts:80-169` (AuthorizationMiddleware)
- `apps/som-tier0/src/access-control/index.ts`

#### AC-7: Unsuccessful Logon Attempts
**Implementation Status:** 🔄 PLANNED

**Control Implementation:**
- Account lockout after N failed attempts (to be implemented)
- Failed authentication events logged in audit trail

**Planned Implementation:**
- Track failed login attempts per user
- Implement exponential backoff
- Alert on repeated failures

---

### 3.2 Audit and Accountability (AU) Family

#### AU-2: Audit Events
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- Comprehensive audit logging middleware
- All security-relevant events captured:
  - Authentication (AUTH)
  - Authorization (AUTHZ)
  - Create/Read/Update/Delete (CRUD)
  - Export operations
  - Administrative actions
  - Configuration changes

**Evidence:**
- `apps/som-tier0/src/api/middleware/audit-logger.ts`
- Server integration: `apps/som-tier0/src/server.ts:45-49`

#### AU-3: Content of Audit Records
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
Audit logs include all required fields per NIST 800-53:
- Unique event ID
- Timestamp (ISO 8601)
- User identity
- Event type
- Event outcome (SUCCESS/FAILURE/DENIED)
- Resource type and ID
- Source IP address
- User agent
- Request ID for correlation

**Evidence:**
- `apps/som-tier0/src/api/middleware/audit-logger.ts:29-65` (AuditLog interface)

#### AU-9: Protection of Audit Information
**Implementation Status:** 🔄 PLANNED

**Planned Implementation:**
- Append-only audit log files
- Separate audit log storage
- Regular backup of audit logs
- Integration with SIEM for centralized collection

---

### 3.3 Identification and Authentication (IA) Family

#### IA-2: Identification and Authentication
**Implementation Status:** 🔄 PARTIAL

**Control Implementation:**
- API key authentication (development)
- JWT token-based sessions
- CAC/PIV integration points ready

**Evidence:**
- `apps/som-tier0/src/api/auth/auth-types.ts`
- `apps/som-tier0/src/api/auth/api-key-provider.ts`
- `apps/som-tier0/src/api/auth/gateway-provider.ts`

**Planned Enhancements:**
- Multi-factor authentication (MFA)
- CAC/PIV card integration for production
- Session timeout enforcement (15 minutes DoD standard)

#### IA-5: Authenticator Management
**Implementation Status:** 🔄 PLANNED

**Planned Implementation:**
- Secure password storage (bcrypt/argon2)
- Password complexity requirements
- Regular credential rotation (90 days)
- Secure API key generation and storage

---

### 3.4 System and Communications Protection (SC) Family

#### SC-7: Boundary Protection
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- CORS policies enforced
- Rate limiting (100 requests/minute default)
- API gateway pattern
- Security headers prevent clickjacking

**Evidence:**
- `apps/som-tier0/src/server.ts:60-68` (CORS configuration)
- `apps/som-tier0/src/api/middleware.ts:328-375` (RateLimitMiddleware)
- `apps/som-tier0/src/api/middleware/security-headers.ts`

#### SC-8: Transmission Confidentiality
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- HTTPS enforcement via HSTS headers
- TLS 1.3 requirement (configurable)
- Strict-Transport-Security header with preload

**Evidence:**
- `apps/som-tier0/src/api/middleware/security-headers.ts:56-68`
- `.env.example:TLS_MIN_VERSION=TLSv1.3`

#### SC-13: Cryptographic Protection
**Implementation Status:** 🔄 PARTIAL

**Control Implementation:**
- TLS 1.3 for data in transit
- Secure random ID generation (crypto.randomUUID)

**Planned Enhancements:**
- AES-256 for data at rest
- Secure key management
- No hardcoded secrets (environment variables only)

---

### 3.5 System and Information Integrity (SI) Family

#### SI-3: Malicious Code Protection
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- Content Security Policy (CSP) headers
- Input validation and sanitization
- XSS prevention patterns
- Output encoding

**Evidence:**
- `apps/som-tier0/src/api/middleware/security-headers.ts:73-101` (CSP)
- `apps/som-tier0/src/api/middleware/input-validation.ts:27-40` (XSS detection)

#### SI-10: Information Input Validation
**Implementation Status:** ✅ IMPLEMENTED

**Control Implementation:**
- Server-side validation for all inputs
- Zod schema validation
- XSS detection and prevention
- SQL injection prevention (parameterized queries)
- Path traversal detection
- File upload restrictions

**Evidence:**
- `apps/som-tier0/src/api/middleware/input-validation.ts`
- Request validation middleware

---

## 4. SECURITY CONTROL SUMMARY

### 4.1 Control Implementation Status

| Control Family | Total | Implemented | Partial | Planned | N/A |
|----------------|-------|-------------|---------|---------|-----|
| AC (Access Control) | 3 | 2 | 0 | 1 | 0 |
| AU (Audit) | 3 | 2 | 0 | 1 | 0 |
| IA (Identification) | 2 | 0 | 2 | 0 | 0 |
| SC (Communications) | 3 | 2 | 1 | 0 | 0 |
| SI (Integrity) | 2 | 2 | 0 | 0 | 0 |
| **TOTAL** | **13** | **8** | **3** | **2** | **0** |

**Overall Implementation:** 62% Complete (8/13)

---

## 5. RISK ASSESSMENT

### 5.1 Known Vulnerabilities

1. **Session Management**
   - **Risk:** No session timeout enforcement
   - **Impact:** MEDIUM
   - **Mitigation:** Implement JWT expiration and refresh token rotation
   - **Timeline:** Sprint 2

2. **Failed Login Tracking**
   - **Risk:** No account lockout after failed attempts
   - **Impact:** MEDIUM
   - **Mitigation:** Implement failed login counter with exponential backoff
   - **Timeline:** Sprint 2

3. **Encryption at Rest**
   - **Risk:** Database not encrypted
   - **Impact:** LOW (development only)
   - **Mitigation:** Enable SQLite encryption extension for production
   - **Timeline:** Before production deployment

---

## 6. CONTINUOUS MONITORING

### 6.1 Security Monitoring Activities

- **Audit Log Review:** Daily (automated)
- **Vulnerability Scanning:** Weekly
- **Penetration Testing:** Quarterly
- **Security Updates:** Within 30 days of availability
- **Access Review:** Monthly
- **Incident Response Testing:** Semi-annually

### 6.2 Security Metrics

- Authentication success/failure rate
- Authorization denial rate
- Average request processing time
- Audit log volume
- Failed login attempts
- Security header compliance

---

## 7. INCIDENT RESPONSE

### 7.1 Incident Response Team
- **ISSM:** [Name, Contact]
- **System Owner:** [Name, Contact]
- **Development Lead:** [Name, Contact]

### 7.2 Incident Response Procedures
1. **Detection:** Automated alerts via SIEM
2. **Analysis:** Review audit logs and system metrics
3. **Containment:** Isolate affected systems
4. **Eradication:** Remove threat
5. **Recovery:** Restore normal operations
6. **Lessons Learned:** Post-incident review

---

## 8. DOCUMENTATION REFERENCES

- NIST SP 800-53 Rev 5: Security and Privacy Controls
- DoD Cloud Computing SRG v2r1
- DISA STIG: Application Security and Development
- CNSSI 1253: Security Categorization
- RMF Knowledge Service

---

## 9. PLAN APPROVAL

### 9.1 Approval Authority

| Role | Name | Signature | Date |
|------|------|-----------|------|
| System Owner | | | |
| ISSM | | | |
| Authorizing Official | | | |

---

## APPENDIX A: SECURITY CONTROL TRACEABILITY MATRIX

| Control ID | Control Name | Status | Implementation File(s) |
|-----------|--------------|--------|------------------------|
| AC-2 | Account Management | ✅ | `src/access-control/index.ts` |
| AC-3 | Access Enforcement | ✅ | `src/api/middleware.ts` |
| AC-7 | Unsuccessful Logon | 🔄 | TBD |
| AU-2 | Audit Events | ✅ | `src/api/middleware/audit-logger.ts` |
| AU-3 | Audit Content | ✅ | `src/api/middleware/audit-logger.ts` |
| AU-9 | Audit Protection | 🔄 | TBD |
| IA-2 | Identification/Auth | 🔄 | `src/api/auth/` |
| IA-5 | Authenticator Mgmt | 🔄 | TBD |
| SC-7 | Boundary Protection | ✅ | `src/api/middleware/security-headers.ts` |
| SC-8 | Transmission Confidentiality | ✅ | `src/api/middleware/security-headers.ts` |
| SC-13 | Cryptographic Protection | 🔄 | TBD |
| SI-3 | Malicious Code | ✅ | `src/api/middleware/input-validation.ts` |
| SI-10 | Input Validation | ✅ | `src/api/middleware/input-validation.ts` |

---

**Document Control:**
- **Version:** 0.1.0
- **Last Updated:** December 10, 2025
- **Next Review:** January 10, 2026
- **Classification:** UNCLASSIFIED
- **Distribution:** Authorized Personnel Only
