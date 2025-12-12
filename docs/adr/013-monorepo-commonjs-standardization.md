# 13. Monorepo CommonJS Module Standardization

Date: 2025-12-11

## Status

Accepted

## Context

The monorepo build was failing during Docker image creation with:

```
error TS2307: Cannot find module '@som/shared-types' or its corresponding type declarations.
```

Investigation revealed a **module type mismatch** between packages:

| Package | Module System | moduleResolution |
|---------|--------------|------------------|
| `@som/shared-types` | ESM (`type: "module"`) | `bundler` |
| `som-tier0` | CommonJS | `node` |

TypeScript's path resolution differs significantly between these configurations:
- ESM with `bundler` resolution expects `.js` extensions and follows browser-style imports
- CommonJS with `node` resolution follows Node.js classic module lookup

Additionally, the `tsconfig.base.json` path mapping pointed to `.d.ts` files directly, which works for type-checking but not for runtime module resolution.

## Decision Drivers

* Docker builds must work without manual intervention
* Runtime must resolve `@som/shared-types` in the container
* Minimize changes to existing codebase
* Support TypeScript project references for proper build ordering
* Maintain compatibility with Node.js 20 LTS

## Considered Options

### Option 1: Convert shared-types to CommonJS
Convert `@som/shared-types` from ESM to CommonJS to match `som-tier0`.

### Option 2: Convert som-tier0 to ESM
Convert `som-tier0` to ESM to match `@som/shared-types`.

### Option 3: Dual package exports (ESM + CJS)
Configure `@som/shared-types` to emit both ESM and CommonJS builds.

### Option 4: Use bundler (esbuild/rollup) for som-tier0
Bundle all dependencies into a single file, eliminating runtime resolution.

## Decision Outcome

Chosen option: **Option 1 - Convert shared-types to CommonJS**, because:

1. `som-tier0` is a Node.js backend service; CommonJS is the native format
2. Minimal changes required (only `@som/shared-types` config files)
3. TypeScript project references work seamlessly with CommonJS
4. No additional build tooling required
5. Runtime module resolution "just works" in Node.js

### Implementation Details

**packages/som-shared-types/tsconfig.json:**
```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "moduleResolution": "node",
        "declaration": true,
        "declarationMap": true,
        "composite": true
    }
}
```

**packages/som-shared-types/package.json:**
```json
{
    "name": "@som/shared-types",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "require": "./dist/index.js",
            "default": "./dist/index.js"
        }
    }
}
```

**apps/som-tier0/tsconfig.json additions:**
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

### Positive Consequences

* Docker builds now succeed consistently
* TypeScript project references ensure correct build ordering
* No runtime module resolution errors
* Simpler mental model (everything is CommonJS for backend)
* Better IDE support with declaration maps

### Negative Consequences

* Frontend apps using `@som/shared-types` may need ESM interop
* Cannot use top-level `await` in shared-types (CommonJS limitation)
* Must rebuild shared-types before dependent packages

## Pros and Cons of the Options

### Option 1: Convert shared-types to CommonJS

* Good, because it matches the consumer's module system
* Good, because Node.js natively supports CommonJS
* Good, because minimal tooling changes
* Good, because TypeScript project references work perfectly
* Bad, because loses ESM benefits (tree-shaking, top-level await)

### Option 2: Convert som-tier0 to ESM

* Good, because ESM is the future standard
* Good, because enables top-level await
* Bad, because requires `"type": "module"` which affects all imports
* Bad, because many Node.js libraries still have CommonJS issues
* Bad, because more invasive change to the larger codebase

### Option 3: Dual package exports

* Good, because supports both module systems
* Bad, because doubles build complexity
* Bad, because can cause "dual package hazard" (multiple instances)
* Bad, because harder to debug issues

### Option 4: Use bundler

* Good, because eliminates module resolution entirely
* Bad, because adds build dependency (esbuild/rollup)
* Bad, because harder to debug (source maps required)
* Bad, because increases build time

## Links

* Supersedes: N/A
* Related: [ADR-012: PostgreSQL Migration and Async EventStore](./012-postgres-migration-and-async-eventstore.md)
* Reference: [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
* Reference: [Node.js Modules: CommonJS vs ESM](https://nodejs.org/api/esm.html)
