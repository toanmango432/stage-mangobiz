# Catalog Module - Data Patterns & Code Examples

## Table of Contents
- [CRUD Patterns](#crud-patterns)
- [Search & Filter Patterns](#search--filter-patterns)
- [Relationships & Joins](#relationships--joins)
- [Archive & Restore Patterns](#archive--restore-patterns)
- [Sync Patterns](#sync-patterns)
- [Common Queries](#common-queries)
- [Error Handling](#error-handling)

---

## CRUD Patterns

### Create Entity

**Pattern:** Use service layer, auto-generates sync fields

```typescript
import { serviceCategoriesService } from '@/services/domain/catalogDataService';
import type { CreateCategoryInput } from '@/types/catalog';

// 1. Define input (omits auto-generated fields)
const input: CreateCategoryInput = {
  name: 'Hair Services',
  description: 'All hair styling and coloring services',
  color: '#FF5733',
  icon: 'scissors',
  displayOrder: 0,
  isActive: true,
  showOnlineBooking: true,
};

// 2. Get context
const storeId = getStoreId();
const userId = getUserId();
const tenantId = getTenantId();
const deviceId = getDeviceId();

// 3. Create via service (routes to correct storage)
const category = await serviceCategoriesService.create(
  input,
  userId,
  storeId,
  tenantId,
  deviceId
);

// Result includes all auto-generated fields:
// {
//   id: 'uuid-v4',
//   tenantId: 'tenant-123',
//   storeId: 'store-456',
//   locationId: undefined,
//   name: 'Hair Services',
//   ...
//   version: 1,
//   vectorClock: { 'device-abc': 1 },
//   syncStatus: 'local',
//   createdAt: '2026-01-22T10:00:00.000Z',
//   updatedAt: '2026-01-22T10:00:00.000Z',
//   createdBy: 'user-789',
//   createdByDevice: 'device-abc',
//   isDeleted: false,
// }
```

### Read Entity

**By ID:**
```typescript
const category = await serviceCategoriesService.getById(categoryId);
if (!category) {
  throw new Error('Category not found');
}
```

**All for store:**
```typescript
// Active only
const activeCategories = await serviceCategoriesService.getAll(storeId, false);

// Include inactive
const allCategories = await serviceCategoriesService.getAll(storeId, true);
```

**With related data:**
```typescript
// Categories with service counts
const categoriesWithCounts = await serviceCategoriesDB.getWithCounts(storeId, false);

// Service with variants
const service = await menuServicesDB.getWithVariants(serviceId);
// Result: { ...service, variants: ServiceVariant[] }

// Add-on group with options
const group = await addOnGroupsDB.getWithOptions(groupId);
// Result: { ...group, options: AddOnOption[] }
```

### Update Entity

**Partial update pattern:**
```typescript
const updates: Partial<MenuService> = {
  price: 65.00,
  duration: 90,
};

const updated = await menuServicesService.update(
  serviceId,
  updates,
  userId,
  deviceId
);

if (!updated) {
  throw new Error('Service not found');
}

// Updated entity includes:
// - New price and duration
// - Incremented version
// - Updated vectorClock
// - Updated updatedAt timestamp
// - Updated lastModifiedBy and lastModifiedByDevice
// - syncStatus set to 'local'
```

### Delete Entity

**Soft delete (tombstone):**
```typescript
await menuServicesService.delete(serviceId, userId, deviceId);

// Result in database:
// - isDeleted = true
// - deletedAt = now
// - deletedBy = userId
// - deletedByDevice = deviceId
// - tombstoneExpiresAt = now + 30 days
// - Entity still in database (for sync)
// - Will be permanently purged after expiry
```

**Hard delete (Dexie only):**
```typescript
await productsDB.hardDelete(productId);
// Immediately removes from IndexedDB
// Use with caution - no sync, no recovery
```

---

## Search & Filter Patterns

### Text Search

**Services by name/description:**
```typescript
const results = await menuServicesService.search(storeId, 'haircut', 50);

// Implementation (Dexie):
async search(storeId: string, query: string, limit = 50): Promise<MenuService[]> {
  const lowerQuery = query.toLowerCase();
  return await db.menuServices
    .where('storeId')
    .equals(storeId)
    .and(service =>
      service.name.toLowerCase().includes(lowerQuery) ||
      (service.description?.toLowerCase().includes(lowerQuery) ?? false) ||
      (service.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ?? false)
    )
    .limit(limit)
    .toArray();
}
```

**Products by SKU/barcode:**
```typescript
// By SKU
const product = await productsService.getBySku(storeId, 'SKU-12345');

// By barcode
const product = await productsService.getByBarcode(storeId, '8901234567890');
```

### Filter by Status

**Active services only:**
```typescript
const activeServices = await db.menuServices
  .where('storeId')
  .equals(storeId)
  .and(s => s.status === 'active')
  .toArray();
```

**Archived services:**
```typescript
const archived = await menuServicesService.getArchivedServices(storeId);
```

**Online booking enabled:**
```typescript
const onlineServices = await menuServicesService.getOnlineBookingServices(storeId);

// Implementation filters:
// - onlineBookingEnabled = true
// - bookingAvailability = 'online' OR 'both'
```

### Filter by Category

```typescript
const categoryServices = await menuServicesService.getByCategoryId(
  storeId,
  categoryId
);
```

### Filter by Date Range (Sync)

```typescript
const since = new Date('2026-01-01T00:00:00Z');
const updatedServices = await menuServicesService.getUpdatedSince(storeId, since);

// Use case: Incremental sync
// Fetch only entities modified since last sync
```

---

## Relationships & Joins

### Service → Category

```typescript
// 1. Get service
const service = await menuServicesDB.getById(serviceId);

// 2. Get category
const category = await serviceCategoriesDB.getById(service.categoryId);

// Combined:
const serviceWithCategory = {
  ...service,
  categoryName: category?.name,
  categoryColor: category?.color,
};
```

### Service → Variants

```typescript
// Efficient: Pre-loaded variants
const service = await menuServicesDB.getWithVariants(serviceId);
// Result: ServiceWithVariants

// Manual join:
const service = await menuServicesDB.getById(serviceId);
const variants = await serviceVariantsDB.getByService(serviceId);
```

### Staff → Services (via Assignments)

```typescript
// All services a staff can perform
const assignments = await staffServiceAssignmentsService.getByStaff(
  storeId,
  staffId,
  false // excludeInactive
);

const serviceIds = assignments.map(a => a.serviceId);
const services = await Promise.all(
  serviceIds.map(id => menuServicesDB.getById(id))
);
const staffServices = services.filter(Boolean) as MenuService[];
```

### Service → Staff (who can perform)

```typescript
// Get staff IDs who can perform this service
const staffIds = await staffServiceAssignmentsService.getStaffIdsForService(serviceId);

// Implementation:
async getStaffIdsForService(serviceId: string): Promise<string[]> {
  const storeId = getStoreId();
  const assignments = await this.getByService(storeId, serviceId, false);
  return assignments.map(a => a.staffId);
}
```

### Add-on Group → Options

```typescript
// Pre-loaded options
const group = await addOnGroupsDB.getWithOptions(groupId);
// Result: AddOnGroupWithOptions { ...group, options: AddOnOption[] }

// Get all groups with options
const groups = await addOnGroupsDB.getAllWithOptions(storeId, false);
```

### Add-on Groups → Service Applicability

```typescript
// Get add-on groups applicable to a service
const applicableGroups = await addOnGroupsDB.getForService(
  storeId,
  serviceId,
  categoryId
);

// Implementation filters by:
// - group.applicableToAll = true, OR
// - serviceId in group.applicableServiceIds, OR
// - categoryId in group.applicableCategoryIds
```

---

## Archive & Restore Patterns

### Archive Service

```typescript
const archived = await menuServicesService.archive(serviceId, userId);

// Result:
// - status = 'archived'
// - archivedAt = ISO timestamp
// - archivedBy = userId
// - isDeleted = false (not deleted, just archived)
// - Service hidden from active catalog
// - Appointments referencing this service still work
```

### Restore Service

```typescript
const restored = await menuServicesService.restore(serviceId, userId);

// Result:
// - status = 'active'
// - archivedAt = undefined
// - archivedBy = undefined
// - Service returns to active catalog
```

### Restore Product

```typescript
const restored = await productsService.restore(productId, userId, deviceId);

// Result (full sync metadata update):
// - isActive = true
// - isDeleted = false
// - version incremented
// - vectorClock updated
// - updatedAt = now
// - lastModifiedBy = userId
// - syncStatus = 'local'
```

---

## Sync Patterns

### Create with Sync Defaults

```typescript
import { createBaseSyncableDefaults } from '@/types/common';
import { v4 as uuidv4 } from 'uuid';

const syncDefaults = createBaseSyncableDefaults(
  userId,
  deviceId,
  tenantId,
  storeId
);

const entity = {
  id: uuidv4(),
  ...syncDefaults,
  // Entity-specific fields
  name: 'Hair Cut',
  price: 50,
};

// syncDefaults includes:
// {
//   tenantId,
//   storeId,
//   locationId: undefined,
//   syncStatus: 'local',
//   version: 1,
//   vectorClock: { [deviceId]: 1 },
//   lastSyncedVersion: 0,
//   createdAt: ISO timestamp,
//   updatedAt: ISO timestamp,
//   createdBy: userId,
//   createdByDevice: deviceId,
//   lastModifiedBy: userId,
//   lastModifiedByDevice: deviceId,
//   isDeleted: false,
// }
```

### Update with Version Increment

```typescript
const entity = await db.menuServices.get(id);
if (!entity) return;

const newVersion = entity.version + 1;

const updated = {
  ...entity,
  ...updates,
  version: newVersion,
  vectorClock: {
    ...entity.vectorClock,
    [deviceId]: newVersion,
  },
  updatedAt: new Date().toISOString(),
  lastModifiedBy: userId,
  lastModifiedByDevice: deviceId,
  syncStatus: 'local', // Mark for sync
};

await db.menuServices.put(updated);
```

### Sync Status Transition

```typescript
// After local change
entity.syncStatus = 'local';

// Background sync worker pushes to Supabase
await supabase.from('menu_services').upsert(toMenuServiceInsert(entity));

// Mark as synced
entity.syncStatus = 'synced';
entity.lastSyncedVersion = entity.version;
await db.menuServices.put(entity);
```

---

## Common Queries

### Get All Active Services for a Category

```typescript
const services = await db.menuServices
  .where('[storeId+categoryId]')
  .equals([storeId, categoryId])
  .and(s => s.status === 'active')
  .sortBy('displayOrder');
```

### Get Services with Variants

```typescript
const servicesWithVariants = await db.menuServices
  .where('storeId')
  .equals(storeId)
  .and(s => s.hasVariants === true && s.status === 'active')
  .toArray();
```

### Get Staff Service Assignments with Custom Pricing

```typescript
const assignments = await db.staffServiceAssignments
  .where('[storeId+staffId]')
  .equals([storeId, staffId])
  .and(a => a.isActive && a.customPrice !== undefined)
  .toArray();
```

### Get Retail Products by Category

```typescript
const products = await db.products
  .where('[storeId+category]')
  .equals([storeId, categoryName])
  .and(p => p.isRetail === true && p.isActive === true)
  .toArray();
```

### Get Categories with Service Counts

```typescript
async getWithCounts(storeId: string): Promise<CategoryWithCount[]> {
  const categories = await this.getAll(storeId, false);
  const services = await db.menuServices
    .where('storeId')
    .equals(storeId)
    .toArray();

  return categories.map(cat => ({
    ...cat,
    servicesCount: services.filter(s => s.categoryId === cat.id).length,
    activeServicesCount: services.filter(
      s => s.categoryId === cat.id && s.status === 'active'
    ).length,
  }));
}
```

### Get Booking Sequences (Enabled Only)

```typescript
const sequences = await bookingSequencesService.getEnabled(storeId);

// Implementation:
async getEnabled(storeId: string): Promise<BookingSequence[]> {
  return await db.bookingSequences
    .where('storeId')
    .equals(storeId)
    .and(seq => seq.isEnabled === true)
    .toArray();
}
```

---

## Error Handling

### Not Found Pattern

```typescript
async function updateService(serviceId: string, updates: Partial<MenuService>) {
  const service = await menuServicesService.getById(serviceId);

  if (!service) {
    throw new Error(`Service not found: ${serviceId}`);
  }

  return await menuServicesService.update(serviceId, updates, userId, deviceId);
}
```

### Transaction Rollback

```typescript
try {
  await db.transaction('rw', db.menuServices, db.serviceVariants, async () => {
    // Create service
    const service = await menuServicesDB.create(serviceInput, userId, storeId);

    // Create variants
    for (const variantInput of variantInputs) {
      await serviceVariantsDB.create(
        { ...variantInput, serviceId: service.id },
        userId,
        storeId
      );
    }
  });
} catch (error) {
  console.error('Failed to create service with variants:', error);
  // Transaction automatically rolled back
  throw error;
}
```

### Validation Pattern

```typescript
async function createService(input: CreateMenuServiceInput) {
  // Validate category exists
  const category = await serviceCategoriesDB.getById(input.categoryId);
  if (!category) {
    throw new Error(`Category not found: ${input.categoryId}`);
  }

  // Validate category is active
  if (!category.isActive) {
    throw new Error('Cannot add service to inactive category');
  }

  // Validate pricing
  if (input.pricingType === 'fixed' && input.price <= 0) {
    throw new Error('Fixed pricing requires price > 0');
  }

  if (input.pricingType === 'varies' && (!input.priceMax || input.priceMax <= input.price)) {
    throw new Error('Varies pricing requires priceMax > price');
  }

  return await menuServicesDB.create(input, userId, storeId);
}
```

### Conflict Resolution

```typescript
async function resolveConflict(localEntity: MenuService, remoteEntity: MenuService) {
  // Compare vector clocks
  const localClock = localEntity.vectorClock;
  const remoteClock = remoteEntity.vectorClock;

  const localDevices = Object.keys(localClock);
  const remoteDevices = Object.keys(remoteClock);
  const allDevices = new Set([...localDevices, ...remoteDevices]);

  let localNewer = false;
  let remoteNewer = false;

  for (const device of allDevices) {
    const localVersion = localClock[device] || 0;
    const remoteVersion = remoteClock[device] || 0;

    if (localVersion > remoteVersion) localNewer = true;
    if (remoteVersion > localVersion) remoteNewer = true;
  }

  // Determine resolution
  if (localNewer && !remoteNewer) {
    return localEntity; // Local wins
  } else if (remoteNewer && !localNewer) {
    return remoteEntity; // Remote wins
  } else {
    // Conflict! Use last-write-wins
    return new Date(localEntity.updatedAt) > new Date(remoteEntity.updatedAt)
      ? localEntity
      : remoteEntity;
  }
}
```

---

## Next Steps

For related documentation, see:
- [CATALOG_OVERVIEW.md](./CATALOG_OVERVIEW.md) - High-level overview
- [CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md) - Technical architecture
- [CATALOG_INTEGRATION.md](./CATALOG_INTEGRATION.md) - Integration examples
- [CATALOG_TESTING.md](./CATALOG_TESTING.md) - Testing guide

---

**Last Updated:** 2026-01-22
**Pattern Library Status:** ✅ Comprehensive
