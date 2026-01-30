# @mango/ai-tools

AI tool definitions for Mango Connect integration.

## Purpose

This package makes Mango Biz AI-controllable by providing:

- **Tool Schemas**: Zod-based schemas defining AI tool parameters and return types
- **Tool Handlers**: Functions that execute tool operations via dataService
- **Tool Registry**: Central registry for tool discovery, validation, and OpenAI/Anthropic format generation

## Vision

"Make Mango Biz a house AI loves to live in"

- AI can see everything (comprehensive tool schemas)
- AI can do anything (every operation exposed)
- AI can understand context (rich metadata, clear descriptions)
- AI can react instantly (MQTT events)
- AI doesn't get confused (predictable patterns)

## Installation

```bash
pnpm add @mango/ai-tools
```

## Tool Categories

| Category | Description |
|----------|-------------|
| `clients` | Search, view, create, update clients |
| `appointments` | Book, reschedule, cancel appointments |
| `services` | Browse service catalog, check pricing |
| `tickets` | Manage open tickets, checkout |
| `staff` | Staff schedules, availability |
| `analytics` | Dashboard metrics, reports |
| `system` | Store info, business hours |

## Quick Start

```typescript
import {
  getAllToolDefinitions,
  executeTool,
  validateToolInput,
} from '@mango/ai-tools';

// Get all tool definitions in OpenAI format
const tools = getAllToolDefinitions();

// Validate input before execution
const validation = validateToolInput('searchClients', { query: 'John' });
if (!validation.success) {
  console.error(validation.error);
}

// Execute a tool
const result = await executeTool('searchClients', { query: 'John' }, context);
```

## Integration with Mango Connect

Mango Connect calls tools via the `ai-tools` edge function:

```typescript
POST /functions/v1/ai-tools
{
  "toolName": "searchClients",
  "parameters": { "query": "John" },
  "context": { "storeId": "..." }
}
```

## Documentation

- [Tool Catalog](./docs/TOOL_CATALOG.md) - Complete list of available tools
- [Integration Guide](./docs/INTEGRATION_GUIDE.md) - How to integrate with Mango Connect

## Development

```bash
# Type check
pnpm run typecheck

# Lint
pnpm run lint
```

## Dependencies

- `zod` - Schema definition and validation
- `zod-to-json-schema` - Convert Zod schemas to JSON Schema for AI providers

## Peer Dependencies

- `@mango/types` - Shared TypeScript types
- `@mango/api-contracts` - API contract definitions
