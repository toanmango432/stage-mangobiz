# Fix TS6133 (Unused Variables/Imports) Errors

## Problem Analysis
The codebase has ~217 TS6133 errors across multiple files. Need to fix the top 20 files with most errors.

## Implementation Plan

### Files to Fix (Top 20 by Error Count)
- [ ] 1. src/components/checkout/TicketPanel.tsx (31 errors)
- [ ] 2. src/components/modules/Sales.tsx (16 errors)
- [ ] 3. src/components/Book/CommandPalette.tsx (15 errors)
- [ ] 4. src/pages/BookPage.tsx (13 errors)
- [ ] 5. src/components/checkout/StaffGroup.tsx (13 errors)
- [ ] 6. src/components/tickets/PendingTicketCard.tsx (9 errors)
- [ ] 7. src/components/schedule/AddEditScheduleModal/TimeOffTab.tsx (9 errors)
- [ ] 8. src/components/modules/ControlCenter.tsx (9 errors)
- [ ] 9. src/components/checkout/ServiceListGrouped.tsx (9 errors)
- [ ] 10. src/components/Book/CalendarHeader.tsx (8 errors)
- [ ] 11. src/store/slices/appointmentsSlice.ts (7 errors)
- [ ] 12. src/services/appointmentService.ts (7 errors)
- [ ] 13. src/components/tickets/WaitListTicketCardRefactored.tsx (7 errors)
- [ ] 14. src/components/schedule/AddEditScheduleModal/RegularScheduleTab.tsx (7 errors)
- [ ] 15. src/components/modules/Transactions.tsx (7 errors)
- [ ] 16. src/components/tickets/ServiceTicketCardRefactored.tsx (6 errors)
- [ ] 17. src/components/layout/TopHeaderBar.tsx (6 errors)
- [ ] 18. src/components/Book/NewAppointmentModal.v2.tsx (6 errors)
- [ ] 19. src/components/checkout/CheckoutScreen.tsx (5 errors)
- [ ] 20. src/components/Book/DraggableAppointment.tsx (5 errors)

## Approach
For each file:
1. Read the file
2. Identify unused imports/variables (icons from lucide-react, types, components, utilities)
3. Remove only truly unused items
4. Be careful NOT to remove items that ARE used

## Success Criteria
- [ ] Fix all 20 files
- [ ] No functionality broken
- [ ] Return count of errors fixed

## Review
_To be filled after implementation_

---

*Waiting for approval to begin implementation*
