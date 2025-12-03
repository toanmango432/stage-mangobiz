# Mango Biz - Sales & Checkout Module
## Product Requirements Document (PRD)

**Version:** 3.1
**Date:** December 2, 2025
**Document Owner:** Product Team
**Status:** In Development - Phase 1 Complete
**Priority:** P0 - Critical Path
**Target Release:** Q1 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Implementation Status](#2-current-implementation-status)
3. [Competitive Advantages](#3-competitive-advantages)
4. [User Personas & Use Cases](#4-user-personas--use-cases)
5. [Feature Requirements](#5-feature-requirements)
6. [Component Specifications](#6-component-specifications)
7. [User Experience Flows](#7-user-experience-flows)
8. [Technical Requirements](#8-technical-requirements)
9. [Configuration & Settings](#9-configuration--settings)
10. [Implementation Phases](#10-implementation-phases)
11. [Success Metrics](#11-success-metrics)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### 1.1 Problem Statement

Current checkout systems in salon and spa software suffer from fragmented workflows, excessive navigation, and service-centric designs that don't match how salons actually operate. Staff waste valuable time navigating between screens, manually calculating tips, and managing complex payment scenarios. The lack of offline capability means lost revenue during internet outages.

### 1.2 Solution: Staff-Centric Checkout

Mango's Sales & Checkout module uses a **staff-centric 2-panel design** that matches how salons naturally operate. Instead of adding services first and then assigning staff (like Fresha), Mango lets users:

1. **Select a staff member first** (activate them)
2. **Add services** that automatically assign to the active staff
3. **Switch staff** by clicking another staff card
4. **View all services grouped by staff** in the summary panel

This approach is **faster for multi-staff tickets** and reduces errors in staff assignment.

### 1.3 Primary Goals

1. **Reduce checkout time by 50%** compared to legacy systems (target: <2 minutes)
2. **Achieve 95%+ first-attempt payment success rate**
3. **Support 100% offline operation** for cash transactions
4. **Enable seamless tip handling** with configurable pre/post-tax calculations
5. **Provide flexible payment options** including split payments and self-checkout

### 1.4 Target Users

| Persona | Usage | Key Needs |
|---------|-------|-----------|
| **Front Desk Staff** | 60% | Fast checkout, quick client lookup, easy tip handling |
| **Service Providers** | 30% | Chairside checkout, track own services, tip visibility |
| **Managers** | 10% | Override pricing, approve discounts, void access |

---

## 2. Current Implementation Status

### 2.1 What's Already Built

#### Core Architecture ✅
- [x] 2-panel layout (Services/Staff tabs + Interactive Summary)
- [x] Staff-centric service grouping with collapsible cards
- [x] Active staff indicator ("Adding Services Here")
- [x] Dock mode (900px) and Full mode toggle
- [x] useReducer state management with 50+ action types

#### Service Management ✅ (Bulk actions fixed in Phase 2)
- [x] Service categories with grid/list toggle
- [x] Quick-add from categorized view
- [x] Inline price editing - Click price to edit directly
- [x] Bulk price editing - Dialog for multiple services
- [x] Service duplication - Copy button + bulk duplicate
- [x] Per-service discounts - % or $ off via dialog
- [x] Drag-drop reordering within staff groups
- [x] Swipe-to-delete on mobile

#### Service Status Tracking ⚠️ (UI only, no persistence)
- [x] 4 status states: Not Started, In Progress, Paused, Completed
- [x] Automatic timer when In Progress (local state only)
- [x] Pause/Resume with duration tracking (local state only)
- [x] Progress bar showing % of expected duration
- [x] Color-coded status badges
- [ ] Status changes persist to database - **Not implemented**
- [ ] Status syncs across devices - **Not implemented**

#### Payment Processing ⚠️ (UI complete, no real integration)
- [x] Multiple payment methods UI (Card, Cash, Gift Card, Custom)
- [x] Split payments across methods UI
- [x] Cash calculator with change display
- [x] Tip presets (15%, 18%, 20%, 25%)
- [x] Custom tip amount
- [x] Gift card stacking UI (multiple cards)
- [ ] Real payment processor (Stripe) - **Not integrated**
- [ ] Payment declined flow - **UI only, no real handling**

#### UX Features ✅
- [x] Undo/Redo stack (10 items)
- [x] Keyboard shortcuts (? for help, Ctrl+K search, Esc close)
- [x] Auto-save to localStorage (mode preference only)
- [x] Responsive design (desktop, tablet, mobile)
- [x] Framer Motion animations

#### Client Management ⚠️ (Basic works, alerts missing)
- [x] Client search (name, phone)
- [x] Recent clients list (top 10)
- [x] Quick create inline
- [x] Walk-in / No client option
- [ ] Client alerts (allergy, notes, balance) - **Component doesn't exist**

#### Tip Distribution ⚠️ (Logic exists, UI hidden)
- [x] TipDistribution component exists
- [x] Calculation logic (by service value) implemented
- [ ] Manual distribution UI - **Not implemented**
- [ ] "Edit Distribution" functionality - **Not working**

#### Draft Sales ❌ (0% complete)
- [ ] Auto-save to IndexedDB
- [ ] Draft list view
- [ ] Resume draft functionality
- [ ] Draft expiration

### 2.2 Completion Status by Feature Area (Revised)

| Feature Area | Current | Target | Gap | Notes |
|--------------|---------|--------|-----|-------|
| Layout & Navigation | 95% | 100% | Minor polish | ✅ Working well |
| Service Management | 80% | 100% | Minor polish | ✅ Bulk actions fixed |
| Service Status Tracking | 40% | 100% | No persistence | ⚠️ Local state only |
| Client Management | 50% | 100% | No alerts | ⚠️ ClientAlerts missing |
| Payment Processing | 30% | 100% | UI only | ⚠️ No Stripe integration |
| Tip Distribution | 50% | 100% | UI incomplete | ⚠️ Logic works, UI hidden |
| Draft Sales | 0% | 100% | Not started | ❌ No IndexedDB saves |
| Self-Checkout | 0% | 100% | Not started | ❌ Future feature |
| Receipts | 20% | 100% | Minimal | ⚠️ Receipt options modal only |
| Offline Mode | 60% | 100% | Partial | ⚠️ localStorage only |

**Overall Checkout Module: ~45% Complete** (Phase 1 + Phase 2 done)

---

## 3. Competitive Advantages

### 3.1 Mango vs Fresha Comparison

| Feature | Fresha | Mango | Winner |
|---------|--------|-------|--------|
| **Staff-Centric Workflow** | No (service-first) | Yes (staff-first) | **Mango** |
| **Active Staff Indicator** | None | Visual highlight | **Mango** |
| **Pause Status + Timer** | No | Yes | **Mango** |
| **Undo/Redo** | No | Yes (10 items) | **Mango** |
| **Keyboard Shortcuts** | Limited | Full suite | **Mango** |
| **Offline Cash Payments** | No | Yes | **Mango** |
| **Drag-Drop Reorder** | No | Yes | **Mango** |
| **Multi Gift Card** | Single | Multiple | **Mango** |
| **Self-Checkout SMS** | Yes | Planned | Fresha |
| **Client Alerts** | Yes | Planned | Fresha |

### 3.2 Key Differentiators to Preserve

1. **Staff-First Design**: Select staff → Add services (not the reverse)
2. **Visual Staff Groups**: Collapsible cards showing services per staff
3. **4-State Status**: Including "Paused" with timer tracking
4. **Power User Features**: Undo/redo, shortcuts, drag-drop
5. **Offline-First**: Full cash checkout without internet

---

## 4. User Personas & Use Cases

### 4.1 Primary Use Cases

#### UC-1: Multi-Staff Walk-in Checkout
```
1. Open new checkout
2. Search/create client
3. Click "Sarah" in staff grid → Sarah becomes active
4. Add Haircut, Add Color → Both assigned to Sarah
5. Click "Mike" → Mike becomes active
6. Add Nail Service → Assigned to Mike
7. Review: Sarah has 2 services, Mike has 1
8. Add tip → Distributed proportionally
9. Process payment
```

#### UC-2: Chairside Quick Checkout
```
1. Service provider opens checkout on tablet
2. Client already selected from appointment
3. Mark service "Completed"
4. Add tip
5. Process card payment
6. Email receipt
```

#### UC-3: Self-Checkout (Future)
```
1. Staff completes services
2. Staff clicks "Send Checkout Link"
3. Client receives SMS with secure link
4. Client adds tip, enters card
5. Staff notified when complete
```

---

## 5. Feature Requirements

### 5.1 P0 Features (Must Complete)

#### F-001: Service Status Persistence
**Gap**: Status changes don't persist to database or sync across devices

**Requirements**:
| ID | Requirement | Status |
|----|-------------|--------|
| F-001.1 | Save status changes to IndexedDB | Pending |
| F-001.2 | Sync status across devices in real-time | Pending |
| F-001.3 | Status history with timestamps and user ID | Pending |
| F-001.4 | Timer state persists across page refresh | Pending |

---

#### F-002: Client Alerts & Information
**Gap**: No allergy warnings, notes, or outstanding balance display

**Requirements**:
| ID | Requirement | Status |
|----|-------------|--------|
| F-002.1 | Allergy alert banner (red, prominent) | Pending |
| F-002.2 | Staff notes banner (yellow) | Pending |
| F-002.3 | Outstanding balance warning (orange) | Pending |
| F-002.4 | Block check before checkout | Pending |
| F-002.5 | Quick stats (visits, spend, last visit) | Partial |

---

#### F-003: Tip Distribution to Staff
**Gap**: Tips collected but not split to individual staff

**Requirements**:
| ID | Requirement | Status |
|----|-------------|--------|
| F-003.1 | Auto-distribute by service value (default) | Pending |
| F-003.2 | Manual distribution option | Pending |
| F-003.3 | Equal split option | Pending |
| F-003.4 | Tip allocation visualization | Pending |
| F-003.5 | Assistant tip percentage support | Pending |

---

#### F-004: Payment Processing Integration
**Gap**: UI exists but no real payment processor

**Requirements**:
| ID | Requirement | Status |
|----|-------------|--------|
| F-004.1 | Stripe Terminal SDK integration | Pending |
| F-004.2 | Card present transactions | Pending |
| F-004.3 | Tap to Pay (iPhone/Android) | Pending |
| F-004.4 | Payment declined flow | Partial |
| F-004.5 | Refund/void handling | UI Only |

---

#### F-005: Draft Sales System
**Gap**: No save-for-later or auto-save to database

**Requirements**:
| ID | Requirement | Status |
|----|-------------|--------|
| F-005.1 | Auto-save every 30 seconds to IndexedDB | Pending |
| F-005.2 | Manual "Save for Later" button | Pending |
| F-005.3 | Draft list view (per staff) | Pending |
| F-005.4 | Resume draft functionality | Pending |
| F-005.5 | Draft expiration (24 hours) | Pending |
| F-005.6 | Part-paid status tracking | Pending |

---

### 5.2 P1 Features (Post-Launch)

#### F-006: Self-Checkout
| ID | Requirement |
|----|-------------|
| F-006.1 | SMS link generation (12-hour validity) |
| F-006.2 | QR code for in-store (15-minute validity) |
| F-006.3 | Client-facing payment page |
| F-006.4 | Tip selection on self-checkout |
| F-006.5 | Real-time status update on completion |

---

#### F-007: Receipt Management
| ID | Requirement |
|----|-------------|
| F-007.1 | Print receipt (thermal/standard) |
| F-007.2 | Email receipt |
| F-007.3 | SMS receipt |
| F-007.4 | Custom receipt template |
| F-007.5 | Reprint from transaction history |

---

#### F-008: Product Sales Integration
| ID | Requirement |
|----|-------------|
| F-008.1 | Product search/barcode scan |
| F-008.2 | Inventory check before adding |
| F-008.3 | Stock deduction on purchase |
| F-008.4 | Product recommendations |

---

### 5.3 P2 Features (Future Roadmap)

- Quick Payment (keypad entry, no cart)
- Loyalty points redemption
- Package/membership credits
- Multi-location support
- Advanced analytics

---

## 6. Component Specifications

### 6.1 Layout Architecture (Current - Keep As-Is)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [×] Close  [Clear]  [Dock/Full]  [? Shortcuts]      │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│   LEFT PANEL (140px dock)      │   RIGHT PANEL (flex)        │
│                                │   InteractiveSummary        │
│   ┌────────────────────────┐   │                             │
│   │ [Services] [Staff] tabs│   │   ┌─────────────────────┐   │
│   └────────────────────────┘   │   │ Client Section      │   │
│                                │   │ [Select client...]  │   │
│   When Services tab:           │   └─────────────────────┘   │
│   ┌────────────────────────┐   │                             │
│   │ Category 1             │   │   ┌─────────────────────┐   │
│   │ Category 2             │   │   │ Sarah Johnson    ▼  │   │
│   │ Category 3             │   │   │ ┌─────────────────┐ │   │
│   │ ...                    │   │   │ │ Haircut   $65  │ │   │
│   └────────────────────────┘   │   │ │ [In Progress]  │ │   │
│                                │   │ └─────────────────┘ │   │
│   When Staff tab:              │   │ ┌─────────────────┐ │   │
│   ┌────────────────────────┐   │   │ │ Color    $120  │ │   │
│   │ ┌──────┐ ┌──────┐      │   │   │ │ [Not Started]  │ │   │
│   │ │Sarah │ │ Mike │      │   │   │ └─────────────────┘ │   │
│   │ │ ✓    │ │      │      │   │   └─────────────────────┘   │
│   │ └──────┘ └──────┘      │   │                             │
│   │ ┌──────┐ ┌──────┐      │   │   ┌─────────────────────┐   │
│   │ │ Jane │ │ Tom  │      │   │   │ Mike Chen (inactive)│   │
│   │ └──────┘ └──────┘      │   │   │ Click to activate   │   │
│   └────────────────────────┘   │   └─────────────────────┘   │
│                                │                             │
│                                │   ┌─────────────────────┐   │
│                                │   │ Subtotal    $185.00 │   │
│                                │   │ Tax          $15.73 │   │
│                                │   │ ─────────────────── │   │
│                                │   │ Total       $200.73 │   │
│                                │   │                     │   │
│                                │   │ [  Checkout   ]     │   │
│                                │   └─────────────────────┘   │
│                                │                             │
└────────────────────────────────┴─────────────────────────────┘
```

### 6.2 Staff Group Component (Current - Keep As-Is)

Each staff member has a collapsible card showing their services:

```
┌─────────────────────────────────────────────────────────────┐
│  ◉ Sarah Johnson                              [▼ Collapse]  │
│  ─────────────────────────────────────────────────────────  │
│  │ Adding Services Here                                  │  │  ← Active indicator
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✂️  Haircut - Women's                         $65.00 │   │
│  │     60 min  •  [████████░░] 80%  •  In Progress     │   │
│  │     [Pause] [Complete]                    [⋮ More]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎨  Hair Color - Full                        $120.00 │   │
│  │     90 min  •  Not Started                          │   │
│  │     [Start]                                 [⋮ More]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Staff Total: $185.00                                       │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Client Alerts Component (NEW)

Display prominent alerts when client has important information:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  ALLERGY ALERT                                      [×]  │
│ Allergic to: Latex, Certain hair dyes (PPD)                 │
└─────────────────────────────────────────────────────────────┘
     ↑ Red background (#FEE2E2), red border

┌─────────────────────────────────────────────────────────────┐
│ 📝  Staff Notes                                        [×]  │
│ Prefers extra scalp massage. Always runs 10 min late.       │
└─────────────────────────────────────────────────────────────┘
     ↑ Yellow background (#FEF3C7), yellow border

┌─────────────────────────────────────────────────────────────┐
│ 💳  Outstanding Balance: $45.00                        [×]  │
│ From visit on Nov 15, 2025                                  │
└─────────────────────────────────────────────────────────────┘
     ↑ Orange background (#FFEDD5), orange border
```

### 6.4 Tip Distribution Component (NEW)

Show how tips will be distributed across staff:

```
┌─────────────────────────────────────────────────────────────┐
│  Tip Distribution                           [Auto ▼]        │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Total Tip: $40.00                                          │
│                                                             │
│  Sarah Johnson    $185.00 services    →    $24.32  (60.8%)  │
│  ████████████████████░░░░░░░░░░░░░░                         │
│                                                             │
│  Mike Chen        $115.00 services    →    $15.68  (39.2%)  │
│  ████████████████░░░░░░░░░░░░░░░░░░                         │
│                                                             │
│  [Edit Distribution]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. User Experience Flows

### 7.1 Primary Flow: Staff-Centric Checkout

```
1. Staff opens checkout (from dashboard or calendar)
   └─> 2-panel layout appears in dock mode

2. Staff clicks "Staff" tab
   └─> Staff grid shows all available staff

3. Staff clicks "Sarah Johnson"
   └─> Sarah's card highlighted with blue border
   └─> "Adding Services Here" indicator appears

4. Staff clicks "Services" tab → "Hair" category
   └─> Service grid appears

5. Staff clicks "Haircut - Women's"
   └─> Service added to Sarah's group
   └─> Right panel updates with Sarah's card expanded

6. Staff clicks "Color - Full"
   └─> Second service added to Sarah's group

7. Staff clicks "Staff" tab → clicks "Mike Chen"
   └─> Mike becomes active (blue border)
   └─> Sarah becomes inactive (gray, clickable)

8. Staff adds "Nail Service"
   └─> Service appears under Mike's group

9. Staff clicks "Start" on Sarah's Haircut
   └─> Status: In Progress, timer starts

10. [Service completes] Staff clicks "Complete"
    └─> Status: Completed, duration logged

11. Staff clicks "Checkout" button
    └─> Payment modal opens (Step 1: Tip)

12. Staff selects 20% tip
    └─> Tip distribution shows: Sarah $24.32, Mike $15.68

13. Staff clicks "Continue" → selects "Card"
    └─> Terminal activates

14. Client taps card
    └─> Payment successful
    └─> Receipt options appear

15. Staff clicks "Email Receipt"
    └─> Done! Ready for next checkout
```

### 7.2 Error Flow: Payment Declined

```
1. Card payment attempted
2. Terminal returns "Declined"
   └─> Error message: "Card Declined"
   └─> Options: [Try Again] [Different Card] [Cash]

3. Staff clicks "Cash"
   └─> Cash calculator appears

4. Staff enters amount tendered
   └─> Change calculated and displayed

5. Staff clicks "Complete"
   └─> Transaction successful
```

### 7.3 Offline Flow

```
1. Internet connection lost
   └─> Banner: "Offline Mode - Card payments unavailable"

2. Staff continues checkout normally
   └─> All local operations work

3. Staff clicks "Checkout"
   └─> Card option disabled with message
   └─> Cash and Gift Card available

4. Staff processes cash payment
   └─> Transaction saved locally
   └─> Queued for sync

5. Connection restored
   └─> Auto-sync begins
   └─> Banner: "Syncing... 3 transactions"
```

---

## 8. Technical Requirements

### 8.1 Data Layer Updates (Phase 1 Complete)

The following types have been updated in `src/types/`:

#### ServiceStatus (common.ts)
```typescript
type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

interface ServiceStatusChange {
  from: ServiceStatus;
  to: ServiceStatus;
  changedAt: string;      // ISO 8601
  changedBy: string;      // User ID
  changedByDevice: string;
  reason?: string;
}
```

#### TipAllocation (Ticket.ts)
```typescript
interface TipAllocation {
  staffId: string;
  staffName: string;
  amount: number;
  percentage: number;     // % of total tip
}
```

#### TicketService (Ticket.ts)
```typescript
interface TicketService {
  // Core fields
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;
  commission: number;
  startTime: string;
  endTime?: string;

  // Status tracking
  status: ServiceStatus;
  statusHistory: ServiceStatusChange[];

  // Timer tracking
  actualStartTime?: string;
  pausedAt?: string;
  totalPausedDuration: number;
  actualDuration?: number;

  // Customization
  notes?: string;
  discount?: ServiceDiscount;
  assistantStaffId?: string;
  assistantTipPercent?: number;
}
```

#### Payment (Ticket.ts)
```typescript
interface Payment {
  id: string;
  method: string;
  amount: number;
  tip: number;
  total: number;
  processedAt: string;
  status?: 'approved' | 'declined' | 'pending' | 'failed';

  // Split payments
  isSplitPayment?: boolean;
  splitIndex?: number;
  splitTotal?: number;

  // Tip distribution
  tipAllocations?: TipAllocation[];

  // Cash
  amountTendered?: number;
  changeGiven?: number;

  // Offline
  offlineQueued?: boolean;
  syncedAt?: string;
}
```

### 8.2 Redux State (checkoutSlice.ts)

New checkout slice manages:
- Active checkout session
- Draft sales list
- Auto-save state
- Payment flow state
- Session configuration

### 8.3 Performance Requirements

| Metric | Target |
|--------|--------|
| Page load (cached) | <500ms |
| Service addition | <200ms |
| Status change sync | <1 second |
| Payment processing | <3 seconds |

### 8.4 Offline Requirements

| Feature | Offline Support |
|---------|-----------------|
| Service management | Full |
| Status tracking | Full (local) |
| Cash payments | Full |
| Card payments | Queued |
| Client search | Cached data |
| Receipts | Print only |

---

## 9. Configuration & Settings

### 9.1 Tip Configuration

| Setting | Default | Options |
|---------|---------|---------|
| Tip percentages | 18%, 20%, 22% | 3 configurable |
| Calculation basis | Post-tax | Pre-tax / Post-tax |
| Include products | No | Yes / No |
| Post-checkout edit | 6 months | 1-12 months |

### 9.2 Discount Configuration

| Setting | Default | Options |
|---------|---------|---------|
| Manager approval | >30% | 0-100% |
| Require reason | Yes | Yes / No |
| Allow negative | No | Yes / No |

### 9.3 Draft Configuration

| Setting | Default | Options |
|---------|---------|---------|
| Auto-save interval | 30 seconds | 15-120 sec |
| Expiration | 24 hours | 1-72 hours |
| Max per staff | 5 | 1-10 |

### 9.4 Self-Checkout Configuration

| Setting | Default | Options |
|---------|---------|---------|
| SMS link validity | 12 hours | 1-24 hours |
| QR code validity | 15 minutes | 5-60 min |
| Allow tipping | Yes | Yes / No |

---

## 10. Implementation Phases (Revised)

### Phase 1: Data Layer ✅ COMPLETE
- [x] ServiceStatus type in common.ts
- [x] TicketService interface updates
- [x] TipAllocation interface
- [x] Payment interface updates
- [x] Ticket interface (draft/source)
- [x] checkoutConfig.ts expansion
- [x] checkoutSlice.ts creation
- [x] Register in Redux store
- [x] Service status actions in ticketsSlice

### Phase 2: Fix Broken UI ✅ COMPLETE
**Fixed:** The 3 bulk action handlers now work properly.

- [x] Fix `handleEditServicePrice` → Price dialog for bulk editing
- [x] Fix `handleChangeServiceType` → Helpful toast (complex feature deferred)
- [x] Fix `handleDiscountService` → Discount dialog with % or $ options
- [x] All bulk service actions work end-to-end

### Phase 3: Client Alerts & Info (1-2 days)
- [ ] Create ClientAlerts component
- [ ] Allergy alert banner (red, prominent)
- [ ] Staff notes banner (yellow)
- [ ] Outstanding balance warning (orange)
- [ ] Client quick stats display (visits, spend)
- [ ] Block status check before checkout

### Phase 4: Tip Distribution UI (2-3 days)
**Note:** TipDistribution component and logic exist but are hidden/incomplete.

- [ ] Show TipDistribution component in payment flow
- [ ] Auto-distribute by service value (default)
- [ ] Manual distribution UI ("Edit Distribution" button)
- [ ] Equal split option
- [ ] Assistant tip percentage support
- [ ] Allocation visualization with progress bars

### Phase 5: Status Persistence (2-3 days)
- [ ] Save status changes to IndexedDB via ticketsSlice
- [ ] Sync status across devices (real-time via WebSocket)
- [ ] Status history with timestamps and user ID
- [ ] Timer state persists across page refresh
- [ ] Connect UI status buttons to Redux actions

### Phase 6: Draft Sales System (3-4 days)
- [ ] Auto-save to IndexedDB every 30 seconds
- [ ] DraftManager component
- [ ] Draft list view (per staff)
- [ ] Resume draft functionality
- [ ] Draft expiration (24 hours)
- [ ] Part-paid status tracking
- [ ] Manual "Save for Later" button

### Phase 7: Payment Integration (5-7 days)
- [ ] Stripe Terminal SDK setup
- [ ] Card present transactions
- [ ] Tap to Pay (iPhone/Android)
- [ ] Payment declined flow (real handling)
- [ ] Refund/void handling
- [ ] Offline payment queue

### Phase 8: Receipts & Self-Checkout (4-5 days)
- [ ] Email receipt integration
- [ ] SMS receipt option
- [ ] Print integration (thermal/standard)
- [ ] Receipt templates
- [ ] SMS link generation (self-checkout)
- [ ] QR code generation
- [ ] Client-facing payment page
- [ ] Real-time status updates

### Implementation Timeline Summary

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| 1 | Data Layer | - | ✅ Complete |
| 2 | Fix Broken UI | 2-3 days | ✅ Complete |
| 3 | Client Alerts | 1-2 days | **Next** |
| 4 | Tip Distribution | 2-3 days | Pending |
| 5 | Status Persistence | 2-3 days | Pending |
| 6 | Draft Sales | 3-4 days | Pending |
| 7 | Payment Integration | 5-7 days | Pending |
| 8 | Receipts & Self-Checkout | 4-5 days | Pending |
| **Total** | | **18-24 days** | |

---

## 11. Success Metrics

### 11.1 Primary KPIs

| Metric | Target |
|--------|--------|
| Average checkout time | <2 min (single service) |
| Payment success rate | >95% first attempt |
| Staff adoption | >90% in 2 weeks |
| Checkout error rate | <2% |

### 11.2 Secondary KPIs

| Metric | Target |
|--------|--------|
| Tip attachment rate | >70% |
| Average ticket value | +10% from baseline |
| Draft save usage | Track adoption |
| Self-checkout adoption | 15% |
| Mobile checkout usage | >30% |

### 11.3 User Satisfaction

| Metric | Target |
|--------|--------|
| Staff satisfaction | 4.5/5 stars |
| Training time | <30 minutes |
| Feature discoverability | >80% |

---

## 12. Appendix

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **Active Staff** | The currently selected staff member who receives new services |
| **Staff Group** | Collapsible card showing all services for one staff member |
| **Dock Mode** | Compact 2-panel layout (900px width) |
| **Full Mode** | Expanded layout for larger screens |
| **Draft Sale** | Incomplete checkout saved for later |
| **Split Payment** | Using multiple payment methods |
| **Tip Distribution** | Allocation of tips across staff |

### 12.2 File Locations

| Component | Path |
|-----------|------|
| Main checkout | `src/components/checkout/TicketPanel.tsx` |
| Summary panel | `src/components/checkout/InteractiveSummary.tsx` |
| Staff groups | `src/components/checkout/StaffGroup.tsx` |
| Payment modal | `src/components/checkout/PaymentModal.tsx` |
| Checkout slice | `src/store/slices/checkoutSlice.ts` |
| Ticket types | `src/types/Ticket.ts` |
| Config | `src/constants/checkoutConfig.ts` |

### 12.3 Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 25, 2025 | Initial PRD |
| 2.0 | Dec 1, 2025 | Added Fresha features, 3-panel layout |
| 3.0 | Dec 2, 2025 | Revised to match actual 2-panel staff-centric design |
| 3.1 | Dec 2, 2025 | **Gap analysis corrections:** Revised completion percentages (40% vs 70-90%), added Phase 2: Fix Broken UI, documented 3 TODO handlers, updated implementation timeline |

---

*This PRD reflects the actual implemented design and accurate completion status. The staff-centric 2-panel layout is a competitive advantage over Fresha's service-first approach.*

**Last Updated:** December 2, 2025
