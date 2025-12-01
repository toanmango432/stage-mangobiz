# Product Requirements Document: Team Schedule Management Module

**Document Version:** 1.0
**Created:** December 1, 2025
**Author:** Product Team
**Status:** Draft - Pending Review
**Priority:** P0 (Critical)

---

## 1. Executive Summary

### Problem Statement

Salon managers spend **2-4 hours weekly** managing staff schedules using spreadsheets, paper calendars, or basic digital tools that lack salon-specific functionality. Current pain points include:

> "I have to manually check three different places to see if Maria can take a booking on Thursday—her regular schedule, her vacation requests, and whether she's at the downtown or uptown location." — Salon Owner, 12-chair salon

> "When someone calls in sick, I spend 30 minutes calling around to find coverage. There's no easy way to see who's available and qualified." — Front Desk Manager

> "I can't tell the difference between when stylists are on lunch versus training versus just blocked personal time. It all looks the same on the calendar." — Scheduling Coordinator

### Proposed Solution

A comprehensive Team Schedule Management module that provides:
1. **Flexible shift scheduling** with multi-week repeat patterns
2. **Categorized time-off management** with approval workflows
3. **Typed blocked time** for breaks, training, and admin tasks
4. **Business closure periods** for holidays and special events
5. **Resource scheduling** for rooms and equipment
6. **Compensation tracking** (paid vs. unpaid time)

### Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Time spent on weekly scheduling | 2-4 hours | < 30 minutes | 3 months post-launch |
| Schedule-related booking errors | ~5% of appointments | < 1% | 3 months post-launch |
| Staff self-service time-off requests | 0% (all manager-initiated) | 80% | 6 months post-launch |
| Manager time-off approval time | 24-48 hours | < 4 hours | 3 months post-launch |
| Double-booking incidents | 3-5/month | 0 | 1 month post-launch |

### Target Users

**Primary:**
- **Salon Owners/Managers** — Create schedules, approve time-off, manage closures
- **Front Desk Staff** — View availability, handle schedule inquiries, book around constraints

**Secondary:**
- **Service Providers** — View own schedule, request time-off, see shift details
- **Multi-location Managers** — Coordinate schedules across venues

### Priority

**P0 - Critical** — Schedule management is foundational to all booking and staffing operations. Without proper scheduling, appointment booking accuracy suffers and staff satisfaction decreases.

---

## 2. Background & Context

### Current State in Mango POS

| Feature | Current Status | Gap |
|---------|---------------|-----|
| Regular weekly schedules | ✅ Implemented | Works for simple cases |
| Multiple shifts per day | ✅ Implemented | Functional |
| Break times | ✅ Implemented | Basic, no categorization |
| Time-off requests | ⚠️ Types exist, UI incomplete | No approval workflow |
| Schedule overrides | ⚠️ Types exist, not wired | Limited functionality |
| Repeat patterns | ⚠️ Weekly/biweekly/monthly only | Missing 3/4-week cycles |
| Blocked time types | ❌ Not implemented | No categorization |
| Business closures | ❌ Not implemented | Manual workaround needed |
| Resource scheduling | ❌ Not implemented | Not available |
| Paid/unpaid tracking | ❌ Not implemented | No compensation visibility |

### Competitive Analysis

| Feature | Fresha | Booksy | Vagaro | Square | Mango (Current) | Mango (Proposed) |
|---------|--------|--------|--------|--------|-----------------|------------------|
| Multi-week patterns | ✅ 1-4 weeks | ✅ 1-4 weeks | ✅ 1-4 weeks | ✅ Custom | ⚠️ 1-2 weeks | ✅ 1-4 weeks |
| Time-off types | ✅ Customizable | ✅ Fixed types | ✅ Customizable | ⚠️ Basic | ❌ None | ✅ Customizable |
| Blocked time types | ✅ With emoji/color | ✅ Categories | ✅ Categories | ⚠️ Basic | ❌ None | ✅ With emoji/color |
| Business closures | ✅ Full support | ✅ Full support | ✅ Full support | ✅ Full support | ❌ None | ✅ Full support |
| Resource scheduling | ✅ Full support | ⚠️ Basic | ✅ Full support | ❌ None | ❌ None | ✅ Full support |
| Approval workflow | ✅ Checkbox | ✅ Full workflow | ✅ Full workflow | ❌ None | ❌ None | ✅ Full workflow |
| Paid/unpaid tracking | ✅ Tracked | ⚠️ Basic | ✅ Tracked | ⚠️ Basic | ❌ None | ✅ Tracked |
| Mobile parity | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Limited | ✅ Full |

### Strategic Alignment

This initiative supports:
- **OKR: Reduce operational friction** — Streamlined scheduling reduces admin overhead
- **OKR: Improve staff satisfaction** — Self-service and transparency increase employee happiness
- **OKR: Decrease booking errors** — Accurate availability prevents double-booking
- **OKR: Feature parity with competitors** — Match Fresha/Booksy capabilities

### User Research Findings

**From salon owner interviews (n=12):**
- 100% use some form of digital scheduling, but 67% supplement with paper/whiteboard
- 83% cite "staff time-off coordination" as top scheduling pain point
- 75% want categorized blocked time to understand why staff are unavailable
- 58% manage multiple service types requiring different resources (rooms, chairs)

**From staff interviews (n=24):**
- 92% want mobile access to view their schedule
- 71% want to request time-off through the app (vs. text/verbal)
- 67% want visibility into why their requests were approved/denied
- 54% want to see how many PTO days they have remaining

---

## 3. User Stories & Use Cases

### Epic 1: Time-Off Type Management

**US-1.1: Create Custom Time-Off Types**
> As a salon owner, I want to create custom time-off categories (vacation, sick, personal, bereavement, maternity), so that I can accurately track different absence reasons and their impact on payroll.

**Acceptance Criteria:**
- [ ] Can create new time-off type with name, emoji, color
- [ ] Can mark type as paid or unpaid
- [ ] Can set whether type requires approval
- [ ] Can set optional annual limit (e.g., 10 vacation days/year)
- [ ] Can edit or archive existing types
- [ ] Default types seeded on first use

**US-1.2: Request Time-Off with Type**
> As a stylist, I want to submit a time-off request with a specific type, so that my manager knows whether I'm taking vacation vs. sick leave.

**Acceptance Criteria:**
- [ ] Can select from configured time-off types
- [ ] Shows type emoji and paid/unpaid indicator
- [ ] Calculates hours based on scheduled shift for that day
- [ ] Can add optional notes
- [ ] Shows remaining balance for limited types

**US-1.3: View Time-Off Balance**
> As a stylist, I want to see how many vacation days I have remaining, so that I can plan my time off accordingly.

**Acceptance Criteria:**
- [ ] Shows balance for each limited time-off type
- [ ] Shows used vs. available days
- [ ] Updates in real-time as requests are approved

---

### Epic 2: Time-Off Approval Workflow

**US-2.1: Review Pending Requests**
> As a manager, I want to see all pending time-off requests in one place, so that I can quickly approve or deny them.

**Acceptance Criteria:**
- [ ] Dashboard widget showing pending request count
- [ ] List view with requester, type, dates, hours
- [ ] One-click approve with optional note
- [ ] Deny with required reason
- [ ] Bulk approve/deny multiple requests

**US-2.2: Receive Approval Notification**
> As a stylist, I want to be notified when my time-off request is approved or denied, so that I can plan accordingly.

**Acceptance Criteria:**
- [ ] In-app notification on approval/denial
- [ ] Shows reason if denied
- [ ] Time-off immediately appears on calendar when approved

**US-2.3: Cancel Pending Request**
> As a stylist, I want to cancel a pending time-off request, so that I can change my plans before it's reviewed.

**Acceptance Criteria:**
- [ ] Can cancel only pending (not yet approved/denied) requests
- [ ] Manager no longer sees cancelled request
- [ ] Request removed from pending list

---

### Epic 3: Blocked Time Management

**US-3.1: Create Blocked Time Types**
> As a salon owner, I want to create categories for blocked time (lunch, training, meeting, personal), so that I can understand why staff are unavailable.

**Acceptance Criteria:**
- [ ] Can create type with name, emoji, color, default duration
- [ ] Can mark as paid or unpaid
- [ ] Can edit or archive types
- [ ] Default types seeded on first use

**US-3.2: Block Time on Calendar**
> As a manager, I want to block time on a stylist's calendar for a meeting, so that clients cannot book during that time.

**Acceptance Criteria:**
- [ ] Select blocked time type from dropdown
- [ ] Auto-fills default duration, can override
- [ ] Set frequency: once, daily, weekly, monthly
- [ ] Set end date for recurring blocked time
- [ ] Add optional notes
- [ ] Blocked time appears on calendar with type color/emoji

**US-3.3: Prevent Booking During Blocked Time**
> As a client booking online, I should not see blocked time slots as available, so that I don't book when the stylist is unavailable.

**Acceptance Criteria:**
- [ ] Blocked time slots hidden from online booking
- [ ] Staff warned when manually booking over blocked time
- [ ] Calendar clearly shows blocked vs. available slots

---

### Epic 4: Business Closed Periods

**US-4.1: Set Business Closure**
> As a salon owner, I want to mark the salon as closed for Christmas Day, so that no appointments can be booked.

**Acceptance Criteria:**
- [ ] Can create closure with name, start/end dates
- [ ] Can apply to all locations or specific location
- [ ] Supports partial-day closures (close early, open late)
- [ ] Shows on all staff calendars
- [ ] Blocks online and in-store booking

**US-4.2: View Closure Impact**
> As a manager, I want to see which existing appointments are affected by a new closure, so that I can reschedule them.

**Acceptance Criteria:**
- [ ] When creating closure, shows count of affected appointments
- [ ] Can view list of affected appointments
- [ ] Option to notify affected clients

**US-4.3: Client Visibility**
> As a client, I should see that the salon is closed when trying to book on a holiday, so that I understand why no slots are available.

**Acceptance Criteria:**
- [ ] Online booking shows "Closed" indicator for closure dates
- [ ] Clear messaging: "Salon closed for [reason]"

---

### Epic 5: Multi-Week Schedule Patterns

**US-5.1: Create Rotating Schedule**
> As a manager, I want to set up a 2-week rotating schedule for part-time staff, so that they work alternating weekends.

**Acceptance Criteria:**
- [ ] Support 1, 2, 3, and 4-week repeat cycles
- [ ] Different hours per week within cycle
- [ ] Preview shows entire cycle before saving
- [ ] Can set start date and optional end date

**US-5.2: View Multi-Week Preview**
> As a stylist, I want to see my schedule for the next month, so that I know which weekends I'm working.

**Acceptance Criteria:**
- [ ] Calendar view shows repeating pattern applied
- [ ] Can distinguish "week 1" vs "week 2" etc. in pattern
- [ ] Schedule overrides shown differently than regular pattern

---

### Epic 6: Resource Scheduling

**US-6.1: Create Resources**
> As a salon owner, I want to define resources like "Massage Room 1" and "Facial Room", so that services requiring specific rooms can be properly scheduled.

**Acceptance Criteria:**
- [ ] Create resource with name, description, category (room/equipment/station)
- [ ] Assign to location(s)
- [ ] Set color for calendar display
- [ ] Mark as active/inactive

**US-6.2: Link Services to Resources**
> As a manager, I want to specify that "Deep Tissue Massage" requires a massage room, so that bookings automatically reserve the room.

**Acceptance Criteria:**
- [ ] Toggle "Requires Resource" per service
- [ ] Select which resource types can fulfill requirement
- [ ] Supports "any available" or specific resource
- [ ] Shows resource in appointment details

**US-6.3: View Resource Calendar**
> As a manager, I want to see room availability across the day, so that I can optimize scheduling.

**Acceptance Criteria:**
- [ ] Calendar filter to view by resource
- [ ] Timeline view showing resource utilization
- [ ] Clear visual for available vs. booked

**US-6.4: Prevent Resource Double-Booking**
> As a client booking online, the system should only show available slots when the required room is free.

**Acceptance Criteria:**
- [ ] Online booking checks resource availability
- [ ] In-store booking shows warning for resource conflicts
- [ ] Staff can override with acknowledgment

---

### Epic 7: Paid/Unpaid Time Tracking

**US-7.1: Track Compensation Type**
> As a payroll admin, I want to see how many hours each stylist spent on paid vs. unpaid time, so that I can process payroll accurately.

**Acceptance Criteria:**
- [ ] Time-off hours categorized by paid/unpaid
- [ ] Blocked time hours categorized by paid/unpaid
- [ ] Report showing breakdown by staff member

**US-7.2: Working Hours Report**
> As a salon owner, I want a report showing scheduled hours, worked hours, paid time-off, and unpaid time for each employee.

**Acceptance Criteria:**
- [ ] Filter by date range, employee, location
- [ ] Show: scheduled hours, actual hours (timesheet), paid time-off, unpaid time-off, paid blocked time, unpaid blocked time
- [ ] Calculate total payable hours
- [ ] Export to CSV

---

### Edge Cases

**EC-1: Time-Off During Existing Appointments**
When staff requests time-off for a day with existing appointments:
- Show warning with appointment count
- Require acknowledgment before submitting
- Manager sees conflict warning when reviewing

**EC-2: Blocked Time Overlap**
When creating blocked time that overlaps with:
- Existing appointment: Warn staff, require confirmation or reschedule
- Existing blocked time: Ask to extend/modify existing or create new
- Time-off: Blocked time should not be creatable over approved time-off

**EC-3: Business Closure Mid-Day**
When salon closes early (e.g., 3pm on Christmas Eve):
- Only block bookings after closure time
- Appointments before closure remain valid
- Show partial closure on calendar

**EC-4: Resource Deleted with Active Bookings**
When deleting a resource that has future bookings:
- Warn about affected appointments
- Option to reassign to another resource
- Option to remove resource requirement from appointments

**EC-5: Staff Member Deactivated with Future Time-Off**
When archiving staff member who has approved time-off:
- Automatically cancel future time-off
- No action needed from manager

---

## 4. Detailed Requirements

### 4.1 Functional Requirements

#### Time-Off Types (FR-100 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-101 | System shall support creating custom time-off types with name, emoji, and color | Must Have |
| FR-102 | Each time-off type shall be configurable as paid or unpaid | Must Have |
| FR-103 | Each time-off type shall be configurable to require approval or auto-approve | Must Have |
| FR-104 | Time-off types shall support optional annual day limits | Should Have |
| FR-105 | System shall seed default time-off types on first use (Vacation, Sick, Personal, Unpaid, Maternity, Bereavement) | Must Have |
| FR-106 | Time-off types shall be archivable (soft delete) without affecting historical data | Must Have |
| FR-107 | Time-off requests shall calculate hours based on scheduled shift for that day | Must Have |
| FR-108 | Staff shall see remaining balance for limited time-off types | Should Have |

#### Time-Off Approval Workflow (FR-200 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-201 | Time-off requests shall have status: pending, approved, denied, cancelled | Must Have |
| FR-202 | Managers shall see list of pending time-off requests with filter options | Must Have |
| FR-203 | Managers shall approve requests with optional note | Must Have |
| FR-204 | Managers shall deny requests with required reason | Must Have |
| FR-205 | Managers shall bulk approve/deny multiple requests | Should Have |
| FR-206 | Staff shall receive in-app notification on approval/denial | Must Have |
| FR-207 | Staff shall cancel pending (not yet decided) requests | Must Have |
| FR-208 | Approved time-off shall automatically appear on calendar | Must Have |
| FR-209 | System shall warn when time-off conflicts with existing appointments | Must Have |

#### Blocked Time Types (FR-300 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-301 | System shall support creating blocked time types with name, emoji, color, default duration | Must Have |
| FR-302 | Each blocked time type shall be configurable as paid or unpaid | Must Have |
| FR-303 | System shall seed default blocked time types (Lunch, Coffee Break, Training, Meeting, Admin, Cleaning, Personal) | Must Have |
| FR-304 | Blocked time entries shall support frequency: once, daily, weekly, monthly | Must Have |
| FR-305 | Recurring blocked time shall support end date | Must Have |
| FR-306 | Blocked time shall appear on calendar with type color and emoji | Must Have |
| FR-307 | Online booking shall not show slots overlapping with blocked time | Must Have |
| FR-308 | In-store booking shall warn when booking over blocked time | Must Have |
| FR-309 | Blocked time types shall be archivable without affecting existing entries | Must Have |

#### Business Closed Periods (FR-400 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-401 | System shall support creating business closed periods with name, dates, location | Must Have |
| FR-402 | Closed periods shall apply to all locations or specific location | Must Have |
| FR-403 | Closed periods shall support partial-day closures | Should Have |
| FR-404 | Closed periods shall appear on all affected staff calendars | Must Have |
| FR-405 | Online and in-store booking shall be blocked during closed periods | Must Have |
| FR-406 | System shall show count of affected appointments when creating closure | Should Have |
| FR-407 | Online booking shall display "Closed for [reason]" message | Should Have |

#### Multi-Week Patterns (FR-500 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-501 | Schedules shall support 1, 2, 3, and 4-week repeat cycles | Must Have |
| FR-502 | Each week in cycle shall support different hours | Must Have |
| FR-503 | System shall preview entire cycle before saving | Should Have |
| FR-504 | Multi-week patterns shall support start date and optional end date | Must Have |

#### Resource Scheduling (FR-600 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-601 | System shall support creating resources with name, description, category, color | Must Have |
| FR-602 | Resources shall be assignable to specific locations | Must Have |
| FR-603 | Services shall be linkable to required resources | Must Have |
| FR-604 | Appointments shall auto-assign available resources on booking | Must Have |
| FR-605 | Calendar shall support filtering/viewing by resource | Must Have |
| FR-606 | Online booking shall check resource availability | Must Have |
| FR-607 | In-store booking shall warn on resource conflicts | Must Have |
| FR-608 | Staff shall override resource conflicts with acknowledgment | Should Have |
| FR-609 | Deleting resource shall warn about affected appointments | Must Have |

#### Paid/Unpaid Tracking (FR-700 Series)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-701 | Time-off hours shall be categorized as paid or unpaid based on type | Must Have |
| FR-702 | Blocked time hours shall be categorized as paid or unpaid based on type | Must Have |
| FR-703 | Working Hours Report shall show breakdown by compensation type | Should Have |
| FR-704 | Report shall be exportable to CSV | Should Have |

---

### 4.2 Non-Functional Requirements

#### Performance

| ID | Requirement |
|----|-------------|
| NFR-001 | Schedule calendar shall load within 500ms for single week view |
| NFR-002 | Time-off request submission shall complete within 1 second |
| NFR-003 | Resource availability check shall complete within 200ms |
| NFR-004 | Schedule views shall support up to 50 staff members without degradation |

#### Scalability

| ID | Requirement |
|----|-------------|
| NFR-010 | System shall support up to 100 time-off types per salon |
| NFR-011 | System shall support up to 50 blocked time types per salon |
| NFR-012 | System shall support up to 100 resources per location |
| NFR-013 | System shall retain 3 years of schedule history |

#### Security

| ID | Requirement |
|----|-------------|
| NFR-020 | Time-off requests shall only be visible to requester and managers |
| NFR-021 | Schedule modifications shall be logged with user and timestamp |
| NFR-022 | Managers shall have granular permissions for approve/deny time-off |

#### Accessibility

| ID | Requirement |
|----|-------------|
| NFR-030 | All scheduling interfaces shall meet WCAG 2.1 AA compliance |
| NFR-031 | Calendar views shall be navigable via keyboard |
| NFR-032 | Color-coded elements shall have non-color indicators (emoji, pattern) |

#### Browser/Device Support

| ID | Requirement |
|----|-------------|
| NFR-040 | Full functionality on Chrome, Safari, Firefox (latest 2 versions) |
| NFR-041 | Mobile-optimized experience on iOS Safari and Chrome Android |
| NFR-042 | Offline support for viewing schedules (read-only) |

---

### 4.3 Business Rules

#### Time-Off Rules

| ID | Rule |
|----|------|
| BR-101 | Time-off hours calculated as: scheduled shift hours for that day. If no shift scheduled, hours = 0. |
| BR-102 | Annual limits reset on January 1 (configurable per salon) |
| BR-103 | Managers cannot approve time-off exceeding remaining balance for limited types |
| BR-104 | Cancelled time-off restores balance immediately |

#### Blocked Time Rules

| ID | Rule |
|----|------|
| BR-201 | Blocked time cannot be created over approved time-off |
| BR-202 | Deleting a blocked time type does not remove existing scheduled entries |
| BR-203 | Recurring blocked time generates individual entries up to 1 year in advance |

#### Business Closure Rules

| ID | Rule |
|----|------|
| BR-301 | Closures apply to entire business or specific location, never individual staff |
| BR-302 | Closures override individual staff schedules for that period |
| BR-303 | Existing appointments during closure are not auto-cancelled (manual action required) |

#### Resource Rules

| ID | Rule |
|----|------|
| BR-401 | Each appointment can have at most one assigned resource |
| BR-402 | Resource assignment follows order in settings (first available wins) |
| BR-403 | Staff can manually select specific resource when booking |

---

## 5. User Experience Specifications

### 5.1 Information Architecture

```
Settings
├── Scheduling
│   ├── Time-Off Types
│   │   ├── List view with edit/archive
│   │   └── Add/Edit modal
│   ├── Blocked Time Types
│   │   ├── List view with edit/archive
│   │   └── Add/Edit modal
│   ├── Closed Periods
│   │   ├── Calendar view with closures highlighted
│   │   └── Add/Edit modal
│   └── Resources
│       ├── List view by category
│       └── Add/Edit modal

Team
├── Scheduled Shifts
│   ├── Weekly grid view
│   ├── Individual shift editing
│   └── Repeat pattern configuration
├── Time-Off Requests (Manager view)
│   ├── Pending requests list
│   ├── Approved/Denied history
│   └── Balance overview
└── Time-Off (Staff self-service)
    ├── Request form
    ├── My requests list
    └── Balance display

Calendar
├── View filters
│   ├── By Staff (default)
│   ├── By Resource
│   └── By Location
├── Time-off display (approved)
├── Blocked time display (with type)
└── Closed periods display

Reports
└── Working Hours Activity
    ├── Date range filter
    ├── Staff filter
    ├── Breakdown by category
    └── Export to CSV
```

### 5.2 Key Screens

#### Screen: Time-Off Types Settings

**Layout:** Settings page with left nav, main content area

**Components:**
- Header: "Time-Off Types" with "Add Type" button (right)
- List: Cards for each type showing:
  - Emoji + Name (e.g., "🏖️ Vacation")
  - Paid/Unpaid badge
  - Requires Approval badge
  - Annual limit (if set)
  - Edit/Archive actions (kebab menu)
- Empty state: "No custom time-off types. Add your first type to get started."

**Mobile Adaptation:**
- Full-width cards
- Actions via swipe-left or long-press
- Add button as FAB (bottom-right)

---

#### Screen: Add/Edit Time-Off Type Modal

**Layout:** Centered modal (480px width desktop, bottom sheet mobile)

**Fields:**
1. **Name** (text, required, 40 char max)
   - Placeholder: "e.g., Vacation, Sick Leave"
2. **Emoji** (emoji picker, required)
   - Default: 📅
3. **Color** (color picker, required)
   - Default: #6B7280
4. **Paid Time** (toggle)
   - Default: On
   - Helper: "Track as paid hours for payroll"
5. **Requires Approval** (toggle)
   - Default: On
   - Helper: "Manager must approve requests"
6. **Annual Limit** (number input, optional)
   - Placeholder: "No limit"
   - Suffix: "days per year"
   - Helper: "Leave blank for unlimited"

**Actions:**
- Cancel (secondary button, left)
- Save (primary button, right)

**Validation:**
- Name required, unique within salon
- Emoji required
- If limit set, must be > 0

---

#### Screen: Time-Off Request Form (Staff)

**Layout:** Full-page form or modal

**Sections:**

1. **Type Selection**
   - Dropdown with emoji + name + paid/unpaid badge
   - Shows remaining balance for limited types

2. **Date Range**
   - Start date (calendar picker)
   - End date (calendar picker, defaults to start date)
   - "All day" toggle (default on)
   - If not all day: start time, end time

3. **Hours Preview**
   - "Based on your schedule: X hours"
   - Breakdown by day if multi-day

4. **Notes** (optional textarea)
   - Placeholder: "Add any notes for your manager..."

5. **Conflict Warning** (conditional)
   - If appointments exist: "You have X appointments on these dates. They will need to be rescheduled."

**Actions:**
- Cancel
- Submit Request (if requires approval)
- Confirm (if auto-approved types)

---

#### Screen: Pending Time-Off Requests (Manager)

**Layout:** List view with filters

**Filters:**
- Date range (default: next 30 days)
- Staff member (multi-select)
- Request type (multi-select)
- Status: Pending (default), All

**List Item:**
- Staff avatar + name
- Type emoji + name
- Date range
- Hours requested
- Submission date
- Conflicts badge (if any)
- Actions: Approve (green), Deny (red)

**Bulk Actions Toolbar:**
- Select all checkbox
- "Approve Selected" button
- "Deny Selected" button (opens reason modal)

**Empty State:**
- "No pending time-off requests"

---

#### Screen: Blocked Time Types Settings

**Layout:** Same pattern as Time-Off Types

**List Item Additions:**
- Default duration display (e.g., "60 min")

**Add/Edit Modal Fields:**
1. Name (required)
2. Emoji (required)
3. Color (required)
4. Default Duration (number + unit picker: minutes/hours)
5. Paid Time (toggle)

---

#### Screen: Block Time Modal (Calendar Context)

**Layout:** Slide-out panel or modal

**Fields:**
1. **Staff Member** (if manager adding for team)
   - Dropdown with avatars
   - Default: current staff (if in their column)

2. **Blocked Time Type**
   - Dropdown with emoji + name
   - Auto-fills duration on selection

3. **Date**
   - Calendar picker
   - Default: clicked date

4. **Time Range**
   - Start time picker
   - End time picker (auto-calculated from duration)
   - Manual override available

5. **Repeat** (optional expansion)
   - Frequency: Once, Daily, Weekly, Monthly
   - If recurring: End date picker

6. **Notes** (optional)

**Actions:**
- Cancel
- Save

---

#### Screen: Business Closed Periods

**Layout:** Calendar view with list below

**Calendar:**
- Month view
- Closed periods highlighted in gray with diagonal stripe pattern
- Click on closure to edit

**List:**
- Upcoming and recent closures
- Columns: Name, Dates, Location(s), Actions
- Actions: Edit, Delete

**Add Closure Modal:**
1. Name (required)
   - Placeholder: "e.g., Christmas Day, Staff Training"
2. Start Date (required)
3. End Date (required, defaults to start)
4. Partial Day (toggle)
   - If on: Start time, End time
5. Location (multi-select)
   - Default: All locations
6. Impact Preview
   - "X appointments will be affected"
   - Link to view affected appointments

---

#### Screen: Resources Settings

**Layout:** Tabbed list by category (Rooms, Equipment, Stations, Other)

**List Item:**
- Color swatch
- Name
- Description (truncated)
- Location(s)
- Status badge (Active/Inactive)
- Actions: Edit, Delete

**Add/Edit Modal:**
1. Name (required)
2. Description (optional)
3. Category (dropdown: Room, Equipment, Station, Other)
4. Color (color picker)
5. Location(s) (multi-select)
6. Active (toggle, default on)

---

#### Screen: Working Hours Report

**Layout:** Report page with filters and table

**Filters:**
- Date range (presets: This week, Last week, This month, Custom)
- Staff member (multi-select, default: all)
- Location (if multi-location)

**Summary Cards:**
- Total Scheduled Hours
- Total Worked Hours (from timesheet)
- Total Paid Time-Off
- Total Unpaid Time-Off
- Total Paid Blocked Time
- Total Unpaid Blocked Time

**Table Columns:**
- Staff Name
- Scheduled Hours
- Worked Hours
- Paid Time-Off
- Unpaid Time-Off
- Paid Blocked
- Unpaid Blocked
- Total Payable

**Actions:**
- Export CSV button

---

### 5.3 Interaction Specifications

#### Creating Blocked Time from Calendar

1. **Right-click/long-press** on empty calendar slot
2. Context menu appears with options:
   - "Add Appointment"
   - "Block Time" ← select this
   - "Add Time-Off"
3. Block Time modal slides in from right (desktop) or bottom (mobile)
4. Type dropdown focused by default
5. Duration auto-fills from selected type
6. Save → slot shows blocked time with color/emoji
7. Success toast: "Blocked time added"

#### Approving Time-Off Request

1. Manager sees badge on "Time-Off Requests" in sidebar
2. Clicks to open pending list
3. Clicks "Approve" on request
4. Optional: Add note in popover ("Approved! Enjoy your vacation.")
5. Confirm action
6. Request moves to approved
7. Staff receives notification
8. Calendar updated immediately

#### Denying Time-Off Request

1. Manager clicks "Deny" on request
2. Modal appears requiring reason
   - Preset reasons: "Scheduling conflict", "Insufficient coverage", "Already at limit", "Other"
   - If "Other": free-text required
3. Submit
4. Request moves to denied
5. Staff receives notification with reason
6. Balance not affected

---

### 5.4 Loading & Empty States

#### Loading States

- **Calendar loading:** Skeleton grid with pulsing gray blocks
- **List loading:** Skeleton cards (3 rows)
- **Modal loading:** Spinner overlay

#### Empty States

| Screen | Empty State Message | Action |
|--------|---------------------|--------|
| Time-Off Types | "No time-off types configured. Add types to help categorize staff absences." | "Add First Type" button |
| Blocked Time Types | "No blocked time types. Create types like 'Lunch' or 'Training' to categorize unavailability." | "Add First Type" button |
| Pending Requests | "No pending time-off requests. When staff submit requests, they'll appear here." | None |
| Closed Periods | "No scheduled closures. Add closures for holidays or special events." | "Add Closure" button |
| Resources | "No resources configured. Add rooms or equipment that services require." | "Add Resource" button |

#### Error States

- **Save failure:** Toast with retry option
- **Load failure:** Inline error with refresh button
- **Validation errors:** Inline below field, red border on field

---

### 5.5 Mobile-Specific Considerations

#### Touch Targets
- All buttons: minimum 44x44px
- List items: minimum 48px height
- Form inputs: 48px height

#### Navigation
- Bottom sheet for modals (85% viewport height)
- Swipe gestures for list actions
- Pull-to-refresh on lists

#### Calendar Optimizations
- Simplified day view on phone (single column)
- Pinch-to-zoom for week/month views
- Floating action button for quick add

---

## 6. Technical Considerations

### 6.1 Database Schema Changes

```typescript
// New IndexedDB Tables (Dexie)

// Time-Off Types
timeOffTypes: '++id, salonId, name, isActive, syncStatus, [salonId+isActive]'

// Blocked Time Types
blockedTimeTypes: '++id, salonId, name, isActive, syncStatus, [salonId+isActive]'

// Blocked Time Entries
blockedTimeEntries: '++id, salonId, staffId, typeId, startDateTime, frequency, syncStatus, [salonId+staffId], [staffId+startDateTime]'

// Business Closed Periods
businessClosedPeriods: '++id, salonId, locationId, startDate, endDate, syncStatus, [salonId+startDate]'

// Resources
resources: '++id, salonId, locationId, category, isActive, syncStatus, [salonId+isActive]'

// Service-Resource Links
serviceResources: '++id, serviceId, resourceId, [serviceId], [resourceId]'

// Resource Bookings
resourceBookings: '++id, resourceId, appointmentId, startDateTime, [resourceId+startDateTime]'
```

### 6.2 API Endpoints (Future Backend Sync)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/time-off-types` | List time-off types |
| POST | `/api/time-off-types` | Create time-off type |
| PUT | `/api/time-off-types/{id}` | Update time-off type |
| DELETE | `/api/time-off-types/{id}` | Archive time-off type |
| GET | `/api/time-off-requests` | List time-off requests |
| POST | `/api/time-off-requests` | Submit time-off request |
| PUT | `/api/time-off-requests/{id}/approve` | Approve request |
| PUT | `/api/time-off-requests/{id}/deny` | Deny request |
| GET | `/api/blocked-time-types` | List blocked time types |
| POST | `/api/blocked-time-types` | Create blocked time type |
| GET | `/api/blocked-time-entries` | List blocked time entries |
| POST | `/api/blocked-time-entries` | Create blocked time entry |
| GET | `/api/closed-periods` | List closed periods |
| POST | `/api/closed-periods` | Create closed period |
| GET | `/api/resources` | List resources |
| POST | `/api/resources` | Create resource |

### 6.3 State Management

```typescript
// Redux Slice: scheduleSlice

interface ScheduleState {
  // Time-Off Types
  timeOffTypes: TimeOffType[];
  timeOffTypesLoading: boolean;
  timeOffTypesError: string | null;

  // Time-Off Requests
  timeOffRequests: TimeOffRequest[];
  pendingRequestsCount: number;
  timeOffRequestsLoading: boolean;

  // Blocked Time Types
  blockedTimeTypes: BlockedTimeType[];
  blockedTimeTypesLoading: boolean;

  // Blocked Time Entries
  blockedTimeEntries: BlockedTimeEntry[];
  blockedTimeEntriesLoading: boolean;

  // Closed Periods
  closedPeriods: BusinessClosedPeriod[];
  closedPeriodsLoading: boolean;

  // Resources
  resources: Resource[];
  resourcesLoading: boolean;

  // UI State
  selectedStaffForSchedule: string | null;
  scheduleViewMode: 'staff' | 'resource';
  scheduleTimeRange: { start: Date; end: Date };
}
```

### 6.4 Migration Strategy

1. **Version increment:** Bump IndexedDB version to trigger migration
2. **Create tables:** Add all new tables in single migration
3. **Seed defaults:** Populate default time-off and blocked time types
4. **Migrate existing:** Convert any existing time-off data to new structure
5. **Backward compatible:** Old data remains accessible during transition

### 6.5 Offline Support

| Operation | Offline Behavior |
|-----------|------------------|
| View schedules | Full support (cached data) |
| View time-off types | Full support (cached data) |
| Create time-off request | Queued, synced when online |
| Approve/deny requests | Queued, synced when online |
| Create blocked time | Queued, synced when online |
| Create closed period | Queued, synced when online |
| View reports | Cached data only |

---

## 7. Success Metrics & Analytics

### 7.1 Leading Indicators (Track Weekly)

| Metric | Definition | Target |
|--------|------------|--------|
| Time-off type adoption | % of time-off using custom types | > 80% within 1 month |
| Self-service rate | % of time-off requests by staff vs. manager | > 70% within 2 months |
| Blocked time usage | # of blocked time entries created/week | Baseline + 50% |
| Resource utilization | % of resource-required services with assigned resource | > 95% |

### 7.2 Lagging Indicators (Track Monthly)

| Metric | Definition | Target |
|--------|------------|--------|
| Scheduling time saved | Manager-reported hours on scheduling/week | < 30 min |
| Double-booking rate | % of appointments with conflicts | < 0.5% |
| Staff satisfaction | NPS for scheduling experience | > 40 |
| Time-off approval speed | Avg hours from request to decision | < 8 hours |

### 7.3 Event Tracking Plan

```javascript
// Time-Off Events
track('time_off_type_created', { type_id, is_paid, requires_approval, has_limit })
track('time_off_request_submitted', { type_id, days_requested, has_conflicts })
track('time_off_request_approved', { type_id, days_approved, approval_time_hours })
track('time_off_request_denied', { type_id, denial_reason })

// Blocked Time Events
track('blocked_time_type_created', { type_id, is_paid, default_duration })
track('blocked_time_created', { type_id, frequency, duration_minutes })

// Closed Period Events
track('closed_period_created', { duration_days, locations_count, appointments_affected })

// Resource Events
track('resource_created', { category, location_id })
track('resource_assigned', { resource_id, service_id, assignment_type: 'auto' | 'manual' })
track('resource_conflict_override', { resource_id })

// Report Events
track('working_hours_report_viewed', { date_range, staff_count })
track('working_hours_report_exported', { format: 'csv' })
```

---

## 8. Launch Plan

### 8.1 Release Strategy

| Phase | Scope | Timeline | Criteria |
|-------|-------|----------|----------|
| Alpha | Internal testing | Week 1-2 | All P0 features functional |
| Beta | 5 pilot salons | Week 3-4 | No critical bugs, > 80% task success |
| Limited GA | 20% of users | Week 5-6 | NPS > 30, < 5 support tickets/salon |
| Full GA | All users | Week 7+ | Stable metrics, < 2 critical bugs |

### 8.2 Feature Flags

```javascript
const FEATURE_FLAGS = {
  schedule_time_off_types: true,      // Phase 1
  schedule_blocked_time_types: true,  // Phase 2
  schedule_closed_periods: true,      // Phase 1
  schedule_multi_week_patterns: true, // Phase 2
  schedule_resources: false,          // Phase 3
  schedule_approval_workflow: true,   // Phase 2
  schedule_working_hours_report: false // Phase 3
};
```

### 8.3 Communication Plan

| Audience | Channel | Content | Timing |
|----------|---------|---------|--------|
| All users | In-app banner | "New scheduling features available!" | GA launch |
| Managers | Email | Feature walkthrough with screenshots | 1 week before GA |
| Staff | In-app tooltip | "You can now request time-off directly" | First visit post-GA |
| Support | Internal doc | FAQ, troubleshooting guide | 2 weeks before GA |

### 8.4 Training Materials

- **Video:** 5-minute feature overview
- **Help article:** Step-by-step guides for each feature
- **Tooltips:** Contextual hints on first use
- **Webinar:** Live Q&A session for managers (optional)

### 8.5 Support Readiness

| Item | Owner | Due Date |
|------|-------|----------|
| FAQ document | Support Lead | 2 weeks before GA |
| Support team training | Product | 1 week before GA |
| Escalation path defined | Engineering | Alpha start |
| Known issues documented | QA | Beta end |

---

## 9. Open Questions & Risks

### 9.1 Open Questions

| ID | Question | Owner | Due Date |
|----|----------|-------|----------|
| OQ-1 | Should time-off balances reset on calendar year or hire anniversary? | Product | Before Phase 1 |
| OQ-2 | Should staff see each other's time-off on calendar? | Product | Before Phase 1 |
| OQ-3 | Should blocked time be visible to clients on online booking? | Product | Before Phase 2 |
| OQ-4 | How far in advance should recurring blocked time be generated? | Engineering | Before Phase 2 |
| OQ-5 | Should resources support capacity > 1 (e.g., waiting area with 5 seats)? | Product | Before Phase 3 |

### 9.2 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IndexedDB migration fails | Low | High | Test migration on copy of production data, provide rollback |
| Performance degradation with large datasets | Medium | Medium | Implement pagination, lazy loading, indexing |
| Offline sync conflicts | Medium | Medium | Define conflict resolution rules, last-write-wins with user notification |
| Complex recurring event calculations | Medium | Low | Use proven library (e.g., rrule.js), comprehensive unit tests |

### 9.3 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low feature adoption | Medium | High | In-app onboarding, manager outreach, feature discovery |
| Feature complexity confuses users | Low | Medium | Progressive disclosure, sensible defaults, contextual help |
| Competitive response | Low | Low | Differentiate on UX simplicity, salon-specific workflows |

### 9.4 Mitigation Strategies

1. **Migration safety:** Run migration on staging with production data snapshot before any release
2. **Performance monitoring:** Add performance metrics to key operations, alert on degradation
3. **User feedback loop:** In-app feedback widget, proactive outreach to beta users
4. **Rollback capability:** Feature flags allow instant disable of new functionality

---

## 10. Appendix

### A. User Research Raw Data

*To be added after user interviews*

### B. Competitive Screenshots

*Reference: Fresha Help Center articles linked in implementation plan*

### C. Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Settings UI │ │ Calendar UI │ │ Time-Off/Blocked Modals ││
│  └──────┬──────┘ └──────┬──────┘ └───────────┬─────────────┘│
└─────────┼───────────────┼────────────────────┼──────────────┘
          │               │                    │
          ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redux Store (scheduleSlice)               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ timeOffTypes | blockedTimeTypes | closedPeriods | etc.  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│  │ scheduleService │ │ resourceService │ │ timeOffService │ │
│  └────────┬────────┘ └────────┬────────┘ └───────┬────────┘ │
└───────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                  │
            ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    IndexedDB (Dexie)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │timeOffTypes │ │blockedTime* │ │closedPeriods│ │resources││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Sync Queue → Backend API                  │
└─────────────────────────────────────────────────────────────┘
```

### D. Glossary

| Term | Definition |
|------|------------|
| Time-Off | Absence from work (vacation, sick leave, etc.) |
| Blocked Time | Calendar time blocked for non-appointment activities (breaks, training) |
| Closed Period | Business-wide closure affecting all staff |
| Resource | Physical asset required for service delivery (room, equipment) |
| Shift | Scheduled work period for a staff member |
| Multi-week Pattern | Schedule that repeats over 2, 3, or 4 weeks |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | Product Team | Initial draft |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Engineering Lead | | | |
| Design Lead | | | |
| QA Lead | | | |
