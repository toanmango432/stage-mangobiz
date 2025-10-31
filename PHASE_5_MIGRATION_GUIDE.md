# Phase 5: UI Migration Guide

## 🎯 Overview

This guide shows how to migrate your existing UI components from TicketContext to Redux + IndexedDB.

---

## ✅ What's Ready

### **Backend Infrastructure (Phases 1-4)**
- ✅ IndexedDB database layer
- ✅ Redux store with slices
- ✅ API client with JWT auth
- ✅ Sync engine with offline support
- ✅ Socket.io for real-time updates

### **New UI Slices (Phase 5)**
- ✅ `uiTicketsSlice` - Matches your existing Ticket interface
- ✅ `uiStaffSlice` - Matches your existing Staff interface
- ✅ `useTicketsCompat` hook - Drop-in replacement for useTickets()

---

## 🔄 Migration Strategy

### **Option 1: Quick Migration (Recommended)**

Use the compatibility hook - **zero code changes** needed!

```typescript
// Before (TicketContext)
import { useTickets } from '../context/TicketContext';

// After (Redux + IndexedDB)
import { useTickets } from '../hooks/useTicketsCompat';

// Everything else stays the same!
const { waitlist, createTicket, assignTicket } = useTickets();
```

### **Option 2: Gradual Migration**

Migrate components one at a time to use Redux directly:

```typescript
// Before
import { useTickets } from '../context/TicketContext';
const { waitlist } = useTickets();

// After
import { useAppSelector } from '../store/hooks';
import { selectWaitlist } from '../store/slices/uiTicketsSlice';
const waitlist = useAppSelector(selectWaitlist);
```

---

## 📝 Step-by-Step Migration

### **Step 1: Update Imports**

Find all files using TicketContext:

```bash
# Search for TicketContext usage
grep -r "useTickets" src/components/
```

Replace imports:

```typescript
// Old
import { useTickets } from '../context/TicketContext';

// New
import { useTickets } from '../hooks/useTicketsCompat';
```

### **Step 2: Test Each Component**

After changing imports, test that the component still works:

1. Create a ticket
2. Assign to staff
3. Complete ticket
4. Check IndexedDB (DevTools → Application → IndexedDB)

### **Step 3: Verify Data Persistence**

```typescript
// Open browser console
const db = await window.indexedDB.open('MangoBizDB');

// Check tickets table
const transaction = db.transaction(['tickets'], 'readonly');
const store = transaction.objectStore('tickets');
const tickets = await store.getAll();
console.log('Tickets in IndexedDB:', tickets);
```

---

## 🔧 Component Migration Examples

### **Example 1: WaitListSection.tsx**

```typescript
// Before
import { useTickets } from '../context/TicketContext';

export function WaitListSection() {
  const { waitlist, assignTicket, deleteTicket } = useTickets();
  
  // ... rest of component
}
```

```typescript
// After (Option 1: Compatibility Hook)
import { useTickets } from '../hooks/useTicketsCompat';

export function WaitListSection() {
  const { waitlist, assignTicket, deleteTicket } = useTickets();
  
  // No other changes needed!
}
```

```typescript
// After (Option 2: Direct Redux)
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectWaitlist, 
  assignTicket as assignTicketThunk,
  deleteTicket as deleteTicketThunk 
} from '../store/slices/uiTicketsSlice';

export function WaitListSection() {
  const dispatch = useAppDispatch();
  const waitlist = useAppSelector(selectWaitlist);
  
  const handleAssign = (ticketId, staffId, staffName, staffColor) => {
    dispatch(assignTicketThunk({ ticketId, staffId, staffName, staffColor }));
  };
  
  const handleDelete = (ticketId, reason) => {
    dispatch(deleteTicketThunk({ ticketId, reason }));
  };
  
  // ... rest of component
}
```

### **Example 2: ServiceSection.tsx**

```typescript
// Before
import { useTickets } from '../context/TicketContext';

export function ServiceSection() {
  const { serviceTickets, completeTicket } = useTickets();
  
  // ... rest of component
}
```

```typescript
// After (Compatibility Hook)
import { useTickets } from '../hooks/useTicketsCompat';

export function ServiceSection() {
  const { serviceTickets, completeTicket } = useTickets();
  
  // No changes needed!
}
```

### **Example 3: StaffSidebar.tsx**

```typescript
// Before
import { useTickets } from '../context/TicketContext';

export function StaffSidebar() {
  const { staff, resetStaffStatus } = useTickets();
  
  // ... rest of component
}
```

```typescript
// After (Compatibility Hook)
import { useTickets } from '../hooks/useTicketsCompat';

export function StaffSidebar() {
  const { staff, resetStaffStatus } = useTickets();
  
  // No changes needed!
}
```

---

## 🎯 Migration Checklist

### **Phase 5.1: Quick Win (1 day)**
- [ ] Update all `useTickets` imports to use compatibility hook
- [ ] Test all components still work
- [ ] Verify data saves to IndexedDB
- [ ] Check browser console for errors

### **Phase 5.2: Add Real-time Sync (1 day)**
- [ ] Connect Socket.io listeners
- [ ] Update Redux on socket events
- [ ] Test multi-device sync
- [ ] Add sync status indicators

### **Phase 5.3: Enable Offline Mode (1 day)**
- [ ] Test offline ticket creation
- [ ] Verify sync queue works
- [ ] Test conflict resolution
- [ ] Add offline indicators

### **Phase 5.4: Connect to Backend API (2 days)**
- [ ] Update API endpoints
- [ ] Test with real backend
- [ ] Handle loading states
- [ ] Handle error states

### **Phase 5.5: Polish & Testing (2 days)**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation

---

## 🔍 Debugging Tips

### **Check Redux State**

```typescript
// In browser console
window.__REDUX_DEVTOOLS_EXTENSION__?.()
```

### **Check IndexedDB**

```typescript
// Open DevTools → Application → IndexedDB → MangoBizDB
// Inspect: tickets, staff, syncQueue tables
```

### **Check Sync Queue**

```typescript
import { syncQueueDB } from './db/database';

const pending = await syncQueueDB.getPending();
console.log('Pending sync operations:', pending);
```

### **Trigger Manual Sync**

```typescript
import { syncManager } from './services/syncManager';

await syncManager.syncNow();
```

---

## 📊 Data Flow (New)

```
User Action (e.g., Create Ticket)
    ↓
Component calls useTickets().createTicket()
    ↓
Compatibility hook dispatches Redux action
    ↓
Redux thunk (createTicketThunk)
    ↓
1. Save to IndexedDB (offline-first)
    ↓
2. Add to sync queue
    ↓
3. Try API call if online
    ↓
4. Update Redux state
    ↓
Component re-renders with new data
    ↓
Sync manager processes queue (background)
    ↓
Socket.io broadcasts to other devices
    ↓
Other devices update via socket listener
```

---

## 🚀 Quick Start

### **1. Install Dependencies (if needed)**

```bash
npm install uuid
```

### **2. Update One Component**

```typescript
// src/components/WaitListSection.tsx
// Change line 2:
import { useTickets } from '../hooks/useTicketsCompat';
```

### **3. Test It**

```bash
npm run dev
```

1. Open http://localhost:5173
2. Create a ticket
3. Open DevTools → Application → IndexedDB → MangoBizDB → tickets
4. See your ticket saved!

### **4. Repeat for All Components**

Use find & replace:

```bash
# Find
import { useTickets } from '../context/TicketContext';

# Replace with
import { useTickets } from '../hooks/useTicketsCompat';
```

---

## 📋 Files to Update

### **Components Using TicketContext:**

1. `src/components/WaitListSection.tsx`
2. `src/components/ServiceSection.tsx`
3. `src/components/PendingTickets.tsx`
4. `src/components/ComingAppointments.tsx`
5. `src/components/ClosedTickets.tsx`
6. `src/components/StaffSidebar.tsx`
7. `src/components/SalonCenter.tsx`
8. `src/components/CreateTicketModal.tsx`
9. `src/components/AssignTicketModal.tsx`
10. `src/components/EditTicketModal.tsx`
11. `src/components/CompleteTicketModal.tsx`

**Total: ~11 files to update**

---

## ⚠️ Important Notes

### **Type Compatibility**

The compatibility hook uses the same types as TicketContext:

```typescript
// Old types still work
interface Ticket {
  id: string;  // Changed from number to string (UUID)
  number: number;
  clientName: string;
  // ... rest unchanged
}
```

**Note:** `id` changed from `number` to `string` (UUID) for better offline support.

### **Async Operations**

Redux thunks are async, but the compatibility hook handles this:

```typescript
// Old (synchronous)
createTicket(ticketData);

// New (async under the hood, but same API)
createTicket(ticketData); // Still works!
```

### **Real-time Updates**

Socket.io updates will automatically update Redux state:

```typescript
// In syncManager or socket client
socketClient.on('ticket:created', (ticket) => {
  dispatch(ticketUpdated(ticket));
});
```

---

## 🎯 Success Criteria

After migration, you should have:

- ✅ All components working with Redux
- ✅ Data persisting to IndexedDB
- ✅ Offline mode working
- ✅ Sync queue processing
- ✅ Real-time updates (when backend connected)
- ✅ No breaking changes to UI
- ✅ Same user experience

---

## 🚀 Next Steps After Migration

Once migration is complete:

1. **Connect to real backend** (update API URLs)
2. **Enable Socket.io** (real-time multi-device sync)
3. **Test offline mode** (disconnect network, create tickets)
4. **Add loading states** (show spinners during API calls)
5. **Add error handling** (show error messages)
6. **Performance optimization** (memoization, lazy loading)

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check Redux DevTools for state
3. Check IndexedDB for data
4. Check sync queue for pending operations
5. Review this guide for examples

---

**Ready to start migration!** 🚀

The compatibility hook makes this a **1-day migration** instead of a 1-week rewrite!
