# 🧪 Front Desk Backend Test Suite

**Date:** December 2025  
**Purpose:** Comprehensive backend testing of all Front Desk data flows  
**Status:** Ready for Execution

---

## 📋 Test Overview

This test suite verifies all backend data flows from the Front Desk module, ensuring:
- ✅ Data is correctly saved to Supabase
- ✅ Relationships are properly maintained
- ✅ All CRUD operations work correctly
- ✅ Error handling is robust

---

## 🔍 Front Desk Data Flows Identified

### 1. **Wait List Section**
- Create ticket (check-in walk-in client)
- Assign ticket to staff
- Delete ticket
- Move ticket to service

### 2. **Service Section**
- Start service (move from waitlist)
- Complete ticket (move to pending payment)
- Pause/Resume service
- Delete ticket

### 3. **Coming Appointments**
- Check in appointment (creates ticket with appointmentId)
- View upcoming appointments

### 4. **Pending Tickets**
- Complete payment (creates transaction)
- Apply discounts
- Process payments

---

## 🧪 Test Suite

### Test 1: Create Ticket from Wait List

**Flow:** Walk-in client → Create ticket → Add to waitlist

**Steps:**
1. Navigate to Front Desk
2. Click "Add Ticket" or "New Ticket"
3. Select a client (or create walk-in)
4. Add service(s)
5. Assign to staff
6. Click "Check In" or "Add to Waitlist"

**Backend Verification:**
```sql
-- Check ticket created in Supabase
SELECT * FROM tickets 
WHERE status = 'pending' OR status = 'waiting'
ORDER BY created_at DESC 
LIMIT 1;

-- Verify ticket has:
-- ✅ client_id set
-- ✅ store_id set
-- ✅ services array populated
-- ✅ status = 'pending' or 'waiting'
```

**Expected Results:**
- [ ] Ticket appears in Supabase `tickets` table
- [ ] `client_id` is set correctly
- [ ] `store_id` matches current store
- [ ] Services are properly formatted in JSON
- [ ] Status is correct

---

### Test 2: Check In Appointment (Creates Ticket)

**Flow:** Appointment → Check In → Ticket Created with appointmentId

**Steps:**
1. Navigate to Front Desk
2. Find an appointment in "Coming Appointments" section
3. Click "Check In" on the appointment
4. Verify ticket is created

**Backend Verification:**
```sql
-- Check ticket created with appointment link
SELECT t.*, a.id as appointment_id, a.status as appointment_status
FROM tickets t
LEFT JOIN appointments a ON t.appointment_id = a.id
WHERE t.appointment_id IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 1;

-- Verify appointment status updated
SELECT * FROM appointments
WHERE status = 'checked-in'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Ticket created in Supabase
- [ ] `appointment_id` is NOT NULL
- [ ] `appointment_id` links to correct appointment
- [ ] Appointment status updated to `'checked-in'`
- [ ] Ticket services match appointment services

---

### Test 3: Assign Ticket to Staff

**Flow:** Waitlist ticket → Assign to staff → Status update

**Steps:**
1. Find a ticket in Wait List
2. Click "Assign" or use dropdown menu
3. Select a staff member
4. Verify assignment

**Backend Verification:**
```sql
-- Check ticket assignment
SELECT t.*, s.name as staff_name
FROM tickets t
LEFT JOIN staff s ON t.services::jsonb->0->>'staffId' = s.id::text
WHERE t.status = 'pending'
ORDER BY t.updated_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Ticket updated in Supabase
- [ ] Service has `staffId` set
- [ ] `updated_at` timestamp is recent

---

### Test 4: Start Service (Move to In-Service)

**Flow:** Waitlist ticket → Start service → Move to Service section

**Steps:**
1. Find a ticket in Wait List
2. Click "Start Service" or move to Service section
3. Verify ticket moves

**Backend Verification:**
```sql
-- Check ticket status change
SELECT * FROM tickets
WHERE status = 'in-service'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Ticket status updated to `'in-service'`
- [ ] `updated_at` timestamp is recent
- [ ] Ticket appears in Service section

---

### Test 5: Complete Ticket (Move to Pending Payment)

**Flow:** In-service ticket → Complete → Move to Pending

**Steps:**
1. Find a ticket in Service section
2. Click "Complete" or "Finish Service"
3. Verify ticket moves to Pending

**Backend Verification:**
```sql
-- Check ticket completion
SELECT * FROM tickets
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Ticket status updated to `'completed'`
- [ ] `completed_at` timestamp is set
- [ ] Ticket appears in Pending section

---

### Test 6: Complete Payment (Create Transaction)

**Flow:** Pending ticket → Process payment → Transaction created

**Steps:**
1. Find a ticket in Pending section
2. Click "Checkout" or "Process Payment"
3. Enter payment details (cash/card)
4. Add tip (optional)
5. Add discount (optional)
6. Complete payment

**Backend Verification:**
```sql
-- Check transaction created
SELECT t.*, tr.id as transaction_id, tr.total as transaction_total
FROM tickets t
JOIN transactions tr ON tr.ticket_id = t.id
WHERE t.status = 'completed'
ORDER BY tr.created_at DESC
LIMIT 1;

-- Verify transaction details
SELECT * FROM transactions
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Transaction created in Supabase
- [ ] `ticket_id` links to correct ticket
- [ ] `client_id` matches ticket client
- [ ] `total` matches ticket total
- [ ] `payment_method` is correct
- [ ] `payment_details` contains payment info
- [ ] Ticket status remains `'completed'` (or updates to `'paid'`)

---

### Test 7: Update Ticket (Edit Service/Staff)

**Flow:** Existing ticket → Edit → Update

**Steps:**
1. Find any ticket
2. Click "Edit" or use dropdown menu
3. Modify service, staff, or notes
4. Save changes

**Backend Verification:**
```sql
-- Check ticket update
SELECT * FROM tickets
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Ticket updated in Supabase
- [ ] Changes reflected in database
- [ ] `updated_at` timestamp is recent
- [ ] `sync_version` incremented (if exists)

---

### Test 8: Delete Ticket

**Flow:** Any ticket → Delete → Removed

**Steps:**
1. Find a ticket (preferably test ticket)
2. Click "Delete" or use dropdown menu
3. Confirm deletion

**Backend Verification:**
```sql
-- Check ticket deleted (soft delete or hard delete)
SELECT * FROM tickets
WHERE id = 'DELETED_TICKET_ID';

-- Or check if status changed to 'cancelled'
SELECT * FROM tickets
WHERE status = 'cancelled'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Results:**
- [ ] Ticket deleted or status set to `'cancelled'`
- [ ] Deletion reflected in Supabase
- [ ] No orphaned records

---

### Test 9: Foreign Key Validation

**Flow:** Try to create ticket with invalid IDs

**Steps:**
1. Attempt to create ticket with invalid `clientId`
2. Attempt to create ticket with invalid `staffId`
3. Attempt to create ticket with invalid `serviceId`
4. Attempt to create transaction with invalid `ticketId`

**Backend Verification:**
- Check browser console for validation errors
- Verify operations are rejected with clear error messages

**Expected Results:**
- [ ] Invalid `clientId` → Error: "client with id 'xxx' does not exist"
- [ ] Invalid `staffId` → Error: "staff with id 'xxx' does not exist"
- [ ] Invalid `serviceId` → Error: "service with id 'xxx' does not exist"
- [ ] Invalid `ticketId` → Error: "ticket with id 'xxx' does not exist"
- [ ] Operations are rejected (not saved to Supabase)

---

### Test 10: Data Consistency Check

**Flow:** Verify all relationships are maintained

**Steps:**
1. Complete full workflow: Appointment → Check In → Ticket → Service → Payment → Transaction
2. Verify all relationships

**Backend Verification:**
```sql
-- Full relationship check
SELECT 
  a.id as appointment_id,
  a.client_id as appointment_client_id,
  t.id as ticket_id,
  t.appointment_id,
  t.client_id as ticket_client_id,
  tr.id as transaction_id,
  tr.ticket_id,
  tr.client_id as transaction_client_id
FROM appointments a
LEFT JOIN tickets t ON t.appointment_id = a.id
LEFT JOIN transactions tr ON tr.ticket_id = t.id
WHERE a.id = 'TEST_APPOINTMENT_ID';
```

**Expected Results:**
- [ ] Appointment → Ticket link exists (`t.appointment_id = a.id`)
- [ ] Ticket → Transaction link exists (`tr.ticket_id = t.id`)
- [ ] Client IDs are consistent across all entities
- [ ] All foreign keys are valid

---

## 🔧 Test Execution Script

### Prerequisites
1. Application running
2. Supabase dashboard open
3. Browser DevTools open (Console + Network tabs)
4. Test data ready (clients, staff, services, appointments)

### Quick Test Commands

```bash
# 1. Check latest ticket
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -c "
SELECT id, client_name, status, appointment_id, created_at 
FROM tickets 
ORDER BY created_at DESC 
LIMIT 5;"

# 2. Check latest transaction
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -c "
SELECT id, ticket_id, client_name, total, payment_method, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;"

# 3. Check appointment-ticket links
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -c "
SELECT a.id as apt_id, a.status as apt_status, t.id as ticket_id, t.status as ticket_status
FROM appointments a
LEFT JOIN tickets t ON t.appointment_id = a.id
WHERE a.created_at > NOW() - INTERVAL '1 day'
ORDER BY a.created_at DESC;"
```

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Test 1: Create Ticket from Wait List
[ ] Pass [ ] Fail
Ticket ID: ___________
Notes: ________________________________

Test 2: Check In Appointment
[ ] Pass [ ] Fail
Appointment ID: ___________
Ticket ID: ___________
Notes: ________________________________

Test 3: Assign Ticket to Staff
[ ] Pass [ ] Fail
Ticket ID: ___________
Staff ID: ___________
Notes: ________________________________

Test 4: Start Service
[ ] Pass [ ] Fail
Ticket ID: ___________
Notes: ________________________________

Test 5: Complete Ticket
[ ] Pass [ ] Fail
Ticket ID: ___________
Notes: ________________________________

Test 6: Complete Payment
[ ] Pass [ ] Fail
Ticket ID: ___________
Transaction ID: ___________
Notes: ________________________________

Test 7: Update Ticket
[ ] Pass [ ] Fail
Ticket ID: ___________
Notes: ________________________________

Test 8: Delete Ticket
[ ] Pass [ ] Fail
Ticket ID: ___________
Notes: ________________________________

Test 9: Foreign Key Validation
[ ] Pass [ ] Fail
Notes: ________________________________

Test 10: Data Consistency
[ ] Pass [ ] Fail
Appointment ID: ___________
Notes: ________________________________

Overall: [ ] All Pass [ ] Some Fail
Issues Found: ________________________
```

---

## 🐛 Troubleshooting

### Issue: Ticket not appearing in Supabase
**Check:**
- Browser console for errors
- Network tab for failed API calls
- Redux state for `storeId`
- Supabase connection

### Issue: Transaction not created
**Check:**
- Ticket status is `'completed'`
- Payment was actually processed
- `createTransactionInSupabase` was called (check console)
- Network tab for API response

### Issue: Appointment not linked to ticket
**Check:**
- Appointment has `serverId` or valid `id`
- Check-in handler was called
- `appointmentId` was passed to `createTicketInSupabase`
- Browser console for errors

### Issue: Foreign key validation failing
**Check:**
- Referenced entities exist in Supabase
- IDs are correct format (UUIDs)
- Validation utility is working (check console logs)

---

## ✅ Success Criteria

All tests pass when:
- ✅ All operations save to Supabase
- ✅ All relationships are maintained
- ✅ Foreign key validation works
- ✅ Error handling is clear
- ✅ Data consistency is maintained

---

**Test Suite Created By:** Senior Backend Engineer  
**Last Updated:** December 2025  
**Status:** Ready for Execution

