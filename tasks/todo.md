# Direct Supabase Sync Architecture - Implementation Plan

> **Goal**: Sync all business data (clients, staff, services, appointments, tickets) directly with Supabase
> **Scale Target**: 10,000 accounts
> **Estimated Phases**: 5 phases

---

## Phase 1: Database Schema Setup in Supabase

### Tasks
- [ ] 1.1 Create `clients` table with RLS policies
- [ ] 1.2 Create `staff` table with RLS policies
- [ ] 1.3 Create `services` table with RLS policies
- [ ] 1.4 Create `categories` table with RLS policies
- [ ] 1.5 Create `appointments` table with RLS policies
- [ ] 1.6 Create `tickets` table with RLS policies
- [ ] 1.7 Create `transactions` table with RLS policies
- [ ] 1.8 Add indexes on `store_id` for all tables
- [ ] 1.9 Set up database triggers for `updated_at` timestamps

### Schema Design
```sql
-- All tables will have these common columns:
-- id (UUID, primary key)
-- store_id (UUID, foreign key to stores)
-- created_at (timestamp)
-- updated_at (timestamp)
-- sync_version (integer for conflict resolution)
```

### Validation
- Run SQL in Supabase dashboard
- Verify tables appear in Table Editor
- Test RLS policies with different store_ids

---

## Phase 2: Supabase Client & Type Definitions

### Tasks
- [ ] 2.1 Create `src/services/supabase/client.ts` - Main Supabase client
- [ ] 2.2 Create `src/services/supabase/types.ts` - Database type definitions
- [ ] 2.3 Create `src/services/supabase/tables/clientsTable.ts` - Clients CRUD
- [ ] 2.4 Create `src/services/supabase/tables/staffTable.ts` - Staff CRUD
- [ ] 2.5 Create `src/services/supabase/tables/servicesTable.ts` - Services CRUD
- [ ] 2.6 Create `src/services/supabase/tables/appointmentsTable.ts` - Appointments CRUD
- [ ] 2.7 Create `src/services/supabase/tables/ticketsTable.ts` - Tickets CRUD
- [ ] 2.8 Create `src/services/supabase/index.ts` - Export all

### File Structure
```
src/services/supabase/
├── client.ts           # Supabase client instance
├── types.ts            # Database types (generated from Supabase)
├── index.ts            # Re-export all
└── tables/
    ├── clientsTable.ts
    ├── staffTable.ts
    ├── servicesTable.ts
    ├── categoriesTable.ts
    ├── appointmentsTable.ts
    ├── ticketsTable.ts
    └── transactionsTable.ts
```

### Validation
- Import and test each table module
- Verify TypeScript types match database schema
- Test basic CRUD operations via console

---

## Phase 3: Sync Service Implementation

### Tasks
- [ ] 3.1 Create `src/services/sync/syncService.ts` - Main sync orchestrator
- [ ] 3.2 Create `src/services/sync/conflictResolver.ts` - Handle sync conflicts
- [ ] 3.3 Create `src/services/sync/syncQueue.ts` - Queue pending operations
- [ ] 3.4 Update `src/services/dataService.ts` - Route to Supabase or IndexedDB
- [ ] 3.5 Create `src/services/sync/realtimeSubscriptions.ts` - Real-time updates
- [ ] 3.6 Add sync status indicators to Redux

### Sync Logic
```typescript
// Online-Only Device:
User Action → Supabase (direct) → Redux (update UI)

// Offline-Enabled Device:
User Action → IndexedDB (immediate) → Redux → Sync Queue → Supabase (when online)

// Real-time (all devices):
Supabase Change → Real-time Subscription → Redux → UI Update
```

### Validation
- Test sync with network throttling
- Verify offline queue works
- Test conflict resolution scenarios

---

## Phase 4: Integration with Existing Code

### Tasks
- [ ] 4.1 Update `src/store/slices/clientsSlice.ts` - Use new sync service
- [ ] 4.2 Update `src/store/slices/staffSlice.ts` - Use new sync service
- [ ] 4.3 Update `src/store/slices/appointmentsSlice.ts` - Use new sync service
- [ ] 4.4 Update `src/store/slices/ticketsSlice.ts` - Use new sync service
- [ ] 4.5 Update `src/db/database.ts` - Add sync metadata
- [ ] 4.6 Remove old mock API calls from services
- [ ] 4.7 Update `src/services/syncManager.ts` - Use new sync service

### Migration Strategy
- Add Supabase alongside existing code (don't remove yet)
- Feature flag to switch between old/new
- Gradual rollout per data type

### Validation
- Test each slice independently
- Verify data consistency between IndexedDB and Supabase
- Test full user workflows (book appointment, checkout, etc.)

---

## Phase 5: Real-time & Multi-device Sync

### Tasks
- [ ] 5.1 Set up Supabase real-time subscriptions per store
- [ ] 5.2 Handle incoming changes in Redux
- [ ] 5.3 Add optimistic updates with rollback
- [ ] 5.4 Implement presence (show which devices are active)
- [ ] 5.5 Add sync status UI component
- [ ] 5.6 Test multi-device scenarios

### Real-time Events
```typescript
// Subscribe to changes for this store
supabase
  .channel('store-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    filter: `store_id=eq.${storeId}`
  }, handleChange)
  .subscribe()
```

### Validation
- Open app on 2 devices
- Create appointment on device A
- Verify it appears on device B within 1-2 seconds
- Test with network interruptions

---

## Review Section

> To be filled after implementation

### Changes Made
- [ ] Database tables created
- [ ] Supabase client configured
- [ ] Sync service implemented
- [ ] Redux slices updated
- [ ] Real-time working

### Performance Notes
-

### Known Issues
-

### Future Improvements
-

---

## Quick Reference

### Supabase Dashboard
- URL: https://supabase.com/dashboard/project/cpaldkcvdcdyzytosntc
- Tables: Table Editor → Public schema

### Environment Variables
```env
VITE_SUPABASE_URL=https://cpaldkcvdcdyzytosntc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npx supabase gen types typescript --project-id cpaldkcvdcdyzytosntc > src/services/supabase/types.ts
```
