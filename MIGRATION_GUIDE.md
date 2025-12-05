# 🔄 Migration Guide - Legacy to Supabase

**Date:** December 2025  
**Purpose:** Guide for migrating from legacy IndexedDB-only thunks to Supabase thunks

---

## ⚠️ Deprecated Thunks

The following thunks are **deprecated** and should be replaced with Supabase versions:

### Transactions

| Legacy (Deprecated) | Supabase (Use This) |
|---------------------|---------------------|
| `createTransaction` | `createTransactionInSupabase` |
| `fetchTransactions` | `fetchTransactionsByDateFromSupabase` |

### Tickets

| Legacy (Deprecated) | Supabase (Use This) |
|---------------------|---------------------|
| `createTicket` | `createTicketInSupabase` |
| `updateTicket` | `updateTicketInSupabase` |
| `fetchTickets` | `fetchTicketsByDateFromSupabase` |

### Appointments

| Legacy (Deprecated) | Supabase (Use This) |
|---------------------|---------------------|
| `createAppointment` | `createAppointmentInSupabase` |
| `updateAppointment` | `updateAppointmentInSupabase` |

---

## 📝 Migration Examples

### Example 1: Creating a Transaction

**Before (Deprecated):**
```typescript
import { createTransaction } from '../../store/slices/transactionsSlice';

await dispatch(createTransaction({
  ticketId: ticket.id,
  _salonId: ticket.salonId,
  _userId: currentUser.id
})).unwrap();
```

**After (Recommended):**
```typescript
import { createTransactionInSupabase } from '../../store/slices/transactionsSlice';

await dispatch(createTransactionInSupabase({
  ticketId: ticket.id,
  ticketNumber: ticket.number || 0,
  clientId: ticket.clientId,
  clientName: ticket.clientName,
  subtotal: afterDiscount,
  tax: taxAmount,
  tip: tipValue,
  discount: discountValue,
  total: grandTotal,
  paymentMethod: 'cash',
  paymentDetails: { /* payment details */ },
})).unwrap();
```

### Example 2: Creating a Ticket

**Before (Deprecated):**
```typescript
import { createTicket } from '../../store/slices/ticketsSlice';

await dispatch(createTicket({
  input: ticketData,
  userId: currentUser.id,
  salonId: salonId
})).unwrap();
```

**After (Recommended):**
```typescript
import { createTicketInSupabase } from '../../store/slices/ticketsSlice';

await dispatch(createTicketInSupabase({
  appointmentId: appointmentId, // Optional
  clientId: clientId,
  clientName: clientName,
  clientPhone: clientPhone,
  services: services,
  source: 'calendar',
})).unwrap();
```

### Example 3: Updating a Ticket

**Before (Deprecated):**
```typescript
import { updateTicket } from '../../store/slices/ticketsSlice';

await dispatch(updateTicket({
  id: ticket.id,
  updates: { status: 'completed' },
  userId: currentUser.id
})).unwrap();
```

**After (Recommended):**
```typescript
import { updateTicketInSupabase } from '../../store/slices/ticketsSlice';

await dispatch(updateTicketInSupabase({
  id: ticket.id,
  updates: { status: 'completed' }
})).unwrap();
```

---

## 🎯 When to Use Legacy vs Supabase Thunks

### Use Supabase Thunks When:
- ✅ **Online-only mode** - Device is always online
- ✅ **Immediate sync required** - Need data in Supabase immediately
- ✅ **Multi-device sync** - Need data available on other devices right away
- ✅ **Production environment** - Standard production use case

### Legacy Thunks May Still Be Used When:
- ⚠️ **Offline-enabled mode** - Device supports offline operation
- ⚠️ **Sync queue needed** - Operations should be queued for later sync
- ⚠️ **Backward compatibility** - Maintaining existing offline functionality

**Note:** Legacy thunks will show deprecation warnings in console. They will continue to work but should be migrated eventually.

---

## 🔍 Finding Legacy Usage

To find components still using legacy thunks:

```bash
# Search for deprecated transaction creation
grep -r "createTransaction(" src/components

# Search for deprecated ticket creation
grep -r "createTicket(" src/components

# Search for deprecated ticket updates
grep -r "updateTicket(" src/components
```

---

## ✅ Migration Checklist

For each component:

- [ ] Identify legacy thunk usage
- [ ] Replace with Supabase version
- [ ] Update input format (may differ)
- [ ] Remove `userId` and `salonId` parameters (handled internally)
- [ ] Test the migration
- [ ] Verify data appears in Supabase
- [ ] Remove legacy import

---

## 🐛 Common Issues

### Issue: "Validation failed" error
**Cause:** Foreign key validation failed  
**Solution:** Ensure referenced entities (client, staff, service) exist in Supabase

### Issue: "No store ID available" error
**Cause:** Store ID not set in Redux auth state  
**Solution:** Ensure user is logged in and `storeId` is set

### Issue: Data not appearing in Supabase
**Cause:** Using legacy thunk or Supabase connection issue  
**Solution:** Verify using Supabase thunk, check network tab for API calls

---

**Migration Guide Created By:** Senior Backend Engineer  
**Last Updated:** December 2025

