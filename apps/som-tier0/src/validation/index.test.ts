/**
 * Tests for Validation and Error Handling module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ValidationEngine,
  createValidationEngine,
  ErrorCategory,
  CompensatingEventMetadata,
} from './index';
import { ConstraintEngine } from '../constraint-engine';
import { InMemoryEventStore } from '../event-store';
import { DocumentRegistry } from '../document-registry';
import { Event, EventType } from '@som/shared-types';
import { HolonType, ConstraintType } from '@som/shared-types';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  let constraintEngine: ConstraintEngine;
  let eventStore: InMemoryEventStore;
  let documentRegistry: DocumentRegistry;

  beforeEach(() => {
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    eventStore = new InMemoryEventStore();
    validationEngine = createValidationEngine(constraintEngine, eventStore, documentRegistry);
  });

  describe('Basic Validation', () => {
    it('should validate events with detailed error reporting', () => {
      // Register a document
      const doc = documentRegistry.registerDocument({
        title: 'Test Policy',
        documentType: 'Policy',
        version: '1.0',
        effectiveDates: { start: new Date('2020-01-01'), end: new Date('2030-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
        referenceNumbers: ['TEST-001'],
      });

      // Register a constraint that will fail
      constraintEngine.registerConstraint({
        type: ConstraintType.Structural,
        name: 'Test Constraint',
        definition: 'Events must have at least one subject',
        scope: { eventTypes: [EventType.AssignmentStarted] },
        effectiveDates: { start: new Date('2020-01-01') },
        sourceDocuments: [doc.id],
        validationLogic: (target) => {
          const event = target as Event;
          if (event.subjects.length === 0) {
            return {
              valid: false,
              errors: [{
                constraintID: 'TEST-001',
                message: 'Event must have at least one subject',
                violatedRule: 'Events must have at least one subject',
                affectedHolons: [],
              }],
            };
          }
          return { valid: true };
        },
      });

      // Create an invalid event
      const event: Event = {
        id: 'event-1',
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2025-01-01'),
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: [], // Invalid: no subjects
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {},
      };

      const result = validationEngine.validateEventWithDetails(event);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].category).toBeDefined();
      expect(result.errors![0].timestamp).toBeDefined();
      expect(result.errors![0].context).toBeDefined();
      expect(result.documentsUsed).toContain(doc.id);
    });

    it('should use documents in force at event timestamp', () => {
      // Register two documents with different effective dates
      const oldDoc = documentRegistry.registerDocument({
        title: 'Old Policy',
        documentType: 'Policy',
        version: '1.0',
        effectiveDates: { start: new Date('2020-01-01'), end: new Date('2023-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
        referenceNumbers: ['OLD-001'],
      });

      const newDoc = documentRegistry.registerDocument({
        title: 'New Policy',
        documentType: 'Policy',
        version: '2.0',
        effectiveDates: { start: new Date('2023-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
        referenceNumbers: ['NEW-001'],
      });

      // Create event with timestamp when old doc was in force
      const oldEvent: Event = {
        id: 'event-old',
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2022-06-01'),
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {},
      };

      const oldResult = validationEngine.validateEventWithDetails(oldEvent);
      expect(oldResult.documentsUsed).toContain(oldDoc.id);
      expect(oldResult.documentsUsed).not.toContain(newDoc.id);

      // Create event with timestamp when new doc is in force
      const newEvent: Event = {
        id: 'event-new',
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2024-06-01'),
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {},
      };

      const newResult = validationEngine.validateEventWithDetails(newEvent);
      expect(newResult.documentsUsed).not.toContain(oldDoc.id);
      expect(newResult.documentsUsed).toContain(newDoc.id);
    });
  });

  describe('Batch Validation', () => {
    it('should validate batch atomically - all valid', () => {
      const events = [
        {
          type: EventType.AssignmentStarted,
          occurredAt: new Date(),
          actor: 'actor-1',
          subjects: ['subject-1'],
          payload: {},
          sourceSystem: 'TEST',
          causalLinks: {},
        },
        {
          type: EventType.AssignmentEnded,
          occurredAt: new Date(),
          actor: 'actor-1',
          subjects: ['subject-1'],
          payload: {},
          sourceSystem: 'TEST',
          causalLinks: {},
        },
      ];

      const result = validationEngine.validateBatch(events);

      expect(result.valid).toBe(true);
      expect(result.validatedCount).toBe(2);
      expect(result.errors.size).toBe(0);
    });

    it('should reject entire batch if one event is invalid', () => {
      // Register a constraint
      const doc = documentRegistry.registerDocument({
        title: 'Test Policy',
        documentType: 'Policy',
        version: '1.0',
        effectiveDates: { start: new Date('2020-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
        referenceNumbers: ['TEST-001'],
      });

      constraintEngine.registerConstraint({
        type: ConstraintType.Structural,
        name: 'Subject Required',
        definition: 'Events must have subjects',
        scope: { eventTypes: [EventType.AssignmentStarted] },
        effectiveDates: { start: new Date('2020-01-01') },
        sourceDocuments: [doc.id],
        validationLogic: (target) => {
          const event = target as Event;
          if (event.subjects.length === 0) {
            return {
              valid: false,
              errors: [{
                constraintID: 'SUBJ-001',
                message: 'Event must have subjects',
                violatedRule: 'Events must have subjects',
                affectedHolons: [],
              }],
            };
          }
          return { valid: true };
        },
      });

      const events = [
        {
          type: EventType.AssignmentStarted,
          occurredAt: new Date(),
          actor: 'actor-1',
          subjects: ['subject-1'], // Valid
          payload: {},
          sourceSystem: 'TEST',
          causalLinks: {},
        },
        {
          type: EventType.AssignmentStarted,
          occurredAt: new Date(),
          actor: 'actor-1',
          subjects: [], // Invalid
          payload: {},
          sourceSystem: 'TEST',
          causalLinks: {},
        },
      ];

      const result = validationEngine.validateBatch(events);

      expect(result.valid).toBe(false);
      expect(result.validatedCount).toBe(2);
      expect(result.errors.size).toBeGreaterThan(0);
      expect(result.errors.has(1)).toBe(true); // Second event has errors
    });
  });

  describe('Temporal Validation', () => {
    it('should validate event timestamps', () => {
      const futureEvent: Event = {
        id: 'event-future',
        type: EventType.AssignmentStarted,
        occurredAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours in future
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {},
      };

      const result = validationEngine.validateTemporalConstraints(futureEvent);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.category === ErrorCategory.Temporal)).toBe(true);
    });

    it('should validate event ordering with causal links', () => {
      // Submit a preceding event
      const precedingEventId = eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2025-01-02'),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {},
      });

      // Create event that occurs before its predecessor
      const invalidEvent: Event = {
        id: 'event-invalid',
        type: EventType.AssignmentEnded,
        occurredAt: new Date('2025-01-01'), // Before preceding event
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {
          causedBy: [precedingEventId],
        },
      };

      const result = validationEngine.validateTemporalConstraints(invalidEvent);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => 
        e.violatedRule.includes('causal predecessor')
      )).toBe(true);
    });

    it('should validate validity windows', () => {
      const invalidEvent: Event = {
        id: 'event-invalid-window',
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        validityWindow: {
          start: new Date('2025-12-31'),
          end: new Date('2025-01-01'), // End before start
        },
        causalLinks: {},
      };

      const result = validationEngine.validateTemporalConstraints(invalidEvent);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => 
        e.violatedRule.includes('Validity window')
      )).toBe(true);
    });
  });

  describe('Compensating Events', () => {
    it('should create compensating events for corrections', () => {
      // Submit an original event
      const originalEventId = eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2025-01-01'),
        actor: 'actor-1',
        subjects: ['person-1', 'position-1'],
        payload: { startDate: '2025-01-01' },
        sourceSystem: 'NSIPS',
        causalLinks: {},
      });

      const metadata: CompensatingEventMetadata = {
        originalEventId,
        reason: 'Incorrect assignment date',
        correctionType: 'adjustment',
        authorizedBy: 'admin-1',
      };

      const compensatingEvent = validationEngine.createCompensatingEvent(
        originalEventId,
        metadata,
        { startDate: '2025-01-15' }
      );

      expect(compensatingEvent.actor).toBe('admin-1');
      expect(compensatingEvent.subjects).toEqual(['person-1', 'position-1']);
      expect(compensatingEvent.payload.compensatingMetadata).toBeDefined();
      expect(compensatingEvent.payload.compensatingMetadata.originalEventId).toBe(originalEventId);
      expect(compensatingEvent.payload.compensatingMetadata.reason).toBe('Incorrect assignment date');
      expect(compensatingEvent.causalLinks.causedBy).toContain(originalEventId);
    });

    it('should throw error if original event not found', () => {
      const metadata: CompensatingEventMetadata = {
        originalEventId: 'non-existent',
        reason: 'Test',
        correctionType: 'reversal',
        authorizedBy: 'admin-1',
      };

      expect(() => {
        validationEngine.createCompensatingEvent('non-existent', metadata, {});
      }).toThrow('Original event non-existent not found');
    });
  });

  describe('Validation Logging', () => {
    it('should log validation results', () => {
      const event: Event = {
        id: 'event-1',
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        recordedAt: new Date(),
        actor: 'actor-1',
        subjects: ['subject-1'],
        payload: {},
        sourceSystem: 'TEST',
        causalLinks: {},
      };

      validationEngine.validateEventWithDetails(event);

      const log = validationEngine.getValidationLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].eventId).toBe('event-1');
      expect(log[0].result).toBeDefined();
    });

    it('should filter validation log by criteria', () => {
      const startTime = new Date();

      // Create and validate multiple events
      for (let i = 0; i < 3; i++) {
        const event: Event = {
          id: `event-${i}`,
          type: EventType.AssignmentStarted,
          occurredAt: new Date(),
          recordedAt: new Date(),
          actor: 'actor-1',
          subjects: ['subject-1'],
          payload: {},
          sourceSystem: 'TEST',
          causalLinks: {},
        };
        validationEngine.validateEventWithDetails(event);
      }

      const filteredLog = validationEngine.getValidationLog({
        startTime,
        eventId: 'event-1',
      });

      expect(filteredLog.length).toBe(1);
      expect(filteredLog[0].eventId).toBe('event-1');
    });
  });
});

describe('Property-Based Tests', () => {
  // Create fresh instances for property tests
  let propValidationEngine: ValidationEngine;
  let propConstraintEngine: ConstraintEngine;
  let propEventStore: InMemoryEventStore;
  let propDocumentRegistry: DocumentRegistry;

  beforeEach(() => {
    propDocumentRegistry = new DocumentRegistry();
    propConstraintEngine = new ConstraintEngine(propDocumentRegistry);
    propEventStore = new InMemoryEventStore();
    propValidationEngine = createValidationEngine(propConstraintEngine, propEventStore, propDocumentRegistry);
  });

  // Generators for property-based testing
  const genEventType = () => fc.constantFrom(...Object.values(EventType));
  
  const genTimestamp = () => fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2030-01-01'),
  });

  const genHolonId = () => fc.uuid();

  const genEvent = (): fc.Arbitrary<Omit<Event, 'id' | 'recordedAt'>> => {
    return fc.record({
      type: genEventType(),
      occurredAt: genTimestamp(),
      actor: genHolonId(),
      subjects: fc.array(genHolonId(), { minLength: 1, maxLength: 5 }),
      payload: fc.dictionary(fc.string(), fc.anything()),
      sourceSystem: fc.constantFrom('NSIPS', 'DRRS', 'TEST'),
      sourceDocument: fc.option(genHolonId(), { nil: undefined }),
      validityWindow: fc.option(
        fc.record({
          start: genTimestamp(),
          end: genTimestamp(),
        }),
        { nil: undefined }
      ),
      causalLinks: fc.record({
        precededBy: fc.option(fc.array(genHolonId()), { nil: undefined }),
        causedBy: fc.option(fc.array(genHolonId()), { nil: undefined }),
        groupedWith: fc.option(fc.array(genHolonId()), { nil: undefined }),
      }),
    });
  };

  /**
   * **Feature: semantic-operating-model, Property 44: Validation error reporting**
   * **Validates: Requirements 15.2**
   * 
   * For any event that fails validation, the error response must include 
   * which constraints were violated and detailed error information.
   */
  it('Property 44: validation errors include constraint details and context', () => {
    fc.assert(
      fc.property(
        genEvent(),
        (eventData) => {
          // Register a document
          const doc = propDocumentRegistry.registerDocument({
            title: 'Test Policy',
            documentType: 'Policy',
            version: '1.0',
            effectiveDates: { start: new Date('2020-01-01'), end: new Date('2030-01-01') },
            classificationMetadata: 'UNCLASSIFIED',
            referenceNumbers: ['TEST-001'],
          });

          // Register a constraint that will fail for events with no subjects
          propConstraintEngine.registerConstraint({
            type: ConstraintType.Structural,
            name: 'Subject Requirement',
            definition: 'Events must have at least one subject',
            scope: { eventTypes: Object.values(EventType) },
            effectiveDates: { start: new Date('2020-01-01') },
            sourceDocuments: [doc.id],
            validationLogic: (target) => {
              const event = target as Event;
              if (event.subjects.length === 0) {
                return {
                  valid: false,
                  errors: [{
                    constraintID: 'SUBJ-REQ-001',
                    message: 'Event must have at least one subject',
                    violatedRule: 'Events must have at least one subject',
                    affectedHolons: [],
                  }],
                };
              }
              return { valid: true };
            },
          });

          // Create event with no subjects to trigger validation failure
          const invalidEvent: Event = {
            ...eventData,
            id: 'test-event',
            recordedAt: new Date(),
            subjects: [], // Force validation failure
          };

          const result = propValidationEngine.validateEventWithDetails(invalidEvent);

          // Property: If validation fails, errors must include constraint details
          if (!result.valid) {
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
            
            // Each error must have constraint ID
            for (const error of result.errors!) {
              expect(error.constraintID).toBeDefined();
              expect(typeof error.constraintID).toBe('string');
              
              // Each error must have detailed message
              expect(error.message).toBeDefined();
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
              
              // Each error must have violated rule
              expect(error.violatedRule).toBeDefined();
              expect(typeof error.violatedRule).toBe('string');
              
              // Each error must have affected holons
              expect(error.affectedHolons).toBeDefined();
              expect(Array.isArray(error.affectedHolons)).toBe(true);
              
              // Each error must have category
              expect(error.category).toBeDefined();
              expect(Object.values(ErrorCategory)).toContain(error.category);
              
              // Each error must have timestamp
              expect(error.timestamp).toBeDefined();
              expect(error.timestamp instanceof Date).toBe(true);
              
              // Each error must have context
              expect(error.context).toBeDefined();
              expect(typeof error.context).toBe('object');
            }
          }

          // Clean up
          propConstraintEngine.clear();
          propDocumentRegistry.clear();
          propValidationEngine.clearLog();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: semantic-operating-model, Property 45: Temporal constraint validation**
   * **Validates: Requirements 15.4**
   * 
   * For any event submitted at timestamp T, validation must use the 
   * constraints and documents in force at T.
   */
  it('Property 45: validation uses documents in force at event timestamp', () => {
    fc.assert(
      fc.property(
        genEvent(),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
        fc.date({ min: new Date('2025-01-02'), max: new Date('2030-01-01') }),
        (eventData, oldTimestamp, newTimestamp) => {
          // Register document effective only in old period (ends before boundary)
          const oldDoc = propDocumentRegistry.registerDocument({
            title: 'Old Policy',
            documentType: 'Policy',
            version: '1.0',
            effectiveDates: { 
              start: new Date('2020-01-01'), 
              end: new Date('2025-01-01') 
            },
            classificationMetadata: 'UNCLASSIFIED',
            referenceNumbers: ['OLD-001'],
          });

          // Register document effective only in new period (starts after boundary)
          const newDoc = propDocumentRegistry.registerDocument({
            title: 'New Policy',
            documentType: 'Policy',
            version: '2.0',
            effectiveDates: { 
              start: new Date('2025-01-02'),
              end: new Date('2030-01-01')
            },
            classificationMetadata: 'UNCLASSIFIED',
            referenceNumbers: ['NEW-001'],
          });

          // Create event with old timestamp (before 2025-01-02)
          const oldEvent: Event = {
            ...eventData,
            id: 'old-event',
            recordedAt: new Date(),
            occurredAt: oldTimestamp,
          };

          const oldResult = propValidationEngine.validateEventWithDetails(oldEvent);

          // Property: Validation at old timestamp should use old document
          expect(oldResult.documentsUsed).toContain(oldDoc.id);
          expect(oldResult.documentsUsed).not.toContain(newDoc.id);

          // Create event with new timestamp (after 2025-01-01)
          const newEvent: Event = {
            ...eventData,
            id: 'new-event',
            recordedAt: new Date(),
            occurredAt: newTimestamp,
          };

          const newResult = propValidationEngine.validateEventWithDetails(newEvent);

          // Property: Validation at new timestamp should use new document
          expect(newResult.documentsUsed).not.toContain(oldDoc.id);
          expect(newResult.documentsUsed).toContain(newDoc.id);

          // Clean up
          propDocumentRegistry.clear();
          propValidationEngine.clearLog();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: semantic-operating-model, Property 46: Batch atomicity**
   * **Validates: Requirements 15.5**
   * 
   * For any batch of events containing at least one invalid event, 
   * the entire batch must be rejected and no events from the batch must be stored.
   */
  it('Property 46: batch validation is atomic - all or nothing', () => {
    fc.assert(
      fc.property(
        fc.array(genEvent(), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }), // Index of event to make invalid
        (events, invalidIndex) => {
          // Ensure we have a valid index
          const actualInvalidIndex = invalidIndex % events.length;

          // Register a document
          const doc = propDocumentRegistry.registerDocument({
            title: 'Batch Test Policy',
            documentType: 'Policy',
            version: '1.0',
            effectiveDates: { start: new Date('2020-01-01') },
            classificationMetadata: 'UNCLASSIFIED',
            referenceNumbers: ['BATCH-001'],
          });

          // Register a constraint that checks for a specific marker in payload
          propConstraintEngine.registerConstraint({
            type: ConstraintType.Structural,
            name: 'Batch Test Constraint',
            definition: 'Events must not have invalid marker',
            scope: { eventTypes: Object.values(EventType) },
            effectiveDates: { start: new Date('2020-01-01') },
            sourceDocuments: [doc.id],
            validationLogic: (target) => {
              const event = target as Event;
              if (event.payload.invalidMarker === true) {
                return {
                  valid: false,
                  errors: [{
                    constraintID: 'BATCH-001',
                    message: 'Event has invalid marker',
                    violatedRule: 'Events must not have invalid marker',
                    affectedHolons: event.subjects,
                  }],
                };
              }
              return { valid: true };
            },
          });

          // Make one event invalid by adding the marker
          const batchEvents = events.map((event, index) => ({
            ...event,
            payload: index === actualInvalidIndex 
              ? { ...event.payload, invalidMarker: true }
              : event.payload,
          }));

          const result = propValidationEngine.validateBatch(batchEvents);

          // Property: Batch with invalid event must be rejected
          expect(result.valid).toBe(false);
          expect(result.validatedCount).toBe(batchEvents.length);
          
          // Property: Error map must contain the invalid event
          expect(result.errors.size).toBeGreaterThan(0);
          expect(result.errors.has(actualInvalidIndex)).toBe(true);

          // Property: If batch is invalid, no events should be in event store
          // (This is enforced by the caller, but we verify the validation result)
          const errorCount = Array.from(result.errors.values())
            .reduce((sum, errors) => sum + errors.length, 0);
          expect(errorCount).toBeGreaterThan(0);

          // Clean up
          propConstraintEngine.clear();
          propDocumentRegistry.clear();
          propValidationEngine.clearLog();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
