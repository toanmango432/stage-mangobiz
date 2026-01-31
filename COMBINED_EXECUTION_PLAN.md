# Combined Execution Plan: Data Architecture + Tech Debt

> **Created:** 2026-01-31
> **Purpose:** Unified plan combining Data Architecture fixes with TypeScript tech debt
> **Total Effort:** 12-18 days
> **Execution Order:** Data Architecture FIRST, then Tech Debt

---

## Why Combined?

The two plans have significant overlap:
- Both modify type adapters
- Both touch teamThunks.ts
- Both refactor backgroundSyncService
- Both affect Redux store patterns

**Data Architecture must run first** because it changes the fundamental logic. Running Tech Debt first would create code that Data Arch would then rewrite.

---

## Phase A: Data Architecture Critical Fixes (Days 1-2)

### A.1: Staff/Team Data Unification
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 1.1
**Priority:** CRITICAL

Update TeamSettings.tsx to use `fetchTeamMembers()` thunk instead of `fetchSupabaseMembers()`. Unify staff data source.

**Files:**
- apps/store-app/src/components/team-settings/TeamSettings.tsx
- apps/store-app/src/store/slices/team/teamThunks.ts
- apps/store-app/src/services/supabase/memberService.ts (deprecate)

**Acceptance:** Staff appears in Front Desk and Book pages after adding in Team Settings.

---

### A.2: Gift Card dataService Integration
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 1.2
**Priority:** CRITICAL

Replace all `giftCardDB` imports with `dataService.giftCards`.

**Files:**
- apps/store-app/src/components/checkout/GiftCardRedeemModal.tsx
- apps/store-app/src/components/checkout/CheckoutModal.tsx
- apps/store-app/src/components/giftcards/*.tsx (7 files)

**Acceptance:** No direct `giftCardDB` imports in components.

---

### A.3: Create Client Type Adapter
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 1.3
**Priority:** HIGH

Create `clientAdapter.ts` for snake_case ↔ camelCase conversion.

**Files:**
- apps/store-app/src/services/supabase/adapters/clientAdapter.ts (create)

**Note:** This also addresses Tech Debt Task 2.1 (type definitions).

---

## Phase B: Data Access Enforcement (Days 3-4)

### B.1: Fix Client Direct DB Access
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 2.1

Replace `clientsDB` imports with Redux selectors or dataService.

**Files:**
- apps/store-app/src/components/Book/QuickClientModal.tsx
- apps/store-app/src/components/Book/GroupBookingModal.tsx
- apps/store-app/src/components/Book/NewAppointmentModal.v2.tsx
- apps/store-app/src/components/Book/hooks/useAppointmentClients.ts

---

### B.2: Fix SupabaseSyncProvider
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 2.2

Replace direct `supabase.from()` calls with dataService.

**Files:**
- apps/store-app/src/providers/SupabaseSyncProvider.tsx

---

### B.3: Fix Background Sync Service
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 2.3
**Note:** Also addresses Tech Debt Task 3.5 (store dependencies)

Replace raw Supabase calls with table services.

**Files:**
- apps/store-app/src/services/backgroundSyncService.ts

---

### B.4: Add ESLint Rule for DB Access
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 2.4

Prevent direct database imports in components.

**Files:**
- .eslintrc.js

---

## Phase C: Redux Consolidation (Days 5-6)

### C.1: Define Staff Slice Boundaries
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 3.1

Clarify teamSlice vs staffSlice vs uiStaffSlice.

---

### C.2: Create giftCardsSlice
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 3.2

Add gift cards to Redux state.

**Files:**
- apps/store-app/src/store/slices/giftCardsSlice.ts (create)

---

### C.3: Consolidate Client Thunks
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 3.3

Remove dual thunk system.

**Files:**
- apps/store-app/src/store/slices/clientsSlice/thunks.ts

---

## Phase D: Schema & Adapters (Days 7-8)

### D.1-D.3: Add Missing Database Columns
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Stories 4.1-4.3

```sql
-- appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'walk_in';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
```

---

### D.4: Update Type Adapters
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 4.4
**Note:** Also addresses Tech Debt Task 2.1

Remove hardcoded values, use new columns.

**Files:**
- apps/store-app/src/services/supabase/adapters/appointmentAdapter.ts
- apps/store-app/src/services/supabase/adapters/ticketAdapter.ts
- apps/store-app/src/services/supabase/adapters/transactionAdapter.ts

---

### D.5: Remove Duplicate Adapters
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 4.5

Keep only packages/supabase/src/adapters/ versions.

---

## Phase E: Sync Architecture (Days 9-10)

### E.1: Resolve Competing Sync Systems
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 5.1

Keep backgroundSyncService, deprecate syncManager.

---

### E.2: Add Initial Data Hydration
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 5.2

Load data within 5 seconds of login.

---

### E.3: Extend Sync Coverage
**From:** DATA_ARCHITECTURE_REMEDIATION_PLAN.md Story 5.3

Add more entities to sync (7 → 20+).

---

## Phase F: UI Package Tech Debt (Days 11-12)
**From:** EXECUTION_PLAN.md Phase 1
**Note:** No overlap with Data Arch, can run parallel

### F.1: Create @mango/ui lib/utils module
### F.2: Create @mango/ui hooks module
### F.3: Fix @mango/ui internal imports
### F.4: Add missing @mango/ui dependencies
### F.5: Fix @mango/ui type errors

---

## Phase G: Utils & MQTT Tech Debt (Days 13-14)
**From:** EXECUTION_PLAN.md Phases 2-3
**Note:** Reduced scope after Data Arch fixes

### G.1: Move remaining types to @mango/types
(Some already done by Phase D)

### G.2: Fix remaining @mango/utils imports

### G.3: Fix @mango/mqtt Vite env types

### G.4: Fix @mango/mqtt MqttClient API
(backgroundSyncService already refactored in Phase B)

---

## Phase H: Store App Tech Debt (Days 15-16)
**From:** EXECUTION_PLAN.md Phase 4
**Note:** Task 4.5 (team thunks) already done by Phase A

### H.1: Fix RefObject null types
### H.2: Fix callback ref returns
### H.3: Fix Icon size props
### H.4: Add JSX namespace
### H.5: Fix Toast type mismatch
### H.6: Fix performance.ts

---

## Phase I: Online Store & CI (Days 17-18)
**From:** EXECUTION_PLAN.md Phases 5-6

### I.1: Fix test setup for jest-dom
### I.2: Fix test mocks
### I.3: Fix component props
### I.4: Fix framer-motion types
### I.5: Re-enable typechecks
### I.6: Re-enable CI workflow

---

## Dependency Graph

```
Phase A (Critical Data Fixes)
    ↓
Phase B (Data Access Enforcement)
    ↓
Phase C (Redux Consolidation)
    ↓
Phase D (Schema & Adapters) ←→ Phase F (UI Package - parallel)
    ↓
Phase E (Sync Architecture) ←→ Phase G (Utils/MQTT - parallel)
    ↓
Phase H (Store App Tech Debt)
    ↓
Phase I (Online Store & CI - Final)
```

---

## Tonight's Ralph Session

**Run Order:**
1. Phase A: Data Architecture Critical Fixes
2. Phase B: Data Access Enforcement
3. Phase F: UI Package (parallel-safe)

**Estimated Stories:** 7-10 completed overnight
