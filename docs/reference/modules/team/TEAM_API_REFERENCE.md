# Team Module API Reference

## Services Overview

All services are accessed via `dataService` from `@/services/dataService`.

---

## Timesheets Service

**Access:** `dataService.timesheets`

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getByDate(date, storeId?)` | `date: string`, `storeId?: string` | `TimesheetEntry[]` | Get all timesheets for a date |
| `getByStaff(staffId, startDate, endDate)` | `staffId: string`, dates | `TimesheetEntry[]` | Get staff timesheets in range |
| `clockIn(staffId, date, time, location?)` | IDs, time, location | `TimesheetEntry` | Clock in staff member |
| `clockOut(timesheetId, time, location?)` | ID, time, location | `TimesheetEntry` | Clock out staff member |
| `addBreak(timesheetId, break)` | ID, `BreakEntry` | `TimesheetEntry` | Add break to timesheet |
| `endBreak(timesheetId, breakId)` | IDs | `TimesheetEntry` | End active break |
| `approve(timesheetId, approvedBy)` | IDs | `TimesheetEntry` | Approve timesheet |
| `dispute(timesheetId, reason)` | ID, reason | `TimesheetEntry` | Dispute timesheet |
| `updateHours(timesheetId, hours)` | ID, `HoursBreakdown` | `TimesheetEntry` | Update hours breakdown |

---

## Pay Runs Service

**Access:** `dataService.payRuns`

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getAll(storeId?)` | `storeId?: string` | `PayRun[]` | Get all pay runs |
| `getById(id)` | `id: string` | `PayRun \| null` | Get pay run by ID |
| `getByPeriod(start, end)` | dates | `PayRun[]` | Get pay runs in period |
| `create(payRun)` | `PayRun` data | `PayRun` | Create new pay run |
| `update(id, updates)` | ID, `Partial<PayRun>` | `PayRun` | Update pay run |
| `submit(id, submittedBy)` | IDs | `PayRun` | Submit for approval |
| `approve(id, approvedBy, notes?)` | IDs, notes | `PayRun` | Approve pay run |
| `reject(id, rejectedBy, reason)` | IDs, reason | `PayRun` | Reject pay run |
| `process(id, processedBy)` | IDs | `PayRun` | Process payments |
| `void(id, voidedBy, reason)` | IDs, reason | `PayRun` | Void pay run |

### Pay Run Status Flow

```
draft → submitted → approved → processed
                  ↘ rejected
                            ↘ voided (any status)
```

---

## Turn Logs Service

**Access:** `dataService.turnLogs`

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getByDate(date, storeId?)` | date, storeId | `TurnEntry[]` | Get turns for date |
| `getByStaff(staffId, startDate, endDate)` | IDs, dates | `TurnEntry[]` | Get staff turns |
| `record(staffId, turnType, details)` | ID, type, details | `TurnEntry` | Record new turn |
| `void(turnId, voidedBy, reason)` | IDs, reason | `TurnEntry` | Void a turn |
| `getDailyTotals(date, storeId?)` | date, storeId | `DailyTurnTotals` | Get daily totals |
| `getStaffTotals(staffId, date)` | IDs, date | `StaffTurnTotals` | Get staff totals |

### Turn Types

| Type | Description | Turn Value |
|------|-------------|------------|
| `walk_in` | Walk-in customer | 1.0 |
| `appointment` | Scheduled appointment | 1.0 |
| `checkout` | Quick checkout | 0.5 |
| `bonus` | Bonus turn | Variable |
| `adjustment` | Manual adjustment | Variable |
| `void` | Voided turn | Negative |

---

## Time Off Requests Service

**Access:** `dataService.timeOffRequests`

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getByStaff(staffId)` | `staffId: string` | `TimeOffRequest[]` | Get staff requests |
| `getPending(storeId?)` | `storeId?: string` | `TimeOffRequest[]` | Get pending requests |
| `getByDateRange(start, end)` | dates | `TimeOffRequest[]` | Get requests in range |
| `create(request)` | request data | `TimeOffRequest` | Create new request |
| `update(id, updates)` | ID, updates | `TimeOffRequest` | Update request |
| `approve(id, reviewedBy, notes?)` | IDs, notes | `TimeOffRequest` | Approve request |
| `deny(id, reviewedBy, reason)` | IDs, reason | `TimeOffRequest` | Deny request |
| `cancel(id, cancelledBy, reason?)` | IDs, reason | `TimeOffRequest` | Cancel request |

### Request Types

| Type ID | Display Name | Paid |
|---------|--------------|------|
| `vacation` | Vacation | Yes |
| `sick` | Sick Leave | Yes |
| `personal` | Personal | No |
| `unpaid` | Unpaid Leave | No |
| `bereavement` | Bereavement | Yes |
| `jury_duty` | Jury Duty | Yes |

---

## Staff Ratings Service

**Access:** `dataService.staffRatings`

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getByStaff(staffId)` | `staffId: string` | `StaffRating[]` | Get staff ratings |
| `getByStore(storeId?)` | `storeId?: string` | `StaffRating[]` | Get store ratings |
| `create(rating)` | rating data | `StaffRating` | Create new rating |
| `update(id, updates)` | ID, updates | `StaffRating` | Update rating |
| `approve(id, moderatedBy)` | IDs | `StaffRating` | Approve rating |
| `reject(id, moderatedBy, reason)` | IDs, reason | `StaffRating` | Reject rating |
| `flag(id, moderatedBy, reason)` | IDs, reason | `StaffRating` | Flag for review |
| `hide(id, moderatedBy)` | IDs | `StaffRating` | Hide rating |
| `addResponse(id, staffId, text)` | IDs, text | `StaffRating` | Add response |
| `getAggregates(staffId)` | `staffId: string` | `RatingAggregates` | Get stats |

### Rating Status

| Status | Description |
|--------|-------------|
| `active` | Visible to public |
| `pending_review` | Awaiting moderation |
| `flagged` | Flagged for review |
| `hidden` | Hidden from public |
| `removed` | Permanently removed |

---

## Type Definitions

### TimesheetEntry

```typescript
interface TimesheetEntry {
  id: string;
  storeId: string;
  staffId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualClockIn: string | null;
  actualClockOut: string | null;
  breaks: BreakEntry[];
  hours: HoursBreakdown;
  status: 'pending' | 'approved' | 'disputed';
  approvedBy?: string;
  approvedAt?: string;
  disputeReason?: string;
  notes?: string;
  clockInLocation?: { lat: number; lng: number };
  clockOutLocation?: { lat: number; lng: number };
}
```

### PayRun

```typescript
interface PayRun {
  id: string;
  storeId: string;
  periodStart: string;
  periodEnd: string;
  periodType: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed' | 'voided';
  staffPayments: StaffPayment[];
  totals: PayRunTotals;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  processedAt?: string;
  processedBy?: string;
}
```

### TurnEntry

```typescript
interface TurnEntry {
  id: string;
  storeId: string;
  staffId: string;
  date: string;
  timestamp: string;
  turnNumber: number;
  turnType: 'walk_in' | 'appointment' | 'checkout' | 'bonus' | 'adjustment' | 'void';
  turnValue: number;
  amount: number;
  clientName: string;
  services: string[];
  ticketId: string;
  isVoided: boolean;
}
```

### TimeOffRequest

```typescript
interface TimeOffRequest {
  id: string;
  storeId: string;
  staffId: string;
  typeId: string;
  typeName: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  totalHours: number;
  totalDays: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  deniedBy?: string;
  deniedAt?: string;
  denialReason?: string;
}
```

### StaffRating

```typescript
interface StaffRating {
  id: string;
  storeId: string;
  staffId: string;
  clientId: string | null;
  clientName: string | null;
  rating: number;
  reviewText: string | null;
  isPublic: boolean;
  isVerified: boolean;
  status: 'active' | 'pending_review' | 'flagged' | 'hidden' | 'removed';
  responseText?: string;
  responseBy?: string;
  responseAt?: string;
  servicesPerformed: string[];
  serviceDate: string | null;
  source: 'in_app' | 'online_booking' | 'google' | 'yelp' | 'imported';
}
```

---

*Last updated: January 2026*
