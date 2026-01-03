# Edge Cases and Recovery

> **Last Updated:** December 31, 2025
> **Purpose:** Document stuck states, edge cases, and recovery procedures

This guide covers scenarios where the system can get into problematic states and how to recover from them.

---

## Overview

| Category | Scenarios | Recovery Options |
|----------|-----------|------------------|
| Stuck Tickets | 6 | Reassign, Void, Force-close |
| Payment Issues | 5 | Retry, Void, Manual |
| Sync Problems | 4 | Retry, Manual sync, Clear queue |
| Data Integrity | 4 | Validation, Correction |
| Staff Issues | 3 | Reassign, Override |

---

## 1. Stuck Ticket Scenarios

### 1.1 Staff Goes Off-Duty Mid-Service

**Scenario:** A ticket is in `in-service` status, but the assigned staff member clocks out or goes on break.

**Current Behavior:** Ticket remains in-service with unavailable staff. No automatic recovery.

**Symptoms:**
- Ticket stuck in "In Service" section
- Staff shows as "Clocked Out" but has active ticket
- Client waiting indefinitely

**Recovery Options:**

| Option | How To | Permission Required |
|--------|--------|---------------------|
| Reassign | Click ticket → Change Staff → Select available staff | Staff |
| Send to Waiting | Move ticket back to waiting queue | Staff |
| Void Ticket | Void and recreate if necessary | Manager |
| Force Complete | Mark services as done | Manager |

**Recommended Recovery Flow:**
```
1. Open the stuck ticket
2. If client still present:
   → Reassign to available staff
   OR
   → Send back to waiting for any available staff
3. If client left:
   → Mark as no-show OR void ticket
4. Log reason for recovery action
```

**Prevention (Recommended Implementation):**
```typescript
// Auto-detect stuck tickets
function checkStuckTickets() {
  const inServiceTickets = getTicketsByStatus('in-service');
  for (const ticket of inServiceTickets) {
    const staff = getStaffById(ticket.assignedStaff);
    if (staff.status !== 'available' && staff.status !== 'busy') {
      // Alert manager
      notifyManager(`Ticket #${ticket.number} has unavailable staff`);
    }
  }
}
// Run every 5 minutes
setInterval(checkStuckTickets, 5 * 60 * 1000);
```

---

### 1.2 Payment Fails Mid-Checkout

**Scenario:** Client at checkout, payment processing started, but payment fails or times out.

**Current Behavior:** Ticket remains in `completed` status. No clear recovery path.

**Symptoms:**
- TicketPanel may be stuck
- Payment modal shows error
- Client card may be charged but transaction not recorded

**Recovery Options:**

| Option | When To Use | Steps |
|--------|-------------|-------|
| Retry Payment | Card declined, try again | Re-enter card or use different payment |
| Switch Method | Card not working | Select different payment method |
| Cash Fallback | All cards failing | Accept cash payment |
| Void and Restart | System error | Void ticket, create new one |

**Recovery Flow:**
```
1. If payment processor returned error:
   → Show specific error message
   → Offer to retry OR switch payment method
2. If timeout:
   → Check with payment processor for status
   → If charged: record transaction manually
   → If not charged: retry
3. If system error:
   → Log error for debugging
   → Offer cash payment as fallback
```

---

### 1.3 Client Leaves Without Paying

**Scenario:** Services completed, ticket in `pending`, but client walks out.

**Current Behavior:** Ticket remains in pending indefinitely. No "walked out" status.

**Symptoms:**
- Ticket sits in Pending section
- Cannot be resolved without action
- Affects pending count metrics

**Recovery Options:**

| Option | When To Use | Financial Impact |
|--------|-------------|------------------|
| Mark as Unpaid | Will collect later | No revenue recorded |
| Void | Write-off | No revenue recorded |
| Mark as No-Show | Policy violation | Log for client record |

**Recommended:** Add `walked-out` status or use `unpaid` status with reason.

---

### 1.4 Network Offline During Ticket Creation

**Scenario:** Creating a ticket when network goes offline.

**Current Behavior:** Ticket saved to IndexedDB, queued for sync. Works correctly.

**Symptoms:**
- Sync indicator shows pending
- Data available locally but not on other devices

**Recovery:** Automatic when network returns. No manual action needed.

---

### 1.5 App Crash During Checkout

**Scenario:** App crashes or browser closes during checkout editing.

**Current Behavior:** Partial recovery from localStorage.

**Symptoms:**
- Checkout data may be incomplete
- Services may be missing
- Discount/tip may be lost

**Recovery Flow:**
```
1. On app restart:
   → Check localStorage for 'checkout-pending-ticket'
   → If exists, prompt user to resume or discard
2. If resume:
   → Restore ticket state
   → Validate all services still exist
   → Continue checkout
3. If discard:
   → Clear localStorage
   → Return to Pending section
   → Let user reopen ticket
```

---

### 1.6 Double-Payment Submitted

**Scenario:** User clicks "Pay" twice quickly, or network delay causes duplicate submission.

**Current Behavior:** May create duplicate transactions. **No duplicate detection.**

**Symptoms:**
- Two transactions for same ticket
- Client charged twice
- Revenue doubled incorrectly

**Prevention (Required Implementation):**
```typescript
// Use idempotency key
interface PaymentRequest {
  ticketId: string;
  idempotencyKey: string; // UUID generated on first click
  amount: number;
  // ...
}

// Before processing payment
async function processPayment(request: PaymentRequest) {
  const existing = await findTransactionByIdempotencyKey(request.idempotencyKey);
  if (existing) {
    // Return existing transaction instead of creating new
    return existing;
  }
  // Process new payment
}
```

---

## 2. Payment Issues

### 2.1 Card Declined

**Scenario:** Payment processor returns decline.

**Recovery:**
1. Show decline reason if available
2. Offer to retry with same card
3. Offer to try different card
4. Offer cash/other payment method

### 2.2 Payment Timeout

**Scenario:** Payment processor doesn't respond within timeout (30 seconds).

**Recovery:**
1. Show timeout message
2. Check processor status API if available
3. Offer to retry
4. Log timeout for debugging

### 2.3 Partial Payment Made

**Scenario:** Client wants to pay part now, part later.

**Current Behavior:** No partial payment support. Must pay full amount.

**Workaround:**
1. Create discount for unpaid portion
2. Note balance owed in ticket notes
3. Manually track and collect later

**Recommended:** Add `partial-payment` status with balance tracking.

### 2.4 Void After Settlement

**Scenario:** Need to reverse a transaction after batch settlement.

**Current Behavior:** Void only allowed same-day before settlement.

**Recovery:**
1. If same-day: Void transaction
2. If after settlement: Issue refund instead
3. Document reason in audit log

### 2.5 Gift Card Balance Issue

**Scenario:** Gift card shows balance but insufficient funds.

**Recovery:**
1. Check real balance from gift card system
2. If balance exists: split payment
3. If no balance: use different payment method
4. Log discrepancy for investigation

---

## 3. Sync Problems

### 3.1 Sync Queue Growing Indefinitely

**Scenario:** Sync keeps failing, queue grows without limit.

**Current Behavior:** Retries up to 10 times, then stops.

**Symptoms:**
- High memory usage
- Slow performance
- Data not reaching cloud

**Recovery:**
1. Check network connectivity
2. Check Supabase status
3. Review error logs for specific failures
4. Clear failed items from queue if unrepairable
5. Recreate data if needed

**Prevention:**
```typescript
// Queue size limit
const MAX_QUEUE_SIZE = 1000;

function addToQueue(item) {
  if (queue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest non-priority items
    pruneQueue();
    notifyUser('Sync queue full. Some changes may be lost.');
  }
  queue.push(item);
}
```

### 3.2 Conflict Between Devices

**Scenario:** Same record edited on two offline devices.

**Current Behavior:** Last-write-wins (silent overwrite). **No conflict notification.**

**Symptoms:**
- Changes from one device disappear
- No warning to user
- Data inconsistency

**Recommended Recovery:**
1. Detect conflicts via `syncVersion` mismatch
2. Surface conflict to user
3. Show both versions
4. Let user choose or merge

### 3.3 IndexedDB Quota Exceeded

**Scenario:** Local storage full.

**Current Behavior:** Writes may fail silently.

**Recovery:**
1. Clear old data (completed tickets > 30 days)
2. Clear sync queue of synced items
3. Prompt user to clear browser data if persistent

### 3.4 Network Reconnect Doesn't Trigger Sync

**Scenario:** Device goes online but sync doesn't start.

**Current Behavior:** Should auto-detect and sync. May not work reliably.

**Recovery:**
1. Manual sync button in UI
2. Refresh page
3. Check online status detection

---

## 4. Data Integrity Issues

### 4.1 Orphaned Tickets

**Scenario:** Ticket references deleted client.

**Symptoms:**
- Ticket shows "Unknown Client"
- Cannot edit client info
- Reports may fail

**Recovery:**
1. Assign ticket to placeholder client
2. Or delete ticket if no financial impact
3. Prevent future: Add foreign key validation

### 4.2 Orphaned Services

**Scenario:** Service references deleted staff member.

**Symptoms:**
- Service shows "Unknown Staff"
- Cannot reassign
- Commission tracking fails

**Recovery:**
1. Reassign to active staff member
2. Update historical records
3. Prevent future: Check before staff deletion

### 4.3 Total Calculation Mismatch

**Scenario:** `total` doesn't equal `subtotal + tax + tip - discount`.

**Symptoms:**
- Reports show incorrect totals
- Reconciliation fails

**Recovery:**
1. Recalculate totals
2. Update database
3. Log correction in audit trail

### 4.4 Service Completed Without Starting

**Scenario:** Service status is `completed` but `actualStartTime` is null.

**Symptoms:**
- Timer shows invalid duration
- Reports show 0-minute services

**Recovery:**
1. Set `actualStartTime` to `createdAt` time
2. Calculate reasonable duration
3. Prevent future: Add validation guard

---

## 5. Staff Issues

### 5.1 Staff Deleted With Active Tickets

**Scenario:** Staff member deleted while assigned to tickets.

**Current Behavior:** Tickets orphaned. **No cascade prevention.**

**Recovery:**
1. Reassign all tickets to available staff
2. Update historical records
3. Prevent future: Block deletion if active tickets

### 5.2 Staff Double-Booked

**Scenario:** Same staff assigned to overlapping appointments.

**Current Behavior:** No validation. **Allows double-booking.**

**Recovery:**
1. Identify conflicts
2. Reassign one appointment
3. Notify affected clients
4. Prevent future: Add booking validation

### 5.3 All Staff Unavailable

**Scenario:** No staff available to take clients.

**Recovery:**
1. Add clients to waitlist
2. Notify when staff available
3. Offer to reschedule

---

## 6. Manager Override Procedures

### 6.1 Force-Close Ticket

**When:** Ticket stuck with no valid recovery.

**Steps:**
1. Navigate to ticket
2. Open manager actions (gear icon)
3. Select "Force Close"
4. Enter reason (required)
5. Confirm action
6. Audit log created automatically

**Permission:** Manager or higher

### 6.2 Void Past Window

**When:** Need to void transaction after 24-hour window.

**Steps:**
1. Navigate to transaction in Sales
2. Open manager actions
3. Select "Override Void"
4. Enter reason and manager PIN
5. Confirm action

**Permission:** Manager with override authority

### 6.3 Manual Sync Retry

**When:** Sync failed and auto-retry exhausted.

**Steps:**
1. Go to More → Settings → Sync
2. View failed items
3. Select items to retry
4. Click "Retry Selected"
5. Or "Clear" to remove unfixable items

**Permission:** Staff (view), Manager (clear)

---

## 7. Timeout Handling

### 7.1 Checkout Timeout

**Trigger:** Ticket in checkout for > 30 minutes without activity.

**Current Behavior:** None. **No timeout implemented.**

**Recommended:**
```typescript
// Checkout timeout
const CHECKOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function startCheckoutTimer(ticketId: string) {
  setTimeout(() => {
    const ticket = getCheckoutTicket();
    if (ticket?.id === ticketId) {
      // Auto-save and close checkout
      saveAndCloseCheckout();
      notifyUser('Checkout timed out. Changes saved.');
    }
  }, CHECKOUT_TIMEOUT);
}
```

### 7.2 Authorization Expiry

**Industry Standard:** Payment authorizations expire after 6 days.

**Current Behavior:** No tracking. **No expiry handling.**

**Recommended:**
- Track authorization timestamp
- Warn at 5 days
- Auto-void at 6 days
- Re-authorize if still needed

### 7.3 Stuck State Detection

**Recommended Alert Rules:**

| State | Duration | Action |
|-------|----------|--------|
| In-service | > 4 hours | Alert manager |
| Checkout open | > 30 min | Auto-save, alert |
| Pending | > 24 hours | Nightly reminder |
| Sync pending | > 1 hour | Check connectivity |

---

## 8. Audit Trail Requirements

All recovery actions must be logged:

```typescript
interface RecoveryAuditLog {
  id: string;
  timestamp: Date;
  action: 'force_close' | 'void_override' | 'reassign' | 'manual_sync' | 'data_correction';
  entityType: 'ticket' | 'transaction' | 'appointment' | 'client' | 'staff';
  entityId: string;
  reason: string;
  performedBy: string;
  previousState: object;
  newState: object;
}
```

---

## Related Documentation

- [STATE_MACHINES.md](../architecture/STATE_MACHINES.md) - Valid states and transitions
- [VALIDATION_RULES.md](../architecture/VALIDATION_RULES.md) - Prevention rules
- [SYSTEM_DATA_FLOW_OVERVIEW.md](../architecture/SYSTEM_DATA_FLOW_OVERVIEW.md) - System flows

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
