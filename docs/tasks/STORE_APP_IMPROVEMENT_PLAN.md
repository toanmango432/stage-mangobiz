# Store App Improvement Plan

> **Created:** January 10, 2026  
> **Status:** Ready for Implementation  
> **Estimated Duration:** 6-8 weeks  
> **Goal:** Production-ready Store App with maintainable codebase

---

## Executive Summary

This plan addresses critical technical debt in the Store App to prepare it for production deployment and future development. The improvements are prioritized by impact and risk, organized into 5 phases.

### Current State Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Bundle Size | 4.7MB | <3MB | -1.7MB |
| Test Coverage | ~3-5% | 40%+ | +35% |
| Max Component Size | 2,889 lines | <500 lines | -2,389 lines |
| Duplicate State Slices | 3 staff-related | 1 unified | -2 slices |

---

## Phase 1: Component Refactoring (Priority: P0)

**Duration:** 2 weeks  
**Risk:** Medium (Large files = merge conflicts)  
**Impact:** High (Maintainability, testability, bundle size)

### 1.1 Split TicketPanel.tsx (2,889 lines → ~10 files)

**Current Location:** `src/components/checkout/TicketPanel.tsx`

**Target Structure:**
```
src/components/checkout/TicketPanel/
├── index.ts                          # Barrel exports
├── TicketPanel.tsx                   # Main orchestrator (~300 lines)
├── types.ts                          # All interfaces (exists, enhance)
├── constants.ts                      # Mock data, config (exists, enhance)
├── hooks/
│   ├── useTicketState.ts             # Main reducer logic
│   ├── useTicketKeyboard.ts          # Keyboard shortcuts
│   ├── useTicketPersistence.ts       # Auto-save, draft management
│   └── useTicketPayment.ts           # Payment flow logic
├── components/
│   ├── TicketHeader.tsx              # Header with client selector
│   ├── TicketServiceList.tsx         # Service items display
│   ├── TicketItemTabs.tsx            # Services/Products/Packages tabs
│   ├── TicketSummary.tsx             # Totals, discounts, tips
│   ├── TicketActions.tsx             # Bottom action buttons
│   ├── TicketSplitMerge.tsx          # Split/merge dialogs
│   └── TicketPaymentFlow.tsx         # Payment modal integration
└── utils/
    ├── ticketCalculations.ts         # Price, tax, tip calculations
    └── ticketValidation.ts           # Validation logic
```

**Implementation Steps:**
1. Create folder structure with index.ts
2. Extract types (already partially done in `./types/`)
3. Extract hooks from inline logic
4. Extract sub-components bottom-up (least dependencies first)
5. Update imports in TicketPanel.tsx
6. Run tests after each extraction
7. Final cleanup and verify no regressions

**Validation:**
```bash
pnpm test -- --filter=@mango/store-app
pnpm build --filter=@mango/store-app
# Manual: Test checkout flow end-to-end
```

---

### 1.2 Split NewAppointmentModal.v2.tsx (2,044 lines → ~8 files)

**Current Location:** `src/components/Book/NewAppointmentModal.v2.tsx`

**Target Structure:**
```
src/components/Book/NewAppointmentModal/
├── index.ts
├── NewAppointmentModal.tsx           # Main modal (~250 lines)
├── types.ts
├── hooks/
│   ├── useAppointmentForm.ts         # Form state management
│   ├── useServiceSelection.ts        # Service picker logic
│   └── useTimeSlotPicker.ts          # Available slots logic
├── components/
│   ├── ClientStep.tsx                # Client selection step
│   ├── ServiceStep.tsx               # Service selection step
│   ├── StaffStep.tsx                 # Staff assignment step
│   ├── TimeStep.tsx                  # Date/time selection
│   ├── ConfirmStep.tsx               # Summary before booking
│   └── AppointmentSummaryCard.tsx    # Preview card
└── utils/
    └── appointmentValidation.ts
```

---

### 1.3 Split Other Large Files

| File | Lines | Priority | Target |
|------|-------|----------|--------|
| `clientsSlice.ts` | 1,823 | High | Extract thunks to `clientsThunks.ts`, selectors to `clientsSelectors.ts` |
| `database.ts` | 1,713 | Medium | Split by entity (already partially done) |
| `WaitListSection.tsx` | 1,376 | Medium | Extract card components |
| `ServiceSection.tsx` | 1,323 | Medium | Extract card components |
| `AddTeamMember.tsx` | 1,516 | Medium | Extract form sections |

---

## Phase 2: State Consolidation (Priority: P1)

**Duration:** 1 week  
**Risk:** High (Breaking changes if not careful)  
**Impact:** High (Simpler mental model, fewer bugs)

### 2.1 Audit Staff-Related Slices

Current slices with overlapping concerns:
- `staffSlice.ts` - Legacy staff data
- `uiStaffSlice.ts` - UI-specific staff state
- `teamSlice.ts` - Team members (source of truth from Supabase)

**Investigation Tasks:**
1. Map which components use which slice
2. Identify data flow: `teamSlice` → `staffSlice`/`uiStaffSlice`
3. Document selector dependencies

**Target Architecture:**
```
teamSlice.ts (Single Source of Truth)
├── State: TeamMember[]
├── Thunks: fetchTeamMembers, updateTeamMember, etc.
├── Selectors:
│   ├── selectAllTeamMembers
│   ├── selectActiveStaff          # Replaces staffSlice.selectAllStaff
│   ├── selectStaffById
│   ├── selectStaffByStatus        # ready, busy, off
│   └── selectStaffForUI           # Derived data for frontdesk
└── Derived State: (computed, not stored)
    └── UI-specific transformations via selectors
```

### 2.2 Migration Plan

1. **Week 1:** Add new unified selectors to `teamSlice.ts`
2. **Week 1:** Create adapter selectors that maintain old API
3. **Week 2:** Update components one by one to use new selectors
4. **Week 2:** Deprecate and remove old slices

**Backward Compatibility:**
```typescript
// In teamSlice.ts - temporary adapters
export const selectAllStaff = createSelector(
  selectAllTeamMembers,
  (members) => members.map(toStaffMember) // Adapter function
);
```

---

## Phase 3: Bundle Optimization (Priority: P1)

**Duration:** 1 week  
**Risk:** Low  
**Impact:** High (Faster load times, better UX)

### 3.1 Current Bundle Analysis

```
Total: 4.7MB
├── index-C0adVPLq.js      1.2MB (main bundle - TOO LARGE)
├── index-BupOSGLu.js      282KB (vendor chunk)
├── TicketPanel-*.js       257KB (lazy loaded ✓)
├── Book-*.js              232KB (lazy loaded ✓)
├── FrontDesk-*.js         224KB (lazy loaded ✓)
├── vendor-supabase-*.js   168KB (vendor chunk)
└── ... other chunks
```

### 3.2 Optimization Tasks

**Task 3.2.1: Analyze Bundle Contents**
```bash
# Add to package.json scripts
"analyze": "vite-bundle-visualizer"
```

**Task 3.2.2: Split Main Bundle**
- Move heavy dependencies to vendor chunks
- Configure `manualChunks` in vite.config.ts:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-redux'],
        'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...],
        'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
        'vendor-motion': ['framer-motion'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-charts': ['recharts'], // if used
      }
    }
  }
}
```

**Task 3.2.3: Tree Shaking Audit**
- Check for barrel file imports: `import { X } from '@/components'` → `import { X } from '@/components/X'`
- Audit lucide-react imports (import individual icons, not entire library)

**Task 3.2.4: Remove Dead Code**
```bash
# Find unused exports
npx ts-prune
```

### 3.3 Target Metrics

| Chunk | Current | Target |
|-------|---------|--------|
| Main bundle | 1.2MB | <500KB |
| Total assets | 4.7MB | <3MB |
| LCP (Largest Contentful Paint) | TBD | <2.5s |

---

## Phase 4: Test Coverage (Priority: P1)

**Duration:** 2 weeks  
**Risk:** Low  
**Impact:** High (Confidence for refactoring)

### 4.1 Current State

- 101 test files for 914+ source files (~11% file coverage)
- Actual code coverage: ~3-5%
- Most tests are unit tests for utilities

### 4.2 Testing Strategy

**Priority 1: Critical Business Logic (Week 1)**
| Module | Files to Test | Tests Needed |
|--------|---------------|--------------|
| Checkout | `ticketReducer.ts`, `ticketCalculations.ts` | Unit tests for all calculations |
| Payments | `paymentBridge.ts` | Integration tests |
| Booking | `conflictDetection.ts`, `smartAutoAssign.ts` | Unit tests (some exist) |
| Auth | `storeAuthManager.ts`, `authSlice.ts` | Unit + integration tests |

**Priority 2: Redux Slices (Week 1-2)**
| Slice | Tests Needed |
|-------|--------------|
| `ticketsSlice.ts` | CRUD operations, status transitions |
| `appointmentsSlice.ts` | Booking, cancellation, rescheduling |
| `clientsSlice.ts` | Fetch, create, update, search |
| `checkoutSlice.ts` | Cart operations, discounts, payments |

**Priority 3: Component Tests (Week 2)**
| Component | Tests Needed |
|-----------|--------------|
| `TicketPanel` | Render, add service, checkout flow |
| `FrontDesk` | Tab switching, ticket actions |
| `Book` (calendar) | Date navigation, slot selection |

### 4.3 Testing Patterns

Follow existing patterns from `docs/PATTERNS.md`:

```typescript
// src/store/slices/__tests__/ticketsSlice.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '@/store';
import { createTicket, updateTicketStatus } from '../ticketsSlice';

describe('ticketsSlice', () => {
  beforeEach(() => {
    // Reset store state
  });

  describe('createTicket', () => {
    it('should add a new ticket to state', async () => {
      // Test implementation
    });
  });
});
```

### 4.4 Coverage Targets

| Category | Current | Week 1 | Week 2 | Final |
|----------|---------|--------|--------|-------|
| Utils | ~20% | 60% | 80% | 80% |
| Redux Slices | ~5% | 30% | 50% | 50% |
| Hooks | ~0% | 20% | 40% | 40% |
| Components | ~0% | 10% | 20% | 30% |
| **Overall** | **~3%** | **25%** | **40%** | **40%+** |

---

## Phase 5: Code Quality (Priority: P2)

**Duration:** 1 week (ongoing)  
**Risk:** Low  
**Impact:** Medium (Developer experience)

### 5.1 Naming Convention Fixes

**Current Issues:**
- Mixed component folder naming (`Book/` vs `checkout/`)
- Some files use camelCase for components

**Target Convention (per NAMING_CONVENTIONS.md):**
```
Components:     PascalCase/     (e.g., Book/, Checkout/, FrontDesk/)
Files:          PascalCase.tsx  (e.g., TicketPanel.tsx)
Hooks:          camelCase.ts    (e.g., useTickets.ts)
Utils:          camelCase.ts    (e.g., formatCurrency.ts)
Types:          PascalCase.ts   (e.g., Ticket.ts)
Slices:         camelCase.ts    (e.g., ticketsSlice.ts)
```

**Files to Rename:**
```bash
# Example renames needed
checkout/ → Checkout/
frontdesk/ → FrontDesk/
giftcards/ → GiftCards/
```

### 5.2 JSDoc Documentation

Add JSDoc to all public APIs:

```typescript
/**
 * Creates a new checkout ticket for a client.
 * 
 * @param clientId - The client's unique identifier
 * @param services - Array of services to add to the ticket
 * @returns The created ticket with generated ID
 * 
 * @example
 * ```ts
 * const ticket = await createCheckoutTicket('client-123', [
 *   { serviceId: 'svc-1', staffId: 'staff-1', price: 50 }
 * ]);
 * ```
 */
export async function createCheckoutTicket(
  clientId: string,
  services: ServiceInput[]
): Promise<Ticket> {
  // ...
}
```

### 5.3 ESLint Rule Enforcement

Add stricter rules to `.eslintrc.cjs`:

```javascript
rules: {
  // File size limits
  'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 100 }],
  
  // Import organization
  'import/order': ['error', {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    'newlines-between': 'always',
  }],
  
  // TypeScript strictness
  '@typescript-eslint/explicit-function-return-type': 'warn',
  '@typescript-eslint/no-explicit-any': 'error',
}
```

---

## Implementation Timeline

```
Week 1-2: Phase 1 - Component Refactoring
  ├── Week 1: TicketPanel.tsx split
  └── Week 2: NewAppointmentModal.v2.tsx split + other large files

Week 3: Phase 2 - State Consolidation
  ├── Days 1-2: Audit and plan
  ├── Days 3-4: Create unified selectors
  └── Day 5: Begin migration

Week 4: Phase 3 - Bundle Optimization
  ├── Days 1-2: Bundle analysis
  ├── Days 3-4: Implement manual chunks
  └── Day 5: Tree shaking audit

Week 5-6: Phase 4 - Test Coverage
  ├── Week 5: Critical business logic + Redux slices
  └── Week 6: Component tests + hooks

Week 7: Phase 5 - Code Quality
  ├── Days 1-2: Naming convention fixes
  ├── Days 3-4: JSDoc documentation
  └── Day 5: ESLint rule enforcement

Week 8: Buffer + Final Validation
  ├── Integration testing
  ├── Performance benchmarks
  └── Documentation updates
```

---

## Validation Checkpoints

### After Each Phase

```bash
# 1. Type check
pnpm typecheck

# 2. Lint
pnpm lint

# 3. Tests
pnpm test

# 4. Build
pnpm build

# 5. Bundle size check
du -sh apps/store-app/dist/assets
```

### Final Validation

| Metric | Target | Validation Command |
|--------|--------|-------------------|
| Bundle Size | <3MB | `du -sh apps/store-app/dist/assets` |
| Test Coverage | 40%+ | `pnpm test:coverage` |
| No TS Errors | 0 | `pnpm typecheck` |
| No Lint Errors | 0 | `pnpm lint` |
| Max File Size | <500 lines | `find src -name "*.tsx" -exec wc -l {} + \| sort -n \| tail -10` |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes during refactor | Feature branch per phase, comprehensive testing |
| Merge conflicts | Coordinate with team, small PRs |
| Performance regression | Benchmark before/after each phase |
| Missing edge cases | Manual E2E testing of critical flows |

---

## Success Criteria

- [ ] All components under 500 lines
- [ ] Single source of truth for staff state
- [ ] Bundle size under 3MB
- [ ] Test coverage above 40%
- [ ] Consistent naming conventions
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors

---

## Next Steps

1. **Review this plan** with the team
2. **Create feature branch**: `refactor/store-app-improvements`
3. **Start Phase 1**: TicketPanel.tsx refactoring
4. **Track progress** in this document

---

*Document maintained by: Development Team*  
*Last Updated: January 10, 2026*
