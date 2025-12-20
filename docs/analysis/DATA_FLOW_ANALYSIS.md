# 🔄 Data Flow Analysis - Backend Engineering Review

**Date:** December 2025  
**Role:** Senior Backend Engineer  
**Purpose:** Comprehensive analysis of frontend ↔ backend ↔ database data flow across all modules  
**Status:** Complete Analysis

---

## 📊 Executive Summary

### Overall Data Flow Health: **6.5/10**

| Category | Rating | Status |
|----------|--------|--------|
| **Core Business Entities** | 7/10 | ✅ Well connected (clients, staff, services, appointments) |
| **Financial Entities** | 5/10 | ⚠️ Partial connection (tickets, transactions) |
| **Configuration Modules** | 4/10 | ⚠️ IndexedDB only, no Supabase sync |
| **Type Consistency** | 7/10 | ✅ Good adapter pattern |
| **CRUD Completeness** | 6/10 | ⚠️ Missing some operations |
| **Offline Sync** | 5/10 | ⚠️ Incomplete implementation |

### Critical Findings

✅ **What's Working:**
- Core entities (clients, staff, services, appointments) have complete Supabase integration
- Type adapters properly convert between frontend and database types
- dataService provides unified interface
- Real-time subscriptions implemented

⚠️ **Critical Issues:**
- **Tickets & Transactions:** Missing create/update/delete operations in Supabase
- **4 Modules IndexedDB-only:** Catalog, Schedule, Timesheet, Team (no cloud sync)
- **Incomplete Offline Sync:** Sync queue exists but not fully integrated
- **Mixed Patterns:** Some slices use Supabase, others use IndexedDB directly

---

## 🗺️ Data Flow Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Components  │→ │ Redux Slices │→ │   Hooks      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ dataService  │→ │   Adapters   │→ │ Supabase/DB  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│  ┌──────────────┐                    ┌──────────────┐            │
│  │  Supabase    │                    │  IndexedDB   │            │
│  │  (Cloud)     │                    │  (Local)     │            │
│  └──────────────┘                    └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Module-by-Module Analysis

### ✅ Module 1: Clients (7/10)

**Data Flow:**
```
Component → clientsSlice → dataService.clients → clientsTable → Supabase
```

**Status:** ✅ **FULLY CONNECTED**

| Operation | Frontend | dataService | Supabase Table | Status |
|-----------|----------|-------------|----------------|--------|
| **Read** | ✅ `fetchClientsFromSupabase` | ✅ `clients.getAll()` | ✅ `clientsTable.getByStoreId()` | ✅ Complete |
| **Search** | ✅ `searchClientsFromSupabase` | ✅ `clients.search()` | ✅ `clientsTable.search()` | ✅ Complete |
| **Get By ID** | ✅ `fetchClientByIdFromSupabase` | ✅ `clients.getById()` | ✅ `clientsTable.getById()` | ✅ Complete |
| **Create** | ✅ `createClientInSupabase` | ✅ `clients.create()` | ✅ `clientsTable.create()` | ✅ Complete |
| **Update** | ✅ `updateClientInSupabase` | ✅ `clients.update()` | ✅ `clientsTable.update()` | ✅ Complete |
| **Delete** | ⚠️ Missing | ❌ Not in dataService | ⚠️ `clientsTable.delete()` exists | ⚠️ **GAP** |

**Type Flow:**
```
Client (frontend) → toClientInsert() → ClientInsert (Supabase) → ClientRow → toClient() → Client
```

**Issues:**
- ⚠️ Delete operation not exposed in dataService or Redux slice
- ⚠️ Related entities (PatchTest, FormResponse, Referral, Review, LoyaltyReward) stored in IndexedDB only

**Recommendation:**
- Add `deleteClientInSupabase` thunk
- Add `clients.delete()` to dataService
- Consider Supabase tables for client-related entities

---

### ✅ Module 2: Staff (7/10)

**Data Flow:**
```
Component → staffSlice → dataService.staff → staffTable → Supabase
```

**Status:** ✅ **FULLY CONNECTED**

| Operation | Frontend | dataService | Supabase Table | Status |
|-----------|----------|-------------|----------------|--------|
| **Read All** | ✅ `fetchAllStaffFromSupabase` | ✅ `staff.getAll()` | ✅ `staffTable.getByStoreId()` | ✅ Complete |
| **Read Active** | ✅ `fetchActiveStaffFromSupabase` | ✅ `staff.getActive()` | ✅ `staffTable.getActiveByStoreId()` | ✅ Complete |
| **Get By ID** | ✅ `fetchStaffByIdFromSupabase` | ✅ `staff.getById()` | ✅ `staffTable.getById()` | ✅ Complete |
| **Create** | ✅ `createStaffInSupabase` | ✅ `staff.create()` | ✅ `staffTable.create()` | ✅ Complete |
| **Update** | ✅ `updateStaffInSupabase` | ✅ `staff.update()` | ✅ `staffTable.update()` | ✅ Complete |
| **Delete** | ⚠️ Missing | ❌ Not in dataService | ⚠️ `staffTable.delete()` exists | ⚠️ **GAP** |

**Type Flow:**
```
Staff (frontend) → toStaffInsert() → StaffInsert (Supabase) → StaffRow → toStaff() → Staff
```

**Issues:**
- ⚠️ Delete operation not exposed
- ⚠️ Staff schedule stored in JSON field (not normalized)
- ⚠️ Clock in/out operations use IndexedDB only

**Recommendation:**
- Add delete operation
- Consider separate `staff_schedules` table for better querying
- Add Supabase sync for clock in/out events

---

### ✅ Module 3: Services (6/10)

**Data Flow:**
```
Component → [No Redux slice] → dataService.services → servicesTable → Supabase
```

**Status:** ⚠️ **PARTIALLY CONNECTED**

| Operation | Frontend | dataService | Supabase Table | Status |
|-----------|----------|-------------|----------------|--------|
| **Read All** | ⚠️ Direct hook usage | ✅ `services.getAll()` | ✅ `servicesTable.getByStoreId()` | ✅ Complete |
| **Get By ID** | ⚠️ Direct hook usage | ✅ `services.getById()` | ✅ `servicesTable.getById()` | ✅ Complete |
| **Get Active** | ⚠️ Direct hook usage | ✅ `services.getActive()` | ✅ Filtered in dataService | ✅ Complete |
| **Create** | ❌ Missing | ❌ Not in dataService | ⚠️ `servicesTable.create()` exists | ❌ **GAP** |
| **Update** | ❌ Missing | ❌ Not in dataService | ⚠️ `servicesTable.update()` exists | ❌ **GAP** |
| **Delete** | ❌ Missing | ❌ Not in dataService | ⚠️ `servicesTable.delete()` exists | ❌ **GAP** |

**Type Flow:**
```
Service (frontend) → toServiceInsert() → ServiceInsert (Supabase) → ServiceRow → toService() → Service
```

**Issues:**
- ❌ **No Redux slice** - Services accessed directly via hooks
- ❌ **No create/update/delete** operations exposed
- ⚠️ Catalog module (categories, variants, packages) uses IndexedDB only

**Recommendation:**
- Create `servicesSlice` with full CRUD operations
- Add create/update/delete to dataService
- Consider Supabase tables for catalog entities

---

### ✅ Module 4: Appointments (8/10)

**Data Flow:**
```
Component → appointmentsSlice → dataService.appointments → appointmentsTable → Supabase
```

**Status:** ✅ **WELL CONNECTED**

| Operation | Frontend | dataService | Supabase Table | Status |
|-----------|----------|-------------|----------------|--------|
| **Read By Date** | ✅ `fetchAppointmentsByDateFromSupabase` | ✅ `appointments.getByDate()` | ✅ `appointmentsTable.getByDate()` | ✅ Complete |
| **Get By ID** | ✅ `fetchAppointmentByIdFromSupabase` | ✅ `appointments.getById()` | ✅ `appointmentsTable.getById()` | ✅ Complete |
| **Get Upcoming** | ✅ `fetchUpcomingAppointmentsFromSupabase` | ✅ `appointments.getUpcoming()` | ✅ `appointmentsTable.getUpcoming()` | ✅ Complete |
| **Create** | ✅ `createAppointmentInSupabase` | ✅ `appointments.create()` | ✅ `appointmentsTable.create()` | ✅ Complete |
| **Update** | ✅ `updateAppointmentInSupabase` | ✅ `appointments.update()` | ✅ `appointmentsTable.update()` | ✅ Complete |
| **Delete** | ⚠️ Missing | ❌ Not in dataService | ⚠️ `appointmentsTable.delete()` exists | ⚠️ **GAP** |

**Type Flow:**
```
Appointment (frontend) → toAppointmentInsert() → AppointmentInsert → AppointmentRow → toAppointment() → Appointment
```

**Issues:**
- ⚠️ Delete operation not exposed
- ⚠️ Also uses legacy `appointmentService` (mixed patterns)
- ✅ Good offline support with IndexedDB fallback

**Recommendation:**
- Add delete operation
- Consolidate to use only dataService (remove appointmentService)

---

### ⚠️ Module 5: Tickets (5/10)

**Data Flow:**
```
Component → ticketsSlice → dataService.tickets → ticketsTable → Supabase
```

**Status:** ⚠️ **PARTIALLY CONNECTED**

| Operation | Frontend | dataService | Supabase Table | Status |
|-----------|----------|-------------|----------------|--------|
| **Read By Date** | ✅ `fetchTicketsByDateFromSupabase` | ✅ `tickets.getByDate()` | ✅ `ticketsTable.getByDate()` | ✅ Complete |
| **Read Open** | ✅ `fetchOpenTicketsFromSupabase` | ✅ `tickets.getOpenTickets()` | ✅ `ticketsTable.getOpenTickets()` | ✅ Complete |
| **Get By ID** | ✅ `fetchTicketByIdFromSupabase` | ✅ `tickets.getById()` | ✅ `ticketsTable.getById()` | ✅ Complete |
| **Create** | ❌ Missing | ❌ Not in dataService | ✅ `ticketsTable.create()` exists | ❌ **CRITICAL GAP** |
| **Update** | ❌ Missing | ❌ Not in dataService | ✅ `ticketsTable.update()` exists | ❌ **CRITICAL GAP** |
| **Delete** | ❌ Missing | ❌ Not in dataService | ✅ `ticketsTable.delete()` exists | ❌ **CRITICAL GAP** |

**Type Flow:**
```
Ticket (frontend) → toTicketInsert() → TicketInsert → TicketRow → toTicket() → Ticket
```

**Issues:**
- ❌ **CRITICAL:** Create/update/delete operations missing
- ⚠️ Uses legacy IndexedDB operations (`createTicket`, `updateTicket`)
- ⚠️ Sync queue manually managed (not using dataService)

**Recommendation:**
- **URGENT:** Add `createTicketInSupabase`, `updateTicketInSupabase`, `deleteTicketInSupabase` thunks
- Add `tickets.create()`, `tickets.update()`, `tickets.delete()` to dataService
- Migrate from IndexedDB-first to Supabase-first with IndexedDB fallback

---

### ⚠️ Module 6: Transactions (4/10)

**Data Flow:**
```
Component → transactionsSlice → dataService.transactions → transactionsTable → Supabase
```

**Status:** ⚠️ **READ-ONLY CONNECTION**

| Operation | Frontend | dataService | Supabase Table | Status |
|-----------|----------|-------------|----------------|--------|
| **Read By Date** | ✅ `fetchTransactionsByDateFromSupabase` | ✅ `transactions.getByDate()` | ✅ `transactionsTable.getByDate()` | ✅ Complete |
| **Get By ID** | ✅ `fetchTransactionByIdFromSupabase` | ✅ `transactions.getById()` | ✅ `transactionsTable.getById()` | ✅ Complete |
| **Daily Summary** | ✅ `fetchDailySummaryFromSupabase` | ✅ `transactions.getDailySummary()` | ✅ `transactionsTable.getDailySummary()` | ✅ Complete |
| **Payment Breakdown** | ✅ `fetchPaymentBreakdownFromSupabase` | ✅ `transactions.getPaymentBreakdown()` | ✅ `transactionsTable.getPaymentBreakdown()` | ✅ Complete |
| **Create** | ❌ Missing | ❌ Not in dataService | ✅ `transactionsTable.create()` exists | ❌ **CRITICAL GAP** |
| **Update** | ❌ Missing | ❌ Not in dataService | ⚠️ `transactionsTable.update()` exists | ❌ **GAP** |
| **Void/Refund** | ❌ Missing | ❌ Not in dataService | ⚠️ Partial support | ❌ **CRITICAL GAP** |

**Type Flow:**
```
Transaction (frontend) → toTransactionInsert() → TransactionInsert → TransactionRow → toTransaction() → Transaction
```

**Issues:**
- ❌ **CRITICAL:** No way to create transactions in Supabase
- ⚠️ Transactions created via IndexedDB only (`createTransaction` thunk)
- ⚠️ Financial data not syncing to cloud (data loss risk)

**Recommendation:**
- **URGENT:** Add `createTransactionInSupabase` thunk
- Add `transactions.create()` to dataService
- Implement void/refund operations in Supabase
- **CRITICAL:** Financial data must sync to cloud for compliance

---

### ❌ Module 7: Catalog (3/10)

**Data Flow:**
```
Component → useCatalog hook → catalogDB (IndexedDB) → [No Supabase]
```

**Status:** ❌ **INDEXEDDB ONLY - NO CLOUD SYNC**

**Entities:**
- ServiceCategory
- MenuService
- ServiceVariant
- ServicePackage
- AddOnGroup
- AddOnOption
- StaffServiceAssignment
- CatalogSettings

**Issues:**
- ❌ **No Supabase tables** for catalog entities
- ❌ **No cloud sync** - data lost if device fails
- ⚠️ Deprecated Redux slice (uses `useCatalog` hook instead)
- ⚠️ Cannot share catalog across stores/devices

**Recommendation:**
- **HIGH PRIORITY:** Create Supabase tables for catalog entities
- Implement catalog sync service
- Add catalog operations to dataService
- Migrate from IndexedDB-only to Supabase with IndexedDB cache

---

### ❌ Module 8: Schedule (3/10)

**Data Flow:**
```
Component → scheduleSlice → scheduleDatabase (IndexedDB) → [No Supabase]
```

**Status:** ❌ **INDEXEDDB ONLY - NO CLOUD SYNC**

**Entities:**
- TimeOffType
- TimeOffRequest
- BlockedTimeType
- BlockedTimeEntry
- BusinessClosedPeriod
- Resource
- ResourceBooking
- StaffSchedule

**Issues:**
- ❌ **No Supabase tables** for schedule entities
- ❌ **No cloud sync** - schedule data device-specific
- ⚠️ Staff schedules stored in JSON field in staff table (not normalized)
- ⚠️ Cannot coordinate schedules across devices

**Recommendation:**
- **HIGH PRIORITY:** Create Supabase tables for schedule entities
- Normalize staff schedules (separate table)
- Implement schedule sync service
- Add schedule operations to dataService

---

### ❌ Module 9: Timesheet (3/10)

**Data Flow:**
```
Component → timesheetSlice → timesheetOperations (IndexedDB) → [No Supabase]
```

**Status:** ❌ **INDEXEDDB ONLY - NO CLOUD SYNC**

**Entities:**
- TimesheetEntry
- StaffShiftStatus
- AttendanceAlert

**Issues:**
- ❌ **No Supabase tables** for timesheet entities
- ❌ **No cloud sync** - attendance data device-specific
- ⚠️ Critical for payroll - must be in cloud
- ⚠️ Compliance risk (labor law requirements)

**Recommendation:**
- **URGENT:** Create Supabase tables for timesheet entities
- Implement timesheet sync service
- Add timesheet operations to dataService
- **CRITICAL:** Timesheet data required for payroll compliance

---

### ❌ Module 10: Team (3/10)

**Data Flow:**
```
Component → teamSlice → teamOperations (IndexedDB) → [No Supabase]
```

**Status:** ❌ **INDEXEDDB ONLY - NO CLOUD SYNC**

**Entities:**
- TeamMemberSettings
- TeamMemberProfile
- ServicePricing
- WorkingHoursSettings
- RolePermissions
- CommissionSettings
- PayrollSettings
- OnlineBookingSettings
- NotificationPreferences
- PerformanceGoals

**Issues:**
- ❌ **No Supabase tables** for team settings
- ❌ **No cloud sync** - settings device-specific
- ⚠️ Complex nested data structure
- ⚠️ Cannot share team settings across devices

**Recommendation:**
- **MEDIUM PRIORITY:** Create Supabase tables for team settings
- Consider JSON columns for complex nested data
- Implement team sync service
- Add team operations to dataService

---

### ⚠️ Module 11: Checkout (4/10)

**Data Flow:**
```
Component → checkoutSlice → ticketsDB (IndexedDB) → [Partial Supabase via tickets]
```

**Status:** ⚠️ **MIXED - DRAFTS IN INDEXEDDB ONLY**

**Entities:**
- DraftSale (IndexedDB only)
- ActiveCheckout (in-memory only)
- Payment flow state (in-memory)

**Issues:**
- ⚠️ Drafts stored in IndexedDB only (no cloud backup)
- ⚠️ Drafts lost if device fails
- ✅ Completed tickets sync via tickets table
- ⚠️ No draft recovery across devices

**Recommendation:**
- **MEDIUM PRIORITY:** Consider Supabase table for drafts (or accept IndexedDB-only)
- Add draft expiration cleanup
- Document draft limitations

---

## 🔍 Type Consistency Analysis

### ✅ Well-Implemented Adapters

**Pattern:**
```typescript
// Frontend Type → Supabase Insert
toClientInsert(client: Client): ClientInsert

// Supabase Row → Frontend Type
toClient(row: ClientRow): Client

// Frontend Update → Supabase Update
toClientUpdate(updates: Partial<Client>): ClientUpdate
```

**Status by Entity:**

| Entity | Adapter | Insert | Update | Batch | Status |
|--------|---------|--------|--------|-------|--------|
| **Client** | ✅ `toClient()` | ✅ `toClientInsert()` | ✅ `toClientUpdate()` | ✅ `toClients()` | ✅ Complete |
| **Staff** | ✅ `toStaff()` | ✅ `toStaffInsert()` | ✅ `toStaffUpdate()` | ✅ `toStaffList()` | ✅ Complete |
| **Service** | ✅ `toService()` | ✅ `toServiceInsert()` | ✅ `toServiceUpdate()` | ✅ `toServices()` | ✅ Complete |
| **Appointment** | ✅ `toAppointment()` | ✅ `toAppointmentInsert()` | ✅ `toAppointmentUpdate()` | ✅ `toAppointments()` | ✅ Complete |
| **Ticket** | ✅ `toTicket()` | ✅ `toTicketInsert()` | ✅ `toTicketUpdate()` | ✅ `toTickets()` | ✅ Complete |
| **Transaction** | ✅ `toTransaction()` | ✅ `toTransactionInsert()` | ✅ `toTransactionUpdate()` | ✅ `toTransactions()` | ✅ Complete |

**Issues:**
- ✅ All adapters properly handle snake_case ↔ camelCase conversion
- ✅ JSON fields properly serialized/deserialized
- ⚠️ Some adapters have incomplete field mappings (check individual adapters)

---

## 🔄 Offline Sync Analysis

### Current Implementation

**Offline-Enabled Mode Flow:**
```
User Action → Redux Thunk → IndexedDB (immediate) → Sync Queue → Supabase (when online)
```

**Online-Only Mode Flow:**
```
User Action → Redux Thunk → dataService → Supabase (direct)
```

### Sync Queue Status

**Entities with Sync Queue:**
- ✅ Appointments (via `appointmentService`)
- ✅ Tickets (manual sync queue management)
- ✅ Transactions (manual sync queue management)
- ⚠️ Clients (partial - some operations)
- ⚠️ Staff (partial - some operations)
- ❌ Services (no sync queue)
- ❌ Catalog (no sync - IndexedDB only)
- ❌ Schedule (no sync - IndexedDB only)
- ❌ Timesheet (no sync - IndexedDB only)
- ❌ Team (no sync - IndexedDB only)

### Issues

1. **Inconsistent Sync Patterns:**
   - Some entities use sync queue
   - Others use direct Supabase calls
   - No unified sync strategy

2. **Missing Sync Operations:**
   - Services create/update/delete not in sync queue
   - Tickets/Transactions create not properly queued

3. **Sync Queue Management:**
   - Manual queue management in some slices
   - Should be handled by dataService automatically

---

## 🚨 Critical Gaps & Missing Connections

### 🔴 Critical (Blocks Production)

1. **Tickets Create/Update/Delete Missing**
   - **Impact:** Cannot create tickets in Supabase
   - **Risk:** Data loss, no multi-device sync
   - **Files:** `src/store/slices/ticketsSlice.ts`, `src/services/dataService.ts`

2. **Transactions Create Missing**
   - **Impact:** Financial data not syncing to cloud
   - **Risk:** Compliance issues, data loss
   - **Files:** `src/store/slices/transactionsSlice.ts`, `src/services/dataService.ts`

3. **Timesheet No Cloud Sync**
   - **Impact:** Attendance data device-specific
   - **Risk:** Payroll compliance issues
   - **Files:** `src/store/slices/timesheetSlice.ts`

### 🟡 High Priority

4. **Services CRUD Missing**
   - **Impact:** Cannot manage services via Supabase
   - **Files:** `src/services/dataService.ts`

5. **Catalog No Cloud Sync**
   - **Impact:** Catalog data device-specific
   - **Files:** `src/hooks/useCatalog.ts`

6. **Schedule No Cloud Sync**
   - **Impact:** Schedule data device-specific
   - **Files:** `src/store/slices/scheduleSlice.ts`

### 🟢 Medium Priority

7. **Delete Operations Missing**
   - Clients, Staff, Appointments have delete in tables but not exposed
   - **Files:** Various slices

8. **Team Settings No Cloud Sync**
   - **Impact:** Settings device-specific
   - **Files:** `src/store/slices/teamSlice.ts`

---

## 📋 Data Flow Completeness Matrix

| Module | Read | Create | Update | Delete | Sync | Status |
|--------|------|--------|--------|--------|------|--------|
| **Clients** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | 7/10 |
| **Staff** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | 7/10 |
| **Services** | ✅ | ❌ | ❌ | ❌ | ❌ | 3/10 |
| **Appointments** | ✅ | ✅ | ✅ | ⚠️ | ✅ | 8/10 |
| **Tickets** | ✅ | ❌ | ❌ | ❌ | ⚠️ | 4/10 |
| **Transactions** | ✅ | ❌ | ⚠️ | ❌ | ❌ | 3/10 |
| **Catalog** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | 2/10 |
| **Schedule** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | 2/10 |
| **Timesheet** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | 2/10 |
| **Team** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | 2/10 |

**Legend:**
- ✅ = Fully implemented and connected
- ⚠️ = Partially implemented or IndexedDB only
- ❌ = Missing or not connected

---

## 🎯 Recommendations & Action Plan

### Phase 1: Critical Fixes (Week 1-2)

#### Task 1.1: Implement Tickets CRUD in Supabase

**Files to Modify:**
- `src/services/dataService.ts` - Add tickets.create(), update(), delete()
- `src/store/slices/ticketsSlice.ts` - Add Supabase thunks

**Code:**
```typescript
// src/services/dataService.ts
export const ticketsService = {
  // ... existing read methods ...
  
  async create(ticket: Omit<TicketInsert, 'store_id'>): Promise<TicketRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.create({ ...ticket, store_id: storeId });
  },
  
  async update(id: string, updates: TicketUpdate): Promise<TicketRow> {
    return ticketsTable.update(id, updates);
  },
  
  async delete(id: string): Promise<void> {
    return ticketsTable.delete(id);
  },
};

// src/store/slices/ticketsSlice.ts
export const createTicketInSupabase = createAsyncThunk(
  'tickets/createInSupabase',
  async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
    const insertData = toTicketInsert(ticket);
    const row = await dataService.tickets.create(insertData);
    return toTicket(row);
  }
);
```

**Estimated Time:** 8 hours

---

#### Task 1.2: Implement Transactions Create in Supabase

**Files to Modify:**
- `src/services/dataService.ts` - Add transactions.create()
- `src/store/slices/transactionsSlice.ts` - Add Supabase create thunk

**Code:**
```typescript
// src/services/dataService.ts
export const transactionsService = {
  // ... existing read methods ...
  
  async create(transaction: Omit<TransactionInsert, 'store_id'>): Promise<TransactionRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.create({ ...transaction, store_id: storeId });
  },
};

// src/store/slices/transactionsSlice.ts
export const createTransactionInSupabase = createAsyncThunk(
  'transactions/createInSupabase',
  async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const insertData = toTransactionInsert(transaction);
    const row = await dataService.transactions.create(insertData);
    return toTransaction(row);
  }
);
```

**Estimated Time:** 6 hours

---

#### Task 1.3: Add Delete Operations

**Files to Modify:**
- `src/services/dataService.ts` - Add delete() for clients, staff, appointments
- `src/store/slices/*Slice.ts` - Add delete thunks

**Estimated Time:** 4 hours

---

### Phase 2: High Priority (Week 3-4)

#### Task 2.1: Implement Services CRUD

**Files to Modify:**
- `src/services/dataService.ts` - Add services.create(), update(), delete()
- `src/store/slices/servicesSlice.ts` - Create new slice with CRUD thunks

**Estimated Time:** 8 hours

---

#### Task 2.2: Create Timesheet Supabase Tables

**Database Schema:**
```sql
CREATE TABLE timesheet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  staff_id UUID NOT NULL REFERENCES staff(id),
  date DATE NOT NULL,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  break_start_time TIMESTAMPTZ,
  break_end_time TIMESTAMPTZ,
  total_minutes INTEGER,
  status TEXT NOT NULL,
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to Create:**
- `src/services/supabase/tables/timesheetTable.ts`
- `src/services/supabase/adapters/timesheetAdapter.ts`

**Estimated Time:** 12 hours

---

### Phase 3: Medium Priority (Week 5-6)

#### Task 3.1: Create Catalog Supabase Tables

**Estimated Time:** 16 hours

#### Task 3.2: Create Schedule Supabase Tables

**Estimated Time:** 16 hours

#### Task 3.3: Create Team Settings Supabase Tables

**Estimated Time:** 12 hours

---

## 📊 Summary Statistics

### Connection Status

| Status | Count | Modules |
|--------|-------|---------|
| ✅ **Fully Connected** | 2 | Appointments, Clients (partial) |
| ⚠️ **Partially Connected** | 4 | Staff, Services, Tickets, Transactions |
| ❌ **Not Connected** | 4 | Catalog, Schedule, Timesheet, Team |

### CRUD Completeness

- **Read Operations:** 8/10 modules (80%)
- **Create Operations:** 4/10 modules (40%)
- **Update Operations:** 4/10 modules (40%)
- **Delete Operations:** 2/10 modules (20%)

### Overall Health

- **Core Business Entities:** 70% complete
- **Financial Entities:** 40% complete
- **Configuration Modules:** 20% complete
- **Overall:** 50% complete

---

## ✅ Verification Checklist

### For Each Module, Verify:

- [ ] Redux slice exists with thunks
- [ ] dataService methods implemented
- [ ] Supabase table operations complete
- [ ] Type adapters handle all fields
- [ ] Create operation works end-to-end
- [ ] Update operation works end-to-end
- [ ] Delete operation works end-to-end
- [ ] Read operations cover all use cases
- [ ] Offline sync queue integration
- [ ] Error handling implemented
- [ ] Type safety maintained

---

## 🎓 Best Practices Recommendations

### 1. Unified Data Flow Pattern

**Always use this pattern:**
```typescript
// Component
dispatch(createTicketInSupabase(ticketData))

// Redux Slice
createTicketInSupabase = createAsyncThunk(
  'tickets/create',
  async (data) => {
    const insert = toTicketInsert(data);
    const row = await dataService.tickets.create(insert);
    return toTicket(row);
  }
)

// dataService
tickets: {
  create: async (insert) => ticketsTable.create(insert)
}

// Supabase Table
ticketsTable.create(insert) // Direct Supabase call
```

### 2. Type Safety

- ✅ Always use adapters (never direct field mapping)
- ✅ Validate types at adapter boundaries
- ✅ Use TypeScript strict mode

### 3. Error Handling

- ✅ Handle Supabase errors gracefully
- ✅ Provide user-friendly error messages
- ✅ Log errors for debugging

### 4. Offline Support

- ✅ Queue operations when offline
- ✅ Retry failed syncs
- ✅ Show sync status to users

---

## 📝 Conclusion

**Current State:** The data flow is **partially complete** with good foundations but critical gaps.

**Key Findings:**
1. ✅ Core entities (clients, staff, appointments) well connected
2. ❌ Financial entities (tickets, transactions) missing create operations
3. ❌ Configuration modules (catalog, schedule, timesheet, team) IndexedDB-only
4. ⚠️ Inconsistent patterns across modules

**Priority Actions:**
1. **URGENT:** Implement tickets and transactions create operations
2. **HIGH:** Add timesheet cloud sync (compliance requirement)
3. **MEDIUM:** Migrate catalog, schedule, team to Supabase

**Estimated Effort:** 6-8 weeks to achieve 90%+ data flow completeness

---

**Analysis completed by:** Senior Backend Engineer  
**Next Review:** After Phase 1 implementation

