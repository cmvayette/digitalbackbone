# SOM API Client

 The `@som/api-client` package provides a strictly-typed TypeScript client for interacting with the Semantic Operating Model (Tier-0) backend.

## Installation

```bash
npm install @som/api-client
```

## Quick Start

### 1. Initialize the Client

```typescript
import { createSOMClient } from '@som/api-client';

const client = createSOMClient({
  baseUrl: 'http://localhost:3333/api/v1',
  timeout: 5000,
});
```

### 2. Authenticate

You must set an API key before making requests. For local development, use the pre-configured dev key.

```typescript
client.setAuthToken('dev-token-123');
```

### 3. Query Data

Use the `queryHolons` method to fetch entities.

```typescript
import { HolonType } from '@som/shared-types';

try {
  const organizations = await client.queryHolons({
    type: HolonType.Organization,
    pagination: { page: 1, pageSize: 50 }
  });

  console.log('Found orgs:', organizations.data);
} catch (err) {
  console.error('Failed to fetch:', err);
}
```

## Features

*   **Strict Typing**: All responses are typed with shared definitions from `@som/shared-types`.
*   **Error Handling**: Unified error parsing for 4xx/5xx responses.
*   **Health Check**: `client.health()` to verify backend connectivity.

## Hooks (React)

While this package is framework-agnostic, you can easily wrap it in React hooks:

```typescript
// Example hook usage
export function useOrgData() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const client = createSOMClient({ baseUrl: '...' });
    client.setAuthToken('dev-token-123');
    
    client.queryHolons({ type: HolonType.Organization })
      .then(res => setData(res.data));
  }, []);
  
  return data;
}
```
