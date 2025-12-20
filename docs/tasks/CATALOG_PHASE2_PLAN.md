# Catalog Module Phase 2 - Technical Review & Implementation Plan

## Pre-Implementation Technical Review

### Summary of Findings

After reviewing the technical documentation and existing codebase, I identified **one critical technical debt issue** that should be addressed:

---

## ⚠️ CRITICAL: Technical Debt Identified

### Issue: Catalog Types Do NOT Extend BaseSyncableEntity

**Location:** `src/types/catalog.ts`

**Problem:** The catalog types (ServiceCategory, MenuService, ServiceVariant, etc.) use a **simplified sync pattern** instead of the production-ready `BaseSyncableEntity` pattern defined in `src/types/common.ts` and documented in `DATA_STORAGE_STRATEGY.md`.

**Current Pattern (catalog.ts):**
```typescript
export interface MenuService {
  id: string;
  salonId: string;           // ❌ Uses salonId (legacy)
  // ... fields ...
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
  createdBy?: string;        // ❌ Optional
  lastModifiedBy?: string;   // ❌ Optional
}
```

**Required Pattern (BaseSyncableEntity):**
```typescript
export interface BaseSyncableEntity {
  id: string;
  tenantId: string;          // ✅ Multi-tenant
  storeId: string;           // ✅ Store isolation
  locationId?: string;       // ✅ Location support
  syncStatus: SyncStatus;
  version: number;           // ✅ Required for conflict detection
  vectorClock: VectorClock;  // ✅ Required for multi-device sync
  lastSyncedVersion: number; // ✅ Required for sync delta
  createdAt: string;         // ✅ ISO string (not Date)
  updatedAt: string;
  createdBy: string;         // ✅ Required (not optional)
  createdByDevice: string;   // ✅ Device tracking
  lastModifiedBy: string;
  lastModifiedByDevice: string;
  isDeleted: boolean;        // ✅ Tombstone pattern
  // ... soft delete fields
}
```

**Missing in Catalog Types:**
1. ❌ `tenantId` - Multi-tenant isolation
2. ❌ `storeId` - Uses `salonId` instead (naming inconsistency)
3. ❌ `locationId` - Multi-location support
4. ❌ `version` - Monotonic counter for conflicts
5. ❌ `vectorClock` - Multi-device conflict detection
6. ❌ `lastSyncedVersion` - Sync delta tracking
7. ❌ `createdByDevice` / `lastModifiedByDevice` - Device audit trail
8. ❌ `isDeleted` / tombstone fields - Soft delete pattern
9. ❌ Timestamps use `Date` instead of ISO strings

---

## Decision Point: Fix Technical Debt First?

### Option A: Fix Now (Recommended for Long-Term)
- Migrate catalog types to extend `BaseSyncableEntity`
- Create database migration (Version 7)
- Update all CRUD operations in `catalogDatabase.ts`
- **Impact:** ~4-6 hours, but prevents future sync issues

### Option B: Defer (Ship Phase 2 Faster)
- Proceed with Phase 2 using current simplified pattern
- Document debt for future sprint
- **Risk:** Sync conflicts in multi-device scenarios

### Option C: Hybrid (Pragmatic)
- Add only critical fields (`version`, `isDeleted`) now
- Full migration in dedicated sprint
- **Impact:** ~2 hours, provides basic conflict handling

---

## Phase 2 Implementation Tasks

### ✅ Ready to Implement (No Changes Needed to Types)

| # | Task | Complexity | Files to Modify |
|---|------|------------|-----------------|
| 2.1 | 3 Extra Time Types UI | 5/10 | `ServiceModal.tsx` |
| 2.2 | SKU Field | 2/10 | `catalog.ts`, `ServiceModal.tsx` |
| 2.3 | Service Cost/COGS | 2/10 | `catalog.ts`, `ServiceModal.tsx` |
| 2.4 | Bundle Booking Mode UI | 6/10 | Already in types, needs UI |
| 2.6 | Rebook Reminder | 3/10 | Already in types (`rebookReminderDays`) |
| 2.7 | Aftercare Instructions | 2/10 | `catalog.ts`, `ServiceModal.tsx` |
| 2.8 | Patch Test Flag | 2/10 | `catalog.ts`, `ServiceModal.tsx` |

### ⚠️ Needs Discussion

| # | Task | Concern |
|---|------|---------|
| 2.5 | Staff Permissions with Real Data | Need to verify staff data source (Redux vs Dexie) |

---

## Todo Checklist

- [x] **Decision:** Option B chosen - defer technical debt, ship Phase 2 faster
- [x] Task 2.1: Implement 3 Extra Time Types dropdown (processing/blocked/finishing)
- [x] Task 2.2: Add SKU field to MenuService type and ServiceModal
- [x] Task 2.3: Add cost/COGS field to MenuService type and ServiceModal
- [x] Task 2.4: Add Bundle Booking Mode selector in Package UI
- [x] Task 2.5: Connect Staff Permissions to real staff data (already implemented via Redux teamSlice)
- [x] Task 2.6: Add Rebook Reminder field in ServiceModal
- [x] Task 2.7: Add Aftercare Instructions textarea in ServiceModal
- [x] Task 2.8: Add Patch Test Required toggle in ServiceModal
- [ ] Review: Verify all changes on frontend

---

## Review Section

### Phase 2 Implementation Complete - Dec 1, 2025

**Files Modified:**
1. `src/types/catalog.ts` - Added `sku`, `aftercareInstructions`, `requiresPatchTest` fields
2. `src/components/menu-settings/constants.ts` - Added `EXTRA_TIME_TYPES`, `REBOOK_REMINDER_OPTIONS`, `BUNDLE_BOOKING_MODES`
3. `src/components/menu-settings/modals/ServiceModal.tsx` - Added UI for all new service fields
4. `src/components/menu-settings/modals/PackageModal.tsx` - Added Bundle Booking Mode selector

**Features Added:**
- Extra Time Type selector (Processing/Blocked/Finishing) in ServiceModal Pricing tab
- SKU field in ServiceModal Advanced tab
- Cost (COGS) field in ServiceModal Advanced tab
- Patch Test Required toggle in ServiceModal Advanced tab
- Rebook Reminder dropdown in ServiceModal Advanced tab
- Aftercare Instructions textarea in ServiceModal Advanced tab
- Bundle Booking Mode selector (Single Session/Multiple Visits) in PackageModal

**Note:** Staff Permissions section was already fully implemented with real Redux data via `teamSlice`.
