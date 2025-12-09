# Control Center Integration Plan

## Goal
Connect the AdminPortal (Control Center) settings to actually control the POS app behavior.

## Current State
- AdminPortal stores feature flags, system config, announcements in **IndexedDB** (browser-local)
- POS app connects to **Supabase** for stores, members, licenses, devices
- Feature flags, system config, announcements are NOT accessible by POS devices

---

## Phase 1: Feature Flags Integration (Priority: HIGH) ✅ COMPLETED

### 1.1 Create Supabase `feature_flags` table ✅
- [x] Create migration SQL for `feature_flags` table in Supabase
- [x] Add columns: id, key, name, description, category, globally_enabled, enabled_for_tiers, rollout_percentage, created_at, updated_at
- [x] Seed default feature flags (turn-tracker, offline-mode, etc.)

### 1.2 Update AdminPortal to use Supabase for feature flags ✅
- [x] Add feature flags CRUD to `supabaseDatabase.ts`
- [x] Update `FeatureFlagsManagement.tsx` to use Supabase instead of IndexedDB
- [x] Added helper methods: `isEnabledForTier()`, `getEnabledForTier()`

### 1.3 Create POS feature flag service ✅
- [x] Create `src/services/featureFlagService.ts` to fetch flags from Supabase
- [x] Cache flags locally (in-memory + localStorage for offline support)
- [x] Create `useFeatureFlag(key)` React hook

### 1.4 Apply feature flags to POS features ✅
- [x] Wrap Turn Tracker modal with feature flag check (StaffSidebar.tsx)
- [x] Wrap Turn Tracker FAB with feature flag check (FrontDesk.tsx)

---

## Phase 2: System Configuration Sync (Priority: MEDIUM) - NOT STARTED

### 2.1 Create Supabase tables for system config
- [ ] Create `system_configs` table (per-tenant settings)
- [ ] Create `tax_settings`, `payment_methods` tables
- [ ] Create `service_categories`, `service_items` tables (or use existing)

### 2.2 Sync config on store activation
- [ ] When store first logs in, pull system config from Supabase
- [ ] Store config in local IndexedDB for offline use
- [ ] Create `useSystemConfig()` hook for POS components

### 2.3 Apply system config to POS
- [ ] Use tax settings in checkout calculations
- [ ] Use payment methods in payment modal
- [ ] Use tip percentages from config

---

## Phase 3: Announcements Display (Priority: LOW) - NOT STARTED

### 3.1 Create Supabase announcements table
- [ ] Migrate announcements schema to Supabase
- [ ] Add targeting fields (tier, role, store)

### 3.2 Display announcements in POS
- [ ] Create `AnnouncementBanner` component
- [ ] Fetch active announcements on app load
- [ ] Track views/dismissals

---

## Validation Checklist

### Phase 1 - Ready to Test
- [ ] Toggle "Turn Tracker" globally_enabled OFF in Control Center → Turn Tracker FAB and modal disappear from Front Desk
- [ ] Toggle "Turn Tracker" enabled_for_basic OFF → Basic tier stores don't see Turn Tracker

### Phase 2 & 3 - Future
- [ ] Toggle "Offline Mode" off → Option not available in device settings
- [ ] Change tax rate in Control Center → Checkout uses new rate
- [ ] Create announcement → Shows in POS app

---

## Files Changed (Phase 1)

| File | Change |
|------|--------|
| `src/admin/db/supabase-schema.sql` | Added `feature_flags` table definition |
| `src/admin/db/supabaseDatabase.ts` | Added `featureFlagsDB` CRUD operations |
| `src/admin/pages/FeatureFlagsManagement.tsx` | Changed import to use Supabase |
| `src/services/featureFlagService.ts` | **NEW** - Service to fetch/cache flags |
| `src/hooks/useFeatureFlag.ts` | **NEW** - React hooks for feature flags |
| `src/components/StaffSidebar.tsx` | Added feature flag check for Turn Tracker modal |
| `src/components/FrontDesk.tsx` | Added feature flag check for Turn Tracker FAB |
| `scripts/create-feature-flags-table.ts` | **NEW** - Migration script |

---

## Review Section

### What was accomplished:
1. Created `feature_flags` table in Supabase with all necessary columns
2. Seeded 8 default feature flags including `turn-tracker` and `offline-mode`
3. Built a complete feature flag service with caching for offline support
4. Created React hooks (`useFeatureFlag`, `useFeatureFlags`) for easy consumption
5. Applied feature flag gating to Turn Tracker (FAB and modal)
6. Updated AdminPortal to manage flags via Supabase

### Architecture:
```
Control Center (AdminPortal)
       ↓ writes to
    Supabase
       ↓ reads from
  featureFlagService
       ↓ consumed by
   useFeatureFlag hook
       ↓ gates
    POS Features
```

### Next Steps:
1. Test the Turn Tracker feature flag toggle in Control Center
2. Add more features to the flag gating (e.g., Offline Mode)
3. Implement Phase 2 (System Config) when needed
