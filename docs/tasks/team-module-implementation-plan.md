# Team Module Implementation Plan

> **Version:** 1.0
> **Created:** December 2, 2024
> **Based on:** PRD-Team-Module.md v2.0
> **Reference:** `docs/product/PRD-Team-Module.md`

---

## Executive Summary

This implementation plan covers the remaining phases of the Team Module:
- **Phase 2**: Time & Attendance (HIGH PRIORITY)
- **Phase 3**: Payroll & Pay Runs (HIGH PRIORITY)
- **Phase 4**: Staff Experience (MEDIUM PRIORITY)

Phase 1 (Foundation) is already complete with team profiles, roles, permissions, schedules, turn tracking, and commission configuration.

---

## Architecture Principles

Following the existing codebase patterns:

1. **Offline-First Data Flow**: Redux (optimistic) → IndexedDB → Sync Queue → Server
2. **3-Layer Redux Architecture**: Feature slice → Legacy compatibility slice → UI slice
3. **Database Operations**: Use `src/db/` pattern with `teamDB` style CRUD operations
4. **Sync Support**: Extend `BaseSyncableEntity` with vector clocks and tombstone pattern
5. **Component Structure**: Follow existing `src/components/team-settings/` patterns

---

## Phase 2: Time & Attendance

### 2.1 Overview

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Clock in/out system | Medium | None |
| Break tracking | Medium | Clock in/out |
| Timesheet dashboard | Medium | Clock in/out |
| Overtime calculation | Small | Timesheets |
| Attendance alerts | Small | Timesheets |
| Manager approval workflow | Medium | Timesheets |
| Timesheet reports | Medium | Timesheets |

### 2.2 New Files to Create

\`\`\`
src/
├── store/slices/
│   └── timesheetSlice.ts              # NEW - Timesheet Redux state
├── db/
│   └── timesheetOperations.ts         # NEW - IndexedDB CRUD for timesheets
├── components/team-settings/sections/
│   └── TimesheetSection.tsx           # NEW - Timesheet tab in Team Settings
├── components/timesheet/
│   ├── TimesheetDashboard.tsx         # NEW - Full-page dashboard
│   ├── ClockInOutWidget.tsx           # NEW - Clock in/out component
│   ├── BreakTracker.tsx               # NEW - Break tracking component
│   ├── TimesheetRow.tsx               # NEW - Individual entry row
│   ├── TimesheetApprovalModal.tsx     # NEW - Approval workflow modal
│   └── AttendanceAlert.tsx            # NEW - Alert notification component
├── types/
│   └── timesheet.ts                   # NEW - Timesheet type definitions
└── utils/
    └── overtimeCalculation.ts         # NEW - Overtime calculation logic
\`\`\`

### 2.3 Type Definitions

\`\`\`typescript
// src/types/timesheet.ts

import { BaseSyncableEntity } from './common';

export type TimesheetStatus = 'pending' | 'approved' | 'disputed';
export type BreakType = 'paid' | 'unpaid';
export type AttendanceAlertType = 'late_arrival' | 'early_departure' | 'missed_clock_in' | 'extended_break' | 'no_show';

export interface BreakEntry {
  id: string;
  startTime: string;           // ISO timestamp
  endTime: string | null;      // null if break ongoing
  type: BreakType;
  duration: number;            // minutes
  label?: string;              // "Lunch", "Break"
}

export interface HoursBreakdown {
  scheduledHours: number;
  actualHours: number;
  regularHours: number;
  overtimeHours: number;
  breakMinutes: number;
  paidBreakMinutes: number;
  unpaidBreakMinutes: number;
}

export interface TimesheetEntry extends BaseSyncableEntity {
  staffId: string;
  date: string;                // YYYY-MM-DD

  // Scheduled shift
  scheduledStart: string;
  scheduledEnd: string;

  // Actual times
  actualClockIn: string | null;
  actualClockOut: string | null;

  // Breaks
  breaks: BreakEntry[];

  // Calculated hours
  hours: HoursBreakdown;

  // Status and approval
  status: TimesheetStatus;
  approvedBy?: string;
  approvedAt?: string;
  disputeReason?: string;
  notes?: string;

  // Location verification (optional)
  clockInLocation?: { lat: number; lng: number };
  clockOutLocation?: { lat: number; lng: number };
}

export interface AttendanceAlert {
  id: string;
  staffId: string;
  staffName: string;
  type: AttendanceAlertType;
  timestamp: string;
  message: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface OvertimeSettings {
  calculationType: 'daily' | 'weekly' | 'both';
  dailyThreshold: number;       // hours
  weeklyThreshold: number;      // hours
  overtimeRate: number;         // multiplier (e.g., 1.5)
  doubleTimeRate?: number;
  doubleTimeThreshold?: number;
}
\`\`\`

### 2.4 Redux Slice Structure

\`\`\`typescript
// src/store/slices/timesheetSlice.ts

interface TimesheetState {
  // Data
  entries: Record<string, TimesheetEntry>;      // Keyed by id
  entryIds: string[];

  // Current session
  activeClockIns: Record<string, TimesheetEntry>;  // Keyed by staffId
  activeBreaks: Record<string, BreakEntry>;        // Keyed by staffId

  // Alerts
  alerts: AttendanceAlert[];

  // UI State
  ui: {
    selectedDate: string;
    selectedStaffId: string | null;
    viewMode: 'day' | 'week' | 'pay_period';
    filterStatus: 'all' | 'pending' | 'approved' | 'disputed';
  };

  // Sync
  loading: boolean;
  error: string | null;
  sync: {
    lastSyncAt: string | null;
    pendingChanges: number;
    syncStatus: 'idle' | 'syncing' | 'error';
  };
}
\`\`\`

### 2.5 Business Rules Implementation

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-TS-001 | Cannot clock in before shift minus grace | Validate in clockIn thunk |
| BR-TS-002 | Unpaid break deducted from hours | overtimeCalculation.ts |
| BR-TS-003 | Overtime after threshold | overtimeCalculation.ts |
| BR-TS-004 | Manager approval required for edits | Permission check in thunk |
| BR-TS-005 | Cannot clock in multiple locations | Validate activeClockIns |

### 2.6 Implementation Steps

1. **Week 1: Foundation**
   - [ ] Create src/types/timesheet.ts
   - [ ] Create src/db/timesheetOperations.ts
   - [ ] Update src/db/schema.ts with timesheets table
   - [ ] Create src/store/slices/timesheetSlice.ts

2. **Week 2: Clock In/Out**
   - [ ] Create ClockInOutWidget.tsx
   - [ ] Integrate with Turn Tracker (only clocked-in staff appear)
   - [ ] Create BreakTracker.tsx
   - [ ] Add clock in/out to Front Desk header

3. **Week 3: Dashboard & Approval**
   - [ ] Create TimesheetDashboard.tsx
   - [ ] Create TimesheetRow.tsx
   - [ ] Create TimesheetApprovalModal.tsx
   - [ ] Implement approval workflow

4. **Week 4: Calculation & Alerts**
   - [ ] Create src/utils/overtimeCalculation.ts
   - [ ] Create AttendanceAlert.tsx
   - [ ] Add timesheet reports
   - [ ] Integration testing

### 2.7 Validation Checkpoints

**Week 1 Validation:**
- [ ] Timesheet data persists to IndexedDB
- [ ] Can create/read/update entries via Redux

**Week 2 Validation:**
- [ ] Staff can clock in/out from Front Desk
- [ ] Only clocked-in staff appear in Turn Tracker
- [ ] Breaks can be started/ended

**Week 3 Validation:**
- [ ] Timesheet dashboard shows weekly view
- [ ] Manager can approve/dispute entries
- [ ] Status changes reflect immediately

**Week 4 Validation:**
- [ ] Overtime calculates correctly (daily/weekly)
- [ ] Alerts show for late arrivals
- [ ] Export to CSV works

---

## Phase 3: Payroll & Pay Runs

### 3.1 Overview

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Pay run creation | Large | Timesheets (Phase 2) |
| Automatic calculations | Large | Pay runs, Checkout data |
| Manual adjustments | Medium | Pay runs |
| Review & approval workflow | Medium | Pay runs |
| Payment processing integration | Large | Approval workflow |
| 9 payroll reports | Medium | Pay runs |
| Staff earnings portal | Medium | Pay runs |

### 3.2 New Files to Create

\`\`\`
src/
├── store/slices/
│   └── payrollSlice.ts                # NEW - Pay run Redux state
├── db/
│   └── payrollOperations.ts           # NEW - IndexedDB CRUD for pay runs
├── components/payroll/
│   ├── PayRunDashboard.tsx            # NEW - Pay run management
│   ├── PayRunCreate.tsx               # NEW - Create new pay run
│   ├── PayRunDetail.tsx               # NEW - Pay run details view
│   ├── StaffPaymentRow.tsx            # NEW - Individual staff payment
│   ├── PayRunAdjustmentModal.tsx      # NEW - Add adjustments
│   ├── PayRunApprovalModal.tsx        # NEW - Approval workflow
│   └── StaffEarningsPortal.tsx        # NEW - Staff self-service
├── components/reports/payroll/
│   ├── PayRunSummaryReport.tsx        # NEW
│   ├── StaffEarningsReport.tsx        # NEW
│   ├── CommissionReport.tsx           # NEW
│   ├── OvertimeReport.tsx             # NEW
│   ├── TipReport.tsx                  # NEW
│   └── LaborCostReport.tsx            # NEW
├── types/
│   └── payroll.ts                     # NEW - Payroll type definitions
└── utils/
    ├── commissionCalculation.ts       # NEW - Commission logic
    └── payRunCalculation.ts           # NEW - Pay run totals
\`\`\`

### 3.3 Type Definitions

\`\`\`typescript
// src/types/payroll.ts

export type PayRunStatus = 'draft' | 'pending_approval' | 'approved' | 'processed';
export type PaymentMethod = 'direct_deposit' | 'check' | 'cash' | 'external';
export type AdjustmentType =
  | 'bonus' | 'reimbursement' | 'tip_adjustment'
  | 'advance_deduction' | 'fee_passthrough' | 'supply_deduction'
  | 'tax_withholding' | 'benefits_deduction' | 'other';

export interface PayRunAdjustment {
  id: string;
  type: AdjustmentType;
  amount: number;            // Positive = addition, Negative = deduction
  description: string;
  addedBy: string;
  addedAt: string;
}

export interface EarningsBreakdown {
  regularHours: number;
  regularWages: number;
  overtimeHours: number;
  overtimeWages: number;
  serviceRevenue: number;
  serviceCommission: number;
  productRevenue: number;
  productCommission: number;
  newClientBonus: number;
  rebookBonus: number;
  cashTips: number;
  cardTips: number;
  totalTips: number;
  adjustments: PayRunAdjustment[];
  totalAdjustments: number;
  grossPay: number;
  deductions: number;
  netPay: number;
}

export interface StaffPayment {
  staffId: string;
  staffName: string;
  earnings: EarningsBreakdown;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  transactionId?: string;
}

export interface PayRun extends BaseSyncableEntity {
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
  staffPayments: StaffPayment[];
  totals: PayRunTotals;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  processedBy?: string;
  processedAt?: string;
  notes?: string;
}
\`\`\`

### 3.4 Business Rules Implementation

| Rule ID | Rule | Implementation |
|---------|------|----------------|
| BR-PR-001 | Pay run requires approval before processing | Status check in processPayRun |
| BR-PR-002 | Only approved checkouts count | Filter in calculation queries |
| BR-PR-003 | Guaranteed minimum per period | Apply in payRunCalculation.ts |
| BR-PR-004 | Tiered commission on period total | commissionCalculation.ts |
| BR-PR-005 | Previous pay runs must be processed | Validate in createPayRun |

### 3.5 Implementation Steps

1. **Week 1: Foundation**
   - [ ] Create src/types/payroll.ts
   - [ ] Create src/db/payrollOperations.ts
   - [ ] Update src/db/schema.ts with payRuns table
   - [ ] Create src/store/slices/payrollSlice.ts

2. **Week 2: Calculations**
   - [ ] Create src/utils/commissionCalculation.ts
   - [ ] Create src/utils/payRunCalculation.ts
   - [ ] Integrate with timesheet data (wages)
   - [ ] Integrate with checkout data (commissions, tips)

3. **Week 3: UI**
   - [ ] Create PayRunDashboard.tsx
   - [ ] Create PayRunCreate.tsx
   - [ ] Create PayRunDetail.tsx
   - [ ] Create StaffPaymentRow.tsx
   - [ ] Create PayRunAdjustmentModal.tsx

4. **Week 4: Workflow & Reports**
   - [ ] Create PayRunApprovalModal.tsx
   - [ ] Implement approval workflow
   - [ ] Create 6 payroll reports
   - [ ] Create StaffEarningsPortal.tsx

### 3.6 Validation Checkpoints

**Week 1 Validation:**
- [ ] Pay run data persists to IndexedDB
- [ ] Can create draft pay runs

**Week 2 Validation:**
- [ ] Wages calculate correctly from timesheets
- [ ] Commissions calculate correctly (all types)
- [ ] Tips aggregate from checkout data

**Week 3 Validation:**
- [ ] Pay run dashboard shows all pay runs
- [ ] Can view and edit pay run details
- [ ] Can add/remove adjustments

**Week 4 Validation:**
- [ ] Approval workflow functions correctly
- [ ] Reports generate accurate data
- [ ] Staff can view their own earnings

---

## Phase 4: Staff Experience

### 4.1 Overview

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Staff ratings & reviews | Medium | Online booking |
| Portfolio gallery | Small | Profile |
| Performance dashboard | Medium | Analytics/Checkout data |
| Goal tracking | Medium | Performance |
| Achievements/badges | Small | Goals |
| Group booking | Medium | Online booking |

### 4.2 New Files to Create

\`\`\`
src/
├── store/slices/
│   └── staffPerformanceSlice.ts       # NEW - Performance tracking
├── db/
│   └── ratingOperations.ts            # NEW - Ratings CRUD
├── components/team-settings/sections/
│   └── PerformanceSection.tsx         # NEW - Performance tab
├── components/staff-experience/
│   ├── PortfolioGallery.tsx           # NEW - Image gallery
│   ├── RatingDisplay.tsx              # NEW - Star rating display
│   ├── ReviewCard.tsx                 # NEW - Individual review
│   ├── PerformanceDashboard.tsx       # NEW - Staff performance view
│   ├── GoalProgressCard.tsx           # NEW - Goal tracking card
│   └── AchievementBadge.tsx           # NEW - Badge display
└── types/
    ├── rating.ts                      # NEW - Rating types
    └── performance.ts                 # NEW - Performance types
\`\`\`

### 4.3 Implementation Steps

1. **Week 1: Ratings & Reviews**
   - [ ] Create src/types/rating.ts
   - [ ] Create src/db/ratingOperations.ts
   - [ ] Create RatingDisplay.tsx
   - [ ] Create ReviewCard.tsx
   - [ ] Add rating display to staff profiles

2. **Week 2: Portfolio**
   - [ ] Create PortfolioGallery.tsx
   - [ ] Add image upload functionality
   - [ ] Add drag-and-drop reordering
   - [ ] Integrate with online booking profile

3. **Week 3: Performance Dashboard**
   - [ ] Create src/types/performance.ts
   - [ ] Create src/store/slices/staffPerformanceSlice.ts
   - [ ] Create PerformanceDashboard.tsx
   - [ ] Create GoalProgressCard.tsx
   - [ ] Add PerformanceSection.tsx to Team Settings

4. **Week 4: Achievements & Polish**
   - [ ] Create AchievementBadge.tsx
   - [ ] Implement achievement logic
   - [ ] Add badges to staff profiles
   - [ ] Integration testing

### 4.4 Validation Checkpoints

**Week 1 Validation:**
- [ ] Staff ratings display correctly
- [ ] Reviews can be added after appointments
- [ ] Star rating shown on booking page

**Week 2 Validation:**
- [ ] Portfolio images upload correctly
- [ ] Images can be reordered
- [ ] Portfolio shows on booking profile

**Week 3 Validation:**
- [ ] Performance metrics calculate correctly
- [ ] Goals show progress bars
- [ ] Dashboard displays all metrics

**Week 4 Validation:**
- [ ] Achievements unlock correctly
- [ ] Badges display on profiles
- [ ] All features work offline

---

## Database Migration Strategy

### Migration Order

1. **Phase 2**: Add timesheets table
2. **Phase 3**: Add payRuns table
3. **Phase 4**: Add staffRatings and achievements tables

### Schema Updates

Increment version for each phase:
- Current: 9
- Phase 2: 10 (timesheets)
- Phase 3: 11 (payRuns)
- Phase 4: 12 (staffRatings, achievements)

---

## Testing Strategy

### Unit Tests

| Module | Test Focus |
|--------|------------|
| overtimeCalculation.ts | Daily, weekly, combined thresholds |
| commissionCalculation.ts | Percentage, tiered, flat; all bonuses |
| payRunCalculation.ts | Totals, adjustments, guaranteed minimum |
| timesheetSlice.ts | State updates, async thunks |
| payrollSlice.ts | State updates, workflow transitions |

### Integration Tests

| Scenario | Validation |
|----------|------------|
| Clock in -> Turn Tracker | Only clocked-in staff appear |
| Timesheet -> Pay Run | Hours/wages transfer correctly |
| Checkout -> Commission | Revenue and tips aggregate correctly |
| Approval workflow | Status transitions correctly |
| Offline mode | All operations work offline |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Calculation errors in payroll | Extensive unit tests, audit logs |
| Data sync conflicts | Vector clock + field-level merge |
| Performance with large datasets | Pagination, indexed queries |
| Offline payroll processing | Clear online-only indicators for processing |

---

## Success Criteria

### Phase 2 Complete When:
- [ ] Staff can clock in/out from Front Desk
- [ ] Only clocked-in staff appear in Turn Tracker
- [ ] Managers can approve timesheets
- [ ] Overtime calculates correctly
- [ ] All operations work offline

### Phase 3 Complete When:
- [ ] Pay runs can be created for any period
- [ ] Calculations match manual verification
- [ ] Approval workflow enforced
- [ ] Staff can view their earnings
- [ ] 6+ reports available

### Phase 4 Complete When:
- [ ] Ratings display on booking profiles
- [ ] Portfolio gallery functional
- [ ] Performance dashboard shows all metrics
- [ ] Achievements unlock automatically
- [ ] All features work offline

---

## Review Section

### Summary

This implementation plan provides a comprehensive roadmap for completing the Team Module across three phases:

1. **Phase 2 (Time & Attendance)**: Adds clock in/out, break tracking, timesheet management, and overtime calculation. Critical for Phase 3 payroll integration.

2. **Phase 3 (Payroll & Pay Runs)**: Adds automated pay calculations combining wages, commissions, tips, and bonuses. Includes approval workflow and 9 payroll reports.

3. **Phase 4 (Staff Experience)**: Adds ratings/reviews, portfolio gallery, performance dashboard, and achievements. Enhances online booking and staff engagement.

### Key Decisions

- Follow existing offline-first architecture patterns
- Extend BaseSyncableEntity for all new entities
- Use established Redux slice patterns from teamSlice.ts
- Database operations follow teamDB style

### Dependencies

- Phase 3 depends on Phase 2 (timesheets for wages)
- Phase 3 depends on checkout data (for commissions, tips)
- Phase 4 can run partially in parallel with Phase 3

---

*Implementation Plan v1.0 - Created for Mango POS Team Module*
