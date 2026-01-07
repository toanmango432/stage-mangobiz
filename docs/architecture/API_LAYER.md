# API Layer Architecture

> Backend abstraction layer using Supabase Edge Functions

---

## Overview

The API layer provides a clean abstraction between the frontend application and the backend data store. It uses Supabase Edge Functions as the API gateway, enabling:

- **Backend Flexibility**: Easy migration to different backend providers
- **Type Safety**: Consistent camelCase types across the API
- **Offline Support**: Works with local-first IndexedDB architecture
- **Scalability**: Edge Functions run close to users globally

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                              │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Components │ → │  dataService │ → │  API Client  │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                            │                   │                     │
│              ┌─────────────┴───────┐           │                     │
│              ▼                     ▼           ▼                     │
│    ┌─────────────────┐   ┌─────────────────────────┐                │
│    │  IndexedDB      │   │  Supabase Edge Functions │                │
│    │  (Local-First)  │   │  /functions/v1/{entity}  │                │
│    └─────────────────┘   └─────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# Required: Supabase project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Optional: Override API base URL (defaults to ${VITE_SUPABASE_URL}/functions/v1)
# VITE_API_BASE_URL=https://custom-api.example.com

# Feature flag: Enable API mode (default: false = local-first mode)
VITE_USE_API_LAYER=false
```

### Modes

| Mode | `VITE_USE_API_LAYER` | Data Source | Use Case |
|------|---------------------|-------------|----------|
| **Local-First** (default) | `false` | IndexedDB + background sync | Offline-capable devices |
| **API-First** | `true` | REST API (Edge Functions) | Online-only devices, testing |

---

## Edge Functions

### Deployed Functions

| Function | Path | Description |
|----------|------|-------------|
| `auth` | `/functions/v1/auth/*` | Store and member authentication |
| `clients` | `/functions/v1/clients` | Client CRUD operations |
| `staff` | `/functions/v1/staff` | Staff member management |
| `services` | `/functions/v1/services` | Service catalog |
| `appointments` | `/functions/v1/appointments` | Appointment scheduling |
| `tickets` | `/functions/v1/tickets` | Ticket/transaction management |
| `transactions` | `/functions/v1/transactions` | Payment transactions |
| `batch-sync` | `/functions/v1/batch-sync` | Bulk sync operations |
| `data-query` | `/functions/v1/data-query` | Dynamic queries |

### URL Pattern

```
Base URL: https://<project-ref>.supabase.co/functions/v1

# List entities (with store filter)
GET /{entity}?store_id=xxx&limit=20&offset=0

# Get single entity
GET /{entity}/:id

# Create entity
POST /{entity}
Body: { storeId, ...fields }

# Update entity
PUT /{entity}/:id
Body: { ...updates }

# Delete entity
DELETE /{entity}/:id

# Special operations
GET /{entity}/search?store_id=xxx&q=query
GET /{entity}/vip?store_id=xxx
```

---

## API Client Package

Located at `packages/api-client/`

### Usage

```typescript
import { createAPIClient, endpoints } from '@mango/api-client';

// Create client
const api = createAPIClient({
  baseUrl: 'https://xxx.supabase.co/functions/v1',
  getAuthToken: () => localStorage.getItem('token'),
});

// List clients
const response = await api.get(endpoints.clients.list('store-123'));

// Create client
const newClient = await api.post(endpoints.clients.create, {
  storeId: 'store-123',
  firstName: 'John',
  lastName: 'Doe',
});

// Search clients
const results = await api.get(endpoints.clients.search('store-123', 'john'));
```

### Endpoints Reference

```typescript
// Clients
endpoints.clients.list(storeId, options?)     // GET /clients?store_id=xxx
endpoints.clients.get(clientId)               // GET /clients/:id
endpoints.clients.create                       // POST /clients
endpoints.clients.update(clientId)            // PUT /clients/:id
endpoints.clients.delete(clientId)            // DELETE /clients/:id
endpoints.clients.search(storeId, query)      // GET /clients/search?store_id=xxx&q=...
endpoints.clients.vip(storeId)                // GET /clients/vip?store_id=xxx

// Staff
endpoints.staff.list(storeId, options?)       // GET /staff?store_id=xxx
endpoints.staff.get(staffId)                  // GET /staff/:id
endpoints.staff.active(storeId)               // GET /staff/active?store_id=xxx

// Services
endpoints.services.list(storeId, options?)    // GET /services?store_id=xxx
endpoints.services.active(storeId)            // GET /services/active?store_id=xxx

// Appointments
endpoints.appointments.listByDate(storeId, date)  // GET /appointments?store_id=xxx&date=...
endpoints.appointments.get(id)                     // GET /appointments/:id

// Tickets
endpoints.tickets.listByDate(storeId, date)   // GET /tickets?store_id=xxx&date=...
endpoints.tickets.open(storeId)               // GET /tickets?store_id=xxx&status=open

// Transactions
endpoints.transactions.listByDate(storeId, date)  // GET /transactions?store_id=xxx&date=...
endpoints.transactions.byTicket(ticketId)          // GET /transactions?ticket_id=xxx

// Sync
endpoints.sync.push                           // POST /batch-sync
endpoints.sync.pull(storeId, since)          // GET /batch-sync/pull?store_id=xxx&since=...
```

---

## Response Format

### List Response

```json
{
  "data": [
    {
      "id": "uuid",
      "storeId": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "isVip": false,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "syncVersion": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Single Item Response

```json
{
  "data": {
    "id": "uuid",
    "storeId": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Create Response

```json
{
  "data": { /* created entity */ },
  "id": "new-uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Naming Conventions

The API follows consistent naming conventions:

| Layer | Convention | Example |
|-------|------------|---------|
| Database (PostgreSQL) | `snake_case` | `store_id`, `first_name` |
| Query Parameters | `snake_case` | `?store_id=xxx&updated_since=...` |
| Request/Response JSON | `camelCase` | `storeId`, `firstName` |
| TypeScript Types | `camelCase` | `storeId: string` |

See [NAMING_CONVENTIONS.md](../NAMING_CONVENTIONS.md) for complete documentation.

---

## Testing Edge Functions

### Using curl

```bash
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your-anon-key"
STORE_ID="your-store-id"

# List clients
curl "$SUPABASE_URL/functions/v1/clients?store_id=$STORE_ID&limit=10" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"

# Create client
curl "$SUPABASE_URL/functions/v1/clients" \
  -X POST \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"storeId":"xxx","firstName":"John","lastName":"Doe"}'

# Search clients
curl "$SUPABASE_URL/functions/v1/clients/search?store_id=$STORE_ID&q=john" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
```

### Enabling API Mode in App

1. Set environment variable:
   ```bash
   VITE_USE_API_LAYER=true
   ```

2. Start the app:
   ```bash
   npm run dev
   ```

3. Open DevTools → Network tab to verify API calls

---

## Deployment

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy clients

# View logs
supabase functions logs clients
```

### Environment Secrets

Set secrets in Supabase dashboard or CLI:

```bash
supabase secrets set JWT_SECRET=your-secret-key
```

---

*Last updated: January 2026*
