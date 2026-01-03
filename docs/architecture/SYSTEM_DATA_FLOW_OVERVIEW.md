# System Data Flow Overview

> **Last Updated:** December 31, 2025
> **Purpose:** Holistic view of data movement through the Mango POS system

This document provides a comprehensive overview of how data flows through the system, from entry points to storage, across modules, and to exit points.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MANGO POS ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         UI LAYER (React)                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │  Book   │  │  Front  │  │ Checkout│  │  Team   │  │  Sales  │   │   │
│  │  │ Module  │  │  Desk   │  │ Module  │  │ Module  │  │ Module  │   │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │   │
│  └───────┼────────────┼────────────┼────────────┼────────────┼────────┘   │
│          │            │            │            │            │             │
│  ┌───────┴────────────┴────────────┴────────────┴────────────┴────────┐   │
│  │                      STATE LAYER (Redux)                           │   │
│  │  appointments │ tickets │ transactions │ staff │ clients │ sync   │   │
│  └───────────────────────────────┬────────────────────────────────────┘   │
│                                  │                                         │
│  ┌───────────────────────────────┴────────────────────────────────────┐   │
│  │                     DATA SERVICE LAYER                              │   │
│  │  dataService.ts → Routes to local or server based on mode          │   │
│  └───────────────────────────────┬────────────────────────────────────┘   │
│                                  │                                         │
│          ┌───────────────────────┼───────────────────────┐                │
│          │                       │                       │                │
│          ▼                       ▼                       ▼                │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐         │
│  │   IndexedDB   │      │  Sync Queue   │      │   Supabase    │         │
│  │   (Dexie.js)  │◄────▶│   (Local)     │─────▶│  (PostgreSQL) │         │
│  │   Primary     │      │   Priority    │      │   Cloud       │         │
│  └───────────────┘      └───────────────┘      └───────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Entry Points

Data enters the system through these channels:

### 1.1 Walk-In Check-In

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Front Desk  │────▶│ Create Ticket│────▶│   Waiting    │
│  "New Ticket"│     │  (No Appt)   │     │   Section    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Data Created:**
- New `Ticket` with status `waiting`
- Services array with `not_started` status
- Client link (existing or quick-add)

**Storage Path:**
```
UI → Redux (optimistic) → dataService → IndexedDB → Sync Queue → Supabase
```

### 1.2 Appointment Check-In

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Book      │────▶│  Appointment │────▶│   Check-In   │────▶│   Ticket     │
│   Module     │     │  scheduled   │     │   Action     │     │   Created    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Data Created:**
- Appointment status updated to `checked-in`
- New `Ticket` created from appointment data
- Client, services, staff pre-populated

### 1.3 Online Booking Sync

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   External   │────▶│   Supabase   │────▶│   IndexedDB  │
│   Booking    │     │   Webhook    │     │   (Hydrate)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Data Created:**
- New `Appointment` with source `online`
- Client record (new or linked)

---

## 2. Storage Architecture

### 2.1 Local-First Pattern

All data operations follow this pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL-FIRST DATA FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [User Action]                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                                │
│  │   Redux     │ ◀── Optimistic Update (immediate UI)           │
│  │   Store     │                                                │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │ dataService │ ◀── Business Logic Layer                       │
│  │ getDataSource() → always returns 'local'                     │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │  IndexedDB  │ ◀── Primary Storage                            │
│  │  (Dexie.js) │     30+ tables, v12 schema                     │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │ Sync Queue  │ ◀── Queued for background sync                 │
│  │  syncQueueDB│     Priority: delete=1, create=2, update=3     │
│  └──────┬──────┘                                                │
│         │ (when online, background)                             │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │  Supabase   │ ◀── Cloud Sync                                 │
│  │ PostgreSQL  │     Max 10 retry attempts                      │
│  └─────────────┘                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Storage Locations

| Layer | Technology | Purpose | Persistence |
|-------|------------|---------|-------------|
| **Redux** | Redux Toolkit | UI State | Session |
| **localStorage** | Browser | Session data, checkout draft | Browser |
| **IndexedDB** | Dexie.js | All entity data | Persistent |
| **Sync Queue** | IndexedDB | Pending sync operations | Until synced |
| **Supabase** | PostgreSQL | Cloud backup, multi-device sync | Permanent |

### 2.3 Data Service Routing

```typescript
// src/services/dataService.ts
function getDataSource(): DataSourceType {
  // Always returns 'local' - local-first architecture
  return 'local';
}
```

**Read Operations:**
1. Read from IndexedDB first (instant)
2. Background sync pulls latest from Supabase
3. Update IndexedDB if newer data found

**Write Operations:**
1. Write to IndexedDB immediately
2. Add to sync queue
3. Background sync pushes to Supabase

---

## 3. Cross-Module Flows

### 3.1 Book → Front Desk (Appointment Check-In)

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT CHECK-IN FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BOOK MODULE                          FRONT DESK MODULE         │
│  ┌─────────────┐                      ┌─────────────┐          │
│  │ Appointment │                      │   Coming    │          │
│  │  scheduled  │─────────────────────▶│   Section   │          │
│  └─────────────┘  appointment.status  └──────┬──────┘          │
│                   = 'scheduled'              │                  │
│                                              │ Check-In Click   │
│                                              ▼                  │
│                                       ┌─────────────┐          │
│                                       │ createTicket│          │
│                                       │ InSupabase()│          │
│                                       └──────┬──────┘          │
│                                              │                  │
│                                              ▼                  │
│                                       ┌─────────────┐          │
│                                       │   Waiting   │          │
│                                       │   Section   │          │
│                                       └─────────────┘          │
│                                                                 │
│  Data Transformation:                                           │
│  ├─ Appointment.services → Ticket.services                      │
│  ├─ Appointment.clientId → Ticket.clientId                      │
│  ├─ Appointment.staffId → Ticket.services[].staffId             │
│  └─ Appointment.status = 'checked-in'                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Front Desk → Checkout (Pending Ticket)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PENDING → CHECKOUT FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONT DESK                             CHECKOUT MODULE         │
│  ┌─────────────┐                       ┌─────────────┐         │
│  │   Pending   │                       │ TicketPanel │         │
│  │   Section   │──────────────────────▶│   Opens     │         │
│  └─────────────┘   Click on ticket     └──────┬──────┘         │
│                                               │                 │
│  Transfer Mechanism:                          │                 │
│  1. localStorage.setItem(                     │                 │
│       'checkout-pending-ticket',              │                 │
│       JSON.stringify(ticket)                  ▼                 │
│     )                                  ┌─────────────┐         │
│  2. Redux: uiTicketsSlice              │   Payment   │         │
│       .checkoutTicket = ticket         │   Process   │         │
│                                        └─────────────┘         │
│                                                                 │
│  Data Available in Checkout:                                    │
│  ├─ ticket.services[] (with prices, staff)                      │
│  ├─ ticket.clientId, clientName                                 │
│  ├─ ticket.subtotal, tax                                        │
│  └─ Pre-calculated totals                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Checkout → Transactions (Payment)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT → TRANSACTION FLOW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHECKOUT MODULE                        TRANSACTIONS            │
│  ┌─────────────┐                       ┌─────────────┐         │
│  │ TicketPanel │                       │ Transaction │         │
│  │  Payment    │──────────────────────▶│   Created   │         │
│  └─────────────┘  PaymentModal.        └──────┬──────┘         │
│                   onComplete()                │                 │
│                                               ▼                 │
│  Transaction Created:                  ┌─────────────┐         │
│  {                                     │   Sales     │         │
│    ticketId,                           │   Module    │         │
│    ticketNumber,                       └─────────────┘         │
│    clientId, clientName,                                        │
│    subtotal, tax, tip, discount,                                │
│    total,                                                       │
│    paymentMethod,                                               │
│    paymentDetails: {...},                                       │
│    services: [...] (snapshot),                                  │
│    status: 'completed'                                          │
│  }                                                              │
│                                                                 │
│  Post-Payment Actions:                                          │
│  1. Transaction → IndexedDB + Sync Queue (priority 1)           │
│  2. Ticket.status → 'paid'                                      │
│  3. localStorage 'checkout-pending-ticket' → DELETED            │
│  4. Ticket removed from pendingTickets[]                        │
│  5. TicketPanel closes                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Happy Path: Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE TICKET LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: ENTRY                                                             │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Walk-in OR Appointment Check-in                              │          │
│  │  → Creates Ticket with status: 'waiting'                      │          │
│  │  → Services: [{ status: 'not_started' }]                      │          │
│  │  → Storage: Redux → IndexedDB → Sync Queue                    │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  STAGE 2: WAITING SECTION                                                   │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Ticket appears in Waiting Section                            │          │
│  │  → Assign staff to service                                    │          │
│  │  → Click "Start" to begin                                     │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  STAGE 3: IN-SERVICE SECTION                                                │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Service.status: 'in_progress'                                │          │
│  │  → Timer running (actualStartTime = NOW)                      │          │
│  │  → Can Pause/Resume                                           │          │
│  │  → Click "Done" when finished                                 │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  STAGE 4: PENDING SECTION                                                   │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Ticket.status: 'completed'                                   │          │
│  │  → All services done                                          │          │
│  │  → Ready for checkout                                         │          │
│  │  → Click ticket to open TicketPanel                           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  STAGE 5: CHECKOUT (TicketPanel)                                            │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  → Add/edit services, apply discounts                         │          │
│  │  → Auto-save to localStorage                                  │          │
│  │  → Set tip amount                                             │          │
│  │  → Click "Proceed to Payment"                                 │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  STAGE 6: PAYMENT                                                           │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  PaymentModal opens                                           │          │
│  │  → Select payment method (Cash, Card, etc.)                   │          │
│  │  → Process payment                                            │          │
│  │  → On success: Transaction created                            │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  STAGE 7: CLOSED                                                            │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  Ticket.status: 'paid'                                        │          │
│  │  → Transaction in Sales module                                │          │
│  │  → Receipt available                                          │          │
│  │  → Sync to Supabase (priority 1)                              │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Exit Points

### 5.1 Payment Completed

```
Ticket + Transaction → Sales Module → Supabase (synced)
```

**Data State:**
- Ticket: `status = 'paid'`
- Transaction: `status = 'completed'`
- SyncStatus: `'synced'` after successful sync

### 5.2 Void/Cancel

```
Ticket → Voided → Sales Module (voided section)
```

**Data State:**
- Ticket: `status = 'voided'`
- Transaction: `status = 'voided'` (if payment was attempted)
- Reason stored in audit log

### 5.3 Refund

```
Transaction → Refund Process → Updated Transaction
```

**Data State:**
- Transaction: `status = 'refunded'` or `'partially-refunded'`
- New refund record created
- Original ticket unchanged

---

## 6. Sync Strategy

### 6.1 Sync Queue Priority

| Priority | Operation | Rationale |
|----------|-----------|-----------|
| 1 (Highest) | Financial (Transactions) | Money must sync first |
| 2 | Delete operations | Prevent orphaned data |
| 3 | Create operations | New data important |
| 4 | Update operations | Can wait |

### 6.2 Conflict Resolution

**Current:** Last-write-wins (silent overwrite)

**Data tracked:**
- `syncVersion`: Incremented on each change
- `updatedAt`: Timestamp of last modification
- `syncStatus`: Current sync state

**Recommended Improvement:**
- Surface conflicts to user
- Let user choose resolution
- Add merge strategy for non-conflicting fields

### 6.3 Retry Logic

```
Attempt 1: Immediate
Attempt 2: 1 second delay
Attempt 3: 2 seconds
Attempt 4: 4 seconds
Attempt 5: 8 seconds
Attempt 6: 16 seconds
Attempt 7-10: 60 seconds each
After 10 failures: Mark as 'error', stop retrying
```

---

## 7. Storage by Entity

| Entity | IndexedDB Table | Supabase Table | Sync Priority |
|--------|-----------------|----------------|---------------|
| Appointment | `appointmentsDB` | `appointments` | 3 |
| Ticket | `ticketsDB` | `tickets` | 2 |
| Transaction | `transactionsDB` | `transactions` | 1 |
| Client | `clientsDB` | `clients` | 4 |
| Staff | `staffDB` | `staff` | 4 |
| Service | `servicesDB` | `services` | 4 |

---

## 8. Key Files Reference

| Layer | File | Purpose |
|-------|------|---------|
| Data Service | `src/services/dataService.ts` | Routes data operations |
| IndexedDB | `src/db/database.ts` | Local database operations |
| Sync Queue | `src/db/syncQueue.ts` | Queue management |
| Redux | `src/store/slices/*.ts` | State management |
| Supabase | `src/services/supabase/tables/*.ts` | Cloud operations |
| Adapters | `src/services/supabase/adapters/*.ts` | Type conversion |

---

## Related Documentation

- [STATE_MACHINES.md](./STATE_MACHINES.md) - Entity state definitions
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Detailed storage patterns
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Tech stack overview
- [VALIDATION_RULES.md](./VALIDATION_RULES.md) - Input validation

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
