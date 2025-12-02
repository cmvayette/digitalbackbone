# Semantic Operating Model (SOM)

Tier-0 Semantic Operating Model for NSW - An authoritative conceptual representation that provides a shared, computable model of organizational structure, behavior, intent, and constraints.

## Overview

The Semantic Operating Model (SOM) is a graph-based semantic layer that provides a unified, computable representation of organizational structure, behavior, intent, and constraints. It serves as an interpretation layer above existing systems of record, mapping disparate data sources into a coherent semantic graph that enables causal reasoning, temporal queries, and constraint-based governance.

### Core Primitives

The SOM is built on three fundamental primitives:

- **Holons**: Persistent entities with stable identities (Person, Position, Organization, Mission, Capability, Asset, Qualification, Objective, LOE, Initiative, Task, Document, etc.)
- **Relationships**: First-class connections between holons with their own properties and lifecycles
- **Events**: Immutable change records that capture all state transitions over time

### Key Features

- **Event Sourcing**: All state is derived from an immutable event log, enabling complete auditability and temporal reconstruction
- **Temporal Queries**: Query the state of any holon or relationship at any point in time (as-of queries)
- **Constraint Validation**: Document-grounded constraints ensure structural integrity and policy compliance
- **Semantic Interoperability**: Semantic Access Layer maps external system data to SOM semantics
- **Causal Reasoning**: Trace causal chains through event links to understand what led to current states
- **Access Control**: Role-based and classification-based access control protects sensitive information
- **Schema Versioning**: Evolve the model over time without breaking existing integrations

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                         │
│  (NSIPS, DRRS, Training Systems, Logistics, etc.)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Semantic Access Layer (SAL)                    │
│  • ID Mapping Service                                       │
│  • Event Transformer                                        │
│  • Validation Gateway                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Tier-0 SOM Core                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Event Store  │  │ Constraint   │  │  Document    │       │
│  │ (Immutable)  │  │   Engine     │  │  Registry    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │    State     │  │   Semantic   │                         │
│  │  Projection  │  │ Graph Store  │                         │
│  └──────────────┘  └──────────────┘                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Query Layer                              │
│  • Current State Queries                                    │
│  • Temporal Queries (as-of)                                 │
│  • Pattern Matching                                         │
│  • Causal Chain Tracing                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Tier-1 Systems                             │
│  (Identity, Objectives, Initiatives, Measures, Reasoning)   │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Event Store**: Append-only immutable log of all state changes
2. **State Projection Engine**: Derives current holon and relationship states from events
3. **Semantic Graph Store**: Materialized view of current holons and relationships
4. **Constraint Engine**: Validates events and state changes against document-grounded rules
5. **Document Registry**: Manages authoritative documents and their effective dates
6. **Semantic Access Layer**: Maps external system data to SOM semantics
7. **Query Layer**: Provides current state, temporal, and pattern matching queries
8. **API Layer**: REST API for Tier-1 system integration

## Project Structure

```
src/
├── core/
│   ├── holon-registry.ts       # Holon creation and management
│   └── types/                  # Core type definitions
│       ├── holon.ts           # Holon types (Person, Position, etc.)
│       ├── relationship.ts    # Relationship types
│       ├── event.ts           # Event types
│       └── index.ts           # Type exports
├── event-store/               # Immutable event log
├── state-projection/          # Event replay and state derivation
├── graph-store/               # Materialized semantic graph
├── constraint-engine/         # Constraint validation
├── document-registry/         # Document management
├── relationship-registry/     # Relationship management
├── semantic-access-layer/     # External system integration
├── query/
│   ├── query-layer.ts        # Unified query interface
│   └── temporal-query-engine.ts  # Temporal queries
├── validation/                # Validation logic
├── access-control/            # Access control engine
├── schema-versioning/         # Schema evolution
├── governance/                # Schema change governance
├── monitoring/                # Metrics and observability
├── person-management/         # Person holon operations
├── organization-management/   # Organization/Position operations
├── mission-management/        # Mission holon operations
├── qualification-management/  # Qualification operations
├── objective-loe-management/  # Objective/LOE operations
├── initiative-task-management/ # Initiative/Task operations
├── measure-lens-engine/       # Measures and lenses
├── api/                       # REST API layer
│   ├── api-server.ts         # API server
│   ├── routes.ts             # Route handlers
│   ├── middleware.ts         # Authentication, authorization, etc.
│   └── openapi.yaml          # API specification
└── index.ts                   # Main entry point
```

## Installation

```bash
npm install
```

## Development

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode (for development)
npm run test:watch
```

## Testing

The project has comprehensive test coverage (79.58%) with 327 passing tests across 26 test files.

### Testing Strategy

The project uses a dual testing approach:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across all inputs using fast-check

Property-based tests run a minimum of 100 iterations per property and are tagged with:
```
**Feature: semantic-operating-model, Property N: [property text]**
**Validates: Requirements X.Y**
```

### Test Categories

- **Core functionality**: Holon creation, relationship management, event handling
- **Constraint validation**: Structural, policy, eligibility, temporal constraints
- **Temporal queries**: As-of queries, event replay, historical reconstruction
- **Access control**: Role-based and classification-based access
- **Integration tests**: End-to-end flows across multiple components
- **API tests**: REST API endpoints, authentication, authorization

### Running Specific Tests

```bash
# Run tests for a specific component
npm test -- src/constraint-engine

# Run tests matching a pattern
npm test -- --grep "Property 1"

# Run with verbose output
npm test -- --reporter=verbose
```

## API Usage

The SOM provides a REST API for Tier-1 system integration. See `src/api/openapi.yaml` for the complete API specification.

### Authentication

All API requests require authentication via API key:

```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/v1/holons/Person
```

### Example Queries

**Query holons by type:**
```bash
POST /api/v1/holons/Person
{
  "filters": { "serviceBranch": "Navy" },
  "includeRelationships": true,
  "pagination": { "page": 1, "pageSize": 50 }
}
```

**Submit an event:**
```bash
POST /api/v1/events
{
  "eventType": "AssignmentStarted",
  "subjects": ["person-id", "position-id"],
  "payload": { "effectiveDate": "2024-01-01" },
  "sourceSystem": "NSIPS"
}
```

**Temporal query (as-of):**
```bash
POST /api/v1/temporal/holons
{
  "type": "Organization",
  "asOfTimestamp": "2023-12-31T23:59:59Z",
  "includeRelationships": true
}
```

**Get organizational structure:**
```bash
POST /api/v1/temporal/organizations/{org-id}/structure
{
  "organizationID": "org-123",
  "asOfTimestamp": "2024-01-01T00:00:00Z"
}
```

## Key Concepts

### Holons

Holons are persistent entities with stable identities. Each holon has:
- Unique SOM ID (never reused)
- Type (Person, Position, Organization, etc.)
- Properties (type-specific attributes)
- Lifecycle state (active/inactive)
- Source documents (authoritative references)
- Creation timestamp and event

Holons are never deleted; they are marked inactive to preserve history.

### Relationships

Relationships are first-class entities connecting holons. Each relationship has:
- Unique relationship ID
- Type (OCCUPIES, CONTAINS, BELONGS_TO, etc.)
- Source and target holons (directionality)
- Properties (relationship-specific attributes)
- Effective dates (start/end)
- Multiplicity constraints
- Source documents

### Events

Events are immutable records of state changes. Each event contains:
- Event ID and type
- Timestamp (occurred at, recorded at)
- Actor (who/what caused the event)
- Subjects (affected holons/relationships)
- Payload (event-specific data)
- Source system and document
- Validity window (optional)
- Causal links (what led to this event)

### Constraints

Constraints are rules that govern validity. Types include:
- **Structural**: Required fields, data types
- **Policy**: Business rules, regulations
- **Eligibility**: Qualification requirements
- **Temporal**: Time-based rules
- **Capacity**: Resource limits
- **Dependency**: Prerequisite relationships
- **Risk**: Safety and security rules

All constraints are linked to authoritative documents.

### Temporal Queries

The SOM supports querying historical state:

```typescript
// Get a holon's state at a specific time
const holonState = queryLayer.getHolonAsOf(user, holonId, timestamp);

// Get relationships at a specific time
const relationships = queryLayer.queryRelationshipsAsOf(user, type, {
  asOfTimestamp: timestamp
});

// Reconstruct organizational structure
const orgStructure = queryLayer.getOrganizationStructureAsOf(
  user, 
  orgId, 
  timestamp
);
```

## Configuration

### Environment Variables

```bash
# API Server
PORT=3000
MAX_REQUESTS_PER_MINUTE=100

# Database (if using persistent storage)
DATABASE_URL=postgresql://localhost:5432/som

# Logging
LOG_LEVEL=info
```

### Access Control

Configure roles and permissions in the Access Control Engine:

```typescript
const roles = {
  data_viewer: ['query:holons', 'query:relationships'],
  data_submitter: ['submit:events', 'query:holons'],
  schema_admin: ['propose:schema', 'approve:schema'],
  system_admin: ['*']
};
```

## Monitoring

The SOM includes built-in monitoring and observability:

- **Event Metrics**: Ingestion rate, validation failures, processing latency
- **Query Metrics**: Latency, cache hit rates, error rates
- **System Health**: Component status, resource usage
- **Business Metrics**: Holon counts, relationship counts, constraint violations

Access metrics via:
```bash
GET /api/v1/metrics
GET /api/v1/health
```

## Deployment

### Docker

```bash
# Build image
docker build -t som:latest .

# Run container
docker run -p 3000:3000 som:latest
```

### Production Considerations

- Use persistent event store (PostgreSQL, EventStore, etc.)
- Enable caching for temporal queries
- Configure rate limiting per client
- Set up monitoring and alerting
- Implement backup and disaster recovery
- Use HTTPS with proper certificates
- Configure access control policies

## Documentation

- **API Specification**: `src/api/openapi.yaml`
- **API Documentation**: `src/api/README.md`
- **Monitoring**: `src/monitoring/README.md`

## Contributing

1. Review the requirements and design documents
2. Write tests first (TDD approach)
3. Implement functionality
4. Ensure all tests pass: `npm test`
5. Check coverage: `npm test -- --coverage`
6. Update documentation as needed

## License

MIT
