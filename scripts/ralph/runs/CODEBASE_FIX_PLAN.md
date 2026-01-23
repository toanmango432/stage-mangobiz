# Codebase Fix Plan

**Created:** 2026-01-23
**Status:** Ready to Execute
**Priority:** High
**Branch:** `main`
**Worktree:** `Mango-POS-Offline-V2`

---

## Executive Summary

After comprehensive review of the main branch, the following issues were identified:

| Category | Count | Priority |
|----------|-------|----------|
| packages/supabase TypeScript errors | 21 | Critical |
| Failing tests (store-app) | 22 test files | High |
| xlsx types resolution | 1 | Medium |

**Root Causes:**
1. `packages/supabase` uses `@/` path aliases that don't resolve
2. Missing dependencies in supabase package (react, @types/node)
3. Test environment issues (missing mocks, async timing)
4. MQTT service tests not properly mocked

---

## Phase 1: Fix packages/supabase TypeScript Errors (Critical)

**Estimated Time:** 30 minutes
**Risk:** Low
**Impact:** Blocks monorepo typecheck

### Issue 1.1: Path Alias Resolution

The supabase package uses `@/types/*` imports but doesn't have path aliases configured.

**Files Affected:**
- `src/adapters/appointmentAdapter.ts`
- `src/adapters/clientAdapter.ts`
- `src/adapters/serviceAdapter.ts`
- `src/adapters/staffAdapter.ts`
- `src/adapters/ticketAdapter.ts`
- `src/adapters/transactionAdapter.ts`

**Current:**
```typescript
import { Appointment } from '@/types/appointment';
```

**Fix Option A (Recommended): Use @mango/types package**
```typescript
import { Appointment } from '@mango/types';
```

**Fix Option B: Add path aliases to tsconfig**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["../../apps/store-app/src/*"]
    }
  }
}
```

### Issue 1.2: Missing Dependencies

**Add to packages/supabase/package.json:**
```json
{
  "dependencies": {
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### Issue 1.3: Invalid Import Paths

**File:** `src/memberService.ts`
```typescript
// BEFORE - Invalid path
import { TeamMemberSettings } from '../../components/team-settings/types';

// AFTER - Use types package
import type { TeamMemberSettings } from '@mango/types';
```

**File:** `src/authService.ts`
```typescript
// BEFORE - Invalid path
import { auditLogger } from '../audit/auditLogger';

// AFTER - Remove or mock (audit logger should be in store-app)
// This file may need restructuring
```

### Issue 1.4: Vite env types

**File:** `src/client.ts`
```typescript
// Add at top of file
/// <reference types="vite/client" />
```

Or add to tsconfig:
```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

### Issue 1.5: NodeJS namespace

**File:** `src/sync/supabaseSyncService.ts`
```typescript
// BEFORE
let retryTimeout: NodeJS.Timeout;

// AFTER
let retryTimeout: ReturnType<typeof setTimeout>;
```

---

## Phase 2: Fix Test Environment Issues (High)

**Estimated Time:** 2-3 hours
**Risk:** Medium

### Issue 2.1: Supabase Environment Mock

Multiple test files fail because Supabase client throws on missing env vars.

**Create:** `apps/store-app/src/testing/mocks/supabaseMock.ts`
```typescript
import { vi } from 'vitest';

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
};

vi.mock('@/services/supabase/client', () => ({
  supabase: mockSupabase,
  getSupabase: vi.fn(() => mockSupabase),
}));
```

**Add to:** `apps/store-app/vitest.config.ts` (setupFiles)

### Issue 2.2: Failing Test Files - Categorized

| Category | Files | Root Cause | Fix Strategy |
|----------|-------|------------|--------------|
| **Env Vars** | formSystem, referralSystem, reviewSystem, database, useSync | Missing Supabase mock | Add global mock |
| **React Testing** | AppointmentCard, PaymentModal, PriceChangeWarning, AddNoteModal, CreateTicketButton, MobileTeamSection | Component rendering issues | Fix test setup |
| **Redux** | authSlice, uiTicketsSlice | State initialization | Update test fixtures |
| **Integration** | ticketLifecycle, staffHooksIntegration | Complex async flow | Add waitFor/act |
| **MQTT** | mangoPadService (9 tests) | MQTT client not mocked | Mock MqttClient |

### Issue 2.3: MangoPad Service Tests

**File:** `src/services/__tests__/mangoPadService.test.ts`

**Problem:** MQTT client mock not properly set up.

**Fix:**
```typescript
vi.mock('@/services/mqtt/MqttClient', () => ({
  getMqttClient: vi.fn(() => ({
    isConnected: vi.fn().mockReturnValue(true),
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
  })),
}));
```

---

## Phase 3: Fix Individual Test Suites

### 3.1: Form System Tests
**File:** `src/testing/formSystem.test.ts`
**Error:** Supabase env vars missing
**Fix:** Add supabase mock at top

### 3.2: Referral System Tests
**File:** `src/testing/referralSystem.test.ts`
**Error:** Supabase env vars missing
**Fix:** Add supabase mock at top

### 3.3: Review System Tests
**File:** `src/testing/reviewSystem.test.ts`
**Error:** Supabase env vars missing
**Fix:** Add supabase mock at top

### 3.4: Database Tests
**File:** `src/db/__tests__/database.test.ts`
**Error:** Supabase env vars missing
**Fix:** Add supabase mock at top

### 3.5: useSync Hook Tests
**File:** `src/hooks/__tests__/useSync.test.ts`
**Error:** Supabase env vars missing
**Fix:** Add supabase mock at top

### 3.6: Component Tests (React)

**Common Pattern for All:**
```typescript
// Add before each test file
vi.mock('@/services/supabase/client', () => ({
  supabase: { /* mock */ },
  getSupabase: vi.fn(),
}));

vi.mock('@/services/audit/auditLogger', () => ({
  auditLogger: { log: vi.fn(), logClientAction: vi.fn() },
}));
```

### 3.7: Redux Slice Tests

**authSlice.test.ts:**
- Check initial state setup
- Ensure async thunks are properly mocked

**uiTicketsSlice.test.ts:**
- Check ticket state initialization
- Mock dataService calls

### 3.8: Integration Tests

**ticketLifecycle.test.ts:**
- Wrap state changes in `act()`
- Use `waitFor()` for async operations
- Ensure Redux store is properly configured

**staffHooksIntegration.test.ts:**
- Mock team data service
- Ensure staff data is properly initialized

---

## Phase 4: Fix xlsx Types Resolution (Medium)

**Estimated Time:** 10 minutes
**Risk:** Low

### Option A: Skip lib check (Current workaround)
Already works with `--skipLibCheck`

### Option B: Add explicit types declaration
**File:** `apps/store-app/src/vite-env.d.ts`
```typescript
declare module 'xlsx' {
  export * from 'xlsx';
}
```

### Option C: Use dynamic import
```typescript
// Instead of
import * as XLSX from 'xlsx';

// Use
const XLSX = await import('xlsx');
```

---

## Execution Order

| Order | Phase | Task | Est. Time | Depends On |
|-------|-------|------|-----------|------------|
| 1 | 1.1 | Fix supabase path aliases | 15 min | - |
| 2 | 1.2 | Add missing dependencies | 5 min | - |
| 3 | 1.3-1.5 | Fix remaining supabase errors | 10 min | 1.1 |
| 4 | 2.1 | Create global supabase mock | 15 min | 1 |
| 5 | 2.3 | Fix MQTT service mock | 20 min | - |
| 6 | 3.1-3.5 | Fix env-related tests | 30 min | 4 |
| 7 | 3.6 | Fix component tests | 45 min | 4 |
| 8 | 3.7 | Fix Redux tests | 30 min | 4 |
| 9 | 3.8 | Fix integration tests | 45 min | 4, 5 |
| 10 | 4 | Fix xlsx types | 10 min | - |

**Total Estimated Time:** 4-5 hours

---

## Success Criteria

| Metric | Target |
|--------|--------|
| packages/supabase typecheck | 0 errors |
| apps/store-app typecheck | 0 errors (with --skipLibCheck) |
| Test pass rate | 100% (3474/3474) |
| Monorepo typecheck | All packages pass |

---

## Verification Commands

```bash
# 1. Supabase package typecheck
cd packages/supabase && pnpm exec tsc --noEmit

# 2. Store-app typecheck
cd apps/store-app && pnpm exec tsc --noEmit --skipLibCheck

# 3. Full test suite
cd apps/store-app && pnpm test -- --run

# 4. Monorepo typecheck
pnpm run typecheck
```

---

## Rollback Strategy

```bash
# Revert individual file
git checkout HEAD -- <file-path>

# Revert all changes
git reset --hard HEAD
```

---

## Notes

- Phase 1 (supabase fixes) is blocking - must be done first
- Phase 2-3 (test fixes) can be parallelized by category
- Some test failures may reveal actual bugs that need separate fixes
- Consider adding CI checks for typecheck on all packages

---

**Plan Created By:** Claude (Codebase Review Agent)
**Plan Version:** 1.0
**Last Updated:** 2026-01-23
