# Product Requirements Document: Team Module

**Product:** Mango POS
**Module:** Team Management
**Version:** 3.0
**Last Updated:** December 28, 2025
**Status:** Complete PRD with Acceptance Criteria
**Priority:** P0 (Critical)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Personas & Use Cases](#4-user-personas)
5. [Feature Overview](#5-feature-overview)
6. [Feature Requirements Summary](#6-feature-requirements-summary)
7. [Detailed Requirements](#7-detailed-requirements)
   - 7.1 [Staff Profile Management](#71-staff-profile-management)
   - 7.2 [Staff Roles & Permissions](#72-staff-roles--permissions)
   - 7.3 [Service Assignments](#73-service-assignments)
   - 7.4 [Schedule & Timesheet Management](#74-schedule--timesheet-management)
   - 7.5 [Commission & Compensation](#75-commission--compensation)
   - 7.6 [Payroll & Pay Runs](#76-payroll--pay-runs)
   - 7.7 [Online Booking Settings](#77-online-booking-settings)
   - 7.8 [Turn Tracking](#78-turn-tracking)
   - 7.9 [Performance & Analytics](#79-performance--analytics)
   - 7.10 [Notifications](#710-notifications)
8. [Data Architecture](#8-data-architecture)
9. [User Interface Specifications](#9-user-interface-specifications)
10. [Technical Architecture](#10-technical-architecture)
11. [Business Rules](#11-business-rules)
12. [Success Metrics](#12-success-metrics)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Implementation Phases](#14-implementation-phases)
15. [Appendices](#appendix-a-competitive-positioning)

---

## 1. Executive Summary

The Team Module is a comprehensive, industry-leading staff management system for salon and spa businesses. It combines **Mango POS's unique strengths** (offline-first architecture, turn tracking, rotating schedules) with **best-in-class features** inspired by market leaders (real-time timesheets, automated pay runs, staff ratings).

### Core Value Propositions

| Value | Description |
|-------|-------------|
| **Fair Work Distribution** | Industry-unique turn tracking system eliminates disputes |
| **Works Anywhere** | Offline-first architecture ensures reliability |
| **Complete Payroll** | From time tracking to pay run processing |
| **Smart Scheduling** | Rotating patterns + real-time attendance |
| **Client Discovery** | Staff profiles with ratings and portfolios |

### Key Capabilities

- **14 Specialized Staff Roles** for salon/spa industry
- **Turn Tracking System** for fair walk-in distribution (unique differentiator)
- **Real-Time Timesheets** with break and attendance tracking
- **Automated Pay Runs** with commission calculations
- **Rotating Schedules** supporting 1-4 week patterns
- **Staff Ratings & Portfolios** for online booking
- **Offline-First Architecture** with cloud synchronization
- **Comprehensive Reporting** (9+ payroll reports)

---

## 2. Problem Statement

### Business Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **Unfair Walk-in Distribution** | Staff disputes, turnover | Turn tracking system |
| **Manual Payroll Calculations** | Errors, time waste | Automated pay runs |
| **No Real-Time Attendance** | Wage discrepancies | Live timesheet tracking |
| **Complex Rotating Schedules** | Booking conflicts | 1-4 week pattern support |
| **Internet Dependency** | Lost sales during outages | Offline-first architecture |
| **Staff Visibility Online** | Missed bookings | Ratings + portfolios |

### User Pain Points

| Pain Point | Affected Users | Priority |
|------------|----------------|----------|
| Paper-based turn tracking leads to disputes | Front Desk, Staff | Critical |
| Manual commission calculations are error-prone | Owners, Managers | Critical |
| Cannot track actual hours worked vs scheduled | Managers | High |
| No visibility into staff performance metrics | Owners | High |
| Time-consuming new staff onboarding | Managers | Medium |
| Staff can't see their earnings in real-time | Staff | Medium |

---

## 3. Goals & Objectives

### Primary Goals

| Goal | Success Metric | Target |
|------|----------------|--------|
| **Eliminate Turn Disputes** | Turn-related complaints | Zero |
| **Automate Payroll** | Manual calculation time | 90% reduction |
| **Accurate Time Tracking** | Timesheet discrepancy rate | < 1% |
| **Reliable Offline Operation** | Offline transaction success | 100% |
| **Increase Staff Bookings** | Online bookings per staff | +25% |

### Secondary Goals

- Reduce staff onboarding time to under 10 minutes
- Enable staff self-service for schedules and earnings
- Provide actionable performance insights
- Support multi-location staff management

---

## 4. User Personas

### 4.1 Salon Owner

**Goals:** Maximize revenue, minimize payroll errors, retain top performers
**Key Features:** Pay runs, performance reports, commission configuration
**Success Metric:** Payroll processing time < 30 minutes

### 4.2 Salon Manager

**Goals:** Fair scheduling, accurate attendance, smooth operations
**Key Features:** Timesheets, schedule management, time-off approvals
**Success Metric:** Zero scheduling conflicts

### 4.3 Front Desk Receptionist

**Goals:** Quick client assignment, fair turn distribution
**Key Features:** Turn tracker, real-time staff availability
**Success Metric:** Client wait time < 5 minutes

### 4.4 Service Provider (Stylist/Technician)

**Goals:** Fair turns, accurate pay, schedule visibility
**Key Features:** Personal dashboard, earnings view, time-off requests
**Success Metric:** Earnings visibility within 24 hours

### 4.5 Use Cases

| ID | Use Case | Actor | Priority |
|----|----------|-------|----------|
| TEAM-UC-001 | Create new staff profile with required info | Manager | P0 |
| TEAM-UC-002 | Assign role and set permissions | Owner | P0 |
| TEAM-UC-003 | Assign services staff can perform | Manager | P0 |
| TEAM-UC-004 | Configure weekly working schedule | Manager | P0 |
| TEAM-UC-005 | Set rotating schedule pattern | Manager | P0 |
| TEAM-UC-006 | Configure commission rates | Owner | P0 |
| TEAM-UC-007 | Clock in at start of shift | Staff | P1 |
| TEAM-UC-008 | Take and log a break | Staff | P1 |
| TEAM-UC-009 | Clock out at end of shift | Staff | P1 |
| TEAM-UC-010 | Review and approve timesheets | Manager | P1 |
| TEAM-UC-011 | Create pay run for period | Owner | P1 |
| TEAM-UC-012 | Add manual adjustment to pay run | Manager | P1 |
| TEAM-UC-013 | Approve and process pay run | Owner | P1 |
| TEAM-UC-014 | View personal earnings | Staff | P1 |
| TEAM-UC-015 | Submit time-off request | Staff | P2 |
| TEAM-UC-016 | Approve/deny time-off request | Manager | P2 |
| TEAM-UC-017 | View performance dashboard | Staff | P2 |
| TEAM-UC-018 | Set performance goals for staff | Manager | P2 |
| TEAM-UC-019 | Upload portfolio images | Staff | P2 |
| TEAM-UC-020 | View staff ratings and reviews | Staff | P2 |

---

## 5. Feature Overview

### 5.1 Team Settings (Admin Portal)

| Section | Purpose | Priority |
|---------|---------|----------|
| **Profile** | Personal info, photo, emergency contacts | P0 |
| **Services** | Assign services with custom pricing/duration | P0 |
| **Schedule** | Working hours, rotating patterns, overrides | P0 |
| **Timesheet** | Real-time hours, breaks, attendance ⭐ | P0 |
| **Permissions** | Role-based access control | P0 |
| **Commission** | Rates, tiers, bonuses | P0 |
| **Payroll** | Wages, pay runs, deductions ⭐ | P1 |
| **Online Booking** | Availability, ratings, portfolio | P1 |
| **Notifications** | Email, SMS, push preferences | P2 |
| **Performance** | Goals, KPIs, achievements ⭐ | P2 |

### 5.2 Turn Tracker (Front Desk)

**Unique Differentiator** - No competitor offers this feature.

| Capability | Description |
|------------|-------------|
| Real-time turn counts | See all clocked-in staff with current turns |
| Multiple turn types | Service, bonus, adjust, tardy, appointment, partial |
| Manual adjustments | With required reason for audit trail |
| Turn history | Daily logs with export capability |
| Queue management | Auto or manual mode |
| Void capability | Reverse incorrect entries |

### 5.3 Timesheet Dashboard ⭐ NEW

| Capability | Description |
|------------|-------------|
| Live clock in/out | Real-time attendance tracking |
| Break tracking | Automatic and manual break logging |
| Overtime calculation | Daily or weekly threshold options |
| Attendance alerts | Late arrivals, early departures |
| Shift comparison | Scheduled vs actual hours |
| Export to payroll | Seamless pay run integration |

### 5.4 Pay Run System ⭐ NEW

| Capability | Description |
|------------|-------------|
| Automated calculations | Wages + commissions + tips |
| Pay period configuration | Weekly, bi-weekly, monthly |
| Adjustments | Manual additions/deductions |
| Fee pass-through | Option to pass processing fees |
| Review & approve | Manager approval workflow |
| Payment processing | Direct deposit integration |
| 9+ reports | Comprehensive payroll analytics |

---

## 6. Feature Requirements Summary

### 6.0 Requirements by Priority

#### P0 (Critical) - Phase 1

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TEAM-P0-001 | Staff profile creation with required fields | P0 | First/last name, email, phone validated; profile saved in < 2s |
| TEAM-P0-002 | Staff role assignment from 14 predefined roles | P0 | Role selected from dropdown; permissions auto-applied |
| TEAM-P0-003 | Service assignment per staff member | P0 | Can assign multiple services; custom price/duration per service |
| TEAM-P0-004 | Weekly schedule configuration | P0 | Set working hours per day; supports multiple shifts per day |
| TEAM-P0-005 | Rotating schedule patterns (1-4 weeks) | P0 | Pattern repeats correctly; schedule displays in Book module |
| TEAM-P0-006 | Turn tracking for walk-in distribution | P0 | Turn count increments on checkout; lowest turn gets next walk-in |
| TEAM-P0-007 | Permission-based access control | P0 | Actions blocked if permission denied; shows appropriate error |
| TEAM-P0-008 | Commission rate configuration | P0 | Set % or fixed amount; applies to checkouts automatically |
| TEAM-P0-009 | Online booking availability toggle | P0 | Staff appears/hidden from online booking within 30s |
| TEAM-P0-010 | Offline-first data synchronization | P0 | Changes persist locally; sync when online without data loss |

#### P1 (High) - Phase 2: Time & Attendance

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TEAM-P1-001 | Clock in/out system | P1 | Timestamp recorded; UI shows clocked-in status |
| TEAM-P1-002 | Break tracking (paid/unpaid) | P1 | Break duration tracked; unpaid deducted from hours |
| TEAM-P1-003 | Timesheet dashboard with weekly view | P1 | Shows all staff hours; scheduled vs actual comparison |
| TEAM-P1-004 | Overtime calculation (daily/weekly threshold) | P1 | OT hours calculated automatically; configurable threshold |
| TEAM-P1-005 | Late arrival/early departure alerts | P1 | Alert shown if > 5 min late or > 15 min early |
| TEAM-P1-006 | Timesheet manager approval workflow | P1 | Pending → Approved/Disputed status flow |
| TEAM-P1-007 | Timesheet export (CSV, PDF) | P1 | Export includes all columns; date range selectable |
| TEAM-P1-008 | GPS/IP location capture on clock-in | P1 | Optional setting; location recorded if enabled |
| TEAM-P1-009 | Photo verification at clock-in | P1 | Optional setting; photo stored if enabled |
| TEAM-P1-010 | Scheduled vs actual hours variance report | P1 | Shows variance per staff; highlights discrepancies |

#### P1 (High) - Phase 3: Payroll & Pay Runs

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TEAM-P1-011 | Pay run creation with period selection | P1 | Select date range; auto-include active staff |
| TEAM-P1-012 | Automatic wage calculation from timesheets | P1 | Hours × rate calculated; includes OT multiplier |
| TEAM-P1-013 | Automatic commission calculation | P1 | Service/product/tip commissions calculated |
| TEAM-P1-014 | Tiered commission calculation | P1 | Progressive rates applied correctly to period total |
| TEAM-P1-015 | Manual adjustments (bonus, deduction, reimbursement) | P1 | Add/edit adjustments; reflected in total |
| TEAM-P1-016 | Pay run review interface | P1 | Shows breakdown per staff; total summary |
| TEAM-P1-017 | Manager approval workflow for pay runs | P1 | Requires approval before processing |
| TEAM-P1-018 | Direct deposit payment processing | P1 | Integration with payment processor; ACH transfer |
| TEAM-P1-019 | Pay stub generation (PDF) | P1 | Detailed breakdown; emailed to staff |
| TEAM-P1-020 | 9 payroll reports | P1 | All 9 report types available; export supported |
| TEAM-P1-021 | Staff earnings portal (self-service) | P1 | Staff can view own earnings; historical data |
| TEAM-P1-022 | Guaranteed minimum pay enforcement | P1 | If commission < minimum, pay minimum instead |

#### P2 (Medium) - Phase 4: Staff Experience

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TEAM-P2-001 | Staff rating display from client reviews | P2 | Average rating calculated; shown on profile |
| TEAM-P2-002 | Portfolio gallery (up to 20 images) | P2 | Upload/delete images; shown in online booking |
| TEAM-P2-003 | Professional bio and specialties | P2 | Text fields saved; displayed to clients |
| TEAM-P2-004 | Performance goals configuration | P2 | Set revenue/service/client targets per staff |
| TEAM-P2-005 | Performance dashboard with progress bars | P2 | Real-time % toward goals; visual indicators |
| TEAM-P2-006 | Achievement badges system | P2 | Badges earned for milestones; displayed on profile |
| TEAM-P2-007 | Group booking for multiple guests | P2 | Book multiple people at once; find overlapping availability |
| TEAM-P2-008 | Staff notification preferences | P2 | Toggle email/SMS/push per notification type |
| TEAM-P2-009 | Time-off request submission | P2 | Request form with dates/type; manager notified |
| TEAM-P2-010 | Time-off approval workflow | P2 | Manager approves/denies; staff notified |

#### P3 (Lower) - Phase 5: Advanced

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TEAM-P3-001 | Multi-location staff assignment | P3 | Staff can work at multiple locations; schedule per location |
| TEAM-P3-002 | AI-powered schedule optimization | P3 | Suggests optimal schedules based on demand patterns |
| TEAM-P3-003 | Skills matrix tracking | P3 | Track skill levels per service; training progress |
| TEAM-P3-004 | HR integrations (Gusto, ADP) | P3 | Export payroll data to external HR systems |
| TEAM-P3-005 | Calendar sync (Google, Apple, Outlook) | P3 | Two-way sync with personal calendars |

---

## 7. Detailed Requirements

### 7.1 Staff Profile Management

#### 6.1.1 Required Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| First Name | String | Max 50 chars, required | |
| Last Name | String | Max 50 chars, required | |
| Display Name | String | Max 100 chars, required | Shown to clients |
| Email | Email | Valid, unique | Login credential |
| Phone | Phone | Valid format | For notifications |

#### 6.1.2 Professional Profile (Client-Facing) ⭐ ENHANCED

| Field | Type | Description |
|-------|------|-------------|
| Profile Photo | Image | High-quality professional photo |
| Professional Bio | Text | Max 500 chars, shown in online booking |
| Job Title | String | e.g., "Senior Colorist" |
| Specialties | Tags | Highlighted skills (e.g., "Balayage", "Bridal") |
| Portfolio Images | Gallery | Up to 20 work samples |
| Years of Experience | Number | Shown in profile |
| Certifications | List | Professional credentials |
| Languages | Tags | Languages spoken |

#### 6.1.3 HR Information

| Field | Type | Description |
|-------|------|-------------|
| Employee ID | String | Internal reference |
| Date of Birth | Date | HR records |
| Hire Date | Date | Employment start |
| Employment Type | Enum | Full-time, Part-time, Contractor |
| Emergency Contact | Object | Name, phone, relationship |
| Address | Object | Street, city, state, zip |
| Tax Information | Object | For payroll (W-4, I-9 status) |
| Direct Deposit | Object | Bank account for payments |

#### 6.1.4 Staff Rating System ⭐ NEW

| Feature | Description |
|---------|-------------|
| Average Rating | Calculated from client reviews (1-5 stars) |
| Review Count | Total number of reviews |
| Display Setting | Toggle to show/hide ratings online |
| Recent Reviews | Last 10 reviews visible to staff |
| Rating Breakdown | Distribution by star level |

```
User Story:
As a potential client browsing online booking
I want to see staff ratings and reviews
So that I can choose a service provider I'm confident in

Acceptance Criteria:
- Star rating displayed next to staff name (if enabled)
- Review count shown (e.g., "4.8 ★ (127 reviews)")
- Staff can request to hide ratings
- Only verified appointments can leave reviews
```

---

### 6.2 Staff Roles & Permissions

#### 6.2.1 Supported Roles (14 Types)

| Category | Roles | Default Permission Level |
|----------|-------|-------------------------|
| **Management** | owner, manager | Full, High |
| **Hair Services** | senior_stylist, stylist, junior_stylist, apprentice, barber, colorist | Medium, Low, Low, Basic, Medium, Medium |
| **Nail Services** | nail_technician | Medium |
| **Spa Services** | esthetician, massage_therapist | Medium, Medium |
| **Beauty Services** | makeup_artist | Medium |
| **Support** | receptionist, assistant | Low, Basic |

#### 6.2.2 Permission System (Hybrid Model) ⭐ ENHANCED

Combines role-based defaults with granular overrides.

**Permission Levels (Simplified View):**

| Level | Description | Typical Roles |
|-------|-------------|---------------|
| **Full** | All permissions | Owner |
| **High** | Most permissions, no destructive actions | Manager |
| **Medium** | Standard operations | Senior stylists |
| **Low** | Limited to own data | Junior staff |
| **Basic** | View-only | Apprentices |
| **No Access** | Profile only, no system access | Contractors |

**Granular Permission Flags:**

| Permission | Description | Full | High | Med | Low | Basic |
|------------|-------------|------|------|-----|-----|-------|
| `canAccessAdminPortal` | Admin settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canAccessReports` | Business reports | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| `canViewSensitiveClientInfo` | SSN, payment details | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canModifyPrices` | Change prices | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canApplyDiscounts` | Apply discounts | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| `canProcessRefunds` | Process refunds | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canVoidTransactions` | Void sales | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canDeleteRecords` | Delete data | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| `canManageTeam` | Add/edit team | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canViewOthersCalendar` | See other schedules | ✅ | ✅ | ✅ | ✅ | ✅ |
| `canBookForOthers` | Book for other staff | ✅ | ✅ | ✅ | ❌ | ❌ |
| `canEditOthersAppointments` | Modify others' appts | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canAccessPayroll` | View/process payroll | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canViewOwnEarnings` | See own pay details | ✅ | ✅ | ✅ | ✅ | ✅ |
| `canSubmitTimeOff` | Request time off | ✅ | ✅ | ✅ | ✅ | ✅ |
| `canApproveTimeOff` | Approve requests | ✅ | ✅ | ❌ | ❌ | ❌ |
| `canAdjustTurns` | Manual turn adjustments | ✅ | ✅ | ❌ | ❌ | ❌ |

⚠️ = Configurable per role/individual

**PIN Protection:**

| Action | PIN Required (Configurable) |
|--------|---------------------------|
| Process refund | Yes (default) |
| Apply discount > 20% | Yes (default) |
| Void transaction | Yes (default) |
| Access reports | Optional |
| Clock in for others | Optional |

---

### 6.3 Service Assignments

#### 6.3.1 Service Configuration Per Staff

| Field | Type | Description |
|-------|------|-------------|
| `serviceId` | String | Reference to catalog service |
| `canPerform` | Boolean | Whether staff can perform |
| `customPrice` | Number | Staff-specific price (optional) |
| `customDuration` | Number | Staff-specific duration (optional) |
| `commissionOverride` | Number | Service-specific commission % |
| `skillLevel` | Enum | Beginner, Intermediate, Expert |
| `isSignatureService` | Boolean | Highlight as specialty |

#### 6.3.2 Bulk Service Assignment ⭐ NEW

```
User Story:
As a salon manager
I want to assign multiple services to a staff member at once
So that onboarding is faster

Acceptance Criteria:
- Can select multiple services via checkboxes
- Can apply same custom price/duration to selection
- Can copy service assignments from another staff member
- Changes sync to online booking immediately
```

---

### 6.4 Schedule & Timesheet Management

#### 6.4.1 Schedule Configuration

**Regular Working Hours:**

```typescript
interface WorkingDay {
  dayOfWeek: number;      // 0 = Sunday, 6 = Saturday
  isWorking: boolean;
  shifts: Shift[];
  breakTimes?: Break[];
}

interface Shift {
  startTime: string;      // "09:00"
  endTime: string;        // "17:00"
  isOvertime?: boolean;   // For overtime designation
}

interface Break {
  startTime: string;
  endTime: string;
  label: string;          // "Lunch", "Break"
  isPaid: boolean;        // For payroll calculation
}
```

**Rotating Schedule Patterns (Unique Feature):**

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Fixed | Same every week | Most staff |
| 2-Week | Alternating pattern | Part-time staff |
| 3-Week | Three-week rotation | Complex scheduling |
| 4-Week | Four-week rotation | Multiple locations |

**Schedule Override Types:**

| Type | Description |
|------|-------------|
| `day_off` | Not working (normally scheduled day) |
| `custom_hours` | Different hours than normal |
| `extra_day` | Working on normally off day |
| `location_change` | Working at different location |

#### 6.4.2 Real-Time Timesheet Tracking ⭐ NEW

**Clock In/Out System:**

| Feature | Description |
|---------|-------------|
| Clock In | Start of shift with timestamp |
| Clock Out | End of shift with timestamp |
| Break Start | Begin break period |
| Break End | Resume work |
| Location Capture | GPS/IP for verification (optional) |
| Photo Verification | Selfie at clock in (optional) |

**Timesheet Entry:**

```typescript
interface TimesheetEntry {
  id: string;
  staffId: string;
  date: string;

  // Scheduled vs Actual
  scheduledStart: string;
  scheduledEnd: string;
  actualClockIn: string;
  actualClockOut: string;

  // Breaks
  breaks: {
    startTime: string;
    endTime: string;
    type: 'paid' | 'unpaid';
    duration: number;       // minutes
  }[];

  // Calculated
  scheduledHours: number;
  actualHours: number;
  regularHours: number;
  overtimeHours: number;

  // Status
  status: 'pending' | 'approved' | 'disputed';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}
```

**Attendance Tracking:**

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Late Arrival | Clock in after scheduled start | > 5 minutes |
| Early Departure | Clock out before scheduled end | > 15 minutes |
| Missed Clock In | No clock in for scheduled shift | By shift start |
| Extended Break | Break longer than scheduled | > 5 minutes |
| No Show | Scheduled but didn't work | End of day |

**Overtime Calculation:**

| Mode | Description |
|------|-------------|
| **Daily** | Hours over daily threshold (e.g., > 8 hrs/day) |
| **Weekly** | Hours over weekly threshold (e.g., > 40 hrs/week) |
| **Both** | Whichever triggers first |

```typescript
interface OvertimeSettings {
  calculationType: 'daily' | 'weekly' | 'both';
  dailyThreshold: number;     // hours
  weeklyThreshold: number;    // hours
  overtimeRate: number;       // multiplier (e.g., 1.5)
  doubleTimeRate?: number;    // multiplier for double time
  doubleTimeThreshold?: number;
}
```

#### 6.4.3 Time Off Management

**Time Off Types:**

| Type | Paid | Accrual | Notes |
|------|------|---------|-------|
| `vacation` | Yes | Yes | PTO balance tracking |
| `sick` | Yes | Yes | May require documentation |
| `personal` | Yes | No | Limited per year |
| `unpaid` | No | No | Extended leave |
| `bereavement` | Yes | No | Family emergencies |
| `jury_duty` | Yes | No | Legal requirement |
| `other` | Configurable | No | Custom types |

**Request Workflow:**

```
Staff Submits → Pending → Manager Review → Approved/Denied
                            ↓
                    Conflicts Detected? → Show Warnings
                            ↓
                    Notify Staff of Decision
                            ↓
                    Update Calendar/Availability
```

---

### 6.5 Commission & Compensation

#### 6.5.1 Commission Types

| Type | Description | Best For |
|------|-------------|----------|
| `percentage` | Fixed % of service revenue | Most staff |
| `tiered` | Progressive rates by revenue | High performers |
| `flat` | Fixed amount per service | Simple structures |
| `sliding_scale` | % decreases as revenue increases | Cost control |
| `none` | Salary only | Managers, receptionists |

#### 6.5.2 Commission Configuration

```typescript
interface CommissionSettings {
  // Base Configuration
  type: CommissionType;
  basePercentage: number;

  // Tiered Structure
  tiers?: {
    minRevenue: number;
    maxRevenue?: number;
    percentage: number;
  }[];

  // Category-Specific Rates
  serviceCommission: number;      // Services
  productCommission: number;      // Retail products
  giftCardCommission: number;     // Gift card sales ⭐
  membershipCommission: number;   // Membership sales ⭐

  // Tip Handling
  tipHandling: 'keep_all' | 'pool' | 'percentage_to_house';
  tipPercentageToHouse?: number;

  // Bonuses
  newClientBonus: number;         // $ for new clients
  rebookBonus: number;            // $ for rebookings
  retailBonus?: number;           // % bonus on retail

  // Deductions (before commission)
  deductSupplyCost: boolean;      // Deduct product cost
  supplyDeductionRate?: number;   // % of service
}
```

#### 6.5.3 Commission Examples

**Example 1: Tiered Commission**
```
Tier 1: $0 - $5,000      → 40%
Tier 2: $5,001 - $10,000 → 45%
Tier 3: $10,001+         → 50%

Staff earns $12,000 in services:
- First $5,000 × 40% = $2,000
- Next $5,000 × 45% = $2,250
- Last $2,000 × 50% = $1,000
- Total Commission: $5,250
```

**Example 2: Commission with Bonuses**
```
Base: 45% on services
New Client Bonus: $5 per new client
Rebook Bonus: $3 per rebooking

Staff revenue: $8,000 (15 new clients, 40 rebooks)
- Service Commission: $8,000 × 45% = $3,600
- New Client Bonuses: 15 × $5 = $75
- Rebook Bonuses: 40 × $3 = $120
- Total: $3,795
```

---

### 6.6 Payroll & Pay Runs ⭐ NEW

#### 6.6.1 Wage Configuration

```typescript
interface WageSettings {
  // Pay Type
  payType: 'hourly' | 'salary' | 'commission_only' | 'hybrid';

  // Hourly Settings
  hourlyRate?: number;

  // Salary Settings
  salaryAmount?: number;
  salaryPeriod?: 'weekly' | 'bi-weekly' | 'monthly' | 'annual';

  // Guarantees
  guaranteedMinimum?: number;     // Minimum pay per period
  guaranteedPeriod?: 'daily' | 'weekly' | 'pay_period';

  // Overtime (from timesheet settings)
  overtimeRate: number;           // Multiplier
  doubleTimeRate?: number;

  // Pay Period
  payPeriod: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  payDayOfWeek?: number;          // For weekly
  payDayOfMonth?: number;         // For monthly
}
```

#### 6.6.2 Pay Run Process

**Step 1: Period Selection**
```
Select Pay Period: [Dec 1 - Dec 15, 2024]
Staff Included: [All Active] or [Select Specific]
```

**Step 2: Automatic Calculations**

| Component | Source | Calculation |
|-----------|--------|-------------|
| **Wages** | Timesheets | Hours × Rate |
| **Overtime** | Timesheets | OT Hours × OT Rate |
| **Service Commission** | Checkout data | Revenue × Commission % |
| **Product Commission** | Checkout data | Product sales × % |
| **Gift Card Commission** | Checkout data | GC sales × % |
| **Membership Commission** | Checkout data | Membership sales × % |
| **Tips** | Checkout data | Direct or pooled |
| **Bonuses** | Checkout data | New client + rebook |

**Step 3: Adjustments**

| Adjustment Type | Description |
|-----------------|-------------|
| **Add: Bonus** | Manual bonus payment |
| **Add: Reimbursement** | Expense reimbursement |
| **Add: Tip (missed)** | Tip not added at checkout |
| **Deduct: Advance** | Cash advance repayment |
| **Deduct: Fee Pass-through** | Processing fees to staff |
| **Deduct: Supply Cost** | Product/supply deduction |
| **Deduct: Tax** | Tax withholding |
| **Deduct: Benefits** | Health, retirement, etc. |

**Step 4: Review & Approve**

```
┌─────────────────────────────────────────────────────────────┐
│ PAY RUN: Dec 1-15, 2024                        [Export CSV] │
├─────────────────────────────────────────────────────────────┤
│ Staff        │ Hours │ Wages  │ Commission │ Tips  │ Total │
├─────────────────────────────────────────────────────────────┤
│ Sarah M.     │ 72    │ $1,080 │ $2,340     │ $456  │ $3,876│
│ John D.      │ 80    │ $1,200 │ $1,890     │ $312  │ $3,402│
│ Lisa K.      │ 64    │ $960   │ $2,100     │ $380  │ $3,440│
├─────────────────────────────────────────────────────────────┤
│ TOTAL        │ 216   │ $3,240 │ $6,330     │$1,148 │$10,718│
└─────────────────────────────────────────────────────────────┘
                              [Save Draft] [Approve & Process]
```

**Step 5: Payment Processing**

| Method | Description |
|--------|-------------|
| **Direct Deposit** | ACH transfer to bank account |
| **Check** | Generate printable check |
| **Cash** | Record cash payment |
| **External** | Mark as paid via external system |

#### 6.6.3 Payroll Reports (9 Types) ⭐ NEW

| Report | Description |
|--------|-------------|
| **Pay Run Summary** | Overview of all payments in period |
| **Staff Earnings Detail** | Breakdown by staff member |
| **Commission Report** | Commission by service/product |
| **Timesheet Report** | Hours worked by staff |
| **Overtime Report** | OT hours and cost |
| **Tip Report** | Tips by staff and method |
| **Tax Summary** | Withholdings by category |
| **Year-to-Date** | Cumulative earnings by staff |
| **Labor Cost Analysis** | Labor as % of revenue |

---

### 6.7 Online Booking Settings

#### 6.7.1 Availability Configuration

| Setting | Type | Description |
|---------|------|-------------|
| `isBookableOnline` | Boolean | Allow online booking |
| `showOnWebsite` | Boolean | Display on booking site |
| `showOnApp` | Boolean | Display in mobile app |
| `acceptNewClients` | Boolean | Accept first-time clients |
| `autoAcceptBookings` | Boolean | Auto-confirm or require approval |

#### 6.7.2 Booking Controls

| Setting | Type | Description |
|---------|------|-------------|
| `maxAdvanceBookingDays` | Number | How far ahead (default: 60) |
| `minAdvanceBookingHours` | Number | Minimum notice (default: 2) |
| `bufferBetweenAppointments` | Number | Minutes between appointments |
| `bufferType` | Enum | 'before', 'after', 'both' |
| `allowDoubleBooking` | Boolean | Multiple appointments at once |
| `maxConcurrentAppointments` | Number | Max simultaneous (if double-booking) |

#### 6.7.3 Deposit & Cancellation

| Setting | Type | Description |
|---------|------|-------------|
| `requireDeposit` | Boolean | Require payment to book |
| `depositType` | Enum | 'fixed', 'percentage' |
| `depositAmount` | Number | Amount or percentage |
| `cancellationPolicy` | Enum | 'flexible', 'moderate', 'strict' |
| `cancellationWindow` | Number | Hours before to cancel free |
| `noShowFee` | Number | Fee for no-shows |

#### 6.7.4 Profile Display ⭐ ENHANCED

| Setting | Description |
|---------|-------------|
| `displayOrder` | Sort position in staff list |
| `showRating` | Display star rating |
| `showReviewCount` | Display number of reviews |
| `showYearsExperience` | Display tenure |
| `profileBio` | Customer-facing description |
| `specialties` | Highlighted skills |
| `portfolioImages` | Work gallery (up to 20) |
| `featuredServices` | Top 6 services to highlight |

#### 6.7.5 Group Booking ⭐ NEW

```
User Story:
As a client booking online
I want to book appointments for multiple people at once
So that my group can be serviced together

Acceptance Criteria:
- Can add multiple guests to booking
- System finds available slots for all
- Can assign different services per guest
- Shows total price and duration
- Sends confirmation to primary booker
```

---

### 6.8 Turn Tracking

**This is Mango POS's unique differentiator - no competitor offers this feature.**

#### 6.8.1 Turn Types

| Type | Code | Description | Automatic |
|------|------|-------------|-----------|
| Service Turn | `service` | Standard service completion | Yes |
| Checkout Turn | `checkout` | From ticket checkout | Yes |
| Bonus Turn | `bonus` | High-value service bonus | Yes |
| Appointment Turn | `appt` | Pre-booked appointment | Yes |
| Adjust Turn | `adjust` | Manual adjustment (+/-) | No |
| Tardy Turn | `tardy` | Late arrival penalty | Configurable |
| Partial Turn | `partial` | Split service credit | Configurable |
| Void | `void` | Reverse incorrect entry | No |

#### 6.8.2 Turn Calculation Rules

```typescript
interface TurnSettings {
  // Basic Rules
  countAppointmentsAsTurns: boolean;     // Include appointments
  countCheckoutsAsTurns: boolean;        // Include checkouts

  // Bonus Turns
  bonusTurnThreshold: number;            // $ amount for bonus
  bonusTurnMultiplier: number;           // e.g., 2x for high-value

  // Penalties
  enableTardyPenalty: boolean;
  tardyGraceMinutes: number;             // Minutes before penalty
  tardyPenaltyAmount: number;            // Turn deduction

  // Partial Turns
  enablePartialTurns: boolean;
  partialTurnServices: string[];         // Services that split

  // Reset
  resetTime: string;                     // "00:00" or business open
  resetType: 'midnight' | 'business_open';
}
```

#### 6.8.3 Turn Entry Structure

```typescript
interface TurnEntry {
  id: string;
  staffId: string;
  timestamp: Date;

  // Turn Details
  turnNumber: number;           // Sequential for the day
  turnType: TurnType;
  turnValue: number;            // Usually 1, can be fractional

  // Transaction Link
  ticketId?: string;
  appointmentId?: string;

  // Service Details
  clientName: string;
  services: string[];
  serviceAmount: number;        // Dollar value

  // For Adjustments
  adjustmentReason?: string;
  adjustedBy?: string;

  // Audit
  createdAt: Date;
  createdBy: string;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
}
```

#### 6.8.4 Queue Management

| Mode | Description | Use Case |
|------|-------------|----------|
| **Auto** | System assigns next by lowest turn count | Fair distribution |
| **Manual** | Front desk selects | Skill matching |
| **Hybrid** | Suggest auto, allow override | Flexibility |

**Queue Position Factors:**
1. Current turn count (primary)
2. Clock-in time (tiebreaker)
3. Manual position adjustment
4. Skip count (temporary removal)

---

### 6.9 Performance & Analytics ⭐ NEW

#### 6.9.1 Performance Goals

```typescript
interface PerformanceGoals {
  // Revenue Goals
  dailyRevenueTarget?: number;
  weeklyRevenueTarget?: number;
  monthlyRevenueTarget?: number;

  // Service Goals
  dailyServicesTarget?: number;
  weeklyServicesTarget?: number;
  averageTicketTarget?: number;

  // Client Goals
  newClientTarget?: number;           // Per month
  rebookingRateTarget?: number;       // Percentage
  clientRetentionTarget?: number;     // Percentage

  // Product Goals
  retailSalesTarget?: number;
  retailAttachRate?: number;          // % of tickets with retail

  // Quality Goals
  ratingTarget?: number;              // Minimum star rating
}
```

#### 6.9.2 Performance Metrics (Real-Time)

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Revenue** | Total service + product revenue | Sum of checkout totals |
| **Service Count** | Number of services performed | Count of completed services |
| **Average Ticket** | Average transaction value | Revenue ÷ Ticket count |
| **New Clients** | First-time clients served | Count where client.isNew |
| **Rebooking Rate** | % of clients who rebook | Rebooks ÷ Total clients |
| **Utilization** | % of available time booked | Booked hours ÷ Scheduled hours |
| **Retail Attach Rate** | % of tickets with product | Product tickets ÷ Total tickets |
| **Rating** | Average client rating | Sum of ratings ÷ Review count |

#### 6.9.3 Performance Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ SARAH M. - Performance Dashboard              December 2024 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Revenue          Services         Avg Ticket    Rating     │
│  ████████░░       ██████████       █████████░    ★★★★☆     │
│  $12,450/$15K     156/150          $79.80/$75    4.7/5.0   │
│  83%              104%             106%          94%        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  New Clients      Rebook Rate      Utilization   Retail    │
│  ██████░░░░       ████████░░       ███████░░░    ████░░░░  │
│  18/25            72%/80%          78%/85%       $890/$1.5K│
│  72%              90%              92%           59%        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 6.9.4 Achievements & Badges ⭐ NEW (Future)

| Badge | Criteria | Reward |
|-------|----------|--------|
| 🌟 Top Performer | Highest revenue in month | Featured on booking page |
| 🆕 New Client Champion | Most new clients | Bonus |
| 📅 Rebooking Master | Highest rebook rate | Recognition |
| 💯 Perfect Rating | 5.0 rating (10+ reviews) | Badge on profile |
| 🎯 Goal Crusher | Hit all monthly goals | Bonus tier unlock |

---

### 6.10 Notifications

#### 6.10.1 Notification Channels

| Channel | Use Cases |
|---------|-----------|
| **Email** | Schedules, summaries, time-off responses, pay stubs |
| **SMS** | Urgent alerts, appointment reminders |
| **Push** | Real-time updates, new bookings, messages |
| **In-App** | All notifications viewable in app |

#### 6.10.2 Staff Notification Types

| Notification | Email | SMS | Push | Configurable |
|--------------|-------|-----|------|--------------|
| New Booking | ✅ | ✅ | ✅ | Yes |
| Booking Change | ✅ | ✅ | ✅ | Yes |
| Booking Cancellation | ✅ | ✅ | ✅ | Yes |
| Appointment Reminder | ✅ | ✅ | ✅ | Yes |
| Schedule Published | ✅ | ❌ | ✅ | Yes |
| Time-Off Response | ✅ | ✅ | ✅ | No |
| Pay Run Processed | ✅ | ❌ | ✅ | Yes |
| New Review | ❌ | ❌ | ✅ | Yes |
| Goal Achievement | ✅ | ❌ | ✅ | Yes |
| Team Announcement | ✅ | ❌ | ✅ | Yes |
| System Update | ✅ | ❌ | ❌ | No |

---

## 8. Data Architecture

### 8.1 Core Entity: TeamMemberSettings

```typescript
interface TeamMemberSettings extends BaseSyncableEntity {
  // Identity
  id: string;
  tenantId: string;
  storeId: string;

  // Profile
  profile: TeamMemberProfile;
  professionalProfile: ProfessionalProfile;    // ⭐ NEW
  hrInfo: HRInformation;                       // ⭐ ENHANCED

  // Work Configuration
  services: ServiceAssignment[];
  schedule: ScheduleSettings;

  // Compensation
  permissions: RolePermissions;
  commission: CommissionSettings;
  wages: WageSettings;                         // ⭐ NEW

  // Online Presence
  onlineBooking: OnlineBookingSettings;
  ratings: StaffRatings;                       // ⭐ NEW

  // Tracking
  performanceGoals: PerformanceGoals;          // ⭐ ENHANCED
  notifications: NotificationPreferences;

  // Status
  status: 'active' | 'inactive' | 'archived' | 'terminated';
  employmentType: 'full-time' | 'part-time' | 'contractor';

  // Sync
  syncStatus: SyncStatus;
  version: number;
  vectorClock: Record<string, number>;
}
```

### 8.2 Related Entities

```typescript
// Timesheet (Daily entries)
interface TimesheetEntry {
  id: string;
  staffId: string;
  date: string;
  scheduledShift: Shift;
  actualClockIn: string;
  actualClockOut: string;
  breaks: BreakEntry[];
  calculatedHours: HoursBreakdown;
  status: 'pending' | 'approved' | 'disputed';
}

// Pay Run
interface PayRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'processed';
  staffPayments: StaffPayment[];
  totals: PayRunTotals;
  approvedBy?: string;
  processedAt?: string;
}

// Turn Log
interface TurnLog {
  id: string;
  staffId: string;
  date: string;
  entries: TurnEntry[];
  dailyTotal: number;
  queuePosition: number;
}

// Staff Rating
interface StaffRating {
  staffId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1|2|3|4|5, number>;
  recentReviews: Review[];
}
```

### 8.3 State Management Architecture

| Slice | Purpose | Sync |
|-------|---------|------|
| `teamSlice` | Complete team member settings | Cloud + Local |
| `timesheetSlice` | Timesheet entries ⭐ NEW | Cloud + Local |
| `payrollSlice` | Pay runs and payments ⭐ NEW | Cloud |
| `turnSlice` | Turn tracking data | Local (daily reset) |
| `uiStaffSlice` | Front desk display | Memory only |

### 8.4 Offline-First Data Flow

```
User Action
    │
    ▼
Redux Store (Optimistic Update)
    │
    ├──► UI Updates Immediately
    │
    ▼
IndexedDB (Local Persistence)
    │
    ▼
Sync Queue (When Online)
    │
    ▼
Cloud Database (Supabase)
    │
    ▼
Other Devices (Real-time Sync)
```

---

## 9. User Interface Specifications

### 9.1 Team Settings Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Team Settings                              [Discard] [Save]   │
├────────────────┬────────────────────────────────────────────────┤
│                │ ┌────────────────────────────────────────────┐ │
│  TEAM MEMBERS  │ │ 👤 Sarah Mitchell                          │ │
│                │ │ Senior Stylist · Active · ★ 4.8           │ │
│  [+ Add New]   │ └────────────────────────────────────────────┘ │
│                │                                                │
│  🔍 Search     │ ┌─────────────────────────────────────────────┐│
│                │ │ Profile│Services│Schedule│Timesheet│Pay│... ││
│  Filter: All ▼ │ ├─────────────────────────────────────────────┤│
│                │ │                                             ││
│  ┌──────────┐  │ │         [Section Content Area]             ││
│  │ 👤 Sarah │  │ │                                             ││
│  │ Sr Style │◄─┼─│                                             ││
│  │ ★ 4.8    │  │ │                                             ││
│  └──────────┘  │ │                                             ││
│  ┌──────────┐  │ │                                             ││
│  │ 👤 John  │  │ │                                             ││
│  │ Stylist  │  │ │                                             ││
│  │ ★ 4.5    │  │ │                                             ││
│  └──────────┘  │ │                                             ││
│                │ └─────────────────────────────────────────────┘│
└────────────────┴────────────────────────────────────────────────┘
```

### 9.2 Turn Tracker Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ TURN TRACKER          Dec 2, 2024    [🔍] [≡/⊞] [⚙] [✕]       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┬───────────────────────────────────────────────┐ │
│ │ 👤 SARAH M  │ [1][$45] [2][$78] [3][$92] [4][$55]      [+] │ │
│ │ Turns: 4    │  Hair     Color    Cut+Sty   Blowout         │ │
│ │ $270        │                                               │ │
│ ├─────────────┼───────────────────────────────────────────────┤ │
│ │ 👤 JOHN D   │ [1][$65] [2][$45] [3][$120]               [+] │ │
│ │ Turns: 3    │  Cut      Trim     Full Color                 │ │
│ │ $230        │                                               │ │
│ ├─────────────┼───────────────────────────────────────────────┤ │
│ │ 👤 LISA K   │ [1][$55] [2][$88]                         [+] │ │
│ │ Turns: 2    │  Style    Balayage                            │ │
│ │ $143        │                                               │ │
│ └─────────────┴───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Staff: 3    Total Turns: 9    Revenue: $643    ● Service ● Void│
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Timesheet Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ TIMESHEETS                    Week of Dec 2-8, 2024    [Export] │
├─────────────────────────────────────────────────────────────────┤
│ Staff      │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Total   │
├─────────────────────────────────────────────────────────────────┤
│ Sarah M.   │ 8.0  │ 8.0  │ OFF  │ 8.5  │ 9.0  │ 6.0  │ 39.5 hrs│
│  Scheduled │ 8.0  │ 8.0  │ OFF  │ 8.0  │ 8.0  │ 6.0  │ 38.0    │
│  Overtime  │  -   │  -   │  -   │ 0.5  │ 1.0  │  -   │ 1.5     │
├─────────────────────────────────────────────────────────────────┤
│ John D.    │ 8.0  │ 7.5⚠ │ 8.0  │ 8.0  │ OFF  │ 8.0  │ 39.5 hrs│
│  Scheduled │ 8.0  │ 8.0  │ 8.0  │ 8.0  │ OFF  │ 8.0  │ 40.0    │
│  Variance  │  -   │-0.5  │  -   │  -   │  -   │  -   │ -0.5    │
├─────────────────────────────────────────────────────────────────┤
│ TOTALS     │ 16.0 │ 15.5 │ 8.0  │ 16.5 │ 9.0  │ 14.0 │ 79.0 hrs│
└─────────────────────────────────────────────────────────────────┘
⚠ = Variance from schedule    [Approve All] [View Details]
```

### 9.4 Pay Run Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ PAY RUN: Dec 1-15, 2024                    Status: Draft       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Staff         Hours    Wages    Commission   Tips    TOTAL    │
│  ─────────────────────────────────────────────────────────────  │
│  Sarah M.      72.0    $1,080    $2,340      $456    $3,876    │
│    └─ [View Breakdown] [Add Adjustment]                        │
│                                                                 │
│  John D.       80.0    $1,200    $1,890      $312    $3,402    │
│    └─ [View Breakdown] [Add Adjustment]                        │
│                                                                 │
│  Lisa K.       64.0    $960      $2,100      $380    $3,440    │
│    └─ [View Breakdown] [Add Adjustment]                        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  TOTAL         216.0   $3,240    $6,330      $1,148  $10,718   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│              [Save Draft]  [Preview]  [Approve & Process →]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Technical Architecture

### 10.1 Redux Store Structure

```typescript
interface RootState {
  // Team Module Slices
  team: TeamState;              // Team member settings
  timesheet: TimesheetState;    // ⭐ NEW - Time tracking
  payroll: PayrollState;        // ⭐ NEW - Pay runs
  turn: TurnState;              // Turn tracking
  uiStaff: UIStaffState;        // Front desk display

  // Supporting Slices
  schedule: ScheduleState;      // Calendar integration
  sync: SyncState;              // Offline sync queue
}
```

### 10.2 Key Actions

```typescript
// Team Management
fetchTeamMembers(storeId)
saveTeamMember({ member, context })
archiveTeamMember({ memberId })
updateStaffRating({ staffId, rating })        // ⭐ NEW

// Timesheet Management ⭐ NEW
clockIn({ staffId, timestamp, location? })
clockOut({ staffId, timestamp })
startBreak({ staffId, breakType })
endBreak({ staffId })
approveTimesheet({ entryId, approvedBy })
disputeTimesheet({ entryId, reason })

// Payroll Management ⭐ NEW
createPayRun({ periodStart, periodEnd, staffIds })
calculatePayRun({ payRunId })
addPayRunAdjustment({ payRunId, staffId, adjustment })
approvePayRun({ payRunId, approvedBy })
processPayRun({ payRunId })

// Turn Tracking
recordTurn({ staffId, turnEntry })
adjustTurn({ staffId, amount, reason })
voidTurn({ turnId, reason })
resetDailyTurns()

// Schedule Management
updateSchedule({ staffId, schedule })
submitTimeOffRequest({ staffId, request })
approveTimeOffRequest({ requestId, approvedBy })
```

### 10.3 Database Schema (IndexedDB)

```typescript
// Team Members
teamMembers: {
  keyPath: 'id',
  indexes: ['storeId', 'status', 'role', 'syncStatus']
}

// Timesheets ⭐ NEW
timesheets: {
  keyPath: 'id',
  indexes: ['staffId', 'date', 'status', 'syncStatus']
}

// Pay Runs ⭐ NEW
payRuns: {
  keyPath: 'id',
  indexes: ['periodStart', 'status', 'syncStatus']
}

// Turn Logs
turnLogs: {
  keyPath: 'id',
  indexes: ['staffId', 'date', 'type']
}
```

### 10.4 API Endpoints (Supabase)

```
# Team Members
GET    /team-members?store_id={id}
GET    /team-members/{id}
POST   /team-members
PATCH  /team-members/{id}
DELETE /team-members/{id}

# Timesheets ⭐ NEW
GET    /timesheets?staff_id={id}&date_from={}&date_to={}
POST   /timesheets/clock-in
POST   /timesheets/clock-out
PATCH  /timesheets/{id}/approve
PATCH  /timesheets/{id}/dispute

# Pay Runs ⭐ NEW
GET    /pay-runs?store_id={id}
POST   /pay-runs
GET    /pay-runs/{id}/calculate
PATCH  /pay-runs/{id}/approve
POST   /pay-runs/{id}/process

# Turn Logs
GET    /turn-logs?staff_id={id}&date={}
POST   /turn-logs
PATCH  /turn-logs/{id}/void
```

---

## 11. Business Rules

### 11.1 Team Member Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-001 | Email must be unique per tenant | Database constraint prevents duplicate emails |
| TEAM-BR-002 | Cannot delete only owner | At least one owner must remain active |
| TEAM-BR-003 | Archived members cannot receive bookings | Query filter excludes archived status |
| TEAM-BR-004 | Contractors cannot access payroll details | Permission check on contractor role |
| TEAM-BR-005 | Staff must have at least one service to be bookable | Validation on online booking toggle |
| TEAM-BR-006 | Display name defaults to "First Last" if not set | Concatenate first_name + last_name |
| TEAM-BR-007 | Terminated staff data retained for reports | Soft delete with terminated status |

### 11.2 Timesheet Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-008 | Cannot clock in before scheduled shift minus grace | Grace period default: 30 minutes |
| TEAM-BR-009 | Unpaid break duration deducted from total hours | total_hours = clock_out - clock_in - unpaid_breaks |
| TEAM-BR-010 | Overtime calculated after threshold | If daily > 8 or weekly > 40, apply OT rate |
| TEAM-BR-011 | Manager approval required for timesheet edits | Any modification after submission requires approval |
| TEAM-BR-012 | Cannot clock in to multiple locations simultaneously | Check active clock-in before allowing new one |
| TEAM-BR-013 | Late arrival threshold default: 5 minutes | late_arrival = actual_clock_in > scheduled_start + 5min |
| TEAM-BR-014 | Early departure threshold default: 15 minutes | early_departure = actual_clock_out < scheduled_end - 15min |
| TEAM-BR-015 | Forgot clock-out auto-closes at midnight | If no clock_out by 11:59 PM, set to scheduled_end |

### 11.3 Payroll Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-016 | Pay run cannot be processed without approval | Status must be 'approved' to process |
| TEAM-BR-017 | Commissions calculated from approved checkouts only | Filter: checkout.status = 'completed' |
| TEAM-BR-018 | Guaranteed minimum applied per pay period | If calculated_pay < minimum, pay = minimum |
| TEAM-BR-019 | Tiered commission on period total | Calculate total first, then apply tiered rates |
| TEAM-BR-020 | Previous pay runs must be processed first | Check no pending/approved runs for earlier periods |
| TEAM-BR-021 | Fee pass-through is optional per staff | If enabled, deduct processing_fee from staff pay |
| TEAM-BR-022 | Tips follow configured handling policy | Options: keep_all, pool, percentage_to_house |
| TEAM-BR-023 | Cash advances deducted from pay run | advance_balance reduced per pay period |

### 11.4 Turn Tracking Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-024 | Only clocked-in staff appear in turn tracker | Filter: staff.is_clocked_in = true |
| TEAM-BR-025 | Turn adjustments require reason | Validation: reason field required for adjust type |
| TEAM-BR-026 | Void entries reverse original turn count | new_turn_count = turn_count - voided_turn.value |
| TEAM-BR-027 | Turns reset at configured time daily | Default: business open time; option: midnight |
| TEAM-BR-028 | Queue position by turn count, then clock-in time | Primary sort: turns ASC; Secondary: clock_in ASC |
| TEAM-BR-029 | Bonus turns for high-value services | If service_amount >= bonus_threshold, add bonus_turn |
| TEAM-BR-030 | Tardy penalty optional | If enabled and late > grace, deduct tardy_penalty turns |

### 11.5 Commission Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-031 | Service-specific override takes precedence | Check service_override first, then base_rate |
| TEAM-BR-032 | Tiered rates apply to period total | Progressive: apply each tier rate to its bracket |
| TEAM-BR-033 | Bonuses applied after base commission | Order: base_commission → add bonuses |
| TEAM-BR-034 | Supply deduction calculated before commission | Order: revenue - supply_cost → apply commission % |
| TEAM-BR-035 | Product commission separate from service commission | Different rates: product_commission vs service_commission |
| TEAM-BR-036 | Gift card commission on sale, not redemption | Commission earned when gift card sold |

### 11.6 Schedule Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-037 | Schedule overrides take precedence | Check override first, then rotating pattern |
| TEAM-BR-038 | Rotating patterns repeat after N weeks | Week = (current_week % pattern_length) + 1 |
| TEAM-BR-039 | Time-off approved overrides scheduled availability | Staff unavailable for booking during approved time-off |
| TEAM-BR-040 | Multiple shifts per day allowed | Support split shifts (e.g., 9-12, 2-6) |
| TEAM-BR-041 | Buffer time between appointments | Add buffer_minutes before/after each service |

### 11.7 Permission Rules

| ID | Rule | Logic |
|----|------|-------|
| TEAM-BR-042 | Role permissions are defaults | Can override per staff member |
| TEAM-BR-043 | PIN required for sensitive actions | Configurable: refunds, voids, discounts > X% |
| TEAM-BR-044 | Owner permission cannot be revoked | At least one user must have full access |
| TEAM-BR-045 | Staff can only view own earnings | Unless has canAccessPayroll permission |

---

## 12. Success Metrics

### 12.1 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Turn dispute reduction | 100% | Support tickets |
| Payroll processing time | < 30 min | Time tracking |
| Timesheet accuracy | > 99% | Audit comparison |
| Staff booking rate increase | +25% | Analytics |
| Staff retention improvement | +15% | HR data |

### 12.2 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Team member setup time | < 10 min | Analytics |
| Pay run completion time | < 15 min | Analytics |
| Staff self-service adoption | > 80% | Usage analytics |
| Manager satisfaction score | > 4.5/5 | Survey |
| Staff earnings visibility | Real-time | Feature check |

### 12.3 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Offline operation success | 100% | Error logs |
| Sync conflict rate | < 0.1% | Sync logs |
| Page load time | < 2 sec | Performance monitoring |
| API response time | < 500ms | APM |
| Data accuracy (commission calc) | 100% | Audit |

---

## 13. Risks & Mitigations

### 13.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Timesheet sync conflicts between devices | Medium | High | Implement vector clock conflict resolution; last-write-wins with audit trail |
| Pay run calculation errors | Low | Critical | Extensive unit tests for all commission scenarios; manager review step required |
| Offline payroll processing not supported | High | Medium | Clearly communicate payroll requires online; queue for sync if offline |
| Clock-in GPS spoofing | Low | Medium | Optional photo verification; IP address logging; anomaly detection |
| Large team data affects performance | Medium | Medium | Pagination, lazy loading; limit staff list to 100 per page |

### 13.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Payroll compliance issues (labor laws) | Medium | Critical | Consult labor law experts; provide configurable OT rules by state |
| Commission disputes from staff | Medium | High | Transparent calculation breakdowns; audit logs; dispute resolution workflow |
| Incorrect turn tracking causes staff conflict | Low | High | Clear rules displayed; manual adjustment with reason required |
| Privacy concerns with GPS/photo tracking | Medium | Medium | Make tracking optional; clear consent; data retention policy |
| Competitor has better payroll features | High | Medium | Focus on salon-specific features (turn tracking, commission tiers) |

### 13.3 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Complex payroll UI overwhelms small salons | Medium | Medium | Provide simplified "quick pay run" mode for basic needs |
| Staff forget to clock in/out | High | Medium | Reminder notifications; auto-clock-out at shift end |
| Timesheet dashboard too dense on mobile | Medium | Medium | Responsive design; separate mobile-optimized views |
| Too many permission options confuse managers | Medium | Low | Use role-based defaults; hide advanced options behind toggle |

### 13.4 Mitigation Priority

| Priority | Risk | Action | Owner |
|----------|------|--------|-------|
| 1 | Pay run calculation errors | Build comprehensive test suite with edge cases | Dev |
| 2 | Commission disputes | Design transparent earnings breakdown UI | PM + Dev |
| 3 | Payroll compliance | Research labor laws; make OT configurable by state | PM |
| 4 | Staff forget clock in/out | Implement reminder notifications | Dev |
| 5 | Sync conflicts | Design conflict resolution strategy | Dev |

---

## 14. Implementation Phases

### Phase 1: Foundation (Current + Enhancements)
**Timeline: Implemented**

| Feature | Status |
|---------|--------|
| Team member profiles | ✅ Complete |
| 14 staff roles | ✅ Complete |
| Service assignments | ✅ Complete |
| Schedule management | ✅ Complete |
| Rotating schedules | ✅ Complete |
| Turn tracking | ✅ Complete |
| Basic permissions | ✅ Complete |
| Commission configuration | ✅ Complete |
| Online booking settings | ✅ Complete |
| Offline-first sync | ✅ Complete |

### Phase 2: Time & Attendance
**Status: Backend Complete (January 2026)**

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Clock in/out system | ✅ Complete | Pending | `timesheetsTable.ts` |
| Break tracking | ✅ Complete | Pending | Paid/unpaid breaks |
| Timesheet dashboard | ✅ Complete | Pending | dataService ready |
| Overtime calculation | ✅ Complete | Pending | In adapter |
| Attendance alerts | Pending | Pending | Needs notification system |
| Manager approval workflow | ✅ Complete | Pending | approve/dispute methods |
| Timesheet reports | ✅ Complete | Pending | Query methods ready |

### Phase 3: Payroll & Pay Runs
**Status: Backend Complete (January 2026)**

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Pay run creation | ✅ Complete | Pending | `payRunsTable.ts` |
| Automatic calculations | ✅ Complete | Pending | Staff payments array |
| Manual adjustments | ✅ Complete | Pending | Update methods |
| Review & approval workflow | ✅ Complete | Pending | submit/approve/reject |
| Turn tracking | ✅ Complete | Pending | `turnLogsTable.ts` |
| Time off requests | ✅ Complete | Pending | `timeOffRequestsTable.ts` |
| Payment processing integration | Pending | Pending | External integration |
| Payroll reports | ✅ Complete | Pending | Query methods ready |
| Staff earnings portal | ✅ Complete | Pending | dataService ready |

### Phase 4: Staff Experience
**Status: Ratings Backend Complete (January 2026)**

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Staff ratings & reviews | ✅ Complete | Pending | `staffRatingsTable.ts` |
| Rating moderation | ✅ Complete | Pending | approve/flag/hide methods |
| Staff response to reviews | ✅ Complete | Pending | addResponse method |
| Rating aggregates | ✅ Complete | Pending | getAggregates method |
| Portfolio gallery | Pending | Pending | Future enhancement |
| Performance dashboard | Pending | Pending | Future enhancement |
| Goal tracking | Pending | Pending | Future enhancement |
| Achievements/badges | Pending | Pending | Future enhancement |
| Group booking | Pending | Pending | Future enhancement |
| Staff mobile app | Pending | Pending | Future enhancement |

### Phase 5: Advanced Features
**Priority: Lower**

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Multi-location staff | Large | Core system |
| AI schedule optimization | Large | Schedule data |
| Skills matrix | Medium | Services |
| Training tracking | Medium | Profile |
| HR integrations (Gusto, ADP) | Large | Payroll |
| Calendar integrations | Medium | Schedule |

---

## Appendix A: Competitive Positioning

| Feature | Mango POS | Fresha | Advantage |
|---------|-----------|--------|-----------|
| Turn Tracking | ✅ Comprehensive | ❌ None | **Mango** |
| Offline Mode | ✅ Full | ❌ None | **Mango** |
| Rotating Schedules | ✅ 1-4 weeks | ❓ Unknown | **Mango** |
| Real-time Timesheets | ✅ Backend Complete | ✅ Full | Parity |
| Pay Run Processing | ✅ Backend Complete | ✅ Team Pay | Parity |
| Staff Ratings | ✅ Backend Complete | ✅ Yes | Parity |
| Marketplace | ❌ None | ✅ Yes | Fresha |
| Role Specialization | ✅ 14 roles | ⚠️ Generic | **Mango** |
| Granular Permissions | ✅ 15+ flags | ⚠️ Levels | **Mango** |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Turn** | Unit of work distribution, typically one service transaction |
| **Pay Run** | Batch payment processing for a pay period |
| **Timesheet** | Record of actual hours worked vs scheduled |
| **Vector Clock** | Distributed versioning for conflict detection |
| **Tombstone** | Soft-delete marker for sync purposes |
| **Tiered Commission** | Progressive rates based on revenue thresholds |
| **Guaranteed Minimum** | Minimum payment regardless of commission earned |

---

## Appendix C: File References

| Component | Current File | Phase |
|-----------|--------------|-------|
| Types | `src/components/team-settings/types.ts` | P1 |
| Team Slice | `src/store/slices/teamSlice.ts` | P1 |
| UI Staff Slice | `src/store/slices/uiStaffSlice.ts` | P1 |
| Team Settings UI | `src/components/team-settings/TeamSettings.tsx` | P1 |
| Turn Tracker | `src/components/TurnTracker/TurnTracker.tsx` | P1 |
| Timesheet Slice | `src/store/slices/timesheetSlice.ts` | P2 ⭐ |
| Payroll Slice | `src/store/slices/payrollSlice.ts` | P3 ⭐ |
| Pay Run UI | `src/components/payroll/PayRun.tsx` | P3 ⭐ |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2024 | Initial Team Module PRD |
| 2.0 | Dec 2, 2024 | Enhanced with Fresha best practices |
| 3.0 | Dec 28, 2025 | Added: Requirement IDs (TEAM-P0/P1/P2/P3-XXX), 47 requirements with acceptance criteria, 20 use cases, 45 business rules (TEAM-BR-XXX), Risks & Mitigations section, standardized 14-section format |

---

*PRD Version 3.0 - Complete with acceptance criteria and standardized format.*
*Prepared for Mango POS Team Module development.*
