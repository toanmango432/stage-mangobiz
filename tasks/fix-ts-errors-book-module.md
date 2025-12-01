# Task: Fix TS6133 and TS6192 Errors in Book Module

## Problem Analysis
**Current Issues:**
- Multiple TypeScript files in the Book module have unused imports and variables
- TS6133: Variables/imports declared but never used
- TS6192: Unused import declarations

**Priority Files (by number of errors):**
1. CommandPalette.tsx - 15 errors
2. CalendarHeader.tsx - 8 errors
3. NewAppointmentModal.v2.tsx - 6 errors
4. DraggableAppointment.tsx - 5 errors
5. DatePickerModal.tsx - 5 errors

## Implementation Plan

### Phase 1: Fix CommandPalette.tsx (15 errors)
- [ ] Read file and identify all unused imports
- [ ] Remove unused icon imports
- [ ] Remove unused Redux actions
- [ ] Remove unused utilities
- [ ] Verify all remaining imports are actually used

### Phase 2: Fix CalendarHeader.tsx (8 errors)
- [ ] Read file and identify all unused imports
- [ ] Remove unused components and icons
- [ ] Remove unused types and constants
- [ ] Verify all remaining imports are actually used

### Phase 3: Fix NewAppointmentModal.v2.tsx (6 errors)
- [ ] Read file (with offset/limit if too large)
- [ ] Identify and remove unused imports
- [ ] Verify all remaining imports are actually used

### Phase 4: Fix DraggableAppointment.tsx (5 errors)
- [ ] Identify and remove unused icon imports
- [ ] Remove unused variables
- [ ] Verify all remaining imports are actually used

### Phase 5: Fix DatePickerModal.tsx (5 errors)
- [ ] Identify and remove unused imports
- [ ] Remove unused state variables and handlers
- [ ] Verify all remaining imports are actually used

### Phase 6: Final Verification
- [ ] Verify no new errors were introduced
- [ ] Provide summary of all changes

## Files to Modify
1. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/Book/CommandPalette.tsx`
2. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/Book/CalendarHeader.tsx`
3. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/Book/NewAppointmentModal.v2.tsx`
4. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/Book/DraggableAppointment.tsx`
5. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/Book/DatePickerModal.tsx`

## Success Criteria
- [ ] All TS6133 errors in Book module resolved
- [ ] All TS6192 errors in Book module resolved
- [ ] No imports that ARE used were accidentally removed
- [ ] All files still compile without errors

## Review
_To be filled after implementation_

---

*Waiting for approval to begin implementation*
