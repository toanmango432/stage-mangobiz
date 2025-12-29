# Product Requirements Document: Reports Module

**Product:** Mango POS
**Module:** Reports (Analytics & Insights)
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

The Reports Module provides salon owners and managers with real-time business intelligence through daily sales summaries, transaction records, and performance analytics. This module surfaces key metrics for informed decision-making directly on the Store App, enabling data-driven operations management.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Real-Time Insights** | Today's performance at a glance, updated after each transaction |
| **Staff Performance** | Revenue, services, tips per staff for fair evaluation |
| **Payment Breakdown** | Card vs. cash vs. digital trends for reconciliation |
| **Quick Reports** | Export-ready daily summaries for accounting |
| **Offline Access** | Cached dashboard viewable during internet outages |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Report generation time | < 3 seconds |
| Manager daily usage | 85%+ check reports at least once |
| Data accuracy | 100% match with transactions |
| Export success rate | 99%+ |
| Feature satisfaction | 4.5/5 rating |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **No real-time visibility** | Managers fly blind during busy hours | Live dashboard with key metrics updated per transaction |
| **End-of-day surprises** | Revenue expectations off, cash drawer doesn't match | Hourly trends and payment method breakdown |
| **Staff performance unknown** | Can't reward top performers fairly | Per-staff revenue, services, and tips tracking |
| **Manual reconciliation** | Hours of paper math at end of day | Automated summary reports with payment breakdown |
| **No historical comparison** | Can't spot trends | Same-day-last-week and previous day comparisons |
| **Paper-based reporting** | Lost reports, no backup | Digital exports (CSV/PDF) with cloud storage |

### 2.2 Market Opportunity

| Opportunity | Description |
|-------------|-------------|
| **Competitive differentiation** | Offline-cached dashboard (unique to Mango) |
| **Hourly analytics** | Most competitors lack granular time breakdown |
| **Mobile-first** | Reports optimized for tablet held by manager on floor |

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Salon Owner

**Profile:**
- Reviews business performance daily
- Makes strategic decisions on staffing, pricing, promotions
- Needs quick access to key metrics without deep navigation
- Often checks reports from home in evening

**Goals:**
- Understand daily revenue performance
- Identify top-performing and underperforming staff
- Track payment trends for cash flow management
- Export data for accountant monthly

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| RPT-UC-001 | Check today's revenue midday | P0 | Dashboard loads in < 3s, shows current revenue |
| RPT-UC-002 | See which staff is performing best | P0 | Staff list sorted by revenue with service count |
| RPT-UC-003 | Export daily report for accounting | P0 | PDF generates in < 5s with all summary data |
| RPT-UC-004 | Compare today vs. yesterday | P1 | % change shown with up/down indicator |
| RPT-UC-007 | Review weekly performance trends | P1 | Comparison to same day last week available |

### 3.2 Secondary User: Salon Manager

**Profile:**
- On-site throughout the day
- Needs real-time awareness of floor performance
- Tracks staff productivity for scheduling decisions
- Handles end-of-day cash reconciliation

**Goals:**
- Monitor busy hours and staff utilization
- Ensure cash drawer matches system totals
- Identify service category performance

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| RPT-UC-005 | Identify peak hours for scheduling | P1 | Hourly chart clearly shows highest revenue hour |
| RPT-UC-008 | Reconcile cash drawer at end of day | P0 | Cash payment total displayed prominently |
| RPT-UC-009 | Track service category performance | P1 | Breakdown by Nails/Hair/Spa/Retail available |

### 3.3 Tertiary User: Front Desk Staff (Limited Access)

**Profile:**
- Needs to verify transaction history for customer inquiries
- Limited access to revenue/performance data
- Uses closed tickets list for refund lookups

**Use Cases:**

| ID | Use Case | Priority | Acceptance Criteria |
|----|----------|----------|---------------------|
| RPT-UC-006 | View closed tickets for the day | P0 | List of completed tickets with basic details |
| RPT-UC-010 | Find specific transaction for customer | P0 | Tap ticket to view full transaction detail |

---

## 4. Competitive Analysis

### 4.1 Feature Comparison

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Real-time dashboard | ✅ | ✅ | Partial | ✅ | ✅ |
| Staff performance | ✅ | ✅ | ✅ | Partial | ✅ |
| Hourly breakdown | ✅ | ❌ | ❌ | ✅ | Partial |
| Service category breakdown | ✅ | ✅ | ✅ | ❌ | ✅ |
| Export to CSV/PDF | ✅ | ✅ | ❌ | ✅ | ✅ |
| Email scheduled reports | ⏳ P2 | ✅ | ❌ | ✅ | ✅ |
| Offline cached view | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mobile-optimized | ✅ | ✅ | ✅ | ✅ | ✅ |
| Historical comparisons | ✅ | ✅ | Partial | ✅ | ✅ |
| Staff leaderboard | ⏳ P2 | ❌ | ❌ | ❌ | ✅ |

### 4.2 Competitive Advantages

| Advantage | Description |
|-----------|-------------|
| **Offline-first** | Only salon POS with cached dashboard during outages |
| **Hourly granularity** | Peak hour identification uncommon in competitors |
| **Integrated with operations** | Reports link directly to Front Desk and Checkout data |

### 4.3 Competitive Gaps to Address

| Gap | Priority | Notes |
|-----|----------|-------|
| Scheduled email reports | P2 | Fresha, Square, Vagaro all have this |
| Advanced date range selection | P2 | Currently today-only in Store App |
| Client retention reports | P3 | Future: new vs returning clients |

---

## 5. Feature Requirements

### 5.1 Today's Sales Dashboard

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P0-001 | Total Revenue metric (large, prominent) | P0 | Real-time, updates within 3s of each completed transaction |
| RPT-P0-002 | Transaction count | P0 | Accurate count of completed (non-voided) transactions |
| RPT-P0-003 | Average ticket size | P0 | Calculated: Revenue / Transactions, updates in real-time |
| RPT-P0-004 | Total tips collected | P0 | Sum of all tips from completed transactions |
| RPT-P0-005 | Client count served | P0 | Unique clients (not transactions) for the day |
| RPT-P1-006 | Comparison to previous day | P1 | % change indicator (green up, red down) with hover details |
| RPT-P1-007 | Comparison to same day last week | P1 | % change indicator for weekly trend analysis |
| RPT-P1-030 | Last updated timestamp | P1 | Show "Updated X min ago" when offline or stale |

### 5.2 Sales Breakdown

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P0-008 | By payment method | P0 | Card, Cash, Digital, Other with $ amount and % share |
| RPT-P1-009 | By service category | P1 | Nails, Hair, Spa, Retail breakdown with $ and % |
| RPT-P1-010 | Visual chart (pie or bar) | P1 | Interactive chart, tappable segments show details |
| RPT-P2-031 | By revenue type | P2 | Services vs Products vs Tips breakdown |

### 5.3 Staff Performance

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P0-011 | Revenue per staff | P0 | List sorted high to low by default, tap to change sort |
| RPT-P0-012 | Service count per staff | P0 | Number of completed services per staff member |
| RPT-P0-013 | Tips per staff | P0 | Total tips earned by each staff member |
| RPT-P1-014 | Average ticket per staff | P1 | Calculated: Staff Revenue / Staff Service Count |
| RPT-P2-015 | Staff ranking/leaderboard | P2 | Gamified top performers with badges or highlights |
| RPT-P1-032 | Staff photo and name | P1 | Visual identification in staff performance list |
| RPT-P2-033 | Commission earned | P2 | If commission rules configured, show calculated amount |

### 5.4 Hourly Sales Chart

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P1-016 | Line or bar chart by hour | P1 | X-axis: Hours (business hours only), Y-axis: Revenue |
| RPT-P1-017 | Peak hour highlight | P1 | Visual emphasis (color/label) on busiest hour |
| RPT-P2-018 | Transaction count overlay | P2 | Secondary metric line or bars on same chart |
| RPT-P2-034 | Compare to average | P2 | Dotted line showing typical day's pattern |

### 5.5 Closed Tickets View

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P0-019 | List of today's completed tickets | P0 | Chronological order, most recent first |
| RPT-P0-020 | Ticket details on tap | P0 | Navigate to full transaction detail modal |
| RPT-P1-021 | Filter by staff | P1 | Dropdown to show only selected staff's tickets |
| RPT-P1-035 | Filter by payment method | P1 | Filter to Cash/Card/Digital only |
| RPT-P1-036 | Search by client name | P1 | Search box to find specific transaction |

### 5.6 Quick Reports

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P1-022 | Daily Sales Report | P1 | PDF with summary metrics, payment breakdown, hourly chart |
| RPT-P1-023 | Staff Commission Report | P1 | Per-staff earnings, services, tips for payroll |
| RPT-P1-024 | Payment Summary Report | P1 | By payment method, for drawer reconciliation |
| RPT-P2-025 | Service Popularity Report | P2 | Most booked/completed services ranked |
| RPT-P2-037 | Cash Drawer Report | P2 | Starting cash, transactions, expected drawer total |

### 5.7 Export

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P1-026 | Export to CSV | P1 | Raw data format, opens in Excel/Sheets |
| RPT-P1-027 | Export to PDF | P1 | Formatted printable report with branding |
| RPT-P2-028 | Email report | P2 | Send report to specified email address |
| RPT-P2-029 | Scheduled reports | P2 | Auto-send daily summary at configurable time |
| RPT-P1-038 | Download confirmation | P1 | Toast notification when export completes |

### 5.8 Dashboard Navigation

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| RPT-P0-039 | Access from main navigation | P0 | "Reports" icon in bottom navigation bar |
| RPT-P1-040 | Pull-to-refresh | P1 | Pull down on mobile to refresh data |
| RPT-P1-041 | Date picker (today default) | P1 | Select different day to view historical data |
| RPT-P2-042 | Date range selection | P2 | View week/month aggregates |

---

## 6. Business Rules

### 6.1 Access Permissions

| Report Section | Staff | Manager | Owner |
|----------------|-------|---------|-------|
| Today's Sales Dashboard | ❌ | ✅ | ✅ |
| Sales Breakdown | ❌ | ✅ | ✅ |
| Staff Performance | ❌ | ✅ | ✅ |
| Hourly Chart | ❌ | ✅ | ✅ |
| Closed Tickets | ✅ (own only) | ✅ | ✅ |
| Quick Reports | ❌ | ✅ | ✅ |
| Export | ❌ | ✅ | ✅ |

### 6.2 Data Rules

| ID | Rule | Logic |
|----|------|-------|
| RPT-BR-001 | Real-time updates when online | Dashboard refreshes within 3s of transaction completion |
| RPT-BR-002 | Cached data shown when offline | Display "Last updated: [timestamp]" banner |
| RPT-BR-003 | Reports based on completed transactions only | Pending, cancelled transactions excluded |
| RPT-BR-004 | Voided transactions excluded from totals | Voided tickets not counted in revenue or counts |
| RPT-BR-005 | Refunded transactions reduce from totals | Full refunds subtract from revenue; partial refunds subtract refund amount |
| RPT-BR-006 | Day boundary is midnight local time | "Today" = 12:00 AM to 11:59 PM salon local timezone |
| RPT-BR-007 | Tips attributed to completing staff | Tips go to staff who completed the service, not who started |
| RPT-BR-008 | Split payments attributed by method | $50 cash + $50 card = $50 each in payment breakdown |
| RPT-BR-009 | Staff revenue includes only their services | Multi-staff tickets split revenue by service performer |
| RPT-BR-010 | Business hours define chart range | Hourly chart only shows configured business hours |
| RPT-BR-011 | Products attributed to selling staff | Retail sales counted toward staff who rang up the sale |
| RPT-BR-012 | Commission calculated per rules | If commission configured, calculate based on service/staff rules |
| RPT-BR-013 | Export includes timestamp | All exports include generation timestamp in filename and header |
| RPT-BR-014 | Comparisons require historical data | If no data for comparison period, show "N/A" not 0% |
| RPT-BR-015 | Client count is unique | Same client with multiple transactions = 1 client count |

### 6.3 Calculation Rules

| ID | Rule | Formula |
|----|------|---------|
| RPT-BR-016 | Average ticket | Total Revenue / Total Transactions |
| RPT-BR-017 | % change calculation | ((Today - Comparison) / Comparison) × 100 |
| RPT-BR-018 | Staff average ticket | Staff Revenue / Staff Service Count |
| RPT-BR-019 | Payment method % | (Method Total / Total Revenue) × 100 |
| RPT-BR-020 | Category % | (Category Revenue / Total Revenue) × 100 |

---

## 7. UX Specifications

### 7.1 Dashboard Layout (Mobile/Tablet)

```
┌─────────────────────────────────────────────────────────────────┐
│ Today's Sales                              Dec 28, 2025         │
│                                            [📅] [↻]             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   $3,450    │  │     24      │  │   $143.75   │              │
│  │  Revenue    │  │ Transactions│  │  Avg Ticket │              │
│  │   ↑ 12%     │  │    ↑ 4      │  │    ↑ $8     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │    $485     │  │     28      │                               │
│  │    Tips     │  │   Clients   │                               │
│  └─────────────┘  └─────────────┘                               │
├─────────────────────────────────────────────────────────────────┤
│ Payment Breakdown                                               │
│ ████████████████████░░░░░░░ Card 72% ($2,484)                   │
│ ████████░░░░░░░░░░░░░░░░░░░ Cash 23% ($794)                     │
│ ██░░░░░░░░░░░░░░░░░░░░░░░░░ Other 5% ($172)                     │
├─────────────────────────────────────────────────────────────────┤
│ Staff Performance                                      [Sort ▼] │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 👤 Zeus       │ $890  │ 8 services │ $145 tips           │   │
│ │ 👤 Lisa       │ $720  │ 6 services │ $98 tips            │   │
│ │ 👤 Tom        │ $680  │ 5 services │ $87 tips            │   │
│ │ 👤 Amy        │ $560  │ 5 services │ $75 tips            │   │
│ └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ Hourly Sales                                                    │
│     ▂   █                                                       │
│ ▁ ▃ █ ▅ █ ▆ ▃ ▁                                                 │
│ 9  10 11 12 1  2  3  4  5  6  7                                 │
│                  Peak: 12 PM ($620)                             │
├─────────────────────────────────────────────────────────────────┤
│ [📥 Export CSV]  [📄 Export PDF]  [📊 Full Analytics]           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Metric Cards

| Element | Specification |
|---------|---------------|
| Primary value | 32px bold, brand-600 color |
| Label | 14px, gray-600 |
| Comparison | 12px, green-500 (up) / red-500 (down) with arrow icon |
| Card | White background, 8px border-radius, subtle shadow (0 1px 3px rgba(0,0,0,0.1)) |
| Card spacing | 16px gap between cards |
| Card padding | 16px internal padding |

### 7.3 Staff Performance Row

| Element | Specification |
|---------|---------------|
| Row height | 56px |
| Staff photo | 40x40px circle, left-aligned |
| Staff name | 16px medium weight, truncate at 120px |
| Revenue | 16px bold, right-aligned |
| Service count | 14px gray-600 |
| Tips | 14px gray-600 |
| Row tap | Expands to show detail or navigates to staff detail |

### 7.4 Chart Specifications

| Element | Specification |
|---------|---------------|
| Chart height | 180px |
| Bar width | 24px with 8px gap |
| Peak hour | Orange highlight with label |
| X-axis labels | 12px, gray-500 |
| Y-axis labels | Hidden (implied by bar height) |
| Touch interaction | Tap bar to show exact value |

### 7.5 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      📊                                         │
│                                                                 │
│             No transactions yet today.                          │
│          Check back after your first sale!                      │
│                                                                 │
│                 [Go to Front Desk]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.6 Offline State Banner

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Offline - Showing cached data from 2:30 PM                   │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---------|---------------|
| Background | Yellow-50 |
| Border | 1px yellow-300 |
| Icon | ⚠️ warning |
| Text | 14px, yellow-800 |
| Position | Sticky top of dashboard |

### 7.7 Export Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Export Report                                             [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Report Type:  [Daily Sales Summary        ▼]                   │
│                                                                 │
│  Date:         [December 28, 2025          📅]                   │
│                                                                 │
│  Format:       ○ PDF (Formatted)                                │
│                ● CSV (Raw Data)                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│              [Cancel]            [📥 Export]                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 Performance Targets

| Metric | Target |
|--------|--------|
| Dashboard initial load | < 2 seconds |
| Dashboard refresh | < 1 second |
| Chart render | < 500ms |
| Export generation (PDF) | < 5 seconds |
| Export generation (CSV) | < 2 seconds |
| Real-time update latency | < 3 seconds after transaction |

### 8.2 Offline Behavior

| Capability | Offline Support | Notes |
|------------|-----------------|-------|
| View cached dashboard | ✅ | Shows "Last updated" timestamp |
| View cached charts | ✅ | Data from last online sync |
| View closed tickets list | ✅ | Cached ticket data |
| Export reports | ❌ | Requires connection for generation |
| Real-time updates | ❌ | Updates queued until online |
| Pull-to-refresh | ⚠️ | Shows error if offline |

### 8.3 Data Model

```typescript
interface DailySummary {
  id: string;
  salonId: string;
  date: string; // YYYY-MM-DD
  revenue: number;
  transactionCount: number;
  averageTicket: number;
  tipsTotal: number;
  clientCount: number;
  byPaymentMethod: PaymentBreakdown[];
  byServiceCategory: CategoryBreakdown[];
  byStaff: StaffPerformance[];
  byHour: HourlyBreakdown[];
  comparison: {
    previousDay: ComparisonData;
    sameLastWeek: ComparisonData;
  };
  lastUpdated: string; // ISO timestamp
  cachedAt?: string; // ISO timestamp for offline
}

interface PaymentBreakdown {
  method: 'card' | 'cash' | 'digital' | 'other';
  amount: number;
  percentage: number;
  transactionCount: number;
}

interface CategoryBreakdown {
  category: 'nails' | 'hair' | 'spa' | 'retail' | 'other';
  amount: number;
  percentage: number;
  serviceCount: number;
}

interface StaffPerformance {
  staffId: string;
  staffName: string;
  staffPhoto?: string;
  revenue: number;
  serviceCount: number;
  tips: number;
  averageTicket: number;
  commissionEarned?: number;
}

interface HourlyBreakdown {
  hour: number; // 0-23
  revenue: number;
  transactionCount: number;
  isPeakHour: boolean;
}

interface ComparisonData {
  revenue: number;
  percentChange: number;
  transactionCount: number;
  hasData: boolean;
}
```

### 8.4 API Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/reports/daily-summary` | GET | Get today's dashboard data | DailySummary |
| `/reports/daily-summary/:date` | GET | Get specific date's data | DailySummary |
| `/reports/closed-tickets` | GET | Get today's closed tickets | Ticket[] |
| `/reports/export/csv` | POST | Generate CSV export | File download |
| `/reports/export/pdf` | POST | Generate PDF export | File download |

### 8.5 Caching Strategy

| Data | Cache Duration | Refresh Trigger |
|------|----------------|-----------------|
| Dashboard summary | 5 minutes | Pull-to-refresh, transaction complete |
| Closed tickets list | 5 minutes | Pull-to-refresh, transaction complete |
| Historical data | 24 hours | Date change, manual refresh |
| Staff performance | 5 minutes | Transaction complete |

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Manager daily check-ins | N/A | 85%+ | % of managers who view reports at least once daily |
| Report export usage | N/A | 50%+ | % of salons exporting at least 1 report weekly |
| Data accuracy | N/A | 100% | Reports match transaction totals exactly |
| Feature satisfaction | N/A | 4.5/5 | In-app rating after 30 days |
| Dashboard load time | N/A | < 2s | P95 latency |

### 9.2 Analytics Events to Track

| Event | Properties | Purpose |
|-------|------------|---------|
| `reports_dashboard_viewed` | salon_id, user_role, is_offline | Track usage patterns |
| `reports_exported` | format (csv/pdf), report_type, date_range | Measure export adoption |
| `reports_staff_detail_viewed` | staff_id, viewer_role | Track staff performance interest |
| `reports_date_changed` | from_date, to_date | Historical data usage |
| `reports_chart_interacted` | chart_type, interaction_type | Chart engagement |
| `reports_refresh_triggered` | method (pull/button), is_offline | Refresh behavior |
| `reports_error_occurred` | error_type, context | Error tracking |

### 9.3 Leading Indicators

| Indicator | Signal |
|-----------|--------|
| Daily dashboard views | Feature stickiness |
| Export frequency | Value for accounting |
| Time spent on reports | Depth of engagement |
| Return to reports after first use | Feature retention |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Slow dashboard load with large transaction volume** | Medium | High | Implement pagination, aggregation at database level |
| **Data inconsistency between real-time and cached** | Medium | High | Clear cache timestamps, force refresh on major discrepancies |
| **Export timeout for large date ranges** | Medium | Medium | Limit date range, async export with email delivery for large ranges |
| **Chart rendering issues on older devices** | Low | Medium | Use lightweight charting library, progressive enhancement |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low adoption by managers** | Medium | High | Onboarding tutorial, push notification for daily summary |
| **Misinterpretation of metrics** | Medium | Medium | Clear labels, tooltips explaining calculations |
| **Over-reliance causing manual tracking abandonment** | Low | Medium | Encourage verification, export for records |
| **Privacy concerns with staff performance visibility** | Low | High | Role-based access, configurable visibility settings |

### 10.3 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Information overload on dashboard** | Medium | Medium | Progressive disclosure, collapsible sections |
| **Confusion about offline data staleness** | Medium | High | Prominent "last updated" banner, visual differentiation |
| **Export format not meeting accountant needs** | Low | Medium | Standard formats, customizable fields (P2) |

---

## 11. Implementation Plan

### Phase 1: Core Dashboard (Week 1-2)

| Task | Requirements | Effort |
|------|--------------|--------|
| Key metric cards | RPT-P0-001 to RPT-P0-005 | Medium |
| Payment method breakdown | RPT-P0-008 | Small |
| Staff performance list | RPT-P0-011 to RPT-P0-013 | Medium |
| Closed tickets view | RPT-P0-019, RPT-P0-020 | Medium |
| Dashboard navigation | RPT-P0-039 | Small |

**Phase 1 Acceptance Criteria:**
- Dashboard displays 5 key metrics in real-time
- Staff performance list sorted by revenue
- Basic closed tickets list viewable

### Phase 2: Visualizations & Comparisons (Week 3)

| Task | Requirements | Effort |
|------|--------------|--------|
| Comparison indicators | RPT-P1-006, RPT-P1-007 | Small |
| Category breakdown | RPT-P1-009, RPT-P1-010 | Medium |
| Hourly sales chart | RPT-P1-016, RPT-P1-017 | Medium |
| Staff photo display | RPT-P1-032 | Small |
| Ticket filtering | RPT-P1-021, RPT-P1-035, RPT-P1-036 | Medium |

**Phase 2 Acceptance Criteria:**
- Previous day and same-day-last-week comparisons shown
- Hourly chart with peak hour highlight
- Filters work on closed tickets list

### Phase 3: Export & Reports (Week 4)

| Task | Requirements | Effort |
|------|--------------|--------|
| Daily sales report PDF | RPT-P1-022 | Medium |
| Staff commission report | RPT-P1-023 | Medium |
| Payment summary report | RPT-P1-024 | Small |
| CSV export | RPT-P1-026 | Small |
| PDF export | RPT-P1-027 | Medium |
| Export confirmation | RPT-P1-038 | Small |

**Phase 3 Acceptance Criteria:**
- PDF exports generate in < 5 seconds
- CSV contains all raw data
- Download confirmation toast shown

### Phase 4: Advanced Features (Future)

| Task | Requirements | Effort |
|------|--------------|--------|
| Staff leaderboard | RPT-P2-015 | Medium |
| Email reports | RPT-P2-028 | Large |
| Scheduled reports | RPT-P2-029 | Large |
| Service popularity report | RPT-P2-025 | Medium |
| Date range selection | RPT-P2-042 | Medium |
| Commission calculation | RPT-P2-033 | Large |

---

## Appendix

### A. Related Documents

| Document | Purpose |
|----------|---------|
| [PRD-Transactions-Module.md](./PRD-Transactions-Module.md) | Transaction history and detail |
| [PRD-Team-Module.md](./PRD-Team-Module.md) | Staff management and commission rules |
| [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) | Payment processing |
| [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md) | System architecture |

### B. Glossary

| Term | Definition |
|------|------------|
| **Revenue** | Total sales amount excluding voided/cancelled, including services + products + tips |
| **Transaction** | A completed checkout (one ticket paid) |
| **Average Ticket** | Revenue divided by transaction count |
| **Peak Hour** | Hour with highest revenue in the business day |
| **Commission** | Staff earnings calculated from service revenue based on commission rules |

### C. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 27, 2025 | Initial version |
| 2.0 | Dec 28, 2025 | Added Risks section, expanded requirements (42 total), added 20 business rules, enhanced UX specs |

---

*Document Version: 2.0 | Updated: December 28, 2025*
