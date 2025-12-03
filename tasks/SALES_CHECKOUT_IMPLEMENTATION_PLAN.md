# Sales & Checkout Module - Implementation Plan

**Based on:** PRD-Sales-Checkout-Module.md v3.1
**Current Status:** ~60% Complete (Phase 1-5 Done)
**Last Updated:** December 2, 2025
**PRD Location:** `docs/product/PRD-Sales-Checkout-Module.md`

---

## Quick Reference

### Key Files
| Purpose | Path |
|---------|------|
| **PRD** | `docs/product/PRD-Sales-Checkout-Module.md` |
| **Main Checkout** | `src/components/checkout/TicketPanel.tsx` |
| **Summary Panel** | `src/components/checkout/InteractiveSummary.tsx` |
| **Checkout Slice** | `src/store/slices/checkoutSlice.ts` |
| **Ticket Types** | `src/types/Ticket.ts` |
| **Config** | `src/constants/checkoutConfig.ts` |

### Current Architecture (Keep As-Is)
- **2-panel layout**: Left (Services/Staff tabs) + Right (InteractiveSummary)
- **Staff-centric workflow**: Select staff → Add services (competitive advantage)
- **useReducer**: 50+ action types for state management

---

## Completion Status

| Feature Area | Current | Target | Notes |
|--------------|---------|--------|-------|
| Layout & Navigation | 95% | 100% | Working well |
| Service Management | 80% | 100% | Bulk actions fixed |
| Service Status Tracking | 90% | 100% | Redux + draft persistence done |
| Client Management | 85% | 100% | Alerts & stats done |
| Payment Processing | 30% | 100% | UI only, needs Stripe |
| Tip Distribution | 90% | 100% | Auto/Equal split done |
| Draft Sales | 40% | 100% | DB ops done, UI needed |
| Self-Checkout | 5% | 100% | Config only |
| Receipts | 25% | 100% | window.print() works |
| Offline Mode | 60% | 100% | localStorage only |

**Overall: ~60% Complete** (Phase 1-5 done)

### What Can Be Done Frontend-Only:
- ~~Phase 5: Status Persistence (wire UI to Redux) - **DONE**~~
- Phase 6: Draft Sales (UI for resume/manage) - **2-3 days**
- Print receipts (already works with window.print())

### What Requires Backend:
- Phase 7: Payment Integration (Stripe API)
- Phase 8: Email/SMS receipts (requires email/SMS service)
- Self-Checkout (requires secure URLs + client-facing payment)

---

## Implementation Phases

### Phase 1: Data Layer - COMPLETE

- [x] ServiceStatus type in `src/types/common.ts`
- [x] TicketService interface updates in `src/types/Ticket.ts`
- [x] TipAllocation interface
- [x] Payment interface updates
- [x] Ticket interface (draft/source)
- [x] `checkoutConfig.ts` expansion
- [x] `checkoutSlice.ts` creation
- [x] Register in Redux store
- [x] Service status actions in ticketsSlice

---

### Phase 2: Fix Broken UI (2-3 days) - COMPLETE

**Fixed:** The 3 bulk action handlers that were showing TODO console logs.

#### 2.1 Fix handleEditServicePrice - DONE
**File:** `src/components/checkout/InteractiveSummary.tsx:289-315`

**Implementation:**
- [x] Added Price Edit Dialog with input field
- [x] Pre-fills current price for single service selection
- [x] Applies new price to all selected services
- [x] Shows toast confirmation

#### 2.2 Fix handleChangeServiceType - DONE
**File:** `src/components/checkout/InteractiveSummary.tsx:317-323`

**Implementation:**
- [x] Shows helpful toast directing users to Services tab
- [x] Note: Full service replacement requires complex service selector (future enhancement)

#### 2.3 Fix handleDiscountService - DONE
**File:** `src/components/checkout/InteractiveSummary.tsx:325-355`

**Implementation:**
- [x] Added Discount Dialog with percentage/fixed toggle
- [x] Supports percentage discounts (e.g., 10% off)
- [x] Supports fixed amount discounts (e.g., $5 off)
- [x] Applies discount to all selected services
- [x] Shows toast confirmation

#### 2.4 Note on Individual Service Editing
The following already worked before this phase:
- **Inline price editing** - Click price in StaffGroup.tsx
- **Quick price adjustments** - +5, +10, -5, -10 buttons
- **Duplicate service** - Copy button on each service
- **Delete service** - Swipe-to-delete or bulk delete

#### 2.5 Validation Checkpoint
```
1. Open checkout, add multiple services
2. Select 2+ services → Bulk actions bar appears
3. Click "Change Price" → Price dialog opens → Enter new price → All selected updated
4. Click "Discount" → Discount dialog opens → Choose % or $ → Apply → Prices reduced
5. Click "Duplicate" → Selected services duplicated
6. Click "Change Item" → Toast shows guidance
```

---

### Phase 3: Client Alerts & Info (1-2 days) - COMPLETE

**Gap:** ClientAlerts component doesn't exist. Client info shown is minimal.

#### 3.1 Create ClientAlerts Component - DONE
**File:** `src/components/checkout/ClientAlerts.tsx`

**Implementation:**
- [x] Allergy alert banner (red background `#FEE2E2`)
- [x] Staff notes banner (yellow background `#FEF3C7`)
- [x] Outstanding balance warning (orange background `#FFEDD5`)
- [x] Dismissible with X button
- [x] Pull data from client record

#### 3.2 Add Client Quick Stats - DONE
**Implementation:**
- [x] Total visits count
- [x] Total spend (lifetime)
- [x] Last visit date
- [x] Display in client section (InteractiveSummary.tsx)

#### 3.3 Block Status Check - DONE
**Implementation:**
- [x] Check if client is blocked
- [x] Show warning dialog before checkout
- [x] Allow manager override with "Proceed Anyway" button

#### 3.4 Validation Checkpoint
```
1. Select client with allergy → Red banner shows
2. Select client with notes → Yellow banner shows
3. Select client with balance → Orange banner shows
4. Select blocked client → Warning modal appears
5. Dismiss each alert → Hides correctly
```

---

### Phase 4: Tip Distribution UI (2-3 days) - ALREADY COMPLETE

**Status:** Already fully implemented in PaymentModal.tsx

#### 4.1 Show TipDistribution in Payment Flow - DONE
**File:** `src/components/checkout/PaymentModal.tsx`

**Implementation:**
- [x] TipDistribution interface defined (lines 31-35)
- [x] Wired into payment flow Step 1 (Add Tip)
- [x] Receives staffMembers prop with serviceTotal per staff

#### 4.2 Auto-Distribute by Service Value (Default) - DONE
- [x] `handleAutoDistributeTip()` calculates each staff's % of total services
- [x] Applies that % to total tip amount
- [x] Displays allocation in green-highlighted Card

#### 4.3 Manual Distribution UI - PARTIAL
- [x] "Auto-Distribute" button available
- [ ] Manual per-staff input editing (future enhancement)
- [x] Can recalculate by clicking buttons again

#### 4.4 Equal Split Option - DONE
- [x] "Split Equally" button (line 378-386)
- [x] Divides evenly among staff via `handleEqualSplitTip()`

#### 4.5 Validation Checkpoint
```
1. Add services for 2 staff, add $40 tip
2. Verify auto-distribution shows correct %
3. Click "Split Equally" → Divides evenly
4. Complete payment → Tips recorded per staff
```

---

### Phase 5: Status Persistence (1-2 days) - COMPLETE

**Implementation:** Redux + IndexedDB persistence via draft tickets.

#### 5.1 Connect UI to Redux - DONE
**Implementation:**
- [x] `updateServiceStatus` async thunk in ticketsSlice.ts (lines 112-218)
- [x] Complete status transition logic (not_started → in_progress → paused → completed)
- [x] Pause duration calculation, actual duration on completion
- [x] Service history tracking in statusHistory array
- [x] `handleUpdateService` in TicketPanel now calls Redux thunk when ticketId exists
- [x] Added Redux hooks (useDispatch, useSelector) to TicketPanel

#### 5.2 Persist to IndexedDB - DONE
**Implementation:**
- [x] Status changes go through ticketsDB.update()
- [x] statusHistory array persisted within ticket
- [x] ServiceStatusChange interface with full audit trail
- [x] Draft created automatically when status changes occur

#### 5.3 Draft Creation for Persistence - DONE (NEW)
**Implementation:**
- [x] Added ticketId and isDraft to TicketState
- [x] Added SET_TICKET_ID action type and reducer
- [x] Added ticketsDB.createDraft() for walk-in support
- [x] Added ticketsDB.getDrafts() and cleanupExpiredDrafts()
- [x] handleUpdateService creates draft on first status change

#### 5.4 Validation Checkpoint
```
1. Start a service → Status is "In Progress", draft created
2. Refresh page → Draft should be in IndexedDB
3. Pause service → Timer stops, status is "Paused"
4. Complete checkout → Draft marked as completed
5. Check IndexedDB → Status and history recorded
```

---

### Phase 6: Checkout → Front Desk Integration (3-4 days) - NOT STARTED

**Goal:** Connect Checkout module to Front Desk's ticket lifecycle system.

**Why this approach (not separate Draft system):**
- Front Desk already manages ticket lifecycle: Waitlist → In Service → Pending → Closed
- Checkout module should save tickets to Front Desk's "In Service" section
- Service-level statuses (not_started, in_progress, paused, completed) tracked within ticket
- No need for separate "draft" system - the ticket IS the order in progress

#### Current State (GAP):
- TicketPanel.tsx uses **local useReducer state only**
- No connection to Redux (`uiTicketsSlice`) or IndexedDB (`ticketsDB`)
- Ticket data is **lost on refresh**
- Service statuses exist but are not persisted

#### 6.1 Connect TicketPanel to Redux - NOT STARTED
**Files to modify:** `src/components/checkout/TicketPanel.tsx`

**Tasks:**
- [ ] Import `useAppDispatch`, `useAppSelector` from store/hooks
- [ ] Import actions from `uiTicketsSlice`
- [ ] Add `ticketId` to local state to track persisted ticket
- [ ] Connect to Redux selectors for ticket data

#### 6.2 Create Ticket on First Service Added - NOT STARTED
**Files to modify:** `src/components/checkout/TicketPanel.tsx`, `src/store/slices/uiTicketsSlice.ts`

**Tasks:**
- [ ] When first service added → Create ticket in Front Desk "In Service"
- [ ] Store returned `ticketId` in local state
- [ ] Subsequent service additions update existing ticket
- [ ] New thunk: `createCheckoutTicket` in uiTicketsSlice

#### 6.3 Persist Service Status Changes - NOT STARTED
**Files to modify:** `src/components/checkout/TicketPanel.tsx`, `src/store/slices/uiTicketsSlice.ts`

**Tasks:**
- [ ] When service status changes (start/pause/complete) → Dispatch to Redux
- [ ] New thunk: `updateTicketService` to persist service-level status
- [ ] Update IndexedDB with service status array
- [ ] Sync queue for offline support

#### 6.4 Move to Pending on Completion - NOT STARTED
**Files to modify:** `src/components/checkout/TicketPanel.tsx`

**Tasks:**
- [ ] When "Done" clicked (all services completed) → Move ticket to Pending
- [ ] Use existing `completeTicket` thunk from uiTicketsSlice
- [ ] Clear local checkout state after move
- [ ] Show confirmation toast

#### 6.5 Load Existing Ticket (Resume) - NOT STARTED
**Tasks:**
- [ ] When TicketPanel opens with existing ticketId → Load from Redux/IndexedDB
- [ ] Populate local state with persisted services and statuses
- [ ] Allow editing/continuing in-progress tickets

#### 6.6 Validation Checkpoint
```
1. Add services in Checkout → Ticket appears in Front Desk "In Service"
2. Change service status (Start) → Status persists in Front Desk
3. Pause service → Status shows "Paused" in Front Desk
4. Refresh page → Ticket data preserved in Front Desk
5. Click "Done" in Checkout → Ticket moves to "Pending"
6. Open existing In Service ticket → Resume in Checkout
```

#### Data Flow Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     CHECKOUT MODULE                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │ Add Service │ → │ Start/Pause │ → │    Done     │            │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘            │
│         │                 │                 │                    │
│         ▼                 ▼                 ▼                    │
│  createCheckoutTicket  updateTicketService  completeTicket      │
└─────────┬─────────────────┬─────────────────┬───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REDUX (uiTicketsSlice)                       │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │  waitlist   │   │serviceTickets│   │pendingTickets│           │
│  │  (waiting)  │   │ (in-service) │   │  (pending)  │            │
│  └─────────────┘   └──────┬──────┘   └─────────────┘            │
│                           │                                      │
│                    Service statuses:                             │
│                    - not_started                                 │
│                    - in_progress                                 │
│                    - paused                                      │
│                    - completed                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     IndexedDB (ticketsDB)                        │
│                     Persists all ticket data                     │
│                     + Sync queue for offline                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Payment Integration (5-7 days) - UI ONLY

**Evaluation:** Complete UI exists, but NO payment processor integration.

#### 7.1 Stripe Terminal SDK Setup - NOT STARTED
**What EXISTS:**
- [x] PaymentModal.tsx with full UI flow
- [x] Payment method types (card, cash, gift_card, custom)
- [x] Split payment support
- [x] Payment interface with status field

**What's MISSING:**
- [ ] Install @stripe/terminal-js SDK
- [ ] Configure Stripe connection
- [ ] Test device pairing

#### 7.2 Card Present Transactions - NOT STARTED
- [ ] Terminal reader connection
- [ ] Payment intent creation
- [ ] Handle success/decline responses
- [ ] Refund processing

#### 7.3 Tap to Pay - NOT STARTED
- [ ] Web Payments API / Stripe Tap to Pay
- [ ] NFC capability detection
- [ ] Same flow as terminal

#### 7.4 Payment Declined Flow - UI ONLY
**What EXISTS:**
- [x] Payment status types: 'approved' | 'declined' | 'pending' | 'failed'
- [x] UI can show declined state

**What's MISSING:**
- [ ] Actual decline handling from processor
- [ ] Retry flow
- [ ] Alternative payment method flow

#### 7.5 Offline Payment Queue - SCAFFOLD ONLY
**What EXISTS:**
- [x] syncQueueDB for queuing operations
- [x] Payment fields: offlineQueued, offlineQueuedAt, syncedAt

**What's MISSING:**
- [ ] Offline detection logic
- [ ] Queue payment on offline
- [ ] Retry when online
- [ ] Queue manager UI

#### 7.6 Validation Checkpoint
```
1. Process card payment → Completes via Stripe
2. Decline card → Shows error, offers alternatives
3. Process tap to pay → Works correctly
4. Go offline, try card → Queued
5. Go online → Payment processes
```

**NOTE:** This phase requires backend API integration with Stripe. Consider deferring until backend is ready.

---

### Phase 8: Receipts & Self-Checkout (4-5 days) - UI ONLY

**Evaluation:** ReceiptPreview UI exists, but NO backend services.

#### 8.1 Email Receipt - UI ONLY
**What EXISTS:**
- [x] ReceiptPreview.tsx with Email button
- [x] handleEmail() function (logs to console only)
- [x] RECEIPT_CONFIG settings

**What's MISSING:**
- [ ] Email service/API integration
- [ ] Receipt HTML/PDF generation
- [ ] Email template system

#### 8.2 SMS Receipt - CONFIG ONLY
**What EXISTS:**
- [x] ReceiptMethod type includes 'sms'
- [x] SELF_CHECKOUT_CONFIG.smsLinkValidityHours: 12

**What's MISSING:**
- [ ] SMS service (Twilio) integration
- [ ] SMS link generation
- [ ] Backend API for sending

#### 8.3 Print Integration - BASIC ONLY
**What EXISTS:**
- [x] Print button in ReceiptPreview
- [x] handlePrint() calls window.print()
- [x] Receipt layout with CSS for thermal

**What's MISSING:**
- [ ] ESC/POS format for thermal printers
- [ ] Star/Epson SDK integration
- [ ] Printer selection UI

#### 8.4 Self-Checkout SMS Link - NOT STARTED
- [ ] Secure checkout URL generation
- [ ] Link validity tracking
- [ ] Client-facing payment page

#### 8.5 QR Code Generation - NOT STARTED
**What EXISTS:**
- [x] SELF_CHECKOUT_CONFIG.qrCodeValidityMinutes: 15

**What's MISSING:**
- [ ] QR code library (qrcode.react or similar)
- [ ] QR code component
- [ ] Self-checkout flow

#### 8.6 Validation Checkpoint
```
1. Email receipt → Received correctly
2. SMS receipt → Link works
3. Print → Correct format
4. Self-checkout SMS → Client can pay
5. QR code → Scannable, payment works
```

**NOTE:** Email/SMS require backend APIs. Print works for standard printers. Consider deferring advanced features.

---

## Timeline Summary

| Phase | Description | Effort | Status | Notes |
|-------|-------------|--------|--------|-------|
| 1 | Data Layer | - | COMPLETE | Types, Redux, config |
| 2 | Fix Broken UI | 2-3 days | COMPLETE | Bulk actions working |
| 3 | Client Alerts | 1-2 days | COMPLETE | Alerts + quick stats |
| 4 | Tip Distribution | 2-3 days | COMPLETE | Already existed |
| 5 | Status Persistence | 1 day | COMPLETE | Redux + draft creation |
| 6 | Draft Sales | 3 days | **NEXT** | Frontend-only possible |
| 7 | Payment Integration | 5-7 days | DEFERRED | Needs backend/Stripe |
| 8 | Receipts & Self-Checkout | 4-5 days | DEFERRED | Needs backend APIs |
| **Frontend Total** | | **~4 days** | | Phases 5-6 only |

---

## Validation Process

After each phase:
1. Complete validation checkpoint
2. Notify user with testing instructions
3. Get approval before moving to next phase
4. Update this document with completion status

---

## Notes

- Keep 2-panel staff-centric layout (competitive advantage)
- Follow existing useReducer patterns in TicketPanel
- Use design tokens from `src/constants/designSystem.ts`
- All data: Redux → IndexedDB → Sync Queue
- Reference PRD for detailed requirements

---

**Document Version:** 2.0
**Last Updated:** December 2, 2025
