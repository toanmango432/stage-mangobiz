# Data Flow Architecture

> **Purpose:** Document the unified data access patterns in Mango POS
> **Created:** 2026-01-31
> **Status:** Active

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow Diagram](#data-flow-diagram)
3. [The dataService Pattern](#the-dataservice-pattern)
4. [Type Adapters](#type-adapters)
5. [Redux Integration](#redux-integration)
6. [Sync Architecture](#sync-architecture)
7. [Common Patterns](#common-patterns)
8. [Anti-Patterns](#anti-patterns)

---

## Overview

Mango POS uses a **LOCAL-FIRST** architecture where:

- All reads come from local storage (IndexedDB/SQLite) for instant response
- All writes go to local storage first, then queue for background sync
- Data flows through a unified `dataService` abstraction layer

### Key Principles

1. **Single Source of Truth:** Redux state derived from local database
2. **Offline-First:** App works without network connectivity
3. **Type Safety:** All data passes through type adapters
4. **Abstraction:** Components never access databases directly

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  BookPage   │  │  FrontDesk  │  │  Checkout   │  │  TeamSettings│        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                          useAppSelector / dispatch                           │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────────────────┐
│                           REDUX LAYER                                        │
│                                   │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Redux Thunks                                 │    │
│  │  fetchTeamMembers() | fetchClients() | createAppointment() | ...    │    │
│  └─────────────────────────────────┬───────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Redux Slices                                 │    │
│  │  teamSlice | clientsSlice | appointmentsSlice | ticketsSlice | ...  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────────────────┐
│                           DATA SERVICE LAYER                                 │
│                                   │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         dataService                                  │    │
│  │  dataService.clients | dataService.appointments | dataService.staff │    │
│  └─────────────────────────────────┬───────────────────────────────────┘    │
│                                    │                                         │
│  ┌──────────────────┐    ┌─────────┴─────────┐    ┌──────────────────┐      │
│  │  Type Adapters   │    │  Feature Flags    │    │  Sync Queue      │      │
│  │  toClient()      │    │  USE_SQLITE       │    │  queueOperation()│      │
│  │  toAppointment() │    │  USE_SUPABASE     │    │                  │      │
│  └──────────────────┘    └─────────┬─────────┘    └──────────────────┘      │
│                                    │                                         │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
┌───────────────────┴───┐  ┌────────┴────────┐  ┌──┴───────────────────┐
│     IndexedDB         │  │     SQLite      │  │      Supabase        │
│     (Dexie.js)        │  │   (Electron)    │  │    (PostgreSQL)      │
│                       │  │                 │  │                      │
│  Default local-first  │  │  Desktop app    │  │  Cloud sync target   │
│  Web/Mobile devices   │  │  performance    │  │  Real-time source    │
└───────────────────────┘  └─────────────────┘  └──────────────────────┘
```

---

## The dataService Pattern

### Usage

```typescript
// ✅ CORRECT: Use dataService for all data operations
import { dataService } from '@/services/dataService';

// Read operations
const clients = await dataService.clients.getAll();
const client = await dataService.clients.getById(id);
const results = await dataService.clients.search(query);

// Write operations
const newClient = await dataService.clients.create(clientData);
await dataService.clients.update(id, updates);
await dataService.clients.delete(id);
```

### Available Services

| Service | Purpose |
|---------|---------|
| `dataService.clients` | Client/customer data |
| `dataService.appointments` | Appointment scheduling |
| `dataService.tickets` | Service tickets |
| `dataService.transactions` | Payment transactions |
| `dataService.staff` | Staff/employee data |
| `dataService.team` | Full team member settings |
| `dataService.services` | Basic service catalog |
| `dataService.menuServices` | Menu services with categories |
| `dataService.giftCards` | Gift card operations |

### Internal Routing

dataService automatically routes to the correct storage based on feature flags:

```typescript
// Inside dataService (simplified)
async getAll() {
  if (USE_SQLITE) {
    return sqliteClientsDB.getAll(storeId);  // Electron desktop
  }
  if (USE_SUPABASE) {
    return supabaseClientsTable.getAll();    // Online-only mode
  }
  return clientsDB.getAll(storeId);          // Default: IndexedDB
}
```

---

## Type Adapters

### Purpose

Type adapters convert between:
- **Database format** (snake_case, Supabase rows)
- **Application format** (camelCase, TypeScript interfaces)

### Location

```
apps/store-app/src/services/supabase/adapters/
├── clientAdapter.ts
├── appointmentAdapter.ts
├── ticketAdapter.ts
├── transactionAdapter.ts
├── staffAdapter.ts
└── index.ts  (barrel exports)
```

### Example

```typescript
// clientAdapter.ts
import type { ClientRow } from '../types';
import type { Client } from '@/types';

export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    storeId: row.store_id,           // snake_case → camelCase
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email || undefined,
    isBlocked: row.is_blocked,
    isVip: row.is_vip,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toClientInsert(client: Partial<Client>): ClientInsert {
  return {
    store_id: client.storeId,
    first_name: client.firstName,    // camelCase → snake_case
    last_name: client.lastName,
    phone: client.phone,
    // ...
  };
}
```

### Usage in Services

```typescript
// In a data service
import { toClient, toClients, toClientInsert } from './supabase/adapters';

async create(data: ClientCreate): Promise<Client> {
  const insert = toClientInsert(data);        // Convert to DB format
  const row = await supabase.from('clients').insert(insert).single();
  return toClient(row);                        // Convert back to app format
}
```

---

## Redux Integration

### Standard Pattern

```typescript
// In a Redux thunk
import { dataService } from '@/services/dataService';

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const clients = await dataService.clients.getAll();
      return clients;  // Already in app format
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### In Components

```typescript
// ✅ CORRECT: Use Redux selectors for data
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectAllClients } from '@/store/slices/clientsSlice';
import { fetchClients } from '@/store/slices/clientsSlice/thunks';

function ClientList() {
  const dispatch = useAppDispatch();
  const clients = useAppSelector(selectAllClients);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  return <div>{clients.map(c => <ClientCard key={c.id} client={c} />)}</div>;
}
```

---

## Sync Architecture

### Components

| Component | Purpose |
|-----------|---------|
| `hydrationService.ts` | Initial data load on login |
| `backgroundSyncService.ts` | Process sync queue in background |
| `SupabaseSyncProvider.tsx` | Real-time subscriptions |
| `syncQueueDB` | Queue pending operations |

### Sync Flow

```
1. USER ACTION
   └─→ Component calls dispatch(createAppointment(data))

2. REDUX THUNK
   └─→ dataService.appointments.create(data)

3. DATA SERVICE
   ├─→ Write to IndexedDB (immediate)
   └─→ Queue sync operation (non-blocking)

4. BACKGROUND SYNC (every 2 minutes or on reconnect)
   ├─→ Read from syncQueueDB
   ├─→ Push to Supabase
   └─→ Update sync status

5. REAL-TIME (SupabaseSyncProvider)
   ├─→ Listen for Supabase changes
   └─→ Update Redux state
```

### Hydration on Login

```typescript
// hydrationService.ts
export async function hydrateStore(storeId: string) {
  // Stage 1: Staff
  const staff = await supabaseStaffTable.getByStoreId(storeId);
  await staffDB.bulkUpsert(staff);

  // Stage 2: Services
  const services = await supabaseServicesTable.getByStoreId(storeId);
  await servicesDB.bulkUpsert(services);

  // Stage 3: Appointments (today + 7 days)
  const appointments = await supabaseAppointmentsTable.getUpcoming(storeId);
  await appointmentsDB.bulkUpsert(appointments);

  // Stage 4: Clients (recent)
  const clients = await supabaseClientsTable.getRecent(storeId, 500);
  await clientsDB.bulkUpsert(clients);

  // Stage 5: Tickets (open)
  const tickets = await supabaseTicketsTable.getOpen(storeId);
  await ticketsDB.bulkUpsert(tickets);
}
```

---

## Common Patterns

### 1. Loading Data in Components

```typescript
// ✅ CORRECT
useEffect(() => {
  dispatch(fetchAppointments(selectedDate));
}, [dispatch, selectedDate]);

const appointments = useAppSelector(selectAppointmentsByDate(selectedDate));
```

### 2. Creating Records

```typescript
// ✅ CORRECT
const handleSave = async () => {
  try {
    await dispatch(createClient(formData)).unwrap();
    toast.success('Client created');
    onClose();
  } catch (error) {
    toast.error('Failed to create client');
  }
};
```

### 3. Search with Debounce

```typescript
// ✅ CORRECT
useEffect(() => {
  const search = async () => {
    if (query.length < 2) return;
    const results = await dataService.clients.search(query);
    setResults(results);
  };

  const debounce = setTimeout(search, 300);
  return () => clearTimeout(debounce);
}, [query]);
```

---

## Anti-Patterns

### ❌ Direct Database Access

```typescript
// ❌ WRONG: Direct IndexedDB access
import { clientsDB } from '@/db/database';
const clients = await clientsDB.getAll(storeId);

// ✅ CORRECT: Use dataService
import { dataService } from '@/services/dataService';
const clients = await dataService.clients.getAll();
```

### ❌ Direct Supabase Access

```typescript
// ❌ WRONG: Direct Supabase calls in components
import { supabase } from '@/services/supabase/client';
const { data } = await supabase.from('clients').select('*');

// ✅ CORRECT: Use dataService (routes automatically)
import { dataService } from '@/services/dataService';
const clients = await dataService.clients.getAll();
```

### ❌ Bypassing Type Adapters

```typescript
// ❌ WRONG: Manual snake_case conversion
const client = {
  first_name: data.firstName,
  last_name: data.lastName,
};

// ✅ CORRECT: Use type adapters
import { toClientInsert } from '@/services/supabase/adapters';
const client = toClientInsert(data);
```

### ❌ Fetching in Render

```typescript
// ❌ WRONG: Fetch inside render
function ClientCard({ clientId }) {
  const [client, setClient] = useState(null);
  dataService.clients.getById(clientId).then(setClient);  // Called every render!
  return <div>{client?.name}</div>;
}

// ✅ CORRECT: Use useEffect or Redux selector
function ClientCard({ clientId }) {
  const client = useAppSelector(state => selectClientById(state, clientId));
  return <div>{client?.name}</div>;
}
```

---

## Related Documentation

- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Full technical overview
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Storage layer details
- [DATA_ARCHITECTURE_REMEDIATION_PLAN.md](../implementation/DATA_ARCHITECTURE_REMEDIATION_PLAN.md) - Migration plan

---

*Last updated: 2026-01-31*
