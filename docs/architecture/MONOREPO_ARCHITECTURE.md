# Monorepo Architecture

> Turborepo + pnpm workspaces structure for Mango POS

---

## Overview

Mango POS uses a **monorepo architecture** to manage multiple applications and shared packages. This enables:

- **Code sharing** across apps (types, utilities, database layer)
- **Consistent tooling** (TypeScript, ESLint, Prettier)
- **Atomic changes** across multiple packages
- **Efficient builds** with Turborepo caching

---

## Directory Structure

```
mango-pos/                              # Root monorepo
├── apps/
│   ├── store-app/                      # Main POS application (Electron + React)
│   ├── online-store/                   # Customer booking portal (Next.js)
│   ├── check-in/                       # Walk-in check-in kiosk (React)
│   ├── mango-pad/                      # Signature capture iPad app (React + Capacitor)
│   └── client-portal/                  # Client self-service (Next.js)
│
├── services/
│   ├── cloud-mqtt/                     # Cloud MQTT broker configuration
│   └── marketing-service/              # SMS/Email campaigns (Node.js) [Future]
│
├── packages/
│   ├── types/                          # @mango/types - Shared TypeScript types
│   ├── database/                       # @mango/database - Supabase client & tables
│   ├── utils/                          # @mango/utils - Shared utilities
│   ├── ui/                             # @mango/ui - Shared UI components
│   └── mqtt-client/                    # @mango/mqtt-client - MQTT wrapper
│
├── supabase/
│   └── functions/                      # Edge Functions
│
├── docs/                               # Documentation
├── turbo.json                          # Turborepo configuration
├── pnpm-workspace.yaml                 # pnpm workspace configuration
├── package.json                        # Root package.json
└── tsconfig.base.json                  # Shared TypeScript config
```

---

## Applications

### Store App (`apps/store-app`)

**Main POS application** for salon front desk operations.

| Property | Value |
|----------|-------|
| Platform | Electron + React |
| Port | 5173 (dev), 1883 (MQTT) |
| Features | Appointments, Tickets, Checkout, Staff Management |
| Special | Runs local Mosquitto MQTT broker |

### Online Store (`apps/online-store`)

**Customer-facing booking portal** for online appointments.

| Property | Value |
|----------|-------|
| Platform | Next.js |
| Deployment | Vercel |
| Features | Service browsing, Booking, Account management |
| Special | Uses smart auto-assignment for staff |

### Check-In App (`apps/check-in`)

**Walk-in client registration** for tablet/kiosk deployment.

| Property | Value |
|----------|-------|
| Platform | React + Capacitor |
| Deployment | iPad/Android tablet |
| Features | Client lookup, Walk-in registration, Staff clock-in |
| Special | Local-first, works offline |

### Mango Pad (`apps/mango-pad`)

**Signature capture** application for iPad.

| Property | Value |
|----------|-------|
| Platform | React + Capacitor |
| Deployment | iPad |
| Features | Signature capture, Receipt display, Tip selection |
| Special | Instant sync via local MQTT (QoS 1) |

### Client Portal (`apps/client-portal`)

**Client self-service** web application.

| Property | Value |
|----------|-------|
| Platform | Next.js |
| Deployment | Vercel |
| Features | Appointment history, Loyalty points, Profile management |
| Special | SSO with Online Store |

---

## Shared Packages

### @mango/types (`packages/types`)

Shared TypeScript type definitions.

```typescript
// packages/types/src/index.ts
export * from './appointment';
export * from './client';
export * from './staff';
export * from './ticket';
export * from './transaction';
export * from './common';
```

**Usage:**
```typescript
import { Appointment, Client, Staff } from '@mango/types';
```

### @mango/database (`packages/database`)

Supabase client and table operations.

```typescript
// packages/database/src/index.ts
export { createSupabaseClient, supabase } from './client';
export * from './tables/clients';
export * from './tables/staff';
export * from './tables/appointments';
export * from './adapters';
```

**Usage:**
```typescript
import { supabase, getClients, toAppClient } from '@mango/database';
```

### @mango/utils (`packages/utils`)

Shared utility functions.

```typescript
// packages/utils/src/index.ts
export * from './smartAutoAssign';
export * from './conflictDetection';
export * from './dateUtils';
export * from './formatters';
```

**Usage:**
```typescript
import { smartAutoAssign, detectConflicts } from '@mango/utils';
```

### @mango/ui (`packages/ui`)

Shared UI components and design tokens.

```typescript
// packages/ui/src/index.ts
export * from './components';
export * from './design-system';
export * from './hooks';
```

**Usage:**
```typescript
import { Button, Card, colors, brand } from '@mango/ui';
```

### @mango/mqtt-client (`packages/mqtt-client`)

MQTT client wrapper with auto-discovery and QoS support.

```typescript
// packages/mqtt-client/src/index.ts
export { MangoMqtt } from './MangoMqtt';
export { discoverLocalBroker } from './discovery';
export * from './topics';
export * from './types';
```

**Usage:**
```typescript
import { MangoMqtt } from '@mango/mqtt-client';

const mqtt = new MangoMqtt({ salonId, deviceId, deviceType });
await mqtt.connect();

// Subscribe to topics
mqtt.subscribe(`salon/${salonId}/tickets/#`);

// Publish with QoS (0=at most once, 1=at least once, 2=exactly once)
mqtt.publish(`salon/${salonId}/pad/signature`, data, { qos: 1 });
```

---

## Configuration Files

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true
  }
}
```

### Root package.json

```json
{
  "name": "mango-pos",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "dev:store": "turbo dev --filter=store-app",
    "dev:online": "turbo dev --filter=online-store",
    "build:packages": "turbo build --filter='./packages/*'"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

---

## Common Commands

### Development

```bash
# Start all apps in development
pnpm dev

# Start specific app
pnpm dev --filter=store-app
pnpm dev --filter=online-store
pnpm dev --filter=check-in

# Start multiple apps
pnpm dev --filter=store-app --filter=check-in
```

### Building

```bash
# Build everything
pnpm build

# Build specific app
pnpm build --filter=store-app

# Build packages only (for CI)
pnpm build --filter='./packages/*'

# Build app with dependencies
pnpm build --filter=store-app...
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter=@mango/utils

# Run tests with coverage
pnpm test -- --coverage
```

### Type Checking

```bash
# Check all packages
pnpm typecheck

# Check specific package
pnpm typecheck --filter=@mango/types
```

### Adding Dependencies

```bash
# Add to specific package
pnpm add lodash --filter=@mango/utils

# Add dev dependency to root
pnpm add -D eslint -w

# Add workspace package as dependency
pnpm add @mango/types --filter=store-app --workspace
```

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                           APPS                                   │
│                                                                  │
│   store-app ──────┬─────────────────────────────────────────┐   │
│   online-store ───┤                                         │   │
│   check-in ───────┼──► @mango/types                         │   │
│   mango-pad ──────┤   @mango/database ──► @mango/types      │   │
│   client-portal ──┘   @mango/utils ─────► @mango/types      │   │
│                       @mango/ui ────────► @mango/types      │   │
│                       @mango/mqtt-client ──► @mango/types   │   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PACKAGES                                 │
│                                                                  │
│   @mango/types ─────────────────────────────► (no deps)         │
│   @mango/database ──────────────────────────► @mango/types      │
│   @mango/utils ─────────────────────────────► @mango/types      │
│   @mango/ui ────────────────────────────────► @mango/types      │
│   @mango/mqtt-client ───────────────────────► @mango/types      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Build Caching

Turborepo provides **remote caching** for CI/CD:

```bash
# Enable remote caching (Vercel)
npx turbo login
npx turbo link

# Build with remote cache
turbo build --remote-only
```

### Cache Hit Example

```
$ pnpm build

• Packages in scope: @mango/types, @mango/database, store-app
• Running build in 3 packages
• Remote caching enabled

@mango/types:build: cache hit, replaying logs
@mango/database:build: cache hit, replaying logs
store-app:build: cache miss, executing

 Tasks:    3 successful, 3 total
Cached:    2 cached, 3 total
  Time:    12.3s
```

---

## Migration Path

### From Current Structure

1. **Phase 1**: Add monorepo tooling (pnpm, Turborepo)
2. **Phase 2**: Extract shared types to `packages/types`
3. **Phase 3**: Move current app to `apps/store-app`
4. **Phase 4**: Extract database layer to `packages/database`
5. **Phase 5**: Create new apps as needed

### Backward Compatibility

During migration, the existing app continues working:

```json
// Temporary package.json in apps/store-app
{
  "dependencies": {
    "@mango/types": "workspace:*",
    "@mango/database": "workspace:*"
  }
}
```

---

## Related Documentation

- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) - Overall architecture
- [Real-time Communication](./REALTIME_COMMUNICATION.md) - MQTT architecture
- [Data Storage Strategy](./DATA_STORAGE_STRATEGY.md) - Database patterns

---

*Last updated: January 2025*
