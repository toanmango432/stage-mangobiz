# TypeScript Error Fix Plan

**Created:** 2025-12-01
**Last Updated:** 2025-12-01 (Re-scanned)
**Total Errors:** 1,201
**Estimated Phases:** 6

---

## Executive Summary

This plan breaks down the fix of 1,201 TypeScript errors into 6 manageable phases, prioritized by impact and complexity.

### Error Distribution by Type (Current Scan)

| Error Code | Count | Description | Priority |
|------------|-------|-------------|----------|
| TS6133 | 534 | Unused variables/imports | Low (auto-fixable) |
| TS1149 | 174 | File casing conflicts | High (cascading) |
| TS2339 | 122 | Property doesn't exist | High |
| TS2322 | 112 | Type assignment errors | High |
| TS2367 | 43 | Unintentional comparison | Medium |
| TS2345 | 42 | Argument type mismatch | High |
| TS2739 | 24 | Missing properties | High |
| TS2741 | 21 | Missing properties | High |
| TS7006 | 20 | Implicit any | Medium |
| TS2353 | 18 | Unknown properties | Medium |
| TS2365 | 15 | Type comparison | Medium |
| TS2551 | 12 | Property typos | Medium |
| TS6192 | 11 | Unused imports (all) | Low |
| TS2307 | 9 | Module not found | High |
| TS6196 | 8 | Type unused | Low |
| Other | 36 | Various | Medium |

### Error Distribution by Area

| Directory | Errors | % of Total |
|-----------|--------|------------|
| components | 935 | 78% |
| utils | 48 | 4% |
| store | 41 | 3% |
| testing | 39 | 3% |
| services | 37 | 3% |
| db | 30 | 2% |
| pages | 20 | 2% |
| admin | 19 | 2% |
| hooks | 17 | 1% |
| types | 9 | 1% |
| Other | 6 | 1% |

### Component Breakdown (Top 15)

| Component Module | Errors |
|------------------|--------|
| checkout | 212 |
| Book | 136 |
| schedule | 117 |
| modules | 79 |
| client-settings | 36 |
| tickets | 32 |
| ui | 25 |
| TimeOff | 17 |
| team-settings | 14 |
| StaffManagement | 11 |
| layout | 6 |
| pending | 5 |
| frontdesk | 4 |
| TurnTracker | 3 |
| frontdesk-settings | 3 |

---

## Phase 1: File Casing Resolution (HIGH PRIORITY)

**Target:** TS1149 errors (175 errors → ~0 after fix)
**Impact:** High - These cause cascading errors

### Problem
Files have inconsistent casing between actual file names and imports:
- `src/components/ui/Card.tsx` vs `@/components/ui/card`
- `src/components/ui/Button.tsx` vs `@/components/ui/button`
- `src/types/Ticket.ts` vs `src/types/ticket.ts`

### Tasks
- [ ] 1.1 Standardize UI component imports to match actual file names (Card.tsx, Button.tsx)
- [ ] 1.2 Standardize type file imports (Ticket.ts)
- [ ] 1.3 Update all checkout/ module imports
- [ ] 1.4 Update all schedule/ module imports
- [ ] 1.5 Update remaining files with casing issues

### Files to Modify
```
src/components/checkout/*.tsx (30+ files)
src/components/schedule/*.tsx (10+ files)
src/components/ui/*.tsx (re-export consistency)
Any file importing @/components/ui/card or @/components/ui/button
```

### Verification
```bash
npx tsc --noEmit 2>&1 | grep "TS1149" | wc -l
# Should be 0
```

---

## Phase 2: Unused Imports/Variables Cleanup

**Target:** TS6133, TS6192, TS6196 errors (553 errors)
**Impact:** Low risk - safe to remove

### Strategy
Use ESLint with auto-fix where possible, manual review for complex cases.

### Tasks
- [ ] 2.1 Run ESLint auto-fix for unused imports
- [ ] 2.2 Clean up components/Book/ module (136 errors)
- [ ] 2.3 Clean up components/checkout/ module (212 errors)
- [ ] 2.4 Clean up components/schedule/ module (117 errors)
- [ ] 2.5 Clean up remaining components
- [ ] 2.6 Clean up utils/, store/, services/

### Commands
```bash
# Auto-fix unused imports
npx eslint --fix "src/**/*.{ts,tsx}" --rule "no-unused-vars: error"
```

### Verification
```bash
npx tsc --noEmit 2>&1 | grep "TS6133\|TS6192\|TS6196" | wc -l
# Should be 0
```

---

## Phase 3: Type Interface Fixes

**Target:** TS2322, TS2339, TS2345, TS2741, TS2739, TS2353 (339 errors)
**Impact:** High - affects runtime behavior

### Categories

#### 3.1 Missing Properties (TS2739, TS2741)
Objects missing required properties when creating entities.

**Common Patterns:**
- `Client` missing `totalVisits`, `totalSpent`
- `CreateStoreInput` missing `password`
- `LocalAppointment` missing sync metadata

**Fix Strategy:**
- Add factory functions with sensible defaults
- Update interfaces to make properties optional where appropriate

#### 3.2 Property Doesn't Exist (TS2339)
Accessing properties that don't exist on types.

**Common Patterns:**
- `staff.specialty`, `staff.role`, `staff.hireDate` (not in Staff type)
- `client.lastVisit`, `client.loyaltyTier` (not in Client type)
- Redux state shape mismatches

**Fix Strategy:**
- Extend interfaces to include missing properties OR
- Remove invalid property access

#### 3.3 Type Assignment (TS2322)
Assigning wrong types to variables.

**Common Patterns:**
- `null` vs `undefined` confusion
- Wrong callback signatures
- Component prop mismatches

**Fix Strategy:**
- Use proper type guards
- Fix function signatures
- Add proper type coercion

### Tasks
- [ ] 3.1 Fix Client type and creation functions
- [ ] 3.2 Fix Staff type and related properties
- [ ] 3.3 Fix LocalAppointment creation
- [ ] 3.4 Fix Redux state type mismatches
- [ ] 3.5 Fix component prop types (StatusBadge, PremiumInput)
- [ ] 3.6 Fix callback signatures in modals

### Key Files
```
src/types/client.ts
src/types/staff.ts
src/types/appointment.ts
src/components/Book/NewAppointmentModal.tsx
src/components/Book/NewAppointmentModal.v2.tsx
src/components/Book/QuickClientModal.tsx
src/components/Book/GroupBookingModal.tsx
src/components/ui/StatusBadge.tsx
src/components/ui/PremiumInput.tsx
```

### Verification
```bash
npx tsc --noEmit 2>&1 | grep "TS2322\|TS2339\|TS2345\|TS2741\|TS2739" | wc -l
# Should be 0
```

---

## Phase 4: Type Comparison Fixes

**Target:** TS2367, TS2365, TS2551 errors (70 errors)
**Impact:** Medium - may cause runtime bugs

### Problem
Comparing values of incompatible types.

**Common Patterns:**
```typescript
// TS2367: string vs number comparison
if (staff.id === techId) // techId is number, staff.id is string

// TS2367: enum vs string literal
if (action === "create") // action is AuditAction enum
```

### Tasks
- [ ] 4.1 Fix string/number ID comparisons
- [ ] 4.2 Fix enum vs string literal comparisons
- [ ] 4.3 Fix null/undefined comparisons

### Key Files
```
src/components/AssignTicketModal.tsx
src/components/AssignedStaffBadge.tsx
src/admin/pages/AnalyticsDashboard.tsx
```

### Verification
```bash
npx tsc --noEmit 2>&1 | grep "TS2367\|TS2365" | wc -l
# Should be 0
```

---

## Phase 5: Implicit Any & Missing Declarations

**Target:** TS7006, TS2304, TS7031, TS7053, TS2307 (41 errors)
**Impact:** Medium - type safety gaps

### Tasks
- [ ] 5.1 Add explicit types for function parameters (TS7006)
- [ ] 5.2 Add missing type declarations (TS2304)
- [ ] 5.3 Fix element implicit any access (TS7053)

### Common Fixes
```typescript
// Before (TS7006)
staff.map((s) => ...)

// After
staff.map((s: Staff) => ...)
```

### Key Files
```
src/components/Book/GroupBookingModal.tsx
src/utils/__tests__/smartAutoAssign.test.ts
```

### Verification
```bash
npx tsc --noEmit 2>&1 | grep "TS7006\|TS2304\|TS7031\|TS7053" | wc -l
# Should be 0
```

---

## Phase 6: Miscellaneous & Edge Cases

**Target:** Remaining ~24 errors
**Impact:** Various

### Categories
- TS2551: Property name typos
- TS2578: Unused labels
- TS2820: Expected different arguments
- TS2783: Property spread issues
- TS2769: No overload matches
- TS2354: Index signature issues
- TS2307: Module not found
- TS2305: Export not found
- TS2308: Wrong module reference

### Tasks
- [ ] 6.1 Fix property typos
- [ ] 6.2 Fix function overload issues
- [ ] 6.3 Fix module import issues
- [ ] 6.4 Clean up admin module errors
- [ ] 6.5 Final validation

### Verification
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Should be 0
```

---

## Implementation Order & Summary

| Phase | Focus | Errors | Est. Files | Dependencies |
|-------|-------|--------|------------|--------------|
| **1** | File Casing (TS1149) | 174 | ~50 | None |
| **2** | Unused Imports (TS6133+) | 553 | ~100 | Phase 1 |
| **3** | Type Interfaces | 339 | ~30 | Phase 1, 2 |
| **4** | Type Comparisons | 70 | ~10 | Phase 3 |
| **5** | Implicit Any + Modules | 41 | ~15 | Phase 3 |
| **6** | Misc | 24 | ~20 | Phase 1-5 |
| **Total** | | **1,201** | | |

---

## Validation Steps

After each phase:

1. **Run TypeScript check:**
   ```bash
   npx tsc --noEmit
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Run dev server:**
   ```bash
   npm run dev
   # Verify no runtime errors in console
   ```

4. **Visual check:**
   - Navigate to major pages (FrontDesk, Book, Checkout)
   - Verify functionality is intact

---

## Risk Mitigation

### Low Risk Changes
- Phase 1 (casing): No behavior change
- Phase 2 (unused): No behavior change

### Medium Risk Changes
- Phase 4 (comparisons): Could change conditional logic
- Phase 5 (any types): Could reveal hidden bugs

### High Risk Changes
- Phase 3 (interfaces): Could affect data flow

### Rollback Strategy
1. Commit after each phase
2. Create branch before starting
3. Test thoroughly before proceeding to next phase

---

## Success Criteria

- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] All existing tests pass
- [ ] Dev server starts without errors
- [ ] Major user flows work (appointment creation, ticket management, checkout)

---

## Notes

- Some TS6133 (unused) warnings may be intentional (future use) - review before removing
- TS1149 (casing) fix will have the largest impact due to cascading errors
- Consider adding `// @ts-expect-error` only as last resort for known issues
