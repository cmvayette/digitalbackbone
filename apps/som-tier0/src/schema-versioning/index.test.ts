/**
 * Property-based tests for Schema Versioning Engine
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  SchemaVersioningEngine,
  HolonTypeDefinition,
  RelationshipTypeDefinition,
  SchemaChangeProposal,
} from './index';
import { HolonType, DocumentID } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';

describe('Schema Versioning Engine - Property-Based Tests', () => {
  let engine: SchemaVersioningEngine;

  beforeEach(() => {
    engine = new SchemaVersioningEngine();
  });

  // Generator for change types
  const genChangeType = (): fc.Arbitrary<'breaking' | 'non-breaking'> => {
    return fc.constantFrom('breaking', 'non-breaking');
  };

  // Generator for schema change descriptions
  const genDescription = (): fc.Arbitrary<string> => {
    return fc.string({ minLength: 10, maxLength: 200 });
  };

  // Generator for document IDs
  const genDocumentID = (): fc.Arbitrary<DocumentID> => {
    return fc.uuid();
  };

  // Generator for holon type definitions
  const genHolonTypeDefinition = (schemaVersionId?: string): fc.Arbitrary<HolonTypeDefinition> => {
    return fc.record({
      type: fc.constantFrom(...Object.values(HolonType)),
      schemaVersion: fc.constant(schemaVersionId || 'temp-version-id'),
      requiredProperties: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
      optionalProperties: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
      description: fc.string({ minLength: 10, maxLength: 100 }),
      sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
      introducedInVersion: fc.constant('1.0'),
      deprecatedInVersion: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    });
  };

  // Generator for relationship type definitions
  const genRelationshipTypeDefinition = (schemaVersionId?: string): fc.Arbitrary<RelationshipTypeDefinition> => {
    return fc.record({
      type: fc.constantFrom(...Object.values(RelationshipType)),
      schemaVersion: fc.constant(schemaVersionId || 'temp-version-id'),
      sourceHolonTypes: fc.array(fc.constantFrom(...Object.values(HolonType)), { minLength: 1, maxLength: 3 }),
      targetHolonTypes: fc.array(fc.constantFrom(...Object.values(HolonType)), { minLength: 1, maxLength: 3 }),
      multiplicityConstraints: fc.option(
        fc.record({
          sourceMin: fc.option(fc.nat({ max: 10 }), { nil: undefined }),
          sourceMax: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
          targetMin: fc.option(fc.nat({ max: 10 }), { nil: undefined }),
          targetMax: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
        }),
        { nil: undefined }
      ),
      description: fc.string({ minLength: 10, maxLength: 100 }),
      sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
      introducedInVersion: fc.constant('1.0'),
      deprecatedInVersion: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    });
  };

  /**
   * **Feature: semantic-operating-model, Property 49: Schema version assignment**
   * **Validates: Requirements 17.1**
   * 
   * For any schema change, the SOM must assign a major version for breaking changes
   * and a minor version for non-breaking changes.
   */
  test('Property 49: Schema version assignment', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            changeType: genChangeType(),
            description: genDescription(),
            sourceDocument: fc.option(genDocumentID(), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (changes) => {
          // Create a fresh engine for each test run
          const testEngine = new SchemaVersioningEngine();
          
          // Track expected version numbers
          let expectedMajor = 1;
          let expectedMinor = 0;

          for (const change of changes) {
            const version = testEngine.createSchemaVersion(
              change.changeType,
              change.description,
              change.sourceDocument
            );

            // Update expected version based on change type
            if (change.changeType === 'breaking') {
              expectedMajor += 1;
              expectedMinor = 0;
            } else {
              expectedMinor += 1;
            }

            // Verify version assignment
            expect(version.majorVersion).toBe(expectedMajor);
            expect(version.minorVersion).toBe(expectedMinor);
            expect(version.versionString).toBe(`${expectedMajor}.${expectedMinor}`);
            expect(version.changeType).toBe(change.changeType);
            expect(version.description).toBe(change.description);
            
            if (change.sourceDocument) {
              expect(version.sourceDocument).toBe(change.sourceDocument);
            }

            // Verify the version is stored and retrievable
            const retrieved = testEngine.getVersion(version.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.versionString).toBe(version.versionString);
          }

          // Verify current version is the last one created
          const currentVersion = testEngine.getCurrentVersion();
          expect(currentVersion.majorVersion).toBe(expectedMajor);
          expect(currentVersion.minorVersion).toBe(expectedMinor);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: semantic-operating-model, Property 50: Type collision detection**
   * **Validates: Requirements 17.3**
   * 
   * For any new holon or relationship type proposed, the SOM must validate it against
   * existing types and reject if collisions are detected.
   */
  test('Property 50: Type collision detection', () => {
    fc.assert(
      fc.property(
        genHolonTypeDefinition(),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
        (initialDefinition, propertiesToRemove) => {
          // Create a fresh engine for each test run
          const testEngine = new SchemaVersioningEngine();
          
          // Register the initial definition
          const currentVersion = testEngine.getCurrentVersion();
          initialDefinition.schemaVersion = currentVersion.id;
          initialDefinition.introducedInVersion = currentVersion.versionString;
          initialDefinition.deprecatedInVersion = undefined; // Ensure not deprecated
          testEngine.registerHolonTypeDefinition(initialDefinition);

          // Create a proposed definition for the same type
          const proposedDefinition: HolonTypeDefinition = {
            ...initialDefinition,
            schemaVersion: currentVersion.id, // Same version - should cause collision
            requiredProperties: initialDefinition.requiredProperties.filter(
              prop => !propertiesToRemove.includes(prop)
            ),
            deprecatedInVersion: undefined, // Ensure not deprecated
          };

          // Detect collisions
          const collisions = testEngine.detectHolonTypeCollisions(proposedDefinition);

          // If the proposed definition is in the same version, there should be a collision
          const sameVersionCollision = collisions.find(
            c => c.collisionReason.includes('already exists in current schema version')
          );
          expect(sameVersionCollision).toBeDefined();

          // If required properties were removed, there should be a collision
          const removedProps = initialDefinition.requiredProperties.filter(
            prop => !proposedDefinition.requiredProperties.includes(prop) &&
                   !proposedDefinition.optionalProperties.includes(prop)
          );

          if (removedProps.length > 0) {
            const propertyCollisions = collisions.filter(
              c => c.collisionReason.includes('Required property') && c.collisionReason.includes('is being removed')
            );
            expect(propertyCollisions.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional unit tests for core functionality
  describe('Schema Version Creation', () => {
    test('should create initial version 1.0', () => {
      const currentVersion = engine.getCurrentVersion();
      expect(currentVersion.majorVersion).toBe(1);
      expect(currentVersion.minorVersion).toBe(0);
      expect(currentVersion.versionString).toBe('1.0');
    });

    test('should increment major version for breaking changes', () => {
      const v2 = engine.createSchemaVersion('breaking', 'Breaking change');
      expect(v2.majorVersion).toBe(2);
      expect(v2.minorVersion).toBe(0);
      expect(v2.versionString).toBe('2.0');
    });

    test('should increment minor version for non-breaking changes', () => {
      const v1_1 = engine.createSchemaVersion('non-breaking', 'Non-breaking change');
      expect(v1_1.majorVersion).toBe(1);
      expect(v1_1.minorVersion).toBe(1);
      expect(v1_1.versionString).toBe('1.1');
    });

    test('should reset minor version to 0 after major version increment', () => {
      engine.createSchemaVersion('non-breaking', 'Change 1');
      engine.createSchemaVersion('non-breaking', 'Change 2');
      const v2 = engine.createSchemaVersion('breaking', 'Breaking change');
      
      expect(v2.majorVersion).toBe(2);
      expect(v2.minorVersion).toBe(0);
    });

    test('should link versions through previousVersion', () => {
      const v1 = engine.getCurrentVersion();
      const v1_1 = engine.createSchemaVersion('non-breaking', 'Change 1');
      
      expect(v1_1.previousVersion).toBe(v1.id);
    });
  });

  describe('Type Definition Management', () => {
    test('should register holon type definitions', () => {
      const currentVersion = engine.getCurrentVersion();
      const definition: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name', 'edipi'],
        optionalProperties: ['dob'],
        description: 'Person holon type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerHolonTypeDefinition(definition);

      const definitions = engine.getHolonTypeDefinitions(HolonType.Person);
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual(definition);
    });

    test('should register relationship type definitions', () => {
      const currentVersion = engine.getCurrentVersion();
      const definition: RelationshipTypeDefinition = {
        type: RelationshipType.OCCUPIES,
        schemaVersion: currentVersion.id,
        sourceHolonTypes: [HolonType.Person],
        targetHolonTypes: [HolonType.Position],
        description: 'Person occupies position',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerRelationshipTypeDefinition(definition);

      const definitions = engine.getRelationshipTypeDefinitions(RelationshipType.OCCUPIES);
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual(definition);
    });

    test('should get current holon type definition', () => {
      const v1 = engine.getCurrentVersion();
      const def1: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: v1.id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Person v1',
        sourceDocuments: ['doc-1'],
        introducedInVersion: v1.versionString,
      };

      engine.registerHolonTypeDefinition(def1);

      const v2 = engine.createSchemaVersion('non-breaking', 'Add property');
      const def2: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: v2.id,
        requiredProperties: ['name', 'edipi'],
        optionalProperties: [],
        description: 'Person v2',
        sourceDocuments: ['doc-1'],
        introducedInVersion: v2.versionString,
      };

      engine.registerHolonTypeDefinition(def2);

      const current = engine.getCurrentHolonTypeDefinition(HolonType.Person);
      expect(current).toEqual(def2);
    });
  });

  describe('Type Collision Detection', () => {
    test('should detect collision when type exists in current version', () => {
      const currentVersion = engine.getCurrentVersion();
      const existing: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Existing person',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerHolonTypeDefinition(existing);

      const proposed: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name', 'edipi'],
        optionalProperties: [],
        description: 'Proposed person',
        sourceDocuments: ['doc-2'],
        introducedInVersion: currentVersion.versionString,
      };

      const collisions = engine.detectHolonTypeCollisions(proposed);
      expect(collisions.length).toBeGreaterThan(0);
      expect(collisions[0].collisionReason).toContain('already exists in current schema version');
    });

    test('should detect collision when required property is removed', () => {
      const currentVersion = engine.getCurrentVersion();
      const existing: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name', 'edipi'],
        optionalProperties: [],
        description: 'Existing person',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerHolonTypeDefinition(existing);

      const proposed: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name'], // Removed 'edipi'
        optionalProperties: [],
        description: 'Proposed person',
        sourceDocuments: ['doc-2'],
        introducedInVersion: currentVersion.versionString,
      };

      const collisions = engine.detectHolonTypeCollisions(proposed);
      const propertyCollision = collisions.find(c => c.collisionReason.includes('Required property'));
      expect(propertyCollision).toBeDefined();
    });

    test('should detect collision for relationship type in current version', () => {
      const currentVersion = engine.getCurrentVersion();
      const existing: RelationshipTypeDefinition = {
        type: RelationshipType.OCCUPIES,
        schemaVersion: currentVersion.id,
        sourceHolonTypes: [HolonType.Person],
        targetHolonTypes: [HolonType.Position],
        description: 'Existing relationship',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerRelationshipTypeDefinition(existing);

      const proposed: RelationshipTypeDefinition = {
        type: RelationshipType.OCCUPIES,
        schemaVersion: currentVersion.id,
        sourceHolonTypes: [HolonType.Person],
        targetHolonTypes: [HolonType.Position, HolonType.Organization],
        description: 'Proposed relationship',
        sourceDocuments: ['doc-2'],
        introducedInVersion: currentVersion.versionString,
      };

      const collisions = engine.detectRelationshipTypeCollisions(proposed);
      expect(collisions.length).toBeGreaterThan(0);
      expect(collisions[0].collisionReason).toContain('already exists in current schema version');
    });

    test('should not detect collision for deprecated types', () => {
      const currentVersion = engine.getCurrentVersion();
      const existing: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Deprecated person',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
        deprecatedInVersion: currentVersion.versionString,
      };

      engine.registerHolonTypeDefinition(existing);

      const proposed: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name', 'edipi'],
        optionalProperties: [],
        description: 'New person',
        sourceDocuments: ['doc-2'],
        introducedInVersion: currentVersion.versionString,
      };

      const collisions = engine.detectHolonTypeCollisions(proposed);
      // Should not have collision about existing in current version since it's deprecated
      const existsCollision = collisions.find(c => c.collisionReason.includes('already exists in current schema version'));
      expect(existsCollision).toBeUndefined();
    });
  });

  describe('Schema Change Proposals', () => {
    test('should create and approve proposals', () => {
      const currentVersion = engine.getCurrentVersion();
      const holonTypeDef: HolonTypeDefinition = {
        type: HolonType.Asset,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Asset type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        changeDescription: 'Add Asset holon type',
        isBreaking: false,
        holonTypeDefinition: holonTypeDef,
        sourceDocument: 'doc-1',
      });

      expect(proposal.status).toBe('proposed');

      engine.approveProposal(proposal.id);

      const approved = engine.getProposal(proposal.id);
      expect(approved?.status).toBe('approved');

      // Verify new version was created
      const newVersion = engine.getCurrentVersion();
      expect(newVersion.versionString).toBe('1.1');
    });

    test('should reject proposals', () => {
      const proposal = engine.createProposal({
        proposalType: 'add_holon_type',
        changeDescription: 'Add new type',
        isBreaking: false,
      });

      engine.rejectProposal(proposal.id);

      const rejected = engine.getProposal(proposal.id);
      expect(rejected?.status).toBe('rejected');
    });
  });

  describe('Type Deprecation', () => {
    test('should deprecate holon types', () => {
      const currentVersion = engine.getCurrentVersion();
      const definition: HolonTypeDefinition = {
        type: HolonType.Person,
        schemaVersion: currentVersion.id,
        requiredProperties: ['name'],
        optionalProperties: [],
        description: 'Person type',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerHolonTypeDefinition(definition);
      engine.deprecateHolonType(HolonType.Person);

      // Get all definitions (including deprecated ones) to verify deprecation
      const allDefinitions = engine.getHolonTypeDefinitions(HolonType.Person);
      expect(allDefinitions.length).toBe(1);
      expect(allDefinitions[0].deprecatedInVersion).toBe(currentVersion.versionString);
    });

    test('should deprecate relationship types', () => {
      const currentVersion = engine.getCurrentVersion();
      const definition: RelationshipTypeDefinition = {
        type: RelationshipType.OCCUPIES,
        schemaVersion: currentVersion.id,
        sourceHolonTypes: [HolonType.Person],
        targetHolonTypes: [HolonType.Position],
        description: 'Occupies relationship',
        sourceDocuments: ['doc-1'],
        introducedInVersion: currentVersion.versionString,
      };

      engine.registerRelationshipTypeDefinition(definition);
      engine.deprecateRelationshipType(RelationshipType.OCCUPIES);

      const definitions = engine.getRelationshipTypeDefinitions(RelationshipType.OCCUPIES);
      expect(definitions[0].deprecatedInVersion).toBe(currentVersion.versionString);
    });
  });
});
