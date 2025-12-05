# 🧪 Testing Guide - Data Flow Fixes

**Date:** December 2025  
**Purpose:** Step-by-step testing instructions for implemented fixes  
**Status:** Ready for Testing

---

## 📋 Pre-Testing Setup

### 1. Prerequisites
- [ ] Application is running (dev server or production)
- [ ] You have access to Supabase dashboard
- [ ] You have admin/staff login credentials
- [ ] Browser DevTools open (F12) - Console tab
- [ ] Network tab open to monitor API calls

### 2. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Keep these tables open for verification:
   - `transactions`
   - `tickets`
   - `appointments`
   - `services`
   - `staff`

### 3. Clear Browser Cache (Optional but Recommended)
- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or use: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

## ✅ Test 1: Transaction Creation in Checkout Flow

**What We're Testing:**  
Verify that completing a ticket checkout creates a transaction in Supabase (not just IndexedDB).

### Step-by-Step Instructions:

#### Step 1: Create or Select a Ticket
1. Navigate to **Front Desk** or **Checkout** module
2. Either:
   - **Option A:** Create a new ticket with services
   - **Option B:** Select an existing ticket that's ready for checkout
3. Ensure the ticket has:
   - At least one service
   - A client assigned
   - A total amount > $0

#### Step 2: Open Checkout
1. Click on the ticket to open checkout
2. You should see the **Quick Checkout** modal
3. Verify ticket details are displayed correctly

#### Step 3: Complete Payment
1. **Select Payment Method:**
   - Try **Cash** payment first
   - Enter tip amount (optional)
   - Enter discount (optional)
2. Click **Complete Payment** or **Process Payment** button
3. Wait for processing (should see loading indicator)

#### Step 4: Verify in Console
1. Open **Browser DevTools** → **Console** tab
2. Look for these messages:
   - ✅ `"Payment processed and transaction created successfully"`
   - ✅ No errors related to `createTransaction`
3. Check for any error messages (should be none)

#### Step 5: Verify in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → `transactions`
2. Click **Refresh** or reload the table
3. **Verify:**
   - [ ] New transaction row appears
   - [ ] `ticket_id` matches the ticket you just completed
   - [ ] `client_id` matches the ticket's client
   - [ ] `total` matches the checkout total
   - [ ] `payment_method` is correct (cash/card)
   - [ ] `status` is `'completed'`
   - [ ] `created_at` is recent (within last minute)

#### Step 6: Test Different Payment Methods
Repeat Steps 1-5 for:
- [ ] **Card Payment** (if available)
- [ ] **Split Payment** (cash + card)

#### Step 7: Verify Transaction Links
1. In Supabase, open the transaction you just created
2. **Verify relationships:**
   - [ ] `ticket_id` exists in `tickets` table
   - [ ] `client_id` exists in `clients` table
   - [ ] Transaction amounts match ticket totals

### ✅ Success Criteria:
- [ ] Transaction appears in Supabase `transactions` table
- [ ] Transaction is linked to correct ticket and client
- [ ] All payment details are saved correctly
- [ ] No errors in console
- [ ] Works for cash, card, and split payments

### ❌ If It Fails:
- Check browser console for error messages
- Verify Supabase connection (check network tab)
- Verify user is authenticated
- Check that `store_id` is set in Redux state

---

## ✅ Test 2: Appointment Check-In Creates Ticket with appointmentId

**What We're Testing:**  
Verify that checking in an appointment creates a ticket in Supabase with the `appointment_id` field set.

### Step-by-Step Instructions:

#### Step 1: Create or Find an Appointment
1. Navigate to **Book** or **Calendar** module
2. Either:
   - **Option A:** Create a new appointment for today
   - **Option B:** Find an existing appointment with status `'scheduled'`
3. Ensure the appointment has:
   - At least one service
   - A client assigned
   - Status is `'scheduled'`

#### Step 2: Check In the Appointment
1. **Method 1 - Context Menu:**
   - Right-click on the appointment
   - Select **"Check In"** from the context menu

2. **Method 2 - Details Modal:**
   - Click on the appointment to open details
   - Click **"Check In"** button

3. **Method 3 - Status Change:**
   - Change appointment status to `'checked-in'`

#### Step 3: Verify Success Message
1. Look for toast notification:
   - ✅ `"Appointment checked in and ticket created"`
   - Or: `"Appointment marked as checked-in"`

#### Step 4: Verify in Console
1. Open **Browser DevTools** → **Console** tab
2. Look for:
   - ✅ No errors related to `createTicketInSupabase`
   - ✅ No errors related to `updateAppointmentInSupabase`
3. Check for any warnings (should be minimal)

#### Step 5: Verify Ticket Created in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → `tickets`
2. Click **Refresh** to reload
3. Find the most recent ticket (sort by `created_at` DESC)
4. **Verify:**
   - [ ] New ticket exists
   - [ ] `appointment_id` field is **NOT NULL**
   - [ ] `appointment_id` matches the appointment you checked in
   - [ ] `client_id` matches the appointment's client
   - [ ] `client_name` matches
   - [ ] `status` is `'pending'` or `'waiting'`
   - [ ] Services match the appointment services

#### Step 6: Verify Appointment Status Updated
1. Go to **Supabase Dashboard** → **Table Editor** → `appointments`
2. Find the appointment you checked in
3. **Verify:**
   - [ ] `status` is `'checked-in'`
   - [ ] `updated_at` is recent

#### Step 7: Verify Relationship
1. In Supabase, open the ticket you just created
2. Copy the `appointment_id` value
3. Go to `appointments` table
4. Search for that `id`
5. **Verify:**
   - [ ] Appointment exists with that ID
   - [ ] Appointment and ticket are linked correctly

### ✅ Success Criteria:
- [ ] Ticket is created in Supabase when appointment is checked in
- [ ] Ticket has `appointment_id` field set (NOT NULL)
- [ ] `appointment_id` correctly links to the appointment
- [ ] Appointment status is updated to `'checked-in'`
- [ ] Ticket services match appointment services
- [ ] No errors in console

### ❌ If It Fails:
- Check console for error messages
- Verify appointment has `serverId` or `id` set
- Check that appointment services are properly formatted
- Verify Supabase connection

---

## ✅ Test 3: Services CRUD Operations

**What We're Testing:**  
Verify that Services can be created, updated, and deleted via the dataService.

### Step 3A: Create Service

#### Step 1: Navigate to Services/Admin
1. Go to **Admin** or **Settings** module
2. Navigate to **Services** management page
3. Click **"Add Service"** or **"New Service"** button

#### Step 2: Fill Service Details
1. Enter service details:
   - Name: `"Test Service - [Your Name]"`
   - Category: Select a category
   - Price: `50.00`
   - Duration: `60` minutes
   - Description (optional)
2. Click **"Save"** or **"Create"**

#### Step 3: Verify in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → `services`
2. Refresh the table
3. **Verify:**
   - [ ] New service row appears
   - [ ] `name` matches what you entered
   - [ ] `price` is correct
   - [ ] `duration` is correct
   - [ ] `store_id` is set
   - [ ] `is_active` is `true` (default)

### Step 3B: Update Service

#### Step 1: Edit Service
1. Find the service you just created
2. Click **"Edit"** button
3. Change:
   - Price: `75.00`
   - Or name: Add `" - Updated"`
4. Click **"Save"**

#### Step 2: Verify in Supabase
1. Refresh `services` table in Supabase
2. Find your service
3. **Verify:**
   - [ ] Changes are reflected
   - [ ] `updated_at` timestamp is recent
   - [ ] `sync_version` incremented (if exists)

### Step 3C: Delete Service

#### Step 1: Delete Service
1. Find the test service
2. Click **"Delete"** or **"Remove"** button
3. Confirm deletion if prompted

#### Step 2: Verify in Supabase
1. Refresh `services` table
2. **Verify:**
   - [ ] Service row is removed
   - [ ] Or `is_active` is set to `false` (soft delete)

### ✅ Success Criteria:
- [ ] Can create service via UI → appears in Supabase
- [ ] Can update service → changes reflected in Supabase
- [ ] Can delete service → removed from Supabase
- [ ] No errors in console

### ❌ If It Fails:
- Check if Services management UI exists
- Verify `dataService.services.create/update/delete` are being called
- Check console for errors

---

## ✅ Test 4: Delete Operations for Staff and Appointments

### Step 4A: Delete Staff

#### Step 1: Navigate to Staff Management
1. Go to **Admin** or **Team Settings**
2. Navigate to **Staff** or **Team Members**
3. Find a test staff member (or create one first)

#### Step 2: Delete Staff
1. Click **"Delete"** or **"Remove"** button
2. Confirm deletion if prompted
3. Wait for confirmation message

#### Step 3: Verify in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → `staff`
2. Refresh the table
3. **Verify:**
   - [ ] Staff member is removed
   - [ ] Or `is_active` is set to `false` (soft delete)

### Step 4B: Delete Appointment

#### Step 1: Navigate to Calendar
1. Go to **Book** or **Calendar** module
2. Find an appointment you can delete (test appointment)

#### Step 2: Delete Appointment
1. Right-click appointment → **"Delete"**
   - OR
2. Open appointment details → Click **"Delete"**
3. Confirm deletion

#### Step 3: Verify in Supabase
1. Go to **Supabase Dashboard** → **Table Editor** → `appointments`
2. Refresh the table
3. **Verify:**
   - [ ] Appointment is removed
   - [ ] Or `status` is `'cancelled'` (soft delete)

### ✅ Success Criteria:
- [ ] Can delete staff → removed from Supabase
- [ ] Can delete appointment → removed from Supabase
- [ ] No errors in console
- [ ] UI updates correctly after deletion

### ❌ If It Fails:
- Check if delete buttons/actions exist in UI
- Verify `deleteStaffInSupabase` / `deleteAppointmentInSupabase` are being called
- Check console for errors
- Verify foreign key constraints (may prevent deletion if referenced)

---

## 🔍 Additional Verification Tests

### Test 5: Verify Data Consistency

#### Check Transaction → Ticket Link
1. In Supabase, open a transaction
2. Copy the `ticket_id`
3. Go to `tickets` table
4. Search for that `id`
5. **Verify:** Ticket exists and matches transaction

#### Check Ticket → Appointment Link
1. In Supabase, open a ticket with `appointment_id`
2. Copy the `appointment_id`
3. Go to `appointments` table
4. Search for that `id`
5. **Verify:** Appointment exists and matches ticket

### Test 6: Verify Error Handling

#### Test Invalid Data
1. Try to create transaction with invalid ticket ID
2. **Expected:** Clear error message, no crash
3. **Verify:** Error is logged in console

#### Test Offline Mode (if applicable)
1. Disconnect internet
2. Try to create transaction
3. **Expected:** 
   - Queued for sync (if offline-enabled)
   - Or clear error message (if online-only)
4. Reconnect internet
5. **Verify:** Queued operations sync successfully

---

## 📊 Testing Checklist Summary

### Critical Fixes (Must Pass)
- [ ] **Test 1:** Transaction creation in checkout → Supabase
- [ ] **Test 2:** Appointment check-in → Ticket with appointmentId

### Secondary Fixes (Should Pass)
- [ ] **Test 3:** Services CRUD operations
- [ ] **Test 4:** Delete operations for Staff/Appointments

### Verification
- [ ] **Test 5:** Data consistency (relationships)
- [ ] **Test 6:** Error handling

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Transaction not appearing in Supabase
**Possible Causes:**
- Supabase connection issue
- Authentication problem
- Store ID not set
- Transaction creation failed silently

**Solutions:**
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify Supabase credentials
4. Check Redux state for `storeId` / `salonId`

#### Issue: Ticket created without appointmentId
**Possible Causes:**
- Appointment doesn't have `serverId`
- Check-in handler not called
- Ticket creation failed

**Solutions:**
1. Verify appointment has `serverId` or valid `id`
2. Check console for `createTicketInSupabase` call
3. Verify appointment status changed to `'checked-in'`

#### Issue: Delete operations not working
**Possible Causes:**
- Foreign key constraints
- UI not calling delete thunks
- Permissions issue

**Solutions:**
1. Check console for foreign key errors
2. Verify delete thunks are imported and called
3. Check Supabase RLS policies

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1: Transaction Creation
[ ] Pass [ ] Fail
Notes: ________________________________

Test 2: Appointment Check-In
[ ] Pass [ ] Fail
Notes: ________________________________

Test 3: Services CRUD
[ ] Pass [ ] Fail
Notes: ________________________________

Test 4: Delete Operations
[ ] Pass [ ] Fail
Notes: ________________________________

Overall: [ ] All Pass [ ] Some Fail
Issues Found: ________________________
```

---

## 🎯 Quick Test Script

For quick verification, run this in browser console after each test:

```javascript
// Check if transaction was created
fetch('YOUR_SUPABASE_URL/rest/v1/transactions?order=created_at.desc&limit=1', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(data => console.log('Latest Transaction:', data[0]));

// Check if ticket has appointmentId
fetch('YOUR_SUPABASE_URL/rest/v1/tickets?order=created_at.desc&limit=1', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(data => console.log('Latest Ticket:', data[0], 'Has appointmentId:', !!data[0]?.appointment_id));
```

---

**Testing Guide Created By:** Senior Backend Engineer  
**Last Updated:** December 2025  
**Status:** Ready for Use

