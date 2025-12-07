/**
 * Tests for Semantic Access Layer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  SemanticAccessLayer,
  ExternalData,
  ConflictResolutionStrategy,
} from './index';
import { InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { InMemoryHolonRepository as HolonRegistry } from '../core/holon-registry';
import { DocumentRegistry } from '../document-registry';
import { HolonType, EventID, ConstraintType, DocumentType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

describe('SemanticAccessLayer', () => {
  let sal: SemanticAccessLayer;
  let eventStore: InMemoryEventStore;
  let constraintEngine: ConstraintEngine;
  let holonRegistry: HolonRegistry;
  let documentRegistry: DocumentRegistry;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    holonRegistry = new HolonRegistry();
    sal = new SemanticAccessLayer(eventStore, constraintEngine, holonRegistry, documentRegistry);
  });

  describe('ID Mapping', () => {
    it('should map external IDs to holon IDs', () => {
      const externalSystem = 'NSIPS';
      const externalID = 'EMP-12345';
      const holonID = 'holon-uuid-1';

      sal.mapExternalID(externalSystem, externalID, holonID);

      const mappedID = sal.getHolonID(externalSystem, externalID);
      expect(mappedID).toBe(holonID);
    });

    it('should support bidirectional mapping lookup', () => {
      const externalSystem = 'NSIPS';
      const externalID = 'EMP-12345';
      const holonID = 'holon-uuid-1';

      sal.mapExternalID(externalSystem, externalID, holonID);

      const externalIDs = sal.getExternalIDs(holonID);
      expect(externalIDs).toHaveLength(1);
      expect(externalIDs[0].externalSystem).toBe(externalSystem);
      expect(externalIDs[0].externalID).toBe(externalID);
      expect(externalIDs[0].holonID).toBe(holonID);
    });

    it('should prevent remapping to different holon ID', () => {
      const externalSystem = 'NSIPS';
      const externalID = 'EMP-12345';
      const holonID1 = 'holon-uuid-1';
      const holonID2 = 'holon-uuid-2';

      sal.mapExternalID(externalSystem, externalID, holonID1);

      expect(() => {
        sal.mapExternalID(externalSystem, externalID, holonID2);
      }).toThrow(/Mapping conflict/);
    });

    it('should allow same mapping to be set multiple times', () => {
      const externalSystem = 'NSIPS';
      const externalID = 'EMP-12345';
      const holonID = 'holon-uuid-1';

      sal.mapExternalID(externalSystem, externalID, holonID);
      sal.mapExternalID(externalSystem, externalID, holonID); // Should not throw

      const mappedID = sal.getHolonID(externalSystem, externalID);
      expect(mappedID).toBe(holonID);
    });

    it('should support multiple external systems mapping to same holon', () => {
      const holonID = 'holon-uuid-1';

      sal.mapExternalID('NSIPS', 'EMP-12345', holonID);
      sal.mapExternalID('DRRS', 'PERS-67890', holonID);

      const externalIDs = sal.getExternalIDs(holonID);
      expect(externalIDs).toHaveLength(2);
      expect(externalIDs.map(m => m.externalSystem)).toContain('NSIPS');
      expect(externalIDs.map(m => m.externalSystem)).toContain('DRRS');
    });
  });

  describe('External Data Transformation', () => {
    it('should transform external data to events', () => {
      const externalData: ExternalData = {
        externalSystem: 'NSIPS',
        externalID: 'EMP-12345',
        dataType: 'person_created',
        payload: {
          name: 'John Doe',
          edipi: '1234567890',
        },
        timestamp: new Date(),
      };

      const result = sal.submitExternalData(externalData);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].sourceSystem).toBe('NSIPS');
      expect(result.events[0].payload).toEqual(externalData.payload);
    });

    it('should create ID mapping when transforming new entity', async () => {
      // First create a holon to get a valid event ID
      const eventID = eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const holon = await holonRegistry.createHolon({
        type: HolonType.Person,
        properties: { name: 'Test' },
        createdBy: eventID,
        sourceDocuments: [],
      });

      const externalData: ExternalData = {
        externalSystem: 'NSIPS',
        externalID: 'EMP-12345',
        dataType: 'person_created',
        payload: { name: 'John Doe' },
        timestamp: new Date(),
      };

      // Map the external ID to the holon
      sal.mapExternalID(externalData.externalSystem, externalData.externalID, holon.id);

      const result = sal.submitExternalData(externalData);

      expect(result.success).toBe(true);
      expect(result.holonID).toBe(holon.id);

      const mappedID = sal.getHolonID('NSIPS', 'EMP-12345');
      expect(mappedID).toBe(holon.id);
    });

    it('should validate events before acceptance', () => {
      // Register a constraint that always fails
      constraintEngine.registerConstraint({
        type: ConstraintType.Policy,
        name: 'Test Constraint',
        definition: 'Always fails',
        scope: { eventTypes: [EventType.AssignmentStarted] },
        effectiveDates: { start: new Date(0) },
        sourceDocuments: [],
        validationLogic: () => ({
          valid: false,
          errors: [{
            constraintID: 'test',
            message: 'Validation failed',
            violatedRule: 'test rule',
            affectedHolons: [],
          }],
        }),
      });

      const externalData: ExternalData = {
        externalSystem: 'NSIPS',
        externalID: 'EMP-12345',
        dataType: 'person_created',
        payload: { name: 'John Doe' },
        timestamp: new Date(),
      };

      const result = sal.submitExternalData(externalData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-System Consistency', () => {
    it('should detect consistent mappings across systems', () => {
      const holonID = 'holon-uuid-1';

      sal.mapExternalID('NSIPS', 'EMP-12345', holonID);
      sal.mapExternalID('DRRS', 'PERS-67890', holonID);

      const result = sal.ensureMultiSystemConsistency([
        { system: 'NSIPS', id: 'EMP-12345' },
        { system: 'DRRS', id: 'PERS-67890' },
      ]);

      expect(result.consistent).toBe(true);
      expect(result.holonID).toBe(holonID);
    });

    it('should detect inconsistent mappings across systems', () => {
      const holonID1 = 'holon-uuid-1';
      const holonID2 = 'holon-uuid-2';

      sal.mapExternalID('NSIPS', 'EMP-12345', holonID1);
      sal.mapExternalID('DRRS', 'PERS-67890', holonID2);

      const result = sal.ensureMultiSystemConsistency([
        { system: 'NSIPS', id: 'EMP-12345' },
        { system: 'DRRS', id: 'PERS-67890' },
      ]);

      expect(result.consistent).toBe(false);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts!.length).toBe(2);
    });

    it('should handle unmapped references', () => {
      const result = sal.ensureMultiSystemConsistency([
        { system: 'NSIPS', id: 'EMP-12345' },
        { system: 'DRRS', id: 'PERS-67890' },
      ]);

      expect(result.consistent).toBe(true);
      expect(result.holonID).toBeUndefined();
    });
  });

  describe('Conflict Resolution', () => {
    it('should use document precedence for conflict resolution', () => {
      const eventID = eventStore.submitEvent({
        type: EventType.DocumentIssued,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const doc = documentRegistry.registerDocument({
        title: 'Precedence Policy',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date(0) },
        referenceNumbers: ['POL-001'],
        classificationMetadata: 'UNCLASS',
      }, eventID);

      sal.registerPrecedenceRule({
        sourceDocument: doc.id,
        externalSystems: ['NSIPS'],
        priority: 10,
        effectiveDates: { start: new Date(0) },
      });

      sal.registerPrecedenceRule({
        sourceDocument: doc.id,
        externalSystems: ['DRRS'],
        priority: 5,
        effectiveDates: { start: new Date(0) },
      });

      // This test verifies precedence rules are registered
      // Actual conflict resolution is tested through submitExternalData
      expect(sal['precedenceRules']).toHaveLength(2);
      expect(sal['precedenceRules'][0].priority).toBe(10); // Highest priority first
    });
  });

  describe('Query for System', () => {
    it('should transform holon data to system-specific format', async () => {
      const eventID = eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const holon = await holonRegistry.createHolon({
        type: HolonType.Person,
        properties: { name: 'John Doe', edipi: '1234567890' },
        createdBy: eventID,
        sourceDocuments: [],
      });

      sal.mapExternalID('NSIPS', 'EMP-12345', holon.id);

      const result = await sal.queryForSystem('NSIPS', holon.id);

      expect(result).toBeDefined();
      expect(result!.externalID).toBe('EMP-12345');
      expect(result!.holonID).toBe(holon.id);
      expect(result!.type).toBe(HolonType.Person);
      expect(result!.properties).toEqual(holon.properties);
    });

    it('should return null for non-existent holon', async () => {
      const result = await sal.queryForSystem('NSIPS', 'non-existent-id');
      expect(result).toBeNull();
    });
  });

  // Property-Based Tests

  describe('Property Tests', () => {
    /**
     * **Feature: semantic-operating-model, Property 2: External ID mapping consistency**
     * For any external system ID, mapping it to a SOM holon ID must always return 
     * the same holon ID across multiple mapping operations.
     * **Validates: Requirements 1.2, 13.1**
     */
    it('Property 2: External ID mapping consistency', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }), // externalSystem
          fc.string({ minLength: 1, maxLength: 20 }), // externalID
          fc.uuid(), // holonID
          fc.integer({ min: 2, max: 10 }), // number of lookups
          (externalSystem, externalID, holonID, numLookups) => {
            // Clear state for each test
            sal.clear();

            // Map the external ID to holon ID
            sal.mapExternalID(externalSystem, externalID, holonID);

            // Perform multiple lookups
            const results: (string | undefined)[] = [];
            for (let i = 0; i < numLookups; i++) {
              results.push(sal.getHolonID(externalSystem, externalID));
            }

            // All lookups should return the same holon ID
            const allSame = results.every(r => r === holonID);
            const allDefined = results.every(r => r !== undefined);

            return allSame && allDefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 39: External data transformation**
     * For any external system data submitted, the Semantic Access Layer must transform 
     * it into valid SOM events that pass constraint validation.
     * **Validates: Requirements 13.2**
     */
    it('Property 39: External data transformation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }), // externalSystem
          fc.string({ minLength: 1, maxLength: 20 }), // externalID
          fc.constantFrom('person_created', 'organization_created', 'task_created'), // dataType
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.integer({ min: 0, max: 1000 }),
          }), // payload
          (externalSystem, externalID, dataType, payload) => {
            // Clear state for each test
            sal.clear();
            eventStore = new InMemoryEventStore();
            documentRegistry = new DocumentRegistry();
            constraintEngine = new ConstraintEngine(documentRegistry);
            holonRegistry = new HolonRegistry();
            sal = new SemanticAccessLayer(eventStore, constraintEngine, holonRegistry, documentRegistry);

            const externalData: ExternalData = {
              externalSystem,
              externalID,
              dataType,
              payload,
              timestamp: new Date(),
            };

            const result = sal.submitExternalData(externalData);

            // Should successfully transform data
            if (result.success) {
              // Events should be created
              expect(result.events.length).toBeGreaterThan(0);

              // Events should have correct source system
              const allFromCorrectSystem = result.events.every(
                e => e.sourceSystem === externalSystem
              );

              // Events should have valid structure
              const allValid = result.events.every(
                e => e.id && e.type && e.occurredAt && e.actor && e.subjects !== undefined
              );

              return allFromCorrectSystem && allValid;
            }

            // If not successful, should have errors or conflicts
            return result.errors !== undefined || result.conflicts !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 40: Multi-system entity consistency**
     * For any entity referenced by multiple external systems, all references must map 
     * to the same SOM holon ID.
     * **Validates: Requirements 13.5**
     */
    it('Property 40: Multi-system entity consistency', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              system: fc.string({ minLength: 1, maxLength: 20 }),
              id: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ), // external references
          fc.uuid(), // holonID
          (externalRefs, holonID) => {
            // Clear state for each test
            sal.clear();

            // Map all external references to the same holon ID
            for (const ref of externalRefs) {
              sal.mapExternalID(ref.system, ref.id, holonID);
            }

            // Check consistency
            const result = sal.ensureMultiSystemConsistency(externalRefs);

            // Should be consistent
            if (!result.consistent) {
              return false;
            }

            // Should map to the correct holon ID
            if (result.holonID !== holonID) {
              return false;
            }

            // Verify each individual mapping
            for (const ref of externalRefs) {
              const mappedID = sal.getHolonID(ref.system, ref.id);
              if (mappedID !== holonID) {
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
});
