/**
 * Property-based tests for Constraint Engine
 * 
 * These tests verify the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ConstraintEngine, RegisterConstraintParams, ValidationResult } from './index';
import { DocumentRegistry } from '../document-registry';
import { HolonType, ConstraintType, DocumentType, Holon } from '../core/types/holon';
import { Relationship, RelationshipType } from '../core/types/relationship';
import { Event, EventType } from '../core/types/event';

// Helper generators (defined outside describe block for reusability)
const genDocument = () => fc.record({
    referenceNumbers: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    documentType: fc.constantFrom(...Object.values(DocumentType)),
    version: fc.string({ minLength: 1, maxLength: 10 }),
    effectiveDates: fc.record({
      start: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
      end: fc.option(fc.date({ min: new Date('2025-01-02'), max: new Date('2030-01-01') }), { nil: undefined })
    }),
    classificationMetadata: fc.constantFrom('UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET'),
    content: fc.option(fc.string(), { nil: undefined })
  });

  const genConstraintParams = (sourceDocIds: string[]) => fc.record({
    type: fc.constantFrom(...Object.values(ConstraintType)),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    definition: fc.string({ minLength: 10, maxLength: 200 }),
    scope: fc.record({
      holonTypes: fc.option(fc.array(fc.constantFrom(...Object.values(HolonType)), { minLength: 1, maxLength: 3 }), { nil: undefined }),
      relationshipTypes: fc.option(fc.array(fc.constantFrom(...Object.values(RelationshipType)), { minLength: 1, maxLength: 3 }), { nil: undefined }),
      eventTypes: fc.option(fc.array(fc.constantFrom(...Object.values(EventType)), { minLength: 1, maxLength: 3 }), { nil: undefined })
    }),
    effectiveDates: fc.record({
      start: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
      end: fc.option(fc.date({ min: new Date('2025-01-02'), max: new Date('2030-01-01') }), { nil: undefined })
    }),
    sourceDocuments: fc.constant(sourceDocIds),
    validationLogic: fc.constant((target: any) => ({ valid: true })),
    precedence: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined })
  });

  const genHolon = (type: HolonType) => fc.record({
    id: fc.uuid(),
    type: fc.constant(type),
    properties: fc.dictionary(fc.string(), fc.anything()),
    createdAt: fc.date(),
    createdBy: fc.uuid(),
    status: fc.constantFrom('active' as const, 'inactive' as const),
    sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
  });

  const genRelationship = (type: RelationshipType) => fc.record({
    id: fc.uuid(),
    type: fc.constant(type),
    sourceHolonID: fc.uuid(),
    targetHolonID: fc.uuid(),
    properties: fc.dictionary(fc.string(), fc.anything()),
    effectiveStart: fc.date(),
    effectiveEnd: fc.option(fc.date(), { nil: undefined }),
    sourceSystem: fc.string(),
    sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 }),
    createdBy: fc.uuid(),
    authorityLevel: fc.constantFrom('authoritative' as const, 'derived' as const, 'inferred' as const),
    confidenceScore: fc.option(fc.float({ min: 0, max: 1 }), { nil: undefined })
  });

const genEvent = (type: EventType) => fc.record({
  id: fc.uuid(),
  type: fc.constant(type),
  occurredAt: fc.date(),
  recordedAt: fc.date(),
  actor: fc.uuid(),
  subjects: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
  payload: fc.dictionary(fc.string(), fc.anything()),
  sourceSystem: fc.string(),
  sourceDocument: fc.option(fc.uuid(), { nil: undefined }),
  validityWindow: fc.option(fc.record({
    start: fc.date(),
    end: fc.date()
  }), { nil: undefined }),
  causalLinks: fc.record({
    precededBy: fc.option(fc.array(fc.uuid()), { nil: undefined }),
    causedBy: fc.option(fc.array(fc.uuid()), { nil: undefined }),
    groupedWith: fc.option(fc.array(fc.uuid()), { nil: undefined })
  })
});

describe('Constraint Engine - Property-Based Tests', () => {
  let documentRegistry: DocumentRegistry;
  let constraintEngine: ConstraintEngine;

  beforeEach(() => {
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
  });

  /**
   * **Feature: semantic-operating-model, Property 14: Constraint document linkage**
   * **Validates: Requirements 4.1**
   * 
   * For any constraint, it must be linked to at least one defining document with complete metadata.
   */
  describe('Property 14: Constraint document linkage', () => {
    it('should link every constraint to at least one source document', () => {
      fc.assert(
        fc.property(
          fc.array(genDocument(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (docParams, numConstraints) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register documents
            const docIds = docParams.map(params => 
              docRegistry.registerDocument(params, 'test-event-id').id
            );

            // Create constraints with document linkage
            return fc.sample(genConstraintParams(docIds), numConstraints).every(constraintParams => {
              const constraintId = engine.registerConstraint(constraintParams);
              const constraint = engine.getConstraint(constraintId);

              // Verify constraint has at least one source document
              return constraint !== undefined && 
                     constraint.sourceDocuments.length > 0;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain bidirectional linkage between constraints and documents', () => {
      fc.assert(
        fc.property(
          fc.array(genDocument(), { minLength: 2, maxLength: 5 }),
          (docParams) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register documents
            const docIds = docParams.map(params => 
              docRegistry.registerDocument(params, 'test-event-id').id
            );

            // Create constraint linked to these documents
            const constraintParams = fc.sample(genConstraintParams(docIds), 1)[0];
            const constraintId = engine.registerConstraint(constraintParams);

            // Verify document registry has the linkage
            for (const docId of docIds) {
              const linkage = docRegistry.getDocumentLinkage(docId);
              if (!linkage || !linkage.linkedConstraintIds?.includes(constraintId)) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve document linkage metadata for all constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.array(
            fc.constantFrom(...Object.values(ConstraintType)),
            { minLength: 3, maxLength: 10 }
          ),
          (docParams, constraintTypes) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register a document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create multiple constraints linked to this document
            const constraintIds = constraintTypes.map(type => {
              const params = fc.sample(genConstraintParams([doc.id]), 1)[0];
              return engine.registerConstraint({ ...params, type });
            });

            // Verify all constraints are linked to the document
            const linkage = docRegistry.getDocumentLinkage(doc.id);
            
            return linkage !== undefined &&
                   linkage.linkedConstraintIds !== undefined &&
                   constraintIds.every(id => linkage.linkedConstraintIds!.includes(id));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow querying documents that define a constraint', () => {
      fc.assert(
        fc.property(
          fc.array(genDocument(), { minLength: 1, maxLength: 3 }),
          (docParams) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register documents
            const docIds = docParams.map(params => 
              docRegistry.registerDocument(params, 'test-event-id').id
            );

            // Create constraint
            const constraintParams = fc.sample(genConstraintParams(docIds), 1)[0];
            const constraintId = engine.registerConstraint(constraintParams);

            // Query documents defining this constraint
            const definingDocs = docRegistry.getDocumentsDefiningConstraint(constraintId);

            // Should return all source documents
            return definingDocs.length === docIds.length &&
                   definingDocs.every(doc => docIds.includes(doc.id));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


  /**
   * **Feature: semantic-operating-model, Property 15: Holon constraint validation**
   * **Validates: Requirements 4.2**
   * 
   * For any holon creation or modification that violates applicable constraints,
   * the SOM must reject the operation.
   */
  describe('Property 15: Holon constraint validation', () => {
    it('should reject holons that violate structural constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, holonType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a constraint that always fails
            const constraintId = engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Test Structural Constraint',
              definition: 'Holons must have a specific property',
              scope: { holonTypes: [holonType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: (target: any) => ({
                valid: false,
                errors: [{
                  constraintID: 'test-constraint',
                  message: 'Missing required property',
                  violatedRule: 'Test rule',
                  affectedHolons: [target.id]
                }]
              })
            });

            // Generate a holon of the constrained type
            const holon = fc.sample(genHolon(holonType), 1)[0] as Holon;

            // Validate the holon
            const result = engine.validateHolon(holon);

            // Should be invalid
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept holons that satisfy all applicable constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, holonType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a constraint that always passes
            engine.registerConstraint({
              type: ConstraintType.Policy,
              name: 'Test Policy Constraint',
              definition: 'Holons must be valid',
              scope: { holonTypes: [holonType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({ valid: true })
            });

            // Generate a holon of the constrained type
            const holon = fc.sample(genHolon(holonType), 1)[0] as Holon;

            // Validate the holon
            const result = engine.validateHolon(holon);

            // Should be valid
            return result.valid && 
                   (result.errors === undefined || result.errors.length === 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate holons against multiple applicable constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          fc.integer({ min: 2, max: 5 }),
          (docParams, holonType, numConstraints) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create multiple constraints, some pass, some fail
            let expectedFailures = 0;
            for (let i = 0; i < numConstraints; i++) {
              const shouldFail = i % 2 === 0;
              if (shouldFail) expectedFailures++;

              engine.registerConstraint({
                type: ConstraintType.Structural,
                name: `Test Constraint ${i}`,
                definition: `Test constraint ${i}`,
                scope: { holonTypes: [holonType] },
                effectiveDates: { start: new Date('2020-01-01') },
                sourceDocuments: [doc.id],
                validationLogic: (target: any) => shouldFail ? {
                  valid: false,
                  errors: [{
                    constraintID: `constraint-${i}`,
                    message: `Constraint ${i} failed`,
                    violatedRule: `Rule ${i}`,
                    affectedHolons: [target.id]
                  }]
                } : { valid: true }
              });
            }

            // Generate a holon
            const holon = fc.sample(genHolon(holonType), 1)[0] as Holon;

            // Validate
            const result = engine.validateHolon(holon);

            // Should have errors equal to expected failures
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length === expectedFailures;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only apply constraints effective at validation timestamp', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, holonType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraint effective in the future
            engine.registerConstraint({
              type: ConstraintType.Temporal,
              name: 'Future Constraint',
              definition: 'This constraint is not yet effective',
              scope: { holonTypes: [holonType] },
              effectiveDates: { 
                start: new Date('2030-01-01'),
                end: new Date('2035-01-01')
              },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'future-constraint',
                  message: 'Should not be applied',
                  violatedRule: 'Future rule',
                  affectedHolons: []
                }]
              })
            });

            // Generate a holon
            const holon = fc.sample(genHolon(holonType), 1)[0] as Holon;

            // Validate with current timestamp (2024)
            const result = engine.validateHolon(holon, { 
              timestamp: new Date('2024-01-01') 
            });

            // Should be valid because constraint is not yet effective
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply constraints to correct holon types only', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, constrainedType, otherType) => {
            // Skip if types are the same
            if (constrainedType === otherType) return true;

            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraint for specific type
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Type-Specific Constraint',
              definition: 'Only applies to specific type',
              scope: { holonTypes: [constrainedType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'type-constraint',
                  message: 'Type constraint failed',
                  violatedRule: 'Type rule',
                  affectedHolons: []
                }]
              })
            });

            // Generate holon of different type
            const holon = fc.sample(genHolon(otherType), 1)[0] as Holon;

            // Validate
            const result = engine.validateHolon(holon);

            // Should be valid because constraint doesn't apply to this type
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: semantic-operating-model, Property 7: Relationship constraint enforcement**
   * **Validates: Requirements 2.2, 2.5, 4.3**
   * 
   * For any relationship that violates eligibility, capacity, or policy constraints,
   * the SOM must reject its creation.
   */
  describe('Property 7: Relationship constraint enforcement', () => {
    it('should reject relationships that violate eligibility constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(RelationshipType)),
          (docParams, relType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create an eligibility constraint that always fails
            engine.registerConstraint({
              type: ConstraintType.Eligibility,
              name: 'Eligibility Constraint',
              definition: 'Relationships must meet eligibility criteria',
              scope: { relationshipTypes: [relType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: (target: any) => ({
                valid: false,
                errors: [{
                  constraintID: 'eligibility-constraint',
                  message: 'Eligibility criteria not met',
                  violatedRule: 'Eligibility rule',
                  affectedHolons: [target.sourceHolonID, target.targetHolonID]
                }]
              })
            });

            // Create a relationship of the same type manually
            const relationship: Relationship = {
              id: 'test-rel-id',
              type: relType,
              sourceHolonID: 'source-holon',
              targetHolonID: 'target-holon',
              properties: {},
              effectiveStart: new Date('2024-01-01'),
              sourceSystem: 'test-system',
              sourceDocuments: [doc.id],
              createdBy: 'test-event',
              authorityLevel: 'authoritative'
            };

            // Validate the relationship
            const result = engine.validateRelationship(relationship);

            // Should be invalid
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject relationships that violate capacity constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(RelationshipType)),
          (docParams, relType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a capacity constraint that always fails
            engine.registerConstraint({
              type: ConstraintType.Capacity,
              name: 'Capacity Constraint',
              definition: 'Relationships must not exceed capacity limits',
              scope: { relationshipTypes: [relType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: (target: any) => ({
                valid: false,
                errors: [{
                  constraintID: 'capacity-constraint',
                  message: 'Capacity limit exceeded',
                  violatedRule: 'Capacity rule',
                  affectedHolons: [target.sourceHolonID]
                }]
              })
            });

            // Create a relationship of the same type manually
            const relationship: Relationship = {
              id: 'test-rel-id',
              type: relType,
              sourceHolonID: 'source-holon',
              targetHolonID: 'target-holon',
              properties: {},
              effectiveStart: new Date('2024-01-01'),
              sourceSystem: 'test-system',
              sourceDocuments: [doc.id],
              createdBy: 'test-event',
              authorityLevel: 'authoritative'
            };

            // Validate the relationship
            const result = engine.validateRelationship(relationship);

            // Should be invalid
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject relationships that violate policy constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(RelationshipType)),
          (docParams, relType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a policy constraint that always fails
            engine.registerConstraint({
              type: ConstraintType.Policy,
              name: 'Policy Constraint',
              definition: 'Relationships must comply with policy',
              scope: { relationshipTypes: [relType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: (target: any) => ({
                valid: false,
                errors: [{
                  constraintID: 'policy-constraint',
                  message: 'Policy violation',
                  violatedRule: 'Policy rule',
                  affectedHolons: [target.sourceHolonID, target.targetHolonID]
                }]
              })
            });

            // Create a relationship of the same type manually
            const relationship: Relationship = {
              id: 'test-rel-id',
              type: relType,
              sourceHolonID: 'source-holon',
              targetHolonID: 'target-holon',
              properties: {},
              effectiveStart: new Date('2024-01-01'),
              sourceSystem: 'test-system',
              sourceDocuments: [doc.id],
              createdBy: 'test-event',
              authorityLevel: 'authoritative'
            };

            // Validate the relationship
            const result = engine.validateRelationship(relationship);

            // Should be invalid
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept relationships that satisfy all constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(RelationshipType)),
          (docParams, relType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraints that all pass
            [ConstraintType.Eligibility, ConstraintType.Capacity, ConstraintType.Policy].forEach(type => {
              engine.registerConstraint({
                type,
                name: `${type} Constraint`,
                definition: `${type} constraint that passes`,
                scope: { relationshipTypes: [relType] },
                effectiveDates: { start: new Date('2020-01-01') },
                sourceDocuments: [doc.id],
                validationLogic: () => ({ valid: true })
              });
            });

            // Create a relationship of the same type manually
            const relationship: Relationship = {
              id: 'test-rel-id',
              type: relType,
              sourceHolonID: 'source-holon',
              targetHolonID: 'target-holon',
              properties: {},
              effectiveStart: new Date('2024-01-01'),
              sourceSystem: 'test-system',
              sourceDocuments: [doc.id],
              createdBy: 'test-event',
              authorityLevel: 'authoritative'
            };

            // Validate the relationship
            const result = engine.validateRelationship(relationship);

            // Should be valid
            return result.valid && 
                   (result.errors === undefined || result.errors.length === 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate relationships at their effective start timestamp', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(RelationshipType)),
          (docParams, relType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraint effective only in the past
            engine.registerConstraint({
              type: ConstraintType.Temporal,
              name: 'Past Constraint',
              definition: 'Only effective in the past',
              scope: { relationshipTypes: [relType] },
              effectiveDates: { 
                start: new Date('2020-01-01'),
                end: new Date('2021-01-01')
              },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'past-constraint',
                  message: 'Past constraint failed',
                  violatedRule: 'Past rule',
                  affectedHolons: []
                }]
              })
            });

            // Create a relationship with future effective start
            const relationship: Relationship = {
              id: 'test-rel-id',
              type: relType,
              sourceHolonID: 'source-holon',
              targetHolonID: 'target-holon',
              properties: {},
              effectiveStart: new Date('2024-01-01'),
              sourceSystem: 'test-system',
              sourceDocuments: [doc.id],
              createdBy: 'test-event',
              authorityLevel: 'authoritative'
            };

            // Validate the relationship (uses effectiveStart as timestamp)
            const result = engine.validateRelationship(relationship);

            // Should be valid because constraint is not effective at relationship start
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply constraints to correct relationship types only', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(RelationshipType)),
          fc.constantFrom(...Object.values(RelationshipType)),
          (docParams, constrainedType, otherType) => {
            // Skip if types are the same
            if (constrainedType === otherType) return true;

            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraint for specific type
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Type-Specific Constraint',
              definition: 'Only applies to specific type',
              scope: { relationshipTypes: [constrainedType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'type-constraint',
                  message: 'Type constraint failed',
                  violatedRule: 'Type rule',
                  affectedHolons: []
                }]
              })
            });

            // Create relationship of different type
            const relationship: Relationship = {
              id: 'test-rel-id',
              type: otherType,
              sourceHolonID: 'source-holon',
              targetHolonID: 'target-holon',
              properties: {},
              effectiveStart: new Date('2024-01-01'),
              sourceSystem: 'test-system',
              sourceDocuments: [doc.id],
              createdBy: 'test-event',
              authorityLevel: 'authoritative'
            };

            // Validate
            const result = engine.validateRelationship(relationship);

            // Should be valid because constraint doesn't apply to this type
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // Debug test to verify constraint registration
  describe('Debug: Constraint Registration', () => {
    it('should register and retrieve relationship constraints', () => {
      const docRegistry = new DocumentRegistry();
      const engine = new ConstraintEngine(docRegistry);

      const doc = docRegistry.registerDocument({
        referenceNumbers: ['TEST-001'],
        title: 'Test Document',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2020-01-01') },
        classificationMetadata: 'UNCLASSIFIED'
      }, 'test-event');

      const constraintId = engine.registerConstraint({
        type: ConstraintType.Eligibility,
        name: 'Test Constraint',
        definition: 'Test',
        scope: { relationshipTypes: [RelationshipType.CONTAINS] },
        effectiveDates: { start: new Date('2020-01-01') },
        sourceDocuments: [doc.id],
        validationLogic: () => ({ valid: false, errors: [{ constraintID: 'test', message: 'fail', violatedRule: 'rule', affectedHolons: [] }] })
      });

      const constraint = engine.getConstraint(constraintId);
      expect(constraint).toBeDefined();
      expect(constraint?.scope.relationshipTypes).toContain(RelationshipType.CONTAINS);

      const applicable = engine.getApplicableRelationshipConstraints(RelationshipType.CONTAINS);
      expect(applicable.length).toBe(1);

      const relationship: Relationship = {
        id: 'test-rel',
        type: RelationshipType.CONTAINS,
        sourceHolonID: 'source',
        targetHolonID: 'target',
        properties: {},
        effectiveStart: new Date(),
        sourceSystem: 'test',
        sourceDocuments: [],
        createdBy: 'test',
        authorityLevel: 'authoritative'
      };

      const result = engine.validateRelationship(relationship);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });


  /**
   * **Feature: semantic-operating-model, Property 12: Event pre-validation**
   * **Validates: Requirements 3.2, 4.4, 15.1**
   * 
   * For any event that violates constraints, the SOM must reject it before it enters the event store.
   */
  describe('Property 12: Event pre-validation', () => {
    it('should reject events that violate constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(EventType)),
          (docParams, eventType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a constraint that always fails for this event type
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Event Constraint',
              definition: 'Events must meet structural requirements',
              scope: { eventTypes: [eventType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: (target: any) => ({
                valid: false,
                errors: [{
                  constraintID: 'event-constraint',
                  message: 'Event validation failed',
                  violatedRule: 'Event rule',
                  affectedHolons: target.subjects || []
                }]
              })
            });

            // Create an event of the same type
            const event: Event = {
              id: 'test-event-id',
              type: eventType,
              occurredAt: new Date('2024-01-01'),
              recordedAt: new Date('2024-01-01'),
              actor: 'test-actor',
              subjects: ['subject-1', 'subject-2'],
              payload: {},
              sourceSystem: 'test-system',
              causalLinks: {}
            };

            // Validate the event
            const result = engine.validateEvent(event);

            // Should be invalid
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept events that satisfy all constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(EventType)),
          (docParams, eventType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a constraint that always passes
            engine.registerConstraint({
              type: ConstraintType.Policy,
              name: 'Event Policy Constraint',
              definition: 'Events must comply with policy',
              scope: { eventTypes: [eventType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({ valid: true })
            });

            // Create an event of the same type
            const event: Event = {
              id: 'test-event-id',
              type: eventType,
              occurredAt: new Date('2024-01-01'),
              recordedAt: new Date('2024-01-01'),
              actor: 'test-actor',
              subjects: ['subject-1'],
              payload: {},
              sourceSystem: 'test-system',
              causalLinks: {}
            };

            // Validate the event
            const result = engine.validateEvent(event);

            // Should be valid
            return result.valid && 
                   (result.errors === undefined || result.errors.length === 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate events at their occurred timestamp', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(EventType)),
          (docParams, eventType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraint effective only in the past
            engine.registerConstraint({
              type: ConstraintType.Temporal,
              name: 'Past Event Constraint',
              definition: 'Only effective in the past',
              scope: { eventTypes: [eventType] },
              effectiveDates: { 
                start: new Date('2020-01-01'),
                end: new Date('2021-01-01')
              },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'past-event-constraint',
                  message: 'Past constraint failed',
                  violatedRule: 'Past rule',
                  affectedHolons: []
                }]
              })
            });

            // Create an event with future occurred timestamp
            const event: Event = {
              id: 'test-event-id',
              type: eventType,
              occurredAt: new Date('2024-01-01'),
              recordedAt: new Date('2024-01-01'),
              actor: 'test-actor',
              subjects: ['subject-1'],
              payload: {},
              sourceSystem: 'test-system',
              causalLinks: {}
            };

            // Validate the event (uses occurredAt as timestamp)
            const result = engine.validateEvent(event);

            // Should be valid because constraint is not effective at event time
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply constraints to correct event types only', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(EventType)),
          fc.constantFrom(...Object.values(EventType)),
          (docParams, constrainedType, otherType) => {
            // Skip if types are the same
            if (constrainedType === otherType) return true;

            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create constraint for specific type
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Type-Specific Event Constraint',
              definition: 'Only applies to specific event type',
              scope: { eventTypes: [constrainedType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'type-constraint',
                  message: 'Type constraint failed',
                  violatedRule: 'Type rule',
                  affectedHolons: []
                }]
              })
            });

            // Create event of different type
            const event: Event = {
              id: 'test-event-id',
              type: otherType,
              occurredAt: new Date('2024-01-01'),
              recordedAt: new Date('2024-01-01'),
              actor: 'test-actor',
              subjects: ['subject-1'],
              payload: {},
              sourceSystem: 'test-system',
              causalLinks: {}
            };

            // Validate
            const result = engine.validateEvent(event);

            // Should be valid because constraint doesn't apply to this type
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate events against multiple applicable constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(EventType)),
          fc.integer({ min: 2, max: 5 }),
          (docParams, eventType, numConstraints) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create multiple constraints, some pass, some fail
            let expectedFailures = 0;
            for (let i = 0; i < numConstraints; i++) {
              const shouldFail = i % 2 === 0;
              if (shouldFail) expectedFailures++;

              engine.registerConstraint({
                type: ConstraintType.Structural,
                name: `Event Constraint ${i}`,
                definition: `Event constraint ${i}`,
                scope: { eventTypes: [eventType] },
                effectiveDates: { start: new Date('2020-01-01') },
                sourceDocuments: [doc.id],
                validationLogic: (target: any) => shouldFail ? {
                  valid: false,
                  errors: [{
                    constraintID: `constraint-${i}`,
                    message: `Constraint ${i} failed`,
                    violatedRule: `Rule ${i}`,
                    affectedHolons: target.subjects || []
                  }]
                } : { valid: true }
              });
            }

            // Create an event
            const event: Event = {
              id: 'test-event-id',
              type: eventType,
              occurredAt: new Date('2024-01-01'),
              recordedAt: new Date('2024-01-01'),
              actor: 'test-actor',
              subjects: ['subject-1'],
              payload: {},
              sourceSystem: 'test-system',
              causalLinks: {}
            };

            // Validate
            const result = engine.validateEvent(event);

            // Should have errors equal to expected failures
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length === expectedFailures;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: semantic-operating-model, Property 16: Constraint inheritance**
   * **Validates: Requirements 4.5**
   * 
   * For any holon in a hierarchy with inherited constraints, the SOM must apply inherited
   * constraints with correct precedence for overrides.
   */
  describe('Property 16: Constraint inheritance', () => {
    it('should apply inherited constraints to child holon types', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, parentType, childType) => {
            // Skip if types are the same
            if (parentType === childType) return true;

            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create a constraint that applies to parent and can be inherited
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Inherited Constraint',
              definition: 'This constraint is inherited by child types',
              scope: { holonTypes: [parentType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: (target: any) => ({
                valid: false,
                errors: [{
                  constraintID: 'inherited-constraint',
                  message: 'Inherited constraint failed',
                  violatedRule: 'Inherited rule',
                  affectedHolons: [target.id]
                }]
              }),
              precedence: 10,
              inheritanceRules: {
                inheritsFrom: [childType],
                canOverride: true,
                overridePrecedence: 5
              }
            });

            // Create a holon of the child type
            const holon: Holon = {
              id: 'test-holon-id',
              type: childType,
              properties: {},
              createdAt: new Date('2024-01-01'),
              createdBy: 'test-event',
              status: 'active',
              sourceDocuments: [doc.id]
            };

            // Validate the holon
            const result = engine.validateHolon(holon);

            // Should be invalid because inherited constraint applies
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow direct constraints to override inherited constraints with higher precedence', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, parentType, childType) => {
            // Skip if types are the same
            if (parentType === childType) return true;

            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create an inherited constraint that fails
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Inherited Constraint',
              definition: 'This constraint is inherited',
              scope: { holonTypes: [parentType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'inherited-constraint',
                  message: 'Inherited constraint failed',
                  violatedRule: 'Inherited rule',
                  affectedHolons: []
                }]
              }),
              precedence: 5,
              inheritanceRules: {
                inheritsFrom: [childType],
                canOverride: true,
                overridePrecedence: 5
              }
            });

            // Create a direct constraint with higher precedence that passes
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Inherited Constraint', // Same name to override
              definition: 'This constraint overrides the inherited one',
              scope: { holonTypes: [childType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({ valid: true }),
              precedence: 10 // Higher precedence
            });

            // Create a holon of the child type
            const holon: Holon = {
              id: 'test-holon-id',
              type: childType,
              properties: {},
              createdAt: new Date('2024-01-01'),
              createdBy: 'test-event',
              status: 'active',
              sourceDocuments: [doc.id]
            };

            // Validate the holon
            const result = engine.validateHolon(holon);

            // Should be valid because direct constraint overrides inherited one
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect precedence rules when merging inherited and direct constraints', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, holonType) => {
            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create multiple constraints with different precedence levels
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Low Precedence Constraint',
              definition: 'Low precedence',
              scope: { holonTypes: [holonType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'low-precedence',
                  message: 'Low precedence failed',
                  violatedRule: 'Low rule',
                  affectedHolons: []
                }]
              }),
              precedence: 1
            });

            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'High Precedence Constraint',
              definition: 'High precedence',
              scope: { holonTypes: [holonType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'high-precedence',
                  message: 'High precedence failed',
                  violatedRule: 'High rule',
                  affectedHolons: []
                }]
              }),
              precedence: 100
            });

            // Create a holon
            const holon: Holon = {
              id: 'test-holon-id',
              type: holonType,
              properties: {},
              createdAt: new Date('2024-01-01'),
              createdBy: 'test-event',
              status: 'active',
              sourceDocuments: [doc.id]
            };

            // Validate the holon
            const result = engine.validateHolon(holon);

            // Should have errors from both constraints
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length === 2;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow override when inheritanceRules.canOverride is false', () => {
      fc.assert(
        fc.property(
          genDocument(),
          fc.constantFrom(...Object.values(HolonType)),
          fc.constantFrom(...Object.values(HolonType)),
          (docParams, parentType, childType) => {
            // Skip if types are the same
            if (parentType === childType) return true;

            const docRegistry = new DocumentRegistry();
            const engine = new ConstraintEngine(docRegistry);

            // Register document
            const doc = docRegistry.registerDocument(docParams, 'test-event-id');

            // Create an inherited constraint that cannot be overridden
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Non-Overridable Constraint',
              definition: 'This constraint cannot be overridden',
              scope: { holonTypes: [parentType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({
                valid: false,
                errors: [{
                  constraintID: 'non-overridable',
                  message: 'Non-overridable constraint failed',
                  violatedRule: 'Non-overridable rule',
                  affectedHolons: []
                }]
              }),
              precedence: 5,
              inheritanceRules: {
                inheritsFrom: [childType],
                canOverride: false
              }
            });

            // Try to create a direct constraint with same name
            engine.registerConstraint({
              type: ConstraintType.Structural,
              name: 'Non-Overridable Constraint', // Same name
              definition: 'Attempting to override',
              scope: { holonTypes: [childType] },
              effectiveDates: { start: new Date('2020-01-01') },
              sourceDocuments: [doc.id],
              validationLogic: () => ({ valid: true }),
              precedence: 100 // Higher precedence but shouldn't matter
            });

            // Create a holon of the child type
            const holon: Holon = {
              id: 'test-holon-id',
              type: childType,
              properties: {},
              createdAt: new Date('2024-01-01'),
              createdBy: 'test-event',
              status: 'active',
              sourceDocuments: [doc.id]
            };

            // Validate the holon
            const result = engine.validateHolon(holon);

            // Should be invalid because inherited constraint cannot be overridden
            return !result.valid && 
                   result.errors !== undefined && 
                   result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
