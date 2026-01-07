# Team Module Implementation Guide

## Overview

The Team Module provides backend services for staff management including timesheets, payroll, turn tracking, time-off requests, and staff ratings. All services are accessed through `dataService`.

## Quick Start

```typescript
import { dataService } from '@/services/dataService';

// Clock in a staff member
await dataService.timesheets.clockIn(staffId, date, '09:00', { lat: 37.7749, lng: -122.4194 });

// Record a turn for walk-in distribution
await dataService.turnLogs.record(staffId, 'walk_in', { clientId, ticketId, amount: 75 });

// Create a time-off request
await dataService.timeOffRequests.create(requestData);
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Component                                                   │
│       ↓                                                      │
│  Redux Thunk (dispatch action)                              │
│       ↓                                                      │
│  dataService.{service}.{method}()                           │
│       ↓                                                      │
│  Supabase Table Service (CRUD operations)                   │
│       ↓                                                      │
│  Type Adapter (snake_case → camelCase)                      │
│       ↓                                                      │
│  PostgreSQL (Supabase)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Services

### 1. Timesheets Service

Manages staff clock in/out and break tracking.

```typescript
// Clock in
await dataService.timesheets.clockIn(staffId, date, clockInTime, location);

// Clock out
await dataService.timesheets.clockOut(staffId, date, clockOutTime, location);

// Add a break
await dataService.timesheets.addBreak(timesheetId, breakEntry);

// Approve timesheet
await dataService.timesheets.approve(timesheetId, approvedBy);

// Dispute timesheet
await dataService.timesheets.dispute(timesheetId, reason);
```

### 2. Pay Runs Service

Handles payroll processing lifecycle.

```typescript
// Create a pay run
const payRun = await dataService.payRuns.create(payRunData);

// Submit for approval
await dataService.payRuns.submit(payRunId, submittedBy);

// Approve pay run
await dataService.payRuns.approve(payRunId, approvedBy, notes);

// Process payments
await dataService.payRuns.process(payRunId, processedBy);

// Void if needed
await dataService.payRuns.void(payRunId, voidedBy, reason);
```

### 3. Turn Logs Service

Tracks walk-in turn distribution for fair staff assignment.

```typescript
// Record a turn
await dataService.turnLogs.record(staffId, 'walk_in', {
  clientId: 'client-001',
  ticketId: 'ticket-001',
  amount: 75.00,
  services: ['Haircut', 'Shampoo']
});

// Void a turn
await dataService.turnLogs.void(turnId, voidedBy, reason);

// Get daily totals
const totals = await dataService.turnLogs.getDailyTotals(date);
```

### 4. Time Off Requests Service

Manages vacation, sick leave, and PTO requests.

```typescript
// Create request
await dataService.timeOffRequests.create(requestData);

// Approve request
await dataService.timeOffRequests.approve(requestId, reviewedBy, notes);

// Deny request
await dataService.timeOffRequests.deny(requestId, reviewedBy, reason);

// Cancel request
await dataService.timeOffRequests.cancel(requestId, cancelledBy, reason);

// Get pending requests
const pending = await dataService.timeOffRequests.getPending();
```

### 5. Staff Ratings Service

Handles customer ratings and reviews for staff members.

```typescript
// Create a rating
await dataService.staffRatings.create(ratingData);

// Approve rating (make public)
await dataService.staffRatings.approve(ratingId, moderatedBy);

// Flag for review
await dataService.staffRatings.flag(ratingId, moderatedBy, reason);

// Add staff response
await dataService.staffRatings.addResponse(ratingId, staffId, responseText);

// Get aggregate stats
const stats = await dataService.staffRatings.getAggregates(staffId);
```

---

## Type Adapters

All adapters convert between Supabase snake_case rows and app camelCase types:

| Adapter | Converts |
|---------|----------|
| `timesheetAdapter` | `TimesheetRow` ↔ `TimesheetEntry` |
| `payRunAdapter` | `PayRunRow` ↔ `PayRun` |
| `turnLogAdapter` | `TurnLogRow` ↔ `TurnEntry` |
| `timeOffRequestAdapter` | `TimeOffRequestRow` ↔ `TimeOffRequest` |
| `staffRatingAdapter` | `StaffRatingRow` ↔ `StaffRating` |

### Usage Example

```typescript
import { toTimesheet, toTimesheetInsert } from '@/services/supabase/adapters';

// Convert row from Supabase to app type
const entry = toTimesheet(row);

// Convert app type to insert format
const insert = toTimesheetInsert(entry, storeId);
```

---

## Error Handling

All services throw errors with descriptive messages:

```typescript
try {
  await dataService.timesheets.clockIn(staffId, date, time, location);
} catch (error) {
  if (error.message.includes('already clocked in')) {
    // Handle duplicate clock-in
  }
  // Handle other errors
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/services/dataService.ts` | Unified data access layer |
| `src/services/supabase/tables/*.ts` | Table-specific CRUD operations |
| `src/services/supabase/adapters/*.ts` | Type conversion functions |
| `src/services/supabase/types.ts` | Supabase row type definitions |

---

*Last updated: January 2026*
