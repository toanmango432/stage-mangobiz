# Integration Guide

How to integrate Mango Connect with Mango Biz AI tools.

---

## Overview

Mango Connect communicates with Mango Biz via the `ai-tools` edge function. This guide covers:

1. [Authentication](#authentication)
2. [Making Requests](#making-requests)
3. [Error Handling](#error-handling)
4. [Best Practices](#best-practices)

---

## Authentication

The `ai-tools` edge function supports two authentication methods:

### 1. User Token (Client Applications)

For applications acting on behalf of a logged-in user:

```http
POST /functions/v1/ai-tools
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

The user's store membership is validated automatically. The user must be a member of the store they're accessing.

### 2. Service Role Key (Server-to-Server)

For trusted backend services:

```http
POST /functions/v1/ai-tools
Authorization: Bearer <service_role_key>
X-Store-ID: <store_uuid>
Content-Type: application/json
```

**Important:** When using the service role key, you must include the `X-Store-ID` header to specify which store the request is for.

### Authentication Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `PERMISSION_DENIED` | 403 | User not a member of the store |

---

## Making Requests

### Request Format

```http
POST /functions/v1/ai-tools
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <optional-request-id>

{
  "toolName": "searchClients",
  "parameters": {
    "query": "John",
    "limit": 10
  },
  "context": {
    "sessionId": "optional-session-id"
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolName` | string | Yes | Name of the tool to execute |
| `parameters` | object | Yes | Tool input parameters |
| `context.sessionId` | string | No | Session ID for grouping related calls |

### Response Format

**Success:**

```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid-123",
        "firstName": "John",
        "lastName": "Smith",
        "phone": "555-1234",
        "totalVisits": 12
      }
    ],
    "total": 1,
    "hasMore": false
  },
  "executionTimeMs": 45,
  "metadata": {
    "requestId": "req-uuid-456",
    "toolName": "searchClients",
    "category": "clients"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Client not found",
  "errorCode": "NOT_FOUND",
  "executionTimeMs": 12,
  "metadata": {
    "requestId": "req-uuid-789"
  }
}
```

---

## Error Handling

### Error Codes

| Code | Description | Recommended Action |
|------|-------------|-------------------|
| `INVALID_INPUT` | Parameters failed validation | Check parameters against schema |
| `NOT_FOUND` | Requested resource doesn't exist | Verify ID is correct |
| `PERMISSION_DENIED` | User lacks required permission | Check user's role/permissions |
| `CONFLICT` | Operation conflicts with existing data | Retry with different parameters |
| `RATE_LIMITED` | Too many requests | Implement backoff and retry |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | Retry after delay |
| `INTERNAL_ERROR` | Unexpected server error | Report issue, retry later |
| `TIMEOUT` | Operation took too long | Retry with simpler query |

### Validation Errors

When input validation fails, the error message contains details about which fields are invalid:

```json
{
  "success": false,
  "error": "query: String must contain at least 1 character(s); limit: Number must be greater than or equal to 1",
  "errorCode": "INVALID_INPUT"
}
```

### Handling Errors in Code

```typescript
const response = await fetch('/functions/v1/ai-tools', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    toolName: 'searchClients',
    parameters: { query: 'John' },
  }),
});

const result = await response.json();

if (!result.success) {
  switch (result.errorCode) {
    case 'NOT_FOUND':
      // Resource doesn't exist
      console.log('No matching clients found');
      break;
    case 'INVALID_INPUT':
      // Bad parameters
      console.error('Invalid input:', result.error);
      break;
    case 'PERMISSION_DENIED':
      // User can't perform this action
      console.error('Permission denied');
      break;
    case 'RATE_LIMITED':
      // Implement exponential backoff
      await sleep(1000);
      return retry();
    default:
      console.error('Unexpected error:', result.error);
  }
  return;
}

// Success - use result.data
const { clients, total } = result.data;
```

---

## Best Practices

### 1. Validate Before Execution

Use `validateToolInput` on the client side to catch errors early:

```typescript
import { validateToolInput } from '@mango/ai-tools';

const validation = validateToolInput('bookAppointment', parameters);
if (!validation.success) {
  // Show validation errors to user
  return { error: validation.message };
}

// Proceed with API call
const result = await callAiTools('bookAppointment', validation.data);
```

### 2. Use Request IDs for Tracing

Include a request ID to correlate logs across systems:

```typescript
const requestId = crypto.randomUUID();

const response = await fetch('/functions/v1/ai-tools', {
  headers: {
    'X-Request-ID': requestId,
    // ... other headers
  },
  // ... body
});

// Log with request ID for debugging
console.log(`[${requestId}] Tool response:`, response);
```

### 3. Handle Pagination

For list operations, check `hasMore` and paginate:

```typescript
async function* getAllClients(query: string) {
  let offset = 0;
  const limit = 50;

  while (true) {
    const result = await callAiTools('searchClients', {
      query,
      limit,
      offset,
    });

    if (!result.success) break;

    for (const client of result.data.clients) {
      yield client;
    }

    if (!result.data.hasMore) break;
    offset += limit;
  }
}
```

### 4. Use Sessions for Related Calls

Group related tool calls with a session ID:

```typescript
const sessionId = crypto.randomUUID();

// All calls in this booking flow share the session
await callAiTools('searchClients', { query: 'John' }, { sessionId });
await callAiTools('checkAvailability', { serviceId, date }, { sessionId });
await callAiTools('bookAppointment', { clientId, serviceId, startTime }, { sessionId });
```

### 5. Check Availability Before Booking

Always verify availability before attempting to book:

```typescript
// 1. Check availability first
const availability = await callAiTools('checkAvailability', {
  serviceId,
  date,
  staffId,
});

if (!availability.data.availableSlots.length) {
  return { error: 'No available slots' };
}

// 2. Book using an available slot
const slot = availability.data.availableSlots[0];
const booking = await callAiTools('bookAppointment', {
  clientId,
  staffId: slot.staff[0].id,
  serviceId,
  startTime: slot.startTime,
});
```

### 6. Log AI Actions

Record significant actions for auditing:

```typescript
// After making a recommendation or taking action
await callAiTools('logAIAction', {
  action: 'recommended_service',
  category: 'recommendation',
  details: {
    serviceId: recommendedService.id,
    clientId: client.id,
    reason: 'Popular in client segment',
  },
  reasoning: 'Client profile matches segment that frequently books this service',
  severity: 'info',
});
```

### 7. Respect Permission Levels

Check tool permission requirements before calling:

```typescript
import { getToolByName } from '@mango/ai-tools';

const tool = getToolByName('getSalesReport');

if (tool?.requiresPermission && tool.permissionLevel === 'manager') {
  if (!userHasRole('manager')) {
    return { error: 'Manager permission required' };
  }
}
```

---

## Tool Discovery

### Get All Available Tools

```typescript
import { getAllToolDefinitions, getRegistryStats } from '@mango/ai-tools';

// Get tool definitions for AI model
const tools = getAllToolDefinitions('openai');

// Get registry statistics
const stats = getRegistryStats();
console.log(`Total tools: ${stats.totalTools}`);
console.log(`Tools by category:`, stats.byCategory);
```

### Filter Tools by Criteria

```typescript
import { filterTools, getToolsByCategory } from '@mango/ai-tools';

// Get all client tools
const clientTools = getToolsByCategory('clients');

// Get read-only tools
const readOnlyTools = filterTools({ tags: ['read'] });

// Get tools requiring manager permission
const managerTools = filterTools({ permissionLevel: 'manager' });

// Search tools by name/description
const bookingTools = filterTools({ search: 'book' });
```

---

## Rate Limiting

The `ai-tools` endpoint implements rate limiting:

| Limit | Scope | Window |
|-------|-------|--------|
| 100 requests | Per user | 1 minute |
| 1000 requests | Per store | 1 minute |

When rate limited, the response includes:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "errorCode": "RATE_LIMITED",
  "metadata": {
    "retryAfter": 30
  }
}
```

Implement exponential backoff:

```typescript
async function callWithRetry(toolName, params, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await callAiTools(toolName, params);

    if (result.success) return result;

    if (result.errorCode === 'RATE_LIMITED') {
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
      continue;
    }

    // Non-retryable error
    return result;
  }

  return { success: false, error: 'Max retries exceeded' };
}
```

---

## Audit Logging

All tool invocations are logged to the `ai_tool_invocations` table:

| Column | Description |
|--------|-------------|
| `id` | Unique log entry ID |
| `store_id` | Store the operation was for |
| `user_id` | User who made the request |
| `tool_name` | Tool that was invoked |
| `parameters` | Input parameters (JSONB) |
| `result` | Output or error (JSONB) |
| `success` | Whether execution succeeded |
| `error_message` | Error message if failed |
| `execution_time_ms` | How long execution took |
| `created_at` | When the invocation occurred |

Store admins can query their audit logs via the Supabase dashboard or API.

---

## TypeScript Types

Import types for type-safe integration:

```typescript
import type {
  AITool,
  AIToolCategory,
  ExecutionContext,
  ToolResult,
  ToolErrorCode,
  ValidationResult,
  OpenAIFunctionDefinition,
  AnthropicToolDefinition,
} from '@mango/ai-tools';

// Input types for specific tools
import type {
  SearchClientsInput,
  BookAppointmentInput,
  GetDashboardMetricsInput,
} from '@mango/ai-tools';
```

---

## Examples

### Complete Booking Flow

```typescript
import { validateToolInput } from '@mango/ai-tools';

async function bookAppointmentForClient(
  clientQuery: string,
  serviceName: string,
  preferredDate: string
) {
  const sessionId = crypto.randomUUID();

  // 1. Find the client
  const clientResult = await callAiTools(
    'searchClients',
    { query: clientQuery, limit: 1 },
    { sessionId }
  );

  if (!clientResult.success || !clientResult.data.clients.length) {
    return { error: 'Client not found' };
  }

  const client = clientResult.data.clients[0];

  // 2. Find the service
  const serviceResult = await callAiTools(
    'searchServices',
    { query: serviceName, limit: 1 },
    { sessionId }
  );

  if (!serviceResult.success || !serviceResult.data.services.length) {
    return { error: 'Service not found' };
  }

  const service = serviceResult.data.services[0];

  // 3. Check availability
  const availabilityResult = await callAiTools(
    'checkAvailability',
    { serviceId: service.id, date: preferredDate },
    { sessionId }
  );

  if (!availabilityResult.success) {
    return { error: 'Could not check availability' };
  }

  const slots = availabilityResult.data.availableSlots;
  if (!slots.length) {
    return { error: 'No available slots on this date' };
  }

  // 4. Book the first available slot
  const slot = slots[0];
  const bookingParams = {
    clientId: client.id,
    staffId: slot.staff[0].id,
    serviceId: service.id,
    startTime: slot.startTime,
    source: 'ai_assistant' as const,
  };

  // Validate before booking
  const validation = validateToolInput('bookAppointment', bookingParams);
  if (!validation.success) {
    return { error: validation.message };
  }

  const bookingResult = await callAiTools(
    'bookAppointment',
    validation.data,
    { sessionId }
  );

  if (!bookingResult.success) {
    return { error: bookingResult.error };
  }

  // 5. Log the action
  await callAiTools('logAIAction', {
    action: 'booked_appointment',
    category: 'booking',
    details: {
      appointmentId: bookingResult.data.appointment.id,
      clientId: client.id,
      serviceId: service.id,
    },
    reasoning: `Booked appointment for ${client.firstName} based on user request`,
  });

  return { success: true, appointment: bookingResult.data.appointment };
}
```

### Dashboard Data Fetch

```typescript
async function getDashboardData(date?: string) {
  const [metrics, onDutyStaff, openTickets] = await Promise.all([
    callAiTools('getDashboardMetrics', {
      date,
      includeComparison: true,
      includeGoals: true,
    }),
    callAiTools('getOnDutyStaff', {
      date,
      includeStatus: true,
    }),
    callAiTools('getOpenTickets', {
      includeDetails: true,
      limit: 20,
    }),
  ]);

  return {
    metrics: metrics.success ? metrics.data : null,
    staff: onDutyStaff.success ? onDutyStaff.data.staff : [],
    tickets: openTickets.success ? openTickets.data.tickets : [],
  };
}
```
