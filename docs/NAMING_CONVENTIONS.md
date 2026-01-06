# Naming Conventions

> Standardized naming conventions across the Mango POS system to ensure consistency and maintainability.

---

## Overview

This document defines the naming conventions used across all layers of the Mango POS system:
- Database Layer (PostgreSQL/Supabase)
- API Layer (Edge Functions)
- Frontend Layer (React/TypeScript)
- Package Layer (Monorepo packages)

---

## Layer-by-Layer Conventions

### 1. Database Layer (PostgreSQL)

| Element | Convention | Example |
|---------|------------|---------|
| Table names | `snake_case`, plural | `clients`, `appointments`, `staff` |
| Column names | `snake_case` | `store_id`, `first_name`, `created_at` |
| Primary keys | `id` (UUID) | `id` |
| Foreign keys | `{entity}_id` | `client_id`, `staff_id`, `store_id` |
| Timestamps | `{action}_at` | `created_at`, `updated_at`, `deleted_at` |
| Boolean columns | `is_{adjective}` | `is_active`, `is_blocked`, `is_vip` |
| JSON columns | Descriptive `snake_case` | `preferences`, `services`, `payments` |
| Sync fields | Standard pattern | `sync_status`, `sync_version` |

**Standard Table Columns:**
```sql
-- Every table should have:
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
store_id UUID NOT NULL REFERENCES stores(id),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
sync_status TEXT DEFAULT 'synced',
sync_version INTEGER DEFAULT 1
```

---

### 2. API Layer (Edge Functions)

#### Request/Response JSON
| Element | Convention | Example |
|---------|------------|---------|
| Field names | `camelCase` | `storeId`, `firstName`, `createdAt` |
| Nested objects | `camelCase` | `loyaltyInfo`, `visitSummary` |
| Arrays | Plural `camelCase` | `services`, `payments`, `tags` |

#### Query Parameters
| Element | Convention | Example |
|---------|------------|---------|
| Filter params | `snake_case` | `?store_id=xxx`, `?updated_since=xxx` |
| Boolean params | `snake_case` | `?include_inactive=true` |
| Pagination | Standard names | `?limit=20&offset=0` |

#### URL Paths
| Element | Convention | Example |
|---------|------------|---------|
| Resource paths | Plural, lowercase | `/clients`, `/appointments` |
| Resource ID | After resource | `/clients/:id` |
| Sub-resources | Nested path | `/clients/:id/notes` |
| Actions | Verb suffix | `/appointments/:id/check-in` |
| Filters | Path segments | `/services/category/:category` |

**Edge Function Endpoints Pattern:**
```
GET    /{entity}?store_id=xxx              # List
GET    /{entity}/:id                        # Get single
POST   /{entity}                            # Create
PUT    /{entity}/:id                        # Update
DELETE /{entity}/:id                        # Delete
POST   /{entity}/:id/{action}               # Custom action
```

---

### 3. Frontend Layer (TypeScript/React)

#### Type Definitions
| Element | Convention | Example |
|---------|------------|---------|
| Interfaces | `PascalCase` | `Client`, `Appointment`, `Staff` |
| Type aliases | `PascalCase` | `TicketStatus`, `PaymentMethod` |
| Enums | `PascalCase` values | `SyncStatus.Pending` |
| Props interfaces | `{Component}Props` | `ClientCardProps`, `BookPageProps` |

#### Variables and Properties
| Element | Convention | Example |
|---------|------------|---------|
| Entity IDs | `{entity}Id` | `storeId`, `clientId`, `staffId` |
| Properties | `camelCase` | `firstName`, `isActive`, `createdAt` |
| Booleans | `is{Adjective}` or `has{Noun}` | `isBlocked`, `hasVariants` |
| Collections | Plural | `services`, `payments`, `clients` |

**Critical: Use `storeId` NOT `salonId`**
```typescript
// CORRECT
interface Client {
  id: string;
  storeId: string;  // ✅
  firstName: string;
}

// INCORRECT
interface Client {
  id: string;
  salonId: string;  // ❌ NEVER use salonId
}
```

#### React Components
| Element | Convention | Example |
|---------|------------|---------|
| Component files | `PascalCase.tsx` | `ClientCard.tsx`, `BookPage.tsx` |
| Component names | `PascalCase` | `ClientCard`, `AppointmentList` |
| Hook files | `use{Name}.ts` | `useClient.ts`, `useBooking.ts` |
| Hook names | `use{Name}` | `useClient`, `useBookingForm` |
| Context | `{Name}Context` | `AuthContext`, `ThemeContext` |
| Providers | `{Name}Provider` | `AuthProvider`, `ThemeProvider` |

#### Redux
| Element | Convention | Example |
|---------|------------|---------|
| Slice files | `{entity}Slice.ts` | `clientsSlice.ts`, `authSlice.ts` |
| Slice names | `camelCase` | `clients`, `appointments` |
| Actions | `{verb}{Entity}` | `fetchClients`, `updateClient` |
| Selectors | `select{Entity}` | `selectClients`, `selectClientById` |
| Thunks | `{verb}{Entity}Async` | `fetchClientsAsync` |

---

### 4. Package Layer (Monorepo)

| Element | Convention | Example |
|---------|------------|---------|
| Package names | `kebab-case` | `@mango/api-client`, `@mango/types` |
| Export names | Match internal | Various conventions as per type |
| File names | `kebab-case.ts` | `client-adapter.ts`, `api-client.ts` |

---

## Field Mapping Reference

### Database → API Mapping

| Database (snake_case) | API (camelCase) |
|----------------------|-----------------|
| `store_id` | `storeId` |
| `client_id` | `clientId` |
| `first_name` | `firstName` |
| `last_name` | `lastName` |
| `is_active` | `isActive` |
| `is_blocked` | `isBlocked` |
| `is_vip` | `isVip` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `sync_status` | `syncStatus` |
| `sync_version` | `syncVersion` |
| `loyalty_info` | `loyaltyInfo` |
| `visit_summary` | `visitSummary` |

### Adapter Pattern

Adapters in `packages/supabase/src/adapters/` handle this conversion:

```typescript
// toClient: Database row → App type
export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    storeId: row.store_id,      // snake_case → camelCase
    firstName: row.first_name,
    isBlocked: row.is_blocked,
    // ...
  };
}

// toClientInsert: App type → Database insert
export function toClientInsert(client: Client): ClientInsert {
  return {
    store_id: client.storeId,    // camelCase → snake_case
    first_name: client.firstName,
    is_blocked: client.isBlocked,
    // ...
  };
}
```

---

## Common Patterns

### Entity Standard Fields

Every entity should have these standard fields:

```typescript
interface BaseEntity {
  id: string;                    // UUID
  storeId: string;              // Store context
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
  syncStatus: SyncStatus;       // 'synced' | 'pending' | 'error'
}
```

### Status Fields

Use string enums for status fields:

```typescript
// CORRECT - String literal union
type TicketStatus = 'open' | 'in_progress' | 'completed' | 'void';
type StaffStatus = 'available' | 'busy' | 'off' | 'break';

// Status in database uses same values
status TEXT NOT NULL DEFAULT 'open'
```

### Timestamps

Always use ISO 8601 strings:

```typescript
// CORRECT
createdAt: '2025-01-06T10:30:00.000Z'  // ISO 8601 string

// INCORRECT
createdAt: new Date()  // Date object
createdAt: 1704538200  // Unix timestamp
```

---

## Anti-Patterns to Avoid

### 1. Mixed Identifier Names
```typescript
// ❌ WRONG - mixing naming conventions
interface Client {
  salonId: string;     // NO - use storeId
  salon_id: string;    // NO - use camelCase in TS
  StoreId: string;     // NO - use lowercase first letter
}

// ✅ CORRECT
interface Client {
  storeId: string;
}
```

### 2. Redundant Status Fields
```typescript
// ❌ WRONG - redundant fields
interface Staff {
  status: StaffStatus;
  isActive: boolean;   // Redundant with status
}

// ✅ CORRECT - derive from status
interface Staff {
  status: StaffStatus;
  // Use helper: isStaffActive(staff) => staff.status === 'available'
}
```

### 3. Inconsistent Pluralization
```typescript
// ❌ WRONG
const staffs = [];     // 'staff' is already plural
const personnels = []; // 'personnel' is already plural

// ✅ CORRECT
const staff = [];      // Staff is collective noun
const team = [];       // Or use 'team'
```

---

## Migration Notes

### salonId → storeId Migration

As of January 2025, all instances of `salonId` have been renamed to `storeId` for consistency:

- Database column: `store_id` (unchanged)
- API/Frontend: `storeId` (was `salonId`)
- Type definitions: `storeId: string` (was `salonId: string`)

**Files affected:**
- All type definitions in `packages/types/src/`
- All adapters in `packages/supabase/src/adapters/`
- All store-app types in `apps/store-app/src/types/`
- All store-app adapters in `apps/store-app/src/services/supabase/adapters/`
- Various components and services across the codebase

---

## Checklist for New Features

When adding new entities or features, ensure:

- [ ] Database table uses `snake_case` for all columns
- [ ] Database table includes standard fields (id, store_id, created_at, updated_at, sync_status, sync_version)
- [ ] TypeScript interface uses `camelCase` for all properties
- [ ] TypeScript interface uses `storeId` (not `salonId`)
- [ ] Adapter converts between snake_case and camelCase
- [ ] API responses use camelCase
- [ ] API query params use snake_case
- [ ] Component props interface is named `{Component}Props`
- [ ] Redux slice follows naming conventions

---

*Last updated: January 2025*
