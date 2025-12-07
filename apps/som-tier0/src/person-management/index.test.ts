/**
 * Property-based tests for Person Management
 * Tests validate correctness properties for Person holons and relationships
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PersonManager, CreatePersonParams, AssignPersonToPositionParams, AssignQualificationParams } from './index';
import { InMemoryHolonRepository as HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore, InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType, HolonID } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';

// Test setup
let holonRegistry: HolonRegistry;
let documentRegistry: DocumentRegistry;
let constraintEngine: ConstraintEngine;
let eventStore: EventStore;
let relationshipRegistry: RelationshipRegistry;
let personManager: PersonManager;

beforeEach(async () => {
  holonRegistry = new HolonRegistry();
  documentRegistry = new DocumentRegistry();
  constraintEngine = new ConstraintEngine(documentRegistry);
  eventStore = new InMemoryEventStore();
  relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
  personManager = new PersonManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);
});

// Generators for property-based testing

/**
 * Generate a valid EDIPI (10-digit number)
 */
const genEDIPI = (): fc.Arbitrary<string> => {
  return fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString());
};

/**
 * Generate service numbers
 */
const genServiceNumbers = (): fc.Arbitrary<string[]> => {
  return fc.array(
    fc.string({ minLength: 6, maxLength: 12 }).filter(s => /^[A-Z0-9]+$/.test(s)),
    { minLength: 1, maxLength: 3 }
  );
};

/**
 * Generate a person name
 */
const genPersonName = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0);
};

/**
 * Generate a date of birth (between 18 and 65 years ago)
 */
const genDOB = (): fc.Arbitrary<Date> => {
  const now = new Date();
  const minAge = 18;
  const maxAge = 65;
  const minDate = new Date(now.getFullYear() - maxAge, 0, 1);
  const maxDate = new Date(now.getFullYear() - minAge, 11, 31);

  return fc.date({ min: minDate, max: maxDate });
};

/**
 * Generate a service branch
 */
const genServiceBranch = (): fc.Arbitrary<string> => {
  return fc.constantFrom('Navy', 'Army', 'Air Force', 'Marines', 'Coast Guard', 'Space Force');
};

/**
 * Generate a designator/rating
 */
const genDesignatorRating = (): fc.Arbitrary<string> => {
  return fc.oneof(
    fc.constant('SEAL'),
    fc.constant('SWCC'),
    fc.constant('EOD'),
    fc.constant('SO'),
    fc.constant('SB'),
    fc.constant('ND')
  );
};

/**
 * Generate a person category
 */
const genPersonCategory = (): fc.Arbitrary<'active_duty' | 'reserve' | 'civilian' | 'contractor'> => {
  return fc.constantFrom('active_duty', 'reserve', 'civilian', 'contractor');
};

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
 * Generate valid CreatePersonParams
 */
const genCreatePersonParams = (): fc.Arbitrary<CreatePersonParams> => {
  return fc.record({
    edipi: genEDIPI(),
    serviceNumbers: genServiceNumbers(),
    name: genPersonName(),
    dob: genDOB(),
    serviceBranch: genServiceBranch(),
    designatorRating: genDesignatorRating(),
    category: genPersonCategory(),
    sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
    actor: genHolonID(),
    sourceSystem: fc.constant('test-system'),
  });
};

/**
 * **Feature: semantic-operating-model, Property 17: Person holon completeness**
 * 
 * For any Person holon created, it must contain SOM Person ID, EDIPI, 
 * service numbers, and demographics.
 * 
 * Validates: Requirements 5.1
 */
describe('Property 17: Person holon completeness', () => {
  test('created Person holons contain all required fields', () => {
    fc.assert(
      fc.asyncProperty(genCreatePersonParams(), async (params) => {
        // Setup isolated environment
        const holonRegistry = new HolonRegistry();
        const documentRegistry = new DocumentRegistry();
        const constraintEngine = new ConstraintEngine(documentRegistry);
        const eventStore = new InMemoryEventStore();
        const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
        const personManager = new PersonManager(
          holonRegistry,
          relationshipRegistry,
          eventStore,
          constraintEngine
        );

        const result = await personManager.createPerson(params);

        // Person creation should succeed
        expect(result.success).toBe(true);
        expect(result.personID).toBeDefined();

        // Retrieve the created person
        const person = await holonRegistry.getHolon(result.personID!);
        expect(person).toBeDefined();

        // Verify all required fields are present
        expect(person!.id).toBeDefined(); // SOM Person ID
        expect(person!.type).toBe(HolonType.Person);

        // Verify specific fields match input
        expect(person!.properties.edipi).toBe(params.edipi);
        expect(person!.properties.name).toBe(params.name);
        expect(person!.properties.email).toBe(params.email);
        expect(person!.properties.employeeId).toBe(params.employeeId);
        expect(person!.properties.serviceBranch).toBe(params.serviceBranch);
        expect(person!.properties.designatorRating).toBe(params.designatorRating);
        expect(person!.properties.category).toBe(params.category);
        expect(person!.properties.securityClearance).toBe(params.securityClearance);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: semantic-operating-model, Property 18: Assignment qualification validation**
 * 
 * For any Person OCCUPIES Position relationship where the person lacks required 
 * qualifications or grade, the SOM must reject the assignment.
 * 
 * Validates: Requirements 5.2, 6.5
 */
describe('Property 18: Assignment qualification validation', () => {
  test('assignment is rejected when person lacks required qualifications', () => {
    fc.assert(
      fc.asyncProperty(
        genCreatePersonParams(),
        genCreatePersonParams(), // For creating a second person with qualifications
        async (personParams, qualifiedPersonParams) => {
          // Setup isolated environment
          const holonRegistry = new HolonRegistry();
          const documentRegistry = new DocumentRegistry();
          const constraintEngine = new ConstraintEngine(documentRegistry);
          const eventStore = new InMemoryEventStore();
          const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
          const personManager = new PersonManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

          // Create a position with required qualifications
          const positionResult = await holonRegistry.createHolon({
            type: HolonType.Position,
            properties: {
              billetIDs: ['BILLET-001'],
              title: 'Team Leader',
              gradeRange: { min: 'E-6', max: 'E-8' },
              designatorExpectations: ['SEAL'],
              criticality: 'critical',
              billetType: 'command',
            },
            createdBy: 'event-001',
            sourceDocuments: ['doc-001'],
          });

          // Create a qualification
          const qualificationResult = await holonRegistry.createHolon({
            type: HolonType.Qualification,
            properties: {
              nec: '5326',
              name: 'Advanced Special Operations',
              type: 'NEC',
              validityPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
              renewalRules: 'Annual recertification required',
              issuingAuthority: 'NSWC',
            },
            createdBy: 'event-002',
            sourceDocuments: ['doc-002'],
          });

          // Link qualification as required for position
          await relationshipRegistry.createRelationship({
            type: RelationshipType.REQUIRED_FOR,
            sourceHolonID: qualificationResult.id,
            targetHolonID: positionResult.id,
            properties: {},
            effectiveStart: new Date(),
            sourceSystem: 'test-system',
            sourceDocuments: ['doc-003'],
            actor: 'system',
          });

          // Create a person WITHOUT the required qualification
          const personResult = await personManager.createPerson(personParams);
          expect(personResult.success).toBe(true);

          // Try to assign person to position - should fail
          const assignmentResult = await personManager.assignPersonToPosition({
            personID: personResult.personID!,
            positionID: positionResult.id,
            effectiveStart: new Date(),
            sourceDocuments: ['doc-004'],
            actor: 'system',
            sourceSystem: 'test-system',
          });

          // Assignment should be rejected
          expect(assignmentResult.success).toBe(false);
          expect(assignmentResult.validation.valid).toBe(false);
          expect(assignmentResult.validation.errors).toBeDefined();
          expect(assignmentResult.validation.errors![0].violatedRule).toBe('qualification_requirement');

          // Now create a qualified person
          const qualifiedPersonResult = await personManager.createPerson(qualifiedPersonParams);
          expect(qualifiedPersonResult.success).toBe(true);

          // Assign the qualification to the person
          const qualAssignmentResult = await personManager.assignQualification({
            personID: qualifiedPersonResult.personID!,
            qualificationID: qualificationResult.id,
            effectiveStart: new Date(),
            sourceDocuments: ['doc-005'],
            actor: 'system',
            sourceSystem: 'test-system',
          });
          expect(qualAssignmentResult.success).toBe(true);

          // Now try to assign qualified person to position - should succeed
          const qualifiedAssignmentResult = await personManager.assignPersonToPosition({
            personID: qualifiedPersonResult.personID!,
            positionID: positionResult.id,
            effectiveStart: new Date(),
            sourceDocuments: ['doc-006'],
            actor: 'system',
            sourceSystem: 'test-system',
          });

          // Assignment should succeed
          expect(qualifiedAssignmentResult.success).toBe(true);
          expect(qualifiedAssignmentResult.validation.valid).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: semantic-operating-model, Property 19: Qualification change tracking**
 * 
 * For any qualification gained or lost by a person, a qualification event must be 
 * recorded and the Person HAS_QUAL relationship must be updated.
 * 
 * Validates: Requirements 5.3
 */
describe('Property 19: Qualification change tracking', () => {
  test('qualification changes generate events and update relationships', () => {
    fc.assert(
      fc.asyncProperty(
        genCreatePersonParams(),
        async (personParams) => {
          // Setup isolated environment
          const holonRegistry = new HolonRegistry();
          const documentRegistry = new DocumentRegistry();
          const constraintEngine = new ConstraintEngine(documentRegistry);
          const eventStore = new InMemoryEventStore();
          const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
          const personManager = new PersonManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

          // Create a person
          const personResult = await personManager.createPerson(personParams);
          expect(personResult.success).toBe(true);
          const personID = personResult.personID!;

          // Create a qualification
          const qualificationResult = await holonRegistry.createHolon({
            type: HolonType.Qualification,
            properties: {
              nec: '5326',
              name: 'Advanced Special Operations',
              type: 'NEC',
              validityPeriod: 365 * 24 * 60 * 60 * 1000,
              renewalRules: 'Annual recertification required',
              issuingAuthority: 'NSWC',
            },
            createdBy: 'event-001',
            sourceDocuments: ['doc-001'],
          });
          const qualificationID = qualificationResult.id;

          // Get initial event count
          const initialEventCount = eventStore.getAllEvents().length;

          // Assign qualification to person
          const assignResult = await personManager.assignQualification({
            personID,
            qualificationID,
            effectiveStart: new Date(),
            sourceDocuments: ['doc-002'],
            actor: 'system',
            sourceSystem: 'test-system',
          });

          // Verify assignment succeeded
          expect(assignResult.success).toBe(true);
          expect(assignResult.relationshipID).toBeDefined();
          expect(assignResult.eventID).toBeDefined();

          // Verify event was generated
          const eventsAfterAssign = eventStore.getAllEvents();
          expect(eventsAfterAssign.length).toBeGreaterThan(initialEventCount);

          // Verify the qualification event exists
          const qualEvent = eventStore.getEvent(assignResult.eventID!);
          expect(qualEvent).toBeDefined();
          expect(qualEvent!.type).toBe('QualificationAwarded');
          expect(qualEvent!.subjects).toContain(personID);
          expect(qualEvent!.subjects).toContain(qualificationID);

          // Verify HAS_QUAL relationship exists
          const relationships = await relationshipRegistry.getRelationshipsFrom(
            personID,
            RelationshipType.HAS_QUAL
          );
          expect(relationships.length).toBeGreaterThan(0);
          const hasQualRel = relationships.find(r => r.targetHolonID === qualificationID);
          expect(hasQualRel).toBeDefined();
          expect(hasQualRel!.effectiveEnd).toBeUndefined(); // Still active

          // Now remove the qualification
          const removeResult = await personManager.removeQualification(
            personID,
            qualificationID,
            new Date(),
            'Expired',
            'system',
            'test-system'
          );

          // Verify removal succeeded
          expect(removeResult.success).toBe(true);
          expect(removeResult.eventID).toBeDefined();

          // Verify expiration event was generated
          const expireEvent = eventStore.getEvent(removeResult.eventID!);
          expect(expireEvent).toBeDefined();
          expect(expireEvent!.type).toBe('QualificationExpired');
          expect(expireEvent!.subjects).toContain(personID);
          expect(expireEvent!.subjects).toContain(qualificationID);

          // Verify relationship was updated (ended)
          const updatedRel = await relationshipRegistry.getRelationship(hasQualRel!.id);
          expect(updatedRel).toBeDefined();
          expect(updatedRel!.effectiveEnd).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: semantic-operating-model, Property 20: Concurrent position constraint enforcement**
 * 
 * For any person with multiple concurrent positions, the SOM must enforce maximum 
 * concurrent position constraints by type.
 * 
 * Validates: Requirements 5.5
 */
describe('Property 20: Concurrent position constraint enforcement', () => {
  test('concurrent position limits are enforced', () => {
    fc.assert(
      fc.asyncProperty(
        genCreatePersonParams(),
        fc.integer({ min: 1, max: 5 }), // Number of positions to create
        async (personParams, numPositions) => {
          // Setup isolated environment
          const holonRegistry = new HolonRegistry();
          const documentRegistry = new DocumentRegistry();
          const constraintEngine = new ConstraintEngine(documentRegistry);
          const eventStore = new InMemoryEventStore();
          const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
          const personManager = new PersonManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

          // Create a person
          const personResult = await personManager.createPerson(personParams);
          expect(personResult.success).toBe(true);
          const personID = personResult.personID!;

          // Create multiple positions
          const positions: string[] = [];
          for (let i = 0; i < numPositions; i++) {
            const positionResult = await holonRegistry.createHolon({
              type: HolonType.Position,
              properties: {
                billetIDs: [`BILLET-${i}`],
                title: `Position ${i}`,
                gradeRange: { min: 'E-5', max: 'E-7' },
                designatorExpectations: ['SEAL'],
                criticality: 'standard',
                billetType: 'staff',
              },
              createdBy: `event-${i}`,
              sourceDocuments: [`doc-${i}`],
            });
            positions.push(positionResult.id);
          }

          const effectiveDate = new Date();
          let successfulAssignments = 0;
          let rejectedAssignments = 0;

          // Try to assign person to all positions
          for (let i = 0; i < positions.length; i++) {
            const assignResult = await personManager.assignPersonToPosition({
              personID,
              positionID: positions[i],
              effectiveStart: effectiveDate,
              sourceDocuments: [`assign-doc-${i}`],
              actor: 'system',
              sourceSystem: 'test-system',
            });

            if (assignResult.success) {
              successfulAssignments++;
            } else {
              rejectedAssignments++;
              // Verify rejection is due to concurrent position constraint
              expect(assignResult.validation.errors).toBeDefined();
              const hasConstraintError = assignResult.validation.errors!.some(
                err => err.violatedRule === 'concurrent_position_constraint'
              );
              expect(hasConstraintError).toBe(true);
            }
          }

          // Verify that we can assign up to MAX_CONCURRENT_POSITIONS (3)
          // but no more
          const MAX_CONCURRENT_POSITIONS = 3;

          if (numPositions <= MAX_CONCURRENT_POSITIONS) {
            // All assignments should succeed
            expect(successfulAssignments).toBe(numPositions);
            expect(rejectedAssignments).toBe(0);
          } else {
            // Only MAX_CONCURRENT_POSITIONS should succeed
            expect(successfulAssignments).toBe(MAX_CONCURRENT_POSITIONS);
            expect(rejectedAssignments).toBe(numPositions - MAX_CONCURRENT_POSITIONS);
          }

          // Verify the actual number of concurrent positions
          const currentPositions = await personManager.getPersonPositions(personID, effectiveDate);
          expect(currentPositions.length).toBeLessThanOrEqual(MAX_CONCURRENT_POSITIONS);
          expect(currentPositions.length).toBe(successfulAssignments);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
