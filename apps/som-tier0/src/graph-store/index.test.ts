/**
 * Tests for Semantic Graph Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GraphStore, createGraphStore } from './index';
import { StateProjectionEngine, createStateProjectionEngine } from '../state-projection';
import { EventStore, createEventStore } from '../event-store';
import { HolonRegistry } from '../core/holon-registry';
import { DocumentRegistry } from '../document-registry';
import { ConstraintEngine } from '../constraint-engine';
import { RelationshipRegistry } from '../relationship-registry';
import { HolonType } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';
import { EventType } from '../core/types/event';

describe('GraphStore', () => {
  let eventStore: EventStore;
  let stateProjection: StateProjectionEngine;
  let graphStore: GraphStore;
  let holonRegistry: HolonRegistry;
  let documentRegistry: DocumentRegistry;
  let constraintEngine: ConstraintEngine;
  let relationshipRegistry: RelationshipRegistry;

  beforeEach(() => {
    eventStore = createEventStore();
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    holonRegistry = new HolonRegistry(constraintEngine, eventStore);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    stateProjection = createStateProjectionEngine(eventStore);
    graphStore = createGraphStore(stateProjection);
  });

  describe('Basic Operations', () => {
    it('should query holons by type', () => {
      // Create events for holons
      const person1Id = 'person-1';
      const person2Id = 'person-2';
      const orgId = 'org-1';

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [person1Id],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John Doe', edipi: '1234567890' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [person2Id],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Jane Smith', edipi: '0987654321' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [orgId],
        payload: {
          holonType: HolonType.Organization,
          properties: { name: 'Test Org', uic: 'TEST123' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      // Replay events and rebuild indices
      stateProjection.replayAllEvents();
      graphStore.rebuildIndices();

      // Query persons
      const persons = graphStore.queryHolonsByType(HolonType.Person);
      expect(persons).toHaveLength(2);
      expect(persons.map(p => p.id)).toContain(person1Id);
      expect(persons.map(p => p.id)).toContain(person2Id);

      // Query organizations
      const orgs = graphStore.queryHolonsByType(HolonType.Organization);
      expect(orgs).toHaveLength(1);
      expect(orgs[0].id).toBe(orgId);
    });

    it('should filter holons by properties', () => {
      // Create events for holons with different properties
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: ['person-active'],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Active Person', status: 'active' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: ['person-inactive'],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Inactive Person', status: 'inactive' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      graphStore.rebuildIndices();

      // Query with property filter
      const activePersons = graphStore.queryHolonsByType(HolonType.Person, {
        properties: { status: 'active' },
      });

      expect(activePersons).toHaveLength(1);
      expect(activePersons[0].properties.name).toBe('Active Person');
    });

    it('should traverse relationships bidirectionally', () => {
      const personId = 'person-1';
      const positionId = 'position-1';
      const relationshipId = 'rel-1';

      // Create holon events
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John Doe' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.PositionCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [positionId],
        payload: {
          holonType: HolonType.Position,
          properties: { title: 'Commander' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      // Create relationship event
      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId, positionId],
        payload: {
          relationshipId,
          relationshipType: RelationshipType.OCCUPIES,
          properties: {},
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      graphStore.rebuildIndices();

      // Traverse outgoing from person
      const outgoing = graphStore.traverseRelationships(
        personId,
        undefined,
        'outgoing'
      );
      expect(outgoing).toHaveLength(1);
      expect(outgoing[0].targetHolonID).toBe(positionId);

      // Traverse incoming to position
      const incoming = graphStore.traverseRelationships(
        positionId,
        undefined,
        'incoming'
      );
      expect(incoming).toHaveLength(1);
      expect(incoming[0].sourceHolonID).toBe(personId);

      // Traverse both directions
      const both = graphStore.traverseRelationships(
        personId,
        undefined,
        'both'
      );
      expect(both).toHaveLength(1);
    });

    it('should get connected holons', () => {
      const personId = 'person-1';
      const position1Id = 'position-1';
      const position2Id = 'position-2';

      // Create holon events
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John Doe' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.PositionCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [position1Id],
        payload: {
          holonType: HolonType.Position,
          properties: { title: 'Commander' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.PositionCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [position2Id],
        payload: {
          holonType: HolonType.Position,
          properties: { title: 'Officer' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      // Create relationship events
      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId, position1Id],
        payload: {
          relationshipId: 'rel-1',
          relationshipType: RelationshipType.OCCUPIES,
          properties: {},
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId, position2Id],
        payload: {
          relationshipId: 'rel-2',
          relationshipType: RelationshipType.OCCUPIES,
          properties: {},
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      graphStore.rebuildIndices();

      // Get connected holons
      const connected = graphStore.getConnectedHolons(
        personId,
        RelationshipType.OCCUPIES,
        'outgoing'
      );

      expect(connected).toHaveLength(2);
      expect(connected.map(h => h.id)).toContain(position1Id);
      expect(connected.map(h => h.id)).toContain(position2Id);
    });
  });

  describe('Property-Based Tests', () => {
    // **Feature: semantic-operating-model, Property 47: Query completeness by type**
    it('Property 47: Query completeness by type', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(
                HolonType.Person,
                HolonType.Position,
                HolonType.Organization,
                HolonType.Mission,
                HolonType.Objective
              ),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holonSpecs) => {
            // Create fresh instances for this test run
            const localEventStore = createEventStore();
            const localStateProjection = createStateProjectionEngine(localEventStore);
            const localGraphStore = createGraphStore(localStateProjection);

            // Create holon events
            const createdHolonIds: Array<{ id: string; type: HolonType }> = [];
            holonSpecs.forEach((spec, index) => {
              const holonId = `holon-${index}`;
              localEventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [holonId],
                payload: {
                  holonType: spec.type,
                  properties: { name: spec.name },
                },
                sourceSystem: 'test',
                causalLinks: {},
              });
              createdHolonIds.push({ id: holonId, type: spec.type });
            });

            // Replay events and rebuild indices
            localStateProjection.replayAllEvents();
            localGraphStore.rebuildIndices();

            // For each holon type, verify query completeness
            const typeGroups = new Map<HolonType, string[]>();
            for (const { id, type } of createdHolonIds) {
              if (!typeGroups.has(type)) {
                typeGroups.set(type, []);
              }
              typeGroups.get(type)!.push(id);
            }

            // Query each type and verify all holons are returned
            for (const [type, expectedIds] of typeGroups) {
              const queriedHolons = localGraphStore.queryHolonsByType(type);
              const queriedIds = queriedHolons.map(h => h.id);

              // All expected holons should be in the query results
              for (const expectedId of expectedIds) {
                if (!queriedIds.includes(expectedId)) {
                  return false;
                }
              }

              // All query results should have the correct type
              for (const holon of queriedHolons) {
                if (holon.type !== type) {
                  return false;
                }
              }

              // Query should return complete holon data
              for (const holon of queriedHolons) {
                if (!holon.id || !holon.type || !holon.properties || !holon.createdAt) {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: semantic-operating-model, Property 48: Bidirectional relationship traversal**
    it('Property 48: Bidirectional relationship traversal', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              sourceType: fc.constantFrom(
                HolonType.Person,
                HolonType.Position,
                HolonType.Organization
              ),
              targetType: fc.constantFrom(
                HolonType.Position,
                HolonType.Organization,
                HolonType.Mission
              ),
              relType: fc.constantFrom(
                RelationshipType.OCCUPIES,
                RelationshipType.BELONGS_TO,
                RelationshipType.CONTAINS
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (relationshipSpecs) => {
            // Create fresh instances for this test run
            const localEventStore = createEventStore();
            const localStateProjection = createStateProjectionEngine(localEventStore);
            const localGraphStore = createGraphStore(localStateProjection);

            // Create relationships via events
            const createdRelationships: Array<{ relationshipId: string; sourceId: string; targetId: string }> = [];
            
            relationshipSpecs.forEach((spec, index) => {
              const sourceId = `source-${index}`;
              const targetId = `target-${index}`;
              const relationshipId = `rel-${index}`;

              // Create source holon event
              localEventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [sourceId],
                payload: {
                  holonType: spec.sourceType,
                  properties: { name: 'Source' },
                },
                sourceSystem: 'test',
                causalLinks: {},
              });

              // Create target holon event
              localEventStore.submitEvent({
                type: EventType.OrganizationCreated,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [targetId],
                payload: {
                  holonType: spec.targetType,
                  properties: { name: 'Target' },
                },
                sourceSystem: 'test',
                causalLinks: {},
              });

              // Create relationship event
              localEventStore.submitEvent({
                type: EventType.AssignmentStarted,
                occurredAt: new Date(),
                actor: 'system',
                subjects: [sourceId, targetId],
                payload: {
                  relationshipId,
                  relationshipType: spec.relType,
                  properties: {},
                },
                sourceSystem: 'test',
                causalLinks: {},
              });

              createdRelationships.push({ relationshipId, sourceId, targetId });
            });

            // Replay events and rebuild indices
            localStateProjection.replayAllEvents();
            localGraphStore.rebuildIndices();

            // Verify bidirectional traversal for each relationship
            for (const { relationshipId, sourceId, targetId } of createdRelationships) {
              // Query from source (outgoing)
              const outgoing = localGraphStore.traverseRelationships(
                sourceId,
                undefined,
                'outgoing'
              );

              // Should find the relationship
              const foundOutgoing = outgoing.find(r => r.id === relationshipId);
              if (!foundOutgoing) {
                return false;
              }

              // Verify it points to the correct target
              if (foundOutgoing.targetHolonID !== targetId) {
                return false;
              }

              // Query from target (incoming)
              const incoming = localGraphStore.traverseRelationships(
                targetId,
                undefined,
                'incoming'
              );

              // Should find the relationship
              const foundIncoming = incoming.find(r => r.id === relationshipId);
              if (!foundIncoming) {
                return false;
              }

              // Verify it points to the correct source
              if (foundIncoming.sourceHolonID !== sourceId) {
                return false;
              }

              // Both queries should return the same relationship
              if (foundOutgoing.id !== foundIncoming.id) {
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

  describe('Pattern Matching', () => {
    it('should match simple holon patterns', () => {
      // Create test data via events
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: ['person-john'],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John', role: 'commander' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: ['person-jane'],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Jane', role: 'officer' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      graphStore.rebuildIndices();

      // Match pattern
      const matches = graphStore.matchPattern({
        holonPatterns: [
          { type: HolonType.Person, properties: { role: 'commander' } },
        ],
      });

      expect(matches).toHaveLength(1);
      expect(matches[0].holons.get('0')?.properties.name).toBe('John');
    });

    it('should match relationship patterns', () => {
      const personId = 'person-john';
      const positionId = 'position-cmd';

      // Create test data via events
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.PositionCreated,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [positionId],
        payload: {
          holonType: HolonType.Position,
          properties: { title: 'Commander' },
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date(),
        actor: 'system',
        subjects: [personId, positionId],
        payload: {
          relationshipId: 'rel-occupies',
          relationshipType: RelationshipType.OCCUPIES,
          properties: {},
        },
        sourceSystem: 'test',
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      graphStore.rebuildIndices();

      // Match pattern
      const matches = graphStore.matchPattern({
        holonPatterns: [
          { type: HolonType.Person, alias: 'person' },
        ],
        relationshipPatterns: [
          { type: RelationshipType.OCCUPIES, sourceAlias: 'person', targetAlias: 'position' },
        ],
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].holons.get('person')?.type).toBe(HolonType.Person);
      expect(matches[0].holons.get('position')?.type).toBe(HolonType.Position);
      expect(matches[0].relationships).toHaveLength(1);
    });
  });
});
