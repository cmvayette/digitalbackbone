/**
 * Property-based tests for Qualification Management
 * Tests validate correctness properties for Qualification holons and relationships
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  QualificationManager,
  CreateQualificationParams,
  AssignQualificationToPersonParams,
  ExpireQualificationParams
} from './index';
import { InMemoryHolonRepository as HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore, InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType, HolonID } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

// Test setup
// Test setup - Removed shared state
// let holonRegistry: HolonRegistry;
// ...
// beforeEach removed


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
 * Generate a NEC (Navy Enlisted Classification) code
 */
const genNEC = (): fc.Arbitrary<string> => {
  return fc.integer({ min: 1000, max: 9999 }).map(n => n.toString());
};

/**
 * Generate a PQS ID
 */
const genPQSID = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 4, maxLength: 12 }).filter(s => /^[A-Z0-9-]+$/.test(s));
};

/**
 * Generate a course code
 */
const genCourseCode = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 4, maxLength: 10 }).filter(s => /^[A-Z0-9-]+$/.test(s));
};

/**
 * Generate a certification ID
 */
const genCertificationID = (): fc.Arbitrary<string> => {
  return fc.uuid();
};

/**
 * Generate a qualification name
 */
const genQualificationName = (): fc.Arbitrary<string> => {
  return fc.oneof(
    fc.constant('Advanced Special Operations'),
    fc.constant('Parachute Qualification'),
    fc.constant('Combat Diving'),
    fc.constant('Sniper Qualification'),
    fc.constant('Breacher Certification'),
    fc.constant('Medical Training'),
    fc.constant('Language Proficiency'),
    fc.constant('Leadership Course')
  );
};

/**
 * Generate a qualification type
 */
const genQualificationType = (): fc.Arbitrary<string> => {
  return fc.constantFrom('NEC', 'PQS', 'Course', 'Certification', 'License');
};

/**
 * Generate a validity period (in milliseconds)
 */
const genValidityPeriod = (): fc.Arbitrary<number> => {
  // Between 6 months and 5 years
  return fc.integer({ min: 6 * 30 * 24 * 60 * 60 * 1000, max: 5 * 365 * 24 * 60 * 60 * 1000 });
};

/**
 * Generate renewal rules
 */
const genRenewalRules = (): fc.Arbitrary<string> => {
  return fc.constantFrom(
    'Annual recertification required',
    'Biennial renewal with refresher course',
    'No renewal required',
    'Renewal every 3 years with exam',
    'Continuous training required'
  );
};

/**
 * Generate an issuing authority
 */
const genIssuingAuthority = (): fc.Arbitrary<string> => {
  return fc.constantFrom('NSWC', 'BUPERS', 'NETC', 'NAVSEA', 'NAVAIR', 'USSOCOM');
};

/**
 * Generate valid CreateQualificationParams
 * Ensures at least one identifier (nec, pqsID, courseCode, certificationID) is present
 */
const genCreateQualificationParams = (): fc.Arbitrary<CreateQualificationParams> => {
  return fc.oneof(
    // Generate with NEC
    fc.record({
      nec: genNEC(),
      pqsID: fc.option(genPQSID(), { nil: undefined }),
      courseCode: fc.option(genCourseCode(), { nil: undefined }),
      certificationID: fc.option(genCertificationID(), { nil: undefined }),
      name: genQualificationName(),
      type: genQualificationType(),
      validityPeriod: genValidityPeriod(),
      renewalRules: genRenewalRules(),
      issuingAuthority: genIssuingAuthority(),
      sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
      actor: genHolonID(),
      sourceSystem: fc.constant('test-system'),
    }),
    // Generate with PQS ID
    fc.record({
      nec: fc.option(genNEC(), { nil: undefined }),
      pqsID: genPQSID(),
      courseCode: fc.option(genCourseCode(), { nil: undefined }),
      certificationID: fc.option(genCertificationID(), { nil: undefined }),
      name: genQualificationName(),
      type: genQualificationType(),
      validityPeriod: genValidityPeriod(),
      renewalRules: genRenewalRules(),
      issuingAuthority: genIssuingAuthority(),
      sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
      actor: genHolonID(),
      sourceSystem: fc.constant('test-system'),
    }),
    // Generate with Course Code
    fc.record({
      nec: fc.option(genNEC(), { nil: undefined }),
      pqsID: fc.option(genPQSID(), { nil: undefined }),
      courseCode: genCourseCode(),
      certificationID: fc.option(genCertificationID(), { nil: undefined }),
      name: genQualificationName(),
      type: genQualificationType(),
      validityPeriod: genValidityPeriod(),
      renewalRules: genRenewalRules(),
      issuingAuthority: genIssuingAuthority(),
      sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
      actor: genHolonID(),
      sourceSystem: fc.constant('test-system'),
    }),
    // Generate with Certification ID
    fc.record({
      nec: fc.option(genNEC(), { nil: undefined }),
      pqsID: fc.option(genPQSID(), { nil: undefined }),
      courseCode: fc.option(genCourseCode(), { nil: undefined }),
      certificationID: genCertificationID(),
      name: genQualificationName(),
      type: genQualificationType(),
      validityPeriod: genValidityPeriod(),
      renewalRules: genRenewalRules(),
      issuingAuthority: genIssuingAuthority(),
      sourceDocuments: fc.array(genDocumentID(), { minLength: 1, maxLength: 3 }),
      actor: genHolonID(),
      sourceSystem: fc.constant('test-system'),
    })
  );
};

/**
 * Generate a timestamp within a reasonable range
 * Must be within event store validation rules (not more than 1 hour in the future)
 */
const genTimestamp = (): fc.Arbitrary<Date> => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  return fc.date({ min: oneYearAgo, max: oneHourFromNow });
};

/**
 * **Feature: semantic-operating-model, Property 26: Qualification holon completeness**
 * 
 * For any Qualification holon created, it must contain SOM Qualification ID, 
 * identifier (NEC/PQS/course code), validity period, and renewal rules.
 * 
 * Validates: Requirements 8.1
 */
describe('Property 26: Qualification holon completeness', () => {
  test('created Qualification holons contain all required fields', () => {
    fc.assert(
      fc.asyncProperty(genCreateQualificationParams(), async (params) => {
        // Setup isolated environment
        const holonRegistry = new HolonRegistry();
        const documentRegistry = new DocumentRegistry();
        const constraintEngine = new ConstraintEngine(documentRegistry);
        const eventStore = new InMemoryEventStore();
        const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
        const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

        const result = await qualificationManager.createQualification(params);

        // Qualification creation should succeed
        expect(result.success).toBe(true);
        expect(result.holonID).toBeDefined();

        // Retrieve the created qualification
        const qualification = await holonRegistry.getHolon(result.holonID!);
        expect(qualification).toBeDefined();

        // Verify all required fields are present
        expect(qualification!.id).toBeDefined(); // SOM Qualification ID
        expect(qualification!.type).toBe(HolonType.Qualification);

        // At least one identifier should be present
        const hasIdentifier =
          qualification!.properties.nec !== undefined ||
          qualification!.properties.pqsID !== undefined ||
          qualification!.properties.courseCode !== undefined ||
          qualification!.properties.certificationID !== undefined;
        expect(hasIdentifier).toBe(true);

        // Verify specific fields match input
        expect(qualification!.properties.nec).toBe(params.nec);
        expect(qualification!.properties.pqsID).toBe(params.pqsID);
        expect(qualification!.properties.courseCode).toBe(params.courseCode);
        expect(qualification!.properties.certificationID).toBe(params.certificationID);
        expect(qualification!.properties.name).toBe(params.name);
        expect(qualification!.properties.type).toBe(params.type);
        expect(qualification!.properties.validityPeriod).toBe(params.validityPeriod);
        expect(qualification!.properties.renewalRules).toBe(params.renewalRules);
        expect(qualification!.properties.issuingAuthority).toBe(params.issuingAuthority);

        // Verify metadata
        expect(qualification!.createdAt).toBeInstanceOf(Date);
        expect(qualification!.createdBy).toBeDefined();
        expect(qualification!.status).toBe('active');
        expect(qualification!.sourceDocuments).toEqual(params.sourceDocuments);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: semantic-operating-model, Property 27: Qualification expiration handling**
 * 
 * For any qualification that expires, an expiration event must be recorded 
 * and the relationship validity window must be updated.
 * 
 * Validates: Requirements 8.3
 */
describe('Property 27: Qualification expiration handling', () => {
  test('qualification expiration records event and updates relationship', () => {
    fc.assert(
      fc.asyncProperty(
        genCreateQualificationParams(),
        genTimestamp(),
        genTimestamp(),
        async (qualParams, effectiveStart, expirationDate) => {
          // Setup isolated environment
          const holonRegistry = new HolonRegistry();
          const documentRegistry = new DocumentRegistry();
          const constraintEngine = new ConstraintEngine(documentRegistry);
          const eventStore = new InMemoryEventStore();
          const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
          const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

          // Manual date fix to ensure effectiveStart < expirationDate < now
          const now = new Date();
          const oneDay = 24 * 60 * 60 * 1000;

          // Force effectiveStart to be at least 2 days ago
          if (effectiveStart.getTime() > now.getTime() - 2 * oneDay) {
            effectiveStart = new Date(now.getTime() - 365 * oneDay);
          }

          // Force expiration to be 1 day after effectiveStart
          if (expirationDate.getTime() <= effectiveStart.getTime() || expirationDate.getTime() > now.getTime()) {
            expirationDate = new Date(effectiveStart.getTime() + oneDay);
          }

          // Double check constraints (if expiration is still future, cap it, but ensure start < end)
          if (expirationDate > now) {
            expirationDate = new Date(now.getTime() - 1000);
          }
          if (effectiveStart >= expirationDate) {
            effectiveStart = new Date(expirationDate.getTime() - oneDay);
          }

          // Create a qualification
          const qualResult = await qualificationManager.createQualification(qualParams);
          expect(qualResult.success).toBe(true);

          // Create a person to hold the qualification
          const person = await holonRegistry.createHolon({
            type: HolonType.Person,
            properties: {
              edipi: '1234567890',
              serviceNumbers: ['SN-001'],
              name: 'Test Person',
              dob: new Date('1990-01-01'),
              serviceBranch: 'Navy',
              designatorRating: 'SEAL',
              category: 'active_duty',
            },
            createdBy: 'event-001',
            sourceDocuments: ['doc-001'],
          });

          // Assign qualification to person
          const assignResult = await qualificationManager.awardQualification({
            qualificationID: qualResult.holonID!,
            personID: person.id,
            effectiveStart,
            sourceDocuments: ['doc-002'],
            actor: 'system',
            sourceSystem: 'test-system',
          });
          expect(assignResult.success).toBe(true);

          // Get the relationship before expiration
          const relationshipsBefore = await relationshipRegistry.getRelationshipsTo(
            qualResult.holonID!,
            RelationshipType.HAS_QUAL,
            { includeEnded: false }
          );
          expect(relationshipsBefore.length).toBe(1);
          expect(relationshipsBefore[0].effectiveEnd).toBeUndefined();

          // Expire the qualification
          const expireResult = await qualificationManager.expireQualification({
            qualificationID: qualResult.holonID!,
            personID: person.id,
            expirationDate,
            reason: 'Validity period expired',
            actor: 'system',
            sourceSystem: 'test-system',
          });

          // Expiration should succeed
          expect(expireResult.success).toBe(true);
          expect(expireResult.eventID).toBeDefined();

          // Verify expiration event was recorded
          const event = eventStore.getEvent(expireResult.eventID!);
          expect(event).toBeDefined();
          expect(event!.type).toBe(EventType.QualificationExpired);
          expect(event!.subjects).toContain(person.id);
          expect(event!.subjects).toContain(qualResult.holonID!);
          expect(event!.payload.reason).toBe('Validity period expired');

          // Verify relationship validity window was updated (relationship should be ended)
          const relationshipsAfter = await relationshipRegistry.getRelationshipsTo(
            qualResult.holonID!,
            RelationshipType.HAS_QUAL,
            { includeEnded: false }
          );
          expect(relationshipsAfter.length).toBe(0); // No active relationships

          // Verify relationship exists with end date when including ended relationships
          const allRelationships = await relationshipRegistry.getRelationshipsFrom(
            qualResult.holonID!,
            RelationshipType.HELD_BY,
            { includeEnded: true }
          );
          expect(allRelationships.length).toBe(1);
          expect(allRelationships[0].effectiveEnd).toBeDefined();
          expect(allRelationships[0].effectiveEnd).toEqual(expirationDate);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional unit tests for qualification management functionality
 */
describe('Qualification Management - Unit Tests', () => {
  test('can create qualification with NEC identifier', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    const result = await qualificationManager.createQualification({
      nec: '5326',
      name: 'Advanced Special Operations',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual recertification',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(result.success).toBe(true);
    expect(result.holonID).toBeDefined();

    const qual = await holonRegistry.getHolon(result.holonID!);
    expect(qual?.properties.nec).toBe('5326');
  });

  test('can create qualification with PQS identifier', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    const result = await qualificationManager.createQualification({
      pqsID: 'PQS-SEAL-001',
      name: 'SEAL PQS',
      type: 'PQS',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'No renewal required',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(result.success).toBe(true);
    const qual = await holonRegistry.getHolon(result.holonID!);
    expect(qual?.properties.pqsID).toBe('PQS-SEAL-001');
  });

  test('can assign qualification to person', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    // Create qualification
    const qualResult = await qualificationManager.createQualification({
      nec: '5326',
      name: 'Advanced Special Operations',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual recertification',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Create person
    const person = await holonRegistry.createHolon({
      type: HolonType.Person,
      properties: {
        edipi: '1234567890',
        serviceNumbers: ['SN-001'],
        name: 'Test Person',
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
      },
      createdBy: 'event-001',
      sourceDocuments: ['doc-002'],
    });

    // Assign qualification
    const assignResult = await qualificationManager.awardQualification({
      qualificationID: qualResult.holonID!,
      personID: person.id,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-003'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(assignResult.success).toBe(true);
    expect(assignResult.relationshipID).toBeDefined();

    // Verify relationship exists
    const holders = await qualificationManager.getQualificationHolders(qualResult.holonID!);
    expect(holders).toContain(person.id);
  });

  test('can set qualification as required for position', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    // Create qualification
    const qualResult = await qualificationManager.createQualification({
      nec: '5326',
      name: 'Advanced Special Operations',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual recertification',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Create position
    const position = await holonRegistry.createHolon({
      type: HolonType.Position,
      properties: {
        billetIDs: ['BILLET-001'],
        title: 'Team Leader',
        gradeRange: { min: 'E-6', max: 'E-8' },
        designatorExpectations: ['SEAL'],
        criticality: 'critical',
        billetType: 'command',
      },
      createdBy: 'event-002',
      sourceDocuments: ['doc-002'],
    });

    // Set requirement
    const reqResult = await qualificationManager.setQualificationRequirement({
      qualificationID: qualResult.holonID!,
      positionID: position.id,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-003'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(reqResult.success).toBe(true);

    // Verify requirement exists
    const positions = await qualificationManager.getPositionsRequiringQualification(qualResult.holonID!);
    expect(positions).toContain(position.id);
  });

  test('can set prerequisite relationships between qualifications', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    // Create basic qualification
    const basicQual = await qualificationManager.createQualification({
      nec: '5320',
      name: 'Basic Special Operations',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual recertification',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Create advanced qualification
    const advancedQual = await qualificationManager.createQualification({
      nec: '5326',
      name: 'Advanced Special Operations',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual recertification',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-002'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Set basic as prerequisite for advanced
    const prereqResult = await qualificationManager.setQualificationPrerequisite({
      qualificationID: advancedQual.holonID!,
      prerequisiteQualificationID: basicQual.holonID!,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-003'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(prereqResult.success).toBe(true);

    // Verify prerequisite relationship
    const prerequisites = await qualificationManager.getQualificationPrerequisites(advancedQual.holonID!);
    expect(prerequisites).toContain(basicQual.holonID!);
  });

  test('prevents self-prerequisite', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    const qualResult = await qualificationManager.createQualification({
      nec: '5326',
      name: 'Advanced Special Operations',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual recertification',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Try to set qualification as its own prerequisite
    const prereqResult = await qualificationManager.setQualificationPrerequisite({
      qualificationID: qualResult.holonID!,
      prerequisiteQualificationID: qualResult.holonID!,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-002'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(prereqResult.success).toBe(false);
    expect(prereqResult.validation.errors).toBeDefined();
    expect(prereqResult.validation.errors![0].violatedRule).toBe('no_self_prerequisite');
  });

  test('detects cycles in prerequisite chains', async () => {
    // Setup isolated environment
    const holonRegistry = new HolonRegistry();
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);
    const eventStore = new InMemoryEventStore();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    const qualificationManager = new QualificationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    // Create three qualifications
    const qual1 = await qualificationManager.createQualification({
      nec: '5320',
      name: 'Qual 1',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-001'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    const qual2 = await qualificationManager.createQualification({
      nec: '5321',
      name: 'Qual 2',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-002'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    const qual3 = await qualificationManager.createQualification({
      nec: '5322',
      name: 'Qual 3',
      type: 'NEC',
      validityPeriod: 365 * 24 * 60 * 60 * 1000,
      renewalRules: 'Annual',
      issuingAuthority: 'NSWC',
      sourceDocuments: ['doc-003'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Create chain: qual2 depends on qual1
    await qualificationManager.setQualificationPrerequisite({
      qualificationID: qual2.holonID!,
      prerequisiteQualificationID: qual1.holonID!,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-004'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Create chain: qual3 depends on qual2
    await qualificationManager.setQualificationPrerequisite({
      qualificationID: qual3.holonID!,
      prerequisiteQualificationID: qual2.holonID!,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-005'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    // Try to create cycle: qual1 depends on qual3 (would create cycle)
    const cycleResult = await qualificationManager.setQualificationPrerequisite({
      qualificationID: qual1.holonID!,
      prerequisiteQualificationID: qual3.holonID!,
      effectiveStart: new Date(),
      sourceDocuments: ['doc-006'],
      actor: 'system',
      sourceSystem: 'test-system',
    });

    expect(cycleResult.success).toBe(false);
    expect(cycleResult.validation.errors).toBeDefined();
    expect(cycleResult.validation.errors![0].violatedRule).toBe('no_cycles');
  });
});
