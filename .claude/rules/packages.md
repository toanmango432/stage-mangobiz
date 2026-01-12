---
paths: packages/**/*
---

# Shared Packages Rules

The `packages/` directory contains shared libraries used across all apps.

## Package Overview

| Package | Purpose | Used By |
|---------|---------|---------|
| `api-client` | API client utilities | All apps |
| `api-contracts` | Shared API type contracts | All apps |
| `database` | Database utilities | Store App |
| `design-system` | Design tokens, shared styles | All apps |
| `mqtt` | MQTT client wrapper | Store App, Check-In |
| `supabase` | Supabase client config | All apps |
| `types` | Shared TypeScript types | All apps |
| `ui` | Shared UI components | All apps |
| `utils` | Utility functions | All apps |

## Package Guidelines

### Creating New Packages

1. Create in `packages/` with its own `package.json`
2. Add to `pnpm-workspace.yaml`
3. Export via barrel file (`index.ts`)
4. Document in package README

### Dependencies

- Packages should be minimal and focused
- Avoid circular dependencies between packages
- External deps should be peer dependencies when possible

### Type Exports

```typescript
// packages/types/index.ts
export type { Client, ClientCreate, ClientUpdate } from './client';
export type { Appointment, AppointmentCreate } from './appointment';
export type { Ticket, TicketCreate } from './ticket';
```

### UI Components

```typescript
// packages/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Modal } from './Modal';
// All components should accept className prop
```

## Design System Package

**Single Source of Truth** for all styling:

```typescript
// Usage in apps
import { brand, colors, spacing } from '@mango/design-system';
import { bookTokens } from '@mango/design-system/modules/book';
```

- Never hardcode colors in apps
- All design tokens defined here
- Module-specific tokens in `modules/` subdirectory

## Testing Packages

- Each package should have its own tests
- Run with: `pnpm --filter @mango/<package> test`
- Shared test utilities in `packages/testing/`

## Before Making Changes

1. Consider impact on all consuming apps
2. Maintain backwards compatibility when possible
3. Update package version if breaking changes
4. Document changes in package README
