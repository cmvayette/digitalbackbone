import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import path from 'path';
import dotenv from 'dotenv';

// Import Core Components
import { SQLiteEventStore } from './event-store/sqlite-store';
import { IEventStore } from './core/interfaces/event-store';
import { StateProjectionEngine } from './state-projection';
import { GraphStore } from './graph-store';
import { QueryLayer } from './query/query-layer';
import { TemporalQueryEngine } from './query/temporal-query-engine';
import { AccessControlEngine } from './access-control';
import { SemanticAccessLayer } from './semantic-access-layer';
import { SchemaVersioningEngine } from './schema-versioning';
import { GovernanceEngine } from './governance';
import { MonitoringService } from './monitoring';
import { InMemoryHolonRepository } from './core/holon-registry';
import { RelationshipRegistry } from './relationship-registry';
import { ConstraintEngine } from './constraint-engine';
import { DocumentRegistry } from './document-registry';
import { APIServer } from './api/api-server';
import { CalendarIndex, AvailabilityService, GovernanceCalendarAdapter, HowDoCalendarAdapter } from './calendar';

dotenv.config();

const app = new Hono();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;

// Middleware
app.use('*', logger());
app.use('*', cors());


async function startServer() {
    // Initialization
    console.log('Initializing SOM Tier-0 Core...');

    // 1. Persistence
    // 1. Persistence
    let eventStore: IEventStore;

    // Import config dynamically or assume it's available. 
    // Since imports are static at top, I should add import at top if possible or just use process.env for simplicity if I can't easily add import at top without messing up lines.
    // But I can see line 6 imports dotenv. I can add config import there.
    // Instead of messing with top imports, I will use valid require or process.env logic matching config.ts structure, or just import config if I can see where to add it.
    // Easier to just use process.env to match existing pattern if I don't want to touch top of file.
    // BUT config.ts exists so I should use it.
    // I will modify the top of file separately or assume I can get by.

    // Actually, looking at the file view, I can replace lines 9-10 with needed imports and then the init block.

    // Let's replace the init block first.
    const dbType = process.env.DB_TYPE || 'sqlite';

    if (dbType === 'postgres') {
        const { PostgresEventStore } = await import('./event-store/postgres-event-store');
        const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/som?schema=public';
        console.log(`Initializing Postgres Event Store...`);
        eventStore = new PostgresEventStore(dbUrl);
    } else {
        const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../som.db');
        eventStore = new SQLiteEventStore(dbPath);
        console.log(`Event Store initialized at ${dbPath}`);
    }

    // 2. Core Engines (Base)
    const documentRegistry = new DocumentRegistry();
    const projectionEngine = new StateProjectionEngine(eventStore);
    const graphStore = new GraphStore(projectionEngine);
    const constraintEngine = new ConstraintEngine(documentRegistry);

    // Load Default Constraints
    const { loadDefaultConstraints } = await import('./constraint-engine/default-constraints');
    loadDefaultConstraints(constraintEngine);

    const schemaVersioning = new SchemaVersioningEngine(); // No args
    const monitoring = new MonitoringService();

    // 3. Registries
    // Use InMemoryHolonRepository as the concrete implementation
    const holonRegistry = new InMemoryHolonRepository();
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);

    // 4. Logic Engines (Composite)
    const temporalQueryEngine = new TemporalQueryEngine(eventStore, projectionEngine, holonRegistry, relationshipRegistry);
    const accessControl = new AccessControlEngine(documentRegistry);

    // 5. Access Layers (Aggregation)
    const queryLayer = new QueryLayer(temporalQueryEngine, graphStore, accessControl, eventStore);
    const semanticAccessLayer = new SemanticAccessLayer(eventStore, constraintEngine, holonRegistry, documentRegistry);

    const governance = new GovernanceEngine(documentRegistry, schemaVersioning);

    // Calendar
    // Calendar
    const calendarIndex = new CalendarIndex(eventStore);
    const availabilityService = new AvailabilityService(calendarIndex, graphStore);
    const governanceAdapter = new GovernanceCalendarAdapter(eventStore);
    const howDoAdapter = new HowDoCalendarAdapter(eventStore);

    // 3. API Server (The "Brain")
    const apiServer = new APIServer(
        { port: PORT },
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
        projectionEngine,

        calendarIndex,
        availabilityService
    );

    // Register Dev Key
    // Use correct Role enum values
    const AccessControl = await import('./access-control');
    const Role = AccessControl.Role;
    apiServer.registerAPIKey('dev-token-123', { userId: 'dev-user', roles: [Role.Administrator] });
    console.log('Registered dev API key: dev-token-123 (Administrator)');


    // 4. Boostrapping
    // Replay events to build in-memory state and graph indices
    console.log('Replaying events to build state...');
    await graphStore.initialize();
    console.log(`Graph Store initialized.`);

    // Initialize Calendar
    await calendarIndex.rebuild();
    console.log('Calendar Index initialized.');

    // Wire up subscriptions (The "SOM" Logic)
    // When Projection Engine processes an event (State Update), notify indices
    projectionEngine.subscribe(async (event) => {
        // Update Calendar
        await calendarIndex.processEvent(event);

        // Trigger Governance Calendar Adapter (creates derived events)
        await governanceAdapter.handleEvent(event);

        // Trigger How-Do Calendar Adapter
        await howDoAdapter.handleEvent(event);

        // Update Graph Store
        await graphStore.updateFromNewEvent();
    });
    console.log('Orchestration wired internally.');

    const allEvents = await eventStore.getAllEvents();
    console.log(`Current Event Count: ${allEvents.length}`);


    // 5. Hono -> APIServer Bridge
    // We catch all routes and pass them to the internal APIServer router
    app.all('/api/*', async (c) => {
        const method = c.req.method;
        const url = new URL(c.req.url);
        const path = url.pathname; // e.g. /api/v1/holons/...
        const headers = c.req.header();

        // Parse body safely
        let body = undefined;
        if (method !== 'GET' && method !== 'HEAD') {
            try {
                body = await c.req.json();
            } catch (e) {
                // Ignore JSON parse errors for empty bodies, or log?
            }
        }

        const query = Object.fromEntries(url.searchParams);

        const response = await apiServer.handleRequest(method, path, headers as any, body, query);

        return c.json(response, response.success ? 200 : 400); // Simple status mapping
    });

    // Health Check (Direct Hono route)
    app.get('/health', (c) => c.json({ status: 'ok', events: allEvents.length }));

    console.log(`SOM Tier-0 running on http://localhost:${PORT}`);

    serve({
        fetch: app.fetch,
        port: PORT
    });
}

startServer().catch(console.error);

