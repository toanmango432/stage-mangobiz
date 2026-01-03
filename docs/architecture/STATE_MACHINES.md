# State Machines

> **Last Updated:** December 31, 2025
> **Purpose:** Formal definitions of all entity states and valid transitions

This document defines the state machines for all core entities in Mango POS. Each state machine includes:
- All valid states
- Valid transitions (forward and reverse)
- Transition triggers (what causes the transition)
- Guard conditions (what must be true for transition to occur)

---

## Overview

| Entity | States | Forward Transitions | Reverse Transitions |
|--------|--------|---------------------|---------------------|
| **Appointment** | 7 | 6 | 1 |
| **Ticket** | 9 | 8 | 2 (recommended) |
| **Service** | 4 | 4 | 1 (recommended) |
| **Transaction** | 6 | 4 | 2 |
| **Staff** | 5 | 8 (bidirectional) | - |
| **Sync** | 6 | 5 | 2 |

---

## 1. Appointment State Machine

**Source:** `src/types/common.ts` - `AppointmentStatus`

### States

| State | Description | UI Location |
|-------|-------------|-------------|
| `scheduled` | Appointment booked, not yet confirmed | Book Module |
| `checked-in` | Client has arrived and checked in | Front Desk - Coming |
| `waiting` | Client waiting for service to begin | Front Desk - Waiting |
| `in-service` | Service is actively being performed | Front Desk - In Service |
| `completed` | Service finished, ready for payment | Front Desk - Pending |
| `cancelled` | Appointment cancelled before service | Archive |
| `no-show` | Client did not arrive | Archive |

### State Diagram

```
                    ┌─────────────┐
                    │  scheduled  │
                    └──────┬──────┘
                           │ client arrives
                           ▼
                    ┌─────────────┐
         ┌─────────│  checked-in │─────────┐
         │         └──────┬──────┘         │
         │                │ move to wait   │ no-show
         │                ▼                ▼
         │         ┌─────────────┐   ┌─────────────┐
         │         │   waiting   │   │   no-show   │
         │         └──────┬──────┘   └─────────────┘
         │                │ start service
         │                ▼
         │         ┌─────────────┐
         │         │  in-service │
         │         └──────┬──────┘
         │                │ service done
         │                ▼
         │         ┌─────────────┐
         │         │  completed  │
         │         └─────────────┘
         │
         │ cancel (any state before completed)
         ▼
  ┌─────────────┐
  │  cancelled  │
  └─────────────┘
```

### Transitions

| From | To | Trigger | Guard Condition |
|------|----|---------|-----------------|
| `scheduled` | `checked-in` | Client check-in | Appointment time within window |
| `scheduled` | `cancelled` | Cancel action | Before scheduled time |
| `checked-in` | `waiting` | Create ticket | Staff assigned |
| `checked-in` | `no-show` | Mark no-show | Past grace period |
| `waiting` | `in-service` | Start service | Staff available |
| `in-service` | `completed` | All services done | All services completed |
| `*` (any) | `cancelled` | Cancel action | Not yet completed |

### Missing Transitions (Recommended)

| From | To | Use Case |
|------|----|----------|
| `checked-in` | `scheduled` | Undo premature check-in |
| `no-show` | `scheduled` | Client arrived late, reschedule |

---

## 2. Ticket State Machine

**Source:** `src/types/common.ts` - `TicketStatus`

### States

| State | Description | UI Location |
|-------|-------------|-------------|
| `pending` | Ticket created, awaiting services | - |
| `waiting` | Client waiting in queue | Front Desk - Waiting |
| `in-service` | Service in progress | Front Desk - In Service |
| `completed` | All services done, ready for checkout | Front Desk - Pending |
| `paid` | Full payment received | Sales |
| `partial-payment` | Some payment received | Sales |
| `unpaid` | Service done, payment outstanding | Sales |
| `refunded` | Full refund issued | Sales |
| `partially-refunded` | Partial refund issued | Sales |
| `voided` | Transaction cancelled | Sales |
| `failed` | Payment declined/error | Retry needed |

### State Diagram

```
                    ┌─────────────┐
                    │   waiting   │
                    └──────┬──────┘
                           │ start service
                           ▼
                    ┌─────────────┐
          ┌────────│  in-service │────────┐
          │        └──────┬──────┘        │
          │               │ all done      │ (MISSING: send back)
          │               ▼               │
          │        ┌─────────────┐        │
          │        │  completed  │────────┘
          │        └──────┬──────┘
          │               │ payment
          │               ▼
          │        ┌─────────────┐
          │        │    paid     │───────────────┐
          │        └─────────────┘               │
          │               │                      │
          │               ▼                      ▼
          │        ┌─────────────┐        ┌─────────────┐
          │        │  refunded   │        │   voided    │
          │        └─────────────┘        └─────────────┘
          │
          │ void
          ▼
   ┌─────────────┐
   │   voided    │
   └─────────────┘
```

### Transitions

| From | To | Trigger | Guard Condition |
|------|----|---------|-----------------|
| `waiting` | `in-service` | Start service | Staff assigned, service selected |
| `in-service` | `completed` | All services done | All service statuses = completed |
| `completed` | `paid` | Full payment | Amount >= total |
| `completed` | `partial-payment` | Partial payment | Amount < total |
| `paid` | `refunded` | Full refund | Within refund window |
| `paid` | `partially-refunded` | Partial refund | Amount < total paid |
| `paid` | `voided` | Void transaction | Same-day, manager auth |
| `*` | `voided` | Void action | Before payment captured |

### Missing Transitions (CRITICAL - Recommended)

| From | To | Use Case | Priority |
|------|----|----------|----------|
| `in-service` | `waiting` | Staff needs to unassign | P0 |
| `completed` | `in-service` | Add more services after "done" | P0 |
| `partial-payment` | `paid` | Complete remaining payment | P1 |

---

## 3. Service State Machine (Within Ticket)

**Source:** `src/types/common.ts` - `ServiceStatus`

### States

| State | Description | Timer State |
|-------|-------------|-------------|
| `not_started` | Service not yet begun | Timer hidden |
| `in_progress` | Service actively being performed | Timer running |
| `paused` | Service temporarily paused | Timer paused |
| `completed` | Service finished | Timer stopped |

### State Diagram

```
┌─────────────┐
│ not_started │
└──────┬──────┘
       │ start (actualStartTime = NOW)
       ▼
┌─────────────┐
│ in_progress │◄───────────┐
└──────┬──────┘            │
       │                   │ resume (totalPausedDuration += delta)
       ├───────────────────┤
       │ pause             │
       ▼ (pausedAt = NOW)  │
┌─────────────┐            │
│   paused    │────────────┘
└──────┬──────┘
       │ done (cannot directly complete from paused)
       │ must resume first
       ▼
┌─────────────┐
│  completed  │
└─────────────┘
```

### Transitions

| From | To | Trigger | Data Updated |
|------|----|---------|--------------|
| `not_started` | `in_progress` | Start button | `actualStartTime = NOW` |
| `in_progress` | `paused` | Pause button | `pausedAt = NOW` |
| `paused` | `in_progress` | Resume button | `totalPausedDuration += (NOW - pausedAt)` |
| `in_progress` | `completed` | Done button | `endTime = NOW`, `actualDuration = calculated` |

### Timer Calculation

```typescript
actualDuration = (endTime - actualStartTime) - totalPausedDuration
```

### Missing Transitions (Recommended)

| From | To | Use Case | Priority |
|------|----|----------|----------|
| `in_progress` | `not_started` | Undo accidental start | P1 |
| `paused` | `not_started` | Cancel and restart | P2 |

---

## 4. Transaction State Machine

**Source:** `src/types/common.ts` - `TransactionStatus`

### States

| State | Description | Financial Impact |
|-------|-------------|------------------|
| `pending` | Transaction initiated | None yet |
| `completed` | Payment captured | Revenue recorded |
| `failed` | Payment declined | None |
| `voided` | Transaction cancelled | Revenue reversed |
| `refunded` | Full refund issued | Revenue reversed |
| `partially-refunded` | Partial refund | Partial revenue reversed |

### State Diagram

```
┌─────────────┐
│   pending   │
└──────┬──────┘
       │ payment attempt
       ├─────────────────────┐
       │ success             │ failure
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  completed  │       │   failed    │
└──────┬──────┘       └──────┬──────┘
       │                     │ retry
       ├─────────────────────┘
       │
       ├──────────────────────────────┐
       │ void (same-day)              │ refund (after settlement)
       ▼                              ▼
┌─────────────┐              ┌─────────────────────┐
│   voided    │              │ refunded / partial  │
└─────────────┘              └─────────────────────┘
```

### Transitions

| From | To | Trigger | Guard Condition |
|------|----|---------|-----------------|
| `pending` | `completed` | Payment success | Payment processor returns success |
| `pending` | `failed` | Payment failure | Payment processor returns error |
| `failed` | `pending` | Retry payment | User initiates retry |
| `completed` | `voided` | Void action | Same-day, before batch settlement |
| `completed` | `refunded` | Full refund | After settlement, within policy |
| `completed` | `partially-refunded` | Partial refund | Amount < total paid |

### Business Rules

- **Void vs Refund:** Void if same-day before settlement; Refund if after settlement
- **Refund Window:** Configurable per store (default: 30 days)
- **Partial Refund:** Can be repeated until full amount refunded

---

## 5. Staff State Machine

**Source:** `src/types/common.ts` - `StaffStatus`

### States

| State | Description | Can Accept Tickets |
|-------|-------------|-------------------|
| `available` | Ready to take clients | Yes |
| `busy` | Currently serving a client | No |
| `on-break` | On scheduled break | No |
| `clocked-out` | Shift ended | No |
| `off-today` | Not scheduled today | No |

### State Diagram (Bidirectional)

```
                         ┌─────────────┐
               ┌────────▶│  available  │◀────────┐
               │         └──────┬──────┘         │
               │                │                │
     end break │      assign    │     clock in   │
               │      ticket    │                │
               │                ▼                │
        ┌──────┴──────┐  ┌─────────────┐  ┌──────┴──────┐
        │  on-break   │  │    busy     │  │ clocked-out │
        └─────────────┘  └──────┬──────┘  └─────────────┘
               ▲                │                ▲
               │      complete  │      clock     │
      start    │      ticket    │      out       │
      break    │                ▼                │
               └────────────────┴────────────────┘
```

### Transitions

| From | To | Trigger | Automatic? |
|------|----|---------|-----------|
| `available` | `busy` | Ticket assigned | Yes |
| `busy` | `available` | Ticket completed/reassigned | Yes |
| `available` | `on-break` | Start break | Manual |
| `on-break` | `available` | End break | Manual |
| `available` | `clocked-out` | Clock out | Manual |
| `clocked-out` | `available` | Clock in | Manual |
| `off-today` | `available` | Clock in (override) | Manual |

### Auto-Update Rules

- When a service is assigned: `available` → `busy`
- When all services done: `busy` → `available`
- When ticket reassigned: `busy` → `available`

---

## 6. Sync State Machine

**Source:** `src/types/common.ts` - `SyncStatus`

### States

| State | Description | User Visible |
|-------|-------------|--------------|
| `local` | Created locally, not yet synced | Badge |
| `pending` | Queued for sync | - |
| `syncing` | Currently syncing | Spinner |
| `synced` | Successfully synced | Green check |
| `conflict` | Conflict detected | Warning icon |
| `error` | Sync failed | Red badge |

### State Diagram

```
┌─────────────┐
│    local    │
└──────┬──────┘
       │ add to queue
       ▼
┌─────────────┐
│   pending   │
└──────┬──────┘
       │ sync starts
       ▼
┌─────────────┐
│   syncing   │
└──────┬──────┘
       │
       ├────────────────┬────────────────┐
       │ success        │ conflict       │ error
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   synced    │  │  conflict   │  │    error    │
└─────────────┘  └──────┬──────┘  └──────┬──────┘
                        │                │
                        │ resolve        │ retry
                        ▼                ▼
                 ┌─────────────┐  ┌─────────────┐
                 │   pending   │  │   pending   │
                 └─────────────┘  └─────────────┘
```

### Sync Queue Priority

| Priority | Operation | Rationale |
|----------|-----------|-----------|
| 1 (Highest) | Delete | Prevent orphaned data |
| 2 | Create | New data should sync first |
| 3 | Update | Existing data can wait |

### Retry Logic

- **Max Attempts:** 10
- **Backoff:** Exponential (1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s, 60s)
- **Circuit Breaker:** After 3 consecutive failures, pause sync for 30 seconds

---

## Recovery Flows

### Stuck Ticket Recovery

| Scenario | Current State | Recovery Action |
|----------|---------------|-----------------|
| Staff went off-duty | `in-service` | Reassign to available staff |
| Payment failed | `completed` | Retry payment or void ticket |
| Client left | `waiting` | Mark as no-show or void |
| Network offline | Any | Wait for sync, resolve conflicts |

### Manager Overrides (Recommended)

| Action | Required Permission | Audit Logged |
|--------|---------------------|--------------|
| Force-close ticket | Manager | Yes |
| Override void window | Manager | Yes |
| Manual sync retry | Staff | Yes |
| Reassign across locations | Admin | Yes |

---

## Implementation Notes

### Current Implementation

- State transitions are handled in Redux thunks (`ticketsSlice.ts`, `uiTicketsSlice.ts`)
- No formal state machine library (XState) is used
- Transitions are validated implicitly, not with guard conditions
- Audit logging exists but is incomplete

### Recommended Improvements

1. **Add Guard Conditions:** Validate transitions before executing
2. **Add Reverse Flows:** Implement missing transitions marked above
3. **Add Transition Logging:** Log all state changes for audit trail
4. **Consider XState:** For complex flows, consider formal FSM library

---

## Related Documentation

- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Storage patterns
- [SYSTEM_DATA_FLOW_OVERVIEW.md](./SYSTEM_DATA_FLOW_OVERVIEW.md) - Cross-module flows
- [VALIDATION_RULES.md](./VALIDATION_RULES.md) - Input validation
- [EDGE_CASES_AND_RECOVERY.md](../guides/EDGE_CASES_AND_RECOVERY.md) - Recovery procedures

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
