/**
 * Integration Tests for API Server
 * Tests end-to-end API flows with real components
 * 
 * NOTE: Full end-to-end tests require proper integration between HolonRegistry,
 * StateProjectionEngine, and GraphStore. Currently:
 * - HolonRegistry stores holons
 * - StateProjectionEngine derives state from events
 * - GraphStore queries from StateProjectionEngine
 * - QueryLayer queries from GraphStore
 * 
 * For holons to appear in API queries, they must flow through the complete chain.
 * The current architecture requires specific event types (OrganizationCreated, etc.)
 * that StateProjectionEngine can handle.
 * 
 * The core API functionality (routing, authentication, authorization, validation,
 * error handling) is fully tested in api-server.test.ts (18 passing tests).
 * 
 * These integration tests validate the API endpoints work correctly when components
 * are properly integrated. Some tests are skipped pending component integration work.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { APIServer, createAPIServer } from './api-server';
import { QueryLayer } from '../query/query-layer';
import { InMemoryEventStore } from '../event-store';
import { SemanticAccessLayer } from '../semantic-access-layer';
import { SchemaVersioningEngine } from '../schema-versioning';
import { GovernanceEngine } from '../governance';
import { MonitoringService } from '../monitoring';
import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { StateProjectionEngine } from '../state-projection';
import { GraphStore } from '../graph-store';
import { AccessControlEngine, Role } from '../access-control';
import { TemporalQueryEngine } from '../query/temporal-query-engine';
import { PersonManager } from '../person-management';
import { OrganizationManager } from '../organization-management';
import { HolonType } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';
import { EventType } from '../core/types/event';
import { DocumentType } from '../core/types/holon';

describe('API Server Integration Tests', () => {
  let apiServer: APIServer;
  let holonRegistry: HolonRegistry;
  let eventStore: InMemoryEventStore;
  let documentRegistry: DocumentRegistry;
  let constraintEngine: ConstraintEngine;
  let relationshipRegistry: RelationshipRegistry;
  let stateProjection: StateProjectionEngine;
  let graphStore: GraphStore;
  let accessControl: AccessControlEngine;
  let temporalQueryEngine: TemporalQueryEngine;
  let queryLayer: QueryLayer;
  let semanticAccessLayer: SemanticAccessLayer;
  let schemaVersioning: SchemaVersioningEngine;
  let governance: GovernanceEngine;
  let monitoring: MonitoringService;
  let personManager: PersonManager;
  let organizationManager: OrganizationManager;

  beforeEach(() => {
    // Create all dependencies with real implementations
    holonRegistry = new HolonRegistry();
    eventStore = new InMemoryEventStore();
    documentRegistry = new DocumentRegistry();
    constraintEngine = new ConstraintEngine(documentRegistry);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    stateProjection = new StateProjectionEngine(eventStore);
    graphStore = new GraphStore(stateProjection, holonRegistry, relationshipRegistry);
    accessControl = new AccessControlEngine(documentRegistry);
    temporalQueryEngine = new TemporalQueryEngine(eventStore, stateProjection, holonRegistry, relationshipRegistry);
    queryLayer = new QueryLayer(temporalQueryEngine, graphStore, accessControl, eventStore);
    semanticAccessLayer = new SemanticAccessLayer(eventStore, constraintEngine, holonRegistry, documentRegistry);
    schemaVersioning = new SchemaVersioningEngine(documentRegistry);
    governance = new GovernanceEngine(documentRegistry, schemaVersioning);
    monitoring = new MonitoringService(eventStore, graphStore, constraintEngine);
    personManager = new PersonManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);
    organizationManager = new OrganizationManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    // Create API server
    apiServer = createAPIServer(
      { port: 3000, maxRequestsPerMinute: 100 },
      queryLayer,
      eventStore,
      semanticAccessLayer,
      schemaVersioning,
      governance,
      monitoring,
      holonRegistry,
      relationshipRegistry,
      constraintEngine,
      documentRegistry
    );
  });

  describe('End-to-End: Holon Creation and Query', () => {
    it('should create a holon and query it via API', async () => {
      const apiKey = 'test-api-key-e2e';
      const user = {
        userId: 'user-e2e',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create a test person using PersonManager (proper way)
      const result = personManager.createPerson({
        edipi: '1234567890',
        name: 'John Doe',
        serviceNumbers: ['123456'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });

      expect(result.success).toBe(true);
      const personId = result.personID!;

      // Rebuild graph store indices to pick up the new holon from registry
      graphStore.rebuildIndices();

      // Query via API
      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/holons/query',
        { authorization: `Bearer ${apiKey}` },
        {
          type: HolonType.Person,
          filters: {},
        },
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].id).toBe(personId);
      expect(response.data[0].properties.name).toBe('John Doe');
    });

    it('should get a specific holon by ID via API', async () => {
      const apiKey = 'test-api-key-get-holon';
      const user = {
        userId: 'user-get',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create a test holon
      const result_personId = personManager.createPerson({
        edipi: '9876543210',
        name: 'Jane Smith',
        serviceNumbers: ['654321'],
        dob: new Date('1992-05-15'),
        serviceBranch: 'Navy',
        designatorRating: 'EOD',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_personId.success).toBe(true);
      const personId = result_personId.personID!;

      // Update graph store
      graphStore.rebuildIndices();

      // Get via API
      const response = await apiServer.handleRequest(
        'GET',
        `/api/v1/holons/${personId}`,
        { authorization: `Bearer ${apiKey}` },
        undefined,
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(personId);
      expect(response.data.properties.name).toBe('Jane Smith');
      expect(response.data.properties.edipi).toBe('9876543210');
    });
  });

  describe('End-to-End: Event Submission', () => {
    it('should submit an event via API and verify it was stored', async () => {
      const apiKey = 'test-api-key-event';
      const user = {
        userId: 'user-event',
        roles: [Role.DataSubmitter],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create a test holon
      const result_personId = personManager.createPerson({
        edipi: '1111111111',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_personId.success).toBe(true);
      const personId = result_personId.personID!;
      graphStore.rebuildIndices();

      // Submit event via API
      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/events',
        { authorization: `Bearer ${apiKey}` },
        {
          eventType: EventType.QualificationAwarded,
          subjects: [personId],
          payload: {
            qualificationId: 'qual-123',
            awardedDate: new Date().toISOString(),
          },
          sourceSystem: 'test-system',
        },
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.eventId).toBeDefined();

      // Verify event was stored
      const eventId = response.data.eventId;
      const storedEvent = eventStore.getEvent(eventId);
      expect(storedEvent).toBeDefined();
      expect(storedEvent?.type).toBe(EventType.QualificationAwarded);
      expect(storedEvent?.subjects).toContain(personId);
    });

    it('should reject event submission without proper permissions', async () => {
      const apiKey = 'test-api-key-no-perm';
      const user = {
        userId: 'user-no-perm',
        roles: [Role.Analyst], // Analyst cannot submit events
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/events',
        { authorization: `Bearer ${apiKey}` },
        {
          eventType: EventType.QualificationAwarded,
          subjects: ['person-1'],
          payload: {},
          sourceSystem: 'test-system',
        },
        undefined
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should submit batch events via API', async () => {
      const apiKey = 'test-api-key-batch';
      const user = {
        userId: 'user-batch',
        roles: [Role.DataSubmitter],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create test holons
      const result_person1Id = personManager.createPerson({
        edipi: '2222222222',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_person1Id.success).toBe(true);
      const person1Id = result_person1Id.personID!;
      graphStore.rebuildIndices();

      const result_person2Id = personManager.createPerson({
        edipi: '3333333333',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_person2Id.success).toBe(true);
      const person2Id = result_person2Id.personID!;
      graphStore.rebuildIndices();

      // Submit batch events
      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/events/batch',
        { authorization: `Bearer ${apiKey}` },
        {
          events: [
            {
              eventType: EventType.QualificationAwarded,
              subjects: [person1Id],
              payload: { qualificationId: 'qual-1' },
              sourceSystem: 'test-system',
            },
            {
              eventType: EventType.QualificationAwarded,
              subjects: [person2Id],
              payload: { qualificationId: 'qual-2' },
              sourceSystem: 'test-system',
            },
          ],
          atomic: false,
        },
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.summary.total).toBe(2);
      expect(response.data.summary.succeeded).toBe(2);
      expect(response.data.summary.failed).toBe(0);
    });
  });

  describe('End-to-End: Temporal Queries', () => {
    it('should query holons as-of a specific timestamp', async () => {
      const apiKey = 'test-api-key-temporal';
      const user = {
        userId: 'user-temporal',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create a holon at time T1
      const t1 = new Date('2024-01-01T00:00:00Z');
      const result_personId = personManager.createPerson({
        edipi: '4444444444',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_personId.success).toBe(true);
      const personId = result_personId.personID!;
      graphStore.rebuildIndices();

      // Submit an event at T1
      eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: t1,
        recordedAt: t1,
        actor: personId,
        subjects: [personId],
        payload: { assignment: 'Team 1' },
        sourceSystem: 'test',
        causalLinks: {},
      });

      // Query as-of T1
      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/temporal/holons',
        { authorization: `Bearer ${apiKey}` },
        {
          type: HolonType.Person,
          asOfTimestamp: t1.toISOString(),
          filters: {},
        },
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('End-to-End: Relationship Queries', () => {
    it('should query relationships via API', async () => {
      const apiKey = 'test-api-key-rel';
      const user = {
        userId: 'user-rel',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create holons
      const result_personId = personManager.createPerson({
        edipi: '5555555555',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_personId.success).toBe(true);
      const personId = result_personId.personID!;
      graphStore.rebuildIndices();

      const positionResult = organizationManager.createPosition({
        billetIDs: ['BILLET-001'],
        title: 'Team Leader',
        gradeRange: { min: 'E-7', max: 'E-9' },
        designatorExpectations: ['SEAL'],
        criticality: 'critical',
        billetType: 'command',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(positionResult.success).toBe(true);
      const positionId = positionResult.positionID!;

      // Create relationship
      const relResult = relationshipRegistry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: personId,
        targetHolonID: positionId,
        properties: {},
        effectiveStart: new Date(),
        sourceSystem: 'test',
        sourceDocuments: [],
        actor: personId,
      });
      expect(relResult.validation.valid).toBe(true);
      const relId = relResult.relationship!.id;

      // Update graph store
      graphStore.rebuildIndices();

      // Query relationships
      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/relationships/query',
        { authorization: `Bearer ${apiKey}` },
        {
          type: RelationshipType.OCCUPIES,
          filters: {},
        },
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should get connected holons via API', async () => {
      const apiKey = 'test-api-key-connected';
      const user = {
        userId: 'user-connected',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create holons
      const result_personId = personManager.createPerson({
        edipi: '6666666666',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_personId.success).toBe(true);
      const personId = result_personId.personID!;
      graphStore.rebuildIndices();

      const positionResult = organizationManager.createPosition({
        billetIDs: ['BILLET-002'],
        title: 'Operator',
        gradeRange: { min: 'E-5', max: 'E-7' },
        designatorExpectations: ['SEAL'],
        criticality: 'important',
        billetType: 'staff',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(positionResult.success).toBe(true);
      const positionId = positionResult.positionID!;

      // Create relationship
      const relResult = relationshipRegistry.createRelationship({
        type: RelationshipType.OCCUPIES,
        sourceHolonID: personId,
        targetHolonID: positionId,
        properties: {},
        effectiveStart: new Date(),
        sourceSystem: 'test',
        sourceDocuments: [],
        actor: personId,
      });
      expect(relResult.validation.valid).toBe(true);

      // Update graph store
      graphStore.rebuildIndices();

      // Get connected holons
      const response = await apiServer.handleRequest(
        'GET',
        `/api/v1/holons/${personId}/connected`,
        { authorization: `Bearer ${apiKey}` },
        undefined,
        { type: RelationshipType.OCCUPIES, direction: 'outgoing' }
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('End-to-End: Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/holons/query',  // Use a route that exists
        {},
        { type: HolonType.Person },
        undefined
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject requests with invalid API key', async () => {
      // Create a holon first so the route exists
      const result_personId = personManager.createPerson({
        edipi: '8888888888',
        name: 'Test Person',
        serviceNumbers: ['000000'],
        dob: new Date('1990-01-01'),
        serviceBranch: 'Navy',
        designatorRating: 'SEAL',
        category: 'active_duty',
        actor: 'system',
        sourceSystem: 'test',
        sourceDocuments: [],
      });
      expect(result_personId.success).toBe(true);
      const personId = result_personId.personID!;
      graphStore.rebuildIndices();

      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/holons/query',  // Use a route that definitely exists
        { authorization: 'Bearer invalid-key' },
        { type: HolonType.Person },
        undefined
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 404 for unknown routes', async () => {
      const apiKey = 'test-api-key-404';
      const user = {
        userId: 'user-404',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      const response = await apiServer.handleRequest(
        'GET',
        '/api/v1/unknown/route',
        { authorization: `Bearer ${apiKey}` },
        undefined,
        undefined
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('End-to-End: Health Check', () => {
    it('should return health status without authentication', async () => {
      const response = await apiServer.handleRequest(
        'GET',
        '/api/v1/health',
        {},
        undefined,
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.data.status);
      expect(response.data.version).toBeDefined();
      expect(response.data.components).toBeDefined();
    });
  });

  describe('End-to-End: Pagination', () => {
    it('should support pagination in query results', async () => {
      const apiKey = 'test-api-key-pagination';
      const user = {
        userId: 'user-pagination',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      // Create multiple test persons using PersonManager
      for (let i = 0; i < 10; i++) {
        const result = personManager.createPerson({
          edipi: `777777777${i}`,
          name: `Test Person ${i}`,
          serviceNumbers: [`77777${i}`],
          dob: new Date('1990-01-01'),
          serviceBranch: 'Navy',
          designatorRating: 'SEAL',
          category: 'active_duty',
          actor: 'system',
          sourceSystem: 'test',
          sourceDocuments: [],
        });
        expect(result.success).toBe(true);
      }

      // Update graph store to pick up holons from registry
      graphStore.rebuildIndices();

      const response = await apiServer.handleRequest(
        'POST',
        '/api/v1/holons/query',
        { authorization: `Bearer ${apiKey}` },
        {
          type: HolonType.Person,
          pagination: {
            page: 1,
            pageSize: 5,
          },
        },
        undefined
      );

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(5);
      expect(response.metadata?.pageSize).toBe(5);
      expect(response.metadata?.page).toBe(1);
      expect(response.metadata?.totalCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('End-to-End: Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const apiKey = 'test-api-key-rate-limit';
      const user = {
        userId: 'user-rate-limit',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      apiServer.registerAPIKey(apiKey, user);

      const headers = {
        authorization: `Bearer ${apiKey}`,
        'x-client-id': 'test-client-rate',
      };

      // Make requests up to the limit (100)
      for (let i = 0; i < 100; i++) {
        const response = await apiServer.handleRequest(
          'GET',
          '/api/v1/health',
          headers,
          undefined,
          undefined
        );
        expect(response.success).toBe(true);
      }

      // 101st request should be rate limited
      const response = await apiServer.handleRequest(
        'GET',
        '/api/v1/health',
        headers,
        undefined,
        undefined
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('End-to-End: Route Registration', () => {
    it('should register all expected routes', () => {
      const routes = apiServer.getRoutes();
      
      expect(routes.length).toBeGreaterThan(0);
      
      // Check for key routes
      const routePaths = routes.map(r => r.path);
      expect(routePaths).toContain('/api/v1/holons/query');
      expect(routePaths).toContain('/api/v1/holons/:id');
      expect(routePaths).toContain('/api/v1/events');
      expect(routePaths).toContain('/api/v1/events/batch');
      expect(routePaths).toContain('/api/v1/health');
      expect(routePaths).toContain('/api/v1/temporal/holons');
      expect(routePaths).toContain('/api/v1/schema/proposals');
      expect(routePaths).toContain('/api/v1/external/data');
    });
  });
});
