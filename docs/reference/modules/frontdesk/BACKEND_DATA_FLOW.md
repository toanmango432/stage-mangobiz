# Front Desk Backend Data Flow

> **Last Updated:** December 31, 2025
> **Module:** Front Desk (Operations Command Center)
> **Purpose:** Document backend data operations for the Front Desk module

---

## Overview

The Front Desk module is the operations command center for managing client flow through the salon. It handles:
- Appointment check-ins
- Walk-in ticket creation
- Service queue management
- Staff assignment and tracking
- Ticket lifecycle management

---

## Data Model

### Primary Entities

| Entity | Table | Primary Key | Description |
|--------|-------|-------------|-------------|
| Ticket | `tickets` | `id` (uuid) | Service ticket for a client visit |
| Appointment | `appointments` | `id` (uuid) | Scheduled booking |
| Staff | `staff` | `id` (uuid) | Service provider |
| Client | `clients` | `id` (uuid) | Customer |

### Ticket Entity

```typescript
interface Ticket {
  id: string;
  number: number;               // Display number (e.g., #1234)
  salonId: string;              // Store/salon ID
  clientId?: string;            // Optional client link
  clientName: string;           // Displayed name
  appointmentId?: string;       // Optional appointment link
  status: TicketStatus;         // waiting, in-service, completed, etc.
  services: TicketService[];    // Services on this ticket
  subtotal: number;
  tax: number;
  tip: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

interface TicketService {
  id: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  price: number;
  duration: number;
  status: ServiceStatus;        // not_started, in_progress, paused, completed
  actualStartTime?: string;
  pausedAt?: string;
  totalPausedDuration: number;
  actualDuration?: number;
  statusHistory: ServiceStatusChange[];
}
```

---

## UI Sections and Data Sources

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONT DESK LAYOUT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │   COMING    │  │              SERVICE SECTION            │  │
│  │  SECTION    │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │             │  │  │ WAITING │ │IN-SERVICE│ │ PENDING │   │  │
│  │ Appointments│  │  │ Section │ │ Section  │ │ Section │   │  │
│  │ today       │  │  └─────────┘ └─────────┘ └─────────┘   │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    STAFF SIDEBAR                        │   │
│  │  Staff status, availability, turn tracking              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Sources by Section

| Section | Redux Slice | Data | Filter |
|---------|-------------|------|--------|
| Coming | `appointmentsSlice` | `appointments` | Today, status: scheduled |
| Waiting | `uiTicketsSlice` | `waitlistTickets` | status: waiting |
| In-Service | `uiTicketsSlice` | `serviceTickets` | status: in-service |
| Pending | `uiTicketsSlice` | `pendingTickets` | status: completed |
| Staff Sidebar | `teamSlice` | `members` | activeStaff = true |

---

## Key Operations

### 1. Walk-In Check-In (New Ticket)

**Flow:** User creates new ticket for walk-in client

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Click "+"   │────▶│ TicketPanel  │────▶│ Add Services │────▶│ Save Ticket  │
│   Button     │     │   Opens      │     │ & Client     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Actions:**
```typescript
// 1. Create ticket
dispatch(createTicketWithStatus({
  clientId,
  clientName,
  services: [{
    serviceId,
    serviceName,
    price,
    duration,
    staffId,
    staffName,
    status: 'not_started'
  }],
  initialStatus: 'waiting'  // Goes directly to waiting section
}));

// 2. Ticket appears in waitlistTickets[]
```

**Data Flow:**
```
UI (TicketPanel)
    │
    ▼
Redux: createTicketWithStatus (uiTicketsSlice.ts:347)
    │
    ├─── Optimistic update: state.waitlistTickets.push(ticket)
    │
    ▼
dataService.tickets.create()
    │
    ▼
IndexedDB: ticketsDB.add(ticket)
    │
    ▼
Sync Queue: priority 2 (create)
    │
    ▼ (background)
Supabase: tickets.insert()
```

---

### 2. Appointment Check-In

**Flow:** Appointment in Coming section → Create ticket

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Upcoming   │────▶│  Check-In    │────▶│   Ticket     │
│ Appointment  │     │   Button     │     │   Created    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Actions:**
```typescript
// 1. Update appointment status
dispatch(updateAppointmentStatus({
  appointmentId,
  status: 'checked-in'
}));

// 2. Create ticket from appointment data
dispatch(createTicketFromAppointment({
  appointment,  // Contains client, services, staff
}));
```

**Data Transformation:**
```
Appointment                      Ticket
─────────────────────────────────────────────────────
clientId           ──────────▶   clientId
clientName         ──────────▶   clientName
services[].serviceId ────────▶   services[].serviceId
services[].staffId ──────────▶   services[].staffId
services[].duration ─────────▶   services[].duration
services[].price   ──────────▶   services[].price
(new)              ──────────▶   services[].status = 'not_started'
```

---

### 3. Start Service

**Flow:** Ticket in Waiting → Move to In-Service

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Waiting    │────▶│    Start     │────▶│  In-Service  │
│   Ticket     │     │   Button     │     │   Section    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Action:**
```typescript
dispatch(updateServiceStatus({
  ticketId,
  serviceId,
  status: 'in_progress',
  staffId,
  staffName
}));
```

**Data Changes:**
```typescript
// Service level
service.status = 'in_progress';
service.actualStartTime = new Date().toISOString();
service.staffId = selectedStaffId;
service.staffName = selectedStaffName;
service.statusHistory.push({
  from: 'not_started',
  to: 'in_progress',
  changedAt: new Date().toISOString(),
  changedBy: currentUserId
});

// Staff level
staff.status = 'busy';
staff.currentTicketId = ticketId;
```

---

### 4. Pause/Resume Service

**Flow:** Timer control during service

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  In-Progress │────▶│    Pause     │────▶│    Paused    │
│   Service    │◀────│   Resume     │◀────│   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Actions:**
```typescript
// Pause
dispatch(pauseService({ ticketId, serviceId }));
// Updates: service.status = 'paused', service.pausedAt = NOW

// Resume
dispatch(resumeService({ ticketId, serviceId }));
// Updates: service.status = 'in_progress',
//          service.totalPausedDuration += (NOW - pausedAt)
```

---

### 5. Complete Service (Mark Done)

**Flow:** Service finished → Move to Pending

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  In-Service  │────▶│    Done      │────▶│   Pending    │
│   Service    │     │   Button     │     │   Section    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Redux Action:**
```typescript
dispatch(completeTicket({ ticketId }));
```

**Data Changes:**
```typescript
// All services marked completed
ticket.services.forEach(service => {
  service.status = 'completed';
  service.actualDuration = calculateDuration(service);
  service.statusHistory.push({
    from: 'in_progress',
    to: 'completed',
    changedAt: new Date().toISOString()
  });
});

// Ticket status
ticket.status = 'completed';

// Staff freed
staff.status = 'available';
staff.currentTicketId = null;

// UI update
state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);
state.pendingTickets.push(ticket);
```

---

### 6. Open Checkout

**Flow:** Pending ticket → Checkout panel

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Pending    │────▶│    Click     │────▶│ TicketPanel  │
│   Ticket     │     │   Ticket     │     │   Opens      │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Data Transfer Mechanism:**
```typescript
// 1. Store in localStorage for persistence
localStorage.setItem('checkout-pending-ticket', JSON.stringify(ticket));

// 2. Store in Redux for immediate access
dispatch(setCheckoutTicket(ticket));

// 3. Open TicketPanel
dispatch(openCheckoutPanel());
```

---

## Redux Slices

### uiTicketsSlice

**Location:** `src/store/slices/uiTicketsSlice.ts`

**State Shape:**
```typescript
interface UITicketsState {
  waitlistTickets: UITicket[];      // Waiting section
  serviceTickets: UITicket[];       // In-Service section
  pendingTickets: PendingTicket[];  // Pending section
  completedTickets: CompletedTicket[]; // Closed section
  checkoutTicket: CheckoutTicket | null;
  loading: boolean;
  error: string | null;
}
```

**Key Thunks:**
| Thunk | Purpose |
|-------|---------|
| `createTicketWithStatus` | Create new walk-in ticket |
| `createTicketFromAppointment` | Create ticket from appointment |
| `updateServiceStatus` | Start/pause/resume service |
| `completeTicket` | Mark all services done |
| `markTicketAsPaid` | After payment completed |

### appointmentsSlice

**Location:** `src/store/slices/appointmentsSlice.ts`

**Key Thunks:**
| Thunk | Purpose |
|-------|---------|
| `fetchTodaysAppointments` | Load Coming section |
| `updateAppointmentStatus` | Check-in, cancel, no-show |

### teamSlice

**Location:** `src/store/slices/teamSlice.ts`

**Key Thunks:**
| Thunk | Purpose |
|-------|---------|
| `fetchTeamMembers` | Load staff sidebar |
| `updateStaffStatus` | Busy/available/break |

---

## Storage Patterns

### IndexedDB Tables

| Table | Key Fields | Indexes |
|-------|------------|---------|
| `ticketsDB` | id, salonId, status | status, createdAt |
| `appointmentsDB` | id, salonId, scheduledStartTime | date, staffId |
| `staffDB` | id, salonId | status |

### Sync Priority

| Operation | Priority | Rationale |
|-----------|----------|-----------|
| Ticket create | 2 | Client data important |
| Service status update | 3 | Can be recovered |
| Appointment check-in | 2 | Affects booking system |
| Staff status | 4 | Local state mainly |

---

## Component File Locations

| Component | File | Purpose |
|-----------|------|---------|
| FrontDesk | `src/components/frontdesk/FrontDesk.tsx` | Main container |
| ComingSection | `src/components/frontdesk/ComingSection.tsx` | Appointments |
| WaitListSection | `src/components/frontdesk/WaitListSection.tsx` | Waiting tickets |
| ServiceSection | `src/components/frontdesk/ServiceSection.tsx` | In-service tickets |
| PendingSection | `src/components/frontdesk/PendingSection.tsx` | Completed tickets |
| StaffSidebar | `src/components/frontdesk/StaffSidebar.tsx` | Staff panel |
| TicketPanel | `src/components/checkout/TicketPanel.tsx` | Checkout panel |

---

## Offline Behavior

| Operation | Offline Support | Notes |
|-----------|-----------------|-------|
| View tickets | Yes | From IndexedDB |
| Create ticket | Yes | Queued for sync |
| Start service | Yes | Queued for sync |
| Complete service | Yes | Queued for sync |
| View staff | Yes | From IndexedDB |
| Update staff status | Yes | Queued for sync |

---

## Related Documentation

- [STATE_MACHINES.md](../../architecture/STATE_MACHINES.md) - Ticket/service states
- [SYSTEM_DATA_FLOW_OVERVIEW.md](../../architecture/SYSTEM_DATA_FLOW_OVERVIEW.md) - System-wide flows
- [CHECKOUT_BACKEND_DATA_FLOW.md](../checkout/BACKEND_DATA_FLOW.md) - Checkout continuation

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
