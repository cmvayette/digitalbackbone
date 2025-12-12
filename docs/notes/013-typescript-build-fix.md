# TypeScript Monorepo Build Fix

* **Date:** 2025-12-11
* **Author:** Claude Code
* **Status:** Done
* **Tags:** #typescript #docker #monorepo #build

## Summary

Fixed the TypeScript monorepo build configuration that was preventing Docker image creation. The root cause was a module type mismatch between ESM (`@som/shared-types`) and CommonJS (`som-tier0`).

## Problem Statement

Docker builds were failing with:
```
error TS2307: Cannot find module '@som/shared-types' or its corresponding type declarations.
```

This occurred even though:
- `@som/shared-types` builds successfully standalone
- The package is listed in `package.json` dependencies
- Path mappings exist in `tsconfig.base.json`

## Root Cause Analysis

### Configuration Before Fix

| Package | `module` | `moduleResolution` | `type` in package.json |
|---------|----------|-------------------|------------------------|
| `@som/shared-types` | ESNext | bundler | "module" (ESM) |
| `som-tier0` | commonjs | node | (none, CommonJS) |

### Why It Failed

1. **TypeScript Path Resolution Mismatch**:
   - `bundler` resolution expects browser-style imports
   - `node` resolution follows Node.js classic lookup

2. **Runtime Module Resolution**:
   - Container couldn't find `@som/shared-types` at runtime
   - npm workspaces create symlinks, but Docker COPY doesn't preserve them

3. **Build Order Not Enforced**:
   - No TypeScript project references meant build order was arbitrary

## Solution Applied

### 1. Converted `@som/shared-types` to CommonJS

**tsconfig.json:**
```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "moduleResolution": "node"
    }
}
```

**package.json:**
```json
{
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "require": "./dist/index.js"
        }
    }
}
```

### 2. Added TypeScript Project References

**apps/som-tier0/tsconfig.json:**
```json
{
    "compilerOptions": {
        "paths": {
            "@som/shared-types": ["../../packages/som-shared-types/dist"]
        }
    },
    "references": [
        { "path": "../../packages/som-shared-types" }
    ]
}
```

### 3. Updated Dockerfile

```dockerfile
# Build shared-types FIRST (dependency order)
RUN npm run build --workspace packages/som-shared-types

# Build som-tier0 with TypeScript project references
RUN npm run build --workspace apps/som-tier0

# Copy the shared-types package (runtime dependency)
COPY --from=builder --chown=somuser:somgroup /app/packages/som-shared-types ./packages/som-shared-types
```

### 4. Added Health Check Routes

Added Kubernetes-compatible health endpoints:
```typescript
app.get('/health/liveness', (c) => c.json({ status: 'UP' }));
app.get('/health/readiness', (c) => c.json({ status: 'ok', events: allEvents.length }));
```

## Verification

```bash
# Local build
npm run build --workspace packages/som-shared-types  # ✅
npm run build --workspace apps/som-tier0             # ✅

# Docker build
docker build -t som-tier0:test .                     # ✅

# Container health
curl http://localhost:3001/health/liveness           # {"status":"UP"}
curl http://localhost:3001/health/readiness          # {"status":"ok","events":0}
curl http://localhost:3001/api/v1/health             # {"success":true,"data":{...}}
```

## Files Changed

| File | Change |
|------|--------|
| `packages/som-shared-types/tsconfig.json` | ESM → CommonJS |
| `packages/som-shared-types/package.json` | Removed `type: "module"`, updated exports |
| `apps/som-tier0/tsconfig.json` | Added paths mapping and project references |
| `apps/som-tier0/src/server.ts` | Added `/health/liveness` and `/health/readiness` routes |
| `Dockerfile` | Ordered builds, copy shared-types to container |

## Pre-existing Issues Discovered

### Test Suite Failures (Not Related to This Fix)

1. **Async EventStore Migration (ADR-012)**:
   - 95 tests failing due to async/await not properly propagated
   - Tests call synchronous methods on now-async interfaces

2. **HolonType Enum Test**:
   - `GovernanceConfig` was added to enum but test not updated
   - Simple fix: add to expected array in `holon.test.ts`

## Lessons Learned

1. **Module Systems Must Align**: ESM and CommonJS don't mix well in TypeScript monorepos
2. **Docker Breaks Symlinks**: npm workspace symlinks don't survive `COPY`
3. **Project References Are Essential**: Ensures correct build order in monorepos
4. **Health Endpoints Need Direct Routes**: API server routes may not be accessible without `/api` prefix

## Related Documents

- [ADR-013: Monorepo CommonJS Standardization](../adr/013-monorepo-commonjs-standardization.md)
- [ADR-012: PostgreSQL Migration and Async EventStore](../adr/012-postgres-migration-and-async-eventstore.md)
- [012-auth-implementation-status.md](./012-auth-implementation-status.md) - Previous agent's status doc

## Decisions / Action Items

- [x] Convert `@som/shared-types` to CommonJS
- [x] Add TypeScript project references
- [x] Update Dockerfile for correct build order
- [x] Add health check routes
- [x] Verify Docker build succeeds
- [x] Document in ADR
- [ ] Fix pre-existing test failures (separate task)
- [ ] Consider migrating other packages to consistent module format
