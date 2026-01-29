# Catalog Module Refactor Plan (Revised)

> **Status:** Ready for Review
> **Version:** 2.0
> **Created:** January 23, 2026
> **Revised:** January 26, 2026
> **Scope:** Online Store admin catalog pages only

---

## Context

### Problem Statement

The Online Store catalog admin module (`apps/online-store/src/pages/admin/catalog/`) has an inconsistent data layer. Services read from Supabase (via `catalogSyncService`) but write to localStorage. Products, Memberships, and Gift Cards use localStorage exclusively with hardcoded defaults and mock data. This makes data ephemeral — nothing persists to the database.

### Scope Boundaries

This plan covers **Online Store admin pages only**. The store-app catalog issues identified in `CATALOG_MODULE_REVIEW_2026-01-22.md` (missing sync orchestration, no caching layer, missing transaction support, large file sizes) are a **separate effort** and are not addressed here.

### Current State (Verified)

| Entity | Read Source | Write Source | Supabase Table | Issue |
|--------|-------------|--------------|----------------|-------|
| Services (list) | Supabase via `catalogSyncService.getServices()` | localStorage `"catalog_services"` | `menu_services` | Read/write mismatch — writes are lost on cache expiry |
| Services (form) | localStorage `"catalog_services"` | localStorage with `Date.now()` IDs | `menu_services` | IDs not UUIDs; simulated 500ms delay; no Supabase write |
| Products | localStorage `"catalog_products"` with 1 mock product fallback | localStorage | `products` (conflicting schemas) | Mock data; no Supabase integration |
| Memberships | localStorage `"mango-membership-plans"` with 3 defaults | localStorage via `membershipStorage` | **None — table missing** | No Supabase table exists |
| Gift Cards | localStorage `"mango-gift-card-config"` with defaults | localStorage via `giftCardStorage` | `gift_card_settings`, `gift_card_denominations` | Tables exist but unused |
| Categories | Hardcoded array (8 nail service categories) in ServiceForm | N/A | `service_categories` | Table exists but unused |
| Catalog Dashboard | Hardcoded counts (24 services, 42 products, etc.) | N/A | N/A | Static numbers, not real data |

### Existing Infrastructure (Must Not Duplicate)

| Asset | Location | Notes |
|-------|----------|-------|
| Shared catalog types | `packages/types/src/catalog.ts` (720 lines) | Comprehensive: ServiceCategory, MenuService, variants, packages, add-ons, etc. |
| Store-app data service | `apps/store-app/src/services/domain/catalogDataService.ts` (2052 lines) | 11 service objects with full CRUD — do NOT duplicate for Online Store |
| Store-app adapters | `apps/store-app/src/services/supabase/adapters/` (12 files) | snake_case → camelCase converters for all catalog entities |
| Online Store sync service | `apps/online-store/src/lib/services/catalogSyncService.ts` | Read-only Supabase sync with 5-min localStorage cache, RLS validation |
| Online Store types | `apps/online-store/src/types/catalog.ts` (177 lines) | Simplified types for customer-facing context |

### Architecture Decision

**Online Store gets its own lightweight `catalogDataService`** rather than sharing the store-app service. Rationale:

1. **Different data access patterns.** Store-app is local-first with offline sync (Dexie/SQLite). Online Store is online-only with Supabase direct access and localStorage caching.
2. **Different entity scope.** Online Store admin manages a subset (no booking sequences, no staff assignments, no catalog settings).
3. **Different type shapes.** Online Store uses simplified types (e.g., `Service` with `price` field) vs. store-app's full types (e.g., `MenuService` with sync metadata, vector clocks).
4. **Monorepo isolation.** Each app should own its data layer. Shared code goes in `packages/`.

The new service will follow the same patterns as `catalogSyncService` (Supabase + localStorage cache + RLS validation) but add write operations.

---

## Prerequisites (Must Complete First)

### Prereq 1: Resolve Products Table Schema Conflict

**Problem:** Two migrations define the `products` table with incompatible schemas:

| Aspect | Migration 017 (e-commerce) | Migration 031 (inventory) |
|--------|---------------------------|--------------------------|
| Purpose | Online Store retail catalog | POS inventory management |
| `sku` | Nullable | NOT NULL |
| Pricing | `price`, `compare_at_price` | `retail_price`, `margin` |
| Media | `images` (JSONB array), `thumbnail_url` | `image_url` (single string) |
| Inventory | `stock_quantity`, `low_stock_threshold` | `min_stock_level`, `reorder_quantity` |
| Extra | `slug`, `weight`, `dimensions`, `is_featured` | `brand`, `is_retail`, `is_backbar`, `supplier_*`, `commission_rate` |
| Sync | None | Full sync metadata (vector_clock, tombstone, audit) |

**Decision needed:** Choose one of:
- **Option A:** Merge into a single `products` table with all columns from both (superset). Add a `product_type` discriminator (`online` | `retail` | `backbar`).
- **Option B:** Keep migration 017's table for Online Store and rename migration 031's to `inventory_items` or `pos_products`.
- **Option C:** Drop migration 017's schema entirely and extend migration 031 with the missing e-commerce columns (`slug`, `images`, `is_featured`, etc.).

**This must be resolved before Phase 2 (Products) can proceed.** Phases 1 and 3 are independent and can proceed regardless.

### Prereq 2: Create Membership Plans Table

**Problem:** No `membership_plans` Supabase table exists. `membershipStorage.ts` uses localStorage exclusively.

**Action:** Create migration with schema matching the Online Store `Membership` type plus standard sync metadata columns. Required columns: `name`, `description`, `price_monthly`, `billing_cycle`, `trial_days`, `setup_fee`, `benefits` (JSONB), `auto_renewal`, `grace_period_days`, `cancellation_policy`, `pause_allowed`, `show_online`, `available_for_purchase`, `is_active`.

---

## Phase 1: Services & Categories (Supabase Read/Write)

### Goal
Services and Categories use Supabase for both read and write operations. localStorage serves only as a cache layer, not as the source of truth.

### Step 1.1: Extend `catalogSyncService` with Write Operations

Rather than creating a separate file, extend the existing `catalogSyncService.ts` to add write operations alongside the existing read + cache pattern. This keeps the Online Store's Supabase access in one place.

Add to `catalogSyncService.ts`:

```typescript
// --- Write Operations ---

async function createService(storeId: string, input: CreateServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from('menu_services')
    .insert({ ...toMenuServiceInsert(input), store_id: storeId })
    .select()
    .single();
  if (error) throw error;
  clearCache(); // Invalidate cache after write
  return toOnlineService(data);
}

async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  const { data, error } = await supabase
    .from('menu_services')
    .update(toMenuServiceUpdate(updates))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  clearCache();
  return toOnlineService(data);
}

async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from('menu_services')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  clearCache();
}
```

Also add category read operations:

```typescript
async function getCategories(storeId: string): Promise<ServiceCategory[]> {
  const cacheKey = 'catalog_categories_v1';
  const cached = getCachedData<ServiceCategory[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_deleted', false)
    .eq('show_online_booking', true)
    .order('display_order');

  if (error) throw error;
  const categories = (data || []).map(toServiceCategory);
  setCachedData(cacheKey, categories);
  return categories;
}
```

### Step 1.2: Add Type Adapters for Online Store

Create `apps/online-store/src/lib/adapters/catalogAdapters.ts` with converters between Supabase rows and Online Store types. These are intentionally separate from store-app adapters because the target types differ.

```typescript
import type { Service } from '@/types/catalog';

// Supabase → Online Store Service
export function toOnlineService(row: Record<string, unknown>): Service { /* ... */ }

// Online Store Service → Supabase insert
export function toMenuServiceInsert(input: CreateServiceInput): Record<string, unknown> { /* ... */ }

// Online Store Service → Supabase update
export function toMenuServiceUpdate(updates: Partial<Service>): Record<string, unknown> { /* ... */ }

// Supabase → ServiceCategory (for category dropdown)
export function toServiceCategory(row: Record<string, unknown>): ServiceCategory { /* ... */ }
```

### Step 1.3: Update Services.tsx

- Replace `localStorage.setItem("catalog_services", ...)` writes with `catalogSyncService.createService()` / `updateService()` / `deleteService()`
- Replace hardcoded category filter array with `catalogSyncService.getCategories(storeId)`
- Add loading state (spinner/skeleton while fetching)
- Add error state (error message with retry button)
- Wrap in try/catch with toast notifications

### Step 1.4: Update ServiceForm.tsx

- Remove `localStorage.getItem("catalog_services")` reads — fetch single service via Supabase
- Remove `localStorage.setItem(...)` writes — use `catalogSyncService.createService()` / `updateService()`
- Remove `Date.now().toString()` ID generation — let Supabase generate UUIDs
- Remove simulated 500ms delay
- Replace hardcoded categories array with `getCategories(storeId)` call
- Add form-level loading state during save
- Add error handling with field-specific validation errors

### Step 1.5: Update Catalog.tsx Dashboard

- Replace hardcoded counts with dynamic counts fetched from Supabase `count` queries
- Add loading skeletons for count cards
- Keep navigation structure unchanged

### Verification (Phase 1)

1. Navigate to Online Store admin → Catalog → Services
2. Create a new service → verify it appears in list AND persists after page refresh
3. Edit a service → verify changes persist after refresh
4. Delete a service → verify soft-deleted (not visible in list)
5. Check Supabase `menu_services` table directly → verify rows exist
6. Categories dropdown in ServiceForm → should show real categories from `service_categories` table
7. Catalog dashboard → counts should reflect real data

---

## Phase 2: Products Integration

**Blocked by:** Prereq 1 (products table schema resolution)

### Goal
Products page uses Supabase for CRUD operations with proper type adapters. Mock data is removed.

### Step 2.1: Add Product Operations to catalogSyncService

```typescript
async function getProducts(storeId: string): Promise<Product[]> { /* ... */ }
async function createProduct(storeId: string, input: CreateProductInput): Promise<Product> { /* ... */ }
async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> { /* ... */ }
async function deleteProduct(id: string): Promise<void> { /* ... */ }
```

The exact column mapping depends on which products table schema is chosen in Prereq 1.

### Step 2.2: Add Product Type Adapter

Create `toOnlineProduct()` and `toProductInsert()` in `catalogAdapters.ts`, mapping between the resolved Supabase schema and the Online Store `Product` type.

### Step 2.3: Update Products.tsx

- Remove mock product data (`OPI Nail Polish` hardcoded fallback)
- Remove `localStorage.getItem("catalog_products")` reads
- Fetch from `catalogSyncService.getProducts(storeId)`
- Add loading skeleton and error state
- Add empty state ("No products yet. Add your first product.")

### Step 2.4: Create ProductForm.tsx

New page at `apps/online-store/src/pages/admin/catalog/ProductForm.tsx`:
- Fields: name, SKU, category, description, pricing (cost/retail), inventory (stock quantity, tracking toggle, low stock threshold), images, online visibility
- Create/edit modes based on URL param
- Uses `catalogSyncService.createProduct()` / `updateProduct()`
- Zod validation schema
- Error handling with toast notifications

### Step 2.5: Add Route

Register `/admin/catalog/products/new` and `/admin/catalog/products/:id/edit` routes.

### Verification (Phase 2)

1. Navigate to Products page → should show real products (or empty state if none exist)
2. Create a product with inventory details → verify in Supabase `products` table
3. Edit product price → verify change persists
4. Delete product → verify soft-deleted
5. Inventory badge colors should reflect actual stock levels

---

## Phase 3: Memberships & Gift Cards

**Memberships blocked by:** Prereq 2 (membership_plans table creation)
**Gift Cards:** Can proceed immediately (tables exist)

### Step 3.1: Gift Cards — Connect to Existing Supabase Tables

The `gift_card_settings` and `gift_card_denominations` tables already exist in migration 031.

Update `giftCardStorage.ts` to use Supabase as primary, localStorage as cache:

```typescript
export async function getGiftCardConfig(storeId: string): Promise<GiftCardConfig> {
  // Try localStorage cache first (5-min TTL)
  const cached = getCachedConfig();
  if (cached) return cached;

  // Fetch from Supabase
  const [settings, denominations] = await Promise.all([
    supabase.from('gift_card_settings').select('*').eq('store_id', storeId).single(),
    supabase.from('gift_card_denominations').select('*').eq('store_id', storeId).eq('is_active', true),
  ]);

  const config = toGiftCardConfig(settings.data, denominations.data);
  setCachedConfig(config);
  return config;
}

export async function updateGiftCardConfig(storeId: string, config: GiftCardConfig): Promise<void> {
  // Write to Supabase
  await supabase.from('gift_card_settings').upsert({ store_id: storeId, ...toGiftCardSettingsRow(config) });
  // Sync denominations (delete removed, insert new, update existing)
  await syncDenominations(storeId, config.presetAmounts);
  clearCachedConfig();
}
```

Update `GiftCardSettings.tsx`:
- Make load/save operations async
- Add loading and error states
- Remove hardcoded defaults (let Supabase defaults or empty state handle first-time setup)

### Step 3.2: Memberships — Migrate to Supabase

After Prereq 2 (table creation):

Update `membershipStorage.ts` with same Supabase-primary / localStorage-cache pattern as gift cards.

Update `Memberships.tsx`:
- Fetch from Supabase via updated storage
- Add loading skeleton and error state
- Remove hardcoded 3-plan defaults from localStorage initialization
- Add create/edit form (currently only has list + delete)

### Verification (Phase 3)

1. Gift Cards: Change preset amounts → refresh → verify changes persist
2. Gift Cards: Check `gift_card_settings` and `gift_card_denominations` in Supabase
3. Memberships: Create a plan → verify in Supabase `membership_plans` table
4. Memberships: Delete a plan → verify soft-deleted
5. Both pages: Loading skeleton visible during fetch
6. Both pages: Error toast on network failure

---

## Phase 4: Type Safety & Component Cleanup

### Step 4.1: Consolidate GiftCardConfig Types

**Problem:** Two conflicting `GiftCardConfig` definitions:

| Field | `types/catalog.ts` | `giftCardStorage.ts` |
|-------|---------------------|----------------------|
| Delivery | `deliveryOptions: { digital, physical, messageCharLimit }` | `deliveryMethods: string[]`, `allowMessage: boolean` |
| Designs | `designs: Array<{ id, name, imageUrl, isDefault }>` | Not present |
| Terms | `terms: string` | Not present |
| Email | `emailTemplate: { subject, body }` | Not present |

**Solution:** Keep `types/catalog.ts` as the canonical type (it's more complete). Update `giftCardStorage.ts` to use it. Map the simplified Supabase columns to the richer type structure in the adapter.

### Step 4.2: Reconcile Membership Types

**Problem:** `types/catalog.ts` has `Membership` interface, but `membershipStorage.ts` defines its own `MembershipPlan` with different fields (`perks[]` vs `benefits{}`, `priceMonthly` vs `price`).

**Solution:** Decide which is canonical (likely `Membership` from `types/catalog.ts` since it aligns with the Supabase schema). Update `membershipStorage.ts` to use it.

### Step 4.3: Add Generics to CatalogTable

```typescript
// Current (116 lines, uses `any`)
interface CatalogTableProps {
  data: any[];
  columns: Array<{ key: string; header: string; render?: (item: any) => ReactNode }>;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onDuplicate?: (item: any) => void;
}

// Updated
interface CatalogTableProps<T extends { id: string }> {
  data: T[];
  columns: Array<{ key: keyof T & string; header: string; render?: (item: T) => ReactNode }>;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onDuplicate?: (item: T) => void;
}
```

### Verification (Phase 4)

1. TypeScript build passes with no type errors (`pnpm tsc --noEmit`)
2. No `any` types in CatalogTable or its consumers
3. Single `GiftCardConfig` definition — grep confirms no duplicates
4. Single `Membership`/`MembershipPlan` definition

---

## Phase 5: Error Handling & Resilience

### Step 5.1: CatalogErrorBoundary

Create `apps/online-store/src/components/admin/catalog/CatalogErrorBoundary.tsx`:
- Catches render errors in catalog pages
- Shows friendly error UI with retry button
- Logs errors for debugging

Wrap each catalog route in the error boundary.

### Step 5.2: Consistent Toast Library

**Problem:** Some pages import from `@/hooks/use-toast`, others from `sonner`. Standardize on one.

**Action:** Audit all catalog pages and pick one library. Update imports accordingly.

### Step 5.3: Unit Tests

- `catalogAdapters.test.ts` — test all adapter functions (toOnlineService, toMenuServiceInsert, toServiceCategory, toOnlineProduct, toGiftCardConfig)
- `catalogSyncService.test.ts` — test CRUD operations with mocked Supabase client
- `giftCardStorage.test.ts` — test Supabase-primary / localStorage-cache fallback
- Mock Supabase client using `vi.mock()` pattern

### Verification (Phase 5)

1. `pnpm test` passes with new tests
2. Intentionally break network → verify error boundary catches and shows retry UI
3. All toast notifications use same library (no mixed imports)

---

## Files Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `apps/online-store/src/lib/adapters/catalogAdapters.ts` | 1 | Type converters (Supabase ↔ Online Store types) |
| `apps/online-store/src/pages/admin/catalog/ProductForm.tsx` | 2 | Product create/edit form |
| `apps/online-store/src/components/admin/catalog/CatalogErrorBoundary.tsx` | 5 | Error boundary wrapper |
| `supabase/migrations/XXX_create_membership_plans.sql` | Prereq 2 | Membership plans table |
| `apps/online-store/src/lib/adapters/catalogAdapters.test.ts` | 5 | Adapter unit tests |
| `apps/online-store/src/lib/services/catalogSyncService.test.ts` | 5 | Service unit tests |

### Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `apps/online-store/src/lib/services/catalogSyncService.ts` | 1, 2 | Add write operations (create/update/delete), category reads, product operations |
| `apps/online-store/src/pages/admin/catalog/Services.tsx` | 1 | Replace localStorage writes with Supabase calls; dynamic category filter |
| `apps/online-store/src/pages/admin/catalog/ServiceForm.tsx` | 1 | Replace localStorage with Supabase; remove mock delay; dynamic categories |
| `apps/online-store/src/pages/admin/Catalog.tsx` | 1 | Dynamic counts from Supabase |
| `apps/online-store/src/pages/admin/catalog/Products.tsx` | 2 | Remove mock data; fetch from Supabase |
| `apps/online-store/src/lib/storage/giftCardStorage.ts` | 3 | Supabase-primary with localStorage cache |
| `apps/online-store/src/pages/admin/catalog/GiftCardSettings.tsx` | 3 | Async load/save; loading/error states |
| `apps/online-store/src/lib/storage/membershipStorage.ts` | 3 | Supabase-primary with localStorage cache |
| `apps/online-store/src/pages/admin/catalog/Memberships.tsx` | 3 | Async operations; loading/error states |
| `apps/online-store/src/types/catalog.ts` | 4 | Consolidate GiftCardConfig; reconcile Membership |
| `apps/online-store/src/components/admin/catalog/CatalogTable.tsx` | 4 | Add generics, remove `any` |

---

## Implementation Order

```
Prerequisites (unblocks later phases):
├── Prereq 1: Resolve products table conflict ← Decision needed
└── Prereq 2: Create membership_plans migration

Phase 1: Services & Categories ← Can start immediately
├── Extend catalogSyncService with write ops
├── Create catalogAdapters.ts
├── Update Services.tsx (Supabase read/write)
├── Update ServiceForm.tsx (Supabase read/write, dynamic categories)
└── Update Catalog.tsx (dynamic counts)

Phase 2: Products ← Blocked by Prereq 1
├── Add product operations to catalogSyncService
├── Add product adapter
├── Update Products.tsx
├── Create ProductForm.tsx
└── Add routes

Phase 3: Memberships & Gift Cards ← Gift Cards can start after Phase 1; Memberships after Prereq 2
├── Update giftCardStorage.ts (Supabase-primary)
├── Update GiftCardSettings.tsx
├── Update membershipStorage.ts (Supabase-primary)
└── Update Memberships.tsx

Phase 4: Type Safety ← After Phase 3
├── Consolidate GiftCardConfig
├── Reconcile Membership types
└── Add generics to CatalogTable

Phase 5: Error Handling & Tests ← After Phase 4
├── CatalogErrorBoundary
├── Standardize toast library
└── Unit tests
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Products table schema conflict causes runtime errors | HIGH | Resolve in Prereq 1 before touching Products |
| Supabase RLS blocks writes from Online Store admin | HIGH | Test RLS policies early; Online Store admin must authenticate as store staff |
| Breaking existing `catalogSyncService` consumers | MEDIUM | Extend (don't replace) existing functions; customer-facing booking flow must keep working |
| localStorage cache serves stale data after Supabase write | MEDIUM | `clearCache()` after every write operation |
| Missing Supabase tables for memberships | MEDIUM | Create migration in Prereq 2 before Phase 3 |
| Type adapter bugs silently corrupt data | MEDIUM | Unit tests for every adapter function |

---

## Out of Scope (Tracked Separately)

These items from `CATALOG_MODULE_REVIEW_2026-01-22.md` are NOT addressed by this plan:

| Issue | Why Excluded |
|-------|-------------|
| Store-app sync orchestration (vector clocks) | Store-app concern, not Online Store |
| Store-app caching layer | Store-app concern |
| Store-app transaction support | Store-app concern |
| Store-app tombstone cleanup | Store-app concern |
| Store-app large file refactoring (2052-line catalogDataService) | Store-app concern |
| ServiceStatus type collision (catalog.ts vs common.ts) | Store-app types concern |
| Store-app test coverage gaps | Store-app concern |

---

## Success Metrics

- [ ] All catalog admin pages load data from Supabase (verified by checking Supabase query logs)
- [ ] All CRUD operations persist to Supabase (verified by direct table inspection)
- [ ] Categories dropdown populated from `service_categories` table (no hardcoded arrays)
- [ ] No mock data or hardcoded fallback products remain
- [ ] Catalog dashboard shows real entity counts
- [ ] No `any` types in CatalogTable or its consumers
- [ ] Single canonical type for GiftCardConfig and Membership
- [ ] All catalog pages have loading states and error handling
- [ ] Unit tests pass for adapters and data service
- [ ] Customer-facing booking flow (non-admin) continues working unchanged
- [ ] `pnpm build` succeeds with no type errors

---

**Last Updated:** January 26, 2026
