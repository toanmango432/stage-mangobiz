# Pending Module Redesign Plan

## Executive Summary

Transform the Pending module from a **display-only UI** into a **fully functional payment collection system** that handles the critical post-service payment workflow with proper data integrity, transaction recording, and user experience.

---

## Current State Analysis

### ✅ What Works
- Beautiful 4-view-mode ticket display (compact, normal, grid-compact, grid-normal)
- Premium paper aesthetic with amber borders
- Payment type tabs (Card, Cash, Venmo)
- View mode switching and state persistence
- Mobile/tablet/desktop responsive design
- Proper Redux state management

### ❌ Critical Gaps
1. **`markTicketAsPaid()` is NOT IMPLEMENTED** - Just logs to console
2. **No payment processing flow** - No modal, no confirmation, no amount entry
3. **No Transaction creation** - Payments don't create database records
4. **No payment type selection** - Hardcoded to 'card', can't change
5. **All menu actions are stubs** - Edit, Print, Email, Void don't work
6. **Search doesn't filter** - UI exists but no logic
7. **Sort doesn't work** - Dropdown selection not connected
8. **No data validation** - Can mark $0 tickets as paid
9. **No payment history** - Can't track when/how payment was received
10. **No sync for payments** - Paid status doesn't queue for backend

---

## Design Philosophy

### Primary Goals
1. **Fast Checkout** - Minimize clicks to collect payment (1-2 clicks max)
2. **Accuracy** - Prevent errors, validate data, confirm actions
3. **Flexibility** - Support multiple payment methods, splits, adjustments
4. **Traceability** - Every payment creates a complete audit trail
5. **Offline-First** - Work without internet, sync later

### User Personas
- **Front Desk Staff**: Need speed, simplicity, mobile-friendly
- **Managers**: Need reporting, corrections, void/refund capabilities
- **Technicians**: May collect cash tips directly

---

## Redesign Architecture

### 1. Information Hierarchy

```
┌─────────────────────────────────────────────────┐
│ PENDING PAYMENTS                        (badge) │ ← Module header
├─────────────────────────────────────────────────┤
│ [Search] [Sort ▼] [Filter] [Grid/List toggle]  │ ← Controls (working)
├─────────────────────────────────────────────────┤
│ [All] [Card] [Cash] [Venmo] [Other]            │ ← Payment tabs
├─────────────────────────────────────────────────┤
│                                                 │
│  URGENT (Overdue >30min)                        │ ← Priority section
│  ┌──────┐ ┌──────┐                              │
│  │ $120 │ │ $85  │  [Show all]                 │
│  └──────┘ └──────┘                              │
│                                                 │
│  READY (All pending tickets)                    │ ← Main section
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ $95  │ │ $75  │ │ $145 │ │ $60  │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│  ... more tickets ...                           │
│                                                 │
│  PROCESSING (Payment in progress)               │ ← Active section
│  ┌──────┐                                       │
│  │ $110 │ [Payment modal open]                  │
│  └──────┘                                       │
└─────────────────────────────────────────────────┘
```

### 2. Component Structure

```
modules/Pending.tsx (Controller)
  ├─ PendingHeader (Search, Sort, Filter, Stats)
  ├─ PendingTabBar (Payment type tabs with counts)
  ├─ PendingSections (Urgent/Ready/Processing groups)
  │   └─ PendingTicketsList
  │       └─ PendingTicketCard (4 view modes)
  │           └─ QuickPayButton (1-click for exact amount)
  └─ PaymentModal (Full payment processing)
      ├─ AmountDisplay (Total, adjustments)
      ├─ PaymentMethodSelector (Card/Cash/Venmo/Split)
      ├─ TipAdjustment (Modify tip amount)
      ├─ DiscountEntry (Apply discounts)
      ├─ PaymentDetails (Card info, change calculation)
      └─ ConfirmationScreen (Receipt preview)
```

### 3. New Components Needed

#### PaymentModal.tsx ⭐ CRITICAL
**Purpose**: Complete payment collection UI
**Features**:
- Amount breakdown (subtotal, tax, tip, total)
- Payment method tabs (Card, Cash, Venmo, Split Payment)
- Tip adjustment slider/input
- Discount/promo code entry
- Payment details:
  - **Card**: Last 4 digits, auth code, processor
  - **Cash**: Amount tendered, change due
  - **Venmo**: Transaction ID, screenshot upload
- Split payment: Multiple payment methods with amounts
- Notes field for special instructions
- Receipt preview before confirming

#### QuickPayButton.tsx
**Purpose**: 1-click payment for exact amount
**Features**:
- Shows total amount
- One click → Immediate payment with default method
- Bypasses modal for speed
- Confirmation toast only

#### PendingHeader.tsx
**Purpose**: Working search, sort, filters, stats
**Features**:
- **Search**: Real-time filtering by client name, ticket #, staff
- **Sort**: By wait time, amount (high/low), client name, staff
- **Filter**: Advanced panel (date range, amount range, payment type)
- **Stats**: Total pending amount, ticket count, average wait time

#### PendingSections.tsx
**Purpose**: Organize tickets by urgency/status
**Features**:
- **Urgent**: Tickets >30min old (red badge)
- **Ready**: Standard pending tickets
- **Processing**: Tickets with payment modal currently open
- Collapsible sections with counts
- Auto-refresh every 30 seconds

#### PaymentSuccessToast.tsx
**Purpose**: Immediate feedback after payment
**Features**:
- Green checkmark animation
- "Payment received: $120.00"
- Print receipt button
- Email receipt button
- Undo button (5 second window)

---

## Functional Requirements

### Payment Processing Flow

#### Happy Path (Quick Pay)
```
1. User clicks "Quick Pay" button on ticket
   ↓
2. Show inline confirmation: "Charge $120.00 to Card ending 1234?"
   ↓
3. User clicks "Confirm"
   ↓
4. Create Transaction record in IndexedDB
5. Remove ticket from pendingTickets array
6. Add to completedTickets with paid status
7. Queue sync operation
   ↓
8. Show success toast: "Payment received!"
   ↓
9. Ticket animates out, disappears from list
```

#### Full Flow (Payment Modal)
```
1. User clicks ticket card (anywhere except buttons)
   ↓
2. Open PaymentModal with ticket details
   ↓
3. User reviews/adjusts:
   - Tip amount (can increase/decrease)
   - Discount (can apply promo codes)
   - Payment method (can change from card to cash)
   ↓
4. User enters payment details:
   - Card: Last 4, auth code
   - Cash: Amount tendered (calculates change)
   - Venmo: Transaction ID
   ↓
5. User clicks "Process Payment"
   ↓
6. Validation checks:
   - Amount > 0
   - Payment details complete
   - Client info present
   ↓
7. Create Transaction record
8. Update ticket status to 'paid'
9. Remove from pending, add to completed
10. Queue sync
   ↓
11. Show receipt preview
12. Offer print/email options
   ↓
13. Close modal, show success toast
```

### Data Integrity

#### Transaction Record Creation
```typescript
interface Transaction {
  id: string;
  salonId: string;
  ticketId: string;
  ticketNumber: number;

  // Client info
  clientId?: string;
  clientName: string;

  // Financial
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;

  // Payment details
  paymentMethod: 'card' | 'cash' | 'venmo' | 'split';
  paymentDetails: {
    // Card
    cardLast4?: string;
    authCode?: string;
    processor?: string;

    // Cash
    amountTendered?: number;
    changeDue?: number;

    // Venmo
    transactionId?: string;

    // Split
    splits?: Array<{
      method: string;
      amount: number;
      details: any;
    }>;
  };

  // Metadata
  processedAt: Date;
  processedBy: string; // Staff who processed payment
  notes?: string;

  // Sync
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: Date;
}
```

#### markTicketAsPaid() Implementation
```typescript
async function markTicketAsPaid(
  ticketId: string,
  paymentData: PaymentData
): Promise<{ success: boolean; transaction?: Transaction }> {
  try {
    // 1. Validate input
    if (!paymentData.total || paymentData.total <= 0) {
      throw new Error('Invalid payment amount');
    }

    // 2. Get pending ticket
    const pendingTicket = state.pendingTickets.find(t => t.id === ticketId);
    if (!pendingTicket) {
      throw new Error('Ticket not found');
    }

    // 3. Create transaction record
    const transaction: Transaction = {
      id: generateId(),
      salonId: currentSalonId,
      ticketId: pendingTicket.id,
      ticketNumber: pendingTicket.number,
      clientName: pendingTicket.clientName,
      subtotal: paymentData.subtotal,
      tax: paymentData.tax,
      tip: paymentData.tip,
      discount: paymentData.discount || 0,
      total: paymentData.total,
      paymentMethod: paymentData.method,
      paymentDetails: paymentData.details,
      processedAt: new Date(),
      processedBy: currentUserId,
      notes: paymentData.notes,
      syncStatus: 'pending',
    };

    // 4. Save to IndexedDB
    await transactionsDB.add(transaction);

    // 5. Update ticket in tickets DB
    await ticketsDB.update(ticketId, {
      status: 'paid',
      paidAt: new Date(),
      transactionId: transaction.id,
    });

    // 6. Queue sync
    await syncQueueDB.add({
      operation: 'create',
      table: 'transactions',
      recordId: transaction.id,
      data: transaction,
    });

    // 7. Update Redux state
    dispatch(removeFromPending(ticketId));
    dispatch(addToCompleted({ ...pendingTicket, status: 'paid', transactionId: transaction.id }));

    return { success: true, transaction };
  } catch (error) {
    console.error('Payment processing failed:', error);
    return { success: false };
  }
}
```

### Search & Filter Implementation

#### Search Logic
```typescript
const filterTickets = (tickets: PendingTicket[], searchQuery: string) => {
  if (!searchQuery.trim()) return tickets;

  const query = searchQuery.toLowerCase();
  return tickets.filter(ticket =>
    ticket.clientName.toLowerCase().includes(query) ||
    ticket.number.toString().includes(query) ||
    ticket.technician?.toLowerCase().includes(query) ||
    ticket.service.toLowerCase().includes(query)
  );
};
```

#### Sort Logic
```typescript
const sortTickets = (tickets: PendingTicket[], sortBy: SortOption) => {
  const sorted = [...tickets];

  switch (sortBy) {
    case 'waitTime':
      return sorted.sort((a, b) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
    case 'amountHigh':
      return sorted.sort((a, b) =>
        (b.subtotal + b.tax + b.tip) - (a.subtotal + a.tax + a.tip)
      );
    case 'amountLow':
      return sorted.sort((a, b) =>
        (a.subtotal + a.tax + a.tip) - (b.subtotal + b.tax + b.tip)
      );
    case 'clientName':
      return sorted.sort((a, b) =>
        a.clientName.localeCompare(b.clientName)
      );
    case 'staff':
      return sorted.sort((a, b) =>
        (a.technician || '').localeCompare(b.technician || '')
      );
    default:
      return sorted;
  }
};
```

#### Advanced Filter
```typescript
interface FilterOptions {
  dateRange?: { start: Date; end: Date };
  amountRange?: { min: number; max: number };
  paymentTypes?: ('card' | 'cash' | 'venmo')[];
  staffIds?: string[];
  clientTypes?: ('New' | 'VIP' | 'Regular')[];
  urgentOnly?: boolean; // >30min wait
}

const applyAdvancedFilter = (tickets: PendingTicket[], filters: FilterOptions) => {
  return tickets.filter(ticket => {
    // Date range check
    if (filters.dateRange) {
      const ticketDate = new Date(ticket.time);
      if (ticketDate < filters.dateRange.start || ticketDate > filters.dateRange.end) {
        return false;
      }
    }

    // Amount range check
    if (filters.amountRange) {
      const total = ticket.subtotal + ticket.tax + ticket.tip;
      if (total < filters.amountRange.min || total > filters.amountRange.max) {
        return false;
      }
    }

    // Payment type check
    if (filters.paymentTypes && filters.paymentTypes.length > 0) {
      if (!filters.paymentTypes.includes(ticket.paymentType)) {
        return false;
      }
    }

    // Urgent only check
    if (filters.urgentOnly) {
      const waitTime = Date.now() - new Date(ticket.time).getTime();
      if (waitTime < 30 * 60 * 1000) { // 30 minutes
        return false;
      }
    }

    return true;
  });
};
```

---

## UX Improvements

### 1. Quick Actions

**Problem**: Too many clicks to complete payment
**Solution**: Context-aware quick buttons

```
┌─────────────────────────────┐
│ #92  Sarah Johnson      ⭐  │
│ Acrylic Full Set            │
│ ─────────────────────────   │
│ Total: $120.00              │
│                             │
│ [Quick Pay $120] [More ▼]   │ ← Quick Pay = 1 click
└─────────────────────────────┘
```

### 2. Batch Actions

**Feature**: Process multiple payments at once
**Use case**: End of day, multiple cash payments

```
☑ Sarah Johnson - $120
☑ Rachel Green - $95
☑ Lisa Anderson - $145
                    ─────
[Mark 3 as Paid - Total: $360]
```

### 3. Payment History Panel

**Feature**: Slide-out panel showing recent transactions
**Trigger**: Click "View History" in header

```
Recent Payments (Today)
├─ 2:45 PM - Sarah J. - $120 (Card •••• 1234)
├─ 2:32 PM - Rachel G. - $95 (Cash)
├─ 2:15 PM - Lisa A. - $145 (Venmo)
└─ Total collected: $360
```

### 4. Keyboard Shortcuts

```
Enter    = Quick pay selected ticket
Esc      = Close modal
/        = Focus search
Ctrl+P   = Print receipt
Ctrl+E   = Email receipt
Ctrl+V   = Void ticket (with confirmation)
```

### 5. Smart Notifications

```
🔔 3 tickets waiting >30 minutes
🔔 $1,240 in pending payments
🔔 Card payment failed - retry?
```

---

## Receipt & Printing Features

### Receipt Generation

#### Digital Receipt (Email/SMS)
```typescript
interface Receipt {
  // Header
  salonName: string;
  salonAddress: string;
  salonPhone: string;

  // Transaction details
  receiptNumber: string;
  date: Date;

  // Client
  clientName: string;

  // Services
  services: Array<{
    name: string;
    staff: string;
    duration: string;
    price: number;
  }>;

  // Charges
  subtotal: number;
  tax: number;
  tip: number;
  discount?: number;
  total: number;

  // Payment
  paymentMethod: string;
  paymentDetails: string; // "Card ending 1234" or "Cash - $5 change"

  // Footer
  thankYouMessage: string;
  nextAppointment?: Date;
}
```

#### Print Template
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: 'Courier New', monospace; }
    .receipt { width: 80mm; padding: 10mm; }
    .center { text-align: center; }
    .line { border-top: 1px dashed #000; margin: 5mm 0; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <h2>MANGO SALON</h2>
      <p>123 Main Street<br>City, State 12345<br>(555) 123-4567</p>
    </div>

    <div class="line"></div>

    <p><strong>Receipt #:</strong> 00123<br>
       <strong>Date:</strong> 01/19/2025 2:45 PM<br>
       <strong>Client:</strong> Sarah Johnson</p>

    <div class="line"></div>

    <table width="100%">
      <tr>
        <td>Acrylic Full Set</td>
        <td align="right">$100.00</td>
      </tr>
      <tr>
        <td>Gel Polish</td>
        <td align="right">$20.00</td>
      </tr>
    </table>

    <div class="line"></div>

    <table width="100%">
      <tr>
        <td>Subtotal:</td>
        <td align="right">$120.00</td>
      </tr>
      <tr>
        <td>Tax:</td>
        <td align="right">$12.00</td>
      </tr>
      <tr>
        <td>Tip:</td>
        <td align="right">$18.00</td>
      </tr>
      <tr>
        <td><strong>Total:</strong></td>
        <td align="right"><strong>$150.00</strong></td>
      </tr>
    </table>

    <div class="line"></div>

    <p><strong>Payment:</strong> Card ending 1234</p>

    <div class="center">
      <p>Thank you!<br>Next appointment: 02/15/2025</p>
    </div>
  </div>
</body>
</html>
```

### Print Actions

#### PrintReceipt.tsx Component
```typescript
const PrintReceipt = ({ transaction }: { transaction: Transaction }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateReceiptHTML(transaction));
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmail = async () => {
    // Send email via backend
    await emailService.sendReceipt(transaction.id, clientEmail);
  };

  const handleSMS = async () => {
    // Send SMS with receipt link
    await smsService.sendReceipt(transaction.id, clientPhone);
  };

  return (
    <div className="print-actions">
      <button onClick={handlePrint}>🖨️ Print</button>
      <button onClick={handleEmail}>📧 Email</button>
      <button onClick={handleSMS}>💬 Text</button>
    </div>
  );
};
```

---

## Performance Optimizations

### 1. Virtualization
**Problem**: 100+ pending tickets lag the UI
**Solution**: React Virtuoso for list rendering

```typescript
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={filteredTickets}
  itemContent={(index, ticket) => (
    <PendingTicketCard key={ticket.id} ticket={ticket} />
  )}
  overscan={5}
/>
```

### 2. Pagination
**Problem**: All tickets load at once
**Solution**: Load 20 at a time, infinite scroll

```typescript
const [page, setPage] = useState(1);
const itemsPerPage = 20;
const visibleTickets = filteredTickets.slice(0, page * itemsPerPage);

// Load more on scroll
const handleScroll = (e) => {
  if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 100) {
    setPage(prev => prev + 1);
  }
};
```

### 3. Memoization
```typescript
const filteredAndSortedTickets = useMemo(() => {
  let result = pendingTickets;
  result = filterTickets(result, searchQuery);
  result = applyAdvancedFilter(result, filters);
  result = sortTickets(result, sortBy);
  return result;
}, [pendingTickets, searchQuery, filters, sortBy]);
```

### 4. Debounced Search
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Only filter after user stops typing for 300ms
const filteredTickets = useMemo(() =>
  filterTickets(pendingTickets, debouncedSearch),
  [pendingTickets, debouncedSearch]
);
```

---

## Error Handling

### Validation Rules
```typescript
const validatePayment = (data: PaymentData): ValidationResult => {
  const errors: string[] = [];

  // Amount validation
  if (data.total <= 0) {
    errors.push('Payment amount must be greater than $0');
  }

  if (data.total > 10000) {
    errors.push('Payment amount exceeds maximum ($10,000)');
  }

  // Payment method validation
  if (data.method === 'card' && !data.details.cardLast4) {
    errors.push('Card last 4 digits required');
  }

  if (data.method === 'cash') {
    if (!data.details.amountTendered) {
      errors.push('Amount tendered required for cash payments');
    }
    if (data.details.amountTendered < data.total) {
      errors.push('Amount tendered must be >= total amount');
    }
  }

  if (data.method === 'venmo' && !data.details.transactionId) {
    errors.push('Venmo transaction ID required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
```

### Error States
```typescript
// Payment processing error
if (!result.success) {
  showErrorToast('Payment processing failed. Please try again.');
  return;
}

// Network error (offline)
if (!navigator.onLine) {
  showWarningToast('Offline mode: Payment will sync when online');
}

// Database error
try {
  await transactionsDB.add(transaction);
} catch (error) {
  showErrorToast('Database error: Could not save transaction');
  // Rollback state changes
}
```

### Confirmation Dialogs
```typescript
// Before void
const confirmVoid = () => {
  return window.confirm(
    `Void ticket #${ticket.number} for ${ticket.clientName}?\n\n` +
    `Amount: $${total.toFixed(2)}\n` +
    `This action cannot be undone.`
  );
};

// Before batch payment
const confirmBatchPay = (tickets: PendingTicket[]) => {
  const total = tickets.reduce((sum, t) => sum + t.subtotal + t.tax + t.tip, 0);
  return window.confirm(
    `Process ${tickets.length} payments?\n\n` +
    `Total amount: $${total.toFixed(2)}`
  );
};
```

---

## Implementation Phases

### Phase 1: Core Payment Processing (CRITICAL) ⭐
**Goal**: Make payments actually work
**Tasks**:
1. Implement `markTicketAsPaid()` Redux thunk
2. Create Transaction database schema
3. Build PaymentModal component
4. Add payment validation logic
5. Implement sync queue for transactions
6. Add success/error notifications

**Files to Create**:
- `components/modals/PaymentModal.tsx`
- `components/modals/PaymentMethodSelector.tsx`
- `store/slices/transactionsSlice.ts`
- `db/transactionsDB.ts`

**Files to Modify**:
- `hooks/useTicketsCompat.ts` (implement markTicketAsPaid)
- `store/slices/uiTicketsSlice.ts` (add removeFromPending action)

**Estimated Time**: 2-3 days

### Phase 2: Search & Filter
**Goal**: Make discovery features work
**Tasks**:
1. Implement search filtering logic
2. Add sort functionality
3. Build advanced filter panel
4. Add urgent tickets section
5. Implement keyboard shortcuts

**Files to Create**:
- `components/pending/PendingHeader.tsx`
- `components/pending/AdvancedFilterPanel.tsx`
- `components/pending/PendingSections.tsx`

**Files to Modify**:
- `components/modules/Pending.tsx` (integrate working search/sort)

**Estimated Time**: 1-2 days

### Phase 3: Receipt & Printing
**Goal**: Generate and print receipts
**Tasks**:
1. Create receipt template
2. Build print functionality
3. Add email receipt capability
4. Implement receipt preview

**Files to Create**:
- `components/receipts/ReceiptTemplate.tsx`
- `components/receipts/PrintReceipt.tsx`
- `services/receiptService.ts`
- `services/emailService.ts`

**Estimated Time**: 1-2 days

### Phase 4: UX Enhancements
**Goal**: Make it faster and easier to use
**Tasks**:
1. Add QuickPayButton component
2. Implement batch payment
3. Add payment history panel
4. Build undo functionality
5. Add smart notifications

**Files to Create**:
- `components/pending/QuickPayButton.tsx`
- `components/pending/BatchPayment.tsx`
- `components/pending/PaymentHistory.tsx`
- `components/notifications/PaymentToast.tsx`

**Estimated Time**: 2 days

### Phase 5: Performance & Polish
**Goal**: Handle scale and edge cases
**Tasks**:
1. Add virtualization for large lists
2. Implement pagination/infinite scroll
3. Add loading states
4. Optimize re-renders with memo
5. Add error boundaries

**Files to Modify**:
- `components/PendingTickets.tsx` (add virtualization)
- All components (add loading states)

**Estimated Time**: 1-2 days

---

## Testing Strategy

### Unit Tests
```typescript
describe('markTicketAsPaid', () => {
  it('should create transaction record', async () => {
    const result = await markTicketAsPaid('ticket-123', paymentData);
    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
  });

  it('should validate payment amount > 0', async () => {
    const result = await markTicketAsPaid('ticket-123', { ...paymentData, total: 0 });
    expect(result.success).toBe(false);
  });

  it('should queue sync operation', async () => {
    await markTicketAsPaid('ticket-123', paymentData);
    const queued = await syncQueueDB.getAll();
    expect(queued).toHaveLength(1);
    expect(queued[0].operation).toBe('create');
  });
});
```

### Integration Tests
```typescript
describe('Payment flow', () => {
  it('should process payment end-to-end', async () => {
    // 1. Complete service ticket
    await completeTicket(serviceTicketId, completionData);

    // 2. Verify pending ticket created
    const pending = selectPendingTickets(store.getState());
    expect(pending).toHaveLength(1);

    // 3. Process payment
    await markTicketAsPaid(pending[0].id, paymentData);

    // 4. Verify transaction created
    const transactions = await transactionsDB.getAll();
    expect(transactions).toHaveLength(1);

    // 5. Verify pending ticket removed
    const updatedPending = selectPendingTickets(store.getState());
    expect(updatedPending).toHaveLength(0);
  });
});
```

### Manual Testing Checklist
- [ ] Quick pay with card
- [ ] Quick pay with cash (calculates change)
- [ ] Quick pay with Venmo
- [ ] Full payment modal flow
- [ ] Adjust tip in modal
- [ ] Apply discount in modal
- [ ] Split payment (card + cash)
- [ ] Print receipt
- [ ] Email receipt
- [ ] Void ticket (with confirmation)
- [ ] Batch payment (multiple tickets)
- [ ] Undo payment (within 5 seconds)
- [ ] Search tickets
- [ ] Sort by amount/wait time/client
- [ ] Filter by payment type
- [ ] Urgent tickets section
- [ ] Offline payment (syncs later)
- [ ] Payment error handling
- [ ] Validation errors display
- [ ] Mobile responsiveness
- [ ] Keyboard shortcuts work

---

## Success Metrics

### Functional Goals
- ✅ 100% of payments create Transaction records
- ✅ 0% payment data loss (IndexedDB + sync queue)
- ✅ <2 clicks for standard payment
- ✅ <5 seconds average payment time
- ✅ All menu actions functional (print, email, void)

### Performance Goals
- ✅ <500ms to load 100 pending tickets
- ✅ <100ms search response time
- ✅ Smooth 60fps scrolling with 200+ tickets
- ✅ No memory leaks after 100 payments

### UX Goals
- ✅ Intuitive for new users (no training needed)
- ✅ Accessible (keyboard navigation, screen reader friendly)
- ✅ Mobile-optimized (thumb-friendly buttons)
- ✅ Clear error messages (actionable feedback)

---

## Risk Mitigation

### Data Loss Prevention
1. **Atomic transactions** - All-or-nothing updates
2. **Sync queue** - Never lose payment data
3. **Local backup** - IndexedDB persists across sessions
4. **Undo window** - 5 seconds to reverse mistake

### User Errors
1. **Validation** - Prevent invalid inputs
2. **Confirmations** - Verify destructive actions
3. **Visual feedback** - Clear success/error states
4. **Undo** - Reversible actions

### Performance Degradation
1. **Virtualization** - Handle thousands of tickets
2. **Pagination** - Lazy load tickets
3. **Debouncing** - Reduce search re-renders
4. **Memoization** - Cache computed values

---

## Next Steps

### Immediate Actions
1. **Review this plan** - Get user feedback and approval
2. **Prioritize phases** - Decide which features are MVP
3. **Start Phase 1** - Implement core payment processing
4. **Set up testing** - Create test data and scenarios

### Questions for User
1. Do you want split payments in MVP or later?
2. Should we support refunds/voids immediately?
3. Email/SMS receipts - do you have backend APIs?
4. Any specific receipt template requirements?
5. Target launch date for redesigned module?

---

**Created**: 2025-01-19
**Status**: PROPOSAL - Awaiting Approval
**Priority**: CRITICAL - Payment collection is core business function
