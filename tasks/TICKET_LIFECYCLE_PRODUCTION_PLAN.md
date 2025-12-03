# Ticket Lifecycle Production Readiness Plan

## Overview

This plan covers all work required to make the walk-in ticket lifecycle production-ready, from check-in to ticket closure. Payment processor integration is excluded (manual payment acceptance is acceptable).

**Total Estimated Effort**: 25-30 days (5-6 weeks)
**Goal**: Full operational capability for salon walk-in workflow

---

## Phase 1: Supabase Data Sync Infrastructure (8 days)

### Goal
Ensure all ticket and transaction data syncs to Supabase for multi-device support and data persistence.

### 1.1 Ticket Supabase Integration (3 days)

**Current State**: Tickets stored in IndexedDB only, sync queue created but not processed

**Tasks**:
- [ ] Implement `ticketsTable` CRUD operations in `src/services/supabase/tables/ticketsTable.ts`
- [ ] Create ticket type adapter `src/services/supabase/adapters/ticketAdapter.ts`
  - `toTicket()` - Supabase row → App type
  - `toTickets()` - Array conversion
  - `toTicketInsert()` - App type → Supabase insert
  - `toTicketUpdate()` - App type → Supabase update
- [ ] Update `ticketsSlice.ts` thunks to use `dataService.tickets.*`
- [ ] Add real-time subscription for ticket changes
- [ ] Test: Create ticket → verify appears in Supabase

**Files to Modify**:
```
src/services/supabase/tables/ticketsTable.ts (NEW)
src/services/supabase/adapters/ticketAdapter.ts (NEW)
src/services/supabase/adapters/index.ts (export new adapters)
src/services/supabase/index.ts (export new table)
src/services/dataService.ts (add tickets service)
src/store/slices/ticketsSlice.ts (use dataService)
```

### 1.2 Transaction Supabase Integration (2 days)

**Current State**: Transactions stored in IndexedDB only

**Tasks**:
- [ ] Implement `transactionsTable` CRUD operations
- [ ] Create transaction type adapter
- [ ] Update `transactionsSlice.ts` thunks to use dataService
- [ ] Test: Complete payment → verify transaction in Supabase

**Files to Modify**:
```
src/services/supabase/tables/transactionsTable.ts (enhance existing)
src/services/supabase/adapters/transactionAdapter.ts (NEW)
src/store/slices/transactionsSlice.ts (use dataService)
```

### 1.3 Sync Queue Processor (2 days)

**Current State**: Sync queue stores operations but never processes them

**Tasks**:
- [ ] Create `SyncQueueProcessor` service
- [ ] Process queue on app startup
- [ ] Process queue on network reconnect
- [ ] Add retry logic with exponential backoff
- [ ] Add max retry limit (5 attempts)
- [ ] Handle failed sync items (quarantine)
- [ ] Add sync status indicators in UI

**Files to Create/Modify**:
```
src/services/syncQueueProcessor.ts (NEW)
src/components/layout/AppShell.tsx (start processor)
src/components/NetworkStatus.tsx (show sync status)
```

### 1.4 Conflict Resolution (1 day)

**Current State**: Vector clocks exist in schema but not used

**Tasks**:
- [ ] Implement last-write-wins conflict resolution
- [ ] Use `updatedAt` timestamp for conflict detection
- [ ] Log conflicts for debugging
- [ ] Handle deleted record conflicts

**Files to Modify**:
```
src/services/syncQueueProcessor.ts
src/utils/conflictResolution.ts (NEW)
```

---

## Phase 2: Walk-in Registration & Check-in (5 days)

### Goal
Create a complete walk-in registration flow from Front Desk

### 2.1 Walk-in Registration Modal (2 days)

**Current State**: No dedicated UI to create walk-ins from Front Desk

**Tasks**:
- [ ] Create `WalkInRegistrationModal.tsx` component
  - Client name (required)
  - Phone number (optional, with format validation)
  - Party size selector
  - Service selection (multi-select)
  - Estimated wait time display
  - Quick notes field
- [ ] Add "New Walk-in" button to Front Desk header
- [ ] Auto-generate ticket number
- [ ] Create walk-in ticket in Redux + Supabase
- [ ] Show success confirmation with ticket number

**Files to Create/Modify**:
```
src/components/frontdesk/WalkInRegistrationModal.tsx (NEW)
src/components/frontdesk/FrontDeskHeader.tsx (add button)
src/store/slices/uiTicketsSlice.ts (createWalkIn action)
```

### 2.2 Walk-in to Client Conversion (1 day)

**Current State**: Walk-ins use clientId='walk-in', never become real clients

**Tasks**:
- [ ] Add "Save as Client" option in walk-in registration
- [ ] Create client record when saving walk-in as client
- [ ] Link ticket to new client ID
- [ ] Show option during checkout to save as client

**Files to Modify**:
```
src/components/frontdesk/WalkInRegistrationModal.tsx
src/components/checkout/TicketPanel.tsx
src/store/slices/clientsSlice.ts (quick create action)
```

### 2.3 Waitlist Management UI (1 day)

**Current State**: WalkInSidebar exists but limited functionality

**Tasks**:
- [ ] Add estimated wait time display per walk-in
- [ ] Add "call next" functionality
- [ ] Add reorder/priority adjustment
- [ ] Show check-in time and elapsed wait
- [ ] Add notification when wait exceeds threshold

**Files to Modify**:
```
src/components/Book/WalkInSidebar.tsx
src/components/Book/WalkInCard.tsx
```

### 2.4 Phone Number Validation (1 day)

**Current State**: Phone numbers not validated

**Tasks**:
- [ ] Add phone number format validation
- [ ] Auto-format as user types (XXX) XXX-XXXX
- [ ] Check for duplicate phone numbers
- [ ] Link to existing client if phone matches

**Files to Create/Modify**:
```
src/utils/phoneValidation.ts (NEW)
src/components/frontdesk/WalkInRegistrationModal.tsx
src/components/checkout/ClientSelector.tsx
```

---

## Phase 3: Service Status & Timer Display (4 days)

### Goal
Show real-time service progress with timers and status indicators

### 3.1 Service Timer Component (1.5 days)

**Current State**: Service times tracked but not displayed

**Tasks**:
- [ ] Create `ServiceTimer.tsx` component
  - Elapsed time since start
  - Remaining time (based on estimated duration)
  - Pause indicator with paused duration
  - Color coding: green (on time), yellow (near end), red (overtime)
- [ ] Add timer to `ServiceTicketCard.tsx`
- [ ] Update timer every second (use useInterval hook)

**Files to Create/Modify**:
```
src/components/frontdesk/ServiceTimer.tsx (NEW)
src/components/frontdesk/ServiceTicketCard.tsx
src/hooks/useInterval.ts (NEW or use existing)
```

### 3.2 Pause Duration Display (0.5 days)

**Current State**: `totalPausedDuration` tracked but not shown

**Tasks**:
- [ ] Show "Paused for X min" when paused
- [ ] Show total paused time in service summary
- [ ] Exclude paused time from elapsed calculation

**Files to Modify**:
```
src/components/frontdesk/ServiceTimer.tsx
src/components/frontdesk/ServiceTicketCard.tsx
```

### 3.3 Service Progress Indicators (1 day)

**Current State**: Status badges exist but no progress visualization

**Tasks**:
- [ ] Add progress bar based on estimated vs elapsed time
- [ ] Show percentage complete
- [ ] Visual distinction for: not started, in progress, paused, completed
- [ ] Multi-service progress (when ticket has multiple services)

**Files to Create/Modify**:
```
src/components/frontdesk/ServiceProgress.tsx (NEW)
src/components/frontdesk/ServiceTicketCard.tsx
```

### 3.4 Staff Workload View (1 day)

**Current State**: Staff shows assigned tickets but no workload summary

**Tasks**:
- [ ] Show current service count per staff
- [ ] Show total remaining time per staff
- [ ] Highlight overloaded staff
- [ ] Quick reassign option for load balancing

**Files to Create/Modify**:
```
src/components/frontdesk/StaffWorkload.tsx (NEW)
src/components/frontdesk/StaffColumn.tsx (add workload indicator)
```

---

## Phase 4: Checkout Flow Completion (5 days)

### Goal
Complete the checkout experience with all features working

### 4.1 Checkout Flow Cleanup (1.5 days)

**Current State**: Multiple payment modals with overlapping functionality

**Tasks**:
- [ ] Audit all payment/checkout components
- [ ] Consolidate to single `CheckoutModal.tsx`
- [ ] Remove duplicate/legacy components
- [ ] Ensure consistent UX across all entry points

**Files to Audit**:
```
src/components/checkout/PaymentProcessModal.tsx (LEGACY - consider removing)
src/components/checkout/PaymentModal.tsx (keep/enhance)
src/components/checkout/TicketPanel.tsx (refactor - 97KB is too large!)
src/components/checkout/CheckoutScreen.tsx
```

### 4.2 Manual Payment Recording (1 day)

**Current State**: Payment simulated with 1500ms delay

**Tasks**:
- [ ] Remove fake processing delay
- [ ] Record payment as "approved" immediately
- [ ] Support all payment methods (cash, card, etc.)
- [ ] Calculate and record tip
- [ ] Create transaction record
- [ ] Mark ticket as paid

**Files to Modify**:
```
src/components/checkout/PaymentModal.tsx
src/store/slices/transactionsSlice.ts
```

### 4.3 Split Payment Support (1 day)

**Current State**: Schema supports split payments, UI incomplete

**Tasks**:
- [ ] Enable split payment UI in checkout
- [ ] Allow 2-4 way splits
- [ ] Track partial payments
- [ ] Show remaining balance
- [ ] Complete ticket only when fully paid

**Files to Modify**:
```
src/components/checkout/SplitPaymentPanel.tsx
src/components/checkout/PaymentModal.tsx
src/store/slices/transactionsSlice.ts
```

### 4.4 Tip Handling & Allocation (1 day)

**Current State**: Tip recorded but not allocated to staff

**Tasks**:
- [ ] Implement tip allocation logic
- [ ] Split tips based on service provider
- [ ] Support custom tip split
- [ ] Record tip allocation in transaction

**Files to Modify**:
```
src/components/checkout/TipEntry.tsx
src/utils/tipAllocation.ts (NEW)
src/store/slices/transactionsSlice.ts
```

### 4.5 Discount & Coupon Application (0.5 days)

**Current State**: Discount fields exist, unclear if functional

**Tasks**:
- [ ] Verify discount application works
- [ ] Add percentage and fixed amount discounts
- [ ] Apply discount to subtotal before tax
- [ ] Record discount reason/code

**Files to Modify**:
```
src/components/checkout/DiscountEntry.tsx
src/utils/priceCalculation.ts
```

---

## Phase 5: Ticket Completion & History (4 days)

### Goal
Proper ticket closure, history tracking, and receipt management

### 5.1 Ticket Completion Flow (1 day)

**Current State**: Multiple complete actions in different slices

**Tasks**:
- [ ] Unify completion flow to single action
- [ ] Ensure all services marked complete
- [ ] Verify all payments recorded
- [ ] Transition ticket to 'paid' status
- [ ] Clear from active views

**Files to Modify**:
```
src/store/slices/ticketsSlice.ts
src/store/slices/uiTicketsSlice.ts
```

### 5.2 Receipt Storage & Display (1.5 days)

**Current State**: Receipts not persisted after completion

**Tasks**:
- [ ] Create `receipts` table in Supabase
- [ ] Store receipt data on ticket completion
- [ ] Add receipt lookup by ticket/transaction ID
- [ ] Add receipt reprint functionality
- [ ] Show receipt in transaction history

**Files to Create/Modify**:
```
src/services/supabase/tables/receiptsTable.ts (NEW)
src/types/receipt.ts (NEW)
src/components/checkout/ReceiptStorage.tsx (NEW)
src/components/history/ReceiptViewer.tsx (NEW)
```

### 5.3 Transaction History View (1 day)

**Current State**: ClosedTickets component exists but limited

**Tasks**:
- [ ] Create comprehensive transaction history
- [ ] Add date range filtering
- [ ] Add search by client name/phone
- [ ] Show payment details
- [ ] Link to receipt view

**Files to Create/Modify**:
```
src/components/history/TransactionHistory.tsx (NEW or enhance existing)
src/components/history/TransactionCard.tsx (NEW)
```

### 5.4 Refund & Void Support (0.5 days)

**Current State**: RefundVoidDialog exists, unclear if functional

**Tasks**:
- [ ] Verify refund flow works
- [ ] Record refund reason (required)
- [ ] Update transaction status
- [ ] Sync refund to Supabase
- [ ] Show in transaction history

**Files to Modify**:
```
src/components/checkout/RefundVoidDialog.tsx
src/store/slices/transactionsSlice.ts
```

---

## Phase 6: Redux State Consolidation (3 days)

### Goal
Single source of truth for tickets, reduce complexity

### 6.1 Merge Ticket Slices (2 days)

**Current State**: `ticketsSlice` and `uiTicketsSlice` have overlapping functionality

**Tasks**:
- [ ] Analyze all ticket state usage across components
- [ ] Design unified ticket state structure
- [ ] Migrate `uiTicketsSlice` functionality to `ticketsSlice`
- [ ] Update all components to use unified slice
- [ ] Remove `uiTicketsSlice.ts`
- [ ] Test all ticket flows

**Files to Modify**:
```
src/store/slices/ticketsSlice.ts (enhance)
src/store/slices/uiTicketsSlice.ts (deprecate)
All components using ticket state
```

### 6.2 Selector Optimization (1 day)

**Current State**: Some components re-render unnecessarily

**Tasks**:
- [ ] Create memoized selectors for ticket lists
- [ ] Add selectors for filtered views (waitlist, in-service, completed)
- [ ] Optimize re-render performance
- [ ] Add selector unit tests

**Files to Create/Modify**:
```
src/store/slices/ticketsSlice.ts (add selectors)
src/store/selectors/ticketSelectors.ts (NEW)
```

---

## Phase 7: End-of-Day & Reporting (3 days)

### Goal
Support daily business operations and reconciliation

### 7.1 End-of-Day Summary (1.5 days)

**Current State**: No end-of-day functionality

**Tasks**:
- [ ] Create EOD summary component
- [ ] Show total sales by payment method
- [ ] Show total tips collected
- [ ] Show ticket count and average
- [ ] Show refunds/voids
- [ ] Export to CSV option

**Files to Create**:
```
src/components/reports/EndOfDaySummary.tsx (NEW)
src/components/reports/SalesSummaryCard.tsx (NEW)
src/utils/reportCalculations.ts (NEW)
```

### 7.2 Staff Performance Report (1 day)

**Current State**: No staff performance tracking

**Tasks**:
- [ ] Show services completed per staff
- [ ] Show revenue generated per staff
- [ ] Show tips earned per staff
- [ ] Show average service time per staff

**Files to Create**:
```
src/components/reports/StaffPerformance.tsx (NEW)
```

### 7.3 Data Export (0.5 days)

**Current State**: No data export capability

**Tasks**:
- [ ] Export transactions to CSV
- [ ] Export daily summary to PDF
- [ ] Date range selection for export

**Files to Create**:
```
src/utils/dataExport.ts (NEW)
```

---

## Phase 8: Testing & Validation (3 days)

### Goal
Ensure all flows work correctly

### 8.1 Manual Testing Checklist (1 day)

**Walk-in Lifecycle Test**:
- [ ] Create walk-in from Front Desk
- [ ] Walk-in appears in waitlist
- [ ] Assign walk-in to staff
- [ ] Start service (timer starts)
- [ ] Pause service (timer pauses)
- [ ] Resume service (timer resumes)
- [ ] Complete service
- [ ] Checkout with payment
- [ ] Ticket appears in history
- [ ] Receipt viewable

**Data Sync Test**:
- [ ] Create ticket → appears in Supabase
- [ ] Update ticket → syncs to Supabase
- [ ] Offline create → syncs when online
- [ ] Multi-device: ticket created on device A visible on device B

### 8.2 Edge Case Testing (1 day)

- [ ] Multiple services on one ticket
- [ ] Multiple staff on one service
- [ ] Split payment (2-way, 3-way)
- [ ] Partial payment then complete
- [ ] Refund full amount
- [ ] Refund partial amount
- [ ] Void transaction
- [ ] Network disconnect during checkout
- [ ] Network reconnect sync

### 8.3 Performance Testing (1 day)

- [ ] Load test with 100+ active tickets
- [ ] Test timer performance with 50+ running timers
- [ ] Test sync queue with 1000+ pending items
- [ ] Memory usage monitoring

---

## Implementation Schedule

| Week | Phase | Focus |
|------|-------|-------|
| Week 1 | Phase 1 (1.1-1.2) | Supabase sync for tickets & transactions |
| Week 2 | Phase 1 (1.3-1.4) + Phase 2 (2.1) | Sync processor + Walk-in modal |
| Week 3 | Phase 2 (2.2-2.4) + Phase 3 | Walk-in features + Timers |
| Week 4 | Phase 4 | Checkout flow completion |
| Week 5 | Phase 5 + Phase 6 | History + Redux consolidation |
| Week 6 | Phase 7 + Phase 8 | Reporting + Testing |

---

## Success Criteria

### Minimum Viable Production (MVP)
- [ ] Walk-ins can be created from Front Desk UI
- [ ] Service timers display elapsed/remaining time
- [ ] Pause/resume works with visible duration
- [ ] Checkout records payment (manual approval)
- [ ] All data syncs to Supabase
- [ ] Tickets visible across multiple devices
- [ ] Transaction history accessible

### Full Production Ready
- [ ] All MVP criteria met
- [ ] Split payments working
- [ ] Tip allocation working
- [ ] Receipts stored and retrievable
- [ ] End-of-day reports available
- [ ] Staff performance reports available
- [ ] < 100ms UI response time
- [ ] < 5s sync latency

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase schema changes | Create migration scripts, test in staging first |
| Data loss during migration | Backup IndexedDB before any changes |
| Performance degradation | Profile and optimize, use pagination |
| Redux state complexity | Document state shape, add TypeScript types |
| Multi-device conflicts | Implement conflict resolution in Phase 1.4 |

---

## Notes

- Payment processor integration excluded per requirements
- Manual payment acceptance is acceptable
- Focus is on operational completeness, not payment automation
- All dates are estimates and may adjust based on findings during implementation

---

## Next Steps

1. Review and approve this plan
2. Start Phase 1.1: Ticket Supabase Integration
3. Daily progress updates in `tasks/todo.md`
