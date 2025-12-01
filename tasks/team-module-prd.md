# Team Module - Product Requirements Document (PRD)

**Document Version:** 1.0
**Last Updated:** December 2024
**Author:** Product Team
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Objectives](#2-goals--objectives)
3. [User Personas](#3-user-personas)
4. [Feature Requirements](#4-feature-requirements)
5. [Data Models](#5-data-models)
6. [User Stories](#6-user-stories)
7. [UI/UX Requirements](#7-uiux-requirements)
8. [Technical Requirements](#8-technical-requirements)
9. [Integration Points](#9-integration-points)
10. [Success Metrics](#10-success-metrics)
11. [Timeline & Phases](#11-timeline--phases)
12. [Open Questions](#12-open-questions)

---

## 1. Executive Summary

### 1.1 Overview

The Team Module is a comprehensive staff management system for Mango POS, designed specifically for salon and spa businesses. It enables business owners and managers to manage their entire workforce including profiles, schedules, permissions, commissions, payroll, and online booking settings.

### 1.2 Problem Statement

Salon and spa businesses need a centralized system to:
- Manage team member information and access levels
- Track working hours and generate accurate timesheets
- Calculate commissions and process payroll
- Control who appears for online booking
- Maintain compliance with HR requirements

### 1.3 Solution

A unified Team Module that provides:
- Complete staff profile management with HR compliance fields
- Flexible permission system with 5 access tiers
- Advanced scheduling with rotating patterns and time-off management
- Commission structures (fixed, tiered, per-service)
- Integrated timesheet tracking with clock in/out
- Pay run management for streamlined payroll
- Online booking configuration per team member

### 1.4 Scope

**In Scope:**
- Team member CRUD operations
- Permission management
- Schedule/shift management
- Commission configuration
- Timesheet tracking
- Pay run preparation
- Online booking settings
- Notifications preferences

**Out of Scope (v1):**
- Actual payment processing (wallet transfers)
- Tax calculation and filing
- Background check integration
- Multi-tenant/franchise management
- Advanced HR features (performance reviews, training tracking)

---

## 2. Goals & Objectives

### 2.1 Business Goals

| Goal | Description | Success Metric |
|------|-------------|----------------|
| **Reduce Admin Time** | Automate timesheet and commission calculations | 50% reduction in payroll prep time |
| **Improve Accuracy** | Eliminate manual calculation errors | <1% payroll discrepancy rate |
| **Increase Booking** | Showcase team talent online | 20% increase in online bookings |
| **Ensure Compliance** | Maintain required HR records | 100% compliance with labor laws |

### 2.2 User Goals

| User | Goal |
|------|------|
| **Business Owner** | Full visibility into team performance and labor costs |
| **Manager** | Efficiently schedule staff and manage day-to-day operations |
| **Staff Member** | Easy access to schedule, earnings, and profile |
| **Client** | Find and book with their preferred service provider |

### 2.3 Product Objectives

1. **Offline-First**: All features work without internet connectivity
2. **Real-Time Sync**: Changes sync automatically when online
3. **Mobile-Friendly**: Full functionality on tablets and phones
4. **Intuitive UX**: Minimal training required for staff adoption
5. **Scalable**: Support businesses from 1 to 100+ team members

---

## 3. User Personas

### 3.1 Sarah - Salon Owner

**Demographics:** Female, 42, owns a 12-person salon
**Tech Comfort:** Moderate
**Goals:**
- Control labor costs while keeping staff happy
- Ensure fair commission distribution
- Maintain professional online presence

**Pain Points:**
- Spends 4+ hours weekly on payroll calculations
- Struggles to track who worked overtime
- Difficulty managing multiple permission levels

**Needs:**
- Automated commission calculations
- Clear timesheet reports
- Simple permission presets

---

### 3.2 Mike - Salon Manager

**Demographics:** Male, 35, manages daily operations
**Tech Comfort:** High
**Goals:**
- Create efficient schedules that maximize coverage
- Handle staff requests quickly
- Keep the team informed of changes

**Pain Points:**
- Frequent scheduling conflicts
- Last-minute time-off requests
- Staff not knowing their schedules

**Needs:**
- Visual schedule builder
- Time-off request workflow
- Push notifications for changes

---

### 3.3 Jessica - Senior Stylist

**Demographics:** Female, 28, works full-time
**Tech Comfort:** High
**Goals:**
- Maximize her earnings through commissions
- Have a flexible schedule
- Build her client base through online booking

**Pain Points:**
- Unclear commission calculations
- Can't easily see her earnings
- Limited control over her online profile

**Needs:**
- Transparent earnings breakdown
- Self-service schedule viewing
- Rich online profile with portfolio

---

### 3.4 Tom - Part-Time Barber

**Demographics:** Male, 24, works evenings and weekends
**Tech Comfort:** High
**Goals:**
- Clock in/out easily on mobile
- Know his schedule in advance
- Get paid accurately for hours worked

**Pain Points:**
- Forgets to clock in sometimes
- Schedule changes without notice
- Unclear overtime rules

**Needs:**
- Simple mobile clock in/out
- Schedule notifications
- Clear overtime tracking

---

## 4. Feature Requirements

### 4.1 Priority Definitions

| Priority | Definition | Timeline |
|----------|------------|----------|
| **P0** | Must Have - Required for MVP launch | Phase 1 |
| **P1** | Should Have - Important but not blocking | Phase 2 |
| **P2** | Nice to Have - Future enhancement | Phase 3+ |

---

### 4.2 P0 Features (MVP)

#### 4.2.1 Team Member Profile Management

| Feature | Description |
|---------|-------------|
| **Create Team Member** | Add new team member with basic info (name, email, phone) |
| **Edit Profile** | Update all profile fields including photo |
| **Profile Photo** | Upload and crop profile image |
| **Job Title/Position** | Assign role title (e.g., "Senior Stylist") |
| **Bio** | Rich text bio for online display |
| **Active/Inactive Status** | Toggle member availability |
| **Archive Member** | Soft delete while preserving history |
| **Delete Member** | Permanent removal (with confirmation) |

**Profile Fields (P0):**
- First Name (required)
- Last Name (required)
- Display Name
- Email (required, unique)
- Phone
- Profile Photo
- Job Title
- Bio
- Hire Date
- Is Active

---

#### 4.2.2 Permission System

| Level | Name | Description |
|-------|------|-------------|
| 0 | **No Access** | Profile only, cannot log in |
| 1 | **Basic** | View-only access to calendar and clients |
| 2 | **Standard** | Book appointments, view clients, process checkout |
| 3 | **Advanced** | Above + apply discounts, view reports |
| 4 | **Manager** | Above + manage team, edit settings |
| 5 | **Owner** | Full access to everything |

**Customizable Permission Toggles:**
- Can view calendar
- Can book appointments
- Can view clients
- Can view client contact info
- Can create/edit clients
- Can process checkout
- Can apply discounts
- Can process refunds
- Can view reports
- Can manage team
- Can access settings
- Can access business details

---

#### 4.2.3 Services Assignment

| Feature | Description |
|---------|-------------|
| **Assign Services** | Select which services member can perform |
| **Assign All** | Quick action to enable all services |
| **Custom Price** | Override default service price for this member |
| **Custom Duration** | Override default service duration |
| **View by Category** | Group services by category for easier management |

---

#### 4.2.4 Schedule Management

| Feature | Description |
|---------|-------------|
| **Weekly Schedule** | Set working days and hours |
| **Multiple Shifts** | Support multiple shifts per day (e.g., split shift) |
| **Day Off Toggle** | Quick toggle for non-working days |
| **Copy Schedule** | Copy one day's schedule to other days |
| **Default Hours** | Set default business hours as template |
| **Time Off Request** | Submit and manage time-off requests |
| **Time Off Types** | Vacation, Sick, Personal, Unpaid, Other |
| **Schedule Override** | One-time changes to regular schedule |

---

#### 4.2.5 Commission Configuration

| Feature | Description |
|---------|-------------|
| **Commission Type** | None, Percentage, Tiered, Flat |
| **Base Percentage** | Default commission rate (0-100%) |
| **Tiered Commission** | Multiple tiers based on revenue thresholds |
| **Product Commission** | Separate rate for product sales |
| **Tip Handling** | Keep all, Pool, Percentage to house |
| **Per-Service Override** | Custom commission rate per service |

---

#### 4.2.6 Online Booking Settings

| Feature | Description |
|---------|-------------|
| **Bookable Toggle** | Enable/disable for online booking |
| **Show on Website** | Display on booking website |
| **Show on App** | Display on mobile app |
| **Accept New Clients** | Allow first-time clients to book |
| **Auto-Accept** | Automatically confirm bookings |
| **Max Advance Days** | How far ahead clients can book |
| **Min Notice Hours** | Minimum advance notice required |
| **Buffer Time** | Minutes between appointments |
| **Require Deposit** | Require payment to secure booking |
| **Deposit Amount** | Fixed deposit amount |

---

#### 4.2.7 Basic Notification Preferences

| Channel | Notifications |
|---------|--------------|
| **Email** | New bookings, changes, cancellations |
| **SMS** | Urgent alerts, day-of reminders |
| **Push** | All appointment notifications |

---

### 4.3 P1 Features (Phase 2)

#### 4.3.1 Timesheet & Clock In/Out

| Feature | Description |
|---------|-------------|
| **Clock In** | Record shift start time |
| **Clock Out** | Record shift end time |
| **Break Tracking** | Track break start/end times |
| **Auto-Clock** | Automatic clock based on schedule |
| **Location Verification** | Optional GPS check for clock in |
| **Timesheet View** | View and edit timesheet entries |
| **Timesheet Approval** | Manager approval workflow |
| **Overtime Calculation** | Automatic overtime detection |

---

#### 4.3.2 Pay Run Management

| Feature | Description |
|---------|-------------|
| **Pay Period Setup** | Configure pay frequency (weekly, bi-weekly, monthly) |
| **Generate Pay Run** | Create pay run from timesheets |
| **Review Earnings** | View wages, commissions, tips per member |
| **Add Adjustments** | Add bonuses, deductions, corrections |
| **Approve Pay Run** | Manager approval before processing |
| **Pay Run History** | View past pay runs |
| **Export to Payroll** | Export data for external payroll systems |

---

#### 4.3.3 Advanced Scheduling

| Feature | Description |
|---------|-------------|
| **Rotating Patterns** | 2-week, 3-week, 4-week rotations |
| **Blocked Time** | Block time for breaks, meetings, admin |
| **Paid/Unpaid Blocks** | Categorize blocked time |
| **Schedule Templates** | Save and apply schedule templates |
| **Bulk Schedule** | Set schedules for multiple members |
| **Schedule Conflicts** | Detect and warn about conflicts |

---

#### 4.3.4 Enhanced Commission

| Feature | Description |
|---------|-------------|
| **Gift Card Commission** | Commission on gift card sales |
| **Membership Commission** | Commission on membership sales |
| **No-Show Fee Commission** | Commission on cancellation fees |
| **Deductions Before Calc** | Subtract discounts, taxes before calculating |
| **Multi-Provider Split** | Split commission for multi-provider appointments |
| **Commission Reports** | Detailed commission breakdown reports |

---

#### 4.3.5 HR Compliance Fields

| Feature | Description |
|---------|-------------|
| **Date of Birth** | For age verification |
| **SSN/Tax ID** | Secure storage for tax purposes |
| **Address** | Home address |
| **Emergency Contact** | Name, phone, relationship |
| **Employment Type** | Full-time, Part-time, Contractor |
| **Documents** | Upload certifications, licenses |

---

### 4.4 P2 Features (Future)

#### 4.4.1 Advanced Features

| Feature | Description |
|---------|-------------|
| **Multi-Location** | Assign member to multiple locations |
| **Team Invitations** | Email invitation workflow |
| **Star Ratings** | Display average client rating |
| **Portfolio Gallery** | Photo gallery for online profile |
| **Performance Goals** | Set and track revenue targets |
| **Skills Matrix** | Track certifications and skills |
| **Training Tracking** | Log training completions |

#### 4.4.2 Integrations

| Feature | Description |
|---------|-------------|
| **Payroll Integration** | Direct integration with Gusto, ADP, etc. |
| **Calendar Sync** | Sync with Google/Apple Calendar |
| **Background Check** | Integration with screening services |
| **E-Verify** | Employment eligibility verification |

---

## 5. Data Models

### 5.1 Core Entities

```typescript
// ============================================
// TEAM MEMBER - Core Entity
// ============================================

interface TeamMember {
  id: string;

  // Basic Info
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  jobTitle?: string;
  employeeId?: string;

  // Employment
  hireDate?: string;
  terminationDate?: string;
  employmentType: 'full_time' | 'part_time' | 'contractor';

  // Status
  isActive: boolean;
  isArchived: boolean;

  // Relationships
  locationIds: string[];  // Multi-location support

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// ============================================
// PERMISSION SETTINGS
// ============================================

type PermissionLevel = 'no_access' | 'basic' | 'standard' | 'advanced' | 'manager' | 'owner';

interface TeamMemberPermissions {
  id: string;
  teamMemberId: string;

  // Access Level
  level: PermissionLevel;

  // Granular Permissions
  canViewCalendar: boolean;
  canBookAppointments: boolean;
  canViewClients: boolean;
  canViewClientContact: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canProcessCheckout: boolean;
  canApplyDiscounts: boolean;
  canProcessRefunds: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canManageTeam: boolean;
  canAccessSettings: boolean;
  canAccessBusinessDetails: boolean;
  canDeleteRecords: boolean;

  // Security
  pinRequired: boolean;
  pin?: string; // Encrypted

  // Timestamps
  updatedAt: string;
}

// ============================================
// SERVICE ASSIGNMENTS
// ============================================

interface TeamMemberService {
  id: string;
  teamMemberId: string;
  serviceId: string;

  // Assignment
  canPerform: boolean;

  // Custom Pricing
  customPrice?: number;
  customDuration?: number;
  commissionOverride?: number;

  // Timestamps
  updatedAt: string;
}

// ============================================
// SCHEDULE & SHIFTS
// ============================================

interface TeamMemberSchedule {
  id: string;
  teamMemberId: string;

  // Regular Schedule
  regularHours: WorkingDay[];

  // Pattern
  repeatPattern: 'weekly' | 'bi_weekly' | 'tri_weekly' | 'monthly';
  patternStartDate: string;

  // Settings
  defaultBreakDuration: number;
  autoScheduleBreaks: boolean;

  // Timestamps
  updatedAt: string;
}

interface WorkingDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0
  isWorking: boolean;
  shifts: Shift[];
}

interface Shift {
  startTime: string; // HH:mm format
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface TimeOffRequest {
  id: string;
  teamMemberId: string;

  // Request Details
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
  reason?: string;

  // Workflow
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ScheduleOverride {
  id: string;
  teamMemberId: string;

  // Override Details
  date: string;
  type: 'day_off' | 'custom_hours' | 'extra_day';
  customShifts?: Shift[];
  reason?: string;

  // Timestamps
  createdAt: string;
  createdBy: string;
}

// ============================================
// COMMISSION SETTINGS
// ============================================

type CommissionType = 'none' | 'percentage' | 'tiered' | 'flat';
type TipHandling = 'keep_all' | 'pool' | 'percentage_to_house';

interface TeamMemberCommission {
  id: string;
  teamMemberId: string;

  // Commission Structure
  type: CommissionType;
  basePercentage: number;
  tiers?: CommissionTier[];
  flatAmount?: number;

  // Additional Commission
  productCommission: number;
  retailCommission?: number;
  giftCardCommission?: number;
  membershipCommission?: number;

  // Bonuses
  newClientBonus?: number;
  rebookBonus?: number;

  // Tip Handling
  tipHandling: TipHandling;
  tipPercentageToHouse?: number;

  // Deductions
  deductDiscounts: boolean;
  deductTaxes: boolean;
  deductCosts: boolean;

  // Timestamps
  updatedAt: string;
}

interface CommissionTier {
  minRevenue: number;
  maxRevenue?: number; // undefined = unlimited
  percentage: number;
}

// ============================================
// PAYROLL SETTINGS
// ============================================

type PayPeriod = 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly';
type CompensationType = 'none' | 'hourly' | 'salary' | 'commission_only';

interface TeamMemberPayroll {
  id: string;
  teamMemberId: string;

  // Compensation
  compensationType: CompensationType;
  hourlyRate?: number;
  salary?: number;
  guaranteedMinimum?: number;

  // Pay Period
  payPeriod: PayPeriod;

  // Overtime
  overtimeEnabled: boolean;
  overtimeThreshold: number; // hours per week
  overtimeRate: number; // multiplier (e.g., 1.5)

  // Timestamps
  updatedAt: string;
}

// ============================================
// ONLINE BOOKING SETTINGS
// ============================================

type BufferType = 'before' | 'after' | 'both';

interface TeamMemberOnlineBooking {
  id: string;
  teamMemberId: string;

  // Availability
  isBookableOnline: boolean;
  showOnWebsite: boolean;
  showOnApp: boolean;
  acceptNewClients: boolean;
  autoAcceptBookings: boolean;

  // Booking Rules
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  bufferBetweenAppointments: number;
  bufferType: BufferType;

  // Double Booking
  allowDoubleBooking: boolean;
  maxConcurrentAppointments: number;

  // Deposit
  requireDeposit: boolean;
  depositAmount?: number;

  // Profile
  displayOrder: number;
  profileBio?: string;
  specialties: string[];
  portfolioImages: string[];

  // Timestamps
  updatedAt: string;
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

interface TeamMemberNotifications {
  id: string;
  teamMemberId: string;

  // Email
  emailNewBookings: boolean;
  emailChanges: boolean;
  emailCancellations: boolean;
  emailReminders: boolean;
  emailDailySummary: boolean;
  emailWeeklySummary: boolean;

  // SMS
  smsNewBookings: boolean;
  smsChanges: boolean;
  smsCancellations: boolean;
  smsUrgentAlerts: boolean;

  // Push
  pushNewBookings: boolean;
  pushChanges: boolean;
  pushReminders: boolean;
  pushMessages: boolean;

  // Reminder Timing
  reminderHoursBefore: number;
  secondReminderHours?: number;

  // Timestamps
  updatedAt: string;
}

// ============================================
// TIMESHEET (P1)
// ============================================

interface TimesheetEntry {
  id: string;
  teamMemberId: string;

  // Timing
  date: string;
  clockInTime: string;
  clockOutTime?: string;

  // Breaks
  breaks: BreakEntry[];

  // Calculated
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;

  // Status
  status: 'active' | 'completed' | 'approved' | 'adjusted';

  // Location
  clockInLocation?: GeoLocation;
  clockOutLocation?: GeoLocation;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface BreakEntry {
  startTime: string;
  endTime?: string;
  type: 'paid' | 'unpaid';
  duration: number; // minutes
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// ============================================
// PAY RUN (P1)
// ============================================

interface PayRun {
  id: string;

  // Period
  periodStart: string;
  periodEnd: string;

  // Status
  status: 'draft' | 'pending_approval' | 'approved' | 'completed' | 'cancelled';

  // Entries
  entries: PayRunEntry[];

  // Totals
  totalWages: number;
  totalCommissions: number;
  totalTips: number;
  totalAdjustments: number;
  totalDeductions: number;
  grandTotal: number;

  // Workflow
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
}

interface PayRunEntry {
  id: string;
  payRunId: string;
  teamMemberId: string;

  // Earnings
  regularHours: number;
  overtimeHours: number;
  regularWages: number;
  overtimeWages: number;
  commissions: number;
  tips: number;

  // Adjustments
  adjustments: PayAdjustment[];

  // Totals
  grossPay: number;
  deductions: number;
  netPay: number;
}

interface PayAdjustment {
  type: 'bonus' | 'deduction' | 'reimbursement' | 'correction' | 'advance';
  description: string;
  amount: number;
  isPositive: boolean;
}
```

---

## 6. User Stories

### 6.1 Team Member Management

#### US-TM-001: Add Team Member
**As a** manager
**I want to** add a new team member
**So that** they can be scheduled and booked

**Acceptance Criteria:**
- [ ] Can enter first name, last name (required)
- [ ] Can enter email (required, validated, unique)
- [ ] Can enter phone number
- [ ] Can upload profile photo
- [ ] Can set job title
- [ ] Can set hire date
- [ ] Member is created with "Standard" permission by default
- [ ] Member is active by default
- [ ] Success message shown on save
- [ ] New member appears in team list

---

#### US-TM-002: Edit Team Member Profile
**As a** manager
**I want to** edit a team member's profile
**So that** their information stays current

**Acceptance Criteria:**
- [ ] Can edit all profile fields
- [ ] Can change profile photo
- [ ] Can update bio
- [ ] Changes are saved to IndexedDB
- [ ] Changes sync when online
- [ ] "Unsaved changes" indicator shown
- [ ] Confirmation before discarding changes

---

#### US-TM-003: Archive Team Member
**As an** owner
**I want to** archive a team member who left
**So that** they no longer appear active but history is preserved

**Acceptance Criteria:**
- [ ] Archive action requires confirmation
- [ ] Archived members hidden from active lists
- [ ] Can filter to see archived members
- [ ] Historical appointments preserved
- [ ] Historical transactions preserved
- [ ] Can restore archived member

---

### 6.2 Permissions

#### US-PM-001: Set Permission Level
**As an** owner
**I want to** set a team member's permission level
**So that** they have appropriate system access

**Acceptance Criteria:**
- [ ] Can select from 6 permission levels
- [ ] Level description shown for each option
- [ ] Changes take effect immediately
- [ ] Cannot set higher level than own level
- [ ] Audit log of permission changes

---

#### US-PM-002: Customize Permissions
**As an** owner
**I want to** customize individual permissions
**So that** access matches specific role needs

**Acceptance Criteria:**
- [ ] Can toggle each permission independently
- [ ] Permission overrides level defaults
- [ ] Visual indicator of customized permissions
- [ ] Can reset to level defaults

---

### 6.3 Scheduling

#### US-SC-001: Set Weekly Schedule
**As a** manager
**I want to** set a team member's weekly schedule
**So that** they know when to work and clients can book them

**Acceptance Criteria:**
- [ ] Can toggle each day on/off
- [ ] Can set start/end time per day
- [ ] Can add multiple shifts per day
- [ ] Can copy one day to all weekdays
- [ ] Visual weekly overview shown
- [ ] Total hours calculated

---

#### US-SC-002: Request Time Off
**As a** team member
**I want to** request time off
**So that** I can plan my absences

**Acceptance Criteria:**
- [ ] Can select date range
- [ ] Can select time-off type
- [ ] Can add reason/notes
- [ ] Request goes to pending status
- [ ] Manager notified of request
- [ ] Can cancel pending request

---

#### US-SC-003: Approve Time Off
**As a** manager
**I want to** approve or deny time-off requests
**So that** the schedule stays accurate

**Acceptance Criteria:**
- [ ] See list of pending requests
- [ ] Can approve with one click
- [ ] Can deny with required reason
- [ ] Team member notified of decision
- [ ] Approved time off blocks calendar

---

### 6.4 Commission

#### US-CM-001: Configure Commission Structure
**As an** owner
**I want to** configure a team member's commission
**So that** they are compensated correctly

**Acceptance Criteria:**
- [ ] Can select commission type
- [ ] Can set percentage rate (slider or input)
- [ ] Can configure tiered structure
- [ ] Can set product commission separately
- [ ] Can configure tip handling
- [ ] Earnings calculator shows examples

---

#### US-CM-002: Set Per-Service Commission
**As an** owner
**I want to** override commission for specific services
**So that** high-value services are incentivized

**Acceptance Criteria:**
- [ ] Can set custom rate per service
- [ ] Override clearly indicated
- [ ] Can reset to default
- [ ] Override applies to this member only

---

### 6.5 Online Booking

#### US-OB-001: Enable Online Booking
**As a** manager
**I want to** enable a team member for online booking
**So that** clients can book with them

**Acceptance Criteria:**
- [ ] Simple toggle to enable/disable
- [ ] Can set visibility (website/app)
- [ ] Can set booking rules (advance days, notice)
- [ ] Can configure buffer time
- [ ] Preview how they appear online

---

#### US-OB-002: Configure Deposit
**As an** owner
**I want to** require deposits for certain team members
**So that** no-shows are reduced

**Acceptance Criteria:**
- [ ] Can enable deposit requirement
- [ ] Can set deposit amount
- [ ] Deposit shown during booking
- [ ] Deposit rules clearly communicated

---

### 6.6 Timesheet (P1)

#### US-TS-001: Clock In
**As a** team member
**I want to** clock in when I arrive
**So that** my hours are tracked

**Acceptance Criteria:**
- [ ] Simple "Clock In" button
- [ ] Current time recorded
- [ ] Optional location verification
- [ ] Confirmation shown
- [ ] Can see current shift status

---

#### US-TS-002: Review Timesheets
**As a** manager
**I want to** review team timesheets
**So that** I can verify hours before payroll

**Acceptance Criteria:**
- [ ] See all timesheets for pay period
- [ ] Filter by team member
- [ ] See scheduled vs actual hours
- [ ] Can edit incorrect entries
- [ ] Can approve timesheets

---

### 6.7 Pay Run (P1)

#### US-PR-001: Generate Pay Run
**As an** owner
**I want to** generate a pay run
**So that** I can prepare payroll

**Acceptance Criteria:**
- [ ] Select pay period
- [ ] System calculates wages from timesheets
- [ ] System calculates commissions from sales
- [ ] System includes tips
- [ ] Can review each team member's pay
- [ ] Can add adjustments
- [ ] Summary shows totals

---

#### US-PR-002: Approve and Complete Pay Run
**As an** owner
**I want to** approve and complete the pay run
**So that** payroll is finalized

**Acceptance Criteria:**
- [ ] Review final amounts
- [ ] Approve with confirmation
- [ ] Pay run locked after completion
- [ ] Export available for payroll system
- [ ] Team members can view their pay stub

---

## 7. UI/UX Requirements

### 7.1 Navigation Structure

```
More Menu
└── Team (icon: UserCog)
    └── Team Settings Panel
        ├── Team Member List (left sidebar)
        │   ├── Search
        │   ├── Filter by Role
        │   ├── Filter by Status
        │   └── Add Member Button
        │
        └── Member Detail (main content)
            ├── Profile Header
            └── Section Tabs
                ├── Profile
                ├── Services
                ├── Schedule
                ├── Permissions
                ├── Commission
                ├── Online Booking
                └── Notifications
```

### 7.2 Screen Specifications

#### 7.2.1 Team Member List (Left Sidebar)

**Layout:** 320px fixed width on desktop, full screen on mobile

**Components:**
- Search input with clear button
- Filter pills: All | Active | Inactive
- Role dropdown filter
- Team member cards showing:
  - Avatar (48x48)
  - Name
  - Job title
  - Role badge (color-coded)
  - Active status dot
- Add Member button (fixed bottom)

**Interactions:**
- Click card to select member
- Swipe left on mobile to reveal archive action
- Long press for quick actions menu

---

#### 7.2.2 Profile Section

**Layout:** Scrollable form with sections

**Sections:**
1. **Profile Header Card**
   - Large avatar with edit overlay
   - Name display
   - Active/Inactive badge
   - Activate/Deactivate button

2. **Basic Information Card**
   - First Name (required)
   - Last Name (required)
   - Display Name
   - Job Title
   - Email (required)
   - Phone
   - Employee ID
   - Hire Date

3. **Bio Card**
   - Textarea with character count (500 max)
   - Preview toggle for formatted display

4. **Address Card** (collapsible)
   - Street, City, State, ZIP

5. **Emergency Contact Card** (collapsible)
   - Name, Phone, Relationship

6. **Danger Zone Card**
   - Archive button
   - Delete button (requires confirmation)

---

#### 7.2.3 Permissions Section

**Layout:** Card-based with toggles

**Sections:**
1. **Permission Level Card**
   - Dropdown with 6 levels
   - Description for selected level
   - Visual indicator (icon + color)

2. **Quick Access Toggles Card**
   - Grid of toggle switches
   - Grouped by category

3. **Security PIN Card**
   - Enable/disable PIN
   - Set/change PIN (masked input)
   - PIN required for: list of actions

4. **Detailed Permissions Card** (collapsible)
   - Permission categories accordion
   - Each permission: name, description, dropdown (full/limited/view/none)

---

#### 7.2.4 Schedule Section

**Layout:** Tab-based view

**Tabs:**
1. **Regular Hours**
   - Day rows with toggle + time inputs
   - Add shift button per day
   - Copy to weekdays action
   - Auto-break toggle

2. **Time Off**
   - List of requests with status badges
   - Add Time Off button
   - Request form modal

3. **Overrides**
   - Calendar view of overrides
   - Add Override button
   - Override form modal

**Footer:**
- Weekly hours summary
- Visual weekly mini-calendar

---

#### 7.2.5 Commission Section

**Layout:** Tab-based (Commission | Payroll)

**Commission Tab:**
1. **Stats Row**
   - Commission rate
   - Tips kept percentage
   - Base pay

2. **Commission Type Card**
   - 4 type buttons (visual selection)
   - Percentage slider (when applicable)
   - Tiered builder (when applicable)

3. **Additional Commission Card**
   - Product, Retail, Gift Card fields
   - Bonuses: New client, Rebook

4. **Tip Handling Card**
   - 3 type buttons
   - Percentage input (when applicable)

5. **Earnings Calculator Card**
   - Example calculations at 3 revenue levels

**Payroll Tab:**
1. **Pay Period Card**
   - 4 period buttons

2. **Base Pay Card**
   - Salary or Hourly inputs
   - Guaranteed minimum

3. **Overtime Card**
   - Rate multiplier
   - Threshold hours

---

#### 7.2.6 Online Booking Section

**Layout:** Scrollable form

**Sections:**
1. **Status Header Card**
   - Large toggle for Online Booking
   - Status indicator (Accepting / Not Available)

2. **Visibility Card**
   - Show on Website toggle
   - Show on App toggle
   - Accept New Clients toggle
   - Auto-Accept toggle

3. **Booking Rules Card**
   - Max advance days input
   - Min notice hours input
   - Buffer minutes input
   - Buffer position dropdown
   - Double booking toggle

4. **Deposit Card**
   - Require deposit toggle
   - Deposit amount input

5. **Online Profile Card**
   - Display order input
   - Profile bio textarea
   - Specialties tags (add/remove)
   - Portfolio images (grid with upload)

6. **Preview Card**
   - Live preview of online appearance

---

#### 7.2.7 Notifications Section

**Layout:** Grouped toggle lists

**Sections:**
1. **Stats Row**
   - Email count, SMS count, Push count

2. **Email Notifications Card**
   - Toggle list grouped by category
   - Appointments, Reports, Other

3. **SMS Notifications Card**
   - Toggle list
   - Cost warning banner

4. **Push Notifications Card**
   - Toggle list

5. **Reminder Timing Card**
   - First reminder hours input
   - Second reminder hours input (optional)
   - Visual timeline

6. **Quick Actions Footer**
   - Enable All, Disable All, Essential Only

---

### 7.3 Mobile Considerations

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Team list becomes full-screen view
- Back button to return to list from detail
- Bottom sheet for quick actions
- Swipe gestures for navigation
- Floating action button for Add Member

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Adequate spacing between toggles
- Large clock in/out button for timesheet

---

### 7.4 Design Tokens

```typescript
const teamModuleTokens = {
  colors: {
    primary: '#00BCD4',      // Cyan
    primaryLight: '#E0F7FA',
    primaryDark: '#0097A7',

    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',

    // Permission level colors
    noAccess: { bg: '#F5F5F5', text: '#9E9E9E' },
    basic: { bg: '#E3F2FD', text: '#1976D2' },
    standard: { bg: '#E8F5E9', text: '#388E3C' },
    advanced: { bg: '#FFF3E0', text: '#EF6C00' },
    manager: { bg: '#F3E5F5', text: '#7B1FA2' },
    owner: { bg: '#FFEBEE', text: '#C62828' },
  },

  spacing: {
    sectionGap: '24px',
    cardPadding: '20px',
    inputGap: '16px',
  },

  typography: {
    sectionTitle: 'text-lg font-semibold',
    sectionSubtitle: 'text-sm text-gray-500',
    label: 'text-sm font-medium text-gray-700',
    input: 'text-base',
  },
};
```

---

## 8. Technical Requirements

### 8.1 Redux Store Structure

```typescript
// store/slices/teamSlice.ts

interface TeamState {
  // Data
  members: Record<string, TeamMember>;
  permissions: Record<string, TeamMemberPermissions>;
  services: Record<string, TeamMemberService[]>;
  schedules: Record<string, TeamMemberSchedule>;
  timeOffRequests: Record<string, TimeOffRequest[]>;
  scheduleOverrides: Record<string, ScheduleOverride[]>;
  commissions: Record<string, TeamMemberCommission>;
  payroll: Record<string, TeamMemberPayroll>;
  onlineBooking: Record<string, TeamMemberOnlineBooking>;
  notifications: Record<string, TeamMemberNotifications>;

  // P1: Timesheet & Pay Run
  timesheets: Record<string, TimesheetEntry[]>;
  payRuns: Record<string, PayRun>;

  // UI State
  ui: {
    selectedMemberId: string | null;
    activeSection: TeamSettingsSection;
    searchQuery: string;
    filterRole: string | null;
    filterStatus: 'all' | 'active' | 'inactive' | 'archived';
    sortBy: 'name' | 'role' | 'hireDate';
    sortOrder: 'asc' | 'desc';
    hasUnsavedChanges: boolean;
    isLoading: boolean;
    error: string | null;
  };

  // Sync State
  sync: {
    lastSyncAt: string | null;
    pendingChanges: number;
    syncStatus: 'idle' | 'syncing' | 'error';
  };
}

// Actions
const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    // Member CRUD
    addMember: (state, action: PayloadAction<TeamMember>) => {},
    updateMember: (state, action: PayloadAction<Partial<TeamMember> & { id: string }>) => {},
    archiveMember: (state, action: PayloadAction<string>) => {},
    deleteMember: (state, action: PayloadAction<string>) => {},

    // Permissions
    updatePermissions: (state, action: PayloadAction<TeamMemberPermissions>) => {},

    // Services
    updateServices: (state, action: PayloadAction<{ memberId: string; services: TeamMemberService[] }>) => {},

    // Schedule
    updateSchedule: (state, action: PayloadAction<TeamMemberSchedule>) => {},
    addTimeOffRequest: (state, action: PayloadAction<TimeOffRequest>) => {},
    updateTimeOffRequest: (state, action: PayloadAction<TimeOffRequest>) => {},
    addScheduleOverride: (state, action: PayloadAction<ScheduleOverride>) => {},

    // Commission
    updateCommission: (state, action: PayloadAction<TeamMemberCommission>) => {},

    // Payroll
    updatePayroll: (state, action: PayloadAction<TeamMemberPayroll>) => {},

    // Online Booking
    updateOnlineBooking: (state, action: PayloadAction<TeamMemberOnlineBooking>) => {},

    // Notifications
    updateNotifications: (state, action: PayloadAction<TeamMemberNotifications>) => {},

    // Timesheet (P1)
    clockIn: (state, action: PayloadAction<{ memberId: string; location?: GeoLocation }>) => {},
    clockOut: (state, action: PayloadAction<{ memberId: string; location?: GeoLocation }>) => {},
    startBreak: (state, action: PayloadAction<{ memberId: string; type: 'paid' | 'unpaid' }>) => {},
    endBreak: (state, action: PayloadAction<string>) => {},
    updateTimesheet: (state, action: PayloadAction<TimesheetEntry>) => {},

    // Pay Run (P1)
    createPayRun: (state, action: PayloadAction<{ periodStart: string; periodEnd: string }>) => {},
    updatePayRunEntry: (state, action: PayloadAction<PayRunEntry>) => {},
    addPayAdjustment: (state, action: PayloadAction<{ payRunId: string; memberId: string; adjustment: PayAdjustment }>) => {},
    approvePayRun: (state, action: PayloadAction<string>) => {},
    completePayRun: (state, action: PayloadAction<string>) => {},

    // UI
    setSelectedMember: (state, action: PayloadAction<string | null>) => {},
    setActiveSection: (state, action: PayloadAction<TeamSettingsSection>) => {},
    setSearchQuery: (state, action: PayloadAction<string>) => {},
    setFilters: (state, action: PayloadAction<Partial<TeamState['ui']>>) => {},
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {},
  },
});
```

### 8.2 IndexedDB Schema

```typescript
// db/schema.ts

const teamSchema = {
  teamMembers: {
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'isActive', keyPath: 'isActive' },
      { name: 'isArchived', keyPath: 'isArchived' },
      { name: 'updatedAt', keyPath: 'updatedAt' },
    ],
  },

  teamMemberPermissions: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId', unique: true },
    ],
  },

  teamMemberServices: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId' },
      { name: 'serviceId', keyPath: 'serviceId' },
      { name: 'compound', keyPath: ['teamMemberId', 'serviceId'], unique: true },
    ],
  },

  teamMemberSchedules: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId', unique: true },
    ],
  },

  timeOffRequests: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId' },
      { name: 'status', keyPath: 'status' },
      { name: 'startDate', keyPath: 'startDate' },
    ],
  },

  scheduleOverrides: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId' },
      { name: 'date', keyPath: 'date' },
    ],
  },

  teamMemberCommissions: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId', unique: true },
    ],
  },

  teamMemberPayroll: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId', unique: true },
    ],
  },

  teamMemberOnlineBooking: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId', unique: true },
      { name: 'isBookableOnline', keyPath: 'isBookableOnline' },
    ],
  },

  teamMemberNotifications: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId', unique: true },
    ],
  },

  // P1 Tables
  timesheetEntries: {
    keyPath: 'id',
    indexes: [
      { name: 'teamMemberId', keyPath: 'teamMemberId' },
      { name: 'date', keyPath: 'date' },
      { name: 'status', keyPath: 'status' },
      { name: 'compound', keyPath: ['teamMemberId', 'date'] },
    ],
  },

  payRuns: {
    keyPath: 'id',
    indexes: [
      { name: 'periodStart', keyPath: 'periodStart' },
      { name: 'status', keyPath: 'status' },
    ],
  },

  payRunEntries: {
    keyPath: 'id',
    indexes: [
      { name: 'payRunId', keyPath: 'payRunId' },
      { name: 'teamMemberId', keyPath: 'teamMemberId' },
    ],
  },
};
```

### 8.3 Database Operations

```typescript
// db/teamOperations.ts

export const teamDb = {
  // Team Members
  async getAllMembers(): Promise<TeamMember[]> {},
  async getMemberById(id: string): Promise<TeamMember | undefined> {},
  async getMemberByEmail(email: string): Promise<TeamMember | undefined> {},
  async createMember(member: TeamMember): Promise<void> {},
  async updateMember(id: string, updates: Partial<TeamMember>): Promise<void> {},
  async archiveMember(id: string): Promise<void> {},
  async deleteMember(id: string): Promise<void> {},

  // Permissions
  async getPermissions(memberId: string): Promise<TeamMemberPermissions | undefined> {},
  async updatePermissions(permissions: TeamMemberPermissions): Promise<void> {},

  // Services
  async getMemberServices(memberId: string): Promise<TeamMemberService[]> {},
  async updateMemberServices(memberId: string, services: TeamMemberService[]): Promise<void> {},

  // Schedule
  async getSchedule(memberId: string): Promise<TeamMemberSchedule | undefined> {},
  async updateSchedule(schedule: TeamMemberSchedule): Promise<void> {},

  // Time Off
  async getTimeOffRequests(memberId: string): Promise<TimeOffRequest[]> {},
  async getPendingTimeOffRequests(): Promise<TimeOffRequest[]> {},
  async createTimeOffRequest(request: TimeOffRequest): Promise<void> {},
  async updateTimeOffRequest(request: TimeOffRequest): Promise<void> {},

  // Commission
  async getCommission(memberId: string): Promise<TeamMemberCommission | undefined> {},
  async updateCommission(commission: TeamMemberCommission): Promise<void> {},

  // Online Booking
  async getOnlineBooking(memberId: string): Promise<TeamMemberOnlineBooking | undefined> {},
  async updateOnlineBooking(settings: TeamMemberOnlineBooking): Promise<void> {},
  async getBookableMembers(): Promise<TeamMember[]> {},

  // Timesheet (P1)
  async getTimesheetEntries(memberId: string, startDate: string, endDate: string): Promise<TimesheetEntry[]> {},
  async createTimesheetEntry(entry: TimesheetEntry): Promise<void> {},
  async updateTimesheetEntry(entry: TimesheetEntry): Promise<void> {},
  async getActiveTimesheet(memberId: string): Promise<TimesheetEntry | undefined> {},

  // Pay Run (P1)
  async getPayRuns(status?: PayRunStatus): Promise<PayRun[]> {},
  async getPayRunById(id: string): Promise<PayRun | undefined> {},
  async createPayRun(payRun: PayRun): Promise<void> {},
  async updatePayRun(payRun: PayRun): Promise<void> {},
};
```

### 8.4 API Contracts (Future Backend)

```typescript
// api/teamApi.ts

// GET /api/team/members
interface GetTeamMembersResponse {
  members: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}

// POST /api/team/members
interface CreateTeamMemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
}

// PUT /api/team/members/:id
interface UpdateTeamMemberRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  jobTitle?: string;
  isActive?: boolean;
}

// PUT /api/team/members/:id/permissions
interface UpdatePermissionsRequest {
  level: PermissionLevel;
  customPermissions?: Partial<TeamMemberPermissions>;
}

// PUT /api/team/members/:id/schedule
interface UpdateScheduleRequest {
  regularHours: WorkingDay[];
  repeatPattern?: string;
  defaultBreakDuration?: number;
}

// POST /api/team/members/:id/time-off
interface CreateTimeOffRequest {
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
}

// PUT /api/team/members/:id/commission
interface UpdateCommissionRequest {
  type: CommissionType;
  basePercentage?: number;
  tiers?: CommissionTier[];
  productCommission?: number;
  tipHandling?: TipHandling;
}

// POST /api/team/timesheets/clock-in
interface ClockInRequest {
  memberId: string;
  location?: GeoLocation;
}

// POST /api/team/pay-runs
interface CreatePayRunRequest {
  periodStart: string;
  periodEnd: string;
}

// PUT /api/team/pay-runs/:id/approve
interface ApprovePayRunRequest {
  approverNotes?: string;
}
```

### 8.5 Offline-First Considerations

```typescript
// Sync Queue for Team Module

interface TeamSyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'member' | 'permissions' | 'schedule' | 'timeOff' | 'commission' | 'timesheet' | 'payRun';
  entityId: string;
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

// Conflict Resolution Strategy
const teamConflictResolution = {
  // Last-write-wins for most fields
  member: 'last_write_wins',
  permissions: 'last_write_wins',
  schedule: 'last_write_wins',
  commission: 'last_write_wins',

  // Server-wins for financial data
  timesheet: 'server_wins',
  payRun: 'server_wins',

  // Merge for time-off requests
  timeOff: 'merge_by_id',
};

// Offline Capabilities
const teamOfflineFeatures = {
  // Full offline support
  viewMembers: true,
  editProfiles: true,
  viewSchedules: true,
  editSchedules: true,
  viewCommission: true,
  editCommission: true,

  // Offline with sync required
  clockInOut: true, // Works offline, syncs later
  submitTimeOff: true, // Works offline, syncs later

  // Online only
  approvePayRun: false, // Requires server confirmation
  sendInvitations: false, // Requires email service
};
```

---

## 9. Integration Points

### 9.1 Calendar/Appointments Integration

```typescript
// How Team Module integrates with Calendar

interface CalendarTeamIntegration {
  // Get available team members for a service at a time
  getAvailableMembers(
    serviceId: string,
    dateTime: string,
    duration: number
  ): TeamMember[];

  // Check if member is working at given time
  isMemberWorking(memberId: string, dateTime: string): boolean;

  // Get member's appointments for a day
  getMemberAppointments(memberId: string, date: string): Appointment[];

  // Get member's blocked time
  getMemberBlockedTime(memberId: string, date: string): BlockedTime[];

  // Check for booking conflicts
  hasConflict(
    memberId: string,
    dateTime: string,
    duration: number
  ): boolean;
}

// Calendar displays
// - Member column/row in day/week view
// - Member avatar on appointments
// - Member schedule overlay (working hours)
// - Time-off indicators
```

### 9.2 Checkout/Tickets Integration

```typescript
// How Team Module integrates with Checkout

interface CheckoutTeamIntegration {
  // Get member performing each service
  getServiceProvider(ticketItemId: string): TeamMember;

  // Calculate commission for ticket
  calculateCommission(
    memberId: string,
    ticketItems: TicketItem[]
  ): CommissionBreakdown;

  // Record tips for member
  recordTip(memberId: string, amount: number): void;

  // Check permission for action
  canPerformAction(
    memberId: string,
    action: 'discount' | 'refund' | 'void'
  ): boolean;

  // Require PIN for sensitive action
  requirePinVerification(
    memberId: string,
    action: string
  ): Promise<boolean>;
}

// Checkout displays
// - Service provider selector per line item
// - Tip allocation by member
// - Commission preview
// - Permission-based action buttons
```

### 9.3 Reports Integration

```typescript
// How Team Module integrates with Reports

interface ReportsTeamIntegration {
  // Individual performance report
  getMemberPerformance(
    memberId: string,
    startDate: string,
    endDate: string
  ): MemberPerformanceReport;

  // Team comparison report
  getTeamComparison(
    startDate: string,
    endDate: string
  ): TeamComparisonReport;

  // Commission report
  getCommissionReport(
    startDate: string,
    endDate: string
  ): CommissionReport;

  // Hours worked report
  getHoursReport(
    startDate: string,
    endDate: string
  ): HoursWorkedReport;

  // Payroll summary
  getPayrollSummary(
    payPeriodId: string
  ): PayrollSummaryReport;
}

interface MemberPerformanceReport {
  memberId: string;
  memberName: string;
  period: { start: string; end: string };

  // Revenue
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;

  // Volume
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShows: number;

  // Clients
  totalClients: number;
  newClients: number;
  returningClients: number;
  rebookRate: number;

  // Time
  hoursWorked: number;
  hoursBooked: number;
  utilizationRate: number;

  // Earnings
  commissionEarned: number;
  tipsReceived: number;
  totalEarnings: number;
}
```

### 9.4 Client Integration

```typescript
// How Team Module integrates with Clients

interface ClientTeamIntegration {
  // Get member's client list
  getMemberClients(memberId: string): Client[];

  // Get preferred provider for client
  getPreferredProvider(clientId: string): TeamMember | null;

  // Get client history with member
  getClientMemberHistory(
    clientId: string,
    memberId: string
  ): Appointment[];

  // Get member's reviews
  getMemberReviews(memberId: string): Review[];

  // Calculate member's average rating
  getMemberRating(memberId: string): number;
}

// Client profile displays
// - Preferred provider field
// - History by provider
// - "Book again with" quick action
```

---

## 10. Success Metrics

### 10.1 Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Setup Completion** | 80% | % of businesses with all team members configured |
| **Daily Active Use** | 60% | % of team members clocking in daily |
| **Feature Adoption** | 50% | % using commission/payroll features |

### 10.2 Efficiency Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Payroll Prep Time** | 4 hours | 2 hours | Time to complete pay run |
| **Schedule Creation** | 30 min | 10 min | Time to create weekly schedule |
| **Time-Off Handling** | 2 days | Same day | Request to approval time |

### 10.3 Accuracy Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Commission Accuracy** | 99% | Manual override rate |
| **Timesheet Accuracy** | 95% | % without adjustments |
| **Schedule Conflicts** | <1% | Double-booking rate |

### 10.4 Satisfaction Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Owner NPS** | 50+ | Net Promoter Score |
| **Staff NPS** | 40+ | Net Promoter Score |
| **Support Tickets** | <5/month | Team module related tickets |

---

## 11. Timeline & Phases

### Phase 1: MVP (Core Team Management)

**Goal:** Basic team member management and assignment

**Features:**
- [ ] Team member CRUD (create, read, update, archive, delete)
- [ ] Profile management (basic fields + photo)
- [ ] Permission levels (5 tiers + basic toggles)
- [ ] Services assignment (enable/disable per member)
- [ ] Basic schedule (weekly hours, day on/off)
- [ ] Commission configuration (percentage, tiered)
- [ ] Online booking settings (basic toggle + rules)
- [ ] Redux integration
- [ ] IndexedDB persistence

**Dependencies:**
- Services module (for service assignment)
- Auth module (for permission enforcement)

**Deliverables:**
- Team Settings UI (all 7 sections)
- Redux slice with all actions
- IndexedDB schema and operations
- Integration with calendar display

---

### Phase 2: Timesheet & Payroll

**Goal:** Automated time tracking and pay run management

**Features:**
- [ ] Clock in/out functionality
- [ ] Break tracking
- [ ] Timesheet view and editing
- [ ] Overtime calculation
- [ ] Pay run generation
- [ ] Pay run adjustments
- [ ] Pay run approval workflow
- [ ] Pay stub view for team members

**Dependencies:**
- Phase 1 completion
- Checkout integration (for commission calculation)

**Deliverables:**
- Clock in/out UI (mobile-optimized)
- Timesheet management screens
- Pay run workflow screens
- Timesheet reports

---

### Phase 3: Advanced Scheduling

**Goal:** Flexible scheduling with patterns and blocks

**Features:**
- [ ] Rotating schedule patterns (2/3/4 week)
- [ ] Schedule templates
- [ ] Blocked time (paid/unpaid)
- [ ] Time-off approval workflow
- [ ] Schedule conflict detection
- [ ] Bulk scheduling
- [ ] Schedule change notifications

**Dependencies:**
- Phase 1 completion
- Notification system

**Deliverables:**
- Advanced schedule builder
- Template management
- Time-off workflow screens
- Conflict resolution UI

---

### Phase 4: Enhanced Features

**Goal:** Additional commission and profile features

**Features:**
- [ ] Gift card commission
- [ ] Membership commission
- [ ] Commission deductions (discounts, taxes)
- [ ] Multi-provider appointment split
- [ ] Staff ratings display
- [ ] Portfolio gallery
- [ ] Performance goals
- [ ] HR compliance fields

**Dependencies:**
- Phase 1-3 completion
- Gift card module
- Membership module

**Deliverables:**
- Enhanced commission calculator
- Online profile enhancements
- Performance dashboard
- HR document storage

---

### Phase 5: Multi-Location & Integrations

**Goal:** Enterprise features and external integrations

**Features:**
- [ ] Multi-location assignment
- [ ] Location-based scheduling
- [ ] Payroll system integration
- [ ] Calendar sync (Google/Apple)
- [ ] Email invitation system
- [ ] Advanced reporting

**Dependencies:**
- Phase 1-4 completion
- Location management module
- Third-party API access

**Deliverables:**
- Multi-location UI
- Integration configuration
- External sync management
- Enterprise reports

---

## 12. Open Questions

### 12.1 Business Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | Should we support multiple commission structures per member (e.g., different for services vs products)? | Commission calculation complexity | Product |
| 2 | Do we need to support split shifts with different pay rates (e.g., regular vs. event)? | Payroll calculation | Product |
| 3 | Should time-off approval be required or optional per business? | Workflow complexity | Product |
| 4 | What is the minimum permission level that can be assigned by managers (not owners)? | Security model | Product |

### 12.2 Technical Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | How do we handle clock-in when offline with location verification enabled? | Offline experience | Engineering |
| 2 | Should pay runs be editable after completion for corrections? | Data integrity | Engineering |
| 3 | How long should we retain archived team member data? | Storage/compliance | Engineering |
| 4 | Do we need real-time sync for schedule changes or is polling sufficient? | Infrastructure | Engineering |

### 12.3 UX Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | Should team members be able to view their own commission calculations? | UI complexity | Design |
| 2 | How do we handle schedule changes that affect existing appointments? | User flow | Design |
| 3 | Should the permission UI show inherited vs. customized permissions differently? | Visual clarity | Design |
| 4 | What's the right balance between detail and simplicity in commission configuration? | Usability | Design |

---

## Appendix A: Competitor Analysis Summary

### Fresha Features Comparison

| Feature | Fresha | Mango (Planned) | Notes |
|---------|--------|-----------------|-------|
| Team Profiles | ✅ | ✅ P0 | Similar functionality |
| Permission Levels | 5 tiers | 6 tiers | Added "No Access" |
| Services Assignment | ✅ | ✅ P0 | Similar functionality |
| Weekly Schedule | ✅ | ✅ P0 | Similar functionality |
| Rotating Patterns | ✅ | ✅ P1 | 2-4 week rotations |
| Clock In/Out | ✅ | ✅ P1 | With location verification |
| Timesheet | ✅ | ✅ P1 | Auto-generated |
| Pay Runs | ✅ | ✅ P1 | Without wallet transfer |
| Commission | Fixed/Tiered | Fixed/Tiered/Flat | Added flat option |
| Multi-Location | ✅ | ✅ P2 | Future phase |
| Wallet Payments | ✅ | ❌ | Out of scope |

### Unique Mango Features

| Feature | Description |
|---------|-------------|
| HR Compliance Fields | Emergency contact, address, employment type |
| Detailed Notifications | Granular email/SMS/push preferences |
| Earnings Calculator | Preview commission at different revenue levels |
| Online Profile Preview | Live preview of booking appearance |
| Performance Goals | Set and track revenue/booking targets |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Team Member** | Any staff person in the system (employee, contractor, etc.) |
| **Permission Level** | Predefined access tier (No Access through Owner) |
| **Service Assignment** | Which services a team member can perform |
| **Shift** | A continuous work period within a day |
| **Time Off** | Planned absence (vacation, sick, etc.) |
| **Schedule Override** | One-time change to regular schedule |
| **Commission** | Percentage or amount earned on sales |
| **Tier** | Revenue threshold for commission calculation |
| **Timesheet** | Record of hours worked |
| **Pay Run** | Payroll calculation for a pay period |
| **Bookable** | Available for online booking |
| **Buffer Time** | Minutes between appointments |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Product Team | Initial PRD |

---

*End of Document*
