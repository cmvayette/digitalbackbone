# Codebase Simplification Plan

This document outlines concrete steps to reduce code duplication and complexity in the Digital Backbone codebase, based on the complexity review.

---

## Executive Summary

| Simplification | Effort | Lines Saved | Priority |
|----------------|--------|-------------|----------|
| Generic OperationResult | 1 hour | ~70 | High |
| BaseManager class | 2 hours | ~140 | High |
| AuditParams mixin | 1 hour | ~150 | High |
| Test fixture factory | 1 hour | ~350 | High |
| Dependency container | 2 hours | ~100 | Medium |
| Shared frontend configs | 1 hour | ~50 | Medium |
| ID generator service | 30 min | ~30 | Low |
| **Total** | **~8.5 hours** | **~890 lines** |

---

# 1. Generic OperationResult Type

## Problem

Seven manager classes define nearly identical result interfaces:

```typescript
// person-management/index.ts
export interface PersonOperationResult {
  success: boolean;
  personID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

// organization-management/index.ts
export interface OrganizationOperationResult {
  success: boolean;
  organizationID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}
// ... repeated 5 more times
```

## Solution

**File:** `packages/som-shared-types/src/operation-result.ts`

```typescript
import { HolonID, EventID } from './holon';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface OperationResult<T extends Record<string, any> = {}> {
  success: boolean;
  holonID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
  metadata?: T;
}

// Type aliases for backwards compatibility during migration
export type PersonOperationResult = OperationResult;
export type OrganizationOperationResult = OperationResult;
export type PositionOperationResult = OperationResult;
export type QualificationOperationResult = OperationResult;
export type MissionOperationResult = OperationResult;
export type ObjectiveOperationResult = OperationResult;
export type InitiativeOperationResult = OperationResult;
```

**Update:** `packages/som-shared-types/src/index.ts`
```typescript
export * from './operation-result';
```

## Migration Steps

1. Create `operation-result.ts` in shared-types
2. Export from shared-types index
3. Update each manager to import from shared-types
4. Remove local interface definitions
5. Run tests to verify

## Files to Modify

- `packages/som-shared-types/src/operation-result.ts` (create)
- `packages/som-shared-types/src/index.ts` (add export)
- `apps/som-tier0/src/person-management/index.ts` (remove interface, update import)
- `apps/som-tier0/src/organization-management/index.ts` (remove interface, update import)
- `apps/som-tier0/src/qualification-management/index.ts` (remove interface, update import)
- `apps/som-tier0/src/objective-loe-management/index.ts` (remove interface, update import)
- `apps/som-tier0/src/mission-management/index.ts` (remove interface, update import)
- `apps/som-tier0/src/initiative-task-management/index.ts` (remove interface, update import)
- `apps/som-tier0/src/governance/index.ts` (remove interface, update import)

---

# 2. BaseManager Abstract Class

## Problem

All seven managers have identical constructor patterns:

```typescript
export class PersonManager {
  private holonRegistry: HolonRegistry;
  private relationshipRegistry: RelationshipRegistry;
  private eventStore: EventStore;
  private constraintEngine: ConstraintEngine;

  constructor(
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry,
    eventStore: EventStore,
    constraintEngine: ConstraintEngine
  ) {
    this.holonRegistry = holonRegistry;
    this.relationshipRegistry = relationshipRegistry;
    this.eventStore = eventStore;
    this.constraintEngine = constraintEngine;
  }
  // ...
}
```

## Solution

**File:** `apps/som-tier0/src/core/base-manager.ts`

```typescript
import { HolonRegistry } from './holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { ValidationResult, OperationResult } from '@som/shared-types';

export interface ManagerDependencies {
  holonRegistry: HolonRegistry;
  relationshipRegistry: RelationshipRegistry;
  eventStore: IEventStore;
  constraintEngine: ConstraintEngine;
}

export abstract class BaseManager {
  protected holonRegistry: HolonRegistry;
  protected relationshipRegistry: RelationshipRegistry;
  protected eventStore: IEventStore;
  protected constraintEngine: ConstraintEngine;

  constructor(deps: ManagerDependencies) {
    this.holonRegistry = deps.holonRegistry;
    this.relationshipRegistry = deps.relationshipRegistry;
    this.eventStore = deps.eventStore;
    this.constraintEngine = deps.constraintEngine;
  }

  /**
   * Helper to create a successful operation result
   */
  protected successResult(
    holonID?: string,
    eventID?: string,
    relationshipID?: string
  ): OperationResult {
    return {
      success: true,
      holonID,
      eventID,
      relationshipID,
      validation: { valid: true, errors: [], warnings: [] },
    };
  }

  /**
   * Helper to create a failed operation result
   */
  protected failureResult(validation: ValidationResult): OperationResult {
    return {
      success: false,
      validation,
    };
  }
}
```

## Migration Steps

1. Create `base-manager.ts` in core
2. Export from core index
3. Update PersonManager to extend BaseManager
4. Run tests
5. Repeat for remaining 6 managers

## Example Migration (PersonManager)

**Before:**
```typescript
export class PersonManager {
  private holonRegistry: HolonRegistry;
  private relationshipRegistry: RelationshipRegistry;
  private eventStore: EventStore;
  private constraintEngine: ConstraintEngine;

  constructor(
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry,
    eventStore: EventStore,
    constraintEngine: ConstraintEngine
  ) {
    this.holonRegistry = holonRegistry;
    this.relationshipRegistry = relationshipRegistry;
    this.eventStore = eventStore;
    this.constraintEngine = constraintEngine;
  }
}
```

**After:**
```typescript
import { BaseManager, ManagerDependencies } from '../core/base-manager';

export class PersonManager extends BaseManager {
  constructor(deps: ManagerDependencies) {
    super(deps);
  }
}
```

## Files to Modify

- `apps/som-tier0/src/core/base-manager.ts` (create)
- `apps/som-tier0/src/core/index.ts` (add export)
- `apps/som-tier0/src/person-management/index.ts`
- `apps/som-tier0/src/organization-management/index.ts`
- `apps/som-tier0/src/qualification-management/index.ts`
- `apps/som-tier0/src/objective-loe-management/index.ts`
- `apps/som-tier0/src/mission-management/index.ts`
- `apps/som-tier0/src/initiative-task-management/index.ts`
- `apps/som-tier0/src/governance/index.ts`

---

# 3. AuditParams Mixin

## Problem

38+ parameter interfaces repeat the same audit fields:

```typescript
export interface CreatePersonParams {
  edipi: string;
  name: string;
  // ... domain fields

  // These 3 fields repeat in EVERY params interface:
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}
```

## Solution

**File:** `packages/som-shared-types/src/audit-params.ts`

```typescript
import { DocumentID, HolonID } from './holon';

/**
 * Common audit/tracking fields required for all state-changing operations.
 * Extend this interface in domain-specific params.
 */
export interface AuditParams {
  /** Source documents that authorize this operation */
  sourceDocuments: DocumentID[];
  /** The actor (person/system) performing the operation */
  actor: HolonID;
  /** The system originating this operation */
  sourceSystem: string;
}

/**
 * Helper type to add audit params to any interface
 */
export type WithAudit<T> = T & AuditParams;
```

## Migration Example

**Before:**
```typescript
export interface CreatePersonParams {
  edipi: string;
  serviceNumbers: string[];
  name: string;
  dob: Date;
  serviceBranch: string;
  designatorRating: string;
  category: 'active_duty' | 'reserve' | 'civilian' | 'contractor';
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}
```

**After:**
```typescript
import { AuditParams } from '@som/shared-types';

export interface CreatePersonParams extends AuditParams {
  edipi: string;
  serviceNumbers: string[];
  name: string;
  dob: Date;
  serviceBranch: string;
  designatorRating: string;
  category: 'active_duty' | 'reserve' | 'civilian' | 'contractor';
}
```

## Files to Modify

- `packages/som-shared-types/src/audit-params.ts` (create)
- `packages/som-shared-types/src/index.ts` (add export)
- All manager files with params interfaces (~38 interfaces across 7 files)

---

# 4. Test Fixture Factory

## Problem

Every test file has identical setup boilerplate:

```typescript
let holonRegistry: HolonRegistry;
let documentRegistry: DocumentRegistry;
let constraintEngine: ConstraintEngine;
let eventStore: InMemoryEventStore;
let relationshipRegistry: RelationshipRegistry;

beforeEach(async () => {
  holonRegistry = new HolonRegistry();
  documentRegistry = new DocumentRegistry();
  constraintEngine = new ConstraintEngine(documentRegistry);
  eventStore = new InMemoryEventStore();
  relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
});
```

## Solution

**File:** `apps/som-tier0/src/test-utils/fixtures.ts`

```typescript
import { HolonRegistry } from '../core/holon-registry';
import { DocumentRegistry } from '../document-registry';
import { ConstraintEngine } from '../constraint-engine';
import { InMemoryEventStore } from '../event-store';
import { RelationshipRegistry } from '../relationship-registry';
import { ManagerDependencies } from '../core/base-manager';

export interface TestContext {
  holonRegistry: HolonRegistry;
  documentRegistry: DocumentRegistry;
  constraintEngine: ConstraintEngine;
  eventStore: InMemoryEventStore;
  relationshipRegistry: RelationshipRegistry;
}

/**
 * Creates a fresh set of registries for testing.
 * Use in beforeEach() to get isolated test context.
 */
export function createTestContext(): TestContext {
  const holonRegistry = new HolonRegistry();
  const documentRegistry = new DocumentRegistry();
  const constraintEngine = new ConstraintEngine(documentRegistry);
  const eventStore = new InMemoryEventStore();
  const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);

  return {
    holonRegistry,
    documentRegistry,
    constraintEngine,
    eventStore,
    relationshipRegistry,
  };
}

/**
 * Extracts ManagerDependencies from TestContext
 */
export function getManagerDeps(ctx: TestContext): ManagerDependencies {
  return {
    holonRegistry: ctx.holonRegistry,
    relationshipRegistry: ctx.relationshipRegistry,
    eventStore: ctx.eventStore,
    constraintEngine: ctx.constraintEngine,
  };
}

/**
 * Common test data factories
 */
export const TestData = {
  validActor: 'actor-001',
  validSourceSystem: 'test-system',
  validSourceDocuments: ['doc-001'],

  createAuditParams() {
    return {
      actor: this.validActor,
      sourceSystem: this.validSourceSystem,
      sourceDocuments: this.validSourceDocuments,
    };
  },

  createPersonParams(overrides = {}) {
    return {
      edipi: '1234567890',
      serviceNumbers: ['SN001'],
      name: 'Test Person',
      dob: new Date('1990-01-01'),
      serviceBranch: 'Navy',
      designatorRating: '1130',
      category: 'active_duty' as const,
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  createOrgParams(overrides = {}) {
    return {
      uics: ['UIC001'],
      name: 'Test Organization',
      type: 'staff',
      echelonLevel: 'O-5',
      missionStatement: 'Test mission',
      isTigerTeam: false,
      ...this.createAuditParams(),
      ...overrides,
    };
  },
};
```

## Migration Example

**Before (person-management/index.test.ts):**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PersonManager } from './index';
import { HolonRegistry } from '../core/holon-registry';
import { DocumentRegistry } from '../document-registry';
import { ConstraintEngine } from '../constraint-engine';
import { InMemoryEventStore } from '../event-store';
import { RelationshipRegistry } from '../relationship-registry';

describe('PersonManager', () => {
  let holonRegistry: HolonRegistry;
  let documentRegistry: DocumentRegistry;
  let constraintEngine: ConstraintEngine;
  let eventStore: InMemoryEventStore;
  let relationshipRegistry: RelationshipRegistry;
  let manager: PersonManager;

  beforeEach(async () => {
    holonRegistry = new HolonRegistry();
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    eventStore = new InMemoryEventStore();
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    manager = new PersonManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);
  });

  it('should create a person', async () => {
    const result = await manager.createPerson({
      edipi: '1234567890',
      serviceNumbers: ['SN001'],
      name: 'Test Person',
      dob: new Date('1990-01-01'),
      serviceBranch: 'Navy',
      designatorRating: '1130',
      category: 'active_duty',
      sourceDocuments: ['doc-001'],
      actor: 'actor-001',
      sourceSystem: 'test-system',
    });
    expect(result.success).toBe(true);
  });
});
```

**After:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PersonManager } from './index';
import { createTestContext, getManagerDeps, TestData, TestContext } from '../test-utils/fixtures';

describe('PersonManager', () => {
  let ctx: TestContext;
  let manager: PersonManager;

  beforeEach(() => {
    ctx = createTestContext();
    manager = new PersonManager(getManagerDeps(ctx));
  });

  it('should create a person', async () => {
    const result = await manager.createPerson(TestData.createPersonParams());
    expect(result.success).toBe(true);
  });
});
```

## Files to Modify

- `apps/som-tier0/src/test-utils/fixtures.ts` (create)
- `apps/som-tier0/src/test-utils/index.ts` (create, export all)
- `apps/som-tier0/src/person-management/index.test.ts`
- `apps/som-tier0/src/organization-management/index.test.ts`
- `apps/som-tier0/src/qualification-management/index.test.ts`
- `apps/som-tier0/src/objective-loe-management/index.test.ts`
- `apps/som-tier0/src/mission-management/index.test.ts`
- `apps/som-tier0/src/initiative-task-management/index.test.ts`
- `apps/som-tier0/src/governance/index.test.ts`
- `apps/som-tier0/src/integration.test.ts`

---

# 5. Dependency Container for API Server

## Problem

API server constructor takes 10 individual parameters:

```typescript
constructor(
  config: APIServerConfig,
  queryLayer: QueryLayer,
  eventStore: EventStore,
  semanticAccessLayer: SemanticAccessLayer,
  schemaVersioning: SchemaVersioningEngine,
  governance: GovernanceEngine,
  monitoring: MonitoringService,
  holonRegistry: HolonRegistry,
  relationshipRegistry: RelationshipRegistry,
  constraintEngine: ConstraintEngine,
  documentRegistry: DocumentRegistry
)
```

## Solution

**File:** `apps/som-tier0/src/core/service-container.ts`

```typescript
import { QueryLayer } from '../query/query-layer';
import { IEventStore } from '../event-store';
import { SemanticAccessLayer } from '../semantic-access-layer';
import { SchemaVersioningEngine } from '../schema-versioning';
import { GovernanceEngine } from '../governance';
import { MonitoringService } from '../monitoring';
import { HolonRegistry } from './holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';

/**
 * Container for all core services.
 * Simplifies dependency injection across the application.
 */
export interface ServiceContainer {
  queryLayer: QueryLayer;
  eventStore: IEventStore;
  semanticAccessLayer: SemanticAccessLayer;
  schemaVersioning: SchemaVersioningEngine;
  governance: GovernanceEngine;
  monitoring: MonitoringService;
  holonRegistry: HolonRegistry;
  relationshipRegistry: RelationshipRegistry;
  constraintEngine: ConstraintEngine;
  documentRegistry: DocumentRegistry;
}

/**
 * Creates a fully initialized service container.
 * Services are created in dependency order.
 */
export function createServiceContainer(): ServiceContainer {
  // Layer 1: No dependencies
  const holonRegistry = new HolonRegistry();
  const documentRegistry = new DocumentRegistry();
  const eventStore = new InMemoryEventStore();
  const monitoring = new MonitoringService();

  // Layer 2: Depends on Layer 1
  const constraintEngine = new ConstraintEngine(documentRegistry);
  const schemaVersioning = new SchemaVersioningEngine();

  // Layer 3: Depends on Layer 2
  const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
  const semanticAccessLayer = new SemanticAccessLayer(holonRegistry, eventStore);
  const governance = new GovernanceEngine(constraintEngine, documentRegistry);

  // Layer 4: Depends on Layer 3
  const queryLayer = new QueryLayer(holonRegistry, relationshipRegistry, eventStore);

  return {
    queryLayer,
    eventStore,
    semanticAccessLayer,
    schemaVersioning,
    governance,
    monitoring,
    holonRegistry,
    relationshipRegistry,
    constraintEngine,
    documentRegistry,
  };
}
```

## Migration

**Before (api-server.ts):**
```typescript
export class APIServer {
  constructor(
    config: APIServerConfig,
    queryLayer: QueryLayer,
    eventStore: EventStore,
    semanticAccessLayer: SemanticAccessLayer,
    schemaVersioning: SchemaVersioningEngine,
    governance: GovernanceEngine,
    monitoring: MonitoringService,
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry,
    constraintEngine: ConstraintEngine,
    documentRegistry: DocumentRegistry
  ) {
    this.config = config;
    this.queryLayer = queryLayer;
    // ... 10 more assignments
  }
}
```

**After:**
```typescript
import { ServiceContainer } from '../core/service-container';

export class APIServer {
  private services: ServiceContainer;

  constructor(config: APIServerConfig, services: ServiceContainer) {
    this.config = config;
    this.services = services;
  }

  // Access services via this.services.queryLayer, etc.
}
```

## Files to Modify

- `apps/som-tier0/src/core/service-container.ts` (create)
- `apps/som-tier0/src/api/api-server.ts`
- `apps/som-tier0/src/api/routes.ts`
- Any files that instantiate APIServer

---

# 6. Shared Frontend Configs

## Problem

All 5 frontend apps have identical vite.config.ts and eslint.config.js files.

## Solution

**File:** `packages/build-config/vite.config.base.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

**File:** `packages/build-config/eslint.config.base.js`

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

**File:** `packages/build-config/package.json`

```json
{
  "name": "@som/build-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./vite": "./vite.config.base.ts",
    "./eslint": "./eslint.config.base.js"
  },
  "peerDependencies": {
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

## Migration

**Each app's vite.config.ts becomes:**
```typescript
import baseConfig from '@som/build-config/vite';
export default baseConfig;
```

**Each app's eslint.config.js becomes:**
```javascript
import baseConfig from '@som/build-config/eslint';
export default baseConfig;
```

## Files to Modify

- `packages/build-config/` (create entire package)
- `apps/org-chart/vite.config.ts`
- `apps/org-chart/eslint.config.js`
- `apps/how-do/vite.config.ts`
- `apps/how-do/eslint.config.js`
- `apps/policy-governance/vite.config.ts`
- `apps/policy-governance/eslint.config.js`
- `apps/task-management/vite.config.ts`
- `apps/task-management/eslint.config.js`
- `apps/objectives-okr/vite.config.ts`
- `apps/objectives-okr/eslint.config.js`
- `package.json` (add workspace)

---

# 7. Centralized ID Generator

## Problem

Each manager calls `randomUUID()` directly instead of using a consistent ID generation service.

## Solution

**File:** `apps/som-tier0/src/core/id-generator.ts`

```typescript
import { randomUUID } from 'crypto';
import { HolonID, EventID, DocumentID } from '@som/shared-types';

/**
 * Centralized ID generation for all entity types.
 * Provides consistent, traceable ID creation.
 */
export const IDGenerator = {
  holon(): HolonID {
    return randomUUID();
  },

  event(): EventID {
    return randomUUID();
  },

  document(): DocumentID {
    return randomUUID();
  },

  relationship(): string {
    return randomUUID();
  },

  constraint(): string {
    return randomUUID();
  },
};
```

## Migration

**Before:**
```typescript
import { randomUUID } from 'crypto';

const personID = randomUUID();
```

**After:**
```typescript
import { IDGenerator } from '../core/id-generator';

const personID = IDGenerator.holon();
```

---

# Implementation Order

Execute simplifications in this order to minimize merge conflicts:

## Phase 1: Foundation (Do First)

1. **Create shared types** (OperationResult, AuditParams)
   - No breaking changes
   - Enables subsequent migrations

2. **Create test fixtures**
   - Improves test maintainability immediately
   - No production code changes

## Phase 2: Core Refactoring

3. **Create BaseManager**
   - Requires OperationResult from Phase 1
   - Update one manager at a time, run tests after each

4. **Create ServiceContainer**
   - Can be done independently
   - Update API server last

## Phase 3: Build Infrastructure

5. **Create shared build configs**
   - Low risk
   - Improves consistency

6. **Centralize ID generation**
   - Low priority
   - Can be done incrementally

---

# Verification Checklist

After each simplification:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Semantic linter passes (`npm run lint:semantic`)
- [ ] No TypeScript errors
- [ ] No new ESLint warnings

---

# Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing tests | Run tests after each file change |
| Type incompatibilities | Use type aliases for backwards compatibility |
| Merge conflicts | Do foundation work first, then refactoring |
| Missed usages | Use TypeScript compiler errors to find all references |

---

# Not Recommended (Yet)

These simplifications were considered but deferred:

1. **Discriminated unions for Holon types** - Would require significant refactoring for marginal benefit
2. **Lazy index building** - Premature optimization; wait for real performance data
3. **Consolidating frontend apps** - Deployment requirements unclear; keep separate for now
4. **Removing IRepository interface** - May be useful when adding persistent storage
