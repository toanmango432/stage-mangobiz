# PRD: Online Store Catalog Admin — Supabase Migration

## Introduction

Migrate the Online Store admin catalog pages (`apps/online-store/src/pages/admin/catalog/`) from localStorage/mock data to Supabase as the primary data store. Currently, services partially read from Supabase but write to localStorage, products use a single hardcoded mock item, memberships use localStorage with 3 hardcoded defaults (no Supabase table exists), and gift cards use localStorage despite Supabase tables (`gift_card_settings`, `gift_card_denominations`) already existing. The catalog dashboard shows all hardcoded counts.

**Scope:** Online Store admin catalog pages ONLY. Store-app catalog code is out of scope.

**Architecture Decision:** Extend the existing `catalogSyncService.ts` with write operations. Do NOT duplicate the store-app's 2052-line `catalogDataService.ts` — the Online Store has different access patterns (online-only, lightweight reads), different type shapes, and different entity scope.

## Goals

- All catalog admin pages load and save data from Supabase (no localStorage writes for persistence)
- Remove all mock/hardcoded data from catalog pages
- Dynamic dashboard counts from Supabase queries
- Categories fetched from `service_categories` table instead of hardcoded arrays
- Single canonical type for `GiftCardConfig` and `Membership`/`MembershipPlan`
- No `any` types in `CatalogTable` component
- All pages have loading and error states
- Standardize toast library usage (currently mixed `sonner` vs `@/hooks/use-toast`)
- Customer-facing booking flow remains unchanged
- `pnpm build` succeeds with no type errors

## Prerequisites / Blockers

### PREREQ-1: Products Table Schema Conflict
Migration 017 (e-commerce) and 031 (inventory) both define a `products` table with incompatible schemas (different SKU nullability, different pricing columns, different media fields). **Must resolve before any Products work.**

Options:
- A) Merge into superset table
- B) Rename one table (e.g., `retail_products` vs `ecommerce_products`)
- C) Extend 031 with e-commerce columns

**This PRD treats PREREQ-1 as already resolved. The Products stories (Phase 2) assume a single `products` table is available. If unresolved, skip Phase 2 stories.**

### PREREQ-2: No `membership_plans` Supabase Table
No Supabase table exists for membership plans. A migration must be created before memberships can work. **This is handled as US-016 in Phase 3.**

## User Stories

---

### Phase 1: Services & Categories (Foundation)

---

### US-001: Create catalogAdapters.ts for Online Store
**Description:** As a developer, I need adapter functions to convert between Supabase row types (snake_case) and Online Store types (camelCase) so that all catalog pages can use properly typed data.

**Files to modify:**
- `apps/online-store/src/lib/adapters/catalogAdapters.ts` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Creates `toOnlineService(row: ServiceRow): Service` adapter (move from catalogSyncService.ts)
- [ ] Creates `fromOnlineService(service: Service): Partial<ServiceRow>` reverse adapter
- [ ] Creates `toOnlineCategory(row: CategoryRow): { id: string; name: string; color: string; icon?: string; displayOrder: number }` adapter
- [ ] Defines `ServiceRow` and `CategoryRow` interfaces matching Supabase `menu_services` and `service_categories` table schemas from migration 031
- [ ] All adapters handle null/undefined fields gracefully
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes (run from `apps/online-store/`)

**Notes:**
- Follow the adapter pattern from `apps/store-app/src/services/supabase/adapters/` but keep lightweight
- `ServiceRow` fields come from `menu_services` table in migration 031 (snake_case columns: `name`, `description`, `pricing_type`, `price`, `duration`, `is_active`, `show_online_booking`, `category_id`, etc.)
- `CategoryRow` fields come from `service_categories` table in migration 031
- Do NOT import from store-app — define Online Store-specific row interfaces
- Export all adapters and row interfaces

**Priority:** 1

---

### US-002: Extend catalogSyncService with category fetching
**Description:** As an admin, I want service categories to come from the `service_categories` Supabase table instead of a hardcoded array, so categories stay in sync with the store-app.

**Files to modify:**
- `apps/online-store/src/lib/services/catalogSyncService.ts` (~40 lines added)

**Acceptance Criteria:**
- [ ] Adds `getCategories(): Promise<Category[]>` function that queries `service_categories` table
- [ ] Filters by `is_deleted = false` and `is_active = true`
- [ ] Orders by `display_order ASC`
- [ ] Uses `toOnlineCategory` adapter from `catalogAdapters.ts`
- [ ] Caches categories in localStorage with `catalog_categories_v2` key and same 5-min TTL pattern as services
- [ ] Adds `getCachedCategories(): Category[]` for sync reads
- [ ] Handles Supabase client being null (no env vars) — returns empty array
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- Follow the existing `getServices()` / `getCachedServices()` pattern in the same file
- Import `toOnlineCategory` from `../adapters/catalogAdapters`
- `service_categories` columns: `id`, `name`, `description`, `color`, `icon`, `display_order`, `is_active`, `is_deleted`, `store_id`

**Priority:** 2

---

### US-003: Extend catalogSyncService with service write operations
**Description:** As a developer, I need create/update/delete operations for services in catalogSyncService so that ServiceForm can persist to Supabase instead of localStorage.

**Files to modify:**
- `apps/online-store/src/lib/services/catalogSyncService.ts` (~80 lines added)

**Acceptance Criteria:**
- [ ] Adds `createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service>` — inserts into `menu_services` table, returns created service via adapter
- [ ] Adds `updateService(id: string, updates: Partial<Service>): Promise<Service>` — updates `menu_services` row, returns updated service via adapter
- [ ] Adds `deleteService(id: string): Promise<void>` — soft-deletes by setting `is_deleted = true`
- [ ] All write operations use `fromOnlineService` adapter for snake_case conversion
- [ ] All write operations invalidate the services cache (`clearCache()` or remove `catalog_services_v2`)
- [ ] Throws descriptive errors on Supabase failure (not silent)
- [ ] Handles null Supabase client — throws `Error('Supabase not configured')`
- [ ] No simulated delays (`setTimeout`)
- [ ] No `Date.now()` for IDs — Supabase generates UUIDs
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- Follow the query pattern of existing `syncFromSupabase()` function
- `menu_services` table uses UUID primary key generated by `gen_random_uuid()`
- Soft delete: set `is_deleted = true`, `deleted_at = NOW()`
- The store_id should come from env or be passed as parameter — check how existing `syncFromSupabase` resolves it

**Priority:** 3

---

### US-004: Update ServiceForm.tsx to use Supabase writes
**Description:** As an admin, I want creating and editing services to persist to Supabase instead of localStorage, with categories loaded from the database.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/ServiceForm.tsx` (~80 lines changed)

**Acceptance Criteria:**
- [ ] Removes hardcoded `categories` array (lines 18-27)
- [ ] Fetches categories using `getCategories()` from catalogSyncService on mount
- [ ] Removes `localStorage.getItem("catalog_services")` read (line 53)
- [ ] Loads existing service via `getServices()` when editing (using `id` from URL params)
- [ ] Removes `localStorage.setItem("catalog_services", ...)` write (line 85)
- [ ] Uses `createService()` for new services, `updateService()` for existing
- [ ] Removes `Date.now().toString()` ID generation (line 76)
- [ ] Removes simulated 500ms delay `await new Promise(...)` (line 69)
- [ ] Shows loading state while fetching categories
- [ ] Shows error toast on save failure with Supabase error message
- [ ] No forbidden strings: `Date.now()`, `setTimeout`, `localStorage.setItem`, `localStorage.getItem`
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: create a new service, edit it, confirm it persists after page reload

**Notes:**
- This file is 338 lines — changes should keep it under 350
- Uses `sonner` for toast (keep consistent — do NOT switch to `@/hooks/use-toast`)
- The `useNavigate()` and `useParams()` patterns are already in place
- Category dropdown should show `name` from Supabase, not hardcoded strings
- CRITICAL: Do NOT use mock data — all data from Supabase

**Priority:** 4

---

### US-005: Update Services.tsx to use Supabase writes
**Description:** As an admin, I want the services list page to delete and duplicate services via Supabase, and filter by categories from the database.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/Services.tsx` (~50 lines changed)

**Acceptance Criteria:**
- [ ] Removes hardcoded category filter array (lines 139-147: "Manicure", "Pedicure", "Nail Art", etc.)
- [ ] Fetches categories using `getCategories()` and uses them for the category filter dropdown
- [ ] Delete action uses `deleteService()` from catalogSyncService instead of `saveServices()` to localStorage
- [ ] Duplicate action uses `createService()` from catalogSyncService instead of localStorage write
- [ ] Removes `Date.now().toString()` for duplicate IDs (line 176)
- [ ] Removes `saveServices()` localStorage calls
- [ ] Refreshes service list after delete/duplicate by re-calling `getServices()`
- [ ] No forbidden strings: `Date.now()`, `saveServices`, hardcoded category names
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: delete a service, duplicate a service, filter by category

**Notes:**
- This file is 186 lines — changes should keep it under 200
- The `getServices()` call on mount already exists — keep that pattern
- Uses `sonner` for toast (keep consistent)

**Priority:** 5

---

### US-006: Update Catalog.tsx dashboard with dynamic counts
**Description:** As an admin, I want the catalog dashboard to show real counts from Supabase instead of hardcoded numbers.

**Files to modify:**
- `apps/online-store/src/pages/admin/Catalog.tsx` (~40 lines changed)

**Acceptance Criteria:**
- [ ] Removes hardcoded counts: `count: 24` (services), `count: 6` (packages), `count: 42` (products), `count: 3` (memberships), `count: 1` (gift cards)
- [ ] Fetches services count from `getServices()` and uses `.length`
- [ ] Shows `0` for packages (not yet implemented, but no hardcoded `6`)
- [ ] Shows loading spinners or skeleton while counts load
- [ ] Products, memberships, gift cards show `0` initially (they get their own Supabase integration in later phases — do NOT use localStorage counts)
- [ ] No forbidden strings: hardcoded count numbers
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: counts match actual Supabase data

**Notes:**
- This file is 94 lines — keep under 120
- Use `useEffect` + `useState` for async data fetch
- Later phases will add real counts for products, memberships, gift cards — for now just services
- The packages path is `null` (disabled) — count can be `0`

**Priority:** 6

---

### Phase 2: Products (Blocked by PREREQ-1)

**⚠️ Skip Phase 2 if PREREQ-1 (products table conflict) is unresolved.**

---

### US-007: Add product adapters to catalogAdapters.ts
**Description:** As a developer, I need adapter functions for the products table so product pages can use properly typed data.

**Files to modify:**
- `apps/online-store/src/lib/adapters/catalogAdapters.ts` (~60 lines added)

**Acceptance Criteria:**
- [ ] Adds `ProductRow` interface matching the resolved `products` Supabase table schema
- [ ] Adds `toOnlineProduct(row: ProductRow): Product` adapter
- [ ] Adds `fromOnlineProduct(product: Product): Partial<ProductRow>` reverse adapter
- [ ] Handles variant mapping (if products table has variant support)
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- The `Product` type is defined in `apps/online-store/src/types/catalog.ts` (lines 79-111)
- The exact `ProductRow` columns depend on PREREQ-1 resolution
- Keep adapters in the same file as service/category adapters

**Priority:** 7

---

### US-008: Add product CRUD to catalogSyncService
**Description:** As a developer, I need product CRUD operations in catalogSyncService so product pages can read/write from Supabase.

**Files to modify:**
- `apps/online-store/src/lib/services/catalogSyncService.ts` (~80 lines added)

**Acceptance Criteria:**
- [ ] Adds `getProducts(): Promise<Product[]>` — queries products table, filters `is_deleted = false`, uses `toOnlineProduct` adapter
- [ ] Adds `getCachedProducts(): Product[]` — localStorage cache with `catalog_products_v2` key, 5-min TTL
- [ ] Adds `createProduct(product): Promise<Product>` — inserts into products table
- [ ] Adds `updateProduct(id, updates): Promise<Product>` — updates products row
- [ ] Adds `deleteProduct(id): Promise<void>` — soft-deletes
- [ ] All operations handle null Supabase client
- [ ] Cache invalidation on writes
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- Follow the exact same pattern as service CRUD operations from US-003
- Products table column names depend on PREREQ-1 resolution

**Priority:** 8

---

### US-009: Update Products.tsx to use Supabase
**Description:** As an admin, I want the products page to load real products from Supabase instead of showing the hardcoded OPI Nail Polish mock.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/Products.tsx` (~60 lines changed)

**Acceptance Criteria:**
- [ ] Removes hardcoded `mockProducts` array (lines 12-36: "OPI Nail Polish - Big Apple Red")
- [ ] Fetches products using `getProducts()` from catalogSyncService on mount
- [ ] Delete uses `deleteProduct()` instead of localStorage
- [ ] Shows loading state while fetching
- [ ] Shows empty state when no products exist (not mock data fallback)
- [ ] Removes localStorage read: `localStorage.getItem("catalog_products")`
- [ ] No forbidden strings: `OPI Nail Polish`, `Big Apple Red`, `mockProducts`, `localStorage`
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: products page shows real data, empty state works

**Notes:**
- This file is 150 lines — keep under 160
- Remove the fallback: `setProducts(stored ? JSON.parse(stored) : mockProducts)` — just use Supabase

**Priority:** 9

---

### US-010: Create ProductForm.tsx for product creation/editing
**Description:** As an admin, I need a form to create and edit products that saves to Supabase.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/ProductForm.tsx` (NEW, ~250 lines)

**Acceptance Criteria:**
- [ ] Form fields match `Product` type: name, sku, vendor, category, description, costPrice, retailPrice, taxable, trackInventory, stockQuantity, showOnline, featured
- [ ] Loads existing product via `getProducts()` when editing (using `id` param)
- [ ] Creates new product via `createProduct()` from catalogSyncService
- [ ] Updates existing product via `updateProduct()` from catalogSyncService
- [ ] Navigates back to products list after save
- [ ] Shows error toast on failure
- [ ] Uses `sonner` for toast (consistent with ServiceForm)
- [ ] No localStorage reads or writes
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: create product, edit product, data persists

**Notes:**
- Follow the pattern from `ServiceForm.tsx` (after US-004 updates)
- Use React Hook Form if ServiceForm uses it; otherwise match its form pattern
- File should be under 300 lines
- The Products page routing must support `/admin/catalog/products/new` and `/admin/catalog/products/:id/edit` — check existing router config

**Priority:** 10

---

### US-011: Update Catalog.tsx with products count
**Description:** As an admin, I want the dashboard to show the real products count.

**Files to modify:**
- `apps/online-store/src/pages/admin/Catalog.tsx` (~10 lines changed)

**Acceptance Criteria:**
- [ ] Products count comes from `getProducts().length` (replace the `0` from US-006)
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: products count matches Supabase data

**Notes:**
- Small change — just add the products fetch alongside the services fetch from US-006
- Can use `Promise.all` to fetch services and products in parallel

**Priority:** 11

---

### Phase 3: Gift Cards & Memberships

---

### US-012: Add gift card adapters to catalogAdapters.ts
**Description:** As a developer, I need adapters for the `gift_card_settings` and `gift_card_denominations` tables.

**Files to modify:**
- `apps/online-store/src/lib/adapters/catalogAdapters.ts` (~50 lines added)

**Acceptance Criteria:**
- [ ] Adds `GiftCardSettingsRow` interface matching `gift_card_settings` table (columns: `allow_custom_amount`, `min_amount`, `max_amount`, `default_expiration_days`, `store_id`)
- [ ] Adds `GiftCardDenominationRow` interface matching `gift_card_denominations` table (columns: `amount`, `label`, `is_active`, `display_order`)
- [ ] Adds `toGiftCardConfig(settingsRow, denominationRows): GiftCardConfig` adapter that combines settings + denominations into the Online Store `GiftCardConfig` type
- [ ] Adds `fromGiftCardConfig(config): { settings: Partial<GiftCardSettingsRow>; denominations: ... }` reverse adapter
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- The `GiftCardConfig` type from `types/catalog.ts` has fields (`designs`, `deliveryOptions`, `emailTemplate`, `terms`) that don't exist in the Supabase tables — these should be kept as defaults/nulls in the adapter
- The `giftCardStorage.ts` has a DIFFERENT `GiftCardConfig` interface with `deliveryMethods`, `allowMessage`, `maxMessageLength` — this is the OLD type that will be replaced
- Map: `presetAmounts` ← `gift_card_denominations` rows' `amount` field, `customAmountMin` ← `min_amount`, `customAmountMax` ← `max_amount`, `expiryMonths` ← `default_expiration_days / 30`

**Priority:** 12

---

### US-013: Add gift card CRUD to catalogSyncService
**Description:** As a developer, I need gift card operations in catalogSyncService to read/write settings and denominations from Supabase.

**Files to modify:**
- `apps/online-store/src/lib/services/catalogSyncService.ts` (~70 lines added)

**Acceptance Criteria:**
- [ ] Adds `getGiftCardConfig(): Promise<GiftCardConfig | null>` — queries `gift_card_settings` + `gift_card_denominations`, combines via adapter
- [ ] Adds `updateGiftCardConfig(config: Partial<GiftCardConfig>): Promise<GiftCardConfig>` — upserts settings row, replaces denomination rows
- [ ] Denomination updates: delete existing active denominations for store, insert new ones (simpler than diffing)
- [ ] Caches with `catalog_giftcard_v2` key, 5-min TTL
- [ ] Handles null Supabase client
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- `gift_card_settings` has `UNIQUE (store_id)` constraint — use upsert
- `gift_card_denominations` are per-store rows with individual amounts
- The gift card page currently calls `getGiftCardConfig()` / `updateGiftCardConfig()` from `giftCardStorage.ts` — the new functions have the same names but different implementation

**Priority:** 13

---

### US-014: Update GiftCardSettings.tsx to use Supabase
**Description:** As an admin, I want gift card settings to load from and save to Supabase instead of localStorage.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/GiftCardSettings.tsx` (~30 lines changed)

**Acceptance Criteria:**
- [ ] Imports `getGiftCardConfig`, `updateGiftCardConfig` from `catalogSyncService` instead of `giftCardStorage`
- [ ] Removes `initializeGiftCardConfig()` call (no more localStorage initialization)
- [ ] Shows loading state while fetching from Supabase
- [ ] Shows error toast on save failure
- [ ] Removes toast message "saved to localStorage" — replace with "Gift card settings saved"
- [ ] Uses `sonner` for toast (switch from `@/hooks/use-toast` for consistency)
- [ ] No `localStorage` calls remain
- [ ] No forbidden strings: `localStorage`, `saved to localStorage`
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: save settings, reload, settings persist from Supabase

**Notes:**
- This file is 280 lines — keep under 290
- The function signatures match (`getGiftCardConfig`, `updateGiftCardConfig`) so the import path change is the main change
- Switch toast from `@/hooks/use-toast` to `sonner` (`import { toast } from 'sonner'`) to standardize

**Priority:** 14

---

### US-015: Update Catalog.tsx with gift cards count
**Description:** As an admin, I want the dashboard to show whether gift cards are configured.

**Files to modify:**
- `apps/online-store/src/pages/admin/Catalog.tsx` (~10 lines changed)

**Acceptance Criteria:**
- [ ] Gift cards count: `1` if config exists and `enabled = true`, `0` otherwise
- [ ] Fetch via `getGiftCardConfig()` alongside other counts
- [ ] `pnpm run typecheck` passes

**Notes:**
- Add to the existing `Promise.all` from US-006/US-011

**Priority:** 15

---

### US-016: Create membership_plans Supabase migration
**Description:** As a developer, I need a `membership_plans` table in Supabase so membership data can be persisted.

**Files to modify:**
- `supabase/migrations/XXX_create_membership_plans.sql` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Creates `membership_plans` table with columns matching the `MembershipPlan` interface from `membershipStorage.ts`: `name`, `display_name`, `price_monthly`, `description`, `tagline`, `image_url`, `badge_icon`, `color`, `perks` (JSONB array), `features` (JSONB), `rules` (JSONB), `is_popular`, `is_active`, `sort_order`
- [ ] Includes standard multi-tenant columns: `tenant_id`, `store_id`, `location_id`
- [ ] Includes sync metadata: `sync_status`, `version`, `vector_clock`, `last_synced_version`
- [ ] Includes soft delete: `is_deleted`, `deleted_at`, `deleted_by`, `deleted_by_device`, `tombstone_expires_at`
- [ ] Includes audit: `created_by`, `created_by_device`, `last_modified_by`, `last_modified_by_device`
- [ ] Includes timestamps: `created_at`, `updated_at`
- [ ] Enables RLS with store-member policies (same pattern as `service_categories`)
- [ ] Creates `update_membership_plans_updated_at()` trigger function
- [ ] Creates indexes: `store_id`, `store_active`, `display_order`, `sync`
- [ ] Migration file naming: use next available number after existing migrations
- [ ] SQL is valid PostgreSQL

**Notes:**
- Follow EXACT pattern from `service_categories` table in migration 031
- `perks` is a JSONB array of strings (e.g., `["10% off all services", "Priority booking"]`)
- `features` and `rules` are JSONB objects (flexible key-value)
- Add `COMMENT ON TABLE` for documentation

**Priority:** 16

---

### US-017: Add membership adapters to catalogAdapters.ts
**Description:** As a developer, I need adapter functions for the `membership_plans` table.

**Files to modify:**
- `apps/online-store/src/lib/adapters/catalogAdapters.ts` (~40 lines added)

**Acceptance Criteria:**
- [ ] Adds `MembershipPlanRow` interface matching the new `membership_plans` table columns
- [ ] Adds `toOnlineMembershipPlan(row: MembershipPlanRow): MembershipPlan` adapter
- [ ] Adds `fromOnlineMembershipPlan(plan: MembershipPlan): Partial<MembershipPlanRow>` reverse adapter
- [ ] Maps snake_case DB columns to camelCase app properties
- [ ] `perks` JSONB array maps directly (no conversion needed)
- [ ] `features` and `rules` JSONB objects map directly
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- Use the `MembershipPlan` type from `membershipStorage.ts` (not `Membership` from `types/catalog.ts` — type reconciliation happens in Phase 4)
- Column mapping: `display_name` → `displayName`, `price_monthly` → `priceMonthly`, `image_url` → `imageUrl`, `badge_icon` → `badgeIcon`, `is_popular` → `isPopular`, `is_active` → `isActive`, `sort_order` → `sortOrder`

**Priority:** 17

---

### US-018: Add membership CRUD to catalogSyncService
**Description:** As a developer, I need membership CRUD operations in catalogSyncService.

**Files to modify:**
- `apps/online-store/src/lib/services/catalogSyncService.ts` (~80 lines added)

**Acceptance Criteria:**
- [ ] Adds `getMembershipPlans(): Promise<MembershipPlan[]>` — queries `membership_plans`, filters `is_deleted = false`, orders by `sort_order`
- [ ] Adds `getCachedMembershipPlans(): MembershipPlan[]` — localStorage cache with `catalog_memberships_v2` key, 5-min TTL
- [ ] Adds `createMembershipPlan(plan): Promise<MembershipPlan>` — inserts into `membership_plans`
- [ ] Adds `updateMembershipPlan(id, updates): Promise<MembershipPlan>` — updates row
- [ ] Adds `deleteMembershipPlan(id): Promise<void>` — soft-deletes
- [ ] All operations use `toOnlineMembershipPlan` / `fromOnlineMembershipPlan` adapters
- [ ] Cache invalidation on writes
- [ ] Handles null Supabase client
- [ ] No `as any` casts
- [ ] `pnpm run typecheck` passes

**Notes:**
- Follow exact same pattern as service CRUD (US-003)
- Import adapters from `../adapters/catalogAdapters`

**Priority:** 18

---

### US-019: Update Memberships.tsx to use Supabase
**Description:** As an admin, I want the memberships page to load from and save to Supabase instead of localStorage.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/Memberships.tsx` (~40 lines changed)

**Acceptance Criteria:**
- [ ] Imports `getMembershipPlans`, `createMembershipPlan`, `updateMembershipPlan`, `deleteMembershipPlan` from `catalogSyncService` instead of `membershipStorage`
- [ ] Removes `initializeMembershipPlans()` call
- [ ] Shows loading state while fetching from Supabase
- [ ] Shows error state on failure
- [ ] Removes subtitle "stored in localStorage" (line 98)
- [ ] Switches toast from `@/hooks/use-toast` to `sonner` for consistency
- [ ] No `localStorage` calls remain
- [ ] No forbidden strings: `localStorage`, `stored in localStorage`, hardcoded plan data
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: memberships page shows data from Supabase, CRUD works

**Notes:**
- This file is 122 lines — keep under 140
- The 3 hardcoded default plans (Basic $49, Premium $99, VIP $199) should be seeded via the migration or a separate seed script, NOT in the component code

**Priority:** 19

---

### US-020: Update Catalog.tsx with memberships count
**Description:** As an admin, I want the dashboard to show the real memberships count.

**Files to modify:**
- `apps/online-store/src/pages/admin/Catalog.tsx` (~5 lines changed)

**Acceptance Criteria:**
- [ ] Memberships count comes from `getMembershipPlans().length`
- [ ] Added to existing `Promise.all` fetch
- [ ] `pnpm run typecheck` passes

**Notes:**
- Small incremental change to the dashboard component

**Priority:** 20

---

### Phase 4: Type Safety & Cleanup

---

### US-021: Consolidate GiftCardConfig types
**Description:** As a developer, I want a single canonical `GiftCardConfig` type to eliminate the duplicate definition in `giftCardStorage.ts`.

**Files to modify:**
- `apps/online-store/src/types/catalog.ts` (~10 lines changed)
- `apps/online-store/src/lib/storage/giftCardStorage.ts` (~5 lines changed or file deleted)

**Acceptance Criteria:**
- [ ] Single `GiftCardConfig` type in `types/catalog.ts` that supports both the Supabase fields and any additional UI fields
- [ ] `giftCardStorage.ts` either deleted (if no longer used) or imports from `types/catalog.ts` instead of defining its own
- [ ] If `giftCardStorage.ts` is still imported anywhere, add `@deprecated` JSDoc comment
- [ ] All imports of `GiftCardConfig` point to `types/catalog.ts`
- [ ] No duplicate `GiftCardConfig` interface definitions
- [ ] `pnpm run typecheck` passes

**Notes:**
- `types/catalog.ts` version has: `designs`, `deliveryOptions.digital/physical/messageCharLimit`, `terms`, `emailTemplate` — these are UI-facing fields not in Supabase
- `giftCardStorage.ts` version has: `id`, `deliveryMethods`, `allowMessage`, `maxMessageLength` — these are the OLD simplified fields
- The canonical type should match what `GiftCardSettings.tsx` actually renders (check the form fields)
- After US-014, `giftCardStorage.ts` should not be imported by any component — verify with grep

**Priority:** 21

---

### US-022: Reconcile Membership vs MembershipPlan types
**Description:** As a developer, I want a single canonical membership type to eliminate confusion between `Membership` (types/catalog.ts) and `MembershipPlan` (membershipStorage.ts).

**Files to modify:**
- `apps/online-store/src/types/catalog.ts` (~20 lines changed)
- `apps/online-store/src/lib/storage/membershipStorage.ts` (~5 lines changed or file deleted)

**Acceptance Criteria:**
- [ ] Decides on canonical type name: `MembershipPlan` (since that's what the Supabase table and storage use)
- [ ] Updates `types/catalog.ts`: either rename `Membership` to `MembershipPlan` or replace with the `MembershipPlan` interface from `membershipStorage.ts`
- [ ] The canonical `MembershipPlan` type has all fields needed by `Memberships.tsx` and the Supabase table
- [ ] Removes or deprecates the old type
- [ ] If `membershipStorage.ts` is still imported anywhere, add `@deprecated` JSDoc comment
- [ ] All files importing membership types use the canonical one
- [ ] Updates `catalogAdapters.ts` if the type name changed
- [ ] `pnpm run typecheck` passes

**Notes:**
- `Membership` in `types/catalog.ts` has: `benefits.serviceDiscountPercent`, `benefits.productDiscountPercent`, `benefits.priorityBooking`, `benefits.complimentaryServices`, `benefits.otherPerks`, `autoRenewal`, `gracePeriodDays`, `cancellationPolicy`, `pauseAllowed`, `activeMembersCount`
- `MembershipPlan` in `membershipStorage.ts` has: `displayName`, `priceMonthly`, `tagline`, `imageUrl`, `badgeIcon`, `color`, `perks`, `features: Record<string, any>`, `rules: Record<string, any>`, `isPopular`, `sortOrder`
- These are very different shapes — the `MembershipPlan` is what the UI actually uses
- Replace `Record<string, any>` in `features`/`rules` with proper typed interfaces

**Priority:** 22

---

### US-023: Add generics to CatalogTable component
**Description:** As a developer, I want `CatalogTable` to use TypeScript generics instead of `any` so that column renderers and callbacks are type-safe.

**Files to modify:**
- `apps/online-store/src/components/admin/catalog/CatalogTable.tsx` (~30 lines changed)

**Acceptance Criteria:**
- [ ] `CatalogTable` becomes `CatalogTable<T extends { id: string }>` generic component
- [ ] `Column` becomes `Column<T>` with `key: keyof T & string` and `render?: (value: T[keyof T], item: T) => React.ReactNode`
- [ ] `CatalogTableProps` becomes `CatalogTableProps<T>` with `data: T[]`, `onEdit: (item: T) => void`, `onDelete: (item: T) => void`, `onDuplicate?: (item: T) => void`
- [ ] No `any` types remain in the file
- [ ] All existing usages of `CatalogTable` in Services.tsx, Products.tsx, Memberships.tsx still compile
- [ ] `pnpm run typecheck` passes

**Notes:**
- This file is 116 lines — keep under 130
- The `Column.key` type should allow accessing `item[column.key]` safely
- If `keyof T & string` causes issues with column render access, use a simpler approach: `key: string` with `render?: (value: unknown, item: T) => React.ReactNode`
- Test that existing column definitions in Services.tsx, Products.tsx, Memberships.tsx still work after the change

**Priority:** 23

---

### US-024: Remove deprecated localStorage storage files
**Description:** As a developer, I want to remove the deprecated localStorage storage files that are no longer used after Supabase migration.

**Files to modify:**
- `apps/online-store/src/lib/storage/giftCardStorage.ts` (DELETE if unused)
- `apps/online-store/src/lib/storage/membershipStorage.ts` (DELETE if unused)

**Acceptance Criteria:**
- [ ] Grep confirms no remaining imports of `giftCardStorage` in any `.ts`/`.tsx` file
- [ ] Grep confirms no remaining imports of `membershipStorage` in any `.ts`/`.tsx` file
- [ ] Delete both files if no imports found
- [ ] If imports found, update those files to use catalogSyncService instead, then delete
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm build` passes (run from `apps/online-store/`)

**Notes:**
- These files should have been fully replaced by catalogSyncService operations in US-014 and US-019
- Check for any initialization calls (`initializeGiftCardConfig`, `initializeMembershipPlans`) in app startup code

**Priority:** 24

---

### Phase 5: Error Handling & Polish

---

### US-025: Standardize toast library across catalog pages
**Description:** As a developer, I want all catalog pages to use the same toast library for consistent notification UX.

**Files to modify:**
- Any catalog page files still using `@/hooks/use-toast` (~5 lines per file)

**Acceptance Criteria:**
- [ ] All catalog pages (`Services.tsx`, `ServiceForm.tsx`, `Products.tsx`, `ProductForm.tsx`, `Memberships.tsx`, `GiftCardSettings.tsx`) use `sonner` for toast
- [ ] No catalog page imports `@/hooks/use-toast`
- [ ] Toast pattern: `toast.success("message")` for success, `toast.error("message")` for errors
- [ ] `pnpm run typecheck` passes

**Notes:**
- Some pages were already switched in earlier stories (US-004, US-014, US-019)
- This story catches any remaining pages
- `sonner` is already a dependency — just `import { toast } from 'sonner'`

**Priority:** 25

---

### US-026: Add loading and error states to all catalog pages
**Description:** As an admin, I want to see loading indicators when data is being fetched and clear error messages when something goes wrong, across all catalog admin pages.

**Files to modify:**
- `apps/online-store/src/pages/admin/catalog/Services.tsx` (~10 lines)
- `apps/online-store/src/pages/admin/catalog/Products.tsx` (~10 lines)
- `apps/online-store/src/pages/admin/catalog/Memberships.tsx` (~10 lines)
- `apps/online-store/src/pages/admin/catalog/GiftCardSettings.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] Each page shows a loading spinner/skeleton while initial data loads from Supabase
- [ ] Each page shows an error message with retry button if Supabase fetch fails
- [ ] Loading state uses a consistent pattern across all pages (e.g., centered spinner with text)
- [ ] Error state uses a consistent pattern (e.g., red alert box with error message and "Retry" button)
- [ ] No page shows blank/empty content during loading (distinguish loading from truly empty)
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser: disconnect internet/use wrong Supabase URL to see error state

**Notes:**
- Earlier stories (US-004, US-009, US-014, US-019) already added basic loading states — this story standardizes them
- Consider creating a shared `CatalogLoadingState` and `CatalogErrorState` component if patterns are identical
- Keep it simple — no need for a full error boundary yet

**Priority:** 26

---

### US-027: Clean up catalogSyncService.ts — remove `row: any`
**Description:** As a developer, I want the existing `toOnlineService()` function in catalogSyncService to use proper types instead of `row: any`.

**Files to modify:**
- `apps/online-store/src/lib/services/catalogSyncService.ts` (~10 lines changed)

**Acceptance Criteria:**
- [ ] `toOnlineService()` parameter typed as `ServiceRow` instead of `any` (import from catalogAdapters)
- [ ] OR `toOnlineService()` is replaced by the adapter from `catalogAdapters.ts` (if US-001 made it redundant)
- [ ] No `any` types remain in the file's function signatures
- [ ] `pnpm run typecheck` passes

**Notes:**
- After US-001 creates `catalogAdapters.ts` with `toOnlineService(row: ServiceRow)`, the duplicate in `catalogSyncService.ts` should be replaced with an import
- This is a cleanup task — verify the existing function is no longer used directly

**Priority:** 27

---

### US-028: Unit tests for catalogAdapters
**Description:** As a developer, I want unit tests for all adapter functions to ensure snake_case ↔ camelCase conversion is correct.

**Files to modify:**
- `apps/online-store/src/lib/adapters/__tests__/catalogAdapters.test.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Tests `toOnlineService` with a full `ServiceRow` fixture
- [ ] Tests `fromOnlineService` round-trip
- [ ] Tests `toOnlineCategory` with a full `CategoryRow` fixture
- [ ] Tests `toOnlineProduct` (if exists)
- [ ] Tests `toGiftCardConfig` combining settings + denomination rows
- [ ] Tests `toOnlineMembershipPlan`
- [ ] Tests null/undefined field handling
- [ ] All tests pass: `pnpm test -- --run` (from `apps/online-store/`)

**Notes:**
- Use Vitest (the project's test framework)
- Create fixtures with realistic data matching Supabase row shapes
- Test edge cases: missing optional fields, empty arrays, null values

**Priority:** 28

---

### US-029: Unit tests for catalogSyncService CRUD operations
**Description:** As a developer, I want unit tests for the CRUD operations added to catalogSyncService.

**Files to modify:**
- `apps/online-store/src/lib/services/__tests__/catalogSyncService.test.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Mocks Supabase client (`createClient` returns mock with `.from().select()`, `.from().insert()`, etc.)
- [ ] Tests `getCategories()` — returns properly adapted categories
- [ ] Tests `createService()` — calls Supabase insert with correct snake_case columns
- [ ] Tests `updateService()` — calls Supabase update with correct filters
- [ ] Tests `deleteService()` — calls Supabase update with `is_deleted: true`
- [ ] Tests `getGiftCardConfig()` — combines settings + denominations
- [ ] Tests `getMembershipPlans()` — returns properly adapted plans
- [ ] Tests null Supabase client behavior — throws appropriate errors
- [ ] Tests cache invalidation after writes
- [ ] All tests pass: `pnpm test -- --run`

**Notes:**
- Mock the Supabase client at the module level
- Test the cache behavior by checking localStorage after operations
- Each test should be independent (clear localStorage between tests)

**Priority:** 29

---

## Functional Requirements

- FR-1 (US-001): Adapter functions exist for converting between Supabase rows and Online Store types
- FR-2 (US-002, US-003): catalogSyncService supports category reads and service CRUD
- FR-3 (US-004, US-005): Service pages read/write from Supabase, no localStorage persistence
- FR-4 (US-006, US-011, US-015, US-020): Catalog dashboard shows dynamic counts from Supabase
- FR-5 (US-007-US-010): Product pages read/write from Supabase, no mock data
- FR-6 (US-012-US-015): Gift card settings read/write from Supabase
- FR-7 (US-016-US-020): Membership plans stored in Supabase, migration created
- FR-8 (US-021, US-022): Single canonical type for GiftCardConfig and MembershipPlan
- FR-9 (US-023): CatalogTable uses TypeScript generics, no `any`
- FR-10 (US-025, US-026, US-027): Consistent toast library, loading/error states, no `any` in signatures

## Non-Goals (Out of Scope)

- **Store-app catalog code** — do NOT modify `apps/store-app/` files
- **Store-app catalogDataService** — do NOT extend or refactor the 2052-line service
- **Store-app adapters** — do NOT modify files in `apps/store-app/src/services/supabase/adapters/`
- **Offline/local-first support** — Online Store is online-only, no IndexedDB
- **Redux state management** — Online Store doesn't use Redux for catalog data
- **Customer-facing booking flow** — only admin catalog management pages
- **ServiceStatus type collision** between store-app and Online Store
- **Store-app file splitting** or refactoring
- **Sync orchestration** between store-app and Online Store
- **Package management** — packages path is null/disabled in Catalog.tsx
- **Products table schema resolution** (PREREQ-1) — assumed resolved before Phase 2

## Technical Considerations

### Existing Patterns to Follow
- **Supabase query pattern:** See `syncFromSupabase()` in `catalogSyncService.ts` (lines 80-120)
- **Caching pattern:** See `getServices()` / `getCachedServices()` in `catalogSyncService.ts`
- **Adapter pattern:** See `apps/store-app/src/services/supabase/adapters/` for reference (but keep Online Store adapters lightweight)
- **Toast usage:** `sonner` → `import { toast } from 'sonner'` → `toast.success("msg")`, `toast.error("msg")`

### File Size Tracking
| File | Current Lines | After Stories | Max |
|------|--------------|---------------|-----|
| `catalogSyncService.ts` | 372 | ~720 | Keep under 800 |
| `catalogAdapters.ts` | NEW | ~270 | Keep under 300 |
| `ServiceForm.tsx` | 338 | ~330 | Keep under 350 |
| `Services.tsx` | 186 | ~190 | Keep under 200 |
| `Catalog.tsx` | 94 | ~120 | Keep under 150 |
| `Products.tsx` | 150 | ~140 | Keep under 160 |
| `ProductForm.tsx` | NEW | ~250 | Keep under 300 |
| `CatalogTable.tsx` | 116 | ~130 | Keep under 150 |
| `GiftCardSettings.tsx` | 280 | ~280 | Keep under 300 |
| `Memberships.tsx` | 122 | ~140 | Keep under 150 |

### Potential Risks
1. **catalogSyncService.ts could get large** — at ~720 lines after all phases, consider if it needs splitting. But it's a service file (not a component), so higher line count is acceptable.
2. **RLS policies** — Online Store uses anonymous Supabase client with `persistSession: false`. Ensure the RLS policies allow reads for anon users OR that the admin pages authenticate first.
3. **Products table conflict** — Phase 2 is entirely blocked by PREREQ-1. If unresolved, skip to Phase 3.
4. **Migration ordering** — The membership migration (US-016) must use the next available number. Check existing migrations before creating.

## Open Questions

1. **RLS for admin pages:** The `catalogSyncService.ts` creates a Supabase client with `autoRefreshToken: false, persistSession: false`. Are admin pages authenticated differently? Do they need a separate authenticated Supabase client?
2. **store_id resolution:** How does the Online Store determine the current `store_id` for Supabase queries? Is it passed as env var, URL param, or resolved from auth?
3. **Products table resolution (PREREQ-1):** Which option (A: merge, B: rename, C: extend) has been chosen? Phase 2 stories need this answer.
4. **Seed data for memberships:** Should the 3 default plans (Basic $49, Premium $99, VIP $199) be part of the migration as INSERT statements, or seeded separately?
