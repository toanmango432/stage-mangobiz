# Product Requirements Document: Pending Module

**Product:** Mango POS
**Module:** Pending (Pre-Checkout Queue)
**Version:** 1.0
**Last Updated:** December 27, 2025
**Status:** Draft for Development
**Priority:** P0 (Critical Path)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [User Personas & Use Cases](#3-user-personas--use-cases)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Feature Requirements](#5-feature-requirements)
6. [Business Rules](#6-business-rules)
7. [UX Specifications](#7-ux-specifications)
8. [Technical Requirements](#8-technical-requirements)
9. [Success Metrics](#9-success-metrics)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Implementation Plan](#11-implementation-plan)

---

## 1. Executive Summary

### 1.1 Overview

The Pending Module serves as a holding area for completed services awaiting payment. This prevents checkout bottlenecks and gives staff clarity on which clients are ready to pay. It bridges the gap between service completion (Front Desk) and payment processing (Checkout).

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Checkout Flow Control** | Clear queue of who's ready to pay |
| **Reduced Wait Times** | Visual urgency indicators prioritize long-waiting clients |
| **Staff Awareness** | Assigned staff notified when client is pending |
| **Flexible Workflow** | Optional module - salons can enable/disable |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Checkout queue visibility | 100% of completed services visible |
| Average pending wait time | < 5 minutes |
| Client walkouts due to wait | < 1% |
| Staff notification delivery | < 3 seconds |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **No checkout queue visibility** | Staff don't know who's ready to pay | Visual pending queue with wait times |
| **Checkout bottlenecks at peak** | Long waits, frustrated clients | Priority indicators, bulk checkout |
| **Lost revenue from walkouts** | Clients leave without paying | Alerts for long-waiting clients |
| **Staff confusion** | Who handles which checkout? | Clear staff assignment display |

### 2.2 User Quotes

> "During Saturday rush, I lose track of who's done. Sometimes clients wait 20 minutes before I realize they're ready to pay." — Front Desk Manager

> "I finish a client's nails and have no idea if they went to checkout or just left." — Nail Technician

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Front Desk Coordinator

**Goals:**
- See all clients ready for checkout at a glance
- Process checkouts quickly in priority order
- Avoid making clients wait too long

**Use Cases:**
- PND-UC-001: View pending queue sorted by wait time
- PND-UC-002: Checkout client from pending queue
- PND-UC-003: Edit ticket before checkout
- PND-UC-004: Remove client from pending (left without paying)

### 3.2 Secondary User: Service Provider

**Goals:**
- Know when client is ready for checkout
- Track completion of own clients

**Use Cases:**
- PND-UC-005: Receive notification when own client moves to pending
- PND-UC-006: View status of own clients in pending

---

## 4. Competitive Analysis

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Separate pending queue | ✅ | ❌ | ❌ | ❌ | ❌ |
| Wait time indicators | ✅ | N/A | N/A | N/A | N/A |
| Priority alerts | ✅ | N/A | N/A | N/A | N/A |
| Bulk checkout | ✅ | ❌ | ❌ | ❌ | ❌ |
| Offline pending queue | ✅ | ❌ | ❌ | ❌ | ❌ |

**Key Differentiator:** Mango is the only salon POS with a dedicated pending queue module with visual urgency indicators.

---

## 5. Feature Requirements

### 5.1 Pending Queue Display

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PND-P0-001 | Display list of tickets with "Pending Payment" status | P0 | All completed tickets visible within 1 second of status change |
| PND-P0-002 | Show client name, photo, services, total amount | P0 | All fields visible without scrolling on card |
| PND-P0-003 | Display wait time counter (minutes pending) | P0 | Counter updates every minute, accurate to ±30 seconds |
| PND-P0-004 | Color-code by wait time urgency | P0 | White (<5min), Yellow (5-10min), Orange (10-20min), Red (20+min) |
| PND-P0-005 | Show assigned staff names | P0 | Staff photo and name visible on each card |

### 5.2 Sorting & Filtering

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PND-P0-006 | Sort by wait time (longest first, default) | P0 | Correct sort order, updates on new tickets |
| PND-P1-007 | Sort by amount (highest first) | P1 | Toggleable sort option |
| PND-P1-008 | Sort by staff name | P1 | Alphabetical by assigned staff |
| PND-P1-009 | Filter by staff | P1 | Show only tickets for selected staff |
| PND-P2-010 | Filter by service type | P2 | Show only tickets with selected services |

### 5.3 Actions

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PND-P0-011 | "Checkout" button opens checkout flow | P0 | Navigates to Checkout with ticket pre-loaded |
| PND-P0-012 | View full ticket details | P0 | Modal or slide-in with complete ticket info |
| PND-P0-013 | Edit ticket (add/remove services) | P0 | Changes saved, price recalculated |
| PND-P0-014 | Remove from pending (client left) | P0 | Confirmation dialog, logs reason, clears from queue |
| PND-P1-015 | Move back to "In-Service" | P1 | For additional services needed |
| PND-P1-016 | Add note to ticket | P1 | Note visible in checkout and transaction history |
| PND-P2-017 | Pin VIP to top of queue | P2 | VIP clients always shown first |
| PND-P2-018 | Bulk checkout selection | P2 | Select multiple, process sequentially |

### 5.4 Notifications

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PND-P1-019 | Notify staff when their client enters pending | P1 | Push notification within 3 seconds |
| PND-P1-020 | Alert if client pending > 10 minutes | P1 | Visual + optional sound alert |
| PND-P2-021 | SMS client when ready for checkout (optional) | P2 | Configurable per salon |

---

## 6. Business Rules

### 6.1 Status Transitions

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PND-BR-001 | Tickets enter Pending when all services marked "Done" | Automatic |
| PND-BR-002 | Tickets leave Pending only via Checkout or Remove | Enforced in UI |
| PND-BR-003 | Removed tickets logged with reason | Required field |
| PND-BR-004 | Auto-move configurable (immediate vs. manual confirm) | Setting per salon |

### 6.2 Timeout Handling

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PND-BR-005 | Alert manager if ticket pending > 30 minutes | Configurable threshold |
| PND-BR-006 | Option to auto-move back to Front Desk if client not found | Optional setting |
| PND-BR-007 | Escalation notification chain | Manager → Owner |

### 6.3 Configuration Options

| Rule ID | Rule | Default |
|---------|------|---------|
| PND-BR-008 | Pending module enabled/disabled | Enabled |
| PND-BR-009 | Skip Pending (direct to checkout) option | Disabled |
| PND-BR-010 | Wait time alert threshold | 10 minutes |
| PND-BR-011 | SMS notification to client | Disabled |

---

## 7. UX Specifications

### 7.1 Layout

**View Options:**
- **List View (Default):** Compact, shows more tickets
- **Card View:** Larger cards, easier to tap
- **Priority View:** Grouped by urgency level

**Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│ Pending Checkout (5)                    [Sort ▼]    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔴 25 min │ Sarah Johnson    │ $145.00 │ Zeus  │ │
│ │          │ Manicure, Pedicure │        │[Checkout]│
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🟠 12 min │ Mike Chen        │ $85.00  │ Lisa  │ │
│ │          │ Haircut           │        │[Checkout]│
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🟡 6 min  │ Amy Wilson       │ $120.00 │ Tom   │ │
│ │          │ Color, Blowout    │        │[Checkout]│
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 7.2 Interactions

| Interaction | Behavior |
|-------------|----------|
| Tap card | Expand details inline |
| Tap "Checkout" | Navigate to Checkout module |
| Swipe left | Reveal quick actions (Edit, Remove) |
| Long-press | Open context menu |
| Pull-to-refresh | Force sync from server |

### 7.3 Empty State

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│           ✓ All clear! No pending checkouts         │
│                                                     │
│           Today: 24 transactions completed          │
│                  $3,450 revenue                     │
│                                                     │
│              [View Transactions]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 7.4 Loading State

- Skeleton cards with shimmer animation
- 3-5 placeholder cards

### 7.5 Error State

```
┌─────────────────────────────────────────────────────┐
│           ⚠️ Unable to load pending queue           │
│                                                     │
│           [Retry]  [View Cached Data]               │
└─────────────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 Data Model

```typescript
interface PendingTicket {
  id: string;
  ticketNumber: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  services: PendingService[];
  staffIds: string[];
  staffNames: string[];
  subtotal: number;
  tax: number;
  total: number;
  pendingSince: Date;          // When moved to Pending status
  serviceCompletedAt: Date;    // When service was marked done
  isVip: boolean;
  notes?: string;
  paymentPreference?: 'card' | 'cash' | 'digital';
}

interface PendingService {
  id: string;
  name: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;
}
```

### 8.2 Performance Targets

| Metric | Target |
|--------|--------|
| Initial load time | < 500ms |
| New ticket appearance | < 1 second after status change |
| Wait time counter update | Every 30 seconds |
| Sort/filter response | < 100ms |

### 8.3 Offline Behavior

| Capability | Offline Support |
|------------|-----------------|
| View pending queue | ✅ Cached locally |
| Checkout | ✅ Process offline, queue for sync |
| Edit ticket | ✅ Save locally, sync later |
| Remove from pending | ✅ Log locally, sync later |
| Real-time updates | ❌ Requires connection |

### 8.4 Sync Priority

- Pending → Completed transitions: **Highest priority**
- Payment data: **Critical**
- Ticket edits: **Normal priority**

---

## 9. Success Metrics

### 9.1 Leading Indicators

| Metric | Target | Tracking |
|--------|--------|----------|
| Feature adoption rate | 80%+ salons use Pending | Analytics |
| Average pending wait time | < 5 minutes | Calculated from timestamps |
| Pending queue views/day | 20+ per device | Page views |

### 9.2 Lagging Indicators

| Metric | Target | Tracking |
|--------|--------|----------|
| Client satisfaction (checkout) | 4.5/5 stars | Post-checkout survey |
| Checkout throughput increase | +20% vs. pre-feature | Transactions/hour |
| Staff efficiency | 15% faster checkout | Time tracking |

### 9.3 Analytics Events to Track

| Event | Properties |
|-------|------------|
| `pending_queue_viewed` | salon_id, ticket_count, user_role |
| `pending_checkout_started` | ticket_id, wait_time_minutes |
| `pending_ticket_removed` | ticket_id, reason, wait_time |
| `pending_alert_triggered` | ticket_id, alert_type, threshold |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Real-time sync delays | Medium | High | Optimistic UI updates, queue indicator |
| Offline sync conflicts | Low | Medium | Timestamp-based resolution, user notification |
| Memory issues with large queue | Low | Medium | Virtual scrolling, pagination |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Staff ignores pending alerts | Medium | Medium | Escalation chain, manager visibility |
| Client leaves during pending | Low | High | SMS notification option, fast checkout |
| Module adds complexity | Medium | Low | Make module optional, simple default |

### 10.3 Open Questions

1. **Auto-SMS default:** Should client SMS on pending be opt-in or opt-out?
2. **VIP detection:** Should VIP be auto-detected from client tier or manually flagged?
3. **Multi-location:** How should pending queue work across locations?

---

## 11. Implementation Plan

### Phase 1: Core MVP (Week 1-2)
- [ ] PND-P0-001: Pending queue display
- [ ] PND-P0-002: Ticket card with client/service info
- [ ] PND-P0-003: Wait time counter
- [ ] PND-P0-004: Color-coded urgency
- [ ] PND-P0-006: Sort by wait time
- [ ] PND-P0-011: Checkout button navigation
- [ ] PND-P0-012: Ticket detail view
- [ ] PND-P0-014: Remove from pending

### Phase 2: Enhanced Actions (Week 3)
- [ ] PND-P0-005: Staff assignment display
- [ ] PND-P0-013: Edit ticket from pending
- [ ] PND-P1-007: Sort by amount
- [ ] PND-P1-008: Sort by staff
- [ ] PND-P1-015: Move back to In-Service
- [ ] PND-P1-016: Add notes

### Phase 3: Notifications & Alerts (Week 4)
- [ ] PND-P1-009: Filter by staff
- [ ] PND-P1-019: Staff notification on pending
- [ ] PND-P1-020: Long-wait alerts

### Phase 4: Advanced Features (Future)
- [ ] PND-P2-010: Filter by service type
- [ ] PND-P2-017: VIP pinning
- [ ] PND-P2-018: Bulk checkout
- [ ] PND-P2-021: Client SMS notification

---

## Appendix

### A. Related Documents

- [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) - Checkout flow
- [PRD-Front-Desk-Module.md](./PRD-Front-Desk-Module.md) - Front Desk operations (planned)
- [Mango POS PRD v1.md](./Mango%20POS%20PRD%20v1.md) - Main operations overview

### B. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 27, 2025 | Product Team | Initial extraction from main PRD |

---

*Document Version: 1.0 | Created: December 27, 2025*
