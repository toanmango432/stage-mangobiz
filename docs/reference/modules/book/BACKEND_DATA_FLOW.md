# Book Module Backend Data Flow

> **Last Updated:** December 31, 2025
> **Module:** Book (Appointment Calendar)
> **Purpose:** Document backend data operations for the Book module

---

## Overview

The Book module handles:
- Appointment calendar display
- Booking new appointments
- Appointment modifications
- Staff schedule management
- Availability checking

---

## Data Model

### Primary Entities

| Entity | Table | Primary Key | Description |
|--------|-------|-------------|-------------|
| Appointment | `appointments` | `id` (uuid) | Scheduled booking |
| Staff | `staff` | `id` (uuid) | Service provider |
| Service | `services` | `id` (uuid) | Available services |
| Client | `clients` | `id` (uuid) | Customer |

### Appointment Entity

```typescript
interface Appointment {
  id: string;
  salonId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  staffId: string;                    // Primary staff
  staffName: string;
  services: AppointmentService[];
  status: AppointmentStatus;          // scheduled, checked-in, completed, etc.
  scheduledStartTime: string;         // ISO string (UTC)
  scheduledEndTime: string;           // ISO string (UTC)
  actualStartTime?: string;
  actualEndTime?: string;
  checkInTime?: string;
  notes?: string;
  source: BookingSource;              // phone, walk-in, online, etc.
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: SyncStatus;
}

interface AppointmentService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  duration: number;                   // minutes
  price: number;
}
```

---

## Calendar View

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOOK MODULE LAYOUT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │   DATE      │  │          CALENDAR GRID                  │  │
│  │  PICKER     │  │   ┌───────────────────────────────┐     │  │
│  │             │  │   │  Time │ Staff1 │ Staff2 │ ... │     │  │
│  │  Today      │  │   ├───────┼────────┼────────┼─────┤     │  │
│  │  Week       │  │   │ 9:00  │  Appt  │        │     │     │  │
│  │  Month      │  │   │ 9:30  │        │  Appt  │     │     │  │
│  │             │  │   │ 10:00 │        │        │ Appt│     │  │
│  └─────────────┘  │   └───────────────────────────────┘     │  │
│                   └─────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                STAFF FILTER BAR                         │   │
│  │  [All Staff] [John] [Jane] [Mike] ...                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Operations

### 1. Load Calendar

**Flow:** Fetch appointments for selected date/range

```typescript
// On date selection change
dispatch(fetchAppointmentsByDate({
  date: selectedDate,
  staffIds: selectedStaffFilter  // Optional staff filter
}));
```

**Data Flow:**
```
Date Selection
    │
    ▼
Redux: fetchAppointmentsByDate (appointmentsSlice.ts)
    │
    ▼
dataService.appointments.getByDate(date)
    │
    ├─── IndexedDB: appointmentsDB.where('date').equals(date)
    │
    └─── (background) Supabase: appointments.select().eq('date', date)
    │
    ▼
Redux State: appointments.items[]
    │
    ▼
Calendar Grid: renders appointments by time/staff
```

---

### 2. Create Appointment

**Flow:** New booking creation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Click Time  │────▶│   Booking    │────▶│ Appointment  │
│    Slot      │     │    Modal     │     │   Created    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Actions:**
```typescript
dispatch(createAppointment({
  clientId,
  clientName,
  clientPhone,
  staffId,
  staffName,
  services: [{
    serviceId,
    serviceName,
    duration,
    price
  }],
  scheduledStartTime: new Date(selectedSlot),
  source: 'mango-store',
  notes
}));
```

**Validation Required:**
1. No double-booking for same staff
2. Within business hours
3. Service duration fits in available slot
4. Client not already booked at this time

---

### 3. Modify Appointment

**Operations:**

| Operation | Action | Data Change |
|-----------|--------|-------------|
| Reschedule | Drag to new slot | `scheduledStartTime`, `scheduledEndTime` |
| Change Staff | Reassign | `staffId`, `staffName` |
| Add Service | Extend booking | `services[]`, duration |
| Remove Service | Shorten booking | `services[]`, duration |
| Edit Notes | Update notes | `notes` |

**Redux Action:**
```typescript
dispatch(updateAppointment({
  id: appointmentId,
  updates: {
    scheduledStartTime: newTime,
    staffId: newStaffId,
    // ... other changes
  }
}));
```

---

### 4. Cancel Appointment

**Flow:**
```typescript
dispatch(cancelAppointment({
  appointmentId,
  reason: 'Customer request',
  notifyClient: true  // Send cancellation notification
}));
```

**Data Changes:**
```typescript
appointment.status = 'cancelled';
appointment.updatedAt = new Date().toISOString();
// Note: Record kept for history, not deleted
```

---

### 5. Check-In Appointment

**Flow:** Appointment → Front Desk ticket creation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Appointment │────▶│  Check-In    │────▶│   Ticket     │
│  in Book     │     │   Action     │     │   Created    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Actions:**
```typescript
// 1. Update appointment status
dispatch(updateAppointmentStatus({
  appointmentId,
  status: 'checked-in',
  checkInTime: new Date().toISOString()
}));

// 2. Create ticket in Front Desk
dispatch(createTicketFromAppointment({
  appointmentId,
  // Data copied from appointment
}));
```

---

## Availability Checking

### Check Staff Availability

```typescript
interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  staffId: string;
  available: boolean;
}

async function getStaffAvailability(
  staffId: string,
  date: Date,
  serviceDuration: number
): Promise<AvailabilitySlot[]> {
  // 1. Get staff working hours for this date
  const schedule = await getStaffSchedule(staffId, date);

  // 2. Get existing appointments
  const appointments = await getStaffAppointments(staffId, date);

  // 3. Calculate available slots
  const slots = [];
  let currentTime = schedule.startTime;

  while (currentTime < schedule.endTime) {
    const endTime = addMinutes(currentTime, serviceDuration);

    // Check if slot conflicts with existing appointments
    const hasConflict = appointments.some(apt =>
      timeOverlaps(currentTime, endTime, apt.startTime, apt.endTime)
    );

    slots.push({
      startTime: currentTime,
      endTime,
      staffId,
      available: !hasConflict
    });

    currentTime = addMinutes(currentTime, 15); // 15-min intervals
  }

  return slots;
}
```

---

## Redux Slices

### appointmentsSlice

**Location:** `src/store/slices/appointmentsSlice.ts`

**State Shape:**
```typescript
interface AppointmentsState {
  items: Appointment[];
  selectedDate: Date;
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
}
```

**Key Thunks:**
| Thunk | Purpose |
|-------|---------|
| `fetchAppointmentsByDate` | Load calendar view |
| `createAppointment` | Book new appointment |
| `updateAppointment` | Modify existing |
| `cancelAppointment` | Cancel booking |
| `updateAppointmentStatus` | Check-in, complete |

---

## Storage Patterns

### IndexedDB Tables

| Table | Key Fields | Indexes |
|-------|------------|---------|
| `appointmentsDB` | id, salonId | scheduledStartTime, staffId, status |

### Sync Priority

| Operation | Priority | Rationale |
|-----------|----------|-----------|
| Create appointment | 2 | Booking data important |
| Update appointment | 3 | Can be recovered |
| Cancel appointment | 2 | Affects availability |
| Check-in | 2 | Creates ticket |

---

## Component File Locations

| Component | File | Purpose |
|-----------|------|---------|
| BookPage | `src/pages/BookPage.tsx` | Main container |
| Calendar | `src/components/Book/Calendar.tsx` | Calendar grid |
| AppointmentCard | `src/components/Book/AppointmentCard.tsx` | Appointment display |
| BookingModal | `src/components/Book/BookingModal.tsx` | Create/edit form |
| StaffFilter | `src/components/Book/StaffFilter.tsx` | Staff selection |

---

## Offline Behavior

| Operation | Offline Support | Notes |
|-----------|-----------------|-------|
| View calendar | Yes | From IndexedDB |
| Create appointment | Yes | Queued for sync |
| Modify appointment | Yes | Queued for sync |
| Cancel appointment | Yes | Queued for sync |
| Check-in | Yes | Creates ticket locally |

---

## Related Documentation

- [STATE_MACHINES.md](../../architecture/STATE_MACHINES.md) - Appointment states
- [FRONTDESK_BACKEND_DATA_FLOW.md](../frontdesk/BACKEND_DATA_FLOW.md) - Check-in flow
- [VALIDATION_RULES.md](../../architecture/VALIDATION_RULES.md) - Booking validation

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
