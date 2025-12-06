/**
 * Property-based tests for Organization Management
 * Tests validate correctness properties for Position and Organization holons and relationships
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  OrganizationManager,
  CreatePositionParams,
  CreateOrganizationParams,
  CreateOrganizationHierarchyParams,
} from './index';
import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { EventStore, InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType, HolonID } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';

// Test setup
let holonRegistry: HolonRegistry;
let documentRegistry: DocumentRegistry;
let constraintEngine: ConstraintEngine;
let eventStore: EventStore;
let relationshipRegistry: RelationshipRegistry;
let organizationManager: OrganizationManager;

beforeEach(() => {
  holonRegistry = new HolonRegistry();
  documentRegistry = new DocumentRegistry();
  constraintEngine = new ConstraintEngine(documentRegistry);
  eventStore = new InMemoryEventStore();
  relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
  organizationManager = new OrganizationManager(
    holonRegistry,
    relationshipRegistry,
    eventStore,
    constraintEngine
  );
});

// Generators for property-based testing

/**
 * Generate a document ID
 */
const genDocumentID = (): fc.Arbitrary<string> => {
  return fc.uuid();
};

/**
 * Generate a holon ID
 */
const genHolonID = (): fc.Arbitrary<HolonID> => {
  return fc.uuid();
};

/**
 * Generate billet IDs
 */
const genBilletIDs = (): fc.Arbitrary<string[]> => {
  return fc.array(
    fc.string({ minLength: 6, maxLength: 12 }).filter(s => /^[A-Z0-9-]+$/.test(s)),
    { minLength: 1, maxLength: 3 }
  );
};

/**
 * Generate a position title
 */
const genPositionTitle = (): fc.Arbitrary<string> => {
  return fc.constantFrom(
    'Team Leader',
    'Platoon Commander',
    'Operations Officer',
    'Intelligence Analyst',
    'Logistics Coordinator',
    'Training Officer',
    'Communications Specialist'
  );
};

/**
 * Generate a grade range
 */
const genGradeRange = (): fc.Arbitrary<{ min: string; max: string }> => {
  const grades = ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9', 'O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6'];
  return fc.tuple(
    fc.constantFrom(...grades),
    fc.constantFrom(...grades)
  ).map(([min, max]) => ({ min, max }));
};

/**
 * Generate designator expectations
 */
const genDesignatorExpectations = (): fc.Arbitrary<string[]> => {
  return fc.array(
    fc.constantFrom('SEAL', 'SWCC', 'EOD', 'SO', 'SB', 'ND'),
    { minLength: 1, maxLength: 3 }
  );
};

/**
 * Generate position criticality
 */
const genCriticality = (): fc.Arbitrary<'critical' | 'important' | 'standard'> => {
  return fc.constantFrom('critical', 'important', 'standard');
};

/**
 * Generate billet type
 */
const genBilletType = (): fc.Arbitrary<'command' | 'staff' | 'support'> => {
  return fc.constantFrom('command', 'staff', 'support');
};

/**
 * Generate valid CreatePositionParams
 */
const genCreatePositionParams = (): fc.Arbitrary<CreatePositionParams> => {
  return fc.record({
    billetIDs: genBilletIDs(),
    title: genPositionTitle(),
    gradeRange: genGradeRange(),
    designatorExpectations: genDesignatorExpectations(),
    criticality: genCriticality(),
    billetType: genBilletType(),
    sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
    actor: genHolonID(),
    sourceSystem: fc.constant('test-system'),
  });
};

/**
 * Generate UICs (Unit Identification Codes)
 */
const genUICs = (): fc.Arbitrary<string[]> => {
  return fc.array(
    fc.string({ minLength: 5, maxLength: 6 }).filter(s => /^[A-Z0-9]+$/.test(s)),
    { minLength: 1, maxLength: 2 }
  );
};

/**
 * Generate organization name
 */
const genOrganizationName = (): fc.Arbitrary<string> => {
  return fc.constantFrom(
    'Naval Special Warfare Command',
    'SEAL Team 1',
    'SEAL Team 2',
    'Special Boat Team 12',
    'Naval Special Warfare Group 1',
    'NSW Development Group',
    'Training Detachment'
  );
};

/**
 * Generate organization type
 */
const genOrganizationType = (): fc.Arbitrary<string> => {
  return fc.constantFrom('Command', 'Team', 'Group', 'Detachment', 'Unit', 'Squadron');
};

/**
 * Generate echelon level
 */
const genEchelonLevel = (): fc.Arbitrary<string> => {
  return fc.constantFrom('Strategic', 'Operational', 'Tactical', 'Unit');
};

/**
 * Generate mission statement
 */
const genMissionStatement = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length >= 20);
};

/**
 * Generate valid CreateOrganizationParams
 */
const genCreateOrganizationParams = (): fc.Arbitrary<CreateOrganizationParams> => {
  return fc.record({
    uics: genUICs(),
    name: genOrganizationName(),
    type: genOrganizationType(),
    echelonLevel: genEchelonLevel(),
    missionStatement: genMissionStatement(),
    sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
    actor: genHolonID(),
    sourceSystem: fc.constant('test-system'),
  });
};

/**
 * **Feature: semantic-operating-model, Property 21: Position holon completeness**
 * 
 * For any Position holon created, it must contain SOM Position ID, title, grade range, 
 * required qualifications, and criticality.
 * 
 * Validates: Requirements 6.1
 */
describe('Property 21: Position holon completeness', () => {
  test('created Position holons contain all required fields', () => {
    fc.assert(
      fc.property(genCreatePositionParams(), (params) => {
        const result = organizationManager.createPosition(params);
        
        // Position creation should succeed
        expect(result.success).toBe(true);
        expect(result.holonID).toBeDefined();
        
        // Retrieve the created position
        const position = holonRegistry.getHolon(result.holonID!);
        expect(position).toBeDefined();
        
        // Verify all required fields are present
        expect(position!.id).toBeDefined(); // SOM Position ID
        expect(position!.type).toBe(HolonType.Position);
        expect(position!.properties.billetIDs).toEqual(params.billetIDs);
        expect(position!.properties.title).toBe(params.title);
        expect(position!.properties.gradeRange).toEqual(params.gradeRange);
        expect(position!.properties.designatorExpectations).toEqual(params.designatorExpectations);
        expect(position!.properties.criticality).toBe(params.criticality);
        expect(position!.properties.billetType).toBe(params.billetType);
        
        // Verify metadata
        expect(position!.createdAt).toBeInstanceOf(Date);
        expect(position!.createdBy).toBeDefined();
        expect(position!.status).toBe('active');
        expect(position!.sourceDocuments).toEqual(params.sourceDocuments);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: semantic-operating-model, Property 22: Organization holon completeness**
 * 
 * For any Organization holon created, it must contain SOM Organization ID, UIC, type, 
 * and parent organization reference.
 * 
 * Validates: Requirements 6.2
 */
describe('Property 22: Organization holon completeness', () => {
  test('created Organization holons contain all required fields', () => {
    fc.assert(
      fc.property(genCreateOrganizationParams(), (params) => {
        const result = organizationManager.createOrganization(params);
        
        // Organization creation should succeed
        expect(result.success).toBe(true);
        expect(result.holonID).toBeDefined();
        
        // Retrieve the created organization
        const organization = holonRegistry.getHolon(result.holonID!);
        expect(organization).toBeDefined();
        
        // Verify all required fields are present
        expect(organization!.id).toBeDefined(); // SOM Organization ID
        expect(organization!.type).toBe(HolonType.Organization);
        expect(organization!.properties.uics).toEqual(params.uics);
        expect(organization!.properties.name).toBe(params.name);
        expect(organization!.properties.type).toBe(params.type);
        expect(organization!.properties.echelonLevel).toBe(params.echelonLevel);
        expect(organization!.properties.missionStatement).toBe(params.missionStatement);
        
        // Verify metadata
        expect(organization!.createdAt).toBeInstanceOf(Date);
        expect(organization!.createdBy).toBeDefined();
        expect(organization!.status).toBe('active');
        expect(organization!.sourceDocuments).toEqual(params.sourceDocuments);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: semantic-operating-model, Property 23: Organizational hierarchy validity**
 * 
 * For any set of Organization CONTAINS Organization relationships, they must form 
 * a valid tree structure without cycles.
 * 
 * Validates: Requirements 6.4
 */
describe('Property 23: Organizational hierarchy validity', () => {
  test('organizational hierarchies do not contain cycles', () => {
    fc.assert(
      fc.property(
        fc.array(genCreateOrganizationParams(), { minLength: 3, maxLength: 10 }),
        (orgParamsArray) => {
          // Create multiple organizations
          const organizations = orgParamsArray.map(params => {
            const result = organizationManager.createOrganization(params);
            expect(result.success).toBe(true);
            return result.holonID!;
          });

          // Create a valid hierarchy: org[0] -> org[1] -> org[2]
          if (organizations.length >= 3) {
            const hierarchy1 = organizationManager.createOrganizationHierarchy({
              parentOrganizationID: organizations[0],
              childOrganizationID: organizations[1],
              effectiveStart: new Date(),
              sourceDocuments: ['doc-001'],
              actor: 'system',
              sourceSystem: 'test-system',
            });
            expect(hierarchy1.success).toBe(true);

            const hierarchy2 = organizationManager.createOrganizationHierarchy({
              parentOrganizationID: organizations[1],
              childOrganizationID: organizations[2],
              effectiveStart: new Date(),
              sourceDocuments: ['doc-002'],
              actor: 'system',
              sourceSystem: 'test-system',
            });
            expect(hierarchy2.success).toBe(true);

            // Try to create a cycle: org[2] -> org[0] (should fail)
            const cycleAttempt = organizationManager.createOrganizationHierarchy({
              parentOrganizationID: organizations[2],
              childOrganizationID: organizations[0],
              effectiveStart: new Date(),
              sourceDocuments: ['doc-003'],
              actor: 'system',
              sourceSystem: 'test-system',
            });

            // Cycle creation should be rejected
            expect(cycleAttempt.success).toBe(false);
            expect(cycleAttempt.validation.valid).toBe(false);
            expect(cycleAttempt.validation.errors).toBeDefined();
            expect(cycleAttempt.validation.errors![0].violatedRule).toBe('no_cycles');

            // Try to create self-containment: org[0] -> org[0] (should fail)
            const selfContainment = organizationManager.createOrganizationHierarchy({
              parentOrganizationID: organizations[0],
              childOrganizationID: organizations[0],
              effectiveStart: new Date(),
              sourceDocuments: ['doc-004'],
              actor: 'system',
              sourceSystem: 'test-system',
            });

            // Self-containment should be rejected
            expect(selfContainment.success).toBe(false);
            expect(selfContainment.validation.valid).toBe(false);
            expect(selfContainment.validation.errors).toBeDefined();
            expect(selfContainment.validation.errors![0].violatedRule).toBe('no_self_containment');

            // Verify the valid hierarchy is intact
            const childOrgs = organizationManager.getChildOrganizations(organizations[0]);
            expect(childOrgs).toContain(organizations[1]);
            
            const grandchildOrgs = organizationManager.getChildOrganizations(organizations[1]);
            expect(grandchildOrgs).toContain(organizations[2]);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('complex organizational hierarchies remain acyclic', () => {
    fc.assert(
      fc.property(
        fc.array(genCreateOrganizationParams(), { minLength: 5, maxLength: 8 }),
        (orgParamsArray) => {
          // Create multiple organizations
          const organizations = orgParamsArray.map(params => {
            const result = organizationManager.createOrganization(params);
            expect(result.success).toBe(true);
            return result.holonID!;
          });

          if (organizations.length >= 5) {
            // Create a more complex hierarchy:
            //     org[0]
            //    /      \
            // org[1]   org[2]
            //   |        |
            // org[3]   org[4]

            const links = [
              { parent: 0, child: 1 },
              { parent: 0, child: 2 },
              { parent: 1, child: 3 },
              { parent: 2, child: 4 },
            ];

            // Create all valid links
            for (const link of links) {
              const result = organizationManager.createOrganizationHierarchy({
                parentOrganizationID: organizations[link.parent],
                childOrganizationID: organizations[link.child],
                effectiveStart: new Date(),
                sourceDocuments: [`doc-${link.parent}-${link.child}`],
                actor: 'system',
                sourceSystem: 'test-system',
              });
              expect(result.success).toBe(true);
            }

            // Try to create cycles at different levels
            const cycleAttempts = [
              { parent: 3, child: 0 }, // Deep cycle
              { parent: 4, child: 0 }, // Another deep cycle
              { parent: 1, child: 0 }, // Direct cycle
              { parent: 3, child: 1 }, // Intermediate cycle
            ];

            for (const attempt of cycleAttempts) {
              const result = organizationManager.createOrganizationHierarchy({
                parentOrganizationID: organizations[attempt.parent],
                childOrganizationID: organizations[attempt.child],
                effectiveStart: new Date(),
                sourceDocuments: [`doc-cycle-${attempt.parent}-${attempt.child}`],
                actor: 'system',
                sourceSystem: 'test-system',
              });

              // All cycle attempts should be rejected
              expect(result.success).toBe(false);
              expect(result.validation.valid).toBe(false);
              expect(result.validation.errors).toBeDefined();
              expect(result.validation.errors![0].violatedRule).toBe('no_cycles');
            }

            // Verify the hierarchy structure is correct
            const rootChildren = organizationManager.getChildOrganizations(organizations[0]);
            expect(rootChildren).toHaveLength(2);
            expect(rootChildren).toContain(organizations[1]);
            expect(rootChildren).toContain(organizations[2]);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
