# C-ATO Security Roadmap
**Digital Backbone Repository**
**Target:** DoD Continuous Authority to Operate (C-ATO)
**Classification Level:** IL4/IL5 (Impact Level)
**Date:** December 10, 2025

---

## Executive Summary

This roadmap outlines the path to achieve C-ATO compliance for the Digital Backbone system, focusing on NIST 800-53 controls that can be implemented at the application level without requiring Iron Bank containers or infrastructure-level changes.

---

## 1. SECURITY CONTROLS MATRIX

### ✅ COMPLETED (Already Implemented)
- **Error Handling**: Graceful error boundaries preventing information disclosure
- **Type Safety**: Full TypeScript strict mode eliminating entire classes of vulnerabilities
- **Code Quality**: Zero linting errors, proper code review practices
- **Accessibility**: WCAG 2.1 AA compliance (required for Section 508)

### 🔄 IN PROGRESS (Current Sprint)

#### AC (Access Control) Family
- [ ] **AC-2**: Account Management
  - Implement user authentication framework
  - Role-based access control (RBAC)
  - Session management with timeouts

- [ ] **AC-7**: Unsuccessful Logon Attempts
  - Account lockout after failed attempts
  - Audit logging of authentication events

#### AU (Audit and Accountability) Family
- [ ] **AU-2**: Audit Events
  - Comprehensive audit logging framework
  - Security-relevant events capture
  - Tamper-evident logging

- [ ] **AU-3**: Content of Audit Records
  - User identity, timestamp, event type, outcome
  - Source/destination, object identifiers

#### IA (Identification and Authentication) Family
- [ ] **IA-2**: Identification and Authentication
  - Multi-factor authentication (MFA) ready
  - CAC/PIV card integration points
  - Session token management

- [ ] **IA-5**: Authenticator Management
  - Secure password storage (bcrypt/argon2)
  - Password complexity requirements
  - Credential lifecycle management

#### SC (System and Communications Protection) Family
- [ ] **SC-7**: Boundary Protection
  - CORS policies
  - API gateway patterns
  - Rate limiting

- [ ] **SC-8**: Transmission Confidentiality
  - HTTPS enforcement
  - TLS 1.3 requirement
  - HSTS headers

- [ ] **SC-13**: Cryptographic Protection
  - Strong encryption (AES-256)
  - Secure key management patterns
  - No hardcoded secrets

#### SI (System and Information Integrity) Family
- [ ] **SI-3**: Malicious Code Protection
  - Input validation/sanitization
  - Content Security Policy (CSP)
  - XSS prevention

- [ ] **SI-10**: Information Input Validation
  - Server-side validation for all inputs
  - Parameterized queries
  - File upload restrictions

---

## 2. CRITICAL SECURITY IMPLEMENTATIONS

### Priority 1: Immediate (This Sprint)

#### A. Security Headers (NIST SC-8, SC-7)
```typescript
// Express middleware for security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://localhost:*"
  );

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  next();
});
```

#### B. Input Validation Framework (NIST SI-10)
```typescript
// Zod validation schemas for all API inputs
import { z } from 'zod';

export const PolicyInputSchema = z.object({
  title: z.string()
    .min(1, "Title required")
    .max(200, "Title too long")
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, "Invalid characters"),

  content: z.string()
    .max(50000, "Content too large")
    .refine(val => !containsXSS(val), "Potential XSS detected"),

  documentType: z.enum(['Policy', 'Instruction', 'SOP']),

  version: z.string()
    .regex(/^\d+\.\d+(\.\d+)?$/, "Invalid version format")
});

// SQL injection prevention
export const sanitizeSQL = (input: string): string => {
  // Use parameterized queries - never string concatenation
  // This function is a placeholder - actual prevention is query-level
  return input.replace(/['";\\]/g, '');
};

// XSS prevention
export const sanitizeHTML = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
```

#### C. Audit Logging (NIST AU-2, AU-3)
```typescript
// Structured audit logging
export interface AuditLog {
  timestamp: string;
  userId: string;
  userRole: string;
  eventType: 'AUTH' | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';
  eventStatus: 'SUCCESS' | 'FAILURE';
  resourceType: string;
  resourceId?: string;
  sourceIP: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

export const auditLogger = {
  log: (event: AuditLog) => {
    // Write to secure, append-only log
    // Never log sensitive data (passwords, SSNs, etc.)
    console.log(JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      severity: getSeverity(event.eventType, event.eventStatus)
    }));

    // Send to SIEM/log aggregator for C-ATO compliance
    // sendToSplunk(event);
  }
};

// Usage example
auditLogger.log({
  userId: currentUser.id,
  userRole: currentUser.role,
  eventType: 'CREATE',
  eventStatus: 'SUCCESS',
  resourceType: 'Policy',
  resourceId: newPolicy.id,
  sourceIP: req.ip,
  userAgent: req.headers['user-agent']
});
```

#### D. Authentication Framework (NIST IA-2, IA-5)
```typescript
// JWT-based authentication with CAC integration points
export interface AuthConfig {
  enableCAC: boolean;
  enablePIV: boolean;
  sessionTimeout: number; // 15 minutes DoD standard
  maxSessionDuration: number; // 8 hours
  mfaRequired: boolean;
}

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    auditLogger.log({
      eventType: 'AUTH',
      eventStatus: 'FAILURE',
      details: { reason: 'No token provided' }
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = verifyJWT(token);

    // Check session timeout (15 min inactivity)
    if (Date.now() - decoded.lastActivity > 15 * 60 * 1000) {
      throw new Error('Session timeout');
    }

    // Check max session duration (8 hours)
    if (Date.now() - decoded.loginTime > 8 * 60 * 60 * 1000) {
      throw new Error('Max session duration exceeded');
    }

    req.user = decoded;
    next();
  } catch (error) {
    auditLogger.log({
      eventType: 'AUTH',
      eventStatus: 'FAILURE',
      details: { error: error.message }
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 3. NIST 800-53 CONTROL MAPPING

### High Priority Controls (IL4/IL5)

| Control | Name | Implementation | Status |
|---------|------|----------------|--------|
| **AC-2** | Account Management | User CRUD, RBAC, session mgmt | 🔄 In Progress |
| **AC-3** | Access Enforcement | RBAC middleware, permission checks | 🔄 In Progress |
| **AC-7** | Unsuccessful Logon | Failed attempt counter, lockout | 📋 Planned |
| **AU-2** | Audit Events | Comprehensive logging framework | 🔄 In Progress |
| **AU-3** | Audit Content | Structured logs with required fields | 🔄 In Progress |
| **AU-9** | Audit Protection | Append-only logs, integrity checks | 📋 Planned |
| **IA-2** | Identification/Auth | JWT, CAC integration points | 🔄 In Progress |
| **IA-5** | Authenticator Mgmt | Password policy, secure storage | 📋 Planned |
| **SC-7** | Boundary Protection | CORS, rate limiting, API gateway | 🔄 In Progress |
| **SC-8** | Transmission Confidentiality | HTTPS, TLS 1.3, HSTS | 🔄 In Progress |
| **SC-13** | Cryptographic Protection | AES-256, secure key mgmt | 📋 Planned |
| **SI-3** | Malicious Code | CSP, input validation, XSS prevention | 🔄 In Progress |
| **SI-10** | Input Validation | Server-side validation, sanitization | 🔄 In Progress |

---

## 4. SECURITY ARTIFACTS REQUIRED

### A. System Security Plan (SSP)
- [ ] System description and boundaries
- [ ] Security control implementation details
- [ ] Risk assessment and mitigation strategies
- [ ] Incident response procedures
- [ ] Continuous monitoring plan

### B. Plan of Action & Milestones (POA&M)
- [ ] Known vulnerabilities tracking
- [ ] Remediation timelines
- [ ] Risk mitigation strategies
- [ ] Monthly status updates

### C. Security Assessment Report (SAR)
- [ ] Control testing results
- [ ] Vulnerability scan results
- [ ] Penetration test findings
- [ ] Compliance verification

### D. Continuous Monitoring
- [ ] Log aggregation and analysis
- [ ] Vulnerability scanning schedule
- [ ] Patch management process
- [ ] Change management procedures

---

## 5. DEVELOPMENT SECURITY PRACTICES

### Secure SDLC
- ✅ **Static Analysis**: ESLint with security rules
- ✅ **Type Safety**: TypeScript strict mode
- 🔄 **Dependency Scanning**: npm audit, Snyk
- 📋 **SAST**: SonarQube integration
- 📋 **DAST**: OWASP ZAP scanning
- 📋 **Secret Scanning**: git-secrets, truffleHog

### Code Review Requirements
- ✅ All changes require PR review
- 🔄 Security-focused review checklist
- 📋 Automated security checks in CI/CD
- 📋 Threat modeling for new features

---

## 6. RUNTIME SECURITY

### Container Security (When Deployed)
```dockerfile
# Security-hardened Dockerfile patterns
FROM node:20-alpine AS base  # Minimal base image

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Drop privileges
USER nodejs

# Read-only filesystem where possible
VOLUME ["/app/logs"]

# Health checks
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js || exit 1
```

### Environment Security
```bash
# .env.example with security notes
# NEVER commit .env files to git

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DATABASE_SSL_MODE=require  # Always use SSL

# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=8h

# Session
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
SESSION_TIMEOUT=900000  # 15 minutes in ms

# Security Headers
ENABLE_HSTS=true
ENABLE_CSP=true
CSP_REPORT_URI=https://your-domain.mil/csp-report

# Logging
LOG_LEVEL=info
AUDIT_LOG_PATH=/var/log/app/audit.log
SIEM_ENDPOINT=https://splunk.your-domain.mil
```

---

## 7. COMPLIANCE CHECKLIST

### Pre-Deployment
- [ ] All dependencies scanned for vulnerabilities
- [ ] No high/critical vulnerabilities in production
- [ ] All secrets managed via secure vault (not .env)
- [ ] HTTPS enforced for all connections
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Audit logging implemented
- [ ] Authentication/authorization enforced
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info
- [ ] CORS properly configured
- [ ] CSP headers prevent XSS
- [ ] SQL injection prevented (parameterized queries)
- [ ] File upload restrictions in place
- [ ] Session management with timeouts
- [ ] Failed login attempt lockout

### Documentation
- [ ] System Security Plan (SSP) completed
- [ ] API security documentation
- [ ] Incident response procedures
- [ ] User access procedures
- [ ] Backup and recovery procedures
- [ ] Continuous monitoring plan
- [ ] Change management process
- [ ] Security configuration guide

### Testing
- [ ] Penetration testing completed
- [ ] Vulnerability scanning clean
- [ ] Security control testing passed
- [ ] Load/stress testing completed
- [ ] Disaster recovery tested
- [ ] Access control testing verified
- [ ] Audit log integrity verified

---

## 8. CONTINUOUS MONITORING

### Automated Checks
```yaml
# .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: SAST with SonarQube
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
```

### Monthly Reviews
- Vulnerability scan results
- Audit log analysis
- Access control review
- Patch status review
- POA&M updates
- Risk assessment updates

---

## 9. ESTIMATED TIMELINE

### Week 1-2: Core Security (Current)
- Security headers implementation
- Input validation framework
- Basic audit logging
- HTTPS enforcement

### Week 3-4: Authentication & Authorization
- JWT authentication
- RBAC implementation
- Session management
- Failed login protection

### Week 5-6: Advanced Security
- Comprehensive audit logging
- Rate limiting
- Advanced CSP
- Security testing

### Week 7-8: Documentation & Compliance
- SSP completion
- Security testing
- POA&M creation
- C-ATO package assembly

---

## 10. SUCCESS CRITERIA

### Technical
- Zero high/critical vulnerabilities
- 100% input validation coverage
- All security headers present
- Audit logs capture all required events
- Authentication enforced on all protected endpoints
- HTTPS enforced everywhere
- Session timeouts working correctly

### Compliance
- SSP approved by ISSM
- SAR shows all controls implemented
- POA&M with realistic timelines
- Continuous monitoring operational
- Incident response procedures tested

### Operational
- Security runbooks completed
- Team trained on security procedures
- SIEM integration operational
- Automated security checks in CI/CD
- Regular security updates scheduled

---

**Next Steps:**
1. Implement security headers middleware
2. Create input validation framework
3. Implement audit logging
4. Add authentication middleware
5. Configure CORS and rate limiting
6. Begin SSP documentation

**Contact:** Repository Security Team
**Classification:** UNCLASSIFIED
**Distribution:** Authorized Personnel Only
