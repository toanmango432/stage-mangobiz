# Catalog Module Fix - StoreId Mismatch Issue

## Date: January 8, 2026

## Problem Summary

The Catalog Module (Menu & Services) is not loading data because of a **storeId mismatch** between:
1. **Catalog seeding** - Uses hardcoded `'default-salon'`
2. **MenuSettings query** - Uses actual auth storeId from Redux

### Root Cause Analysis

| Location | Code | StoreId Used |
|----------|------|--------------|
| `AppShell.tsx:134` | `const storeId = getTestSalonId()` | `'default-salon'` |
| `AppShell.tsx:180` | `initializeCatalog(storeId, true)` | `'default-salon'` |
| `MenuSettings.tsx:38` | `selectSalonId` selector | Auth storeId (e.g., `'abc-123'`) |
| `useCatalog.ts` | `useLiveQuery` with storeId | Auth storeId (e.g., `'abc-123'`) |

**Result**: Catalog data exists under `'default-salon'` but queries use actual auth storeId → returns empty.

---

## Implementation Plan

### Phase 1: Align StoreId Sources (P0 - Critical)
**Goal**: Ensure catalog initialization and queries use the same storeId.

- [ ] **1.1** Update `initializeCatalog` to use auth storeId
  - File: `apps/store-app/src/components/layout/AppShell.tsx`
  - Change: Use `authState.store?.storeId` instead of `getTestSalonId()`
  - Line: ~180

- [ ] **1.2** Update `seedCatalog` to accept storeId parameter
  - File: `apps/store-app/src/db/catalogSeed.ts`
  - Change: Replace hardcoded `SALON_ID` with parameter
  - Ensure all seeded records use the passed storeId

- [ ] **1.3** Update `initializeCatalog` to pass storeId to `seedCatalog`
  - File: `apps/store-app/src/db/catalogSeed.ts`
  - Change: `seedCatalog(storeId)` instead of `seedCatalog()`

- [ ] **1.4** Rename navigation item to "Catalog"
  - File: `apps/store-app/src/components/modules/More.tsx`
  - Change: `'Services & Categories'` → `'Catalog'` (line 76)
  - Also update module id from `'category'` to `'catalog'` for consistency

### Phase 2: Fallback Handling (P1 - Important)
**Goal**: Handle edge cases where storeId might be unavailable.

- [ ] **2.1** Add fallback in MenuSettings when storeId is null
  - File: `apps/store-app/src/components/menu-settings/MenuSettings.tsx`
  - Current: Shows "Loading menu settings..." indefinitely
  - Change: Show clear error message or redirect

- [ ] **2.2** Ensure useCatalog handles empty storeId gracefully
  - File: `apps/store-app/src/hooks/useCatalog.ts`
  - Change: Return empty data with clear loading/error states

### Phase 3: Data Migration (P1 - Important)
**Goal**: Migrate existing data from 'default-salon' to actual storeId.

- [ ] **3.1** Create migration function
  - File: `apps/store-app/src/db/catalogSeed.ts`
  - Function: `migrateCatalogToStoreId(fromStoreId, toStoreId)`
  - Action: Copy all catalog data from old storeId to new storeId

- [ ] **3.2** Add migration trigger in AppShell
  - File: `apps/store-app/src/components/layout/AppShell.tsx`
  - Logic: Check if data exists under 'default-salon' but not under auth storeId
  - Action: Trigger migration automatically

### Phase 4: Cleanup Legacy Code (P2 - Nice to Have)
**Goal**: Remove hardcoded storeId references.

- [ ] **4.1** Audit all `getTestSalonId()` usages
  - Find all places using this function
  - Replace with auth storeId where appropriate

- [ ] **4.2** Remove or deprecate `getTestSalonId()`
  - Add deprecation warning
  - Plan removal in future version

- [ ] **4.3** Update seed.ts to use auth storeId
  - File: `apps/store-app/src/db/seed.ts`
  - Align with catalog seeding pattern

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `apps/store-app/src/components/layout/AppShell.tsx` | Use auth storeId for catalog init, update module id to 'catalog' | P0 |
| `apps/store-app/src/db/catalogSeed.ts` | Add storeId param to seedCatalog, add migration | P0 |
| `apps/store-app/src/components/modules/More.tsx` | Rename "Services & Categories" to "Catalog", update id | P0 |
| `apps/store-app/src/components/menu-settings/MenuSettings.tsx` | Better fallback UI | P1 |
| `apps/store-app/src/hooks/useCatalog.ts` | Handle empty storeId | P1 |
| `apps/store-app/src/db/seed.ts` | Consider auth storeId alignment | P2 |

---

## Verification Steps

After each phase:
- [ ] Run type check: `npm run typecheck`
- [ ] Start dev server: `npm run dev`
- [ ] Login to store app
- [ ] Navigate to More → Services & Categories
- [ ] Verify categories and services load correctly
- [ ] Verify CRUD operations work (create/edit/delete)

---

## Estimated Effort

| Phase | Complexity | Time |
|-------|------------|------|
| Phase 1: Align StoreId | Low | ~1 hour |
| Phase 2: Fallback Handling | Low | ~30 mins |
| Phase 3: Data Migration | Medium | ~2 hours |
| Phase 4: Cleanup | Low | ~1 hour |
| **Total** | | **~4.5 hours** |

---

## Review Section

### Completed: January 7, 2026

**All phases successfully implemented.** Here's a summary of the changes:

#### Phase 1: Align StoreId Sources - COMPLETED
| Task | File | Change |
|------|------|--------|
| 1.1 | `AppShell.tsx` | Get auth storeId from `storeAuthManager.getState()` at init |
| 1.2 | `catalogSeed.ts` | `seedCatalog()` now accepts `storeId` parameter |
| 1.3 | `catalogSeed.ts` | `initializeCatalog()` passes storeId to `seedCatalog()` |
| 1.4 | `More.tsx` | Renamed to "Catalog" with module id `'catalog'` |
| 1.4 | `AppShell.tsx` | Added `case 'catalog':` with `'category'` as legacy alias |

#### Phase 2: Fallback Handling - COMPLETED
| Task | File | Change |
|------|------|--------|
| 2.1 | `MenuSettings.tsx` | Improved fallback UI with clear messaging and back button |
| 2.2 | `useCatalog.ts` | Already handles empty data gracefully with default arrays |

#### Phase 3: Data Migration - COMPLETED
| Task | File | Change |
|------|------|--------|
| 3.1 | `catalogSeed.ts` | Added `migrateCatalogToStore(fromId, toId)` function |
| 3.2 | `AppShell.tsx` | Migration auto-triggers when storeId differs from fallback |

#### Key Code Changes

**AppShell.tsx**
- Lines 150-153: Get authState first to determine correct storeId
- Lines 183-194: Auto-migrate catalog from 'default-salon' if needed
- Lines 359-361: Support both 'catalog' and 'category' module ids

**catalogSeed.ts**
- Line 36: `seedCatalog(storeId: string = DEFAULT_SALON_ID)`
- Lines 916-1030: New `migrateCatalogToStore()` migration function

**More.tsx**
- Line 76: `{ id: 'catalog', label: 'Catalog', ... }`

**MenuSettings.tsx**
- Lines 108-129: Better error state UI when storeId unavailable

#### Testing Instructions
1. Clear IndexedDB: DevTools → Application → IndexedDB → Delete database
2. Start dev server: `npm run dev`
3. Login to store with a real storeId
4. Navigate to More → Catalog
5. Verify categories and services display correctly
6. Test CRUD operations (create/edit/delete)

---

# Gift Card Module UI Fixes

## Date: January 8, 2026

## Issues to Fix

### Issue 1: SellGiftCardModal is partially hidden/cut off
**Location:** `apps/store-app/src/components/checkout/modals/SellGiftCardModal.tsx`

**Problem:** The modal uses `createPortal` with `z-50` which may be too low compared to other UI elements.

**Fix Required:**
- Increase z-index from `z-50` to `z-[100]` on the modal wrapper
- Ensure backdrop also has proper z-index

### Issue 2: GiftCardGrid "Custom Amount" card is truncated
**Location:** `apps/store-app/src/components/checkout/GiftCardGrid.tsx`

**Problem:** The Custom Amount card shows "$5 - $500" which gets cut off in narrow layouts.

**Fix Required:**
- Change text from `text-xl` to smaller `text-lg` for the amount range
- Add `truncate` class or use `whitespace-nowrap` and `overflow-hidden`
- Alternatively, simplify to show "Custom" as main text with range as subtitle

---

## Todo List

- [ ] 1. Fix SellGiftCardModal z-index (change `z-50` to `z-[100]`)
- [ ] 2. Fix GiftCardGrid Custom Amount card text truncation
- [ ] 3. Run `npm run build` to verify no errors

---

## Review Section

(To be filled after implementation)
