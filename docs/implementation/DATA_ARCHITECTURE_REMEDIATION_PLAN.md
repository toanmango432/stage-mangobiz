# Data Architecture Remediation Plan

> **Purpose:** Comprehensive implementation plan for fixing systemic data flow issues across the Mango POS codebase.
> **Created:** 2026-01-30
> **Status:** Ready for execution
> **Estimated Effort:** 10-16 days

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Analysis](#problem-analysis)
3. [Phase 1: Critical Fixes](#phase-1-critical-fixes)
4. [Phase 2: Data Access Enforcement](#phase-2-data-access-enforcement)
5. [Phase 3: Redux Consolidation](#phase-3-redux-consolidation)
6. [Phase 4: Schema Completion](#phase-4-schema-completion)
7. [Phase 5: Sync Architecture Fixes](#phase-5-sync-architecture-fixes)
8. [Phase 6: Standardization](#phase-6-standardization)
9. [Testing & Validation](#testing--validation)
10. [File Reference](#file-reference)

---

## Executive Summary

A deep analysis revealed **systemic data flow issues** across ALL major data domains. The codebase is in a mid-migration state between multiple architectural patterns, causing:

- Multiple sources of truth for the same data
- Direct database bypasses of the established `dataService` pattern
- Incomplete sync coverage (only 7 of 42+ entities sync)
- Missing type adapters and field mappings
- Inconsistent Redux slice patterns

### Root Cause Example

**Symptom:** 17 team members visible in Team Settings, 0 in Front Desk/Book pages.

**Cause:** Team Settings queries `members` table via `memberService.ts`, while Front Desk/Book query `staff` table via `dataService`. Two different tables, no synchronization.

---

## Problem Analysis

### Issues By Domain

| Domain | Severity | Key Issue |
|--------|----------|-----------|
| **Staff/Team** | CRITICAL | Dual tables (`members` vs `staff`), dataService bypass |
| **Clients** | CRITICAL | 6 files bypass Redux, missing type adapters |
| **Gift Cards** | CRITICAL | 8 files bypass dataService, no Redux state |
| **Transactions** | CRITICAL | Missing fields in adapter (tax, discount, clientName) |
| **Appointments** | CRITICAL | Duplicate adapters, hardcoded missing fields |
| **Tickets** | CRITICAL | backgroundSync bypasses table services |
| **Catalog** | MEDIUM | Deprecated Redux slice coexists with useCatalog hook |
| **Sync** | CRITICAL | Only 7 of 42+ entities sync, 2 competing sync systems |

---

## Phase 1: Critical Fixes

**Goal:** Fix immediate blocking issues
**Effort:** 1-2 days
**Priority:** HIGHEST

### Story 1.1: Staff/Team Data Unification

**Description:** Unify staff data source so Team Settings uses the same data as Front Desk/Book.

**Acceptance Criteria:**
- [ ] TeamSettings.tsx uses `fetchTeamMembers()` thunk instead of `fetchSupabaseMembers()`
- [ ] Data from `members` table is migrated to `staff` table
- [ ] memberService.ts is marked as deprecated with console warnings
- [ ] Staff appears in Front Desk and Book pages after adding in Team Settings

**Files to Modify:**
```
apps/store-app/src/components/team-settings/TeamSettings.tsx
apps/store-app/src/components/team-settings/hooks/useTeamMemberData.ts
apps/store-app/src/services/supabase/memberService.ts
apps/store-app/src/store/slices/team/teamThunks.ts
```

**Implementation Steps:**

1. **Update TeamSettings.tsx** (lines 106-149):
   - Remove import of `fetchSupabaseMembers` from memberService
   - Change `loadData()` to always use `dispatch(fetchTeamMembers(storeId))`
   - Remove the Supabase-first logic, use Redux thunk consistently

2. **Update teamThunks.ts** `fetchTeamMembers`:
   - Already has Supabase fallback (added previously)
   - Ensure it populates Redux state correctly

3. **Mark memberService.ts as deprecated**:
   - Add deprecation notice at top of file
   - Add console.warn to all exported functions

4. **Create migration script** (one-time):
   - Query all records from `members` table
   - Map fields to `staff` table schema
   - Insert into `staff` table (upsert to avoid duplicates)

**Forbidden:**
- Do NOT delete memberService.ts yet (keep for rollback)
- Do NOT modify the `members` table schema

---

### Story 1.2: Fix Gift Card dataService Bypass

**Description:** Update gift card components to use `dataService.giftCards` instead of direct `giftCardDB` access.

**Acceptance Criteria:**
- [ ] No direct imports of `giftCardDB` in components
- [ ] All gift card operations go through dataService
- [ ] Gift card redemption works correctly
- [ ] No console errors related to gift cards

**Files to Modify:**
```
apps/store-app/src/components/checkout/GiftCardRedeemModal.tsx
apps/store-app/src/components/checkout/CheckoutModal.tsx
apps/store-app/src/components/checkout/PaymentModal/usePaymentModal.ts
apps/store-app/src/components/giftcards/GiftCardDetailModal.tsx
apps/store-app/src/components/giftcards/GiftCardLiabilityReport.tsx
apps/store-app/src/components/giftcards/GiftCardManagement.tsx
apps/store-app/src/components/giftcards/GiftCardSalesReport.tsx
```

**Implementation Pattern:**
```typescript
// BEFORE (wrong):
import { giftCardDB } from '@/db/giftCardOperations';
const giftCard = await giftCardDB.getGiftCardByCode(storeId, code);

// AFTER (correct):
import { dataService } from '@/services/dataService';
const giftCard = await dataService.giftCards.getByCode(storeId, code);
```

**Methods to Replace:**
| Old (giftCardDB) | New (dataService.giftCards) |
|------------------|----------------------------|
| `getGiftCardByCode()` | `getByCode()` |
| `getAllGiftCards()` | `getAll()` |
| `redeemGiftCard()` | `redeem()` |
| `reloadGiftCard()` | `reload()` |
| `voidGiftCard()` | `void()` |
| `getTotalLiability()` | `getLiability()` |
| `getExpiringGiftCards()` | `getExpiring()` |
| `getSalesSummary()` | `getSalesSummary()` |
| `getTransactionsByGiftCard()` | `getTransactions()` |

---

### Story 1.3: Create Client Type Adapter

**Description:** Create missing `clientAdapter.ts` for snake_case ↔ camelCase conversion.

**Acceptance Criteria:**
- [ ] `clientAdapter.ts` exists with `toClient()`, `toClientInsert()`, `toClientUpdate()` functions
- [ ] Handles all fields from ClientRow type
- [ ] No hardcoded default values for required fields

**File to Create:**
```
apps/store-app/src/services/supabase/adapters/clientAdapter.ts
```

**Template:**
```typescript
/**
 * Client Type Adapter
 * Converts between Supabase ClientRow (snake_case) and App Client (camelCase)
 */

import type { ClientRow, ClientInsert, ClientUpdate } from '../types';
import type { Client } from '@/types';

export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    storeId: row.store_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || '',
    phone: row.phone || '',
    // ... map all fields
    syncStatus: row.sync_status,
    syncVersion: row.sync_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toClientInsert(client: Partial<Client>, storeId: string): ClientInsert {
  return {
    store_id: storeId,
    first_name: client.firstName || '',
    last_name: client.lastName || '',
    email: client.email,
    phone: client.phone,
    // ... map all fields
  };
}

export function toClientUpdate(updates: Partial<Client>): ClientUpdate {
  const result: ClientUpdate = {};
  if (updates.firstName !== undefined) result.first_name = updates.firstName;
  if (updates.lastName !== undefined) result.last_name = updates.lastName;
  // ... map all updatable fields
  return result;
}

export function toClients(rows: ClientRow[]): Client[] {
  return rows.map(toClient);
}
```

---

## Phase 2: Data Access Enforcement

**Goal:** Ensure all data access goes through dataService
**Effort:** 2-3 days

### Story 2.1: Fix Client Direct DB Access in Book Module

**Description:** Update Book module components to use Redux selectors instead of direct `clientsDB` access.

**Acceptance Criteria:**
- [ ] No `clientsDB` imports in Book components
- [ ] Client search uses Redux selectors or dataService
- [ ] Client data is consistent across Book and other modules

**Files to Modify:**
```
apps/store-app/src/components/Book/QuickClientModal.tsx
apps/store-app/src/components/Book/GroupBookingModal.tsx
apps/store-app/src/components/Book/NewAppointmentModal.v2.tsx
apps/store-app/src/components/Book/AppointmentDetailsModal.tsx
apps/store-app/src/components/Book/hooks/useAppointmentClients.ts
```

**Implementation Pattern:**
```typescript
// BEFORE (wrong):
import { clientsDB } from '@/db/database';
const results = await clientsDB.search(storeId, query);

// AFTER (correct):
import { useAppSelector } from '@/store/hooks';
import { selectClientsBySearch } from '@/store/slices/clientsSlice';
// OR for async operations:
import { dataService } from '@/services/dataService';
const results = await dataService.clients.search(query);
```

---

### Story 2.2: Fix SupabaseSyncProvider Bypass

**Description:** Update SupabaseSyncProvider to use dataService instead of direct Supabase calls.

**Acceptance Criteria:**
- [ ] No direct `supabase.from()` calls in SupabaseSyncProvider
- [ ] Uses dataService for all data operations
- [ ] Sync still works correctly

**File to Modify:**
```
apps/store-app/src/providers/SupabaseSyncProvider.tsx
```

**Look for patterns like:**
```typescript
// WRONG:
const { data } = await supabase.from('appointments').select('*');

// CORRECT:
const data = await dataService.appointments.getByDate(date);
```

---

### Story 2.3: Fix Background Sync Service Bypass

**Description:** Update backgroundSyncService to use table services instead of raw Supabase calls.

**Acceptance Criteria:**
- [ ] Uses `ticketsTable`, `appointmentsTable`, etc. instead of `supabase.from()`
- [ ] Proper type adapters are used for all operations
- [ ] Sync operations succeed without errors

**File to Modify:**
```
apps/store-app/src/services/backgroundSyncService.ts
```

**Implementation Pattern:**
```typescript
// BEFORE (lines ~356):
const { error } = await supabase.from('tickets').upsert({ ...insert, id });

// AFTER:
import { ticketsTable } from '@/services/supabase/tables/ticketsTable';
await ticketsTable.upsert(insert);
```

---

### Story 2.4: Add ESLint Rule for Direct DB Access

**Description:** Create ESLint rule to prevent direct database imports in components.

**Acceptance Criteria:**
- [ ] ESLint warns on `import { clientsDB }` in components
- [ ] ESLint warns on `import { giftCardDB }` in components
- [ ] ESLint warns on `import { supabase }` outside services layer

**File to Modify:**
```
.eslintrc.js (or eslint.config.js)
```

**Rule Configuration:**
```javascript
// Add to rules:
'no-restricted-imports': ['error', {
  patterns: [
    {
      group: ['**/db/database', '**/db/*Operations'],
      importNames: ['clientsDB', 'giftCardDB', 'ticketsDB', 'appointmentsDB'],
      message: 'Use dataService instead of direct DB access in components.'
    },
    {
      group: ['**/supabase/client'],
      importNames: ['supabase'],
      message: 'Use dataService or table services instead of direct Supabase access.'
    }
  ]
}]
```

---

## Phase 3: Redux Consolidation

**Goal:** Clear, consistent Redux patterns across all domains
**Effort:** 2-3 days

### Story 3.1: Define Staff Slice Boundaries

**Description:** Clarify responsibilities between teamSlice, staffSlice, and uiStaffSlice.

**Architecture:**
```
teamSlice:     Full TeamMemberSettings (schedules, permissions, services)
               - Source of truth for team data
               - Fetched via fetchTeamMembers()

staffSlice:    Derived/lightweight staff info for UI dropdowns
               - Selectors derive from teamSlice OR direct simple fetch
               - Used for quick staff lookups

uiStaffSlice:  Transient UI state only
               - Selected staff, filters, sort order
               - No fetching, purely UI state
```

**Acceptance Criteria:**
- [ ] teamSlice is the source of truth for full staff data
- [ ] staffSlice either derives from teamSlice OR is deprecated
- [ ] uiStaffSlice only contains UI state (no data fetching)
- [ ] Single `fetchTeamMembers()` call populates relevant slices

---

### Story 3.2: Create giftCardsSlice

**Description:** Add gift cards to Redux state management.

**Acceptance Criteria:**
- [ ] `giftCardsSlice.ts` exists with proper state shape
- [ ] Selectors: `selectGiftCardByCode`, `selectGiftCardsByStatus`, `selectAllGiftCards`
- [ ] Thunks for CRUD operations
- [ ] Components use Redux state for gift cards

**File to Create:**
```
apps/store-app/src/store/slices/giftCardsSlice.ts
```

**State Shape:**
```typescript
interface GiftCardsState {
  items: GiftCard[];
  loading: boolean;
  error: string | null;
  selectedGiftCardId: string | null;
}
```

---

### Story 3.3: Consolidate Client Thunks

**Description:** Remove dual thunk system in clientsSlice (legacy vs Supabase).

**Acceptance Criteria:**
- [ ] Single set of thunks (Supabase-based)
- [ ] Legacy thunks removed or deprecated
- [ ] All components use consistent thunk names

**File to Modify:**
```
apps/store-app/src/store/slices/clientsSlice/thunks.ts
```

**Deprecate these (use Supabase versions):**
- `fetchClients` → use `fetchClientsFromSupabase`
- `createClient` → use `createClientInSupabase`
- `updateClient` → use `updateClientInSupabase`
- `deleteClient` → use `deleteClientInSupabase`

---

## Phase 4: Schema Completion

**Goal:** All fields needed by app exist in database
**Effort:** 1-2 days

### Story 4.1: Add Missing Appointment Columns

**Description:** Add missing columns to appointments table in Supabase.

**Columns to Add:**
```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'walk_in';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_modified_by TEXT DEFAULT 'system';
```

**File to Create:**
```
packages/supabase/migrations/YYYYMMDD_add_appointment_fields.sql
```

---

### Story 4.2: Add Missing Ticket Columns

**Description:** Add missing columns to tickets table.

**Columns to Add:**
```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_modified_by TEXT DEFAULT 'system';
```

---

### Story 4.3: Add Missing Transaction Columns

**Description:** Add missing columns to transactions table.

**Columns to Add:**
```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_name TEXT;
```

---

### Story 4.4: Update Type Adapters

**Description:** Update adapters to use new columns instead of hardcoded values.

**Files to Modify:**
```
apps/store-app/src/services/supabase/adapters/appointmentAdapter.ts
apps/store-app/src/services/supabase/adapters/ticketAdapter.ts
apps/store-app/src/services/supabase/adapters/transactionAdapter.ts
```

**Pattern:**
```typescript
// BEFORE:
createdBy: 'system', // Hardcoded

// AFTER:
createdBy: row.created_by || 'system',
```

---

### Story 4.5: Remove Duplicate Adapters

**Description:** Keep only `packages/supabase/src/adapters/` versions, remove store-app duplicates.

**Files to DELETE (after updating imports):**
```
apps/store-app/src/services/supabase/adapters/appointmentAdapter.ts
```

**Files to KEEP:**
```
packages/supabase/src/adapters/appointmentAdapter.ts
```

**Update imports in:**
- `SupabaseSyncProvider.tsx`
- `hydrationService.ts`
- Any file importing from store-app adapter path

---

## Phase 5: Sync Architecture Fixes

**Goal:** Reliable, comprehensive sync
**Effort:** 3-4 days

### Story 5.1: Resolve Competing Sync Systems

**Description:** Choose between syncManager.ts and backgroundSyncService.ts.

**Recommendation:** Keep `backgroundSyncService.ts` (more comprehensive), integrate useful parts from `syncManager.ts`.

**Acceptance Criteria:**
- [ ] Single sync system active
- [ ] Other system removed or clearly deprecated
- [ ] Documentation updated

**Files:**
```
apps/store-app/src/services/syncManager.ts (DEPRECATE)
apps/store-app/src/services/backgroundSyncService.ts (KEEP/ENHANCE)
```

---

### Story 5.2: Add Initial Data Hydration

**Description:** Load data immediately on app start, don't wait 2 minutes.

**Acceptance Criteria:**
- [ ] Data loads within 5 seconds of login
- [ ] Loading state shown during hydration
- [ ] App is usable after hydration completes

**Implementation:**
```typescript
// In AppShell.tsx or SupabaseSyncProvider.tsx
useEffect(() => {
  if (isAuthenticated && storeId) {
    // Hydrate critical data immediately
    Promise.all([
      dispatch(fetchTeamMembers(storeId)),
      dispatch(fetchClientsFromSupabase()),
      dispatch(fetchAppointmentsFromSupabase(new Date())),
    ]).then(() => {
      setIsHydrated(true);
    });
  }
}, [isAuthenticated, storeId]);
```

---

### Story 5.3: Extend Sync Coverage

**Description:** Add more entities to sync (currently only 7 of 42+).

**Priority Entities to Add:**
1. Services, categories, variants (catalog)
2. Schedules, timeOff, blockedTime
3. Products
4. Store settings

**For each entity, update:**
- `backgroundSyncService.ts` - add sync handlers
- `syncQueueDB` - ensure entity type is supported
- Type adapters - ensure proper conversion

---

## Phase 6: Standardization

**Goal:** Long-term maintainability
**Effort:** 1-2 days

### Story 6.1: Create storeId Utility

**Description:** Single pattern for storeId retrieval.

**File to Create:**
```
apps/store-app/src/store/utils/getStoreId.ts
```

**Implementation:**
```typescript
import { store } from '@/store';

export function getStoreId(): string {
  const state = store.getState();
  return state.auth.store?.storeId || state.auth.storeId || '';
}

export function getStoreIdOrThrow(): string {
  const storeId = getStoreId();
  if (!storeId) {
    throw new Error('No store ID available');
  }
  return storeId;
}
```

---

### Story 6.2: Update All Services to Use Utility

**Description:** Replace inline storeId retrieval with utility function.

**Files to Update:**
```
apps/store-app/src/services/domain/teamDataService.ts
apps/store-app/src/services/domain/clientDataService.ts
apps/store-app/src/services/domain/appointmentDataService.ts
apps/store-app/src/services/syncManager.ts
apps/store-app/src/services/backgroundSyncService.ts
```

**Pattern:**
```typescript
// BEFORE:
const state = store.getState();
const storeId = state.auth.store?.storeId || state.auth.storeId || '';

// AFTER:
import { getStoreId } from '@/store/utils/getStoreId';
const storeId = getStoreId();
```

---

### Story 6.3: Create Data Flow Documentation

**Description:** Document the final data architecture.

**File to Create:**
```
docs/architecture/DATA_FLOW.md
```

**Content:**
- Data flow diagrams
- Slice responsibilities
- dataService usage patterns
- Sync architecture
- Migration notes

---

## Testing & Validation

### Phase 1 Validation
- [ ] Team Settings shows same members as Front Desk/Book
- [ ] Adding member in Team Settings appears immediately in Front Desk
- [ ] Gift cards can be redeemed through checkout flow
- [ ] No console errors related to data fetching

### Phase 2 Validation
- [ ] `grep -r "clientsDB" apps/store-app/src/components/` returns no results
- [ ] `grep -r "giftCardDB" apps/store-app/src/components/` returns no results
- [ ] ESLint passes with new rules

### Phase 3 Validation
- [ ] Redux DevTools shows clean state structure
- [ ] Gift cards appear in Redux state
- [ ] Single thunk system per domain

### Phase 4 Validation
- [ ] All adapter fields map to database columns
- [ ] No hardcoded values in adapters (search for `'system'`, `''`)
- [ ] Audit trail works (createdBy populated correctly)

### Phase 5 Validation
- [ ] App loads data within 5 seconds of login
- [ ] Offline changes sync within 30 seconds when back online
- [ ] Single sync system active

### Overall Validation
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Manual testing: Create appointment → Create ticket → Checkout → Verify data consistency

---

## File Reference

### Files to Create
```
apps/store-app/src/services/supabase/adapters/clientAdapter.ts
apps/store-app/src/store/slices/giftCardsSlice.ts
apps/store-app/src/store/utils/getStoreId.ts
docs/architecture/DATA_FLOW.md
packages/supabase/migrations/YYYYMMDD_add_appointment_fields.sql
packages/supabase/migrations/YYYYMMDD_add_ticket_fields.sql
packages/supabase/migrations/YYYYMMDD_add_transaction_fields.sql
```

### Files to Modify (by phase)
```
# Phase 1
apps/store-app/src/components/team-settings/TeamSettings.tsx
apps/store-app/src/services/supabase/memberService.ts
apps/store-app/src/components/checkout/GiftCardRedeemModal.tsx
apps/store-app/src/components/checkout/CheckoutModal.tsx
apps/store-app/src/components/checkout/PaymentModal/usePaymentModal.ts
apps/store-app/src/components/giftcards/*.tsx

# Phase 2
apps/store-app/src/components/Book/QuickClientModal.tsx
apps/store-app/src/components/Book/GroupBookingModal.tsx
apps/store-app/src/components/Book/NewAppointmentModal.v2.tsx
apps/store-app/src/components/Book/AppointmentDetailsModal.tsx
apps/store-app/src/components/Book/hooks/useAppointmentClients.ts
apps/store-app/src/providers/SupabaseSyncProvider.tsx
apps/store-app/src/services/backgroundSyncService.ts
.eslintrc.js

# Phase 3
apps/store-app/src/store/slices/staffSlice.ts
apps/store-app/src/store/slices/uiStaffSlice.ts
apps/store-app/src/store/slices/team/teamSlice.ts
apps/store-app/src/store/slices/clientsSlice/thunks.ts

# Phase 4
apps/store-app/src/services/supabase/adapters/appointmentAdapter.ts
apps/store-app/src/services/supabase/adapters/ticketAdapter.ts
apps/store-app/src/services/supabase/adapters/transactionAdapter.ts

# Phase 5
apps/store-app/src/services/syncManager.ts
apps/store-app/src/services/backgroundSyncService.ts
apps/store-app/src/providers/SupabaseSyncProvider.tsx

# Phase 6
apps/store-app/src/services/domain/*.ts
```

### Files to Delete
```
apps/store-app/src/services/supabase/adapters/appointmentAdapter.ts (duplicate)
```

### Files to Deprecate (not delete yet)
```
apps/store-app/src/services/supabase/memberService.ts
apps/store-app/src/services/syncManager.ts
```

---

## Risk Mitigation

1. **Data Loss:** Back up `members` and `staff` tables before migration
2. **Breaking Changes:** Feature flags for new patterns where possible
3. **Financial Data:** Extra validation for gift card/transaction changes
4. **Rollback Plan:** Keep deprecated services until migration verified
5. **Testing:** Run full test suite after each phase

---

## Notes for Executing Agent

1. **Execute phases in order** - Later phases depend on earlier ones
2. **Run tests after each story** - Catch regressions early
3. **Commit after each story** - Small, reversible changes
4. **Check console for errors** - Many issues manifest as runtime errors
5. **Verify in UI** - Automated tests don't catch all issues
6. **Ask for clarification** - If something is unclear, don't guess

**Commit Message Format:**
```
fix(data-arch): [Phase X.Y] Brief description

Detailed explanation of changes.

Refs: DATA_ARCHITECTURE_REMEDIATION_PLAN.md
```
