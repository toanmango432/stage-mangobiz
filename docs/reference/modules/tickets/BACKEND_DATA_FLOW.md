# Tickets Module Backend Data Flow

> **Last Updated:** December 31, 2025
> **Module:** Tickets (Unified Ticket Design System)
> **Purpose:** Document backend data operations for the Tickets module

---

## Overview

The Tickets module provides:
- Unified ticket card design across all sections
- Consistent ticket status display
- Service-level status tracking
- Staff assignment display
- Timer and progress visualization

This module is a **shared design system** used by:
- Front Desk (Waiting, In-Service, Pending sections)
- Checkout (TicketPanel)
- Sales (Closed tickets)

---

## Data Model

### Ticket Entity

```typescript
interface Ticket {
  id: string;
  number: number;                     // Display number (e.g., #1234)
  salonId: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  appointmentId?: string;             // Link to original appointment
  status: TicketStatus;

  // Services
  services: TicketService[];

  // Financials (populated during/after checkout)
  subtotal?: number;
  discount?: number;
  tax?: number;
  tip?: number;
  total?: number;

  // Metadata
  notes?: string;
  priority?: 'normal' | 'high';
  source?: BookingSource;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Sync
  syncStatus: SyncStatus;
  syncVersion: number;
}
```

### Ticket Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET STATUS FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐        │
│  │ waiting │──▶│in-service│──▶│completed│──▶│  paid   │        │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘        │
│       │             │             │             │               │
│       │             │             │             ▼               │
│       │             │             │        ┌─────────┐         │
│       │             │             │        │ refunded│         │
│       │             │             │        └─────────┘         │
│       │             │             │                             │
│       ▼             ▼             ▼                             │
│  ┌─────────────────────────────────────┐                       │
│  │              voided                  │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ticket Card Components

### Unified Card Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  UNIFIED TICKET CARD                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ #1234 │ Client Name │ 10:30 AM │ [Status Badge]        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  Service 1 - Staff Name                    [Timer/Done] │   │
│  │  Service 2 - Staff Name                    [Timer/Done] │   │
│  │                                                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Total: $45.00     │ [Action Buttons]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Operations

### 1. Ticket Creation

**Sources:**
- Walk-in (from Front Desk)
- Appointment check-in (from Book)
- Quick ticket (from checkout panel)

**Redux Action:**
```typescript
dispatch(createTicketWithStatus({
  clientId,
  clientName,
  services: [...],
  initialStatus: 'waiting'  // or 'in-service'
}));
```

---

### 2. Service Status Updates

**Timer Tracking:**
```typescript
interface ServiceTimerData {
  actualStartTime: string | null;     // When service started
  pausedAt: string | null;            // When paused (null if running)
  totalPausedDuration: number;        // Total pause time in ms
  endTime: string | null;             // When completed
  actualDuration: number | null;      // Final duration in minutes
}

// Calculate elapsed time
function getElapsedTime(service: TicketService): number {
  if (!service.actualStartTime) return 0;

  const startTime = new Date(service.actualStartTime).getTime();
  const now = service.endTime
    ? new Date(service.endTime).getTime()
    : Date.now();

  const pauseTime = service.pausedAt
    ? Date.now() - new Date(service.pausedAt).getTime()
    : 0;

  return now - startTime - service.totalPausedDuration - pauseTime;
}
```

---

### 3. Status Transitions

| From | To | Trigger | UI Location |
|------|----|---------|-------------|
| - | `waiting` | Create ticket | Front Desk - Waiting |
| `waiting` | `in-service` | Start first service | Front Desk - In Service |
| `in-service` | `completed` | All services done | Front Desk - Pending |
| `completed` | `paid` | Payment processed | Sales - Closed |
| Any | `voided` | Void action | Sales - Voided |
| `paid` | `refunded` | Refund processed | Sales - Refunded |

---

### 4. Display Variations

**By Section:**

| Section | Card Size | Actions Shown | Info Displayed |
|---------|-----------|---------------|----------------|
| Waiting | Compact | Assign, Start | Client, services |
| In-Service | Full | Pause, Resume, Done | Timer, progress |
| Pending | Medium | Open checkout | Totals |
| Closed | Compact | View details | Payment method |

---

## Redux State

### uiTicketsSlice State

```typescript
interface UITicketsState {
  // Categorized by status/section
  waitlistTickets: UITicket[];
  serviceTickets: UITicket[];
  pendingTickets: PendingTicket[];
  completedTickets: CompletedTicket[];

  // Currently selected/open ticket
  checkoutTicket: CheckoutTicket | null;
  selectedTicket: UITicket | null;

  // UI state
  loading: boolean;
  error: string | null;
}
```

### Selectors

```typescript
// Select tickets by status
export const selectWaitingTickets = (state: RootState) =>
  state.uiTickets.waitlistTickets;

export const selectInServiceTickets = (state: RootState) =>
  state.uiTickets.serviceTickets;

export const selectPendingTickets = (state: RootState) =>
  state.uiTickets.pendingTickets;

export const selectClosedTickets = (state: RootState) =>
  state.uiTickets.completedTickets;

// Select by staff
export const selectTicketsByStaff = (staffId: string) =>
  createSelector(
    [selectInServiceTickets],
    (tickets) => tickets.filter(t =>
      t.services.some(s => s.staffId === staffId)
    )
  );
```

---

## Component File Locations

### Shared Ticket Components

| Component | File | Purpose |
|-----------|------|---------|
| TicketCard | `src/components/tickets/TicketCard.tsx` | Base card component |
| TicketHeader | `src/components/tickets/TicketHeader.tsx` | Number, client, time |
| ServiceRow | `src/components/tickets/ServiceRow.tsx` | Service display |
| TimerDisplay | `src/components/tickets/TimerDisplay.tsx` | Timer component |
| StatusBadge | `src/components/tickets/StatusBadge.tsx` | Status indicator |

### Section-Specific Components

| Component | File | Section |
|-----------|------|---------|
| WaitListTicketCard | `src/components/frontdesk/WaitListTicketCard.tsx` | Waiting |
| ServiceTicketCard | `src/components/frontdesk/ServiceTicketCard.tsx` | In-Service |
| PendingTicketCard | `src/components/tickets/pending/PendingTicketCard.tsx` | Pending |
| ClosedTicketCard | `src/components/tickets/ClosedTicketCard.tsx` | Closed |

---

## Storage Patterns

### IndexedDB

```typescript
// ticketsDB schema
{
  id: string,           // Primary key
  salonId: string,      // Indexed
  status: string,       // Indexed
  createdAt: Date,      // Indexed
  clientId: string,     // Indexed
  syncStatus: string    // Indexed
}
```

### Query Patterns

```typescript
// Get today's tickets
const todaysTickets = await ticketsDB
  .where('createdAt')
  .between(startOfDay, endOfDay)
  .toArray();

// Get open tickets
const openTickets = await ticketsDB
  .where('status')
  .anyOf(['waiting', 'in-service', 'completed'])
  .toArray();

// Get by client
const clientTickets = await ticketsDB
  .where('clientId')
  .equals(clientId)
  .toArray();
```

---

## Real-Time Updates

### WebSocket Events (Future)

| Event | Payload | Action |
|-------|---------|--------|
| `ticket:created` | ticket | Add to appropriate section |
| `ticket:updated` | ticket | Update in Redux |
| `ticket:status_changed` | id, status | Move between sections |
| `service:status_changed` | ticketId, serviceId, status | Update timer/display |

### Polling (Current)

```typescript
// Poll for updates every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    dispatch(fetchOpenTickets());
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

---

## Offline Behavior

| Operation | Offline Support | Sync Priority |
|-----------|-----------------|---------------|
| View tickets | Yes | - |
| Create ticket | Yes | 2 |
| Update service status | Yes | 3 |
| Complete ticket | Yes | 2 |
| Payment | Partial (cash only) | 1 |

---

## Design System References

See detailed design specifications:
- [UNIFIED_TICKET_DESIGN_SYSTEM.md](./UNIFIED_TICKET_DESIGN_SYSTEM.md)
- [TICKET_DESIGN_MOCKUP.md](./TICKET_DESIGN_MOCKUP.md)
- [ALIGNED_TICKET_STRUCTURE.md](./ALIGNED_TICKET_STRUCTURE.md)

---

## Related Documentation

- [STATE_MACHINES.md](../../architecture/STATE_MACHINES.md) - Ticket/service states
- [FRONTDESK_BACKEND_DATA_FLOW.md](../frontdesk/BACKEND_DATA_FLOW.md) - Front Desk operations
- [CHECKOUT_BACKEND_DATA_FLOW.md](../checkout/BACKEND_DATA_FLOW.md) - Checkout flow

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
