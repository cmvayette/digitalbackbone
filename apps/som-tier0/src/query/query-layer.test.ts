/**
 * Tests for the Unified Query Layer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QueryLayer, createQueryLayer } from './query-layer';
import { TemporalQueryEngine, createTemporalQueryEngine } from './temporal-query-engine';
import { GraphStore, createGraphStore } from '../graph-store';
import { AccessControlEngine, createAccessControlEngine, Role, ClassificationLevel, UserContext } from '../access-control';
import { IEventStore as EventStore, createEventStore } from '../event-store';
import { StateProjectionEngine, createStateProjectionEngine } from '../state-projection';
import { InMemoryHolonRepository as HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { DocumentRegistry } from '../document-registry';
import { ConstraintEngine } from '../constraint-engine';
import { HolonType, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

describe('QueryLayer', () => {
  let queryLayer: QueryLayer;
  let eventStore: EventStore;
  let stateProjection: StateProjectionEngine;
  let holonRegistry: HolonRegistry;
  let relationshipRegistry: RelationshipRegistry;
  let documentRegistry: DocumentRegistry;
  let constraintEngine: ConstraintEngine;
  let temporalQueryEngine: TemporalQueryEngine;
  let graphStore: GraphStore;
  let accessControl: AccessControlEngine;

  // Test users
  let adminUser: UserContext;
  let viewerUser: UserContext;
  let analystUser: UserContext;

  beforeEach(async () => {
    // Create core components
    eventStore = createEventStore();
    holonRegistry = new HolonRegistry();
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);

    (constraintEngine as any).relationshipRegistry = relationshipRegistry;

    stateProjection = createStateProjectionEngine(eventStore);
    temporalQueryEngine = createTemporalQueryEngine(eventStore, stateProjection, holonRegistry, relationshipRegistry);
    graphStore = createGraphStore(stateProjection);
    accessControl = createAccessControlEngine(documentRegistry);

    queryLayer = createQueryLayer(temporalQueryEngine, graphStore, accessControl, eventStore);

    // Create test users
    adminUser = {
      userId: 'admin-1',
      roles: [Role.Administrator],
      clearanceLevel: ClassificationLevel.TopSecret,
    };

    viewerUser = {
      userId: 'viewer-1',
      roles: [Role.Viewer],
      clearanceLevel: ClassificationLevel.Unclassified,
    };

    analystUser = {
      userId: 'analyst-1',
      roles: [Role.Analyst],
      clearanceLevel: ClassificationLevel.Secret,
    };
  });

  describe('Unified Search', () => {
    it('should search across multiple holon types with ranking', async () => {
      // 1. Setup Test Data
      const doc = documentRegistry.registerDocument({
        referenceNumbers: ['SEARCH-TEST'],
        title: 'Search Test Doc',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Unclassified',
      }, 'event-search');

      // Add Person "John Searchable"
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: ['person-search'],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John Searchable', rank: 'Captain' }
        },
        sourceSystem: 'test',
        sourceDocument: doc.id,
        causalLinks: {},
      });

      // Add Org "Searchable Operations"
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: ['org-search'],
        payload: {
          holonType: HolonType.Organization,
          properties: { name: 'Searchable Operations', uics: ['V1234'] }
        },
        sourceSystem: 'test',
        sourceDocument: doc.id,
        causalLinks: {},
      });

      // Add Position "Searchable Officer"
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: ['pos-search'],
        payload: {
          holonType: HolonType.Position,
          properties: { title: 'Searchable Officer' }
        },
        sourceSystem: 'test',
        sourceDocument: doc.id,
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      await graphStore.rebuildIndices();

      // 2. Perform Search for "Searchable"
      const results = await queryLayer.unifiedSearch(adminUser, 'searchable');

      // 3. Verify Results
      expect(results.data).toHaveLength(3);

      // Verify Types
      const types = results.data.map(r => r.type);
      expect(types).toContain(HolonType.Person);
      expect(types).toContain(HolonType.Organization);
      expect(types).toContain(HolonType.Position);

      // Verify Relevance Ranking - Exact name match (10) vs just partial? 
      // "John Searchable" (Person) should match name (+10)
      // "Searchable Operations" (Org) should match name (+10)
      // "Searchable Officer" (Pos) should match title (+10)
      // All have score 10 basically.
      // Let's test a subtitle match.
      const personSubtitle = results.data.find(r => r.id === 'person-search');
      expect(personSubtitle?.relevance).toBeGreaterThanOrEqual(10);
      expect(personSubtitle?.subtitle).toBe('Captain');
    });

    it('should filter search results based on access control', async () => {
      const secretDoc = documentRegistry.registerDocument({
        referenceNumbers: ['SEARCH-SECRET'],
        title: 'Secret Doc',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Secret',
      }, 'event-secret');

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: ['person-secret-search'],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Secret Searchable' }
        },
        sourceSystem: 'test',
        sourceDocument: secretDoc.id,
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      await graphStore.rebuildIndices();

      // Admin (TopSecret) should see it
      const adminResults = await queryLayer.unifiedSearch(adminUser, 'secret');
      const foundAdmin = adminResults.data.find(r => r.id === 'person-secret-search');
      expect(foundAdmin).toBeDefined();

      // Viewer (Unclassified) should NOT see it
      const viewerResults = await queryLayer.unifiedSearch(viewerUser, 'secret');
      const foundViewer = viewerResults.data.find(r => r.id === 'person-secret-search');
      expect(foundViewer).toBeUndefined();
      expect(viewerResults.filtered).toBe(true);
    });
  });

  describe('Current State Queries', () => {
    it('should query current holons by type with access control', async () => {
      const doc = documentRegistry.registerDocument({
        referenceNumbers: ['DOC-001'],
        title: 'Test Document',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Unclassified',
      }, 'event-1');

      const person1Id = 'person-1';
      const person2Id = 'person-2';

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: [person1Id],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'John Doe', edipi: '1234567890' },
        },
        sourceSystem: 'test',
        sourceDocument: doc.id,
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: [person2Id],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Jane Smith', edipi: '0987654321' },
        },
        sourceSystem: 'test',
        sourceDocument: doc.id,
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      await graphStore.rebuildIndices();

      const adminResult = queryLayer.queryCurrentHolons(adminUser, HolonType.Person);
      expect(adminResult.data).toHaveLength(2);
      expect(adminResult.filtered).toBe(false);

      const viewerResult = queryLayer.queryCurrentHolons(viewerUser, HolonType.Person);
      expect(viewerResult.data).toHaveLength(2);
      expect(viewerResult.filtered).toBe(false);
    });

    it('should filter holons based on classification level', async () => {
      const classifiedDoc = documentRegistry.registerDocument({
        referenceNumbers: ['DOC-SECRET-001'],
        title: 'Secret Document',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Secret',
      }, 'event-1');

      const unclassifiedDoc = documentRegistry.registerDocument({
        referenceNumbers: ['DOC-002'],
        title: 'Public Document',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Unclassified',
      }, 'event-1');

      const classifiedPersonId = 'person-classified';
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: [classifiedPersonId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Secret Agent', edipi: '1111111111' },
        },
        sourceSystem: 'test',
        sourceDocument: classifiedDoc.id,
        causalLinks: {},
      });

      const unclassifiedPersonId = 'person-unclassified';
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: [unclassifiedPersonId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Public Person', edipi: '2222222222' },
        },
        sourceSystem: 'test',
        sourceDocument: unclassifiedDoc.id,
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      await graphStore.rebuildIndices();

      const adminResult = queryLayer.queryCurrentHolons(adminUser, HolonType.Person);
      expect(adminResult.data).toHaveLength(2);
      expect(adminResult.filtered).toBe(false);

      const viewerResult = queryLayer.queryCurrentHolons(viewerUser, HolonType.Person);
      expect(viewerResult.data).toHaveLength(1);
      expect(viewerResult.data[0].id).toBe(unclassifiedPersonId);
      expect(viewerResult.filtered).toBe(true);

      const analystResult = queryLayer.queryCurrentHolons(analystUser, HolonType.Person);
      expect(analystResult.data).toHaveLength(2);
      expect(analystResult.filtered).toBe(false);
    });
  });

  describe('Temporal Queries', () => {
    it('should query holons as of a specific timestamp', () => {
      const doc = documentRegistry.registerDocument({
        referenceNumbers: ['DOC-005'],
        title: 'Temporal Test',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Unclassified',
      }, 'event-1');

      const personId = 'person-temporal';
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: [personId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Temporal Person', edipi: '4444444444' },
        },
        sourceSystem: 'test',
        sourceDocument: doc.id,
        causalLinks: {},
      });

      const beforeResult = queryLayer.queryHolonsAsOf(
        adminUser,
        HolonType.Person,
        { asOfTimestamp: new Date('2023-12-01') }
      );
      expect(beforeResult.data).toHaveLength(0);

      const afterResult = queryLayer.queryHolonsAsOf(
        adminUser,
        HolonType.Person,
        { asOfTimestamp: new Date('2024-02-01') }
      );
      expect(afterResult.data).toHaveLength(1);
      expect(afterResult.data[0].id).toBe(personId);
    });
  });

  describe('Time Range Queries', () => {
    it('should query events by time range with access control', () => {
      const personId = 'person-events';
      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2024-03-01'),
        actor: personId,
        subjects: [personId],
        payload: { action: 'assignment_1' },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.AssignmentEnded,
        occurredAt: new Date('2024-06-01'),
        actor: personId,
        subjects: [personId],
        payload: { action: 'assignment_2' },
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.QualificationAwarded,
        occurredAt: new Date('2024-09-01'),
        actor: personId,
        subjects: [personId],
        payload: { action: 'qual_awarded' },
        sourceSystem: 'test',
        causalLinks: {},
      });

      // Verify events are in the store
      const allEvents = eventStore.getAllEvents();
      expect(allEvents.length).toBeGreaterThan(0);

      // Query directly from event store to verify time range works
      const directEvents = eventStore.getEvents({
        startTime: new Date('2024-02-01'),
        endTime: new Date('2024-07-01'),
      });
      expect(directEvents).toHaveLength(2);

      // Test access control directly
      const canAccess = accessControl.canAccessEvent(adminUser, directEvents[0]);
      expect(canAccess.allowed).toBe(true);

      const result = queryLayer.queryEventsByTimeRange(adminUser, {
        startTime: new Date('2024-02-01'),
        endTime: new Date('2024-07-01'),
      });

      expect(result.data).toHaveLength(2);
      expect(result.filtered).toBe(false);
    });

    it('should filter events by type in time range', () => {
      const personId = 'person-type-events';
      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2024-03-01'),
        actor: personId,
        subjects: [personId],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      eventStore.submitEvent({
        type: EventType.QualificationAwarded,
        occurredAt: new Date('2024-04-01'),
        actor: personId,
        subjects: [personId],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const result = queryLayer.queryEventsByTimeRange(adminUser, {
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        eventTypes: [EventType.AssignmentStarted],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(EventType.AssignmentStarted);
    });
  });

  describe('Access Control Integration', () => {
    it('should hide restricted information without revealing existence', async () => {
      const secretDoc = documentRegistry.registerDocument({
        referenceNumbers: ['DOC-SECRET-002'],
        title: 'Top Secret Document',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Top Secret',
      }, 'event-1');

      const secretPersonId = 'person-top-secret';
      eventStore.submitEvent({
        type: EventType.OrganizationCreated,
        occurredAt: new Date('2024-01-01'),
        actor: 'system',
        subjects: [secretPersonId],
        payload: {
          holonType: HolonType.Person,
          properties: { name: 'Top Secret Person', edipi: '0000000000' },
        },
        sourceSystem: 'test',
        sourceDocument: secretDoc.id,
        causalLinks: {},
      });

      stateProjection.replayAllEvents();
      await graphStore.rebuildIndices();

      const viewerResult = queryLayer.queryCurrentHolons(viewerUser, HolonType.Person);
      expect(viewerResult.data).toHaveLength(0);
      expect(viewerResult.filtered).toBe(true);

      const directResult = queryLayer.getHolon(viewerUser, secretPersonId);
      expect(directResult.data).toBeUndefined();
      expect(directResult.filtered).toBe(true);
    });

    it('should apply access control to event history', () => {
      const secretDoc = documentRegistry.registerDocument({
        referenceNumbers: ['DOC-SECRET-003'],
        title: 'Secret Event Document',
        documentType: 'Policy' as any,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'Secret',
      }, 'event-1');

      const personId = 'person-event-history';
      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: new Date('2024-03-01'),
        actor: personId,
        subjects: [personId],
        payload: {},
        sourceSystem: 'test',
        sourceDocument: secretDoc.id,
        causalLinks: {},
      });

      const viewerResult = queryLayer.queryEventsByHolon(viewerUser, personId);
      expect(viewerResult.data).toHaveLength(0);
      expect(viewerResult.filtered).toBe(true);

      const analystResult = queryLayer.queryEventsByHolon(analystUser, personId);
      expect(analystResult.data).toHaveLength(1);
      expect(analystResult.filtered).toBe(false);
    });
  });
});
