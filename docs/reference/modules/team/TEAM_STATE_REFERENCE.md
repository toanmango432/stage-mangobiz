# Team Module State Reference

## Redux Store Structure

The Team Module uses three Redux slices for state management.

---

## Slices Overview

| Slice | File | Purpose |
|-------|------|---------|
| `team` | `teamSlice.ts` | Staff data, roles, permissions |
| `timesheet` | `timesheetSlice.ts` | Clock in/out, breaks, hours |
| `payroll` | `payrollSlice.ts` | Pay runs, payments, totals |

---

## Team Slice

**File:** `src/store/slices/teamSlice.ts`

### State Shape

```typescript
interface TeamState {
  members: TeamMember[];
  selectedMemberId: string | null;
  filters: {
    role: StaffRole | 'all';
    status: 'active' | 'inactive' | 'all';
    search: string;
  };
  loading: boolean;
  error: string | null;
}
```

### Key Selectors

```typescript
// Get all team members
const members = useAppSelector(state => state.team.members);

// Get active staff only
const activeStaff = useAppSelector(state =>
  state.team.members.filter(m => m.status === 'active')
);

// Get by role
const technicians = useAppSelector(state =>
  state.team.members.filter(m => m.role === 'technician')
);
```

### Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `fetchTeamMembers` | `storeId` | Load all team members |
| `addMember` | `TeamMember` | Add new member |
| `updateMember` | `{ id, updates }` | Update member |
| `removeMember` | `id` | Remove member |
| `setFilters` | `Partial<Filters>` | Update filters |

---

## Timesheet Slice

**File:** `src/store/slices/timesheetSlice.ts`

### State Shape

```typescript
interface TimesheetState {
  entries: TimesheetEntry[];
  selectedDate: string;
  clockedInStaff: string[];
  loading: boolean;
  error: string | null;
}
```

### Key Selectors

```typescript
// Get entries for selected date
const entries = useAppSelector(state => state.timesheet.entries);

// Get clocked-in staff IDs
const clockedIn = useAppSelector(state => state.timesheet.clockedInStaff);

// Check if staff is clocked in
const isStaffClockedIn = (staffId: string) =>
  useAppSelector(state => state.timesheet.clockedInStaff.includes(staffId));
```

### Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `fetchTimesheets` | `{ date, storeId }` | Load timesheets for date |
| `clockIn` | `{ staffId, time, location }` | Clock in staff |
| `clockOut` | `{ timesheetId, time, location }` | Clock out staff |
| `addBreak` | `{ timesheetId, break }` | Add break |
| `endBreak` | `{ timesheetId, breakId }` | End break |
| `approveTimesheet` | `{ id, approvedBy }` | Approve entry |
| `disputeTimesheet` | `{ id, reason }` | Dispute entry |
| `setSelectedDate` | `date: string` | Change selected date |

---

## Payroll Slice

**File:** `src/store/slices/payrollSlice.ts`

### State Shape

```typescript
interface PayrollState {
  payRuns: PayRun[];
  currentPayRun: PayRun | null;
  selectedPeriod: {
    start: string;
    end: string;
  };
  loading: boolean;
  error: string | null;
}
```

### Key Selectors

```typescript
// Get all pay runs
const payRuns = useAppSelector(state => state.payroll.payRuns);

// Get current/draft pay run
const currentPayRun = useAppSelector(state => state.payroll.currentPayRun);

// Get by status
const pendingApproval = useAppSelector(state =>
  state.payroll.payRuns.filter(pr => pr.status === 'submitted')
);
```

### Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `fetchPayRuns` | `storeId` | Load all pay runs |
| `createPayRun` | `PayRun` data | Create new pay run |
| `submitPayRun` | `{ id, submittedBy }` | Submit for approval |
| `approvePayRun` | `{ id, approvedBy, notes }` | Approve pay run |
| `rejectPayRun` | `{ id, rejectedBy, reason }` | Reject pay run |
| `processPayRun` | `{ id, processedBy }` | Process payments |
| `voidPayRun` | `{ id, voidedBy, reason }` | Void pay run |
| `setSelectedPeriod` | `{ start, end }` | Change period |

---

## Usage Examples

### Clock In/Out

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clockIn, clockOut } from '@/store/slices/timesheetSlice';

function ClockButton({ staffId }: { staffId: string }) {
  const dispatch = useAppDispatch();
  const clockedIn = useAppSelector(state =>
    state.timesheet.clockedInStaff.includes(staffId)
  );

  const handleClick = () => {
    if (clockedIn) {
      dispatch(clockOut({ staffId, time: new Date().toISOString() }));
    } else {
      dispatch(clockIn({ staffId, time: new Date().toISOString() }));
    }
  };

  return (
    <button onClick={handleClick}>
      {clockedIn ? 'Clock Out' : 'Clock In'}
    </button>
  );
}
```

### Pay Run Management

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createPayRun,
  submitPayRun,
  approvePayRun
} from '@/store/slices/payrollSlice';

function PayRunActions({ payRunId }: { payRunId: string }) {
  const dispatch = useAppDispatch();
  const payRun = useAppSelector(state =>
    state.payroll.payRuns.find(pr => pr.id === payRunId)
  );

  const handleSubmit = () => {
    dispatch(submitPayRun({ id: payRunId, submittedBy: currentUserId }));
  };

  const handleApprove = () => {
    dispatch(approvePayRun({
      id: payRunId,
      approvedBy: currentUserId,
      notes: 'Approved'
    }));
  };

  return (
    <div>
      {payRun?.status === 'draft' && (
        <button onClick={handleSubmit}>Submit</button>
      )}
      {payRun?.status === 'submitted' && (
        <button onClick={handleApprove}>Approve</button>
      )}
    </div>
  );
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/store/slices/teamSlice.ts` | Team member state |
| `src/store/slices/timesheetSlice.ts` | Timesheet state |
| `src/store/slices/payrollSlice.ts` | Payroll state |
| `src/store/hooks.ts` | Typed dispatch/selector hooks |
| `src/types/team.ts` | Team type definitions |
| `src/types/timesheet.ts` | Timesheet type definitions |
| `src/types/payroll.ts` | Payroll type definitions |

---

*Last updated: January 2026*
