/**
 * Test fixtures factory for SOM Tier-0 tests.
 * Eliminates duplicate beforeEach setup across test files.
 */

import { InMemoryHolonRepository } from '../core/holon-registry';
import { DocumentRegistry } from '../document-registry';
import { ConstraintEngine } from '../constraint-engine';
import { InMemoryEventStore } from '../event-store';
import { RelationshipRegistry } from '../relationship-registry';
import { ManagerDependencies } from '../core/base-manager';
import { HolonID, DocumentID, HolonType } from '@som/shared-types';

/**
 * Complete test context with all registries and services.
 */
export interface TestContext {
  holonRegistry: InMemoryHolonRepository;
  documentRegistry: DocumentRegistry;
  constraintEngine: ConstraintEngine;
  eventStore: InMemoryEventStore;
  relationshipRegistry: RelationshipRegistry;
}

/**
 * Creates a fresh set of registries for testing.
 * Use in beforeEach() to get isolated test context.
 *
 * @example
 * describe('PersonManager', () => {
 *   let ctx: TestContext;
 *   let manager: PersonManager;
 *
 *   beforeEach(() => {
 *     ctx = createTestContext();
 *     manager = new PersonManager(getManagerDeps(ctx));
 *   });
 *
 *   it('should create a person', async () => {
 *     const result = await manager.createPerson(TestData.createPersonParams());
 *     expect(result.success).toBe(true);
 *   });
 * });
 */
export function createTestContext(): TestContext {
  const holonRegistry = new InMemoryHolonRepository();
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
 * Extracts ManagerDependencies from TestContext.
 * Use when constructing managers that extend BaseManager.
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
 * Common test data factories.
 * Provides consistent, valid test data for all tests.
 */
export const TestData = {
  // Common audit params
  validActor: 'actor-001' as HolonID,
  validSourceSystem: 'test-system',
  validSourceDocuments: ['doc-001'] as DocumentID[],

  /**
   * Create valid audit params for any operation.
   */
  createAuditParams(overrides?: {
    actor?: HolonID;
    sourceSystem?: string;
    sourceDocuments?: DocumentID[];
  }) {
    return {
      actor: overrides?.actor ?? this.validActor,
      sourceSystem: overrides?.sourceSystem ?? this.validSourceSystem,
      sourceDocuments: overrides?.sourceDocuments ?? this.validSourceDocuments,
    };
  },

  /**
   * Create valid Person creation params.
   */
  createPersonParams(overrides?: Record<string, unknown>) {
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

  /**
   * Create valid Organization creation params.
   */
  createOrgParams(overrides?: Record<string, unknown>) {
    return {
      uics: ['UIC001'],
      name: 'Test Organization',
      type: 'staff',
      echelonLevel: 'O-5',
      missionStatement: 'Test mission statement',
      isTigerTeam: false,
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Position creation params.
   */
  createPositionParams(overrides?: Record<string, unknown>) {
    return {
      billetIDs: ['BILLET001'],
      title: 'Test Position',
      gradeRange: { min: 'E-5', max: 'E-7' },
      designatorExpectations: ['1130'],
      criticality: 'standard' as const,
      billetType: 'staff' as const,
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Qualification creation params.
   */
  createQualificationParams(overrides?: Record<string, unknown>) {
    return {
      name: 'Test Qualification',
      type: 'certification',
      validityPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
      renewalRules: 'Annual renewal required',
      issuingAuthority: 'Test Authority',
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Mission creation params.
   */
  createMissionParams(overrides?: Record<string, unknown>) {
    return {
      operationName: 'Test Operation',
      operationNumber: 'OP-001',
      type: 'training' as const,
      classificationMetadata: 'UNCLASSIFIED',
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Objective creation params.
   */
  createObjectiveParams(overrides?: Record<string, unknown>) {
    return {
      description: 'Test Objective Description',
      level: 'operational' as const,
      timeHorizon: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      status: 'active' as const,
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid LOE (Line of Effort) creation params.
   */
  createLOEParams(overrides?: Record<string, unknown>) {
    return {
      name: 'Test Line of Effort',
      description: 'Test LOE Description',
      sponsoringEchelon: 'NSWC',
      timeframe: {
        start: new Date(),
        end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Initiative creation params.
   */
  createInitiativeParams(overrides?: Record<string, unknown>) {
    return {
      name: 'Test Initiative',
      scope: 'Test scope description',
      sponsor: 'Test Sponsor',
      targetOutcomes: ['Outcome 1', 'Outcome 2'],
      stage: 'active' as const,
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Task creation params.
   */
  createTaskParams(overrides?: Record<string, unknown>) {
    return {
      description: 'Test Task Description',
      type: 'action',
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      status: 'created' as const,
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Document creation params.
   */
  createDocumentParams(overrides?: Record<string, unknown>) {
    return {
      referenceNumbers: ['DOC-001'],
      title: 'Test Document',
      documentType: 'Policy' as const,
      version: '1.0',
      effectiveDates: {
        start: new Date(),
        end: undefined,
      },
      classificationMetadata: 'UNCLASSIFIED',
      content: 'Test document content',
      ...this.createAuditParams(),
      ...overrides,
    };
  },

  /**
   * Create valid Process creation params.
   */
  createProcessParams(overrides?: Record<string, unknown>) {
    return {
      name: 'Test Process',
      description: 'Test process description',
      inputs: ['Input 1'],
      outputs: ['Output 1'],
      estimatedDuration: 60 * 60 * 1000, // 1 hour in ms
      ...this.createAuditParams(),
      ...overrides,
    };
  },
};

/**
 * Helper to create a holon directly in the registry for test setup.
 */
export async function createTestHolon(
  ctx: TestContext,
  type: HolonType,
  properties: Record<string, unknown>,
  id?: HolonID
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    id,
    type,
    properties,
    createdBy: TestData.validActor,
    sourceDocuments: TestData.validSourceDocuments,
  });
  return holon.id;
}
