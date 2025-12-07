/**
 * Tests for Relationship Registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RelationshipRegistry, CreateRelationshipParams } from './index';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { InMemoryEventStore } from '../event-store';
import { RelationshipType } from '@som/shared-types';
import { HolonType } from '@som/shared-types';

describe('RelationshipRegistry', () => {
  let registry: RelationshipRegistry;
  let constraintEngine: ConstraintEngine;
  let documentRegistry: DocumentRegistry;
  let eventStore: InMemoryEventStore;

  beforeEach(() => {
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    eventStore = new InMemoryEventStore();
    registry = new RelationshipRegistry(constraintEngine, eventStore);
  });

  describe('Basic Operations', () => {
    it('should create a relationship with a unique ID', async () => {
      const params: CreateRelationshipParams = {
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      };

      const result = await registry.createRelationship(params);

      expect(result.validation.valid).toBe(true);
      expect(result.relationship).toBeDefined();
      expect(result.relationship!.id).toBeDefined();
      expect(result.relationship!.type).toBe(RelationshipType.OCCUPIES);
    });

    it('should retrieve a relationship by ID', async () => {
      const params: CreateRelationshipParams = {
        type: RelationshipType.BELONGS_TO,
        sourceHolonID: 'position-1',
        targetHolonID: 'org-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      };

      const result = await registry.createRelationship(params);
      const retrieved = await registry.getRelationship(result.relationship!.id);

      expect(retrieved).toEqual(result.relationship);
    });

    it('should retrieve relationships from a source holon', async () => {
      const sourceHolonID = 'person-1';

      await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID,
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      await registry.createRelationship({
        type: RelationshipType.HAS_QUAL,
        sourceHolonID,
        targetHolonID: 'qual-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const relationships = await registry.getRelationshipsFrom(sourceHolonID);
      expect(relationships).toHaveLength(2);
    });

    it('should retrieve relationships to a target holon', async () => {
      const targetHolonID = 'position-1';

      await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID,
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-2',
        targetHolonID,
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const relationships = await registry.getRelationshipsTo(targetHolonID);
      expect(relationships).toHaveLength(2);
    });

    it('should filter relationships by type', async () => {
      const sourceHolonID = 'person-1';

      await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID,
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      await registry.createRelationship({
        type: RelationshipType.HAS_QUAL,
        sourceHolonID,
        targetHolonID: 'qual-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const occupiesRels = await registry.getRelationshipsFrom(sourceHolonID, RelationshipType.OCCUPIES);
      expect(occupiesRels).toHaveLength(1);
      expect(occupiesRels[0].type).toBe(RelationshipType.OCCUPIES);
    });

    it('should end a relationship', async () => {
      const result = await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const endResult = await registry.endRelationship({
        relationshipID: result.relationship!.id,
        endDate: new Date('2024-06-01'),
        reason: 'Transfer',
        actor: 'admin-1',
        sourceSystem: 'test-system',
      });

      expect(endResult.success).toBe(true);
      expect(endResult.validation.valid).toBe(true);

      const updated = await registry.getRelationship(result.relationship!.id);
      expect(updated!.effectiveEnd).toEqual(new Date('2024-06-01'));
    });

    it('should not allow ending a relationship with end date before start date', async () => {
      const result = await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const endResult = await registry.endRelationship({
        relationshipID: result.relationship!.id,
        endDate: new Date('2023-12-01'),
        reason: 'Invalid',
        actor: 'admin-1',
        sourceSystem: 'test-system',
      });

      expect(endResult.success).toBe(false);
      expect(endResult.validation.valid).toBe(false);
    });

    it('should filter relationships by effective date', async () => {
      const result1 = await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        effectiveEnd: new Date('2024-06-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const result2 = await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-2',
        properties: {},
        effectiveStart: new Date('2024-07-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      expect(result1.validation.valid).toBe(true);
      expect(result2.validation.valid).toBe(true);

      const activeInMarch = await registry.getRelationshipsFrom('person-1', undefined, {
        effectiveAt: new Date('2024-03-01'),
        includeEnded: true,
      });
      expect(activeInMarch).toHaveLength(1);
      expect(activeInMarch[0].targetHolonID).toBe('position-1');

      const activeInAugust = await registry.getRelationshipsFrom('person-1', undefined, {
        effectiveAt: new Date('2024-08-01'),
        includeEnded: true,
      });
      expect(activeInAugust).toHaveLength(1);
      expect(activeInAugust[0].targetHolonID).toBe('position-2');
    });
  });

  describe('Event Generation', () => {
    it('should generate an event when creating a relationship', async () => {
      const result = await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      expect(result.relationship!.createdBy).toBeDefined();

      const event = eventStore.getEvent(result.relationship!.createdBy);
      expect(event).toBeDefined();
      expect(event!.subjects).toContain('person-1');
      expect(event!.subjects).toContain('position-1');
    });

    it('should generate an event when ending a relationship', async () => {
      const result = await registry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: 'person-1',
        targetHolonID: 'position-1',
        properties: {},
        effectiveStart: new Date('2024-01-01'),
        sourceSystem: 'test-system',
        sourceDocuments: ['doc-1'],
        actor: 'admin-1',
      });

      const endResult = await registry.endRelationship({
        relationshipID: result.relationship!.id,
        endDate: new Date('2024-06-01'),
        reason: 'Transfer',
        actor: 'admin-1',
        sourceSystem: 'test-system',
      });

      expect(endResult.event).toBeDefined();

      const event = eventStore.getEvent(endResult.event!);
      expect(event).toBeDefined();
      expect(event!.payload.reason).toBe('Transfer');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: semantic-operating-model, Property 6: Relationship completeness**
     * For any relationship created, it must have a unique ID, directionality, 
     * multiplicity constraints, effective dates, and provenance metadata.
     * **Validates: Requirements 2.1**
     */
    it('Property 6: Relationship completeness', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random relationship parameters
          fc.record({
            type: fc.constantFrom(...Object.values(RelationshipType)),
            sourceHolonID: fc.uuid(),
            targetHolonID: fc.uuid(),
            properties: fc.dictionary(fc.string(), fc.anything()),
            effectiveStart: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-11-01') }),
            effectiveEnd: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2024-11-01') }), { nil: undefined }),
            sourceSystem: fc.string({ minLength: 1 }),
            sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
            authorityLevel: fc.constantFrom('authoritative', 'derived', 'inferred'),
            confidenceScore: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined }),
            actor: fc.uuid(),
          }),
          async (params) => {
            // Ensure effectiveEnd is after effectiveStart if it exists
            if (params.effectiveEnd && params.effectiveEnd < params.effectiveStart) {
              params.effectiveEnd = new Date(params.effectiveStart.getTime() + 86400000); // Add 1 day
            }

            const result = await registry.createRelationship(params as CreateRelationshipParams);

            // If validation failed, skip this test case (constraint violation is acceptable)
            if (!result.validation.valid) {
              return true;
            }

            const relationship = result.relationship!;

            // Check that relationship has all required fields
            expect(relationship.id).toBeDefined();
            expect(typeof relationship.id).toBe('string');
            expect(relationship.id.length).toBeGreaterThan(0);

            // Check directionality
            expect(relationship.sourceHolonID).toBe(params.sourceHolonID);
            expect(relationship.targetHolonID).toBe(params.targetHolonID);
            expect(relationship.type).toBe(params.type);

            // Check effective dates
            expect(relationship.effectiveStart).toEqual(params.effectiveStart);
            if (params.effectiveEnd) {
              expect(relationship.effectiveEnd).toEqual(params.effectiveEnd);
            }

            // Check provenance metadata
            expect(relationship.sourceSystem).toBe(params.sourceSystem);
            expect(relationship.sourceDocuments).toEqual(params.sourceDocuments);
            expect(relationship.createdBy).toBeDefined();
            expect(typeof relationship.createdBy).toBe('string');

            // Check authority level
            expect(relationship.authorityLevel).toBe(params.authorityLevel || 'authoritative');

            // Check confidence score if provided
            if (params.confidenceScore !== undefined) {
              expect(relationship.confidenceScore).toBe(params.confidenceScore);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 8: Relationship change event generation**
     * For any relationship modification, an event must be created with complete 
     * source document and system provenance.
     * **Validates: Requirements 2.3**
     */
    it('Property 8: Relationship change event generation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random relationship creation and modification parameters
          fc.record({
            createParams: fc.record({
              type: fc.constantFrom(...Object.values(RelationshipType)),
              sourceHolonID: fc.uuid(),
              targetHolonID: fc.uuid(),
              properties: fc.dictionary(fc.string(), fc.anything()),
              effectiveStart: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') }),
              sourceSystem: fc.string({ minLength: 1 }),
              sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
              actor: fc.uuid(),
            }),
            endParams: fc.record({
              endDate: fc.date({ min: new Date('2024-01-02'), max: new Date('2024-11-01') }),
              reason: fc.string({ minLength: 1 }),
              actor: fc.uuid(),
              sourceSystem: fc.string({ minLength: 1 }),
            }),
          }),
          async ({ createParams, endParams }) => {
            // Ensure end date is after start date
            if (endParams.endDate <= createParams.effectiveStart) {
              endParams.endDate = new Date(createParams.effectiveStart.getTime() + 86400000);
            }

            // Create relationship
            const createResult = await registry.createRelationship(createParams as CreateRelationshipParams);

            // If creation failed, skip this test case
            if (!createResult.validation.valid || !createResult.relationship) {
              return true;
            }

            const relationship = createResult.relationship;

            // Verify creation event was generated
            const creationEvent = eventStore.getEvent(relationship.createdBy);
            expect(creationEvent).toBeDefined();
            expect(creationEvent!.subjects).toContain(createParams.sourceHolonID);
            expect(creationEvent!.subjects).toContain(createParams.targetHolonID);
            expect(creationEvent!.sourceSystem).toBe(createParams.sourceSystem);
            expect(creationEvent!.sourceDocument).toBe(createParams.sourceDocuments[0]);
            expect(creationEvent!.actor).toBe(createParams.actor);

            // End relationship
            const endResult = await registry.endRelationship({
              relationshipID: relationship.id,
              ...endParams,
            });

            // If ending failed, skip this test case
            if (!endResult.success || !endResult.event) {
              return true;
            }

            // Verify modification event was generated
            const modificationEvent = eventStore.getEvent(endResult.event);
            expect(modificationEvent).toBeDefined();
            expect(modificationEvent!.subjects).toContain(createParams.sourceHolonID);
            expect(modificationEvent!.subjects).toContain(createParams.targetHolonID);
            expect(modificationEvent!.sourceSystem).toBe(endParams.sourceSystem);
            expect(modificationEvent!.actor).toBe(endParams.actor);
            expect(modificationEvent!.payload.reason).toBe(endParams.reason);
            expect(modificationEvent!.payload.relationshipId).toBe(relationship.id);

            // Verify causal link to creation event
            expect(modificationEvent!.causalLinks.precededBy).toContain(relationship.createdBy);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
