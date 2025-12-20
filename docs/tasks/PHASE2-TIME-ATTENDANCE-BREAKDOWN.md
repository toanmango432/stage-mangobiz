# Phase 2: Time & Attendance - Detailed Breakdown

> **Priority:** HIGH
> **Estimated Duration:** 4 weeks
> **Dependencies:** Phase 1 (Complete)
> **PRD Reference:** `docs/product/PRD-Team-Module.md` Section 6.4

---

## Overview

Phase 2 adds real-time time tracking to Mango POS, enabling:
- Staff clock in/out from Front Desk
- Break tracking (paid/unpaid)
- Timesheet management with approval workflow
- Overtime calculation (daily/weekly thresholds)
- Attendance alerts for managers

**Critical Integration:** Only clocked-in staff should appear in Turn Tracker (BR-TT-001)

---

## Task Breakdown

### Week 1: Foundation (Data Layer)

#### Task 1.1: Create Timesheet Types
**File:** `src/types/timesheet.ts`
**Effort:** S (Small)

```typescript
// Types to create:
- TimesheetStatus = 'pending' | 'approved' | 'disputed'
- BreakType = 'paid' | 'unpaid'
- AttendanceAlertType = 'late_arrival' | 'early_departure' | 'missed_clock_in' | 'extended_break' | 'no_show'
- BreakEntry (id, startTime, endTime, type, duration, label)
- HoursBreakdown (scheduled, actual, regular, overtime, breaks)
- TimesheetEntry extends BaseSyncableEntity
- AttendanceAlert
- OvertimeSettings
```

**Acceptance Criteria:**
- [ ] All types defined with proper JSDoc comments
- [ ] Extends BaseSyncableEntity for sync support
- [ ] Exported from src/types/index.ts

---

#### Task 1.2: Update Database Schema
**File:** `src/db/schema.ts`
**Effort:** S

**Changes:**
1. Add `timesheets` table declaration to `MangoPOSDatabase` class
2. Add new version migration (likely version 10)
3. Define indexes: `staffId`, `date`, `status`, `syncStatus`, `[staffId+date]`

```typescript
// Add to class
timesheets!: Table<TimesheetEntry, string>;

// Add new version
this.version(10).stores({
  ...existingStores,
  timesheets: '&id, staffId, date, status, syncStatus, [staffId+date]'
});
```

**Acceptance Criteria:**
- [ ] Table added to MangoPOSDatabase class
- [ ] Migration version incremented
- [ ] Compound index for staffId+date queries

---

#### Task 1.3: Create Timesheet Database Operations
**File:** `src/db/timesheetOperations.ts`
**Effort:** M (Medium)

**Follow pattern from:** `src/db/teamOperations.ts`

**Operations to implement:**
```typescript
export const timesheetDB = {
  // Read operations
  getAllEntries(storeId?: string): Promise<TimesheetEntry[]>
  getEntriesByStaff(staffId: string, dateFrom?: string, dateTo?: string): Promise<TimesheetEntry[]>
  getEntriesByDate(date: string, storeId?: string): Promise<TimesheetEntry[]>
  getEntriesByDateRange(startDate: string, endDate: string, storeId?: string): Promise<TimesheetEntry[]>
  getEntryById(id: string): Promise<TimesheetEntry | undefined>
  getActiveClockIn(staffId: string): Promise<TimesheetEntry | undefined>
  getPendingEntries(storeId?: string): Promise<TimesheetEntry[]>

  // Write operations
  clockIn(staffId: string, timestamp: string, userId: string, deviceId: string): Promise<TimesheetEntry>
  clockOut(entryId: string, timestamp: string, userId: string, deviceId: string): Promise<TimesheetEntry>
  startBreak(entryId: string, breakType: BreakType, userId: string, deviceId: string): Promise<TimesheetEntry>
  endBreak(entryId: string, userId: string, deviceId: string): Promise<TimesheetEntry>
  updateEntry(id: string, updates: Partial<TimesheetEntry>, userId: string, deviceId: string): Promise<TimesheetEntry>
  approveEntry(id: string, approvedBy: string, userId: string, deviceId: string): Promise<TimesheetEntry>
  disputeEntry(id: string, reason: string, userId: string, deviceId: string): Promise<TimesheetEntry>
  bulkApprove(ids: string[], approvedBy: string, userId: string, deviceId: string): Promise<void>

  // Sync operations
  markSynced(id: string, serverVersion: number): Promise<void>
  getEntriesPendingSync(storeId?: string): Promise<TimesheetEntry[]>
}
```

**Acceptance Criteria:**
- [ ] All CRUD operations implemented
- [ ] Sync queue integration (like teamOperations.ts)
- [ ] Vector clock support for conflict resolution
- [ ] Proper error handling

---

#### Task 1.4: Create Timesheet Redux Slice
**File:** `src/store/slices/timesheetSlice.ts`
**Effort:** L (Large)

**Follow pattern from:** `src/store/slices/teamSlice.ts`

**State structure:**
```typescript
interface TimesheetState {
  entries: Record<string, TimesheetEntry>;
  entryIds: string[];
  activeClockIns: Record<string, string>;  // staffId -> entryId
  alerts: AttendanceAlert[];

  ui: {
    selectedDate: string;
    selectedStaffId: string | null;
    viewMode: 'day' | 'week' | 'pay_period';
    filterStatus: 'all' | 'pending' | 'approved' | 'disputed';
  };

  loading: boolean;
  error: string | null;
  sync: {
    lastSyncAt: string | null;
    pendingChanges: number;
    syncStatus: 'idle' | 'syncing' | 'error';
  };
}
```

**Async Thunks:**
```typescript
fetchTimesheets(params: { storeId?: string; dateFrom?: string; dateTo?: string })
clockIn(params: { staffId: string; location?: GeoLocation })
clockOut(params: { staffId: string })
startBreak(params: { staffId: string; breakType: BreakType })
endBreak(params: { staffId: string })
approveTimesheet(params: { entryId: string })
disputeTimesheet(params: { entryId: string; reason: string })
bulkApproveTimesheets(params: { entryIds: string[] })
```

**Selectors:**
```typescript
selectTimesheetEntries
selectActiveClockIns
selectTimesheetsByDate
selectTimesheetsByStaff
selectPendingTimesheets
selectTimesheetAlerts
selectIsStaffClockedIn(staffId: string)
selectStaffActiveEntry(staffId: string)
```

**Acceptance Criteria:**
- [ ] State normalized by entry ID
- [ ] Optimistic updates with rollback
- [ ] activeClockIns tracking for quick lookup
- [ ] All selectors implemented

---

#### Task 1.5: Create Overtime Calculation Utility
**File:** `src/utils/overtimeCalculation.ts`
**Effort:** M

**Functions:**
```typescript
interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
}

// Calculate for a single day
calculateDailyOvertime(
  hoursWorked: number,
  settings: OvertimeSettings
): OvertimeResult

// Calculate for a week
calculateWeeklyOvertime(
  dailyHours: number[],  // Array of 7 days
  settings: OvertimeSettings
): OvertimeResult

// Calculate hours from timesheet entry
calculateTimesheetHours(
  entry: TimesheetEntry
): HoursBreakdown

// Deduct unpaid breaks
deductUnpaidBreaks(
  totalMinutes: number,
  breaks: BreakEntry[]
): number
```

**Business Rules:**
- BR-TS-002: Unpaid break time deducted from total hours
- BR-TS-003: Overtime after threshold (daily 8hrs or weekly 40hrs)

**Acceptance Criteria:**
- [ ] Daily overtime calculation (>8 hrs)
- [ ] Weekly overtime calculation (>40 hrs)
- [ ] Combined mode (whichever triggers first)
- [ ] Double time support (>12 hrs)
- [ ] Unit tests for all calculation scenarios

---

### Week 2: Clock In/Out UI

#### Task 2.1: Create ClockInOutWidget Component
**File:** `src/components/timesheet/ClockInOutWidget.tsx`
**Effort:** M

**Purpose:** Compact widget shown on Front Desk for quick clock in/out

**Props:**
```typescript
interface ClockInOutWidgetProps {
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  compact?: boolean;  // For header vs sidebar
}
```

**States to display:**
1. Not clocked in → Show "Clock In" button
2. Clocked in, not on break → Show duration + "Start Break" + "Clock Out"
3. On break → Show break duration + "End Break"

**UI Mockup:**
```
┌─────────────────────────────────┐
│ 👤 Sarah M.                     │
│ Clocked in: 9:02 AM (4h 32m)    │
│ [Start Break]  [Clock Out]      │
└─────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Shows current clock status
- [ ] Real-time duration update (every minute)
- [ ] Clock in/out with loading states
- [ ] Break start/end functionality
- [ ] Error handling with toast notifications

---

#### Task 2.2: Create ClockInOutPanel Component
**File:** `src/components/timesheet/ClockInOutPanel.tsx`
**Effort:** M

**Purpose:** Full panel showing all staff clock status (for managers)

**Features:**
- List all active staff
- Show who's clocked in, on break, not clocked in
- Quick actions for each staff member
- Filter: All / Clocked In / On Break / Not Clocked In

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ STAFF STATUS          [Filter: All ▼]       │
├─────────────────────────────────────────────┤
│ ● Sarah M.    In: 9:02 AM   4h 32m  [Out]   │
│ ◐ John D.     Break: 12:15  0h 45m  [End]   │
│ ○ Lisa K.     Not clocked in        [In]    │
│ ● Mike R.     In: 8:45 AM   5h 15m  [Out]   │
├─────────────────────────────────────────────┤
│ ● = Working  ◐ = On Break  ○ = Not In       │
└─────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Shows all staff with status indicators
- [ ] Filter by status
- [ ] Manager can clock in/out for others (with permission check)
- [ ] Real-time updates

---

#### Task 2.3: Integrate with Turn Tracker
**File:** `src/components/TurnTracker/TurnTracker.tsx` (modify)
**Effort:** M

**Business Rule:** BR-TT-001 - Only clocked-in staff appear in turn tracker

**Changes:**
1. Import `selectActiveClockIns` from timesheetSlice
2. Filter staff list to only show clocked-in staff
3. Show indicator for staff on break (reduced visibility or badge)

**Before:**
```typescript
const allStaff = useSelector(selectActiveTeamMembers);
// Shows all active staff
```

**After:**
```typescript
const allStaff = useSelector(selectActiveTeamMembers);
const activeClockIns = useSelector(selectActiveClockIns);

const clockedInStaff = allStaff.filter(staff =>
  activeClockIns[staff.id] !== undefined
);
// Only shows clocked-in staff
```

**Acceptance Criteria:**
- [ ] Only clocked-in staff appear in Turn Tracker
- [ ] Staff on break shown with visual indicator
- [ ] Smooth transition when staff clocks in/out
- [ ] Empty state when no staff clocked in

---

#### Task 2.4: Add Clock Widget to Front Desk Header
**File:** `src/components/FrontDesk.tsx` or header component (modify)
**Effort:** S

**Changes:**
1. Add small clock indicator in header
2. Show count of clocked-in staff
3. Clicking opens ClockInOutPanel modal/sidebar

**Acceptance Criteria:**
- [ ] Clock icon with staff count in header
- [ ] Opens panel on click
- [ ] Updates in real-time

---

### Week 3: Timesheet Dashboard & Approval

#### Task 3.1: Create TimesheetDashboard Component
**File:** `src/components/timesheet/TimesheetDashboard.tsx`
**Effort:** L

**Purpose:** Full-page dashboard for viewing and managing timesheets

**Features:**
- Week view (default) with day/pay period options
- Shows all staff with hours per day
- Highlights variances from schedule
- Pending approval indicators
- Export to CSV

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ TIMESHEETS           [Week ▼] Dec 2-8, 2024    [Export CSV] │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All Staff ▼] [All Status ▼]    [◀ Prev] [Next ▶]  │
├─────────────────────────────────────────────────────────────┤
│ Staff      │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat │ Total │
├────────────┼──────┼──────┼──────┼──────┼──────┼─────┼───────┤
│ Sarah M.   │ 8.0  │ 8.5⚠ │ OFF  │ 8.0  │ 9.0● │ 6.0 │ 39.5  │
│   Overtime │  -   │  -   │  -   │  -   │ 1.0  │  -  │  1.0  │
├────────────┼──────┼──────┼──────┼──────┼──────┼─────┼───────┤
│ John D.    │ 8.0  │ 7.5⚠ │ 8.0  │ 8.0● │ OFF  │ 8.0 │ 39.5  │
└─────────────────────────────────────────────────────────────┘
● = Pending approval  ⚠ = Variance from schedule
                                         [Approve Selected]
```

**Acceptance Criteria:**
- [ ] Week/day/pay period view toggle
- [ ] Shows scheduled vs actual hours
- [ ] Variance highlighting
- [ ] Click cell to view/edit entry details
- [ ] Bulk selection for approval
- [ ] Export functionality

---

#### Task 3.2: Create TimesheetRow Component
**File:** `src/components/timesheet/TimesheetRow.tsx`
**Effort:** S

**Purpose:** Individual row in timesheet dashboard

**Props:**
```typescript
interface TimesheetRowProps {
  staffId: string;
  staffName: string;
  entries: TimesheetEntry[];  // For the week
  scheduledHours: number[];   // Expected hours per day
  onCellClick: (date: string, entry?: TimesheetEntry) => void;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}
```

**Acceptance Criteria:**
- [ ] Shows hours per day cell
- [ ] Variance indicators
- [ ] Status badges (pending/approved)
- [ ] Selection checkbox
- [ ] Click to open detail modal

---

#### Task 3.3: Create TimesheetDetailModal Component
**File:** `src/components/timesheet/TimesheetDetailModal.tsx`
**Effort:** M

**Purpose:** View/edit individual timesheet entry

**Features:**
- Show clock in/out times
- List all breaks with durations
- Edit times (manager only)
- Approve/dispute actions
- Notes field

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│ TIMESHEET DETAIL              [×]           │
│ Sarah M. - Monday, Dec 2, 2024              │
├─────────────────────────────────────────────┤
│ Scheduled:  9:00 AM - 5:00 PM (8.0 hrs)     │
│ Actual:     9:02 AM - 5:15 PM (8.2 hrs)     │
│                                             │
│ Breaks:                                     │
│   Lunch (unpaid)  12:00 - 12:30  (30 min)   │
│   Break (paid)    3:00 - 3:15    (15 min)   │
│                                             │
│ Summary:                                    │
│   Regular Hours:    8.0                     │
│   Overtime:         0.0                     │
│   Break Time:       45 min                  │
│                                             │
│ Status: Pending                             │
│ Notes: [                              ]     │
├─────────────────────────────────────────────┤
│ [Dispute]              [Approve]            │
└─────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Shows all timesheet details
- [ ] Edit capability for managers
- [ ] Break list with add/remove
- [ ] Approve/dispute actions
- [ ] Notes field

---

#### Task 3.4: Create TimesheetApprovalModal Component
**File:** `src/components/timesheet/TimesheetApprovalModal.tsx`
**Effort:** S

**Purpose:** Bulk approval confirmation

**Features:**
- List selected entries for approval
- Show total hours being approved
- Confirm/cancel actions

**Acceptance Criteria:**
- [ ] Shows summary of selected entries
- [ ] Confirms bulk approval
- [ ] Success/error feedback

---

#### Task 3.5: Add TimesheetSection to Team Settings
**File:** `src/components/team-settings/sections/TimesheetSection.tsx`
**Effort:** M

**Purpose:** Individual staff timesheet view in Team Settings

**Follow pattern from:** `ScheduleSection.tsx`

**Features:**
- Shows selected staff member's timesheets
- Recent entries (last 2 weeks)
- Hours summary
- Link to full dashboard

**Acceptance Criteria:**
- [ ] Shows recent timesheets for selected member
- [ ] Summary statistics
- [ ] Approve individual entries
- [ ] Link to full dashboard

---

### Week 4: Alerts, Reports & Polish

#### Task 4.1: Create AttendanceAlert Component
**File:** `src/components/timesheet/AttendanceAlert.tsx`
**Effort:** S

**Purpose:** Display attendance alerts to managers

**Alert Types:**
- Late arrival (>5 min after scheduled start)
- Early departure (>15 min before scheduled end)
- Missed clock in (scheduled shift, no clock in)
- Extended break (>5 min over scheduled break)
- No show (scheduled but didn't work)

**Acceptance Criteria:**
- [ ] Shows alert type with icon
- [ ] Staff name and timestamp
- [ ] Dismiss/acknowledge action
- [ ] Link to related timesheet

---

#### Task 4.2: Create Attendance Alerts Panel
**File:** `src/components/timesheet/AttendanceAlertsPanel.tsx`
**Effort:** M

**Purpose:** List of all current alerts for managers

**Features:**
- List unresolved alerts
- Filter by type
- Bulk dismiss
- Real-time updates

**Acceptance Criteria:**
- [ ] Shows all unresolved alerts
- [ ] Sort by timestamp
- [ ] Dismiss individual or bulk
- [ ] Empty state when no alerts

---

#### Task 4.3: Create Timesheet Reports
**File:** `src/components/reports/TimesheetReport.tsx`
**Effort:** M

**Reports:**
1. **Hours Summary** - Total hours by staff for period
2. **Overtime Report** - Overtime hours by staff
3. **Attendance Report** - Late arrivals, early departures
4. **Break Report** - Break time by staff

**Acceptance Criteria:**
- [ ] Date range selection
- [ ] Staff filter
- [ ] Export to CSV
- [ ] Print-friendly view

---

#### Task 4.4: Add Alert Badge to Header
**File:** Modify header component
**Effort:** S

**Features:**
- Bell icon with unread count
- Clicking opens alerts panel
- Clears when viewed

**Acceptance Criteria:**
- [ ] Badge shows unread count
- [ ] Opens panel on click
- [ ] Updates in real-time

---

#### Task 4.5: Integration Testing & Bug Fixes
**Effort:** M

**Test Scenarios:**
1. Clock in → appears in Turn Tracker
2. Clock out → disappears from Turn Tracker
3. Start break → still visible but marked
4. End break → normal visibility
5. Overtime calculation accuracy
6. Approval workflow
7. Offline mode functionality

**Acceptance Criteria:**
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Offline operations work
- [ ] Data syncs correctly

---

## Validation Checkpoints

### Week 1 Checkpoint
**How to Validate:**
1. Open browser DevTools → Application → IndexedDB
2. Check `mango_biz_store_app` database has `timesheets` table
3. Run in console: `await db.timesheets.count()` - should return 0
4. Check Redux DevTools for `timesheet` slice state

**Expected Results:**
- [ ] Database has `timesheets` table
- [ ] Redux state initializes correctly
- [ ] No TypeScript errors

---

### Week 2 Checkpoint
**How to Validate:**
1. Navigate to Front Desk
2. Find clock widget in header
3. Click to open ClockInOutPanel
4. Clock in as a staff member
5. Check Turn Tracker - staff should appear
6. Start a break - staff should show break indicator
7. Clock out - staff should disappear from Turn Tracker

**Expected Results:**
- [ ] Clock widget visible in header
- [ ] Can clock in/out
- [ ] Turn Tracker updates correctly
- [ ] Breaks work correctly

---

### Week 3 Checkpoint
**How to Validate:**
1. Go to Admin → Team Settings → Select staff
2. Find Timesheet tab
3. View recent timesheets
4. Go to full Timesheet Dashboard (from menu or link)
5. View week of timesheets
6. Click a cell to open detail modal
7. Approve a pending entry
8. Check status updates

**Expected Results:**
- [ ] Dashboard shows week view
- [ ] Detail modal opens
- [ ] Approval works
- [ ] Status updates correctly

---

### Week 4 Checkpoint
**How to Validate:**
1. Create a late arrival scenario (clock in 10 min late)
2. Check alerts panel - should show late arrival alert
3. Dismiss the alert
4. Run overtime report
5. Test offline mode - clock in while offline, sync when online

**Expected Results:**
- [ ] Alerts generate correctly
- [ ] Reports show accurate data
- [ ] Offline mode works

---

## File Summary

### New Files (13)
```
src/types/timesheet.ts
src/db/timesheetOperations.ts
src/store/slices/timesheetSlice.ts
src/utils/overtimeCalculation.ts
src/components/timesheet/ClockInOutWidget.tsx
src/components/timesheet/ClockInOutPanel.tsx
src/components/timesheet/TimesheetDashboard.tsx
src/components/timesheet/TimesheetRow.tsx
src/components/timesheet/TimesheetDetailModal.tsx
src/components/timesheet/TimesheetApprovalModal.tsx
src/components/timesheet/AttendanceAlert.tsx
src/components/timesheet/AttendanceAlertsPanel.tsx
src/components/team-settings/sections/TimesheetSection.tsx
```

### Modified Files (4)
```
src/db/schema.ts                    # Add timesheets table
src/types/index.ts                  # Export timesheet types
src/components/TurnTracker/TurnTracker.tsx  # Filter by clocked-in
src/components/FrontDesk.tsx        # Add clock widget
```

---

## Success Criteria

Phase 2 is complete when:
- [ ] Staff can clock in/out from Front Desk
- [ ] Only clocked-in staff appear in Turn Tracker
- [ ] Breaks can be started/ended
- [ ] Managers can view timesheet dashboard
- [ ] Managers can approve/dispute timesheets
- [ ] Overtime calculates correctly (daily/weekly)
- [ ] Attendance alerts show for variances
- [ ] All operations work offline
- [ ] Data syncs correctly when online

---

*Phase 2 Breakdown v1.0 - Created for Mango POS Team Module*
