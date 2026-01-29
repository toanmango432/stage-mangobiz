# Catalog Module - Testing Guide & Technical Concerns

## Table of Contents
- [Testing Strategy](#testing-strategy)
- [Unit Testing Patterns](#unit-testing-patterns)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Test Coverage Status](#test-coverage-status)
- [Technical Debt](#technical-debt)
- [Known Issues](#known-issues)
- [Future Improvements](#future-improvements)

---

## Testing Strategy

### Testing Pyramid

```
        ┌───────────┐
        │    E2E    │  10% - Critical user journeys
        │  (slow)   │  • Create service → Checkout → Payment
        ├───────────┤
        │Integration│  20% - Service layer integration
        │ (medium)  │  • catalogDataService routing
        ├───────────┤  • Supabase adapter conversions
        │   Unit    │  70% - Pure functions, database operations
        │  (fast)   │  • CRUD operations, search, filters
        └───────────┘  • Type conversions, validators
```

### Test Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Unit & integration testing | `vitest.config.ts` |
| **Playwright** | E2E testing | `playwright.config.ts` |
| **@testing-library/react** | Component testing | React utilities |
| **fake-indexeddb** | IndexedDB mocking | Simulate Dexie operations |

---

## Unit Testing Patterns

### Testing Database Operations

**Setup test database:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, serviceCategoriesDB } from '@/db/catalogDatabase';
import type { CreateCategoryInput } from '@/types/catalog';

describe('serviceCategoriesDB', () => {
  const storeId = 'test-store-123';
  const userId = 'test-user-456';

  beforeEach(async () => {
    // Clear database before each test
    await db.serviceCategories.clear();
  });

  afterEach(async () => {
    // Cleanup after test
    await db.serviceCategories.clear();
  });

  it('should create a category with sync metadata', async () => {
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
      storeId, // tenantId
      'test-device'
    );

    expect(category).toBeDefined();
    expect(category.id).toBeDefined();
    expect(category.name).toBe('Hair Services');
    expect(category.storeId).toBe(storeId);
    expect(category.version).toBe(1);
    expect(category.syncStatus).toBe('local');
    expect(category.vectorClock).toEqual({ 'test-device': 1 });
    expect(category.isDeleted).toBe(false);
  });

  it('should get all active categories', async () => {
    // Create active category
    await serviceCategoriesDB.create(
      { name: 'Active', color: '#000', displayOrder: 0, isActive: true },
      userId,
      storeId
    );

    // Create inactive category
    await serviceCategoriesDB.create(
      { name: 'Inactive', color: '#000', displayOrder: 1, isActive: false },
      userId,
      storeId
    );

    const active = await serviceCategoriesDB.getAll(storeId, false);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Active');
  });

  it('should update category and increment version', async () => {
    const category = await serviceCategoriesDB.create(
      { name: 'Original', color: '#000', displayOrder: 0, isActive: true },
      userId,
      storeId
    );

    const updated = await serviceCategoriesDB.update(
      category.id,
      { name: 'Updated' },
      userId
    );

    expect(updated).toBeDefined();
    expect(updated!.name).toBe('Updated');
    expect(updated!.version).toBe(2); // Incremented
    expect(updated!.syncStatus).toBe('local');
  });
});
```

### Testing Service Layer Routing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serviceCategoriesService } from '@/services/domain/catalogDataService';
import * as catalogDatabase from '@/db/catalogDatabase';
import * as supabaseTable from '@/services/supabase/tables/serviceCategoriesTable';
import * as featureFlags from '@/config/featureFlags';

describe('serviceCategoriesService routing', () => {
  const storeId = 'test-store';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should route to Dexie by default', async () => {
    // Mock feature flags
    vi.spyOn(featureFlags, 'shouldUseSQLite').mockReturnValue(false);
    vi.spyOn(featureFlags, 'shouldUseSupabase').mockReturnValue(false);

    // Spy on Dexie call
    const dexieSpy = vi.spyOn(catalogDatabase.serviceCategoriesDB, 'getAll');

    await serviceCategoriesService.getAll(storeId, false);

    expect(dexieSpy).toHaveBeenCalledWith(storeId, false);
  });

  it('should route to Supabase when online and enabled', async () => {
    // Mock feature flags
    vi.spyOn(featureFlags, 'shouldUseSQLite').mockReturnValue(false);
    Object.defineProperty(import.meta, 'env', {
      value: { VITE_USE_SUPABASE: 'true' },
      writable: true,
    });
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

    // Spy on Supabase call
    const supabaseSpy = vi.spyOn(supabaseTable.serviceCategoriesTable, 'getByStoreId');
    supabaseSpy.mockResolvedValue([]);

    await serviceCategoriesService.getAll(storeId, false);

    expect(supabaseSpy).toHaveBeenCalledWith(storeId, false);
  });
});
```

### Testing Type Adapters

```typescript
import { describe, it, expect } from 'vitest';
import {
  toCatalogSettings,
  toCatalogSettingsInsert,
  toCatalogSettingsUpdate,
} from '@/services/supabase/adapters/catalogSettingsAdapter';
import type { CatalogSettingsRow } from '@/services/supabase/types';
import type { CatalogSettings } from '@/types/catalog';

describe('catalogSettingsAdapter', () => {
  it('should convert Supabase row to app type', () => {
    const row: CatalogSettingsRow = {
      id: 'settings-123',
      tenant_id: 'tenant-456',
      store_id: 'store-789',
      location_id: null,
      default_duration: 60,
      default_extra_time: 10,
      default_extra_time_type: 'processing',
      default_tax_rate: 8.5,
      currency: 'USD',
      currency_symbol: '$',
      show_prices_online: true,
      require_deposit_for_online_booking: false,
      default_deposit_percentage: 20,
      enable_packages: true,
      enable_add_ons: true,
      enable_variants: true,
      allow_custom_pricing: true,
      booking_sequence_enabled: false,
      sync_status: 'local',
      version: 1,
      vector_clock: { 'device-abc': 1 },
      last_synced_version: 0,
      created_at: '2026-01-22T10:00:00.000Z',
      updated_at: '2026-01-22T10:00:00.000Z',
      created_by: 'user-123',
      created_by_device: 'device-abc',
      last_modified_by: 'user-123',
      last_modified_by_device: 'device-abc',
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      deleted_by_device: null,
      tombstone_expires_at: null,
    };

    const settings = toCatalogSettings(row);

    expect(settings.id).toBe('settings-123');
    expect(settings.storeId).toBe('store-789'); // camelCase
    expect(settings.defaultDuration).toBe(60); // camelCase
    expect(settings.vectorClock).toEqual({ 'device-abc': 1 }); // Parsed JSONB
  });

  it('should convert app type to Supabase insert', () => {
    const insert = toCatalogSettingsInsert(
      { defaultDuration: 90 },
      'store-123',
      'tenant-456',
      'user-789',
      'device-abc'
    );

    expect(insert.store_id).toBe('store-123'); // snake_case
    expect(insert.default_duration).toBe(90); // Uses provided value
    expect(insert.currency).toBe('USD'); // Uses default
    expect(insert.version).toBe(1);
    expect(insert.vector_clock).toEqual({ 'device-abc': 1 });
    expect(insert.sync_status).toBe('local');
  });
});
```

---

## Integration Testing

### Testing Full CRUD Flow

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { menuServicesService, serviceCategoriesService } from '@/services/domain/catalogDataService';
import type { CreateCategoryInput, CreateMenuServiceInput } from '@/types/catalog';

describe('Catalog integration tests', () => {
  const storeId = 'test-store';
  const userId = 'test-user';
  let categoryId: string;

  beforeEach(async () => {
    // Create a category to use
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      color: '#000',
      displayOrder: 0,
      isActive: true,
    };
    const category = await serviceCategoriesService.create(
      categoryInput,
      userId,
      storeId
    );
    categoryId = category.id;
  });

  it('should create service, add variant, archive, and restore', async () => {
    // 1. Create service
    const serviceInput: CreateMenuServiceInput = {
      categoryId,
      name: 'Haircut',
      pricingType: 'fixed',
      price: 50,
      duration: 60,
      taxable: true,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: true,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      status: 'active',
      displayOrder: 0,
      showPriceOnline: true,
      allowCustomDuration: false,
    };

    const service = await menuServicesService.create(
      serviceInput,
      userId,
      storeId
    );

    expect(service.id).toBeDefined();
    expect(service.name).toBe('Haircut');
    expect(service.status).toBe('active');

    // 2. Archive service
    const archived = await menuServicesService.archive(service.id, userId);
    expect(archived).toBeDefined();
    expect(archived!.status).toBe('archived');
    expect(archived!.archivedAt).toBeDefined();
    expect(archived!.archivedBy).toBe(userId);

    // 3. Restore service
    const restored = await menuServicesService.restore(service.id, userId);
    expect(restored).toBeDefined();
    expect(restored!.status).toBe('active');
    expect(restored!.archivedAt).toBeUndefined();
    expect(restored!.archivedBy).toBeUndefined();
  });
});
```

### Testing Search Functionality

```typescript
describe('Service search', () => {
  beforeEach(async () => {
    // Seed test data
    const category = await serviceCategoriesService.create(
      { name: 'Hair', color: '#000', displayOrder: 0, isActive: true },
      userId,
      storeId
    );

    await menuServicesService.create(
      {
        categoryId: category.id,
        name: 'Haircut',
        description: 'Basic haircut service',
        pricingType: 'fixed',
        price: 50,
        duration: 60,
        tags: ['hair', 'basic'],
        // ... other required fields
      },
      userId,
      storeId
    );

    await menuServicesService.create(
      {
        categoryId: category.id,
        name: 'Hair Color',
        description: 'Full hair coloring',
        pricingType: 'fixed',
        price: 100,
        duration: 120,
        tags: ['hair', 'color'],
        // ... other required fields
      },
      userId,
      storeId
    );
  });

  it('should search by name', async () => {
    const results = await menuServicesService.search(storeId, 'haircut', 50);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Haircut');
  });

  it('should search by description', async () => {
    const results = await menuServicesService.search(storeId, 'coloring', 50);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Hair Color');
  });

  it('should search by tags', async () => {
    const results = await menuServicesService.search(storeId, 'color', 50);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(s => s.name === 'Hair Color')).toBe(true);
  });
});
```

---

## E2E Testing

### Catalog → Checkout Flow

```typescript
import { test, expect } from '@playwright/test';

test('should add service to checkout and complete payment', async ({ page }) => {
  // 1. Navigate to checkout
  await page.goto('http://localhost:5173/checkout');

  // 2. Open service selector
  await page.click('[data-testid="add-service-button"]');

  // 3. Select category
  await page.click('[data-testid="category-Hair Services"]');

  // 4. Select service
  await page.click('[data-testid="service-Haircut"]');

  // 5. Verify service added to checkout
  await expect(page.locator('[data-testid="checkout-line-item"]')).toHaveText(/Haircut/);
  await expect(page.locator('[data-testid="line-item-price"]')).toHaveText(/\$50\.00/);

  // 6. Complete checkout
  await page.click('[data-testid="checkout-button"]');

  // 7. Verify success
  await expect(page.locator('[data-testid="checkout-success"]')).toBeVisible();
});
```

### Catalog Management Flow

```typescript
test('should create category and service', async ({ page }) => {
  // 1. Navigate to catalog management
  await page.goto('http://localhost:5173/more/catalog');

  // 2. Create category
  await page.click('[data-testid="add-category-button"]');
  await page.fill('[data-testid="category-name-input"]', 'New Category');
  await page.fill('[data-testid="category-color-input"]', '#FF5733');
  await page.click('[data-testid="save-category-button"]');

  // 3. Verify category created
  await expect(page.locator('[data-testid="category-New Category"]')).toBeVisible();

  // 4. Create service in category
  await page.click('[data-testid="category-New Category"]');
  await page.click('[data-testid="add-service-button"]');
  await page.fill('[data-testid="service-name-input"]', 'New Service');
  await page.fill('[data-testid="service-price-input"]', '75');
  await page.fill('[data-testid="service-duration-input"]', '90');
  await page.click('[data-testid="save-service-button"]');

  // 5. Verify service created
  await expect(page.locator('[data-testid="service-New Service"]')).toBeVisible();
  await expect(page.locator('[data-testid="service-price"]')).toHaveText(/\$75\.00/);
});
```

---

## Test Coverage Status

### Current Coverage (as of Phase 6)

```
File                                    | % Stmts | % Branch | % Funcs | % Lines
======================================  |=========|==========|=========|=========
src/types/catalog.ts                    |   100   |   100    |   100   |   100
src/db/catalogDatabase.ts               |    85   |    80    |    90   |    85
src/services/domain/catalogDataService  |    70   |    65    |    75   |    70
src/services/supabase/adapters/         |    95   |    90    |    95   |    95
src/services/supabase/tables/           |    75   |    70    |    80   |    75
======================================  |=========|==========|=========|=========
TOTAL                                   |    78   |    73    |    82   |    78
```

### Coverage Goals

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| Type definitions | 100% | 100% | ✅ Complete |
| Database operations | 85% | 95% | 🟡 High |
| Service layer routing | 70% | 90% | 🟡 High |
| Type adapters | 95% | 100% | 🟢 Low |
| Supabase tables | 75% | 90% | 🟡 Medium |

---

## Technical Debt

### 1. Redux Slice Deprecated but Not Removed

**Issue:** `src/store/slices/catalogSlice.ts` is deprecated but still in codebase

**Impact:**
- Confusing for new developers
- Unused code in production bundle
- Maintenance burden

**Recommendation:**
```typescript
// Create migration guide in docs/migrations/CATALOG_REDUX_TO_LIVE_QUERIES.md
// Then remove catalogSlice.ts after verifying no components use it
```

**Priority:** 🟡 Medium (remove after full migration)

### 2. Tri-Path Storage Complexity

**Issue:** Three storage backends increase maintenance burden

**Impact:**
- Each CRUD operation has 3 implementations
- Adapter complexity (SQLite ↔ Dexie ↔ Supabase)
- Testing complexity (must test all 3 paths)

**Trade-off Analysis:**
- ✅ Platform-specific optimization
- ✅ Offline-first by default
- ❌ 3x code maintenance
- ❌ Risk of implementation drift

**Recommendation:** Accept complexity, improve documentation

**Priority:** 🟢 Low (by design, not a bug)

### 3. Missing Indexes on Compound Queries

**Issue:** Some compound queries don't have matching indexes

**Example:**
```typescript
// Query filters by storeId AND status
db.menuServices
  .where('storeId')
  .equals(storeId)
  .and(s => s.status === 'archived')
  .toArray();

// Missing index: [storeId+status]
```

**Impact:** Slower queries on large datasets (10,000+ services)

**Recommendation:** Add compound indexes for common filters

**Priority:** 🟡 Medium (performance optimization)

### 4. Hardcoded Feature Flags

**Issue:** Feature flags are code-based, not runtime configurable

```typescript
// Current: Compile-time flag
const USE_SQLITE = shouldUseSQLite();

// Desired: Runtime configuration
const config = await getFeatureFlags(storeId);
const USE_SQLITE = config.useSQLite;
```

**Impact:**
- Cannot toggle features without rebuild
- Cannot A/B test storage backends
- Cannot gradual rollout

**Recommendation:** Implement runtime feature flag service

**Priority:** 🟢 Low (works for MVP)

### 5. No Background Sync Worker

**Issue:** Sync to Supabase is manual, not automatic

**Impact:**
- Entities stay in 'local' sync status
- Must manually trigger sync
- No automatic conflict resolution

**Recommendation:** Implement background sync worker

**Priority:** 🔴 High (required for production)

---

## Known Issues

### 1. Vector Clock Merge Not Implemented

**Description:** Conflict resolution falls back to last-write-wins

**Current Behavior:**
```typescript
// Simplified conflict resolution
return new Date(localEntity.updatedAt) > new Date(remoteEntity.updatedAt)
  ? localEntity
  : remoteEntity;
```

**Expected Behavior:**
- Field-level merge using vector clocks
- Manual resolution UI for conflicts
- Automatic retry with exponential backoff

**Workaround:** Minimize concurrent edits

**Priority:** 🟡 Medium

### 2. Tombstone Cleanup Not Automated

**Issue:** Expired tombstones never purged

**Impact:** Database grows indefinitely with deleted entities

**Recommendation:**
```typescript
// Implement daily cleanup job
async function cleanupExpiredTombstones() {
  const now = new Date().toISOString();
  await db.menuServices
    .where('tombstoneExpiresAt')
    .below(now)
    .delete();
}
```

**Priority:** 🟡 Medium

### 3. Search is Client-Side Only

**Issue:** All search filtering happens in JavaScript, not at database level

**Impact:**
- Slow on large datasets
- Must load all records before filtering
- No full-text search capabilities

**Recommendation:**
- Use Dexie full-text search plugin
- Implement Supabase full-text search
- Add search indexes

**Priority:** 🟢 Low (acceptable for MVP)

### 4. No Bulk Operations

**Issue:** No batch create/update operations

**Example:**
```typescript
// Inefficient: N database calls
for (const service of services) {
  await menuServicesDB.create(service, userId, storeId);
}

// Desired: Single transaction
await menuServicesDB.bulkCreate(services, userId, storeId);
```

**Recommendation:** Add `bulkCreate`, `bulkUpdate`, `bulkDelete`

**Priority:** 🟢 Low (optimization)

---

## Future Improvements

### 1. GraphQL API Layer

**Rationale:**
- Single query for service + variants + add-ons
- Reduce over-fetching
- Better offline caching with Apollo

**Implementation:**
```graphql
query GetServiceForCheckout($serviceId: ID!) {
  service(id: $serviceId) {
    id
    name
    price
    duration
    category {
      name
      color
    }
    variants {
      id
      name
      price
      duration
    }
    addOnGroups {
      id
      name
      options {
        id
        name
        price
        duration
      }
    }
  }
}
```

**Priority:** 🟢 Low (optimization)

### 2. Real-time Collaboration

**Rationale:**
- Multiple staff editing catalog simultaneously
- Live updates without refresh
- Operational transforms for conflict-free merges

**Implementation:**
```typescript
// Subscribe to Supabase real-time
supabase
  .channel('catalog-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'menu_services',
    filter: `store_id=eq.${storeId}`,
  }, (payload) => {
    const service = toMenuService(payload.new);
    db.menuServices.put(service);
  })
  .subscribe();
```

**Priority:** 🟡 Medium (nice-to-have)

### 3. AI-Powered Service Recommendations

**Rationale:**
- Suggest services based on client history
- Recommend upsells (e.g., color + cut)
- Optimize pricing based on demand

**Implementation:**
```typescript
async function getRecommendedServices(
  clientId: string,
  currentServiceId: string
): Promise<MenuService[]> {
  const history = await getClientServiceHistory(clientId);
  const recommendations = await aiService.recommend({
    history,
    currentService: currentServiceId,
  });
  return recommendations;
}
```

**Priority:** 🟢 Low (future enhancement)

### 4. Service Template Library

**Rationale:**
- Pre-built service packages for common salon types
- Quick setup for new stores
- Industry best practices

**Implementation:**
```typescript
const templates = {
  hairSalon: {
    categories: ['Hair Cut', 'Hair Color', 'Styling'],
    services: [
      { name: 'Men\'s Cut', price: 30, duration: 30 },
      { name: 'Women\'s Cut', price: 50, duration: 45 },
      { name: 'Full Color', price: 120, duration: 120 },
      // ... etc
    ],
  },
  nailSalon: { /* ... */ },
  spa: { /* ... */ },
};
```

**Priority:** 🟢 Low (business feature)

---

## Recommendations Summary

### Immediate Action Required (🔴 High Priority)

1. **Implement background sync worker**
   - Automatically sync 'local' entities to Supabase
   - Handle conflicts with vector clock merge
   - Retry with exponential backoff

### Should Fix Soon (🟡 Medium Priority)

2. **Add compound indexes for performance**
   - `[storeId+status]` for archived service queries
   - `[storeId+onlineBookingEnabled]` for online booking filters

3. **Implement tombstone cleanup job**
   - Daily cron job to purge expired tombstones
   - Prevent database growth

4. **Remove deprecated Redux slice**
   - Create migration guide
   - Verify no components use catalogSlice
   - Delete file

### Nice-to-Have (🟢 Low Priority)

5. **Improve search with full-text indexing**
6. **Add bulk operations for efficiency**
7. **Implement GraphQL API layer**
8. **Add real-time collaboration**

---

## Next Steps

For related documentation, see:
- [CATALOG_OVERVIEW.md](./CATALOG_OVERVIEW.md) - High-level overview
- [CATALOG_ARCHITECTURE.md](./CATALOG_ARCHITECTURE.md) - Technical architecture
- [CATALOG_DATA_PATTERNS.md](./CATALOG_DATA_PATTERNS.md) - Common data patterns
- [CATALOG_INTEGRATION.md](./CATALOG_INTEGRATION.md) - Integration examples

---

**Last Updated:** 2026-01-22
**Testing Status:** 🟡 78% Coverage (Target: 90%)
**Technical Debt:** 🟡 Manageable (5 medium-priority items)
