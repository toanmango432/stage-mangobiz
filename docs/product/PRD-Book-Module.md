# Book Module - Product Requirements Document (PRD)
## Mango Biz Store App - Appointment Calendar & Scheduling

**Document Owner:** Product Team
**Last Updated:** December 13, 2025
**Status:** Draft for Review
**Version:** 2.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas & Use Cases](#2-user-personas--use-cases)
3. [Feature Specifications](#3-feature-specifications)
4. [Business Rules & Configuration](#4-business-rules--configuration)
5. [User Interface Specifications](#5-user-interface-specifications)
6. [Technical Requirements](#6-technical-requirements)
7. [Integration Points](#7-integration-points)
8. [Implementation Phases](#8-implementation-phases)
9. [Success Metrics](#9-success-metrics)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

### 1.1 Overview

The **Book Module** is the appointment calendar and scheduling interface for Mango Biz Store App. It provides salon staff with comprehensive tools to manage appointments, view schedules, and coordinate client services across all staff members.

### 1.2 Key Problems Solved

| Problem | Solution |
|---------|----------|
| Double-booking conflicts | Real-time conflict detection with visual warnings |
| Inefficient staff assignment | Smart auto-assign algorithm based on skills, availability, and fairness |
| No visibility into schedule | Multiple calendar views (Day, Week, Month, Agenda) |
| Offline booking limitations | Offline-first architecture with IndexedDB storage |
| Complex group bookings | Dedicated group booking flow with linked appointments |
| Manual recurring appointments | Repeat booking templates with flexible patterns |

### 1.3 Success Criteria

- **Zero double-bookings** without explicit manager override
- **< 30 seconds** to create a new appointment
- **100% offline capability** for viewing and creating appointments
- **95%+ sync accuracy** within 30 seconds of reconnection
- **< 3 taps** to check in an appointment

### 1.4 Scope

**In Scope:**
- Appointment CRUD (Create, Read, Update, Delete)
- Calendar views (Day, Week, Month, Agenda)
- Client search and inline creation
- Staff assignment (manual and auto)
- Group/party bookings
- Repeat/recurring bookings
- Status workflow management
- Conflict detection and resolution
- Offline support with sync

**Out of Scope:**
- Online booking portal (separate module)
- Payment processing (handled by Checkout module)
- Staff scheduling/shifts (handled by Team & Schedule module)
- Notifications/SMS sending (handled by Notifications service)

---

## 2. User Personas & Use Cases

### 2.1 Primary Personas

#### Persona 1: Jessica - Front Desk Coordinator
**Role:** Primary user of Book module
**Tech Comfort:** High
**Daily Booking Volume:** 30-50 appointments

**Goals:**
- Book appointments quickly during phone calls
- Check clients in efficiently
- See staff availability at a glance
- Handle walk-ins and last-minute changes

**Pain Points:**
- Slow client search wastes time on calls
- Can't see which staff are actually available
- Group bookings are tedious to create
- No warning before creating conflicts

**Key Use Cases:**
| ID | Use Case | Frequency |
|----|----------|-----------|
| UC-1 | Create appointment via phone call | 20-30x/day |
| UC-2 | Check in arriving client | 30-50x/day |
| UC-3 | Reschedule appointment | 5-10x/day |
| UC-4 | Cancel appointment | 3-5x/day |
| UC-5 | Create group booking | 2-3x/week |

---

#### Persona 2: Sarah - Salon Owner/Manager
**Role:** Oversight and management
**Tech Comfort:** Medium
**Primary Concerns:** Revenue, staff utilization, client satisfaction

**Goals:**
- Monitor daily schedule and capacity
- Ensure fair walk-in distribution
- Track no-shows and cancellations
- Plan staffing based on booking patterns

**Pain Points:**
- No visibility into upcoming capacity
- Manual tracking of no-shows
- Can't identify scheduling bottlenecks

**Key Use Cases:**
| ID | Use Case | Frequency |
|----|----------|-----------|
| UC-6 | Review today's schedule | 5-10x/day |
| UC-7 | Check staff utilization | 2-3x/day |
| UC-8 | Override auto-assignment | 2-3x/week |
| UC-9 | View weekly capacity | 1x/week |

---

#### Persona 3: Mike - Service Provider (Technician)
**Role:** Views own schedule
**Tech Comfort:** Low-Medium
**Primary Concerns:** Knowing next client, seeing daily schedule

**Goals:**
- Know when next client arrives
- See service details and client preferences
- Understand daily workload

**Key Use Cases:**
| ID | Use Case | Frequency |
|----|----------|-----------|
| UC-10 | View personal schedule | 3-5x/day |
| UC-11 | See upcoming appointment details | Per appointment |

---

### 2.2 User Journey: Creating an Appointment

```
Phone rings → Jessica answers → Client requests appointment

1. OPEN BOOK MODULE
   └── Default: Today's Day View

2. TAP "+ NEW APPOINTMENT"
   └── Modal opens with smart defaults

3. SEARCH/SELECT CLIENT
   ├── Type name/phone (300ms debounce)
   ├── Select from results OR
   ├── Select from "Recent Clients" OR
   └── Tap "Add Walk-In Client" → Quick form

4. SELECT SERVICES
   ├── Browse by category
   ├── Add multiple services
   └── Duration auto-calculates

5. ASSIGN STAFF
   ├── Auto-assign (recommended) OR
   ├── Manual selection with availability shown
   └── "Request" toggle for preferred tech

6. SELECT DATE/TIME
   ├── Calendar date picker
   ├── Available time slots highlighted
   └── Conflict warnings if applicable

7. REVIEW & CONFIRM
   ├── Summary: Client, Services, Staff, Time, Cost
   ├── Add notes (optional)
   └── Tap "Book Appointment"

8. SUCCESS
   ├── Toast notification
   ├── Calendar updates
   └── Confirmation ready to send (if enabled)

Total Time Target: < 30 seconds
```

---

## 3. Feature Specifications

### 3.1 Appointment Creation

#### 3.1.1 Individual Appointments

**Priority:** P0 (Must Have)
**Status:** Core Feature

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-001 | Client search | Search by name or phone with 300ms debounce; results appear in < 500ms |
| REQ-002 | Recent clients | Display 5 most recently booked clients for quick selection |
| REQ-003 | Inline client creation | Create new client without leaving booking modal; minimum fields: name, phone |
| REQ-004 | Walk-in support | Quick-add client with just name (phone optional); auto-generates walk-in tag |
| REQ-005 | Service selection | Browse services by category; select multiple services; show price and duration |
| REQ-006 | Staff assignment | Manual selection or auto-assign; show availability status |
| REQ-007 | Date/time picker | Calendar for date; time slots in 15-min intervals; highlight available slots |
| REQ-008 | Duration calculation | Auto-calculate total duration from selected services; allow manual override |
| REQ-009 | Cost calculation | Real-time total cost display; update as services added/removed |
| REQ-010 | Notes field | Free-text notes for appointment details; max 500 characters |
| REQ-011 | Validation | Prevent booking without: client, at least 1 service, staff, date/time |
| REQ-012 | Booking summary | Show complete summary before final confirmation |
| REQ-013 | Success feedback | Toast notification on successful booking; calendar updates immediately |

**Service Timing Modes:**

| Mode | Description | Use Case |
|------|-------------|----------|
| Sequential | Services performed one after another | Single technician doing multiple services |
| Parallel | Services performed simultaneously | Multiple technicians (e.g., mani-pedi) |

---

#### 3.1.2 Group Bookings

**Priority:** P1 (Should Have)
**Status:** Enhanced Feature

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-014 | Multi-guest support | Add 2-10 guests to single booking |
| REQ-015 | Mix client types | Combine existing clients and walk-ins in same group |
| REQ-016 | Individual services | Assign different services to each guest |
| REQ-017 | Individual staff | Assign different staff to each guest |
| REQ-018 | Expandable cards | Accordion-style member cards for easy editing |
| REQ-019 | Group summary | Real-time totals: members, services, duration, cost |
| REQ-020 | Linked appointments | All group appointments linked with group ID |
| REQ-021 | Group actions | Edit/cancel entire group or individual members |

**Group Booking UI:**
```
┌─────────────────────────────────────────┐
│ Group Booking                    [+ Add]│
├─────────────────────────────────────────┤
│ ▼ Guest 1: Emily Chen                   │
│   Services: Gel Manicure, Pedicure      │
│   Staff: Lisa                           │
│   Duration: 1h 30m | $85                │
├─────────────────────────────────────────┤
│ ▶ Guest 2: Walk-in (Sarah)              │
├─────────────────────────────────────────┤
│ ▶ Guest 3: Walk-in (Mom)                │
├─────────────────────────────────────────┤
│ Group Total: 3 guests | 4h 15m | $235   │
└─────────────────────────────────────────┘
```

---

#### 3.1.3 Repeat Bookings

**Priority:** P1 (Should Have)
**Status:** Enhanced Feature

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-022 | Repeat patterns | Weekly, bi-weekly, monthly, custom intervals |
| REQ-023 | End conditions | Until specific date, number of occurrences, or end of year |
| REQ-024 | Preview instances | Show all instances before confirming |
| REQ-025 | Edit series | Edit single instance, this and future, or entire series |
| REQ-026 | Cancel series | Cancel single instance or entire series |
| REQ-027 | Conflict handling | Detect and report conflicts for each instance |

**Repeat Options:**
```
Repeat: [Every week ▼]
On: [Same day & time]
Until:
  ○ End of year (Dec 31, 2025)
  ○ After [10] occurrences
  ○ On date [____]

[Preview 10 appointments...]
```

---

### 3.2 Appointment Management

#### 3.2.1 Viewing Appointments

**Priority:** P0 (Must Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-028 | Appointment card | Display: client name, services, staff, time, status badge |
| REQ-029 | Click to view | Tap card → open details modal with all information |
| REQ-030 | Status badges | Color-coded: Scheduled (blue), Checked-In (green), In-Service (orange), Completed (purple), Cancelled (red), No-Show (gray) |
| REQ-031 | Visual indicators | Icons for: online booking, deposit paid, group booking, requested staff, client notes |
| REQ-032 | Service list | Show all services with individual prices |
| REQ-033 | Appointment log | View history of all changes to appointment |

**Appointment Card:**
```
┌─────────────────────────────────────┐
│ 🔵 10:00 AM - 11:30 AM              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Emily Chen                    ❤️ 📱 │
│ Gel Manicure, Pedicure              │
│ with Lisa                           │
│ ─────────────────────────────────── │
│ $85                    [Checked-In] │
└─────────────────────────────────────┘

Icons: ❤️ = Requested staff, 📱 = Online booking
       💰 = Deposit paid, 👥 = Group booking
```

---

#### 3.2.2 Editing Appointments

**Priority:** P0 (Must Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-034 | Edit all fields | Client, staff, services, date, time, notes |
| REQ-035 | Pre-filled form | Load current values for editing |
| REQ-036 | Change tracking | Only enable save when changes detected |
| REQ-037 | Conflict detection | Check for conflicts on time/staff changes |
| REQ-038 | Drag and drop | Drag appointment to different time slot or staff column |
| REQ-039 | Duration adjustment | Allow manual override of service duration |
| REQ-040 | Optimistic updates | UI updates immediately; rollback on error |

---

#### 3.2.3 Cancelling & Deleting

**Priority:** P0 (Must Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-041 | Cancel appointment | Soft delete; preserves record; status = "Cancelled" |
| REQ-042 | Cancellation reason | Optional reason selection or free text |
| REQ-043 | Cancellation policy | Configurable hours-before threshold for fee |
| REQ-044 | Delete appointment | Hard delete with confirmation; manager permission required |
| REQ-045 | No-show marking | Mark as no-show; affects client history |
| REQ-046 | No-show limit warning | Display warning if client exceeds no-show threshold |
| REQ-047 | Blacklist notification | Alert if client is on blacklist |

**Cancellation Flow:**
```
[Cancel Appointment]
        ↓
┌─────────────────────────────────┐
│ Cancel Emily's Appointment?     │
│                                 │
│ Date: Dec 15, 2025 at 2:00 PM   │
│ Services: Gel Manicure          │
│                                 │
│ Reason (optional):              │
│ ┌─────────────────────────────┐ │
│ │ ○ Client requested          │ │
│ │ ○ Staff unavailable         │ │
│ │ ○ Scheduling conflict       │ │
│ │ ○ Other: [___________]      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⚠️ Cancellation within 24hrs    │
│    may incur $25 fee            │
│                                 │
│    [Keep]        [Cancel Apt]   │
└─────────────────────────────────┘
```

---

#### 3.2.4 Status Workflow

**Priority:** P0 (Must Have)

**Status Flow:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Scheduled   │ ──▶ │  Checked-In  │ ──▶ │  In-Service  │ ──▶ │  Completed   │
│    (Blue)    │     │   (Green)    │     │   (Orange)   │     │   (Purple)   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│  Cancelled   │     │   No-Show    │
│    (Red)     │     │    (Gray)    │
└──────────────┘     └──────────────┘
```

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-048 | One-click status | Quick buttons for each status transition |
| REQ-049 | Status validation | Prevent invalid transitions (e.g., Completed → Checked-In) |
| REQ-050 | Status history | Log all status changes with timestamp and user |
| REQ-051 | Auto-transition | Optional: auto-mark no-show after X minutes past appointment time |

**Quick Actions in Details Modal:**
```
┌─────────────────────────────────────────┐
│ [Check-In]  [Start]  [Complete]         │
│                                         │
│ [Edit]  [Cancel]  [No-Show]  [Rebook]   │
└─────────────────────────────────────────┘
```

---

### 3.3 Calendar Views

#### 3.3.1 Day View (Primary)

**Priority:** P0 (Must Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-052 | Staff columns | One column per staff member; horizontal scroll if needed |
| REQ-053 | Time grid | 15-minute intervals; business hours (configurable, default 8 AM - 10 PM) |
| REQ-054 | Appointment cards | Positioned and sized based on time and duration |
| REQ-055 | Current time indicator | Red line showing current time; separates past from future |
| REQ-056 | Click to create | Click empty slot → open new appointment modal with time pre-filled |
| REQ-057 | Salon appointment column | Special column for unassigned/online bookings |

**Day View Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ◀ Dec 15, 2025 ▶                    [Day] [Week] [Month] [📋] │
├─────────────────────────────────────────────────────────────────┤
│         │ Salon    │ Lisa     │ Mike     │ Jenny    │ David   │
│─────────┼──────────┼──────────┼──────────┼──────────┼─────────│
│ 9:00 AM │          │ ┌──────┐ │          │ ┌──────┐ │         │
│         │          │ │Emily │ │          │ │John  │ │         │
│ 9:30 AM │          │ │Chen  │ │          │ └──────┘ │         │
│         │          │ └──────┘ │          │          │         │
│ 10:00AM │ ══════════════════════════════════════════ NOW ═════│
│         │ ┌──────┐ │          │ ┌──────┐ │          │         │
│ 10:30AM │ │Online│ │          │ │Sarah │ │          │         │
│         │ │Book  │ │          │ │Jones │ │          │         │
│ 11:00AM │ └──────┘ │          │ └──────┘ │          │         │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 3.3.2 Week View

**Priority:** P1 (Should Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-058 | 7-day display | Show full week with day columns |
| REQ-059 | Compact appointments | Show appointment count or condensed cards |
| REQ-060 | Navigation | Previous/next week; jump to specific date |
| REQ-061 | Click to day | Click day → switch to Day View for that date |

---

#### 3.3.3 Month View

**Priority:** P2 (Nice to Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-062 | Calendar grid | Traditional month calendar layout |
| REQ-063 | Appointment indicators | Dots or count showing appointments per day |
| REQ-064 | Color coding | Days colored by capacity (green=light, yellow=moderate, red=busy) |
| REQ-065 | Click to day | Click date → switch to Day View |

---

#### 3.3.4 Agenda View

**Priority:** P1 (Should Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-066 | List format | Chronological list of appointments |
| REQ-067 | Date grouping | Group appointments by date with headers |
| REQ-068 | Search & filter | Search by client name; filter by staff, status, service |
| REQ-069 | Quick actions | Swipe for check-in, cancel, etc. |

---

### 3.4 Calendar Additional Features

#### 3.4.1 Navigation & Display

**Priority:** P0/P1

| Requirement | Description | Acceptance Criteria | Priority |
|------------|-------------|---------------------|----------|
| REQ-070 | Date navigation | Previous/next day buttons; today button | P0 |
| REQ-071 | Date picker | Calendar popup for jumping to specific date | P0 |
| REQ-072 | View persistence | Remember last selected view across sessions | P1 |
| REQ-073 | Time range modes | Full day, working hours only, before/after working hours | P1 |

#### 3.4.2 Staff & Filtering

| Requirement | Description | Acceptance Criteria | Priority |
|------------|-------------|---------------------|----------|
| REQ-074 | Staff filter | Multi-select staff to show/hide columns | P0 |
| REQ-075 | Staff ordering | Default order or by turn queue position | P1 |
| REQ-076 | Drag to reorder | Drag staff columns to customize order | P2 |
| REQ-077 | Column width | Adjustable column width (saved per device) | P2 |
| REQ-078 | Status filter | Filter appointments by status | P1 |
| REQ-079 | Booking type filter | Filter by source: online, phone, walk-in | P1 |

#### 3.4.3 Quick Actions

| Requirement | Description | Acceptance Criteria | Priority |
|------------|-------------|---------------------|----------|
| REQ-080 | Mass reminders | Send reminder to all upcoming appointments | P2 |
| REQ-081 | Coming appointments | Panel showing next 2 hours of appointments | P1 |
| REQ-082 | Appointment count | Show count per time slot and per staff | P1 |
| REQ-083 | Quick start popup | Fast add services/staff directly from calendar | P2 |

---

### 3.5 Staff Time Off

**Priority:** P1 (Should Have)

| Requirement | Description | Acceptance Criteria |
|------------|-------------|---------------------|
| REQ-084 | Drag to create | Drag on calendar to select time-off range |
| REQ-085 | Block appointments | Prevent bookings during time-off |
| REQ-086 | Visual indicator | Shaded/striped area showing blocked time |
| REQ-087 | Time-off types | Lunch, break, personal, vacation |

---

## 4. Business Rules & Configuration

### 4.1 Conflict Detection Rules

| Rule ID | Rule | Default | Configurable |
|---------|------|---------|--------------|
| BR-001 | Prevent double-booking staff | Enabled | No (always on) |
| BR-002 | Warn if client has overlapping appointment | Enabled | Yes |
| BR-003 | Buffer time between appointments | 10 minutes | Yes (0-30 min) |
| BR-004 | Prevent booking outside business hours | Enabled | Yes |
| BR-005 | Allow booking past hours of current day | Enabled | Yes |
| BR-006 | Manager can override conflicts | Enabled | Yes |

### 4.2 Client Rules

| Rule ID | Rule | Default | Configurable |
|---------|------|---------|--------------|
| BR-007 | No-show threshold for warning | 3 no-shows | Yes (1-10) |
| BR-008 | Blacklist blocks booking | Warning only | Yes (warn/block) |
| BR-009 | Require phone for walk-in | No | Yes |

### 4.3 Booking Rules

| Rule ID | Rule | Default | Configurable |
|---------|------|---------|--------------|
| BR-010 | Online booking requires staff selection | No | Yes |
| BR-011 | Limit online bookings in Salon column | 5 per hour | Yes (1-unlimited) |
| BR-012 | Cancellation window for fee | 24 hours | Yes (0-72 hours) |
| BR-013 | Deposit required for booking | No | Yes (per service) |
| BR-014 | Max services per appointment | 10 | Yes |
| BR-015 | Max group size | 10 guests | Yes |

### 4.4 Auto-Assignment Algorithm

**Scoring System (100 points total):**

| Factor | Points | Description |
|--------|--------|-------------|
| Service compatibility | 30 | Staff can perform all requested services |
| Client preference | 25 | Client has history with this staff member |
| Fair rotation | 20 | Distribute work evenly across staff |
| Current workload | 15 | Staff not already overbooked |
| Skill level | 10 | Higher-rated staff for complex services |
| Availability bonus | +10 | Staff has open time slot |
| Conflict penalty | -20 | Would cause scheduling conflict |

**Selection Logic:**
1. Filter staff who can perform all requested services
2. Calculate score for each eligible staff member
3. Return highest-scoring staff member
4. If tie, use rotation order (least recently assigned)

---

## 5. User Interface Specifications

### 5.1 Design System

**Typography:**
- Font: Inter (system fallback: -apple-system, BlinkMacSystemFont)
- Headers: 18-24px, font-weight 600
- Body: 14-16px, font-weight 400
- Labels: 12px, font-weight 500

**Colors:**

| Element | Color | Hex |
|---------|-------|-----|
| Primary action | Teal | #0D9488 |
| Secondary action | Gray | #6B7280 |
| Scheduled | Blue | #3B82F6 |
| Checked-In | Green | #22C55E |
| In-Service | Orange | #F97316 |
| Completed | Purple | #8B5CF6 |
| Cancelled | Red | #EF4444 |
| No-Show | Gray | #9CA3AF |
| Warning | Amber | #F59E0B |
| Error | Red | #DC2626 |

**Spacing:**
- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px
- Touch targets: minimum 44x44px

### 5.2 Component Specifications

#### Appointment Card
- Height: Based on duration (22px per 15 minutes)
- Min height: 44px (even for short appointments)
- Border radius: 8px
- Left border: 4px colored by status
- Padding: 8px 12px

#### Modal Dialogs
- Max width: 480px (mobile full-width)
- Border radius: 12px
- Backdrop: rgba(0, 0, 0, 0.5)
- Animation: fade + slide up

#### Time Slots
- Height: 22px per 15-minute slot
- Hover state: light blue background
- Selected state: blue border

### 5.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom sheet modals |
| Tablet | 640-1024px | 2-3 staff columns visible |
| Desktop | > 1024px | Full multi-column view |

### 5.4 Accessibility Requirements

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG AA (4.5:1 for text) |
| Focus indicators | Visible on all interactive elements |
| Screen reader | All elements labeled with ARIA |
| Keyboard navigation | Tab order follows visual layout |
| Touch targets | Minimum 44x44px |
| Status indicators | Color + icon (not color alone) |

---

## 6. Technical Requirements

### 6.1 Data Architecture

**Appointment Data Model:**
```typescript
interface Appointment {
  // Identifiers
  id: string;                      // Local UUID
  serverId?: number;               // Server ID after sync
  storeId: string;

  // Client
  clientId: string;
  clientName: string;
  clientPhone?: string;

  // Staff
  staffId: string;
  staffName: string;
  isRequestedStaff: boolean;       // Client specifically requested this staff

  // Services
  services: AppointmentService[];
  totalDuration: number;           // Minutes
  totalPrice: number;

  // Timing
  scheduledDate: string;           // YYYY-MM-DD
  scheduledStartTime: string;      // HH:mm
  scheduledEndTime: string;        // HH:mm

  // Status
  status: AppointmentStatus;
  statusHistory: StatusChange[];

  // Metadata
  source: 'online' | 'phone' | 'walk-in' | 'repeat';
  notes?: string;
  groupId?: string;                // For group bookings
  repeatSeriesId?: string;         // For repeat bookings

  // Sync
  syncStatus: 'pending' | 'synced' | 'error';
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'in-service'
  | 'completed'
  | 'cancelled'
  | 'no-show';
```

### 6.2 Offline Requirements

| Requirement | Description |
|-------------|-------------|
| Local storage | All appointments stored in IndexedDB via Dexie.js |
| Cache range | Today + next 7 days cached by default |
| Sync queue | Changes queued with priority (appointments = priority 3) |
| Conflict resolution | Server wins for conflicts; user notified |
| Offline indicator | Visual indicator when operating offline |
| Auto-sync | Sync triggered on reconnection |

### 6.3 Performance Requirements

| Metric | Target |
|--------|--------|
| Initial load | < 2 seconds |
| Calendar render | < 500ms |
| Search results | < 500ms |
| Create appointment | < 1 second |
| Status change | < 200ms (optimistic) |
| Sync on reconnect | < 30 seconds for full queue |

---

## 7. Integration Points

### 7.1 Internal Integrations

| Module | Integration | Direction |
|--------|-------------|-----------|
| Front Desk | Push check-in events; receive status updates | Bidirectional |
| Checkout | Pass completed appointments for payment | Outbound |
| Client CRM | Fetch client data; update visit history | Bidirectional |
| Team & Schedule | Fetch staff schedules and availability | Inbound |
| Turn Tracker | Notify of check-ins; receive staff assignments | Bidirectional |

### 7.2 External Integrations

| System | Integration | Direction |
|--------|-------------|-----------|
| Online Booking Portal | Receive online appointments | Inbound |
| Client App | Send confirmations and reminders | Outbound |
| SMS/Email Service | Trigger notifications | Outbound |
| QR Check-In Kiosk | Receive check-in events | Inbound |

---

## 8. Implementation Phases

### Phase 1: Core MVP (P0)
**Target: Foundation**

| Feature | Requirements | Priority |
|---------|-------------|----------|
| Day View | REQ-052 to REQ-056 | P0 |
| Create Appointment | REQ-001 to REQ-013 | P0 |
| Edit Appointment | REQ-034 to REQ-040 | P0 |
| Cancel/Delete | REQ-041 to REQ-047 | P0 |
| Status Workflow | REQ-048 to REQ-051 | P0 |
| View Details | REQ-028 to REQ-033 | P0 |
| Basic Navigation | REQ-070 to REQ-071 | P0 |
| Offline Support | Basic IndexedDB + sync | P0 |

**Acceptance Criteria for Phase 1:**
- [ ] User can create, view, edit, and cancel appointments
- [ ] Day view displays appointments correctly positioned
- [ ] Status can be changed through defined workflow
- [ ] Works offline with sync on reconnection
- [ ] No double-booking without conflict warning

---

### Phase 2: Enhanced Views (P1)
**Target: Complete Calendar**

| Feature | Requirements | Priority |
|---------|-------------|----------|
| Week View | REQ-058 to REQ-061 | P1 |
| Agenda View | REQ-066 to REQ-069 | P1 |
| Staff Filter | REQ-074, REQ-078, REQ-079 | P1 |
| Coming Appointments | REQ-081, REQ-082 | P1 |
| Time Off | REQ-084 to REQ-087 | P1 |

**Acceptance Criteria for Phase 2:**
- [ ] All 4 views functional (Day, Week, Month, Agenda)
- [ ] Staff can be filtered in/out of view
- [ ] Time-off blocks prevent bookings
- [ ] Coming appointments panel shows next 2 hours

---

### Phase 3: Advanced Features (P1-P2)
**Target: Power Features**

| Feature | Requirements | Priority |
|---------|-------------|----------|
| Group Bookings | REQ-014 to REQ-021 | P1 |
| Repeat Bookings | REQ-022 to REQ-027 | P1 |
| Drag & Drop | REQ-038 | P1 |
| Smart Auto-Assign | Algorithm from Section 4.4 | P1 |
| Month View | REQ-062 to REQ-065 | P2 |

**Acceptance Criteria for Phase 3:**
- [ ] Group bookings can be created with multiple guests
- [ ] Repeat bookings generate correct series
- [ ] Drag and drop reschedules appointments
- [ ] Auto-assign selects optimal staff

---

### Phase 4: Polish & Integration (P2)
**Target: Production Ready**

| Feature | Requirements | Priority |
|---------|-------------|----------|
| Column Customization | REQ-076, REQ-077 | P2 |
| Mass Reminders | REQ-080 | P2 |
| Quick Start Popup | REQ-083 | P2 |
| View Persistence | REQ-072, REQ-073 | P2 |
| Performance Optimization | Section 6.3 | P2 |
| Accessibility | Section 5.4 | P2 |

**Acceptance Criteria for Phase 4:**
- [ ] All features from Phase 1-3 polished
- [ ] Performance metrics met
- [ ] WCAG AA accessibility compliant
- [ ] User tested and feedback incorporated

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Appointment creation time | < 30 seconds | Analytics tracking |
| Check-in time | < 3 taps | UX testing |
| Double-booking rate | 0% (without override) | Error logs |
| Offline operation uptime | 100% | System monitoring |
| Sync success rate | > 99% | Sync queue metrics |
| User satisfaction | > 4.5/5 | User surveys |

### 9.2 Operational Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily appointments created | Baseline + 20% | Database queries |
| No-show reduction | 15% decrease | Status tracking |
| Staff utilization | 85%+ during peak | Schedule analysis |
| Cancellation rate | < 10% | Status tracking |

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| Appointment | A scheduled service for a client with assigned staff |
| Walk-in | A client without a prior appointment |
| Booking | The act of creating an appointment |
| Check-in | Marking a client as arrived for their appointment |
| No-show | A client who didn't arrive for their appointment without notice |
| Turn Queue | System for fair distribution of walk-in clients to staff |
| Salon Column | Calendar column for unassigned/online bookings |
| Buffer Time | Gap between appointments for preparation |
| Group Booking | Multiple appointments linked together (party) |
| Repeat Booking | A series of recurring appointments |

### 10.2 Related Documents

| Document | Location |
|----------|----------|
| Operations Module PRD | `docs/product/Mango POS PRD v1.md` |
| Front Desk PRD | `docs/product/PRD-Front-Desk-Module.md` |
| Checkout PRD | `docs/product/PRD-Sales-Checkout-Module.md` |
| Technical Architecture | `docs/architecture/TECHNICAL_DOCUMENTATION.md` |
| Book UX Guide | `docs/modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md` |

### 10.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Original | Initial requirements (informal) |
| 2.0 | Dec 13, 2025 | Product Team | Complete rewrite with structured format, acceptance criteria, and phases |

---

**Document Status:** Ready for Review
**Next Steps:** Stakeholder review → Technical review → Implementation planning
