# Architecture

## System Pattern

**Type:** Offline-first monorepo with multi-platform deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mango POS System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │Store App│ │Online   │ │Check-in │ │Control Center   │ │   │
│  │  │(Electron│ │Store    │ │(Web)    │ │(Web)            │ │   │
│  │  │/Web/    │ │(Web)    │ │         │ │                 │ │   │
│  │  │Mobile)  │ │         │ │         │ │                 │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    State Layer (Redux)                    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │ Slices  │ │ Thunks  │ │Selectors│ │  Middleware     │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Service Layer                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │ dataService │ │ syncService │ │  mqttService        │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Data Layer                             │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │  Supabase   │ │   Dexie.js  │ │   SQLite Adapter    │ │   │
│  │  │  (Cloud)    │ │ (IndexedDB) │ │   (Native)          │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Path
```
Component → useSelector → Redux Store ← Thunk ← dataService ← Supabase/IndexedDB
```

### Write Path
```
Component → dispatch(thunk) → dataService → Supabase → Realtime → syncService → Redux
                                    ↓
                              IndexedDB (cache)
```

### Offline Sync
```
User Action → IndexedDB (immediate) → Queue → Online? → Supabase → Conflict Resolution
```

## Layer Responsibilities

### Presentation Layer (`apps/*/src/components/`)

- React functional components
- TailwindCSS styling
- Props-driven, minimal logic
- Design system tokens

### State Layer (`apps/*/src/store/`)

- Redux Toolkit slices
- Async thunks for data fetching
- Memoized selectors
- Persistence middleware

### Service Layer (`apps/*/src/services/`)

- Business logic
- API abstraction
- Data transformation (snake_case ↔ camelCase)
- Error handling

### Data Layer (`packages/`)

- `@mango/supabase` - Cloud database client
- `@mango/database` - IndexedDB wrapper
- `@mango/sqlite-adapter` - Platform SQLite
- `@mango/mqtt` - Real-time messaging

## Entry Points

### Store App
- **Web:** `apps/store-app/index.html` → `src/main.tsx`
- **Electron:** `electron/main/index.ts`
- **Mobile:** Capacitor wraps web build

### Online Store
- **Web:** `apps/online-store/index.html` → `src/main.tsx`

### Check-in / Mango Pad / Control Center
- **Web:** `apps/*/index.html` → `src/main.tsx`

## Key Abstractions

### dataService Pattern
```typescript
// Never call Supabase directly from components
// Always go through dataService

// Bad
const { data } = await supabase.from('appointments').select()

// Good
const appointments = await dataService.getAppointments(date)
```

### Type Adapters
```typescript
// Database uses snake_case, app uses camelCase
interface DbAppointment {
  start_time: string
  client_id: string
}

interface Appointment {
  startTime: string
  clientId: string
}

// Adapters handle conversion
const toAppointment = (db: DbAppointment): Appointment => ({...})
const toDbAppointment = (app: Appointment): DbAppointment => ({...})
```

### MQTT Messaging
```typescript
// Dual-broker for resilience
mqttService.connect({
  local: 'ws://localhost:9001',  // Mosquitto
  cloud: 'wss://broker.emqx.io'  // Fallback
})

// Publish to both, dedupe on receive
mqttService.publish('appointments/update', payload)
```

## Module Boundaries

| Module | Allowed Dependencies |
|--------|---------------------|
| Components | hooks, utils, types, ui, design-system |
| Hooks | store, services, utils, types |
| Store | services, types |
| Services | packages (supabase, database, mqtt) |
| Packages | Only other packages, no app code |

## Platform-Specific Code

### Detection
```typescript
// packages/utils/src/platform.ts
export const isElectron = () => !!window.electron
export const isCapacitor = () => Capacitor.isNativePlatform()
export const isWeb = () => !isElectron() && !isCapacitor()
```

### Conditional Imports
```typescript
// Dynamic import based on platform
const storage = isElectron()
  ? await import('@mango/sqlite-adapter/electron')
  : await import('@mango/database')
```
