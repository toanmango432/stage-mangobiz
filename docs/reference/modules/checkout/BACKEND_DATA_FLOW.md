# Checkout Backend Data Flow

> **Last Updated:** December 31, 2025
> **Module:** Checkout (Sales & Payment Processing)
> **Purpose:** Document backend data operations for the Checkout module

---

## Overview

The Checkout module handles:
- Ticket editing and price adjustments
- Discount and coupon application
- Tip entry and calculation
- Payment processing
- Transaction creation
- Receipt generation

---

## Data Model

### Primary Entities

| Entity | Table | Primary Key | Description |
|--------|-------|-------------|-------------|
| Ticket | `tickets` | `id` (uuid) | Service ticket being checked out |
| Transaction | `transactions` | `id` (uuid) | Payment record |
| Client | `clients` | `id` (uuid) | Paying customer |

### Transaction Entity

```typescript
interface Transaction {
  id: string;
  salonId: string;
  ticketId: string;               // Link to ticket
  ticketNumber: number;           // Display number
  clientId?: string;
  clientName?: string;

  // Amounts
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  tip: number;
  total: number;

  // Payment
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;

  // Services snapshot
  services: TransactionService[];

  // Status
  status: TransactionStatus;      // completed, voided, refunded

  // Timestamps
  createdAt: Date;
  processedAt: Date;
  processedBy: string;            // Staff who processed

  // Sync
  syncStatus: SyncStatus;
}

interface PaymentDetails {
  method: string;
  cardType?: string;              // visa, mastercard, amex
  cardLast4?: string;             // Last 4 digits
  authCode?: string;              // Authorization code
  receiptNumber?: string;
}
```

---

## Checkout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHECKOUT FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Open Checkout                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Pending ticket clicked → TicketPanel opens             │   │
│  │  Data loaded from: localStorage + Redux                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  STEP 2: Edit Services (Optional)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Add/remove services, adjust prices                     │   │
│  │  Auto-save every change                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  STEP 3: Apply Discounts (Optional)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Fixed amount or percentage discount                    │   │
│  │  Coupon code application                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  STEP 4: Enter Tip                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Preset percentages or custom amount                    │   │
│  │  Tip distribution calculated                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  STEP 5: Payment                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Select method: Cash, Card, Split                       │   │
│  │  Process payment                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  STEP 6: Transaction Created                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Transaction record created                             │   │
│  │  Ticket status → paid                                   │   │
│  │  Receipt available                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Operations

### 1. Open Checkout Panel

**Trigger:** Click on pending ticket

**Data Loading:**
```typescript
// 1. Check localStorage for draft
const savedDraft = localStorage.getItem('checkout-pending-ticket');
if (savedDraft) {
  const draft = JSON.parse(savedDraft);
  if (draft.id === ticketId) {
    // Resume draft
    setCheckoutData(draft);
  }
}

// 2. If no draft, load from Redux/IndexedDB
const ticket = await dispatch(fetchTicketById(ticketId));
setCheckoutData(convertToCheckoutFormat(ticket));

// 3. Store in Redux
dispatch(setCheckoutTicket(checkoutData));
```

---

### 2. Edit Services

**Auto-Save Pattern:**
```typescript
// Every change triggers auto-save
useEffect(() => {
  if (!ticketId) return; // Skip for new tickets

  const saveTimer = setTimeout(() => {
    // Save to localStorage
    localStorage.setItem('checkout-pending-ticket', JSON.stringify({
      id: ticketId,
      services,
      discount,
      tip,
      clientId,
      updatedAt: new Date().toISOString()
    }));

    // Save to Redux
    dispatch(updateCheckoutTicket({
      ticketId,
      updates: { services, discount }
    }));
  }, 1000); // 1 second debounce

  return () => clearTimeout(saveTimer);
}, [services, discount, ticketId]);
```

---

### 3. Calculate Totals

**Calculation Logic:**
```typescript
function calculateTotals(
  services: CheckoutService[],
  discount: number,
  tipAmount: number,
  taxRate: number = 0.0825
): CheckoutTotals {
  // Subtotal = sum of service prices
  const subtotal = services.reduce((sum, s) => sum + s.price, 0);

  // Apply discount
  const discountAmount = Math.min(discount, subtotal);
  const taxableAmount = subtotal - discountAmount;

  // Calculate tax
  const tax = taxableAmount * taxRate;

  // Total
  const total = taxableAmount + tax + tipAmount;

  return {
    subtotal: round2(subtotal),
    discount: round2(discountAmount),
    taxableAmount: round2(taxableAmount),
    tax: round2(tax),
    tip: round2(tipAmount),
    total: round2(total)
  };
}
```

---

### 4. Process Payment

**Payment Flow:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Click     │────▶│   Payment    │────▶│   Process    │
│  "Proceed"   │     │    Modal     │     │   Payment    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                     ┌───────────────────────────┤
                     │                           │
                     ▼                           ▼
              ┌──────────────┐           ┌──────────────┐
              │    Cash      │           │    Card      │
              │   Payment    │           │   Payment    │
              └──────┬───────┘           └──────┬───────┘
                     │                          │
                     │    ┌─────────────────────┘
                     │    │
                     ▼    ▼
              ┌──────────────┐
              │  Transaction │
              │   Created    │
              └──────────────┘
```

**Redux Actions:**
```typescript
// For cash payment
dispatch(createTransactionFromPending({
  ticketId,
  paymentMethod: 'cash',
  cashReceived,
  tip: tipAmount
}));

// For card payment
dispatch(createTransactionInSupabase({
  ticketId,
  paymentMethod: 'credit-card',
  paymentDetails: {
    cardType,
    cardLast4,
    authCode
  },
  tip: tipAmount
}));
```

---

### 5. Create Transaction

**Transaction Creation:**
```typescript
// uiTicketsSlice.ts - markTicketAsPaid
export const markTicketAsPaid = createAsyncThunk(
  'uiTickets/markTicketAsPaid',
  async ({ ticketId, paymentMethod, tip }: MarkPaidPayload) => {
    // 1. Find pending ticket
    const pendingTicket = findPendingTicket(ticketId);

    // 2. Calculate totals
    const totals = calculateTotals(pendingTicket.services, tip);

    // 3. Create transaction
    const transaction: CreateTransactionInput = {
      ticketId,
      ticketNumber: pendingTicket.number,
      clientId: pendingTicket.clientId,
      clientName: pendingTicket.clientName,
      subtotal: totals.subtotal,
      tax: totals.tax,
      tip,
      discount: pendingTicket.discount || 0,
      total: totals.total,
      paymentMethod,
      services: pendingTicket.services, // Snapshot
      status: 'completed'
    };

    // 4. Save transaction
    await dataService.transactions.create(transaction);

    // 5. Update ticket status
    await dataService.tickets.update(ticketId, { status: 'paid' });

    return { ticketId, transaction };
  }
);
```

---

### 6. Post-Payment Cleanup

**Cleanup Actions:**
```typescript
// In markTicketAsPaid.fulfilled reducer
.addCase(markTicketAsPaid.fulfilled, (state, action) => {
  const { ticketId, transaction } = action.payload;

  // 1. Remove from pending
  state.pendingTickets = state.pendingTickets.filter(
    t => t.id !== ticketId
  );

  // 2. Add to completed
  state.completedTickets.push({
    ...transaction,
    status: 'paid'
  });

  // 3. Clear checkout state
  state.checkoutTicket = null;
});

// Clear localStorage
localStorage.removeItem('checkout-pending-ticket');
```

---

## Redux Slices

### uiTicketsSlice (Checkout Actions)

**Key Thunks:**
| Thunk | Purpose |
|-------|---------|
| `setCheckoutTicket` | Load ticket into checkout |
| `updateCheckoutTicket` | Auto-save changes |
| `markTicketAsPaid` | Complete payment |
| `createTransactionFromPending` | Create transaction |

### transactionsSlice

**Location:** `src/store/slices/transactionsSlice.ts`

**State Shape:**
```typescript
interface TransactionsState {
  items: Transaction[];
  selectedTransaction: Transaction | null;
  todayTotal: number;
  loading: boolean;
  error: string | null;
}
```

**Key Thunks:**
| Thunk | Purpose |
|-------|---------|
| `fetchTodaysTransactions` | Load Sales view |
| `createTransactionInSupabase` | Create transaction |
| `voidTransaction` | Void transaction |
| `refundTransaction` | Process refund |

---

## Storage Patterns

### LocalStorage Keys

| Key | Purpose | Lifetime |
|-----|---------|----------|
| `checkout-pending-ticket` | Draft checkout data | Until payment |
| `checkout-tip-preferences` | User's tip defaults | Permanent |

### Sync Priority

| Operation | Priority | Rationale |
|-----------|----------|-----------|
| Transaction create | **1 (Highest)** | Financial data critical |
| Ticket status update | 2 | Links to transaction |
| Refund/Void | **1 (Highest)** | Financial correction |

---

## Component File Locations

| Component | File | Purpose |
|-----------|------|---------|
| TicketPanel | `src/components/checkout/TicketPanel.tsx` | Main checkout |
| PaymentModal | `src/components/checkout/PaymentModal.tsx` | Payment selection |
| ServiceList | `src/components/checkout/ServiceList.tsx` | Service editing |
| TipSelector | `src/components/checkout/TipSelector.tsx` | Tip input |
| DiscountInput | `src/components/checkout/DiscountInput.tsx` | Discount entry |
| ReceiptModal | `src/components/checkout/ReceiptModal.tsx` | Receipt display |

---

## Offline Behavior

| Operation | Offline Support | Notes |
|-----------|-----------------|-------|
| View checkout | Yes | From localStorage/IndexedDB |
| Edit services | Yes | Saved locally |
| Apply discount | Yes | Saved locally |
| Cash payment | Yes | Transaction queued |
| Card payment | **No** | Requires network |
| View receipt | Yes | From local data |

---

## Error Handling

### Payment Failures

```typescript
try {
  await processPayment(paymentData);
} catch (error) {
  if (error.code === 'CARD_DECLINED') {
    // Show decline reason, offer retry
    showError('Card declined. Please try another card.');
  } else if (error.code === 'TIMEOUT') {
    // Network timeout
    showError('Payment timed out. Please try again.');
  } else if (error.code === 'DUPLICATE') {
    // Duplicate payment attempt
    showError('Payment already processed.');
  } else {
    // Generic error
    showError('Payment failed. Please try again.');
  }

  // Log for debugging
  logError('Payment failure', error);
}
```

---

## Related Documentation

- [STATE_MACHINES.md](../../architecture/STATE_MACHINES.md) - Transaction states
- [FRONTDESK_BACKEND_DATA_FLOW.md](../frontdesk/BACKEND_DATA_FLOW.md) - Pre-checkout flow
- [VALIDATION_RULES.md](../../architecture/VALIDATION_RULES.md) - Financial validation

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
