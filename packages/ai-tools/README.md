# @mango/ai-tools

AI tool definitions for Mango Connect integration. This package makes Mango Biz AI-controllable by providing comprehensive tool schemas, handlers, and a unified registry.

## Vision

> "Make Mango Biz a house AI loves to live in"

- **AI can see everything** — Comprehensive tool schemas covering all business operations
- **AI can do anything** — Every operation exposed through typed handlers
- **AI can understand context** — Rich metadata and natural language descriptions
- **AI can react instantly** — MQTT events for real-time updates
- **AI doesn't get confused** — Predictable patterns and consistent error handling

## Quick Start

### Installation

```bash
pnpm add @mango/ai-tools
```

### Get Tool Definitions (for AI model)

```typescript
import { getAllToolDefinitions } from '@mango/ai-tools';

// OpenAI function calling format
const openaiTools = getAllToolDefinitions('openai');

// Anthropic tool use format
const anthropicTools = getAllToolDefinitions('anthropic');

// Unified format with metadata (default)
const allTools = getAllToolDefinitions();
```

### Validate & Execute Tools

```typescript
import { validateToolInput, executeTool } from '@mango/ai-tools';

// 1. Validate input before execution
const validation = validateToolInput('searchClients', { query: 'John' });
if (!validation.success) {
  console.error(validation.message);  // Human-readable error
  return;
}

// 2. Execute with validated input
const context = {
  storeId: 'store-uuid',
  userId: 'user-uuid',
  logger: console,  // or custom logger
};

const result = await executeTool('searchClients', validation.data, context);

if (result.success) {
  console.log(result.data);  // Typed response
} else {
  console.error(result.error, result.errorCode);
}
```

### Browse Available Tools

```typescript
import {
  getToolsByCategory,
  getToolByName,
  getRegistryStats,
  filterTools
} from '@mango/ai-tools';

// Get all client tools
const clientTools = getToolsByCategory('clients');

// Get specific tool definition
const searchTool = getToolByName('searchClients');

// Filter by criteria
const readOnlyTools = filterTools({ tags: ['read'] });
const managerTools = filterTools({ permissionLevel: 'manager' });

// Registry statistics
const stats = getRegistryStats();
console.log(`Total tools: ${stats.totalTools}`);
```

## Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| `clients` | 6 | Search, view, create, update clients, add notes |
| `appointments` | 6 | Book, reschedule, cancel, check availability |
| `services` | 5 | Browse catalog, check pricing, find by staff |
| `tickets` | 8 | Create/close tickets, add items, apply discounts |
| `staff` | 6 | Schedules, availability, on-duty staff, performance |
| `analytics` | 5 | Dashboard metrics, sales reports, retention analysis |
| `system` | 6 | Store info, business hours, system status, audit logging |

**Total: 42 tools** across 7 categories.

## Integration with Mango Connect

Mango Connect calls tools via the `ai-tools` edge function:

```http
POST /functions/v1/ai-tools
Authorization: Bearer <user_token_or_service_key>
Content-Type: application/json

{
  "toolName": "searchClients",
  "parameters": { "query": "John" },
  "context": { "sessionId": "optional-session-id" }
}
```

**Response:**

```json
{
  "success": true,
  "data": { "clients": [...], "total": 5, "hasMore": false },
  "executionTimeMs": 45,
  "metadata": { "requestId": "req-uuid" }
}
```

## Documentation

- **[Tool Catalog](./docs/TOOL_CATALOG.md)** — Complete list of all 42 tools with parameters
- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** — Authentication, error handling, and best practices

## Development

```bash
# Type check
pnpm run typecheck

# Lint
pnpm run lint

# Run tests
pnpm test -- packages/ai-tools
```

## Package Structure

```
packages/ai-tools/
├── src/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Core types (AITool, ToolResult, etc.)
│   ├── registry.ts        # Tool registry and lookup functions
│   ├── schemas/           # Zod schemas for each category
│   │   ├── clients.ts
│   │   ├── appointments.ts
│   │   ├── services.ts
│   │   ├── tickets.ts
│   │   ├── staff.ts
│   │   ├── analytics.ts
│   │   ├── system.ts
│   │   └── index.ts
│   ├── handlers/          # Tool execution handlers
│   │   ├── clients.ts
│   │   ├── appointments.ts
│   │   ├── services.ts
│   │   ├── tickets.ts
│   │   ├── staff.ts
│   │   ├── analytics.ts
│   │   ├── system.ts
│   │   └── index.ts
│   └── utils/
│       └── schema-converter.ts  # Zod → JSON Schema conversion
├── docs/
│   ├── TOOL_CATALOG.md
│   └── INTEGRATION_GUIDE.md
└── package.json
```

## Dependencies

- `zod` — Schema definition and validation
- `zod-to-json-schema` — Convert Zod schemas to JSON Schema for AI providers

## Peer Dependencies

- `@mango/types` — Shared TypeScript types
- `@mango/api-contracts` — API contract definitions
