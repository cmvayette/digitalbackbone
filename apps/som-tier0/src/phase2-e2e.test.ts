
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventStore } from './event-store';
import { ConstraintEngine } from './constraint-engine';
import { InMemoryHolonRepository as HolonRegistry } from './core/holon-registry';
import { DocumentRegistry } from './document-registry';
import { SemanticAccessLayer } from './semantic-access-layer';
import { RelationshipRegistry } from './relationship-registry';
import { StateProjectionEngine } from './state-projection';
import { TemporalQueryEngine } from './query/temporal-query-engine';
import { QueryLayer } from './query/query-layer';
import { GraphStore } from './graph-store';
import { AccessControlEngine, Role, ClassificationLevel } from './access-control';
import { SchemaVersioningEngine } from './schema-versioning';
import { GovernanceEngine } from './governance';
import { MonitoringService } from './monitoring';
import { APIRoutes } from './api/routes';
import { APIRequest } from './api/api-types';
import { EventType, HolonType } from '@som/shared-types';

describe('Phase 2: Backend Event Processing E2E', () => {
    let eventStore: InMemoryEventStore;
    let documentRegistry: DocumentRegistry;
    let constraintEngine: ConstraintEngine;
    let holonRegistry: HolonRegistry;
    let relationshipRegistry: RelationshipRegistry;
    let stateProjection: StateProjectionEngine;
    let temporalQuery: TemporalQueryEngine;
    let graphStore: GraphStore;
    let queryLayer: QueryLayer;
    let accessControl: AccessControlEngine;
    let semanticAccessLayer: SemanticAccessLayer;
    let schemaVersioning: SchemaVersioningEngine;
    let governance: GovernanceEngine;
    let monitoring: MonitoringService;
    let apiRoutes: APIRoutes;

    beforeEach(() => {
        // Initialize all components
        eventStore = new InMemoryEventStore();
        documentRegistry = new DocumentRegistry();
        constraintEngine = new ConstraintEngine(documentRegistry);
        holonRegistry = new HolonRegistry();
        relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
        stateProjection = new StateProjectionEngine(eventStore);
        temporalQuery = new TemporalQueryEngine(eventStore, stateProjection, holonRegistry, relationshipRegistry);
        graphStore = new GraphStore(stateProjection);
        accessControl = new AccessControlEngine(documentRegistry);
        queryLayer = new QueryLayer(temporalQuery, graphStore, accessControl, eventStore);
        semanticAccessLayer = new SemanticAccessLayer(
            eventStore,
            constraintEngine,
            holonRegistry,
            documentRegistry
        );
        schemaVersioning = new SchemaVersioningEngine();
        governance = new GovernanceEngine(documentRegistry, schemaVersioning);
        monitoring = new MonitoringService();

        // Initialize API Routes with all dependencies, INCLUDING the StateProjectionEngine
        apiRoutes = new APIRoutes(
            queryLayer,
            eventStore,
            semanticAccessLayer,
            schemaVersioning,
            governance,
            monitoring,
            holonRegistry,
            relationshipRegistry,
            constraintEngine,
            documentRegistry,
            stateProjection // <--- THE CRITICAL WIRING FOR PHASE 2
        );
    });

    const mockUser = {
        userId: 'test-user',
        roles: [Role.Administrator],
        clearanceLevel: ClassificationLevel.TopSecret,
    };

    it('should immediately project InitiativeCreated events into state (Read-Your-Writes)', async () => {
        const initiativeId = `init-${Date.now()}`;

        // 1. Submit Event
        const submitRequest: APIRequest<any> = {
            user: mockUser,
            body: {
                eventType: EventType.InitiativeCreated,
                subjects: [initiativeId],
                payload: {
                    name: 'Strategic AI Adoption',
                    description: 'Phase 2 rollout of AI tools',
                    owner: 'CIO',
                    holonType: HolonType.Initiative,
                    properties: { status: 'planned' }
                },
                sourceSystem: 'som-tier1',
            },
            params: {},
            query: {}
        };

        const submitResponse = await apiRoutes.submitEvent(submitRequest);
        expect(submitResponse.success).toBe(true);

        // 2. Query Immediately
        const queryRequest: APIRequest<any> = {
            user: mockUser,
            params: { id: initiativeId },
            body: {},
            query: {}
        };

        // This query hits queryLayer -> temporalQuery -> stateProjection -> currentState
        // If applyNewEvent wasn't called, this would fail (return not found)
        const queryResponse = await apiRoutes.getHolon(queryRequest);

        // 3. Verify
        expect(queryResponse.success).toBe(true);
        expect(queryResponse.data).toBeDefined();
        expect(queryResponse.data.id).toBe(initiativeId);
        expect(queryResponse.data.type).toBe(HolonType.Initiative);
        expect(queryResponse.data.properties.name).toBe('Strategic AI Adoption');
    });

    it('should immediately project ProcessDefined events', async () => {
        const processId = `proc-${Date.now()}`;

        const submitRequest: APIRequest<any> = {
            user: mockUser,
            body: {
                eventType: EventType.ProcessDefined,
                subjects: [processId],
                payload: {
                    name: 'Onboarding Process',
                    description: 'Standard employee onboarding',
                    holonType: HolonType.Process,
                    properties: { version: '1.0' }
                },
                sourceSystem: 'how-do-app',
            },
            params: {},
            query: {}
        };

        const submitResponse = await apiRoutes.submitEvent(submitRequest);
        expect(submitResponse.success).toBe(true);

        const queryResponse = await apiRoutes.getHolon({
            user: mockUser,
            params: { id: processId },
            body: {},
            query: {}
        });

        expect(queryResponse.success).toBe(true);
        expect(queryResponse.data.type).toBe(HolonType.Process);
        expect(queryResponse.data.properties.name).toBe('Onboarding Process');
    });
});
