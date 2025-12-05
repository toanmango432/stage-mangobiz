# 🚀 Quick Testing Reference

**Quick checklist for testing the fixes**

---

## ✅ Test 1: Transaction Creation (5 minutes)

1. **Create/Select Ticket** → Open Checkout
2. **Complete Payment** (cash/card)
3. **Check Supabase** → `transactions` table
   - ✅ New row appears
   - ✅ `ticket_id` matches
   - ✅ `total` is correct

**Expected:** Transaction in Supabase ✅

---

## ✅ Test 2: Appointment Check-In (5 minutes)

1. **Find Appointment** (status: scheduled)
2. **Check In** (right-click → Check In)
3. **Check Supabase** → `tickets` table
   - ✅ New ticket created
   - ✅ `appointment_id` is NOT NULL
   - ✅ Links to correct appointment

**Expected:** Ticket with `appointment_id` ✅

---

## ✅ Test 3: Services CRUD (5 minutes)

1. **Create Service** → Admin → Services → Add
2. **Update Service** → Edit → Change price
3. **Delete Service** → Remove
4. **Check Supabase** → `services` table

**Expected:** All operations work ✅

---

## ✅ Test 4: Delete Operations (3 minutes)

1. **Delete Staff** → Admin → Staff → Delete
2. **Delete Appointment** → Calendar → Delete
3. **Check Supabase** → Verify removed

**Expected:** Deletions work ✅

---

## 🔍 Quick Verification Commands

### Check Latest Transaction
```sql
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check Latest Ticket with Appointment
```sql
SELECT id, appointment_id, client_name, status 
FROM tickets 
WHERE appointment_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 1;
```

### Verify Relationships
```sql
-- Transaction → Ticket
SELECT t.*, tr.id as transaction_id
FROM tickets t
JOIN transactions tr ON tr.ticket_id = t.id
ORDER BY tr.created_at DESC
LIMIT 1;

-- Ticket → Appointment
SELECT t.*, a.id as appointment_id, a.status as appointment_status
FROM tickets t
JOIN appointments a ON t.appointment_id = a.id
ORDER BY t.created_at DESC
LIMIT 1;
```

---

## 🐛 Quick Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Transaction not in Supabase | Check console for errors, verify storeId |
| Ticket missing appointmentId | Verify appointment has serverId |
| Delete fails | Check foreign key constraints |
| No data in Supabase | Verify Supabase connection |

---

## 📊 Test Results

- [ ] Test 1: Transaction Creation
- [ ] Test 2: Appointment Check-In  
- [ ] Test 3: Services CRUD
- [ ] Test 4: Delete Operations

**Time Required:** ~20 minutes total

