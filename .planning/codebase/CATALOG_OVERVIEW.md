# Catalog Module - Comprehensive Overview

## Table of Contents
- [Introduction](#introduction)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Key Design Decisions](#key-design-decisions)

---

## Introduction

The **Catalog Module** is the service menu management system for Mango POS. It handles:

- **Service Categories** - Organizing services into hierarchical categories
- **Menu Services** - Individual services with pricing, duration, and variants
- **Service Variants** - Different options for a service (e.g., "Short Hair", "Long Hair")
- **Service Packages** - Bundled services at discounted prices
- **Add-on Groups & Options** - Configurable add-ons (Fresha-style)
- **Staff Service Assignments** - Which staff can perform which services
- **Catalog Settings** - Per-store configuration (defaults, feature toggles)
- **Booking Sequences** - Defines service order (e.g., Cut → Color → Style)

**Key Features:**
- Multi-device sync with conflict resolution (vector clocks)
- Offline-first architecture with local IndexedDB storage
- Optional SQLite support for Electron desktop
- Optional Supabase cloud sync for online-only devices
- Archive functionality (soft delete with restoration)
- Search capabilities across services, categories, and packages

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│                     (React Components - Future)                  │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                          STATE LAYER                             │
│          Redux Slice (catalogSlice.ts) - DEPRECATED             │
│      Dexie Live Queries (useCatalog hook) - RECOMMENDED         │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│              catalogDataService.ts (Routing Logic)               │
└─────────────────────────────────────────────────────────────────┘
                    ↓                ↓                  ↓
┌──────────────────────┐  ┌───────────────────┐  ┌─────────────────┐
│  IndexedDB (Dexie)   │  │  SQLite (Electron)│  │  Supabase Cloud │
│    catalogDatabase   │  │  sqliteServices   │  │   (Online-only) │
│   LOCAL-FIRST (Web)  │  │ LOCAL-FIRST (App) │  │  ONLINE (Opt-in)│
└──────────────────────┘  └───────────────────┘  └─────────────────┘
```

### Storage Architecture (Tri-Path Design)

The Catalog module implements a **tri-path storage architecture** that routes data based on platform and connectivity:

1. **Dexie (IndexedDB)** - Default for web browsers
   - Offline-enabled
   - Cross-tab sync using BroadcastChannel
   - Vector clock conflict resolution

2. **SQLite** - For Electron desktop app
   - Native file-based database
   - Better performance for desktop
   - Enabled via `shouldUseSQLite()` flag

3. **Supabase** - For online-only devices (opt-in)
   - Direct PostgreSQL access
   - Real-time subscriptions
   - Multi-tenant RLS policies
   - Enabled via `VITE_USE_SUPABASE=true`

**Routing Priority:**
```typescript
if (USE_SQLITE) {
  // Electron desktop - use SQLite
  return sqliteServiceCategoriesDB.getAll(storeId);
} else if (USE_SUPABASE && navigator.onLine) {
  // Online-only devices - use Supabase
  const rows = await serviceCategoriesTable.getByStoreId(storeId);
  return toServiceCategories(rows);
} else {
  // Default - use IndexedDB
  return serviceCategoriesDB.getAll(storeId);
}
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.5.4 | Type safety |
| **Redux Toolkit** | 2.9.1 | State management (deprecated for catalog) |
| **Dexie.js** | 4.2.1 | IndexedDB wrapper with live queries |
| **Dexie React Hooks** | 1.1.7 | React bindings for Dexie live queries |

### Data Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| **IndexedDB** | Native | Browser offline storage (via Dexie) |
| **better-sqlite3** | 11.7.0 | Electron SQLite database |
| **@supabase/supabase-js** | 2.49.1 | Cloud database client |
| **uuid** | 11.1.0 | Generating unique IDs |

### Build & Development
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 6.4.1 | Build tool |
| **Vitest** | 4.0.16 | Unit testing |
| **Playwright** | 1.56.1 | E2E testing |
| **ESLint** | 8.50.0 | Linting |

---

## Core Components

### 1. Type System (`src/types/catalog.ts`)

**Single source of truth** for all catalog type definitions:

```typescript
// Core entities
export interface ServiceCategory extends BaseSyncableEntity { ... }
export interface MenuService extends BaseSyncableEntity { ... }
export interface ServiceVariant extends BaseSyncableEntity { ... }
export interface ServicePackage extends BaseSyncableEntity { ... }
export interface AddOnGroup extends BaseSyncableEntity { ... }
export interface AddOnOption extends BaseSyncableEntity { ... }
export interface StaffServiceAssignment extends BaseSyncableEntity { ... }
export interface CatalogSettings extends BaseSyncableEntity { ... }
export interface BookingSequence extends BaseSyncableEntity { ... }

// Input types (omit auto-generated fields)
export type CreateCategoryInput = Omit<ServiceCategory, 'id' | 'createdAt' | ...>
export type CreateMenuServiceInput = Omit<MenuService, 'id' | 'createdAt' | ...>
// ... etc
```

**Key Types:**
- `PricingType`: 'fixed' | 'from' | 'free' | 'varies' | 'hourly'
- `ServiceStatus`: 'active' | 'inactive' | 'archived'
- `BookingAvailability`: 'online' | 'in-store' | 'both' | 'disabled'
- `ExtraTimeType`: 'processing' | 'blocked' | 'finishing'

### 2. Database Operations (`src/db/catalogDatabase.ts`)

**Dexie CRUD operations** for all catalog entities:

```typescript
// Pattern for each entity:
export const serviceCategoriesDB = {
  async getAll(storeId: string, includeInactive = false): Promise<ServiceCategory[]>
  async getById(id: string): Promise<ServiceCategory | undefined>
  async create(input: CreateCategoryInput, userId: string, storeId: string): Promise<ServiceCategory>
  async update(id: string, updates: Partial<ServiceCategory>, userId: string): Promise<ServiceCategory | undefined>
  async delete(id: string): Promise<void>
  async reorder(storeId: string, orderedIds: string[], userId: string): Promise<void>
}
```

**Available Operations:**
- `serviceCategoriesDB` - Categories CRUD + reordering + counts
- `menuServicesDB` - Services CRUD + search + archive/restore
- `serviceVariantsDB` - Variants CRUD + default variant management
- `servicePackagesDB` - Packages CRUD
- `addOnGroupsDB` - Groups CRUD + with options
- `addOnOptionsDB` - Options CRUD
- `staffServiceAssignmentsDB` - Staff assignments CRUD + bulk operations
- `catalogSettingsDB` - Settings get/create/update
- `productsDB` - Products CRUD + search by SKU/barcode
- `bookingSequencesDB` - Sequences CRUD + enable/disable

### 3. Data Service Layer (`src/services/domain/catalogDataService.ts`)

**Routing layer** that selects the appropriate storage backend:

```typescript
export const serviceCategoriesService = {
  async getAll(storeId: string, includeInactive = false): Promise<ServiceCategory[]> {
    // Routing logic
    if (USE_SQLITE) return sqliteServiceCategoriesDB.getAll(storeId, includeInactive);
    if (USE_SUPABASE) {
      const rows = await serviceCategoriesTable.getByStoreId(storeId, includeInactive);
      return toServiceCategories(rows);
    }
    return serviceCategoriesDB.getAll(storeId, includeInactive);
  },
  // ... other methods
}
```

**Available Services:**
- `servicesService` - Legacy services (read-only in POS)
- `serviceCategoriesService` - Categories with search, online booking filter
- `menuServicesService` - Services with search, archive, online booking filter
- `serviceVariantsService` - Variants with default variant management
- `servicePackagesService` - Packages with search, online booking filter
- `addOnGroupsService` - Groups with applicability filters
- `addOnOptionsService` - Options with bulk loading
- `staffServiceAssignmentsService` - Assignments with staff/service queries
- `catalogSettingsService` - Settings with feature flag queries
- `productsService` - Products with search, SKU/barcode lookup
- `bookingSequencesService` - Sequences with enable/disable

### 4. Supabase Integration

**Type Adapters** (`src/services/supabase/adapters/`):
- Convert between Supabase rows (snake_case) and app types (camelCase)
- Handle JSONB fields (vector_clock)
- Example: `catalogSettingsAdapter.ts`

**Table Operations** (`src/services/supabase/tables/`):
- Direct Supabase queries with RLS policies
- Soft delete with tombstones
- Sync-aware updates
- Files:
  - `serviceCategoriesTable.ts`
  - `menuServicesTable.ts`
  - `serviceVariantsTable.ts`
  - `servicePackagesTable.ts`
  - `catalogSettingsTable.ts`

### 5. Redux Slice (DEPRECATED)

**Note:** `src/store/slices/catalogSlice.ts` is deprecated.

**Reason:**
- Eliminated Redux/Dexie sync complexity
- Dexie live queries provide automatic reactivity
- Simplified architecture (KISS principle)

**Replacement:**
- Use `useCatalog` hook from `src/hooks/useCatalog.ts` (future)
- Use `useLiveQuery` from `dexie-react-hooks` directly

---

## Data Flow

### Read Flow (Offline-First)

```
1. Component needs catalog data
   ↓
2. Calls catalogDataService.serviceCategoriesService.getAll(storeId)
   ↓
3. Service layer routes based on flags:
   - SQLite (Electron) → sqliteServiceCategoriesDB.getAll()
   - Supabase (online) → serviceCategoriesTable.getByStoreId() + adapter
   - Dexie (default) → serviceCategoriesDB.getAll()
   ↓
4. Data returned to component
   ↓
5. Dexie live queries auto-update component on changes
```

### Write Flow (with Sync)

```
1. User creates/updates service
   ↓
2. Component calls catalogDataService.menuServicesService.create()
   ↓
3. Service layer:
   - Creates entity with sync metadata (version, vectorClock, syncStatus)
   - Writes to local storage (Dexie/SQLite)
   - Sets syncStatus = 'local' (not yet synced)
   ↓
4. Background sync worker (future):
   - Detects syncStatus = 'local'
   - Pushes to Supabase
   - Updates syncStatus = 'synced'
   - Updates lastSyncedVersion
   ↓
5. Other devices receive sync
   - Pull changes from Supabase
   - Merge using vector clock conflict resolution
   - Update local storage
```

### Archive/Restore Flow

```
// Archive
menuServicesDB.archive(id, userId)
  → Sets status = 'archived'
  → Sets archivedAt = now
  → Sets archivedBy = userId
  → Keeps all data intact

// Restore
menuServicesDB.restore(id, userId)
  → Sets status = 'active'
  → Clears archivedAt and archivedBy
  → Service returns to active catalog
```

---

## Key Design Decisions

### 1. Tri-Path Storage Architecture

**Decision:** Support three storage backends with runtime routing

**Rationale:**
- **Dexie (Web)**: Best for browser-based POS terminals
- **SQLite (Electron)**: Better performance for desktop apps
- **Supabase (Online)**: Real-time sync for cloud-first salons

**Trade-offs:**
- ✅ Platform-specific optimization
- ✅ Offline-first by default
- ✅ Optional cloud sync
- ❌ Increased complexity in routing layer
- ❌ Must maintain 3 implementations

### 2. Deprecated Redux, Use Dexie Live Queries

**Decision:** Remove Redux for catalog state management

**Rationale:**
- Dexie live queries provide automatic reactivity
- Eliminates Redux/Dexie sync complexity
- Simpler architecture (KISS principle)
- No need for manual state updates

**Migration Path:**
- Old: `useAppSelector(selectCategories)` + Redux thunks
- New: `useLiveQuery(() => serviceCategoriesDB.getAll(storeId))`

### 3. Soft Delete with Archive Status

**Decision:** Three-state lifecycle: active → archived → deleted

**Rationale:**
- **Active**: Visible in catalog, bookable
- **Archived**: Hidden but recoverable (common for seasonal services)
- **Deleted**: Soft delete with tombstone (for sync)

**Fields:**
- `status`: 'active' | 'inactive' | 'archived'
- `archivedAt`, `archivedBy`: Archive metadata
- `isDeleted`, `deletedAt`, `deletedBy`: Soft delete metadata

### 4. Variants as Separate Table

**Decision:** Store variants in separate table, not embedded in service

**Rationale:**
- ✅ Efficient sync (only sync changed variants)
- ✅ Atomic updates (update one variant without touching service)
- ✅ Better indexing for queries
- ❌ Requires join queries (acceptable trade-off)

**Alternative Considered:**
- Embed variants as JSON array in MenuService
- Rejected: Would require syncing entire service on any variant change

### 5. BaseSyncableEntity Pattern

**Decision:** All entities extend `BaseSyncableEntity` with sync fields

**Required Fields:**
- `id`, `tenantId`, `storeId`, `locationId?`
- `syncStatus`, `version`, `vectorClock`, `lastSyncedVersion`
- `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy`
- `isDeleted`, `deletedAt`, `tombstoneExpiresAt`

**Rationale:**
- Consistent sync behavior across all entities
- Vector clock conflict resolution
- Multi-tenant isolation
- Audit trail
- Tombstone-based sync deletion

### 6. Fresha-Style Add-on Groups

**Decision:** Implement group + options pattern (not flat add-ons)

**Structure:**
```typescript
AddOnGroup (e.g., "Hair Length")
  ├─ AddOnOption "Short Hair" (+$10, +0min)
  ├─ AddOnOption "Medium Hair" (+$15, +10min)
  └─ AddOnOption "Long Hair" (+$25, +20min)
```

**Rationale:**
- More flexible than flat add-ons
- Supports "select one" or "select multiple" modes
- Can enforce min/max selections
- Better UX for complex service customization

**Legacy Compatibility:**
- Provide `toServiceAddOn()` converter for old flat format
- UI components can use either format

---

## Next Steps

For detailed implementation guides, see:
- [CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md) - Technical architecture deep dive
- [CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md) - Data modeling and patterns
- [CATALOG_INTEGRATION.md](./CATALOG_INTEGRATION.md) - Integration with other modules
- [CATALOG_TESTING.md](./CATALOG_TESTING.md) - Testing strategy and examples

---

**Last Updated:** 2026-01-22
**Module Status:** ✅ Phase 6 Complete - Comprehensive Review Completed
