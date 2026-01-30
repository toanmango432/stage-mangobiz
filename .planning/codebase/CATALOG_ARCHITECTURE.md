# Catalog Module - Technical Architecture

## Table of Contents
- [Storage Layer Architecture](#storage-layer-architecture)
- [Sync Architecture](#sync-architecture)
- [Type System Architecture](#type-system-architecture)
- [Service Layer Patterns](#service-layer-patterns)
- [Performance Considerations](#performance-considerations)
- [Security & Multi-Tenancy](#security--multi-tenancy)

---

## Storage Layer Architecture

### IndexedDB Schema (Dexie)

**Database Name:** `MangoPOSDB`

**Catalog Tables:**

```typescript
// src/db/schema.ts
class MangoPOSDatabase extends Dexie {
  // Service Categories
  serviceCategories!: Table<ServiceCategory>;
  // Index: 'storeId, displayOrder, [storeId+displayOrder]'

  // Menu Services
  menuServices!: Table<MenuService>;
  // Index: 'storeId, categoryId, [storeId+categoryId], displayOrder, status'

  // Service Variants
  serviceVariants!: Table<ServiceVariant>;
  // Index: 'serviceId, [serviceId+displayOrder], isDefault'

  // Service Packages
  servicePackages!: Table<ServicePackage>;
  // Index: 'storeId, displayOrder, isActive'

  // Add-on Groups
  addOnGroups!: Table<AddOnGroup>;
  // Index: 'storeId, displayOrder, isActive'

  // Add-on Options
  addOnOptions!: Table<AddOnOption>;
  // Index: 'groupId, [groupId+displayOrder], isActive'

  // Staff Service Assignments
  staffServiceAssignments!: Table<StaffServiceAssignment>;
  // Index: 'staffId, serviceId, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]'

  // Catalog Settings
  catalogSettings!: Table<CatalogSettings>;
  // Index: 'storeId'

  // Products (Retail)
  products!: Table<Product>;
  // Index: 'storeId, [storeId+category], [storeId+sku], [storeId+isRetail], barcode'

  // Booking Sequences
  bookingSequences!: Table<BookingSequence>;
  // Index: 'storeId, isEnabled'
}
```

### Compound Index Strategy

**Why compound indexes?**
- Faster queries on storeId + another field
- Multi-tenant isolation at query level
- Prevents expensive full-table scans

**Examples:**
```typescript
// Get services by category (single query using compound index)
db.menuServices
  .where('[storeId+categoryId]')
  .equals([storeId, categoryId])
  .toArray();

// Get staff assignments for a staff member (compound index)
db.staffServiceAssignments
  .where('[storeId+staffId]')
  .equals([storeId, staffId])
  .toArray();
```

### SQLite Schema (Electron)

**Location:** `~/.mango-pos/store-app.db` (or platform-specific app data)

**Schema matches Dexie** for consistency:
- Same table names (snake_case)
- Same indexes
- Same data types
- JSON columns for vectorClock

**Advantages over IndexedDB:**
- Faster for large datasets (10,000+ services)
- Native file-based storage
- Better transaction performance
- SQL query capabilities

### Supabase Schema

**PostgreSQL tables** with Row-Level Security (RLS):

```sql
-- service_categories
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  location_id UUID REFERENCES locations(id),

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_category_id UUID REFERENCES service_categories(id),
  show_online_booking BOOLEAN DEFAULT false,

  -- Sync metadata
  sync_status TEXT NOT NULL DEFAULT 'local',
  version INTEGER NOT NULL DEFAULT 1,
  vector_clock JSONB NOT NULL DEFAULT '{}',
  last_synced_version INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit trail
  created_by TEXT,
  created_by_device TEXT,
  last_modified_by TEXT,
  last_modified_by_device TEXT,

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  deleted_by_device TEXT,
  tombstone_expires_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_categories_select_policy"
  ON service_categories FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE tenant_id = current_tenant_id())
  );

CREATE POLICY "service_categories_insert_policy"
  ON service_categories FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE tenant_id = current_tenant_id())
  );

-- Similar structure for:
-- - menu_services
-- - service_variants
-- - service_packages
-- - add_on_groups
-- - add_on_options
-- - staff_service_assignments
-- - catalog_settings
-- - products
-- - booking_sequences
```

---

## Sync Architecture

### Vector Clock Conflict Resolution

**Problem:** Two devices edit the same service offline. How to merge?

**Solution:** Vector clocks track version per device

```typescript
interface BaseSyncableEntity {
  version: number;                    // Overall version
  vectorClock: VectorClock;           // { [deviceId]: version }
  lastSyncedVersion: number;          // Last synced to cloud
  syncStatus: 'local' | 'synced';     // Sync state
}

type VectorClock = Record<string, number>; // { "device-A": 5, "device-B": 3 }
```

**Example Scenario:**

```
Initial state:
  version: 5
  vectorClock: { "device-A": 3, "device-B": 2 }

Device A modifies (offline):
  version: 6
  vectorClock: { "device-A": 4, "device-B": 2 }
  syncStatus: 'local'

Device B modifies (offline):
  version: 6
  vectorClock: { "device-A": 3, "device-B": 3 }
  syncStatus: 'local'

Conflict detection:
  - Neither vectorClock is strictly greater (conflict!)
  - Merge required

Resolution strategies:
  1. Last-write-wins (by updatedAt)
  2. Manual resolution UI
  3. Field-level merge
```

### Sync States

```typescript
type SyncStatus = 'local' | 'synced';

// Entity lifecycle:
'local'  → Pending sync to cloud
'synced' → Successfully synced
```

### Tombstone Deletion

**Problem:** How to sync deletions? Can't sync something that doesn't exist.

**Solution:** Soft delete with tombstone expiry

```typescript
// Delete a service
service.isDeleted = true;
service.deletedAt = new Date().toISOString();
service.deletedBy = userId;
service.tombstoneExpiresAt = addDays(new Date(), 30).toISOString();

// Sync process:
// 1. Sync tombstone to other devices
// 2. Other devices mark as deleted locally
// 3. After 30 days, permanently purge tombstone
```

---

## Type System Architecture

### BaseSyncableEntity Pattern

**All catalog entities extend this:**

```typescript
export interface BaseSyncableEntity {
  // Primary key
  id: string; // UUID v4

  // Multi-tenant isolation
  tenantId: string;
  storeId: string;
  locationId?: string;

  // Sync metadata
  syncStatus: SyncStatus;
  version: number;
  vectorClock: VectorClock;
  lastSyncedVersion: number;

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Audit trail
  createdBy: string;
  createdByDevice: string;
  lastModifiedBy: string;
  lastModifiedByDevice: string;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
  tombstoneExpiresAt?: string;
}
```

### Input Types Pattern

**Create inputs omit auto-generated fields:**

```typescript
export type CreateCategoryInput = Omit<ServiceCategory,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;
```

**Usage:**
```typescript
const input: CreateCategoryInput = {
  name: 'Hair Services',
  description: 'All hair-related services',
  color: '#FF5733',
  displayOrder: 0,
  isActive: true,
  showOnlineBooking: true,
};

const category = await serviceCategoriesDB.create(
  input,
  userId,
  storeId,
  tenantId,
  deviceId
);
// Returns: ServiceCategory with all auto-generated fields
```

### Aggregate Types

**UI convenience types:**

```typescript
// Service with pre-loaded variants
export interface ServiceWithVariants extends MenuService {
  variants: ServiceVariant[];
}

// Category with service counts
export interface CategoryWithCount extends ServiceCategory {
  servicesCount: number;
  activeServicesCount: number;
}

// Add-on group with options
export interface AddOnGroupWithOptions extends AddOnGroup {
  options: AddOnOption[];
}
```

---

## Service Layer Patterns

### Routing Pattern

**All services follow this pattern:**

```typescript
export const entityService = {
  async operationName(params): Promise<ReturnType> {
    // 1. SQLite path (Electron)
    if (USE_SQLITE) {
      const result = await sqliteEntityDB.operation(params);
      return result as ReturnType;
    }

    // 2. Supabase path (online-only devices with opt-in)
    if (USE_SUPABASE) {
      const rows = await entityTable.operation(params);
      return toEntities(rows); // Adapter
    }

    // 3. Dexie path (default local-first)
    return entityDB.operation(params);
  }
}
```

### Feature Flag Checks

```typescript
// src/config/featureFlags.ts
export function shouldUseSQLite(): boolean {
  // Check if running in Electron
  return typeof window !== 'undefined' &&
         window.electron !== undefined;
}

// src/services/domain/catalogDataService.ts
function shouldUseSupabase(): boolean {
  if (USE_SQLITE) return false;
  if (import.meta.env.VITE_USE_SUPABASE !== 'true') return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  return true;
}
```

### Context Helpers

**Get current context from Redux:**

```typescript
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

function getTenantId(): string {
  const state = store.getState();
  return state.auth.store?.tenantId || state.auth.storeId || '';
}

function getUserId(): string {
  const state = store.getState();
  return state.auth.user?.id || state.auth.member?.memberId || '';
}

function getDeviceId(): string {
  if (typeof localStorage !== 'undefined') {
    let deviceId = localStorage.getItem('mango:deviceId');
    if (!deviceId) {
      deviceId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('mango:deviceId', deviceId);
    }
    return deviceId;
  }
  return 'web-client';
}
```

---

## Performance Considerations

### Query Optimization

**Use compound indexes:**
```typescript
// BAD: Two separate queries
const allServices = await db.menuServices.where('storeId').equals(storeId).toArray();
const categoryServices = allServices.filter(s => s.categoryId === categoryId);

// GOOD: Single query with compound index
const categoryServices = await db.menuServices
  .where('[storeId+categoryId]')
  .equals([storeId, categoryId])
  .toArray();
```

**Limit results:**
```typescript
// Search with limit
async search(storeId: string, query: string, limit = 50): Promise<MenuService[]> {
  const lowerQuery = query.toLowerCase();
  return await db.menuServices
    .where('storeId')
    .equals(storeId)
    .and(service => service.name.toLowerCase().includes(lowerQuery))
    .limit(limit) // Important for large datasets
    .toArray();
}
```

### Batch Operations

**Update multiple items in transaction:**
```typescript
async reorder(storeId: string, orderedIds: string[], userId: string): Promise<void> {
  await db.transaction('rw', db.serviceCategories, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.serviceCategories.update(orderedIds[i], {
        displayOrder: i,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: userId,
        syncStatus: 'local',
      });
    }
  });
}
```

### Caching Strategy

**Dexie live queries provide automatic caching:**
```typescript
// Component auto-updates when data changes
const categories = useLiveQuery(
  () => serviceCategoriesDB.getAll(storeId),
  [storeId]
);
```

---

## Security & Multi-Tenancy

### Row-Level Security (RLS)

**Supabase enforces tenant isolation:**

```sql
-- Users can only see their own tenant's data
CREATE POLICY "tenant_isolation_policy"
  ON service_categories FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores
      WHERE tenant_id = current_tenant_id()
    )
  );

-- Function to get current tenant from JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenantId',
    current_setting('request.jwt.claims', true)::json->>'tenant_id'
  )::UUID;
$$ LANGUAGE SQL STABLE;
```

### Client-Side Isolation

**Always filter by storeId:**
```typescript
// BAD: No isolation
const categories = await db.serviceCategories.toArray();

// GOOD: Filtered by storeId
const categories = await db.serviceCategories
  .where('storeId')
  .equals(storeId)
  .toArray();
```

### Audit Trail

**Track who changed what:**
```typescript
const updated = {
  ...entity,
  ...updates,
  updatedAt: new Date().toISOString(),
  lastModifiedBy: userId,
  lastModifiedByDevice: deviceId,
  version: entity.version + 1,
  vectorClock: {
    ...entity.vectorClock,
    [deviceId]: entity.version + 1,
  },
  syncStatus: 'local',
};
```

---

## Next Steps

For related documentation, see:
- [CATALOG_OVERVIEW.md](./CATALOG_OVERVIEW.md) - High-level overview
- [CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md) - Common data patterns
- [CATALOG_INTEGRATION.md](./CATALOG_INTEGRATION.md) - Integration examples
- [CATALOG_TESTING.md](./CATALOG_TESTING.md) - Testing guide

---

**Last Updated:** 2026-01-22
**Architecture Status:** ✅ Production-Ready
