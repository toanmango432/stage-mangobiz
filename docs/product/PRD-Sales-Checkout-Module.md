# Product Requirements Document: Sales & Checkout Module

**Product:** Mango POS
**Module:** Sales & Checkout
**Version:** 4.0
**Last Updated:** December 28, 2025
**Status:** In Development - ~45% Complete
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

The Sales & Checkout module is the payment processing hub for Mango POS, using a unique **staff-centric 2-panel design** that matches how salons naturally operate. Unlike competitors who use service-first workflows, Mango's approach lets users select a staff member first, then add services that automatically assign to that staff. This reduces errors and speeds up multi-staff checkouts.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Staff-Centric Workflow** | Select staff → Add services (not the reverse like competitors) |
| **Multi-Staff Efficiency** | Visual staff groups with collapsible cards, quick switching |
| **4-State Service Tracking** | Not Started, In Progress, Paused, Completed with timers |
| **Offline Capability** | Full cash checkout without internet, automatic sync |
| **Power User Features** | Undo/redo, keyboard shortcuts, drag-drop reordering |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Average checkout time | < 2 minutes (single service) |
| Payment success rate | 95%+ first attempt |
| Staff adoption | 90%+ in 2 weeks |
| Checkout error rate | < 2% |
| Tip attachment rate | 70%+ |

### 1.4 Current Implementation Status

| Feature Area | Status | Notes |
|--------------|--------|-------|
| Layout & Navigation | 95% | ✅ Working well |
| Service Management | 80% | ✅ Bulk actions fixed |
| Service Status Tracking | 40% | ⚠️ Local state only, no persistence |
| Client Management | 50% | ⚠️ ClientAlerts missing |
| Payment Processing | 30% | ⚠️ UI only, no Fiserv integration |
| Tip Distribution | 50% | ⚠️ Logic works, UI hidden |
| Draft Sales | 0% | ❌ Not started |
| Self-Checkout | 0% | ❌ Future feature |
| Receipts | 20% | ⚠️ Receipt options modal only |

**Overall Checkout Module: ~45% Complete**

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **Service-first workflows** | Staff assignment errors, extra clicks | Staff-centric design: select staff first, then add services |
| **Slow multi-staff checkouts** | 5+ minutes for complex tickets | Visual staff groups, quick switching, auto-assignment |
| **Lost service progress** | No visibility into service status | 4-state tracking with timers (Not Started → In Progress → Paused → Completed) |
| **Tip calculation confusion** | Manual math, distribution errors | Automatic tip distribution by service value with visual preview |
| **Internet dependency** | Lost revenue during outages | Offline-first: full cash checkout, automatic sync |
| **Power user friction** | Slow navigation, repeated actions | Undo/redo, keyboard shortcuts, drag-drop |

### 2.2 User Quotes

> "I hate clicking through 5 screens just to add a service to a different stylist." — Front Desk Manager

> "When the internet goes down on a Saturday, we're stuck with paper receipts." — Salon Owner

> "I never know how the tips are being split between my staff." — Spa Manager

### 2.3 Market Opportunity

| Opportunity | Description |
|-------------|-------------|
| **Differentiated UX** | Only salon POS with staff-centric workflow |
| **Offline reliability** | Critical for salons in areas with spotty internet |
| **Multi-staff efficiency** | Spas and large salons with team services |

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Front Desk Staff

**Profile:**
- Processes 60% of checkouts
- Needs fast, error-free transactions
- Handles walk-ins and appointments
- Works during busy periods with interruptions

**Goals:**
- Complete checkouts in under 2 minutes
- Avoid staff assignment errors
- Handle tips and split payments easily
- Manage client information quickly

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| CHK-UC-001 | Process single-staff checkout | P0 | Complete in < 90 seconds, correct staff assignment |
| CHK-UC-002 | Process multi-staff checkout | P0 | Add services to multiple staff, tips distributed correctly |
| CHK-UC-003 | Handle walk-in client | P0 | Quick-create client or use "Walk-in" option |
| CHK-UC-004 | Process split payment | P0 | Combine card + cash, correct totals |
| CHK-UC-005 | Handle payment decline | P0 | Retry or switch method, no data loss |

### 3.2 Secondary User: Service Provider

**Profile:**
- Processes 30% of checkouts (chairside)
- Needs quick checkout after service
- Wants visibility into own tips
- Uses tablet at station

**Goals:**
- Check out own clients quickly
- Track service completion status
- See tip amount before receipt
- Add products at checkout

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| CHK-UC-006 | Chairside quick checkout | P0 | Pre-filled from appointment, < 60 seconds |
| CHK-UC-007 | Mark service complete | P0 | Status updates, timer stops, duration logged |
| CHK-UC-008 | Add tip at checkout | P0 | Preset buttons + custom amount, see own allocation |
| CHK-UC-009 | Pause and resume service | P1 | Timer pauses, tracks paused duration |

### 3.3 Tertiary User: Manager/Owner

**Profile:**
- Processes 10% of checkouts
- Needs override and approval capabilities
- Reviews transactions for accuracy
- Handles voids and refunds

**Goals:**
- Override prices when needed
- Approve large discounts
- Process refunds/voids
- Review checkout accuracy

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| CHK-UC-010 | Override service price | P0 | Manager can edit price, logged in audit |
| CHK-UC-011 | Approve large discount | P1 | PIN required for discounts > threshold |
| CHK-UC-012 | Void transaction | P0 | Reason required, logged, payment reversed |
| CHK-UC-013 | Process refund | P0 | Full or partial, to original payment method |

---

## 4. Competitive Analysis

### 4.1 Feature Comparison

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| **Staff-Centric Workflow** | ✅ | ❌ (service-first) | ❌ | ❌ | ❌ |
| **Active Staff Indicator** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **4-State Service Status** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Pause Status + Timer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Undo/Redo** | ✅ (10 items) | ❌ | ❌ | ❌ | ❌ |
| **Keyboard Shortcuts** | ✅ (full suite) | Limited | ❌ | Limited | ❌ |
| **Offline Cash Payments** | ✅ | ❌ | ❌ | Partial | ❌ |
| **Drag-Drop Reorder** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Multi Gift Card Stacking** | ✅ | Single | ❌ | ✅ | ✅ |
| **Tip Distribution Preview** | ✅ | ❌ | ❌ | ❌ | Partial |
| **Self-Checkout SMS** | ⏳ P1 | ✅ | ❌ | ✅ | ✅ |
| **Client Alerts at Checkout** | ⏳ P0 | ✅ | ❌ | ✅ | ✅ |

### 4.2 Competitive Advantages

| Advantage | Description |
|-----------|-------------|
| **Staff-First Design** | Only salon POS with this workflow—reduces errors by 40%+ |
| **4-State Tracking** | Including "Paused" with timer—no competitor has this |
| **Power User Features** | Undo/redo + shortcuts = faster repeat users |
| **Offline-First** | Full cash checkout during outages—unique capability |

### 4.3 Competitive Gaps to Address

| Gap | Priority | Notes |
|-----|----------|-------|
| Self-checkout SMS link | P1 | Fresha, Square, Vagaro all have this |
| Client alerts at checkout | P0 | Allergies, notes, balance—critical for safety |
| Real payment processing | P0 | UI exists, Fiserv integration needed |

---

## 5. Feature Requirements

### 5.1 Service Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P0-001 | Add service to active staff | P0 | Click service → appears under active staff's group |
| CHK-P0-002 | Switch active staff | P0 | Click different staff → new services go to them |
| CHK-P0-003 | Visual staff groups | P0 | Collapsible cards showing services per staff |
| CHK-P0-004 | Inline price editing | P0 | Click price → edit in place → saves immediately |
| CHK-P0-005 | Bulk price editing | P0 | Select multiple → edit all prices in dialog |
| CHK-P0-006 | Service duplication | P0 | Copy button duplicates service under same staff |
| CHK-P0-007 | Per-service discount | P0 | % or $ off via dialog, visible on line item |
| CHK-P0-008 | Drag-drop reordering | P0 | Reorder services within staff group |
| CHK-P1-009 | Swipe-to-delete | P1 | Mobile: swipe left to reveal delete action |
| CHK-P1-010 | Service notes | P1 | Add note to individual service |

### 5.2 Service Status Tracking

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P0-011 | 4-state status | P0 | Not Started, In Progress, Paused, Completed |
| CHK-P0-012 | Start service action | P0 | Changes status to In Progress, starts timer |
| CHK-P0-013 | Pause service action | P0 | Changes to Paused, pauses timer, tracks duration |
| CHK-P0-014 | Resume service action | P0 | Changes to In Progress, resumes timer |
| CHK-P0-015 | Complete service action | P0 | Changes to Completed, stops timer, logs duration |
| CHK-P0-016 | Progress bar display | P0 | Visual % based on elapsed vs expected time |
| CHK-P0-017 | Status persistence | P0 | Status saves to database, survives refresh |
| CHK-P0-018 | Cross-device sync | P0 | Status updates appear on other devices < 3 seconds |
| CHK-P1-019 | Status history | P1 | Log all changes with timestamp and user |

### 5.3 Client Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P0-020 | Client search | P0 | Search by name or phone, results in < 500ms |
| CHK-P0-021 | Recent clients list | P0 | Show last 10 selected clients for quick access |
| CHK-P0-022 | Quick-create client | P0 | Inline form: name, phone, email minimum |
| CHK-P0-023 | Walk-in option | P0 | "No Client" / "Walk-in" option available |
| CHK-P0-024 | Allergy alert banner | P0 | Red banner if client has allergies, blocks checkout until acknowledged |
| CHK-P0-025 | Staff notes banner | P0 | Yellow banner showing client preferences/notes |
| CHK-P0-026 | Outstanding balance warning | P0 | Orange banner if client has unpaid balance |
| CHK-P1-027 | Block status check | P1 | Prevent checkout if client is "blocked" |
| CHK-P1-028 | Client quick stats | P1 | Visits count, total spend, last visit date |

### 5.4 Payment Processing

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P0-029 | Card payment (Tap to Pay) | P0 | Fiserv TTP SDK processes NFC contactless |
| CHK-P0-030 | Cash payment | P0 | Calculator with amount tendered and change |
| CHK-P0-031 | Gift card payment | P0 | Scan/enter code, check balance, apply |
| CHK-P0-032 | Split payment | P0 | Combine multiple methods, track amounts |
| CHK-P0-033 | Multiple gift cards | P0 | Stack multiple gift cards in one transaction |
| CHK-P0-034 | Payment declined handling | P0 | Clear message, options: Retry, Different Card, Cash |
| CHK-P0-035 | Payment success confirmation | P0 | Visual confirmation, receipt options |
| CHK-P1-036 | Manual card entry | P1 | Type card number for phone orders |
| CHK-P1-037 | Custom payment method | P1 | Configurable: Check, Account, etc. |

### 5.5 Tip Handling

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P0-038 | Tip preset buttons | P0 | 3 configurable percentages (default: 18%, 20%, 22%) |
| CHK-P0-039 | Custom tip amount | P0 | Enter exact dollar amount |
| CHK-P0-040 | No tip option | P0 | Explicit "No Tip" button |
| CHK-P0-041 | Tip distribution preview | P0 | Show how tip splits across staff before payment |
| CHK-P0-042 | Auto-distribute by service value | P0 | Default: tip allocated proportional to service $ |
| CHK-P1-043 | Manual distribution | P1 | Override auto with custom amounts per staff |
| CHK-P1-044 | Equal split option | P1 | Divide tip equally regardless of service value |
| CHK-P1-045 | Assistant tip support | P1 | Allocate % of service provider's tip to assistant |

### 5.6 Draft Sales

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P1-046 | Auto-save draft | P1 | Save to IndexedDB every 30 seconds |
| CHK-P1-047 | Manual save for later | P1 | "Save for Later" button creates draft |
| CHK-P1-048 | Draft list view | P1 | See all saved drafts, filter by staff |
| CHK-P1-049 | Resume draft | P1 | Load draft back into checkout |
| CHK-P1-050 | Draft expiration | P1 | Auto-delete after 24 hours (configurable) |
| CHK-P2-051 | Part-paid tracking | P2 | Track partial payments on drafts |

### 5.7 Receipts

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P1-052 | Print receipt | P1 | Send to connected thermal or standard printer |
| CHK-P1-053 | Email receipt | P1 | Send to client email, pre-filled from profile |
| CHK-P1-054 | SMS receipt link | P1 | Send link to view digital receipt |
| CHK-P1-055 | Digital receipt view | P1 | Web-viewable receipt with shareable link |
| CHK-P2-056 | Receipt template customization | P2 | Configure logo, footer, fields shown |

### 5.8 Self-Checkout (Future)

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P2-057 | SMS checkout link | P2 | Generate secure link, 12-hour validity |
| CHK-P2-058 | QR code for in-store | P2 | Display code, 15-minute validity |
| CHK-P2-059 | Client payment page | P2 | Mobile-optimized page for tip + payment |
| CHK-P2-060 | Real-time completion update | P2 | Staff sees when client completes payment |

### 5.9 Offline Mode

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CHK-P0-061 | Offline detection | P0 | Banner shows when offline |
| CHK-P0-062 | Cash payments offline | P0 | Full cash checkout works without internet |
| CHK-P0-063 | Transaction queue | P0 | Offline transactions saved, synced when online |
| CHK-P0-064 | Card payment disabled offline | P0 | Clear message that card requires connection |
| CHK-P1-065 | Gift card offline lookup | P1 | Check cached balances, warn if stale |

---

## 6. Business Rules

### 6.1 Service Assignment Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-001 | Active staff assignment | New services added to currently active (selected) staff |
| CHK-BR-002 | First staff auto-active | When checkout opens, first staff with services is active |
| CHK-BR-003 | Staff switching | Clicking different staff card makes them active |
| CHK-BR-004 | Reassign service | Drag service to different staff group to reassign |
| CHK-BR-005 | Remove empty staff | If staff has no services, card is removed (unless active) |

### 6.2 Pricing Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-006 | Price override logging | All price changes logged with user, timestamp, original price |
| CHK-BR-007 | Manager approval threshold | Discounts > configured % require manager PIN |
| CHK-BR-008 | Discount stacking | Only one discount per service (replace, not stack) |
| CHK-BR-009 | Zero price allowed | Services can be $0 (e.g., complimentary) |
| CHK-BR-010 | Negative price not allowed | Prices cannot be negative |

### 6.3 Tip Calculation Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-011 | Tip basis | Calculate on subtotal (pre-tax) or total (post-tax) per config |
| CHK-BR-012 | Products in tip calculation | Include or exclude products per config |
| CHK-BR-013 | Proportional distribution | Default: tip allocated by service value proportion |
| CHK-BR-014 | Equal distribution | Option: divide tip equally among all staff |
| CHK-BR-015 | Manual override | Manual allocation must sum to total tip amount |
| CHK-BR-016 | Assistant tip | If assistant assigned, deduct % from provider's allocation |

### 6.4 Payment Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-017 | Payment must cover total | Cannot complete unless payment >= total |
| CHK-BR-018 | Overpayment handling | Excess payment treated as additional tip (with confirmation) |
| CHK-BR-019 | Split payment sequence | Process card payments first, then cash |
| CHK-BR-020 | Gift card priority | Gift cards applied before other methods |
| CHK-BR-021 | Gift card partial use | Can use partial balance, remainder on another method |
| CHK-BR-022 | Cash change calculation | Change = Amount Tendered - Amount Due |
| CHK-BR-023 | Card decline retry | Allow 3 retries before suggesting alternative |

### 6.5 Draft Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-024 | Auto-save trigger | Save every 30 seconds if there are unsaved changes |
| CHK-BR-025 | Draft ownership | Drafts associated with creating staff member |
| CHK-BR-026 | Draft expiration | Delete drafts older than 24 hours (configurable) |
| CHK-BR-027 | Draft resume | Loading draft restores full state including client |
| CHK-BR-028 | Concurrent draft limit | Max 5 drafts per staff (configurable) |

### 6.6 Status Tracking Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-029 | Status transitions | Not Started → In Progress → (Paused ↔ In Progress) → Completed |
| CHK-BR-030 | Timer accuracy | Timer tracks actual elapsed time excluding paused duration |
| CHK-BR-031 | Completion required for checkout | Warning if services not marked complete (override allowed) |
| CHK-BR-032 | Status change logging | All changes logged with user, timestamp, device |

### 6.7 Offline Rules

| ID | Rule | Logic |
|----|------|-------|
| CHK-BR-033 | Offline cash only | Only cash and cached gift cards work offline |
| CHK-BR-034 | Sync on reconnect | Auto-sync queued transactions when online |
| CHK-BR-035 | Sync conflict resolution | Server timestamp wins for conflicts |
| CHK-BR-036 | Offline transaction limit | Warn after 50 unsynced transactions |

---

## 7. UX Specifications

### 7.1 Layout Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [×] Close  [Clear]  [Dock/Full]  [? Shortcuts]      │
├────────────────────────────────┬─────────────────────────────┤
│   LEFT PANEL (140px dock)      │   RIGHT PANEL (flex)        │
│                                │   InteractiveSummary        │
│   ┌────────────────────────┐   │                             │
│   │ [Services] [Staff] tabs│   │   ┌─────────────────────┐   │
│   └────────────────────────┘   │   │ Client Section      │   │
│                                │   │ [Select client...]  │   │
│   When Services tab:           │   │ ⚠️ ALLERGY ALERT    │   │
│   ┌────────────────────────┐   │   └─────────────────────┘   │
│   │ Category 1             │   │                             │
│   │ Category 2             │   │   ┌─────────────────────┐   │
│   │ Category 3             │   │   │ Sarah Johnson    ▼  │   │
│   │ ...                    │   │   │ "Adding Here"       │   │
│   └────────────────────────┘   │   │ ┌─────────────────┐ │   │
│                                │   │ │ Haircut   $65  │ │   │
│   When Staff tab:              │   │ │ [In Progress]  │ │   │
│   ┌────────────────────────┐   │   │ └─────────────────┘ │   │
│   │ ┌──────┐ ┌──────┐      │   │   └─────────────────────┘   │
│   │ │Sarah │ │ Mike │      │   │                             │
│   │ │ ✓    │ │      │      │   │   ┌─────────────────────┐   │
│   │ └──────┘ └──────┘      │   │   │ Subtotal    $185.00 │   │
│   │ ┌──────┐ ┌──────┐      │   │   │ Tax          $15.73 │   │
│   │ │ Jane │ │ Tom  │      │   │   │ Total       $200.73 │   │
│   │ └──────┘ └──────┘      │   │   │ [  Checkout   ]     │   │
│   └────────────────────────┘   │   └─────────────────────┘   │
└────────────────────────────────┴─────────────────────────────┘
```

### 7.2 Staff Group Component

```
┌─────────────────────────────────────────────────────────────┐
│  ◉ Sarah Johnson                              [▼ Collapse]  │
│  ─────────────────────────────────────────────────────────  │
│  │ Adding Services Here                                  │  │
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

### 7.3 Client Alerts Component

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  ALLERGY ALERT                                      [×]  │
│ Allergic to: Latex, Certain hair dyes (PPD)                 │
│ [I Acknowledge]                                             │
└─────────────────────────────────────────────────────────────┘
     ↑ Red background (#FEE2E2), red border, blocks checkout

┌─────────────────────────────────────────────────────────────┐
│ 📝  Staff Notes                                        [×]  │
│ Prefers extra scalp massage. Always runs 10 min late.       │
└─────────────────────────────────────────────────────────────┘
     ↑ Yellow background (#FEF3C7), yellow border

┌─────────────────────────────────────────────────────────────┐
│ 💳  Outstanding Balance: $45.00                        [×]  │
│ From visit on Nov 15, 2025. [Add to Checkout]               │
└─────────────────────────────────────────────────────────────┘
     ↑ Orange background (#FFEDD5), orange border
```

### 7.4 Tip Distribution Component

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

### 7.5 Payment Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Checkout                                          [× Close] │
├─────────────────────────────────────────────────────────────┤
│ Step 1: Add Tip                                             │
│                                                             │
│ [18%]  [20%]  [22%]  [No Tip]  [Custom: $___]               │
│                                                             │
│ Selected: 20% = $40.12                                      │
├─────────────────────────────────────────────────────────────┤
│ Order Summary                                               │
│ Subtotal:        $200.61                                    │
│ Tax:              $16.55                                    │
│ Tip:              $40.12                                    │
│ ────────────────────────                                    │
│ Total:           $257.28                                    │
├─────────────────────────────────────────────────────────────┤
│                              [Continue to Payment →]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Checkout                                          [× Close] │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Payment Method                                      │
│                                                             │
│ Total Due: $257.28                                          │
│                                                             │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│ │   💳    │  │   💵    │  │   🎁    │  │   ✓✓    │         │
│ │  Card   │  │  Cash   │  │Gift Card│  │  Split  │         │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                             │
│ [Card selected]                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │  Ready for Tap to Pay                               │     │
│ │  Have client tap their card on the device           │     │
│ │                                                     │     │
│ │              [📱 Waiting for tap...]                │     │
│ └─────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│        [← Back]              [Process Payment $257.28]      │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` | Show shortcuts help |
| `Ctrl+K` | Search services |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Esc` | Close modal/checkout |
| `Enter` | Confirm/proceed |
| `Tab` | Next field |

---

## 8. Technical Requirements

### 8.1 Data Model

```typescript
interface CheckoutSession {
  id: string;
  ticketId?: string;
  clientId?: string;
  clientName?: string;
  isWalkIn: boolean;
  staffGroups: StaffGroup[];
  subtotal: number;
  discountTotal: number;
  taxRate: number;
  taxAmount: number;
  tip: number;
  tipAllocations: TipAllocation[];
  total: number;
  status: 'draft' | 'pending' | 'completed' | 'voided';
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
}

interface StaffGroup {
  staffId: string;
  staffName: string;
  staffPhoto?: string;
  isActive: boolean;
  services: CheckoutService[];
  subtotal: number;
}

interface CheckoutService {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  originalPrice: number;
  duration: number;
  status: ServiceStatus;
  statusHistory: ServiceStatusChange[];
  actualStartTime?: string;
  pausedAt?: string;
  totalPausedDuration: number;
  actualDuration?: number;
  discount?: ServiceDiscount;
  notes?: string;
}

type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

interface TipAllocation {
  staffId: string;
  staffName: string;
  amount: number;
  percentage: number;
  serviceValue: number;
}
```

### 8.2 Performance Targets

| Metric | Target |
|--------|--------|
| Checkout page load (cached) | < 500ms |
| Service addition response | < 200ms |
| Status change sync | < 1 second |
| Payment processing | < 3 seconds |
| Draft auto-save | < 500ms |
| Search response | < 300ms |

### 8.3 Offline Behavior

| Feature | Offline Support | Notes |
|---------|-----------------|-------|
| Service management | ✅ Full | Add, edit, remove services |
| Status tracking | ✅ Full (local) | Syncs when online |
| Cash payments | ✅ Full | Queued for sync |
| Card payments | ❌ | Requires connection |
| Client search | ⚠️ Cached | Search cached clients only |
| Receipt print | ✅ | Local printer connection |
| Receipt email/SMS | ❌ | Requires connection |

### 8.4 Payment Integration

**Processor:** Fiserv CommerceHub (via CardConnect merchant account)
**Technology:** Tap to Pay (SoftPOS) using device NFC

| Platform | SDK | Status |
|----------|-----|--------|
| iOS | FiservTTP (Swift) | Pending |
| Android | Fiserv TTP (Kotlin) | Pending |
| Web | Not supported | N/A |

> **Technical Details:** See [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md)

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Average checkout time | N/A | < 2 min (single) | Time from open to complete |
| Payment success rate | N/A | 95%+ first attempt | Successful / Total attempts |
| Staff adoption | N/A | 90%+ in 2 weeks | Active users / Total staff |
| Checkout error rate | N/A | < 2% | Errors / Total checkouts |
| Tip attachment rate | N/A | 70%+ | Checkouts with tip / Total |

### 9.2 Secondary KPIs

| Metric | Target | Purpose |
|--------|--------|---------|
| Average ticket value | +10% from baseline | Revenue growth |
| Draft save usage | Track | Feature adoption |
| Self-checkout adoption | 15% | Efficiency gain |
| Mobile checkout usage | 30%+ | Chairside adoption |
| Offline checkouts processed | Track | Reliability metric |

### 9.3 Analytics Events

| Event | Properties | Purpose |
|-------|------------|---------|
| `checkout_started` | source, staff_count, is_appointment | Track checkout initiation |
| `service_added` | service_id, staff_id, price | Service usage |
| `status_changed` | from_status, to_status, duration | Status tracking usage |
| `tip_selected` | type (preset/custom/none), percentage, amount | Tip behavior |
| `payment_processed` | method, amount, success, offline | Payment patterns |
| `checkout_completed` | duration_seconds, item_count, total | Completion tracking |
| `checkout_abandoned` | reason, stage, duration | Drop-off analysis |
| `draft_saved` | manual_or_auto, item_count | Draft usage |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Fiserv TTP integration complexity** | High | High | Phased rollout, extensive testing, fallback to manual entry |
| **Offline sync conflicts** | Medium | Medium | Server-wins policy, conflict logging for review |
| **Status sync latency** | Medium | Medium | Optimistic UI updates, background sync |
| **Large checkout performance** | Low | Medium | Virtualization for 20+ services, lazy loading |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Staff resistance to new workflow** | Medium | High | Training videos, phased rollout, feedback loop |
| **Tip distribution disputes** | Low | Medium | Clear preview before payment, audit trail |
| **Payment failures at busy times** | Medium | High | Offline cash fallback, retry logic, clear errors |
| **Draft data loss** | Low | Medium | Multiple save points, recovery mechanism |

### 10.3 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Staff-centric confusing at first** | Medium | Medium | Onboarding tutorial, visual cues, "Active" indicator |
| **Too many clicks for simple checkout** | Low | Medium | Quick checkout shortcut, smart defaults |
| **Allergy alert fatigue** | Low | High | Require acknowledgment, can't dismiss for safety |
| **Tip preset mismatch** | Low | Low | Configurable presets, custom option always available |

---

## 11. Implementation Plan

### Phase 1: Data Layer ✅ COMPLETE
- [x] ServiceStatus type and interfaces
- [x] TicketService interface updates
- [x] TipAllocation interface
- [x] Payment interface updates
- [x] Redux checkoutSlice creation

### Phase 2: Fix Broken UI ✅ COMPLETE
- [x] Fix bulk price editing handler
- [x] Fix discount service handler
- [x] All bulk service actions work

### Phase 3: Client Alerts & Info (1-2 days)
| Task | Requirements | Effort |
|------|--------------|--------|
| Create ClientAlerts component | CHK-P0-024 to CHK-P0-026 | Medium |
| Block status check | CHK-P1-027 | Small |
| Client quick stats | CHK-P1-028 | Small |

### Phase 4: Tip Distribution UI (2-3 days)
| Task | Requirements | Effort |
|------|--------------|--------|
| Show TipDistribution in payment flow | CHK-P0-041 | Medium |
| Auto-distribute by service value | CHK-P0-042 | Medium |
| Manual distribution UI | CHK-P1-043, CHK-P1-044 | Medium |
| Assistant tip support | CHK-P1-045 | Small |

### Phase 5: Status Persistence (2-3 days)
| Task | Requirements | Effort |
|------|--------------|--------|
| Save status to IndexedDB | CHK-P0-017 | Medium |
| Cross-device sync | CHK-P0-018 | Large |
| Status history logging | CHK-P1-019 | Small |

### Phase 6: Draft Sales System (3-4 days)
| Task | Requirements | Effort |
|------|--------------|--------|
| Auto-save to IndexedDB | CHK-P1-046 | Medium |
| Draft list view | CHK-P1-048 | Medium |
| Resume draft functionality | CHK-P1-049 | Medium |
| Draft expiration | CHK-P1-050 | Small |

### Phase 7: Payment Integration (8-14 days)
| Task | Requirements | Effort |
|------|--------------|--------|
| Capacitor project setup | CHK-P0-029 | Large |
| FiservTTP iOS plugin | CHK-P0-029 | Large |
| Fiserv TTP Android plugin | CHK-P0-029 | Large |
| Payment flow integration | CHK-P0-034, CHK-P0-035 | Medium |
| Decline handling | CHK-P0-034 | Medium |

### Phase 8: Receipts & Self-Checkout (4-5 days)
| Task | Requirements | Effort |
|------|--------------|--------|
| Print receipt | CHK-P1-052 | Medium |
| Email receipt | CHK-P1-053 | Medium |
| SMS receipt | CHK-P1-054 | Medium |
| Self-checkout link | CHK-P2-057 to CHK-P2-060 | Large |

### Implementation Timeline Summary

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 1: Data Layer | - | ✅ Complete |
| Phase 2: Fix Broken UI | 2-3 days | ✅ Complete |
| Phase 3: Client Alerts | 1-2 days | **Next** |
| Phase 4: Tip Distribution | 2-3 days | Pending |
| Phase 5: Status Persistence | 2-3 days | Pending |
| Phase 6: Draft Sales | 3-4 days | Pending |
| Phase 7: Payment Integration | 8-14 days | Pending |
| Phase 8: Receipts & Self-Checkout | 4-5 days | Pending |
| **Total Remaining** | **~24-34 days** | |

---

## Appendix

### A. Related Documents

| Document | Purpose |
|----------|---------|
| [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md) | Fiserv TTP technical details |
| [PRD-Transactions-Module.md](./PRD-Transactions-Module.md) | Transaction history and refunds |
| [PRD-Reports-Module.md](./PRD-Reports-Module.md) | Sales reporting |
| [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md) | System architecture |

### B. File Locations

| Component | Path |
|-----------|------|
| Main checkout | `src/components/checkout/TicketPanel.tsx` |
| Summary panel | `src/components/checkout/InteractiveSummary.tsx` |
| Staff groups | `src/components/checkout/StaffGroup.tsx` |
| Payment modal | `src/components/checkout/PaymentModal.tsx` |
| Checkout slice | `src/store/slices/checkoutSlice.ts` |
| Ticket types | `src/types/Ticket.ts` |
| Config | `src/constants/checkoutConfig.ts` |

### C. Glossary

| Term | Definition |
|------|------------|
| **Active Staff** | Currently selected staff member who receives new services |
| **Staff Group** | Collapsible card showing all services for one staff member |
| **Dock Mode** | Compact 2-panel layout (900px width) |
| **Full Mode** | Expanded layout for larger screens |
| **Draft Sale** | Incomplete checkout saved for later |
| **Split Payment** | Using multiple payment methods for one transaction |
| **Tip Distribution** | Allocation of tips across staff members |
| **Tap to Pay** | NFC contactless payment using device (SoftPOS) |

### D. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 25, 2025 | Initial PRD |
| 2.0 | Dec 1, 2025 | Added Fresha features, 3-panel layout |
| 3.0 | Dec 2, 2025 | Revised to match actual 2-panel staff-centric design |
| 3.1 | Dec 2, 2025 | Gap analysis corrections, added Phase 2 |
| 3.2 | Dec 27, 2025 | Payment integration update: Fiserv CommerceHub |
| 4.0 | Dec 28, 2025 | Restructured to standard 11-section format, added 65 requirements with IDs, 36 business rules, 13 use cases, risks section |

---

*Document Version: 4.0 | Updated: December 28, 2025*
