/**
 * Tests for Access Control module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AccessControlEngine,
  createAccessControlEngine,
  Role,
  ClassificationLevel,
  UserContext,
} from './index';
import { DocumentRegistry } from '../document-registry';
import { Holon, HolonType, DocumentType } from '@som/shared-types';
import { Relationship, RelationshipType } from '@som/shared-types';
import { Event, EventType } from '@som/shared-types';

describe('AccessControlEngine', () => {
  let documentRegistry: DocumentRegistry;
  let accessControl: AccessControlEngine;

  beforeEach(() => {
    documentRegistry = new DocumentRegistry();
    accessControl = createAccessControlEngine(documentRegistry);
  });

  describe('Role-based access control', () => {
    it('should allow admin users to access all holons', () => {
      const adminUser: UserContext = {
        userId: 'admin1',
        roles: [Role.Administrator],
        clearanceLevel: ClassificationLevel.TopSecret,
      };

      const holon: Holon = {
        id: 'holon1',
        type: HolonType.Person,
        properties: {
          edipi: '1234567890',
          serviceNumbers: ['123456'],
          name: 'John Doe',
          dob: new Date('1990-01-01'),
          serviceBranch: 'Navy',
          designatorRating: 'SO',
          category: 'active_duty',
        },
        createdAt: new Date(),
        createdBy: 'event1',
        status: 'active',
        sourceDocuments: [],
      };

      const decision = accessControl.canAccessHolon(adminUser, holon);
      expect(decision.allowed).toBe(true);
    });

    it('should deny viewer users access to events', () => {
      const viewerUser: UserContext = {
        userId: 'viewer1',
        roles: [Role.Viewer],
        clearanceLevel: ClassificationLevel.Unclassified,
      };

      const event: Event = {
        id: 'event1',
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        recordedAt: new Date(),
        actor: 'person1',
        subjects: ['person1', 'position1'],
        payload: {},
        sourceSystem: 'NSIPS',
        causalLinks: {},
      };

      const decision = accessControl.canAccessEvent(viewerUser, event);
      expect(decision.allowed).toBe(false);
    });

    it('should allow operators to submit events', () => {
      const operatorUser: UserContext = {
        userId: 'operator1',
        roles: [Role.Operator],
        clearanceLevel: ClassificationLevel.Secret,
      };

      const decision = accessControl.canSubmitEvent(operatorUser);
      expect(decision.allowed).toBe(true);
    });

    it('should deny analysts permission to submit events', () => {
      const analystUser: UserContext = {
        userId: 'analyst1',
        roles: [Role.Analyst],
        clearanceLevel: ClassificationLevel.Secret,
      };

      const decision = accessControl.canSubmitEvent(analystUser);
      expect(decision.allowed).toBe(false);
    });

    it('should allow schema managers to modify schema', () => {
      const schemaManager: UserContext = {
        userId: 'schema1',
        roles: [Role.SchemaManager],
        clearanceLevel: ClassificationLevel.Unclassified,
      };

      const decision = accessControl.canModifySchema(schemaManager);
      expect(decision.allowed).toBe(true);
    });

    it('should deny operators permission to modify schema', () => {
      const operatorUser: UserContext = {
        userId: 'operator1',
        roles: [Role.Operator],
        clearanceLevel: ClassificationLevel.Secret,
      };

      const decision = accessControl.canModifySchema(operatorUser);
      expect(decision.allowed).toBe(false);
    });
  });

  describe('Classification-based access control', () => {
    it('should deny access to classified holons for users without clearance', () => {
      // Create a classified document
      const classifiedDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['SECRET-001'],
          title: 'Classified Operations Plan',
          documentType: DocumentType.OPLAN,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'SECRET',
        },
        'event1'
      );

      const holon: Holon = {
        id: 'holon1',
        type: HolonType.Mission,
        properties: {
          operationName: 'Operation Neptune',
          operationNumber: 'OP-001',
          type: 'real_world',
          classificationMetadata: 'SECRET',
          startTime: new Date('2024-06-01'),
          endTime: new Date('2024-06-30'),
        },
        createdAt: new Date(),
        createdBy: 'event1',
        status: 'active',
        sourceDocuments: [classifiedDoc.id],
      };

      const unclassifiedUser: UserContext = {
        userId: 'user1',
        roles: [Role.Analyst],
        clearanceLevel: ClassificationLevel.Unclassified,
      };

      const decision = accessControl.canAccessHolon(unclassifiedUser, holon);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('clearance');
    });

    it('should allow access to classified holons for users with sufficient clearance', () => {
      // Create a classified document
      const classifiedDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['SECRET-001'],
          title: 'Classified Operations Plan',
          documentType: DocumentType.OPLAN,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'SECRET',
        },
        'event1'
      );

      const holon: Holon = {
        id: 'holon1',
        type: HolonType.Mission,
        properties: {
          operationName: 'Operation Neptune',
          operationNumber: 'OP-001',
          type: 'real_world',
          classificationMetadata: 'SECRET',
          startTime: new Date('2024-06-01'),
          endTime: new Date('2024-06-30'),
        },
        createdAt: new Date(),
        createdBy: 'event1',
        status: 'active',
        sourceDocuments: [classifiedDoc.id],
      };

      const secretUser: UserContext = {
        userId: 'user1',
        roles: [Role.Analyst],
        clearanceLevel: ClassificationLevel.Secret,
      };

      const decision = accessControl.canAccessHolon(secretUser, holon);
      expect(decision.allowed).toBe(true);
    });

    it('should handle classification hierarchy correctly', () => {
      const topSecretUser: UserContext = {
        userId: 'user1',
        roles: [Role.Analyst],
        clearanceLevel: ClassificationLevel.TopSecret,
      };

      // Top Secret user should access all levels
      const unclassifiedDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['UNCLAS-001'],
          title: 'Public Document',
          documentType: DocumentType.Policy,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'UNCLASSIFIED',
        },
        'event1'
      );

      const unclassifiedHolon: Holon = {
        id: 'holon1',
        type: HolonType.Organization,
        properties: {
          uics: ['12345'],
          name: 'Test Unit',
          type: 'Command',
          echelonLevel: 'Battalion',
          missionStatement: 'Test mission',
        },
        createdAt: new Date(),
        createdBy: 'event1',
        status: 'active',
        sourceDocuments: [unclassifiedDoc.id],
      };

      const decision = accessControl.canAccessHolon(topSecretUser, unclassifiedHolon);
      expect(decision.allowed).toBe(true);
    });
  });

  describe('Information hiding', () => {
    it('should filter out restricted holons without revealing their existence', () => {
      const unclassifiedDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['UNCLAS-001'],
          title: 'Public Document',
          documentType: DocumentType.Policy,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'UNCLASSIFIED',
        },
        'event1'
      );

      const secretDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['SECRET-001'],
          title: 'Classified Document',
          documentType: DocumentType.OPLAN,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'SECRET',
        },
        'event2'
      );

      const holons: Holon[] = [
        {
          id: 'holon1',
          type: HolonType.Person,
          properties: {
            edipi: '1234567890',
            serviceNumbers: ['123456'],
            name: 'John Doe',
            dob: new Date('1990-01-01'),
            serviceBranch: 'Navy',
            designatorRating: 'SO',
            category: 'active_duty',
          },
          createdAt: new Date(),
          createdBy: 'event1',
          status: 'active',
          sourceDocuments: [unclassifiedDoc.id],
        },
        {
          id: 'holon2',
          type: HolonType.Mission,
          properties: {
            operationName: 'Classified Operation',
            operationNumber: 'OP-SECRET',
            type: 'real_world',
            classificationMetadata: 'SECRET',
            startTime: new Date('2024-06-01'),
            endTime: new Date('2024-06-30'),
          },
          createdAt: new Date(),
          createdBy: 'event2',
          status: 'active',
          sourceDocuments: [secretDoc.id],
        },
      ];

      const unclassifiedUser: UserContext = {
        userId: 'user1',
        roles: [Role.Analyst],
        clearanceLevel: ClassificationLevel.Unclassified,
      };

      const filtered = accessControl.filterHolons(unclassifiedUser, holons);

      // Should only return the unclassified holon
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('holon1');
      // Should not reveal that a second holon was filtered out
    });

    it('should filter relationships based on access control', () => {
      const unclassifiedDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['UNCLAS-001'],
          title: 'Public Document',
          documentType: DocumentType.Policy,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'UNCLASSIFIED',
        },
        'event1'
      );

      const secretDoc = documentRegistry.registerDocument(
        {
          referenceNumbers: ['SECRET-001'],
          title: 'Classified Document',
          documentType: DocumentType.OPLAN,
          version: '1.0',
          effectiveDates: { start: new Date('2024-01-01') },
          classificationMetadata: 'SECRET',
        },
        'event2'
      );

      const relationships: Relationship[] = [
        {
          id: 'rel1',
          type: RelationshipType.OCCUPIES,
          sourceHolonID: 'person1',
          targetHolonID: 'position1',
          properties: {},
          effectiveStart: new Date('2024-01-01'),
          sourceSystem: 'NSIPS',
          sourceDocuments: [unclassifiedDoc.id],
          createdBy: 'event1',
          authorityLevel: 'authoritative',
        },
        {
          id: 'rel2',
          type: RelationshipType.SUPPORTS,
          sourceHolonID: 'asset1',
          targetHolonID: 'mission1',
          properties: {},
          effectiveStart: new Date('2024-01-01'),
          sourceSystem: 'DRRS',
          sourceDocuments: [secretDoc.id],
          createdBy: 'event2',
          authorityLevel: 'authoritative',
        },
      ];

      const unclassifiedUser: UserContext = {
        userId: 'user1',
        roles: [Role.Analyst],
        clearanceLevel: ClassificationLevel.Unclassified,
      };

      const filtered = accessControl.filterRelationships(unclassifiedUser, relationships);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('rel1');
    });
  });
});

describe('Property-Based Tests', () => {
  // Generators for property-based testing
  const genRole = fc.constantFrom(...Object.values(Role));

  const genClassificationLevel = fc.constantFrom(...Object.values(ClassificationLevel));

  const genUserContext = fc.record({
    userId: fc.string({ minLength: 1, maxLength: 20 }),
    roles: fc.array(genRole, { minLength: 1, maxLength: 3 }),
    clearanceLevel: genClassificationLevel,
  });

  const genHolonType = fc.constantFrom(...Object.values(HolonType));

  const genDocumentType = fc.constantFrom(...Object.values(DocumentType));

  const genClassificationMetadata = fc.constantFrom(
    'UNCLASSIFIED',
    'CONFIDENTIAL',
    'SECRET',
    'TOP SECRET'
  );

  const genHolon = fc.record({
    id: fc.uuid(),
    type: genHolonType,
    properties: fc.dictionary(fc.string(), fc.anything()),
    createdAt: fc.date(),
    createdBy: fc.uuid(),
    status: fc.constantFrom('active', 'inactive'),
    sourceDocuments: fc.array(fc.uuid(), { maxLength: 3 }),
  }).chain(baseHolon =>
    fc.constant(baseHolon as Holon)
  );

  const genRelationshipType = fc.constantFrom(...Object.values(RelationshipType));

  const genRelationship = fc.record({
    id: fc.uuid(),
    type: genRelationshipType,
    sourceHolonID: fc.uuid(),
    targetHolonID: fc.uuid(),
    properties: fc.dictionary(fc.string(), fc.anything()),
    effectiveStart: fc.date(),
    effectiveEnd: fc.option(fc.date(), { nil: undefined }),
    sourceSystem: fc.string({ minLength: 3, maxLength: 20 }),
    sourceDocuments: fc.array(fc.uuid(), { maxLength: 3 }),
    createdBy: fc.uuid(),
    authorityLevel: fc.constantFrom('authoritative', 'derived', 'inferred'),
  }).chain(baseRel =>
    fc.constant(baseRel as Relationship)
  );

  const genEventType = fc.constantFrom(...Object.values(EventType));

  const genEvent = fc.record({
    id: fc.uuid(),
    type: genEventType,
    occurredAt: fc.date(),
    recordedAt: fc.date(),
    actor: fc.uuid(),
    subjects: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
    payload: fc.dictionary(fc.string(), fc.anything()),
    sourceSystem: fc.string({ minLength: 3, maxLength: 20 }),
    sourceDocument: fc.option(fc.uuid(), { nil: undefined }),
    causalLinks: fc.record({
      precededBy: fc.option(fc.array(fc.uuid()), { nil: undefined }),
      causedBy: fc.option(fc.array(fc.uuid()), { nil: undefined }),
      groupedWith: fc.option(fc.array(fc.uuid()), { nil: undefined }),
    }),
  }).chain(baseEvent =>
    fc.constant(baseEvent as Event)
  );

  /**
   * **Feature: semantic-operating-model, Property 52: Role-based access enforcement**
   * **Validates: Requirements 20.1**
   * 
   * For any query with a specific role, the SOM must return only holons and relationships
   * that the role is authorized to access.
   */
  describe('Property 52: Role-based access enforcement', () => {
    it('should enforce role-based access for holons across all roles', () => {
      fc.assert(
        fc.property(
          genUserContext,
          fc.array(genHolon, { minLength: 1, maxLength: 20 }),
          (user, holons) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Filter holons based on user access
            const filtered = ac.filterHolons(user, holons);

            // All filtered holons must be accessible by the user
            for (const holon of filtered) {
              const decision = ac.canAccessHolon(user, holon);
              if (!decision.allowed) {
                return false;
              }
            }

            // All non-filtered holons must not be accessible by the user
            const filteredIds = new Set(filtered.map(h => h.id));
            for (const holon of holons) {
              if (!filteredIds.has(holon.id)) {
                const decision = ac.canAccessHolon(user, holon);
                // If it was filtered out, it should not be allowed
                // (unless it's a duplicate ID, which we ignore)
                if (decision.allowed && !filteredIds.has(holon.id)) {
                  // This is acceptable if the holon appears multiple times
                  const count = holons.filter(h => h.id === holon.id).length;
                  if (count === 1) {
                    return false;
                  }
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce role-based access for relationships across all roles', () => {
      fc.assert(
        fc.property(
          genUserContext,
          fc.array(genRelationship, { minLength: 1, maxLength: 20 }),
          (user, relationships) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Filter relationships based on user access
            const filtered = ac.filterRelationships(user, relationships);

            // All filtered relationships must be accessible by the user
            for (const rel of filtered) {
              const decision = ac.canAccessRelationship(user, rel);
              if (!decision.allowed) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce role-based access for events across all roles', () => {
      fc.assert(
        fc.property(
          genUserContext,
          fc.array(genEvent, { minLength: 1, maxLength: 20 }),
          (user, events) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Filter events based on user access
            const filtered = ac.filterEvents(user, events);

            // All filtered events must be accessible by the user
            for (const event of filtered) {
              const decision = ac.canAccessEvent(user, event);
              if (!decision.allowed) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: semantic-operating-model, Property 53: Classification-based access control**
   * **Validates: Requirements 20.2**
   * 
   * For any document with classification metadata, holons and constraints defined by that
   * document must be accessible only to users with appropriate clearance.
   */
  describe('Property 53: Classification-based access control', () => {
    it('should enforce classification-based access for holons with classified source documents', () => {
      fc.assert(
        fc.property(
          genUserContext,
          genClassificationMetadata,
          (user, classification) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Create a document with the specified classification
            const doc = docReg.registerDocument(
              {
                referenceNumbers: ['TEST-001'],
                title: 'Test Document',
                documentType: DocumentType.Policy,
                version: '1.0',
                effectiveDates: { start: new Date('2024-01-01') },
                classificationMetadata: classification,
              },
              'test-event'
            );

            // Create a holon that references this document
            const holon: Holon = {
              id: 'test-holon',
              type: HolonType.Organization,
              properties: {
                uics: ['12345'],
                name: 'Test Unit',
                type: 'Command',
                echelonLevel: 'Battalion',
                missionStatement: 'Test mission',
              },
              createdAt: new Date(),
              createdBy: 'event1',
              status: 'active',
              sourceDocuments: [doc.id],
            };

            const decision = ac.canAccessHolon(user, holon);

            // Parse the classification level
            const classLevel = classification.toUpperCase().includes('TOP SECRET')
              ? ClassificationLevel.TopSecret
              : classification.toUpperCase().includes('SECRET')
                ? ClassificationLevel.Secret
                : classification.toUpperCase().includes('CONFIDENTIAL')
                  ? ClassificationLevel.Confidential
                  : ClassificationLevel.Unclassified;

            // Map clearance levels to numbers
            const clearanceLevels = {
              [ClassificationLevel.Unclassified]: 0,
              [ClassificationLevel.Confidential]: 1,
              [ClassificationLevel.Secret]: 2,
              [ClassificationLevel.TopSecret]: 3,
            };

            const userLevel = clearanceLevels[user.clearanceLevel];
            const requiredLevel = clearanceLevels[classLevel];

            // User should have access if they have sufficient clearance AND role permissions
            const hasRolePermission = user.roles.some(role =>
              role === Role.Administrator || role === Role.Operator || role === Role.Analyst || role === Role.Viewer || role === Role.SchemaManager
            );

            if (userLevel >= requiredLevel && hasRolePermission) {
              return decision.allowed === true;
            } else {
              return decision.allowed === false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce classification hierarchy correctly', () => {
      fc.assert(
        fc.property(
          genClassificationLevel,
          genClassificationLevel,
          (userClearance, docClassification) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            const user: UserContext = {
              userId: 'test-user',
              roles: [Role.Analyst],
              clearanceLevel: userClearance,
            };

            // Create a document with the specified classification
            const classMetadata = docClassification === ClassificationLevel.TopSecret ? 'TOP SECRET'
              : docClassification === ClassificationLevel.Secret ? 'SECRET'
                : docClassification === ClassificationLevel.Confidential ? 'CONFIDENTIAL'
                  : 'UNCLASSIFIED';

            const doc = docReg.registerDocument(
              {
                referenceNumbers: ['TEST-001'],
                title: 'Test Document',
                documentType: DocumentType.Policy,
                version: '1.0',
                effectiveDates: { start: new Date('2024-01-01') },
                classificationMetadata: classMetadata,
              },
              'test-event'
            );

            const holon: Holon = {
              id: 'test-holon',
              type: HolonType.Organization,
              properties: {
                uics: ['12345'],
                name: 'Test Unit',
                type: 'Command',
                echelonLevel: 'Battalion',
                missionStatement: 'Test mission',
              },
              createdAt: new Date(),
              createdBy: 'event1',
              status: 'active',
              sourceDocuments: [doc.id],
            };

            const decision = ac.canAccessHolon(user, holon);

            // Map clearance levels to numbers
            const clearanceLevels = {
              [ClassificationLevel.Unclassified]: 0,
              [ClassificationLevel.Confidential]: 1,
              [ClassificationLevel.Secret]: 2,
              [ClassificationLevel.TopSecret]: 3,
            };

            const userLevel = clearanceLevels[userClearance];
            const requiredLevel = clearanceLevels[docClassification];

            // User should have access if they have sufficient clearance
            if (userLevel >= requiredLevel) {
              return decision.allowed === true;
            } else {
              return decision.allowed === false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: semantic-operating-model, Property 54: Information hiding on access denial**
   * **Validates: Requirements 20.5**
   * 
   * For any query that includes restricted information, the SOM must return filtered results
   * without revealing the existence of restricted data.
   */
  describe('Property 54: Information hiding on access denial', () => {
    it('should not reveal the count of filtered holons', () => {
      fc.assert(
        fc.property(
          genUserContext,
          fc.array(genHolon, { minLength: 5, maxLength: 50 }),
          (user, holons) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Filter holons
            const filtered = ac.filterHolons(user, holons);

            // The filtered result should not contain any information about
            // how many holons were filtered out
            // We verify this by checking that:
            // 1. All returned holons are accessible
            // 2. The function doesn't throw errors or return metadata about filtered items

            for (const holon of filtered) {
              const decision = ac.canAccessHolon(user, holon);
              if (!decision.allowed) {
                return false;
              }
            }

            // The filtered array should be a plain array with no metadata
            // about the original count or filtered items
            return Array.isArray(filtered) &&
              filtered.length <= holons.length &&
              filtered.every(h => holons.some(orig => orig.id === h.id));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not reveal the existence of filtered relationships', () => {
      fc.assert(
        fc.property(
          genUserContext,
          fc.array(genRelationship, { minLength: 5, maxLength: 50 }),
          (user, relationships) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Filter relationships
            const filtered = ac.filterRelationships(user, relationships);

            // Verify all returned relationships are accessible
            for (const rel of filtered) {
              const decision = ac.canAccessRelationship(user, rel);
              if (!decision.allowed) {
                return false;
              }
            }

            // The filtered array should be a plain array with no metadata
            return Array.isArray(filtered) &&
              filtered.length <= relationships.length &&
              filtered.every(r => relationships.some(orig => orig.id === r.id));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not reveal the existence of filtered events', () => {
      fc.assert(
        fc.property(
          genUserContext,
          fc.array(genEvent, { minLength: 5, maxLength: 50 }),
          (user, events) => {
            const docReg = new DocumentRegistry();
            const ac = createAccessControlEngine(docReg);

            // Filter events
            const filtered = ac.filterEvents(user, events);

            // Verify all returned events are accessible
            for (const event of filtered) {
              const decision = ac.canAccessEvent(user, event);
              if (!decision.allowed) {
                return false;
              }
            }

            // The filtered array should be a plain array with no metadata
            return Array.isArray(filtered) &&
              filtered.length <= events.length &&
              filtered.every(e => events.some(orig => orig.id === e.id));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
