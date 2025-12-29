# Product Requirements Document: Transactions Module

**Product:** Mango POS
**Module:** Transactions (History & Management)
**Version:** 2.0
**Last Updated:** December 28, 2025
**Status:** In Development
**Priority:** P1 (High)

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

The Transactions Module provides complete access to transaction history, enabling staff to view past sales, reprint receipts, process refunds, and void transactions. This is the record-keeping and post-transaction management hub for all financial operations, ensuring accountability and audit compliance.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Complete Transaction History** | Searchable, filterable record of all sales with full detail |
| **Receipt Management** | Reprint, email, or SMS any receipt on demand |
| **Refund & Void Processing** | Handle returns and corrections with mandatory audit trail |
| **Staff Accountability** | Track earnings, commissions, and tips per staff member |
| **Offline Access** | View cached transactions even without internet |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Transaction lookup time | < 10 seconds from search to detail view |
| Refund processing time | < 2 minutes end-to-end |
| Receipt delivery success | 99%+ for email/SMS |
| Audit trail completeness | 100% of voids/refunds logged with reason |
| Data accuracy | 100% match between transaction and payment records |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **No transaction history** | Can't find past sales for customer inquiries | Searchable transaction list with multiple filters |
| **Lost receipts** | Client needs receipt, staff can't provide | Reprint/resend any receipt instantly |
| **Refund chaos** | Manual tracking leads to errors and disputes | Structured refund flow with mandatory audit trail |
| **End-of-day mystery** | Cash drawer doesn't match expected totals | Quick analytics summary with payment breakdown |
| **No accountability** | Don't know who processed refunds/voids | Complete audit log with user tracking |
| **Paper-based records** | Physical receipts lost, no backup | Digital storage with cloud sync |

### 2.2 User Quotes

> "When a client calls asking for a receipt from last week, I have to dig through paper files for 10 minutes." — Salon Manager

> "I voided a transaction but didn't write down why. Now I can't remember what happened." — Front Desk Staff

> "My cash drawer was $50 short but I had no way to trace what went wrong." — Salon Owner

### 2.3 Market Opportunity

| Opportunity | Description |
|-------------|-------------|
| **Offline capability** | Unique ability to view transactions during internet outages |
| **Mobile-first** | Transaction management optimized for tablet on salon floor |
| **Integrated audit** | Complete accountability trail built-in |

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Front Desk Coordinator

**Profile:**
- Handles day-to-day transaction inquiries
- Processes receipt requests from clients
- First point of contact for refund requests
- Needs quick access to transaction details

**Goals:**
- Find any transaction quickly by client name or phone
- Resend receipts without manager assistance
- Escalate refund requests to manager with full context
- Verify transaction details for customer disputes

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| TXN-UC-001 | Search for a transaction by client name | P0 | Results appear in < 500ms, partial match supported |
| TXN-UC-002 | Reprint receipt for client | P0 | Receipt prints within 5 seconds |
| TXN-UC-003 | Email receipt to client | P0 | Email sent within 30 seconds, delivery confirmed |
| TXN-UC-004 | SMS receipt link to client | P0 | SMS sent within 30 seconds with valid link |
| TXN-UC-009 | Find transaction by phone number | P0 | Last 4 digits match works, full number match works |

### 3.2 Secondary User: Salon Manager

**Profile:**
- Responsible for end-of-day reconciliation
- Approves refunds and voids
- Reviews staff performance and earnings
- Handles escalated customer disputes

**Goals:**
- Process refunds and voids with proper documentation
- Reconcile cash drawer at end of day
- Review staff earnings for payroll
- Export transaction data for accounting

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| TXN-UC-005 | Review today's sales summary | P0 | Summary shows total revenue, count, tips, payment breakdown |
| TXN-UC-006 | Void an incorrect transaction | P0 | Void completes with reason logged, payment reversed |
| TXN-UC-007 | Export transactions for accounting | P0 | CSV/PDF exports all filtered transactions |
| TXN-UC-008 | Review staff earnings breakdown | P1 | Each staff's commission and tips visible |
| TXN-UC-010 | Process a partial refund | P0 | Specific amount or line items refundable |
| TXN-UC-011 | Approve large refund request | P1 | Manager PIN required for refunds over threshold |

### 3.3 Tertiary User: Salon Owner

**Profile:**
- Reviews business performance remotely
- Sets refund/void policies and thresholds
- Audits staff accountability
- Prepares financial reports

**Goals:**
- Monitor refund/void patterns for fraud detection
- Review complete audit trail when needed
- Configure approval thresholds and permissions
- Generate reports for accountant

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| TXN-UC-012 | Review audit trail for specific transaction | P1 | All modifications with timestamp and user visible |
| TXN-UC-013 | Configure refund approval threshold | P1 | Threshold saved and applied to future refunds |
| TXN-UC-014 | View refund/void summary for date range | P1 | Aggregated view of all voids/refunds with reasons |

---

## 4. Competitive Analysis

### 4.1 Feature Comparison

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Transaction search | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-filter support | ✅ | Partial | Partial | ✅ | Partial |
| Search by phone (last 4) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Receipt resend (email/SMS) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Partial refunds | ✅ | ✅ | ❌ | ✅ | ✅ |
| Void with reason required | ✅ | Partial | ❌ | ✅ | Partial |
| Manager approval workflow | ✅ | ❌ | ❌ | ✅ | Partial |
| Offline transaction view | ✅ | ❌ | ❌ | Partial | ❌ |
| Staff commission view | ✅ | ✅ | Partial | ❌ | ✅ |
| Complete audit trail | ✅ | Partial | ❌ | ✅ | Partial |
| Batch export (CSV/PDF) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Saved filter presets | ⏳ P2 | ❌ | ❌ | ✅ | ❌ |

### 4.2 Competitive Advantages

| Advantage | Description |
|-----------|-------------|
| **Offline-first** | View and search 30 days of cached transactions during outages |
| **Phone search** | Search by last 4 digits of phone number (uncommon feature) |
| **Complete audit trail** | Every modification logged with user, timestamp, and reason |
| **Integrated approval workflow** | Configurable manager approval for voids/refunds |

### 4.3 Competitive Gaps to Address

| Gap | Priority | Notes |
|-----|----------|-------|
| Saved filter presets | P2 | Square has this, useful for daily workflows |
| Batch receipt operations | P2 | Print/email multiple receipts at once |
| Transaction tags/notes | P3 | Custom labels for transactions |

---

## 5. Feature Requirements

### 5.1 Transaction List View

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P0-001 | Display today's transactions by default | P0 | Sorted newest first, loads in < 1 second, auto-refreshes |
| TXN-P0-002 | Show transaction ID, time, client, amount, status | P0 | All fields visible on card without expanding |
| TXN-P0-003 | Status badges (Completed, Refunded, Voided) | P0 | Color-coded: Green=Completed, Yellow=Refunded, Red=Voided |
| TXN-P0-004 | Show payment method icon | P0 | Distinct icons for card, cash, digital wallet, gift card |
| TXN-P0-005 | Show staff name(s) who performed service | P0 | Display all assigned staff, truncate if >2 with "+N more" |
| TXN-P1-047 | Show services summary on card | P1 | List of service names, truncate if >3 |
| TXN-P1-048 | Tap to expand card inline | P1 | Quick view without opening full modal |
| TXN-P1-049 | Pull-to-refresh | P1 | Refresh list by pulling down on mobile |

### 5.2 Search & Filter

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P0-006 | Search by client name | P0 | Partial match, case-insensitive, results in < 500ms |
| TXN-P0-007 | Search by transaction ID | P0 | Exact match, accepts partial ID (last 4 digits) |
| TXN-P0-008 | Search by phone number | P0 | Last 4 digits or full number, formats normalized |
| TXN-P0-009 | Filter by date range | P0 | Presets: Today, Yesterday, Last 7/30 days, Custom range |
| TXN-P0-010 | Filter by payment method | P0 | Card, Cash, Digital, Gift Card, Split payment |
| TXN-P1-011 | Filter by staff member | P1 | Multi-select dropdown with staff photos |
| TXN-P1-012 | Filter by status | P1 | Completed, Refunded, Voided, Pending |
| TXN-P1-013 | Filter by amount range | P1 | Presets: Under $50, $50-100, $100-200, $200+, Custom |
| TXN-P1-014 | Sort options | P1 | Date (asc/desc), Amount (asc/desc), Client name, Staff |
| TXN-P2-015 | Saved filter presets | P2 | Save current filters as named preset, load with one tap |
| TXN-P1-050 | Clear all filters button | P1 | One-tap reset to default view (today, all statuses) |
| TXN-P1-051 | Filter count badge | P1 | Show number of active filters on filter button |

### 5.3 Transaction Detail View

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P0-016 | Show full transaction breakdown | P0 | Services, products, discounts, tax, tip, total line items |
| TXN-P0-017 | Show client information | P0 | Name, photo (if available), phone, email |
| TXN-P0-018 | Show staff assignments | P0 | Who performed each service with their photo |
| TXN-P0-019 | Show payment details | P0 | Method, last 4 digits (if card), auth code, timestamp |
| TXN-P1-020 | Show staff earnings | P1 | Commission + tip per staff member, visible to managers |
| TXN-P1-021 | Show audit trail | P1 | Created by, modified by, all changes with timestamps |
| TXN-P1-052 | Show original ticket link | P1 | Navigate to original ticket if still exists |
| TXN-P1-053 | Show related transactions | P1 | Link to refund if refunded, link to original if this is refund |

### 5.4 Receipt Actions

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P0-022 | Reprint receipt to printer | P0 | Sends to connected receipt printer, prints within 5 seconds |
| TXN-P0-023 | Email receipt | P0 | Pre-fills client email, allows edit, sends within 30 seconds |
| TXN-P0-024 | SMS receipt link | P0 | Pre-fills client phone, sends link to web receipt view |
| TXN-P1-025 | View digital receipt | P1 | Full-screen preview of receipt, shareable link |
| TXN-P1-054 | Copy receipt link | P1 | Copy shareable link to clipboard |
| TXN-P2-055 | Receipt delivery confirmation | P2 | Track email/SMS delivery status |

### 5.5 Void Transaction

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P0-026 | Void button (with permission) | P0 | Only visible to users with void permission |
| TXN-P0-027 | Void reason required | P0 | Dropdown with common reasons + custom text option |
| TXN-P0-028 | Manager approval (configurable) | P0 | If enabled, requires manager PIN before processing |
| TXN-P0-029 | Payment reversal | P0 | Automatically reverse card charge, note for cash |
| TXN-P0-030 | Inventory restoration | P0 | Restore product stock if applicable |
| TXN-P0-031 | Commission reversal | P0 | Adjust staff earnings to reflect void |
| TXN-P0-032 | Void receipt generation | P0 | Generate void confirmation receipt, option to print/email |
| TXN-P1-056 | Void confirmation dialog | P1 | Two-step confirmation with summary of what will be reversed |

### 5.6 Refund Transaction

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P0-033 | Full refund option | P0 | Refund entire transaction amount with one tap |
| TXN-P0-034 | Partial refund option | P0 | Specify exact amount or select specific line items |
| TXN-P0-035 | Refund reason required | P0 | Dropdown with common reasons + custom text option |
| TXN-P0-036 | Refund to original payment | P0 | Card refund processes automatically, cash shows drawer note |
| TXN-P0-037 | Refund receipt generation | P0 | Generate refund confirmation receipt |
| TXN-P1-038 | Manager approval for large refunds | P1 | Configurable threshold (e.g., >$100) requires approval |
| TXN-P1-057 | Line item selection for partial | P1 | Select specific services/products to refund |
| TXN-P1-058 | Refund amount validation | P1 | Cannot exceed original transaction amount |
| TXN-P1-059 | Multiple partial refunds | P1 | Allow additional partial refunds up to remaining amount |

### 5.7 Quick Analytics

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P1-039 | Summary bar with today's totals | P1 | Shows total revenue, transaction count, average ticket, tips |
| TXN-P2-040 | Payment method breakdown | P2 | Pie or bar chart showing card/cash/digital split |
| TXN-P2-041 | Staff performance highlights | P2 | Top 3 earners for the day with revenue |
| TXN-P2-060 | Void/refund summary | P2 | Count and total amount of voids/refunds today |

### 5.8 Export & Batch Operations

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TXN-P1-042 | Multi-select mode | P1 | Checkbox selection on transaction cards |
| TXN-P1-043 | Export to CSV | P1 | Export selected or all filtered transactions to CSV |
| TXN-P1-044 | Export to PDF | P1 | Formatted report with salon branding |
| TXN-P2-045 | Batch receipt print | P2 | Print receipts for multiple selected transactions |
| TXN-P2-046 | Batch receipt email | P2 | Email receipts to multiple clients at once |
| TXN-P1-061 | Export confirmation | P1 | Toast notification when export completes with download |
| TXN-P2-062 | Schedule export | P2 | Configure automatic daily/weekly export email |

---

## 6. Business Rules

### 6.1 Access Permissions

| Action | Staff | Manager | Owner |
|--------|-------|---------|-------|
| View all transactions | ✅ | ✅ | ✅ |
| View own transactions only | ✅ (configurable) | N/A | N/A |
| Reprint/resend receipt | ✅ | ✅ | ✅ |
| Void transaction | ❌ | ✅ | ✅ |
| Refund transaction | ❌ | ✅ | ✅ |
| View staff earnings | ❌ | ✅ | ✅ |
| View audit trail | ❌ | ✅ | ✅ |
| Export data | ❌ | ✅ | ✅ |
| Configure thresholds | ❌ | ❌ | ✅ |

### 6.2 Void Rules

| ID | Rule | Logic |
|----|------|-------|
| TXN-BR-001 | Same-day void only | Can only void transactions from current business day |
| TXN-BR-002 | Refund for older transactions | After business day ends, must use refund instead of void |
| TXN-BR-003 | Void is permanent | Voided transactions cannot be un-voided |
| TXN-BR-004 | Void reason mandatory | Reason must be selected/entered before processing |
| TXN-BR-005 | Full audit logging | All void actions logged with user, timestamp, reason |
| TXN-BR-016 | Card reversal timing | Card void must occur within 24 hours for automatic reversal |
| TXN-BR-017 | Pending transactions | Cannot void a transaction that is still pending payment |

### 6.3 Refund Rules

| ID | Rule | Logic |
|----|------|-------|
| TXN-BR-006 | Refund window | Can refund transactions up to 90 days old (configurable) |
| TXN-BR-007 | Partial refunds allowed | Any amount up to remaining balance can be refunded |
| TXN-BR-008 | Original payment method | Refunds process to original payment method when possible |
| TXN-BR-009 | Refund reason mandatory | Reason must be selected/entered before processing |
| TXN-BR-010 | Manager approval threshold | Configurable: refunds > $X require manager PIN |
| TXN-BR-011 | Cash refund documentation | Cash refunds require drawer adjustment note |
| TXN-BR-018 | Multiple partial refunds | Can issue multiple partial refunds up to original total |
| TXN-BR-019 | Tip refund handling | Tips can be refunded separately from services |
| TXN-BR-020 | Already refunded check | Cannot refund a transaction that is already fully refunded |

### 6.4 Data Retention

| ID | Rule | Logic |
|----|------|-------|
| TXN-BR-012 | Local cache duration | Last 30 days cached locally for offline access |
| TXN-BR-013 | On-demand fetch | Older transactions fetched from server when searched |
| TXN-BR-014 | Archive policy | Deleted transactions archived, never permanently deleted |
| TXN-BR-015 | Audit trail retention | Audit trail retained indefinitely for compliance |

### 6.5 Search Rules

| ID | Rule | Logic |
|----|------|-------|
| TXN-BR-021 | Search minimum | Minimum 2 characters to trigger search |
| TXN-BR-022 | Phone search normalization | Phone numbers normalized (remove dashes, spaces, parentheses) |
| TXN-BR-023 | Case insensitive | All text searches are case-insensitive |
| TXN-BR-024 | Partial matching | Names match from beginning or any word |
| TXN-BR-025 | Search result limit | Maximum 100 results shown, prompt to narrow filters |

### 6.6 Calculation Rules

| ID | Rule | Formula |
|----|------|---------|
| TXN-BR-026 | Refund commission adjustment | Refunded amount proportionally reduces staff commission |
| TXN-BR-027 | Tip refund handling | Tips refunded separately, go back to client not staff |
| TXN-BR-028 | Tax refund calculation | Tax refunded proportionally to refunded items |
| TXN-BR-029 | Summary calculations | Summary totals exclude voided transactions |

---

## 7. UX Specifications

### 7.1 Transaction List Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Transactions              [Today ▼]  [Filter (2)]  [🔍 Search]  │
├─────────────────────────────────────────────────────────────────┤
│ Summary: 24 transactions | $3,450 revenue | $485 tips           │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ #TXN-001234  │ 2:45 PM │ Sarah Johnson │ $145.00 │ 💳 │ ✅  │ │
│ │ Manicure, Pedicure, Gel Polish │ Zeus                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ #TXN-001233  │ 1:30 PM │ Mike Chen     │ $85.00  │ 💵 │ ✅  │ │
│ │ Haircut, Beard Trim │ Lisa                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ #TXN-001232  │ 12:15 PM│ Amy Wilson    │ $45.00  │ 💳 │ ↩️  │ │
│ │ Eyebrow Wax │ Tom │ REFUNDED ($45.00)                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ #TXN-001231  │ 11:00 AM│ John Davis    │ $0.00   │ 💳 │ 🚫  │ │
│ │ Full Set │ Amy │ VOIDED: Duplicate entry                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Transaction Card Specifications

| Element | Specification |
|---------|---------------|
| Card height | 72px minimum |
| Card padding | 16px |
| Transaction ID | 14px mono font, gray-600 |
| Time | 14px, gray-500 |
| Client name | 16px medium weight, primary text color |
| Amount | 18px bold, right-aligned |
| Payment icon | 20x20px |
| Status badge | 24px height, pill shape |
| Services line | 14px, gray-600, truncate at 2 lines |
| Staff name | 14px, gray-500 |
| Tap action | Opens detail modal |

### 7.3 Transaction Detail Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Transaction #TXN-001234                              [X Close]  │
├─────────────────────────────────────────────────────────────────┤
│ Status: ✅ Completed                   Date: Dec 28, 2025 2:45PM│
├─────────────────────────────────────────────────────────────────┤
│ CLIENT                                                          │
│ [Photo] Sarah Johnson                                           │
│         📞 (555) 123-4567  ✉️ sarah@email.com                    │
├─────────────────────────────────────────────────────────────────┤
│ SERVICES                                            Staff       │
│ Manicure                                  $35.00    Zeus        │
│ Pedicure                                  $55.00    Zeus        │
│ Gel Polish Add-On                         $25.00    Zeus        │
│ ─────────────────────────────────────────────────────────────── │
│ Subtotal                                            $115.00     │
│ Tax (8.25%)                                           $9.49     │
│ Tip                                                  $20.51     │
│ ─────────────────────────────────────────────────────────────── │
│ TOTAL                                               $145.00     │
├─────────────────────────────────────────────────────────────────┤
│ PAYMENT                                                         │
│ 💳 Visa ending in 4242                                          │
│ Auth Code: A12345 | Processed: 2:45:32 PM                       │
├─────────────────────────────────────────────────────────────────┤
│ STAFF EARNINGS (Manager/Owner only)                             │
│ Zeus: Commission $23.00 + Tip $20.51 = $43.51                   │
├─────────────────────────────────────────────────────────────────┤
│ AUDIT TRAIL                                                     │
│ Created: Dec 28, 2:45 PM by Front Desk                          │
│ Receipt emailed: Dec 28, 2:46 PM                                │
├─────────────────────────────────────────────────────────────────┤
│ [🖨️ Print]  [✉️ Email]  [📱 SMS]  [↩️ Refund]  [🚫 Void]        │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Status Badges

| Status | Background | Text Color | Icon |
|--------|------------|------------|------|
| Completed | Green-100 (#DCFCE7) | Green-800 (#166534) | ✅ |
| Refunded | Yellow-100 (#FEF9C3) | Yellow-800 (#854D0E) | ↩️ |
| Partially Refunded | Yellow-100 (#FEF9C3) | Yellow-800 (#854D0E) | ↩️ (partial) |
| Voided | Red-100 (#FEE2E2) | Red-800 (#991B1B) | 🚫 |
| Pending | Blue-100 (#DBEAFE) | Blue-800 (#1E40AF) | ⏳ |

### 7.5 Filter Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ Filters                                              [Clear All]│
├─────────────────────────────────────────────────────────────────┤
│ Date Range:  [Today ▼] → [Today ▼]                              │
│              Today | Yesterday | Last 7 Days | Last 30 Days     │
├─────────────────────────────────────────────────────────────────┤
│ Payment Method:  [ ] Card  [ ] Cash  [ ] Digital  [ ] Gift Card │
├─────────────────────────────────────────────────────────────────┤
│ Status:  [ ] Completed  [ ] Refunded  [ ] Voided                │
├─────────────────────────────────────────────────────────────────┤
│ Staff:  [Select staff...                              ▼]        │
├─────────────────────────────────────────────────────────────────┤
│ Amount:  [ ] Under $50  [ ] $50-100  [ ] $100-200  [ ] $200+    │
│          Custom: [$___] to [$___]                               │
├─────────────────────────────────────────────────────────────────┤
│                              [Apply Filters]                    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.6 Refund Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Refund Transaction #TXN-001234                       [X Close]  │
├─────────────────────────────────────────────────────────────────┤
│ Original Amount: $145.00                                        │
│ Already Refunded: $0.00                                         │
│ Available to Refund: $145.00                                    │
├─────────────────────────────────────────────────────────────────┤
│ Refund Type:                                                    │
│   ● Full Refund ($145.00)                                       │
│   ○ Partial Refund                                              │
│     Amount: [$_______]  OR  Select Items:                       │
│     [ ] Manicure - $35.00                                       │
│     [ ] Pedicure - $55.00                                       │
│     [ ] Gel Polish - $25.00                                     │
│     [ ] Tax (proportional)                                      │
│     [ ] Tip - $20.51                                            │
├─────────────────────────────────────────────────────────────────┤
│ Refund Reason: [Select reason...                         ▼]     │
│                ○ Client dissatisfied                            │
│                ○ Service not completed                          │
│                ○ Wrong charge                                   │
│                ○ Duplicate transaction                          │
│                ○ Other: [________________]                      │
├─────────────────────────────────────────────────────────────────┤
│ Refund To: 💳 Visa ending in 4242 (original payment)            │
├─────────────────────────────────────────────────────────────────┤
│              [Cancel]              [Process Refund $145.00]     │
└─────────────────────────────────────────────────────────────────┘
```

### 7.7 Empty States

**No transactions today:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      🧾                                         │
│                                                                 │
│             No transactions yet today.                          │
│          First sale will appear here.                           │
│                                                                 │
│                 [Go to Front Desk]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**No search results:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      🔍                                         │
│                                                                 │
│         No transactions match your search.                      │
│       Try different keywords or adjust filters.                 │
│                                                                 │
│                 [Clear Filters]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 Data Model

```typescript
interface Transaction {
  id: string;
  transactionNumber: string; // Human-readable: TXN-001234
  salonId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientPhoto?: string;
  services: TransactionService[];
  products: TransactionProduct[];
  subtotal: number;
  discounts: TransactionDiscount[];
  discountTotal: number;
  taxRate: number;
  taxAmount: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  status: TransactionStatus;
  staffEarnings: StaffEarning[];
  ticketId?: string; // Link to original ticket
  createdAt: string; // ISO timestamp
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  refunds: RefundRecord[];
  auditTrail: AuditEntry[];
}

type TransactionStatus = 'completed' | 'refunded' | 'partially_refunded' | 'voided' | 'pending';

interface StaffEarning {
  staffId: string;
  staffName: string;
  staffPhoto?: string;
  commission: number;
  commissionRate: number;
  tip: number;
  total: number;
  serviceIds: string[];
}

interface RefundRecord {
  id: string;
  amount: number;
  reason: string;
  refundedItems?: string[]; // Service/product IDs
  refundedBy: string;
  refundedAt: string;
  paymentMethod: PaymentMethod;
  authCode?: string;
}

interface AuditEntry {
  action: 'created' | 'voided' | 'refunded' | 'receipt_sent' | 'modified';
  performedBy: string;
  performedAt: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

interface PaymentDetails {
  method: PaymentMethod;
  cardType?: string; // Visa, Mastercard, Amex
  lastFour?: string;
  authCode?: string;
  processedAt: string;
  splitPayments?: SplitPayment[];
}

type PaymentMethod = 'card' | 'cash' | 'digital' | 'gift_card' | 'split';
```

### 8.2 Performance Targets

| Metric | Target |
|--------|--------|
| Initial load (today's transactions) | < 1 second |
| Search response | < 500ms |
| Filter application | < 300ms |
| Transaction detail load | < 500ms |
| Receipt email delivery | < 30 seconds |
| Receipt SMS delivery | < 30 seconds |
| Void processing | < 3 seconds |
| Refund processing | < 3 seconds |
| Export generation (100 transactions) | < 5 seconds |

### 8.3 Offline Behavior

| Capability | Offline Support | Notes |
|------------|-----------------|-------|
| View cached transactions | ✅ | Last 30 days cached locally |
| Search/filter cached | ✅ | Full search on cached data |
| View transaction details | ✅ | Full detail for cached transactions |
| Reprint cached receipts | ✅ | If connected to local printer |
| Email/SMS receipt | ❌ | Requires connection |
| Void transaction | ❌ | Requires connection for reversal |
| Refund transaction | ❌ | Requires connection for payment |
| Export data | ❌ | Requires connection |
| View older transactions | ❌ | Must fetch from server |

### 8.4 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/transactions` | GET | List transactions with filters |
| `/transactions/:id` | GET | Get transaction detail |
| `/transactions/:id/void` | POST | Void a transaction |
| `/transactions/:id/refund` | POST | Process refund |
| `/transactions/:id/receipt` | POST | Send receipt (email/SMS) |
| `/transactions/export` | POST | Generate export file |
| `/transactions/summary` | GET | Get summary statistics |

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Transaction lookup time | N/A | < 10 seconds | Time from search to detail view |
| Receipt resend success | N/A | 99%+ | Email/SMS delivery confirmation |
| Refund processing accuracy | N/A | 100% | Amount matches expected, no errors |
| Void audit completeness | N/A | 100% | All voids have reason logged |
| User satisfaction | N/A | 4.5/5 | In-app rating |
| Feature adoption | N/A | 80%+ | Managers using weekly |

### 9.2 Analytics Events

| Event | Properties | Purpose |
|-------|------------|---------|
| `transaction_searched` | query_type, query_length, result_count, time_ms | Search behavior |
| `transaction_filtered` | filter_types[], result_count | Filter usage |
| `transaction_viewed` | transaction_id, age_days, source | Detail view engagement |
| `receipt_resent` | method (print/email/sms), success, error_type | Receipt delivery |
| `transaction_voided` | transaction_id, reason_category, amount, time_to_complete | Void patterns |
| `transaction_refunded` | transaction_id, reason_category, amount, is_partial, time_to_complete | Refund patterns |
| `transactions_exported` | format (csv/pdf), count, date_range_days | Export usage |
| `filter_preset_saved` | preset_name, filter_types[] | Preset adoption |

### 9.3 Leading Indicators

| Indicator | Signal |
|-----------|--------|
| Search usage frequency | Feature discoverability |
| Filter combination patterns | Workflow optimization needs |
| Time from search to action | UX efficiency |
| Void/refund rate | Potential issues with checkout |
| Receipt resend rate | Client communication needs |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Payment reversal failures** | Low | High | Retry logic with exponential backoff, manual fallback process |
| **Large data set performance** | Medium | Medium | Pagination, date range limits, background indexing |
| **Receipt email delivery** | Low | Medium | Retry queue, alternative SMS option, delivery tracking |
| **Offline data stale** | Medium | Medium | Clear "last synced" indicator, prompt to refresh when online |
| **Concurrent void/refund** | Low | High | Optimistic locking, conflict detection |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Fraudulent refunds** | Low | High | Manager approval workflow, audit trail, pattern detection |
| **Accidental voids** | Medium | Medium | Two-step confirmation, reason required, undo within 30 seconds |
| **Data loss** | Very Low | Critical | Multi-layer backup, audit log retention, soft deletes |
| **Staff gaming commissions** | Low | Medium | Audit trail, manager review of patterns |
| **Compliance issues** | Low | High | Complete audit trail, configurable retention |

### 10.3 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Search not finding transaction** | Medium | High | Multiple search fields, fuzzy matching, phone search |
| **Refund flow confusing** | Medium | Medium | Step-by-step wizard, clear amounts, preview before confirm |
| **Filter complexity** | Low | Medium | Smart defaults, saved presets, clear all button |
| **Receipt delivery failure** | Low | Medium | Delivery confirmation, retry option, alternative methods |

---

## 11. Implementation Plan

### Phase 1: Core List & Search (Week 1-2)

| Task | Requirements | Effort |
|------|--------------|--------|
| Transaction list view | TXN-P0-001 to TXN-P0-005 | Medium |
| Search functionality | TXN-P0-006 to TXN-P0-008 | Medium |
| Basic filters | TXN-P0-009, TXN-P0-010 | Medium |
| Transaction detail view | TXN-P0-016 to TXN-P0-019 | Medium |

**Phase 1 Acceptance Criteria:**
- Today's transactions display in < 1 second
- Search by name, ID, phone works
- Detail modal shows full breakdown

### Phase 2: Receipt Actions (Week 3)

| Task | Requirements | Effort |
|------|--------------|--------|
| Print receipt | TXN-P0-022 | Small |
| Email receipt | TXN-P0-023 | Medium |
| SMS receipt | TXN-P0-024 | Medium |
| Digital receipt view | TXN-P1-025 | Small |

**Phase 2 Acceptance Criteria:**
- Receipts print within 5 seconds
- Email/SMS sent within 30 seconds
- Delivery confirmation tracking works

### Phase 3: Void & Refund (Week 4-5)

| Task | Requirements | Effort |
|------|--------------|--------|
| Void flow | TXN-P0-026 to TXN-P0-032 | Large |
| Full refund flow | TXN-P0-033, TXN-P0-035 to TXN-P0-037 | Medium |
| Partial refund | TXN-P0-034, TXN-P1-057 to TXN-P1-059 | Large |
| Manager approval | TXN-P0-028, TXN-P1-038 | Medium |

**Phase 3 Acceptance Criteria:**
- Voids reverse payment and restore inventory
- Partial refunds calculate correctly
- Audit trail complete for all actions

### Phase 4: Enhanced Features (Week 6+)

| Task | Requirements | Effort |
|------|--------------|--------|
| Advanced filters | TXN-P1-011 to TXN-P1-014 | Medium |
| Staff earnings view | TXN-P1-020 | Small |
| Audit trail display | TXN-P1-021 | Small |
| Quick analytics | TXN-P1-039, TXN-P2-040, TXN-P2-041 | Medium |
| Export functionality | TXN-P1-042 to TXN-P1-044 | Medium |
| Saved filter presets | TXN-P2-015 | Medium |
| Batch operations | TXN-P2-045, TXN-P2-046 | Large |

---

## Appendix

### A. Related Documents

| Document | Purpose |
|----------|---------|
| [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) | Checkout flow that creates transactions |
| [PRD-Reports-Module.md](./PRD-Reports-Module.md) | Advanced analytics using transaction data |
| [PRD-Team-Module.md](./PRD-Team-Module.md) | Staff commission configuration |
| [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md) | System architecture |

### B. Void Reason Options

| Reason | Description |
|--------|-------------|
| Duplicate entry | Transaction was entered twice |
| Client did not show | No-show, service not rendered |
| Payment declined | Payment failed after checkout |
| Wrong amount | Incorrect total charged |
| Wrong services | Services entered incorrectly |
| Staff error | General staff mistake |
| Other | Custom reason required |

### C. Refund Reason Options

| Reason | Description |
|--------|-------------|
| Client dissatisfied | Service quality issue |
| Service not completed | Service partially or not rendered |
| Wrong charge | Incorrect amount or items |
| Duplicate transaction | Charged twice |
| Pricing error | Wrong price applied |
| Other | Custom reason required |

### D. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 27, 2025 | Initial extraction from main PRD |
| 2.0 | Dec 28, 2025 | Expanded to 62 requirements, 29 business rules, 14 use cases, enhanced UX specs |

---

*Document Version: 2.0 | Updated: December 28, 2025*
