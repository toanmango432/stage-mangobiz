# 🧪 Front Desk Manual Backend Test Guide

**Date:** December 2025  
**Purpose:** Step-by-step manual testing of all Front Desk backend data flows  
**Status:** Ready for Execution

---

## 🎯 Test Objective

Verify that all Front Desk operations correctly save data to Supabase and maintain proper relationships.

---

## 📋 Pre-Test Setup

### 1. Open Required Tools
- [ ] **Browser** with app running
- [ ] **Supabase Dashboard** open in another tab
- [ ] **Browser DevTools** open (F12) - Console + Network tabs
- [ ] **This test guide** open for reference

### 2. Prepare Test Data
Before starting, ensure you have:
- [ ] At least 1 **Client** in Supabase
- [ ] At least 1 **Staff** member in Supabase
- [ ] At least 1 **Service** in Supabase
- [ ] At least 1 **Appointment** scheduled for today (status: 'scheduled')

### 3. Clear Console
- Press `Ctrl+L` (or `Cmd+K` on Mac) to clear console
- This helps track new operations

---

## 🧪 Test Flow 1: Create Ticket from Wait List

### Step 1: Navigate to Front Desk
1. Open the app
2. Navigate to **Front Desk** module
3. Verify you see:
   - Wait List section
   - Service section
   - Coming Appointments section

### Step 2: Create New Ticket
1. Click **"Add Ticket"** or **"New Ticket"** button
2. **Select Client:**
   - Choose an existing client OR
   - Create a walk-in client
3. **Add Service:**
   - Select a service
   - Set price (if editable)
4. **Assign Staff:**
   - Select a staff member
5. **Check In:**
   - Click **"Check In"** or **"Add to Waitlist"**

### Step 3: Verify in Console
Look for these messages:
- ✅ `"✅ Ticket created in Supabase: [ticket-id]"`
- ✅ No error messages

### Step 4: Verify in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → `tickets`
2. Click **Refresh**
3. Find the most recent ticket (sort by `created_at` DESC)
4. **Verify:**
   - [ ] Ticket exists
   - [ ] `client_id` is set (or NULL for walk-in)
   - [ ] `client_name` matches
   - [ ] `store_id` is set
   - [ ] `status` is `'pending'` or `'waiting'`
   - [ ] `services` JSON array contains the service
   - [ ] `created_at` is recent (within last minute)

### Step 5: Record Test Result
- [ ] **Pass** - Ticket created in Supabase with correct data
- [ ] **Fail** - Note the issue: ________________

**Ticket ID for reference:** ________________

---

## 🧪 Test Flow 2: Check In Appointment

### Step 1: Find Appointment
1. In Front Desk, scroll to **"Coming Appointments"** section
2. Find an appointment with status `'scheduled'`
3. Note the appointment details (client name, time)

### Step 2: Check In Appointment
1. Click on the appointment
2. Click **"Check In"** button
   - OR right-click → **"Check In"**
3. Wait for confirmation

### Step 3: Verify in Console
Look for:
- ✅ `"✅ Appointment checked-in in Supabase: [appointment-id]"`
- ✅ `"✅ Ticket created from appointment in Supabase: [ticket-id]"`
- ✅ No validation errors

### Step 4: Verify Appointment Updated
1. Go to **Supabase Dashboard** → **Table Editor** → `appointments`
2. Find the appointment you checked in
3. **Verify:**
   - [ ] `status` is `'checked-in'`
   - [ ] `updated_at` is recent

### Step 5: Verify Ticket Created with Link
1. Go to **Supabase Dashboard** → **Table Editor** → `tickets`
2. Find the most recent ticket
3. **Verify:**
   - [ ] Ticket exists
   - [ ] `appointment_id` is **NOT NULL** ✅
   - [ ] `appointment_id` matches the appointment ID
   - [ ] `client_id` matches appointment's client
   - [ ] `client_name` matches appointment's client
   - [ ] Services match appointment services

### Step 6: Verify Relationship
1. Copy the `appointment_id` from the ticket
2. Go to `appointments` table
3. Search for that ID
4. **Verify:**
   - [ ] Appointment exists with that ID
   - [ ] Appointment and ticket are correctly linked

### Step 7: Record Test Result
- [ ] **Pass** - Appointment checked in, ticket created with appointmentId
- [ ] **Fail** - Note the issue: ________________

**Appointment ID:** ________________  
**Ticket ID:** ________________

---

## 🧪 Test Flow 3: Assign Ticket to Staff

### Step 1: Find Ticket in Wait List
1. In Front Desk, find a ticket in **Wait List** section
2. Note the ticket details

### Step 2: Assign to Staff
1. Click on the ticket
2. Click **"Assign"** or use dropdown menu
3. Select a staff member
4. Confirm assignment

### Step 3: Verify in Console
Look for:
- ✅ `"✅ Ticket assigned in Supabase: [ticket-id]"`
- ✅ No errors

### Step 4: Verify in Supabase
1. Go to **Supabase Dashboard** → `tickets` table
2. Find the ticket
3. **Verify:**
   - [ ] `status` is `'in-service'`
   - [ ] `updated_at` is recent
   - [ ] Services JSON has `staffId` set
   - [ ] Ticket moved from Wait List to Service section in UI

### Step 5: Record Test Result
- [ ] **Pass** - Ticket assigned and status updated
- [ ] **Fail** - Note the issue: ________________

**Ticket ID:** ________________

---

## 🧪 Test Flow 4: Complete Ticket (Move to Pending)

### Step 1: Find Ticket in Service
1. In Front Desk, find a ticket in **Service** section
2. Note the ticket details

### Step 2: Complete Service
1. Click on the ticket
2. Click **"Complete"** or **"Finish Service"**
3. Wait for confirmation

### Step 3: Verify in Console
Look for:
- ✅ `"✅ Ticket completed in Supabase: [ticket-id]"`
- ✅ No errors

### Step 4: Verify in Supabase
1. Go to **Supabase Dashboard** → `tickets` table
2. Find the ticket
3. **Verify:**
   - [ ] `status` is `'completed'`
   - [ ] `completed_at` is set (if column exists)
   - [ ] `updated_at` is recent
   - [ ] Ticket moved to Pending section in UI

### Step 5: Record Test Result
- [ ] **Pass** - Ticket completed and status updated
- [ ] **Fail** - Note the issue: ________________

**Ticket ID:** ________________

---

## 🧪 Test Flow 5: Process Payment (Create Transaction)

### Step 1: Find Ticket in Pending
1. In Front Desk, find a ticket in **Pending** section
2. Note the ticket total and client

### Step 2: Process Payment
1. Click **"Checkout"** or **"Process Payment"**
2. **Payment Modal Opens:**
   - Select payment method (cash/card)
   - Enter tip amount (optional)
   - Enter discount (optional)
   - Click **"Complete Payment"**

### Step 3: Verify in Console
Look for:
- ✅ `"Payment processed and transaction created successfully"`
- ✅ `"✅ Transaction created in Supabase: [transaction-id]"`
- ✅ No errors

### Step 4: Verify Transaction Created
1. Go to **Supabase Dashboard** → `transactions` table
2. Find the most recent transaction
3. **Verify:**
   - [ ] Transaction exists
   - [ ] `ticket_id` matches the ticket ID
   - [ ] `client_id` matches ticket's client
   - [ ] `client_name` matches
   - [ ] `total` matches payment total
   - [ ] `payment_method` is correct (cash/card)
   - [ ] `payment_details` contains payment info
   - [ ] `status` is `'completed'`
   - [ ] `created_at` is recent

### Step 5: Verify Ticket Status Updated
1. Go to `tickets` table
2. Find the ticket
3. **Verify:**
   - [ ] `status` is `'paid'` or `'completed'`
   - [ ] Ticket removed from Pending section in UI

### Step 6: Verify Relationship
1. Copy `ticket_id` from transaction
2. Go to `tickets` table
3. Search for that ID
4. **Verify:**
   - [ ] Ticket exists
   - [ ] Transaction and ticket are linked correctly

### Step 7: Record Test Result
- [ ] **Pass** - Transaction created and linked correctly
- [ ] **Fail** - Note the issue: ________________

**Ticket ID:** ________________  
**Transaction ID:** ________________

---

## 🧪 Test Flow 6: Full Workflow (End-to-End)

### Step 1: Complete Full Cycle
1. **Create Appointment** (in Book module)
2. **Check In Appointment** (Front Desk)
3. **Assign Ticket** (Front Desk)
4. **Complete Service** (Front Desk)
5. **Process Payment** (Front Desk)

### Step 2: Verify Complete Chain
Run this SQL in Supabase SQL Editor:

```sql
-- Get the full chain for recent activity
SELECT 
  a.id as appointment_id,
  a.client_name as appointment_client,
  a.status as appointment_status,
  t.id as ticket_id,
  t.appointment_id,
  t.status as ticket_status,
  tr.id as transaction_id,
  tr.ticket_id,
  tr.total as transaction_total
FROM appointments a
LEFT JOIN tickets t ON t.appointment_id = a.id
LEFT JOIN transactions tr ON tr.ticket_id = t.id
WHERE a.created_at > NOW() - INTERVAL '1 hour'
ORDER BY a.created_at DESC
LIMIT 5;
```

### Step 3: Verify Relationships
For each row returned:
- [ ] Appointment exists
- [ ] Ticket has `appointment_id` = appointment.id
- [ ] Transaction has `ticket_id` = ticket.id
- [ ] Client IDs are consistent across all entities

### Step 4: Record Test Result
- [ ] **Pass** - Full workflow works end-to-end
- [ ] **Fail** - Note the issue: ________________

---

## 🧪 Test Flow 7: Foreign Key Validation

### Step 1: Test Invalid Client ID
1. Open browser console
2. Try to create a ticket with invalid `clientId`
3. **Expected:** Validation error, ticket not created

### Step 2: Test Invalid Staff ID
1. Try to assign ticket to invalid `staffId`
2. **Expected:** Validation error or clear error message

### Step 3: Test Invalid Service ID
1. Try to add invalid service to ticket
2. **Expected:** Validation error

### Step 4: Verify Errors
- [ ] Clear error messages appear
- [ ] Operations are rejected (not saved)
- [ ] No partial data in Supabase

### Step 5: Record Test Result
- [ ] **Pass** - Validation works correctly
- [ ] **Fail** - Note the issue: ________________

---

## 🧪 Test Flow 8: Update Operations

### Step 1: Update Ticket
1. Find any ticket
2. Click **"Edit"**
3. Modify service, staff, or notes
4. Save changes

### Step 2: Verify Update
1. Check Supabase `tickets` table
2. **Verify:**
   - [ ] Changes reflected in database
   - [ ] `updated_at` is recent
   - [ ] `sync_version` incremented (if exists)

### Step 3: Record Test Result
- [ ] **Pass** - Updates work correctly
- [ ] **Fail** - Note the issue: ________________

---

## 🧪 Test Flow 9: Delete Operations

### Step 1: Delete Ticket
1. Find a test ticket
2. Click **"Delete"**
3. Confirm deletion

### Step 2: Verify Deletion
1. Check Supabase `tickets` table
2. **Verify:**
   - [ ] Ticket deleted or status = `'cancelled'`
   - [ ] Deletion reflected in database

### Step 3: Record Test Result
- [ ] **Pass** - Deletion works correctly
- [ ] **Fail** - Note the issue: ________________

---

## 📊 Test Results Summary

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| **Flow 1:** Create Ticket | [ ] Pass [ ] Fail | |
| **Flow 2:** Check In Appointment | [ ] Pass [ ] Fail | |
| **Flow 3:** Assign Ticket | [ ] Pass [ ] Fail | |
| **Flow 4:** Complete Ticket | [ ] Pass [ ] Fail | |
| **Flow 5:** Process Payment | [ ] Pass [ ] Fail | |
| **Flow 6:** Full Workflow | [ ] Pass [ ] Fail | |
| **Flow 7:** Validation | [ ] Pass [ ] Fail | |
| **Flow 8:** Update Operations | [ ] Pass [ ] Fail | |
| **Flow 9:** Delete Operations | [ ] Pass [ ] Fail | |

### Overall Assessment
- **Total Tests:** 9
- **Passed:** ___
- **Failed:** ___
- **Success Rate:** ___%

### Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

---

## 🔍 Quick Verification Queries

### Check Latest Ticket
```sql
SELECT id, client_name, status, appointment_id, created_at 
FROM tickets 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check Latest Transaction
```sql
SELECT id, ticket_id, client_name, total, payment_method, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check Appointment-Ticket Links
```sql
SELECT 
  a.id as appointment_id,
  a.status as appointment_status,
  t.id as ticket_id,
  t.status as ticket_status,
  t.appointment_id
FROM appointments a
LEFT JOIN tickets t ON t.appointment_id = a.id
WHERE a.created_at > NOW() - INTERVAL '1 day'
ORDER BY a.created_at DESC;
```

### Check Transaction-Ticket Links
```sql
SELECT 
  t.id as ticket_id,
  t.status as ticket_status,
  tr.id as transaction_id,
  tr.total as transaction_total
FROM tickets t
LEFT JOIN transactions tr ON tr.ticket_id = t.id
WHERE t.created_at > NOW() - INTERVAL '1 day'
ORDER BY t.created_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: Ticket not appearing in Supabase
**Check:**
1. Browser console for errors
2. Network tab for failed API calls
3. Redux state for `storeId`
4. Supabase connection status

### Issue: Transaction not created
**Check:**
1. Ticket status is `'completed'`
2. Payment was actually processed
3. `createTransactionInSupabase` was called (check console)
4. Network tab for API response

### Issue: Appointment not linked to ticket
**Check:**
1. Appointment has `serverId` or valid `id`
2. Check-in handler was called
3. `appointmentId` was passed correctly
4. Browser console for validation errors

---

**Test Guide Created By:** Senior Backend Engineer  
**Last Updated:** December 2025  
**Status:** Ready for Execution

