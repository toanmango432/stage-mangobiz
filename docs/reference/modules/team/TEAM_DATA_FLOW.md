# Team Module Data Flow

## Overview

The Team Module uses a Supabase-first architecture for accuracy-critical operations like payroll and timesheets.

---

## Architecture Decision

**Why Supabase-First (Not Offline-First)?**

Team module operations require:
1. **Payroll Accuracy**: Financial calculations must be consistent
2. **Time Verification**: Clock in/out needs server timestamp validation
3. **Approval Workflows**: Manager approvals require online connectivity
4. **Audit Trail**: All mutations tracked with user, device, timestamp

```
┌─────────────────────────────────────────────────────────────────────┐
│  TEAM MODULE (Online-First)          │  OPERATIONS (Offline-First) │
│                                       │                             │
│  Redux → dataService → Supabase      │  Redux → IndexedDB → Sync   │
│                                       │                             │
│  Timesheets, PayRuns, Ratings        │  Appointments, Tickets      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Clock In Flow

```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────┐
│  Staff  │───▶│  Button  │───▶│  Redux      │───▶│ Supabase │
│  Taps   │    │  Click   │    │  Thunk      │    │  Insert  │
└─────────┘    └──────────┘    └─────────────┘    └──────────┘
                                     │                  │
                                     ▼                  ▼
                              ┌─────────────┐    ┌──────────┐
                              │  Update     │◀───│ Response │
                              │  UI State   │    │  Row     │
                              └─────────────┘    └──────────┘
```

**Flow:**
1. Staff taps "Clock In" button
2. Component dispatches `clockIn` thunk
3. Thunk calls `dataService.timesheets.clockIn()`
4. Service creates entry in Supabase `timesheets` table
5. Adapter converts response to `TimesheetEntry`
6. Redux state updated, UI reflects change

### 2. Turn Recording Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Ticket     │───▶│  recordTurn  │───▶│  turn_logs  │
│  Checkout   │    │  Thunk       │    │  Table      │
└─────────────┘    └──────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌──────────────┐    ┌─────────────┐
                   │  Update      │◀───│  Turn Entry │
                   │  Queue State │    │  Created    │
                   └──────────────┘    └─────────────┘
```

**Flow:**
1. Ticket checkout triggers turn recording
2. Thunk determines turn type and value
3. Entry created in `turn_logs` table
4. Staff queue position updated
5. Dashboard reflects new turn counts

### 3. Payroll Processing Flow

```
Draft → Submitted → Approved → Processed
  │         │           │          │
  ▼         ▼           ▼          ▼
Create   Submit to   Manager    Mark staff
payrun   manager     approves   as paid
                     with notes
```

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  Draft   │───▶│ Submitted │───▶│ Approved  │───▶│ Processed │
└──────────┘    └───────────┘    └───────────┘    └───────────┘
     │               │                │                │
     ▼               ▼                ▼                ▼
  payRuns.       payRuns.        payRuns.         payRuns.
  create()       submit()        approve()        process()
```

### 4. Time Off Request Flow

```
┌──────────┐    ┌───────────┐    ┌───────────────────────┐
│  Staff   │───▶│  Request  │───▶│  Manager Notification │
│  Submits │    │  Created  │    │  (Email/Push)         │
└──────────┘    └───────────┘    └───────────────────────┘
                     │
                     ▼
              ┌───────────────┐
              │  Pending      │
              │  Review       │
              └───────────────┘
                     │
          ┌─────────┴─────────┐
          ▼                   ▼
    ┌───────────┐       ┌───────────┐
    │  Approved │       │  Denied   │
    └───────────┘       └───────────┘
          │                   │
          ▼                   ▼
    ┌───────────┐       ┌───────────┐
    │  Calendar │       │  Staff    │
    │  Blocked  │       │  Notified │
    └───────────┘       └───────────┘
```

---

## Database Tables

### timesheets

```sql
CREATE TABLE timesheets (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  date DATE NOT NULL,
  scheduled_start TIME,
  scheduled_end TIME,
  actual_clock_in TIMESTAMPTZ,
  actual_clock_out TIMESTAMPTZ,
  breaks JSONB DEFAULT '[]',
  hours JSONB,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  -- Sync fields
  sync_status TEXT,
  sync_version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### pay_runs

```sql
CREATE TABLE pay_runs (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_period_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  staff_payments JSONB,
  totals JSONB,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  voided_at TIMESTAMPTZ,
  voided_by UUID,
  void_reason TEXT
);
```

### turn_logs

```sql
CREATE TABLE turn_logs (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  date DATE NOT NULL,
  turn_timestamp TIMESTAMPTZ NOT NULL,
  turn_number INTEGER NOT NULL,
  turn_type TEXT NOT NULL,
  turn_value DECIMAL(3,2) DEFAULT 1.0,
  ticket_id UUID,
  appointment_id UUID,
  client_name TEXT,
  services TEXT[],
  service_amount DECIMAL(10,2),
  is_voided BOOLEAN DEFAULT FALSE,
  voided_at TIMESTAMPTZ,
  voided_by UUID,
  void_reason TEXT
);
```

### time_off_requests

```sql
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  all_day BOOLEAN DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  total_hours DECIMAL(5,2),
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancellation_reason TEXT,
  has_conflicts BOOLEAN DEFAULT FALSE,
  conflict_details JSONB
);
```

### staff_ratings

```sql
CREATE TABLE staff_ratings (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  client_id UUID,
  client_name TEXT,
  appointment_id UUID,
  ticket_id UUID,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  flagged_reason TEXT,
  moderated_by UUID,
  moderated_at TIMESTAMPTZ,
  response_text TEXT,
  response_by UUID,
  response_at TIMESTAMPTZ,
  services_performed TEXT[],
  service_date DATE,
  source TEXT DEFAULT 'in_app'
);
```

---

## Sync Considerations

### Online-First Operations
- Clock in/out (server timestamp validation)
- Pay run processing (financial accuracy)
- Rating moderation (manager workflow)

### Offline-Tolerant Operations
- Viewing cached timesheets
- Browsing turn history
- Reading time-off calendar

### Conflict Resolution
Team module uses **Last-Write-Wins** with **version tracking**:
- Each row has `sync_version` field
- Updates must include current version
- Server rejects stale updates
- Client notified to refresh and retry

---

*Last updated: January 2026*
