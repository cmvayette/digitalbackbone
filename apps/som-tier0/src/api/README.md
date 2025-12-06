# Semantic Operating Model API

REST API for Tier-1 system integration with the Tier-0 Semantic Operating Model (SOM).

## Overview

The SOM API provides a comprehensive REST interface for:
- Querying holons (persistent entities) and relationships
- Submitting events (immutable change records)
- Temporal queries and historical state reconstruction
- Graph pattern matching
- Schema management and versioning
- External system integration
- System health monitoring

## Authentication

All endpoints (except `/api/v1/health`) require authentication using an API key passed in the Authorization header:

```
Authorization: Bearer <your-api-key>
```

### Registering API Keys

```typescript
import { createAPIServer } from './api';

const apiServer = createAPIServer(config, ...dependencies);

// Register an API key for a user
apiServer.registerAPIKey('your-api-key', {
  userId: 'user-123',
  roles: [Role.DataSubmitter, Role.Analyst],
  clearanceLevel: 'SECRET',
  organizationID: 'org-456',
});
```

## Rate Limiting

API requests are rate-limited to 100 requests per minute per client by default. This can be configured when creating the API server:

```typescript
const apiServer = createAPIServer({
  maxRequestsPerMinute: 200,
  // ... other config
}, ...dependencies);
```

## Access Control

Results are automatically filtered based on user roles and clearances. The `filtered` field in response metadata indicates if some results were hidden due to access control.

## API Endpoints

### Holon Queries

#### Query Holons by Type
```
POST /api/v1/holons/query
```

Query holons of a specific type with optional filters and pagination.

**Request Body:**
```json
{
  "type": "Person",
  "filters": {
    "properties.serviceBranch": "Navy"
  },
  "includeRelationships": true,
  "pagination": {
    "page": 1,
    "pageSize": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "person-123",
      "type": "Person",
      "properties": {
        "edipi": "1234567890",
        "name": "John Doe",
        "serviceBranch": "Navy"
      }
    }
  ],
  "metadata": {
    "filtered": false,
    "totalCount": 1,
    "pageSize": 50,
    "page": 1,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Holon by ID
```
GET /api/v1/holons/:id
```

Retrieve a specific holon by its ID.

#### Get Holon Relationships
```
GET /api/v1/holons/:id/relationships?type=OCCUPIES&direction=outgoing
```

Get all relationships for a specific holon.

#### Get Connected Holons
```
GET /api/v1/holons/:id/connected?type=BELONGS_TO&direction=both
```

Get holons connected to a specific holon through relationships.

### Relationship Queries

#### Query Relationships by Type
```
POST /api/v1/relationships/query
```

Query relationships of a specific type with optional filters.

**Request Body:**
```json
{
  "type": "OCCUPIES",
  "sourceHolonID": "person-123",
  "filters": {
    "effectiveStart": "2024-01-01T00:00:00Z"
  }
}
```

### Event Submission

#### Submit Single Event
```
POST /api/v1/events
```

Submit a single event to the event store.

**Request Body:**
```json
{
  "eventType": "AssignmentStarted",
  "subjects": ["person-123", "position-456"],
  "payload": {
    "startDate": "2024-01-01T00:00:00Z",
    "assignmentType": "permanent"
  },
  "sourceSystem": "NSIPS",
  "sourceDocument": "doc-789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt-123456",
    "event": {
      "id": "evt-123456",
      "type": "AssignmentStarted",
      "occurredAt": "2024-01-01T00:00:00Z",
      "subjects": ["person-123", "position-456"]
    }
  }
}
```

#### Submit Batch Events
```
POST /api/v1/events/batch
```

Submit multiple events in a single batch operation.

**Request Body:**
```json
{
  "events": [
    {
      "eventType": "AssignmentStarted",
      "subjects": ["person-123"],
      "payload": {},
      "sourceSystem": "NSIPS"
    },
    {
      "eventType": "QualificationAwarded",
      "subjects": ["person-123"],
      "payload": {},
      "sourceSystem": "Training"
    }
  ],
  "atomic": true
}
```

### Event Queries

#### Query Events
```
POST /api/v1/events/query
```

Query events with filters.

**Request Body:**
```json
{
  "holonID": "person-123",
  "timeRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "pagination": {
    "page": 1,
    "pageSize": 50
  }
}
```

#### Get Event by ID
```
GET /api/v1/events/:id
```

#### Get Holon Event History
```
GET /api/v1/holons/:id/history?startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z
```

### Temporal Queries

#### Query Holons As-Of Timestamp
```
POST /api/v1/temporal/holons
```

Query holons as they existed at a specific point in time.

**Request Body:**
```json
{
  "type": "Person",
  "asOfTimestamp": "2023-06-01T00:00:00Z",
  "filters": {
    "properties.serviceBranch": "Navy"
  }
}
```

#### Query Relationships As-Of Timestamp
```
POST /api/v1/temporal/relationships
```

Query relationships as they existed at a specific point in time.

#### Get Holon State As-Of Timestamp
```
GET /api/v1/temporal/holons/:id?asOfTimestamp=2023-06-01T00:00:00Z
```

#### Get Organizational Structure As-Of Timestamp
```
POST /api/v1/temporal/organizations/structure
```

Reconstruct organizational structure at a specific point in time.

**Request Body:**
```json
{
  "organizationID": "org-123",
  "asOfTimestamp": "2023-06-01T00:00:00Z",
  "includeSubOrganizations": true,
  "maxDepth": 5
}
```

#### Trace Causal Chain
```
POST /api/v1/events/causal-chain
```

Trace the causal chain of events leading to a specific event.

**Request Body:**
```json
{
  "eventID": "evt-123456",
  "maxDepth": 10
}
```

### Pattern Matching

#### Match Graph Patterns
```
POST /api/v1/patterns/match
```

Find matches for a graph pattern across the semantic graph.

**Request Body:**
```json
{
  "pattern": {
    "holonTypes": ["Person", "Position"],
    "relationshipTypes": ["OCCUPIES"],
    "constraints": {
      "Person.properties.serviceBranch": "Navy"
    }
  },
  "maxResults": 100
}
```

### Schema Management

#### Submit Schema Proposal
```
POST /api/v1/schema/proposals
```

Submit a proposal for a schema change.

**Request Body:**
```json
{
  "proposalType": "holon_type",
  "name": "Equipment",
  "description": "Represents equipment items",
  "definition": {
    "properties": ["serialNumber", "type", "status"]
  },
  "referenceDocuments": ["doc-123"],
  "exampleUseCases": ["Track equipment inventory"]
}
```

#### Get Schema Versions
```
POST /api/v1/schema/versions
```

Get available schema versions.

#### Get Current Schema
```
GET /api/v1/schema/current
```

Get the current active schema version.

### External System Integration

#### Submit External System Data
```
POST /api/v1/external/data
```

Submit data from an external system for transformation into SOM events.

**Request Body:**
```json
{
  "externalSystem": "NSIPS",
  "externalID": "nsips-person-123",
  "dataType": "person",
  "payload": {
    "name": "John Doe",
    "edipi": "1234567890"
  },
  "sourceDocument": "doc-456"
}
```

#### Query ID Mapping
```
POST /api/v1/external/mappings
```

Query the mapping between external system IDs and SOM holon IDs.

**Request Body:**
```json
{
  "externalSystem": "NSIPS",
  "externalID": "nsips-person-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "externalSystem": "NSIPS",
    "externalID": "nsips-person-123",
    "holonID": "person-456"
  }
}
```

### System Health

#### Health Check
```
GET /api/v1/health
```

Get system health status (public endpoint, no authentication required).

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "components": {
      "eventStore": {
        "status": "healthy",
        "latency": 5
      },
      "graphStore": {
        "status": "healthy"
      },
      "constraintEngine": {
        "status": "healthy"
      },
      "documentRegistry": {
        "status": "healthy"
      }
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Get System Metrics
```
GET /api/v1/metrics
```

Get detailed system metrics (requires elevated permissions).

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Event validation failed",
    "details": {},
    "validationErrors": [
      {
        "field": "eventType",
        "message": "Event type is required",
        "constraint": "required"
      }
    ]
  }
}
```

### Error Codes

- `AUTHENTICATION_ERROR`: Invalid or missing authentication credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `CONSTRAINT_VIOLATION`: Constraint validation failed
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `INTERNAL_ERROR`: Internal server error

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at `src/api/openapi.yaml`.

You can use this specification with tools like:
- Swagger UI for interactive API documentation
- Postman for API testing
- Code generators for client libraries

## Usage Example

```typescript
import { createAPIServer } from './api';
import { Role } from '../access-control';

// Create API server with all dependencies
const apiServer = createAPIServer(
  {
    port: 3000,
    host: '0.0.0.0',
    maxRequestsPerMinute: 100,
    enableCORS: true,
  },
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

// Register API keys
apiServer.registerAPIKey('api-key-123', {
  userId: 'user-1',
  roles: [Role.DataSubmitter, Role.Analyst],
  clearanceLevel: 'SECRET',
  organizationID: 'org-1',
});

// Handle requests
const response = await apiServer.handleRequest(
  'POST',
  '/api/v1/holons/query',
  { authorization: 'Bearer api-key-123' },
  {
    type: 'Person',
    filters: {},
  }
);

console.log(response);
```

## Security Considerations

1. **API Keys**: Store API keys securely and rotate them regularly
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Adjust rate limits based on your needs
4. **Access Control**: Results are automatically filtered based on user permissions
5. **Audit Logging**: All API requests should be logged for security audit
6. **Input Validation**: All inputs are validated before processing

## Performance Considerations

1. **Pagination**: Always use pagination for large result sets
2. **Caching**: Consider caching frequently accessed data
3. **Async Processing**: Long-running operations should be processed asynchronously
4. **Connection Pooling**: Use connection pooling for database connections
5. **Load Balancing**: Use load balancing for high-traffic deployments

## Integration Patterns

### Tier-1 System Integration

Tier-1 systems should:
1. Use the Semantic Access Layer for data submission
2. Map external IDs to SOM holon IDs
3. Submit events through the API
4. Query the semantic graph for insights
5. Use temporal queries for historical analysis

### Event-Driven Architecture

The API supports event-driven patterns:
1. Submit events as they occur
2. Use causal links to track event relationships
3. Query event history for audit trails
4. Use temporal queries for state reconstruction

## Support

For API support and questions, please contact the SOM team.
