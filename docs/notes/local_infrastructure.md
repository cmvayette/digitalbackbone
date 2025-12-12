# Local Infrastructure Setup (Docker)

This guide explains how to run the full `som-tier0` stack locally using Docker Compose, including the persistence and caching layers.

## Prerequisites
*   Docker & Docker Compose installed.

## The Stack
The `docker-compose.yml` orchestrates the following services:
1.  **som-tier0**: The core API service (Node.js).
2.  **postgres**: The Event Store (Source of Truth).
3.  **neo4j**: The Graph Store (Query Engine).
    *   console: http://localhost:7474
    *   bolt: `bolt://localhost:7687`
    *   user/pass: `neo4j/password`
4.  **redis**: The Cache Layer.
    *   port: 6379

## Running the Stack

### 1. Start Services
To start everything in the background:
```bash
docker-compose up -d
```

To watch logs for the API:
```bash
docker-compose logs -f som-tier0
```

### 2. Verification
Check if the service is healthy:
```bash
curl http://localhost:3000/health/liveness
```

### 3. Development Mode
To rebuild the `som-tier0` image after making code changes:
```bash
docker-compose up -d --build som-tier0
```

### 4. Database Persistence
Data is persisted in Docker named volumes:
*   `postgres_data`
*   `neo4j_data`
*   `redis_data`

To **reset** the environment (Wipe all data):
```bash
docker-compose down -v
```

## Troubleshooting
*   **Neo4j Startup**: Takes 10-20 seconds. The API depends on it being healthy. If the API crashes immediately, it will restart until Neo4j is ready.
*   **Common Errors**:
    *   `SqliteError`: Ensure `DB_TYPE=postgres` is set in the compose file (it is by default now).
    *   `AuthError`: Verify Neo4j password in `docker-compose.yml` matches what was initialized.
