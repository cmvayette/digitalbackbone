/**
 * Property-based tests for Governance Engine
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  GovernanceEngine,
  SchemaChangeProposal,
  HolonTypeDefinition,
  ConstraintProposal,
  MeasureProposal,
  LensProposal,
} from './index';
import { DocumentRegistry } from '../document-registry';
import { SchemaVersioningEngine } from '../schema-versioning';
import { HolonType, DocumentID } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';

describe('Governance Engine - Property-Based Tests', () => {
  let engine: GovernanceEngine;
  let documentRegistry: DocumentRegistry;
  let schemaVersioningEngine: SchemaVersioningEngine;

  beforeEach(() => {
    documentRegistry = new DocumentRegistry();
    schemaVersioningEngine = new SchemaVersioningEngine();
    engine = new GovernanceEngine(documentRegistry, schemaVersioningEngine);
  });

  // Generator for document IDs
  const genDocumentID = (): fc.Arbitrary<DocumentID> => {
    return fc.uuid();
  };

  // Generator for actor names
  const genActor = (): fc.Arbitrary<string> => {
    return fc.string({ minLength: 3, maxLength: 50 });
  };

  // Generator for example use cases
  const genUseCases = (): fc.Arbitrary<string[]> => {
    return fc.array(
      fc.string({ minLength: 20, maxLength: 200 }),
      { minLength: 1, maxLength: 5 }
    );
  };

  // Generator for holon type definitions
  const genHolonTypeDefinition = (): fc.Arbitrary<HolonTypeDefinition> => {
    return fc.record({
      type: fc.constantFrom(...Object.values(HolonType)),
      schemaVersion: fc.uuid(),
      requiredProperties: fc.array(
        fc.string({ minLength: 1, maxLength: 20 }),
        { minLength: 1, maxLength: 5 }
      ),
      optionalProperties: fc.array(
        fc.string({ minLength: 1, maxLength: 20 }),
        { maxLength: 5 }
      ),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
      introducedInVersion: fc.constant('1.0'),
    });
  };

  // Generator for constraint proposals
  const genConstraintProposal = (): fc.Arbitrary<ConstraintProposal> => {
    return fc.record({
      name: fc.string({ minLength: 5, maxLength: 50 }),
      type: fc.constantFrom('Structural', 'Policy', 'Eligibility', 'Temporal', 'Capacity'),
      definition: fc.string({ minLength: 10, maxLength: 200 }),
      scope: fc.record({
        holonTypes: fc.option(
          fc.array(fc.constantFrom(...Object.values(HolonType)), { minLength: 1, maxLength: 3 }),
          { nil: undefined }
        ),
        relationshipTypes: fc.option(
          fc.array(fc.constantFrom(...Object.values(RelationshipType)), { minLength: 1, maxLength: 3 }),
          { nil: undefined }
        ),
        eventTypes: fc.option(
          fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
          { nil: undefined }
        ),
      }),
      validationLogic: fc.string({ minLength: 10, maxLength: 200 }),
      definingDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
    });
  };

  // Generator for measure proposals
  const genMeasureProposal = (): fc.Arbitrary<MeasureProposal> => {
    return fc.record({
      name: fc.string({ minLength: 5, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      unit: fc.string({ minLength: 1, maxLength: 20 }),
      calculationMethod: fc.string({ minLength: 10, maxLength: 200 }),
      samplingFrequency: fc.constantFrom('hourly', 'daily', 'weekly', 'monthly', 'on-demand'),
      definingDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
    });
  };

  // Generator for lens proposals
  const genLensProposal = (): fc.Arbitrary<LensProposal> => {
    return fc.record({
      name: fc.string({ minLength: 5, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      inputMeasures: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
      logic: fc.string({ minLength: 10, maxLength: 200 }),
      thresholds: fc.constant({ green: 0.8, amber: 0.5, red: 0.0 }),
      outputs: fc.constant(['green', 'amber', 'red']),
      definingDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
    });
  };

  /**
   * **Feature: semantic-operating-model, Property 51: Schema proposal completeness**
   * **Validates: Requirements 18.1**
   * 
   * For any new holon type proposed, it must include reference documents, example use cases,
   * and collision analysis.
   */
  test('Property 51: Schema proposal completeness', () => {
    fc.assert(
      fc.property(
        genHolonTypeDefinition(),
        genUseCases(),
        fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
        genActor(),
        (holonTypeDef, useCases, refDocs, proposedBy) => {
          // Create a fresh engine for each test run
          const testDocRegistry = new DocumentRegistry();
          const testSchemaEngine = new SchemaVersioningEngine();
          const testEngine = new GovernanceEngine(testDocRegistry, testSchemaEngine);

          // Test 1: Proposal WITH all required fields should be valid
          const completeProposal = testEngine.createProposal({
            proposalType: 'add_holon_type',
            proposedBy,
            referenceDocuments: refDocs,
            exampleUseCases: useCases,
            collisionAnalysis: testEngine.performCollisionAnalysis(holonTypeDef),
            impactAnalysis: undefined, // Optional for this test
            holonTypeDefinition: holonTypeDef,
          });

          const validationComplete = testEngine.validateProposal(completeProposal);
          
          // Should be valid with all required fields
          expect(validationComplete.isValid).toBe(true);
          expect(validationComplete.errors).toHaveLength(0);

          // Test 2: Proposal WITHOUT reference documents should be invalid
          const noRefDocsProposal = testEngine.createProposal({
            proposalType: 'add_holon_type',
            proposedBy,
            referenceDocuments: [], // Missing
            exampleUseCases: useCases,
            collisionAnalysis: testEngine.performCollisionAnalysis(holonTypeDef),
            holonTypeDefinition: holonTypeDef,
          });

          const validationNoRefDocs = testEngine.validateProposal(noRefDocsProposal);
          expect(validationNoRefDocs.isValid).toBe(false);
          expect(validationNoRefDocs.errors.some(e => e.includes('reference document'))).toBe(true);

          // Test 3: Proposal WITHOUT example use cases should be invalid
          const noUseCasesProposal = testEngine.createProposal({
            proposalType: 'add_holon_type',
            proposedBy,
            referenceDocuments: refDocs,
            exampleUseCases: [], // Missing
            collisionAnalysis: testEngine.performCollisionAnalysis(holonTypeDef),
            holonTypeDefinition: holonTypeDef,
          });

          const validationNoUseCases = testEngine.validateProposal(noUseCasesProposal);
          expect(validationNoUseCases.isValid).toBe(false);
          expect(validationNoUseCases.errors.some(e => e.includes('example use cases'))).toBe(true);

          // Test 4: Proposal WITHOUT collision analysis should be invalid
          const noCollisionProposal = testEngine.createProposal({
            proposalType: 'add_holon_type',
            proposedBy,
            referenceDocuments: refDocs,
            exampleUseCases: useCases,
            collisionAnalysis: undefined, // Missing
            holonTypeDefinition: holonTypeDef,
          });

          const validationNoCollision = testEngine.validateProposal(noCollisionProposal);
          expect(validationNoCollision.isValid).toBe(false);
          expect(validationNoCollision.errors.some(e => e.includes('collision analysis'))).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional unit tests for completeness validation
  describe('Proposal Validation', () => {
    test('should validate constraint proposals require defining documents', () => {
      const constraintProposal = engine.createProposal({
        proposalType: 'add_constraint',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        constraintDefinition: {
          name: 'Test Constraint',
          type: 'Policy',
          definition: 'This is a test constraint definition',
          scope: { holonTypes: [HolonType.Person] },
          validationLogic: 'return true;',
          definingDocuments: [], // Missing
        },
      });

      const validation = engine.validateProposal(constraintProposal);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('defining documents'))).toBe(true);
    });

    test('should validate measure proposals require calculation method', () => {
      const measureProposal = engine.createProposal({
        proposalType: 'add_measure',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        measureDefinition: {
          name: 'Test Measure',
          description: 'This is a test measure',
          unit: 'count',
          calculationMethod: '', // Missing
          samplingFrequency: 'daily',
          definingDocuments: ['doc-1'],
        },
      });

      const validation = engine.validateProposal(measureProposal);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('calculation method'))).toBe(true);
    });

    test('should validate lens proposals require input measures', () => {
      const lensProposal = engine.createProposal({
        proposalType: 'add_lens',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        lensDefinition: {
          name: 'Test Lens',
          description: 'This is a test lens',
          inputMeasures: [], // Missing
          logic: 'return green;',
          thresholds: {},
          outputs: ['green', 'amber', 'red'],
          definingDocuments: ['doc-1'],
        },
      });

      const validation = engine.validateProposal(lensProposal);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('input measures'))).toBe(true);
    });
  });

  describe('Decision Logging', () => {
    test('should log approval decisions as documents', () => {
      const holonTypeDef: HolonTypeDefinition = {
        type: HolonType.Asset,
        schemaVersion: schemaVersioningEngine.getCurrentVersion().id,
        requiredProperties: ['name', 'serialNumber'],
        optionalProperties: ['status'],
        description: 'Asset holon type for tracking equipment',
        sourceDocuments: ['doc-1'],
        introducedInVersion: '1.0',
      };

      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        exampleUseCases: ['Track equipment inventory', 'Monitor asset lifecycle'],
        collisionAnalysis: engine.performCollisionAnalysis(holonTypeDef),
        holonTypeDefinition: holonTypeDef,
      });

      const decisionDocId = engine.approveProposal(
        proposal.id,
        'approver-user',
        'Approved for asset tracking requirements',
        'event-123'
      );

      expect(decisionDocId).toBeDefined();
      
      const updatedProposal = engine.getProposal(proposal.id);
      expect(updatedProposal?.status).toBe('approved');
      expect(updatedProposal?.decisionDocument).toBe(decisionDocId);
      expect(updatedProposal?.decisionRationale).toBe('Approved for asset tracking requirements');
    });

    test('should log rejection decisions as documents', () => {
      const holonTypeDef: HolonTypeDefinition = {
        type: HolonType.Asset,
        schemaVersion: schemaVersioningEngine.getCurrentVersion().id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Asset holon type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: '1.0',
      };

      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        exampleUseCases: ['Track assets'],
        collisionAnalysis: engine.performCollisionAnalysis(holonTypeDef),
        holonTypeDefinition: holonTypeDef,
      });

      const decisionDocId = engine.rejectProposal(
        proposal.id,
        'approver-user',
        'Insufficient justification for new type',
        'event-124'
      );

      expect(decisionDocId).toBeDefined();
      
      const updatedProposal = engine.getProposal(proposal.id);
      expect(updatedProposal?.status).toBe('rejected');
      expect(updatedProposal?.decisionDocument).toBe(decisionDocId);
    });

    test('should not approve invalid proposals', () => {
      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        proposedBy: 'test-user',
        referenceDocuments: [], // Invalid - missing reference documents
        exampleUseCases: ['Test'],
        holonTypeDefinition: {
          type: HolonType.Asset,
          schemaVersion: 'v1',
          requiredProperties: ['name'],
          optionalProperties: [],
          description: 'Test',
          sourceDocuments: ['doc-1'],
          introducedInVersion: '1.0',
        },
      });

      expect(() => {
        engine.approveProposal(proposal.id, 'approver', 'Test', 'event-125');
      }).toThrow('Cannot approve invalid proposal');
    });
  });

  describe('Impact Analysis', () => {
    test('should perform impact analysis for holon type additions', () => {
      const holonTypeDef: HolonTypeDefinition = {
        type: HolonType.Asset,
        schemaVersion: schemaVersioningEngine.getCurrentVersion().id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Asset type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: '1.0',
      };

      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        holonTypeDefinition: holonTypeDef,
      });

      const impact = engine.performImpactAnalysis(proposal);

      expect(impact.riskLevel).toBe('low');
      expect(impact.breakingChange).toBe(false);
      expect(impact.estimatedDataMigrationRequired).toBe(false);
      expect(impact.mitigationStrategies.length).toBeGreaterThan(0);
    });

    test('should identify high risk for type modifications', () => {
      const proposal = engine.createProposal({
        proposalType: 'modify_type',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
      });

      const impact = engine.performImpactAnalysis(proposal);

      expect(impact.riskLevel).toBe('high');
      expect(impact.breakingChange).toBe(true);
      expect(impact.estimatedDataMigrationRequired).toBe(true);
      expect(impact.mitigationStrategies.some(s => s.includes('migration'))).toBe(true);
    });

    test('should identify medium risk for constraint additions', () => {
      const constraintDef: ConstraintProposal = {
        name: 'Test Constraint',
        type: 'Policy',
        definition: 'Test constraint definition',
        scope: {
          holonTypes: [HolonType.Person, HolonType.Position],
        },
        validationLogic: 'return true;',
        definingDocuments: ['doc-1'],
      };

      const proposal = engine.createProposal({
        proposalType: 'add_constraint',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        constraintDefinition: constraintDef,
      });

      const impact = engine.performImpactAnalysis(proposal);

      expect(impact.riskLevel).toBe('medium');
      expect(impact.estimatedDataMigrationRequired).toBe(true);
      expect(impact.affectedHolonTypes).toContain(HolonType.Person);
      expect(impact.affectedHolonTypes).toContain(HolonType.Position);
    });
  });

  describe('Collision Analysis', () => {
    test('should detect collisions with existing types', () => {
      const currentVersion = schemaVersioningEngine.getCurrentVersion();
      
      // Register an existing type
      const existingDef: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name', 'edipi'],
        optionalProperties: [],
        description: 'Existing person type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };
      schemaVersioningEngine.registerHolonTypeDefinition(existingDef);

      // Try to add the same type
      const proposedDef: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'New person type',
        sourceDocuments: ['doc-2'],
        introducedInVersion: currentVersion.versionString,
      };

      const collision = engine.performCollisionAnalysis(proposedDef);

      expect(collision.hasCollisions).toBe(true);
      expect(collision.collisions.length).toBeGreaterThan(0);
    });

    test('should not detect collisions for new types', () => {
      const newDef: HolonTypeDefinition = {
        type: HolonType.Asset,
        schemaVersion: schemaVersioningEngine.getCurrentVersion().id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'New asset type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: '1.0',
      };

      const collision = engine.performCollisionAnalysis(newDef);

      expect(collision.hasCollisions).toBe(false);
      expect(collision.collisions).toHaveLength(0);
    });
  });

  describe('Proposal Lifecycle', () => {
    test('should track proposal status changes', () => {
      const proposal = engine.createProposal({
        proposalType: 'add_measure',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        measureDefinition: {
          name: 'Test Measure',
          description: 'A test measure for tracking',
          unit: 'count',
          calculationMethod: 'sum(values)',
          samplingFrequency: 'daily',
          definingDocuments: ['doc-1'],
        },
      });

      expect(proposal.status).toBe('proposed');
      expect(proposal.proposedAt).toBeInstanceOf(Date);

      // Get proposals by status
      const proposedProposals = engine.getProposalsByStatus('proposed');
      expect(proposedProposals).toContainEqual(proposal);
    });

    test('should prevent double approval', () => {
      const holonTypeDef: HolonTypeDefinition = {
        type: HolonType.Asset,
        schemaVersion: schemaVersioningEngine.getCurrentVersion().id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Asset type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: '1.0',
      };

      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        proposedBy: 'test-user',
        referenceDocuments: ['doc-1'],
        exampleUseCases: ['Track assets'],
        collisionAnalysis: engine.performCollisionAnalysis(holonTypeDef),
        holonTypeDefinition: holonTypeDef,
      });

      engine.approveProposal(proposal.id, 'approver', 'Approved', 'event-126');

      expect(() => {
        engine.approveProposal(proposal.id, 'approver', 'Approved again', 'event-127');
      }).toThrow('has already been approved');
    });
  });
});
