# Phase 1: Foundation & Data Layer - Detailed Implementation Plan

**Duration:** 3-5 days
**Priority:** CRITICAL
**Goal:** Fix data models and establish proper checkout state management

---

## ⚠️ IMPORTANT: Technical Documentation Alignment

This plan has been reviewed against `docs/architecture/DATA_STORAGE_STRATEGY.md` to ensure compliance with established patterns:

1. **ServiceStatus type** - Already defined in DATA_STORAGE_STRATEGY.md Section 2.2
2. **StatusChange interface** - Already defined, must use documented pattern
3. **TipAllocation interface** - Already defined in Section 5.2
4. **BaseSyncableEntity** - All synced entities must extend this from `common.ts`
5. **ISO 8601 strings** - Use string dates for serialization, not Date objects

---

## Overview

Phase 1 establishes the foundational data structures needed for the entire checkout module. Without these changes, Phases 2-7 cannot proceed correctly.

### What We're Building:
1. Enhanced `TicketService` interface with service status tracking (using existing types)
2. Enhanced `Payment` interface with split payment support
3. New `checkoutSlice` for checkout-specific state
4. Expanded checkout configuration constants

---

## Task 1.1: Add ServiceStatus Type to common.ts

**File:** `src/types/common.ts`
**Effort:** ~10 minutes

### Rationale:
Per `DATA_STORAGE_STRATEGY.md` Section 2.2, ServiceStatus is already documented. We need to add it to common.ts for reuse across Ticket and Appointment modules.

### Changes to Make:
- [ ] Add `ServiceStatus` type after existing types

```typescript
// Service-level status tracking
// Per DATA_STORAGE_STRATEGY.md Section 2.2
export type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

// Status change audit trail (generic for both appointments and tickets)
export interface ServiceStatusChange {
  from: ServiceStatus;
  to: ServiceStatus;
  changedAt: string;            // ISO 8601 string
  changedBy: string;            // User ID
  changedByDevice: string;      // Device ID
  reason?: string;              // Optional reason for status change
}
```

---

## Task 1.2: Update TicketService Interface

**File:** `src/types/Ticket.ts`
**Effort:** ~30 minutes

### Documentation Reference:
- Uses `ServiceStatus` from common.ts (per DATA_STORAGE_STRATEGY.md Section 2.2)
- Uses ISO 8601 string dates for serialization

### Current State:
```typescript
export interface TicketService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;
  commission: number;
  startTime: Date;
  endTime?: Date;
}
```

### Target State:
```typescript
import { ServiceStatus, ServiceStatusChange } from './common';

export interface ServiceDiscount {
  type: 'percent' | 'fixed';
  value: number;
  reason: string;
  appliedBy: string;
  appliedAt: string;            // ISO 8601 string
}

export interface TicketService {
  // Existing fields
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;             // Expected duration in minutes
  commission: number;
  startTime: string;            // ISO 8601 string (changed from Date)
  endTime?: string;             // ISO 8601 string (changed from Date)

  // Status tracking (per DATA_STORAGE_STRATEGY.md)
  status: ServiceStatus;
  statusHistory: ServiceStatusChange[];

  // Timer tracking
  actualStartTime?: string;     // ISO 8601 - When service actually started
  pausedAt?: string;            // ISO 8601 - When paused (null if not paused)
  totalPausedDuration: number;  // Total paused time in milliseconds
  actualDuration?: number;      // Actual time taken in minutes

  // Service-level customization
  notes?: string;
  discount?: ServiceDiscount;

  // Assistant support (for tip splitting)
  assistantStaffId?: string;
  assistantStaffName?: string;
  assistantTipPercent?: number; // e.g., 20 means assistant gets 20% of tip
}
```

### Changes to Make:
- [ ] Import `ServiceStatus`, `ServiceStatusChange` from common.ts
- [ ] Add `ServiceDiscount` interface
- [ ] Convert Date fields to ISO 8601 strings
- [ ] Add status and statusHistory fields
- [ ] Add timer tracking fields
- [ ] Add notes and discount fields
- [ ] Add assistant fields
- [ ] Update `CreateTicketInput` to include new fields with defaults

---

## Task 1.3: Add TipAllocation Interface

**File:** `src/types/Ticket.ts`
**Effort:** ~10 minutes

### Documentation Reference:
Per `DATA_STORAGE_STRATEGY.md` Section 5.2, TipAllocation is defined as:

```typescript
// Per DATA_STORAGE_STRATEGY.md Section 5.2
export interface TipAllocation {
  staffId: string;
  staffName: string;
  amount: number;
  percentage: number;           // Percentage of total tip (not "percent")
}
```

**Note:** The doc uses `percentage` not `percent` - we must match this exactly.

---

## Task 1.4: Update Payment Interface

**File:** `src/types/Ticket.ts`
**Effort:** ~20 minutes

### Current State:
```typescript
export interface Payment {
  id: string;
  method: string;
  cardType?: string;
  cardLast4?: string;
  amount: number;
  tip: number;
  total: number;
  transactionId?: string;
  processedAt: Date;
  status?: 'approved' | 'declined' | 'pending' | 'failed';
}
```

### Target State:
```typescript
export interface Payment {
  id: string;
  method: string;
  cardType?: string;
  cardLast4?: string;
  amount: number;
  tip: number;
  total: number;
  transactionId?: string;
  processedAt: string;          // ISO 8601 string (changed from Date)
  status?: 'approved' | 'declined' | 'pending' | 'failed';

  // Split payment tracking
  isSplitPayment?: boolean;
  splitIndex?: number;          // Which payment in the split (1, 2, 3...)
  splitTotal?: number;          // Total number of payments in split

  // Tip distribution (per DATA_STORAGE_STRATEGY.md Section 5.2)
  tipAllocations?: TipAllocation[];

  // Gift card specifics
  giftCardId?: string;
  giftCardCode?: string;
  giftCardBalanceAfter?: number;

  // Cash specifics
  amountTendered?: number;
  changeGiven?: number;

  // Refund tracking
  refundedAmount?: number;
  refundedAt?: string;          // ISO 8601 string
  refundedBy?: string;
  refundReason?: string;
  refundTransactionId?: string;

  // Void tracking
  voidedAt?: string;            // ISO 8601 string
  voidedBy?: string;
  voidReason?: string;

  // Offline support (per DATA_STORAGE_STRATEGY.md sync patterns)
  offlineQueued: boolean;
  offlineQueuedAt?: string;     // ISO 8601 string
  syncedAt?: string;            // ISO 8601 string
}
```

### Changes to Make:
- [ ] Convert Date fields to ISO 8601 strings
- [ ] Add split payment fields
- [ ] Add tipAllocations using TipAllocation interface
- [ ] Add gift card fields
- [ ] Add cash payment fields
- [ ] Add refund tracking fields
- [ ] Add void tracking fields
- [ ] Add offline support fields

---

## Task 1.5: Update Ticket Interface

**File:** `src/types/Ticket.ts`
**Effort:** ~15 minutes

### Documentation Reference:
- All date fields use ISO 8601 strings per DATA_STORAGE_STRATEGY.md

### Current State (mostly complete, minor additions):
The Ticket interface is mostly complete but needs draft and source tracking.

### Changes to Make:
- [ ] Add `isDraft` field for draft sales
- [ ] Add `draftExpiresAt` field (ISO 8601 string)
- [ ] Add `lastAutoSaveAt` field (ISO 8601 string)
- [ ] Add `source` field ('pos' | 'calendar' | 'self-checkout' | 'quick-payment')
- [ ] Add service charges support

```typescript
export type TicketSource = 'pos' | 'calendar' | 'self-checkout' | 'quick-payment';

export interface ServiceCharge {
  id: string;
  name: string;
  type: 'flat' | 'percent' | 'combined';
  flatAmount?: number;
  percentAmount?: number;
  scope: 'full' | 'services' | 'products';
  taxRate?: number;
  amount: number;               // Calculated amount
  removedByStaff?: boolean;
}

// Add to existing Ticket interface:
export interface Ticket {
  // ... existing fields ...

  // Draft support
  isDraft?: boolean;
  draftExpiresAt?: string;      // ISO 8601 string
  lastAutoSaveAt?: string;      // ISO 8601 string

  // Source tracking
  source: TicketSource;

  // Service charge support (per PRD F-005)
  serviceCharges?: ServiceCharge[];
  serviceChargeTotal?: number;
}
```

---

## Task 1.6: Expand Checkout Configuration

**File:** `src/constants/checkoutConfig.ts`
**Effort:** ~20 minutes

### Current State:
```typescript
export const TAX_RATE = 0.08;
```

### Target State:
```typescript
/**
 * Checkout Configuration Constants
 * Centralized configuration for checkout-related settings
 * Per PRD Section 9: Configuration & Settings
 */

// ===================
// TAX CONFIGURATION
// ===================
export const TAX_RATE = 0.08; // 8% default tax rate

// ===================
// TIP CONFIGURATION
// ===================
export const TIP_CONFIG = {
  defaultPercentages: [18, 20, 22],       // PRD default tip suggestions
  calculationBasis: 'post-tax' as const,  // 'pre-tax' | 'post-tax'
  showOnPOS: true,
  showOnTerminal: true,
  allowCustomAmount: true,
  includeProductsInTip: false,            // Tip on services only by default
  postCheckoutEditEnabled: true,
  postCheckoutEditWindowMonths: 6,        // 6 months per PRD
};

// ===================
// DISCOUNT CONFIGURATION
// ===================
export const DISCOUNT_CONFIG = {
  managerApprovalThreshold: 30,           // % - requires manager PIN above this
  requireReason: true,
  allowNegativeTotal: false,
  applyToServiceCharges: false,
  presetReasons: [
    'First-time client',
    'Loyalty reward',
    'Service recovery',
    'Staff discount',
    'Promotion',
    'Other',
  ],
};

// ===================
// DRAFT SALES CONFIGURATION
// ===================
export const DRAFT_CONFIG = {
  autoSaveIntervalSeconds: 30,            // Auto-save every 30 seconds
  expirationHours: 24,                    // Drafts expire after 24 hours
  maxDraftsPerStaff: 5,
  notifyOnExpiration: true,
};

// ===================
// SELF-CHECKOUT CONFIGURATION
// ===================
export const SELF_CHECKOUT_CONFIG = {
  smsLinkValidityHours: 12,
  qrCodeValidityMinutes: 15,
  allowTipping: true,
  autoSaveCard: 'ask' as const,           // 'yes' | 'no' | 'ask'
  sendReminderIfUnpaid: true,
  reminderDelayHours: 2,
};

// ===================
// RECEIPT CONFIGURATION
// ===================
export const RECEIPT_CONFIG = {
  autoPrint: false,
  defaultMethod: 'ask' as const,          // 'print' | 'email' | 'sms' | 'ask'
  includeStaffNames: true,
  includeServiceDetails: true,
  customFooter: '',
  logoUrl: null as string | null,
};

// ===================
// PAYMENT CONFIGURATION
// ===================
export const PAYMENT_CONFIG = {
  voidWindowHours: 24,                    // Can void within 24 hours
  maxSplitPayments: 10,                   // Max methods per transaction
  cashQuickAmounts: [20, 50, 100],        // Quick cash buttons
};

// ===================
// SERVICE STATUS COLORS
// ===================
export const SERVICE_STATUS_COLORS = {
  not_started: { bg: '#F3F4F6', text: '#6B7280', badge: 'gray' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8', badge: 'blue' },
  paused: { bg: '#FEF3C7', text: '#D97706', badge: 'yellow' },
  completed: { bg: '#D1FAE5', text: '#059669', badge: 'green' },
};

// Type exports for TypeScript
export type TipCalculationBasis = 'pre-tax' | 'post-tax';
export type ReceiptMethod = 'print' | 'email' | 'sms' | 'ask';
export type AutoSaveCard = 'yes' | 'no' | 'ask';
```

---

## Task 1.7: Create Checkout Redux Slice

**File:** `src/store/slices/checkoutSlice.ts` (NEW FILE)
**Effort:** ~1-2 hours

### Purpose:
Manages checkout-specific state separate from tickets slice. This includes:
- Current active checkout
- Draft management
- Payment in progress state
- Split payment tracking

### Implementation:
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Ticket, Payment } from '../../types';
import type { RootState } from '../index';

// ===================
// TYPES
// ===================
export interface DraftSale {
  ticketId: string;
  createdAt: Date;
  lastSavedAt: Date;
  expiresAt: Date;
  staffId: string;
  staffName: string;
  clientName?: string;
  totalAmount: number;
  serviceCount: number;
}

export interface ActiveCheckout {
  ticketId: string;
  step: 'services' | 'review' | 'tip' | 'payment' | 'processing' | 'complete';
  tipAmount: number;
  tipPercent: number | null;
  selectedPaymentMethod: string | null;
  partialPayments: Payment[];
  remainingBalance: number;
  error: string | null;
}

export interface CheckoutState {
  // Active checkout session
  activeCheckout: ActiveCheckout | null;

  // Draft sales
  drafts: DraftSale[];
  draftsLoading: boolean;

  // Auto-save state
  autoSaveEnabled: boolean;
  lastAutoSave: Date | null;
  autoSavePending: boolean;

  // UI state
  isProcessingPayment: boolean;
  showReceiptOptions: boolean;

  // Configuration (can be overridden per session)
  sessionConfig: {
    tipPercentages: number[];
    tipBasis: 'pre-tax' | 'post-tax';
  };
}

const initialState: CheckoutState = {
  activeCheckout: null,
  drafts: [],
  draftsLoading: false,
  autoSaveEnabled: true,
  lastAutoSave: null,
  autoSavePending: false,
  isProcessingPayment: false,
  showReceiptOptions: false,
  sessionConfig: {
    tipPercentages: [18, 20, 22],
    tipBasis: 'post-tax',
  },
};

// ===================
// ASYNC THUNKS
// ===================

// Load drafts for current staff
export const loadDrafts = createAsyncThunk(
  'checkout/loadDrafts',
  async (staffId: string) => {
    // TODO: Implement database query for drafts
    // const drafts = await draftsDB.getByStaff(staffId);
    // return drafts;
    return [] as DraftSale[];
  }
);

// Save current checkout as draft
export const saveDraft = createAsyncThunk(
  'checkout/saveDraft',
  async (ticket: Ticket) => {
    // TODO: Implement draft save
    // await draftsDB.save(ticket);
    return ticket;
  }
);

// Delete a draft
export const deleteDraft = createAsyncThunk(
  'checkout/deleteDraft',
  async (ticketId: string) => {
    // TODO: Implement draft deletion
    // await draftsDB.delete(ticketId);
    return ticketId;
  }
);

// ===================
// SLICE
// ===================
const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    // Start a new checkout session
    startCheckout: (state, action: PayloadAction<{ ticketId: string; total: number }>) => {
      state.activeCheckout = {
        ticketId: action.payload.ticketId,
        step: 'services',
        tipAmount: 0,
        tipPercent: null,
        selectedPaymentMethod: null,
        partialPayments: [],
        remainingBalance: action.payload.total,
        error: null,
      };
    },

    // Update checkout step
    setCheckoutStep: (state, action: PayloadAction<ActiveCheckout['step']>) => {
      if (state.activeCheckout) {
        state.activeCheckout.step = action.payload;
      }
    },

    // Set tip
    setTip: (state, action: PayloadAction<{ amount: number; percent: number | null }>) => {
      if (state.activeCheckout) {
        state.activeCheckout.tipAmount = action.payload.amount;
        state.activeCheckout.tipPercent = action.payload.percent;
      }
    },

    // Select payment method
    selectPaymentMethod: (state, action: PayloadAction<string>) => {
      if (state.activeCheckout) {
        state.activeCheckout.selectedPaymentMethod = action.payload;
      }
    },

    // Add partial payment (for split payments)
    addPartialPayment: (state, action: PayloadAction<Payment>) => {
      if (state.activeCheckout) {
        state.activeCheckout.partialPayments.push(action.payload);
        state.activeCheckout.remainingBalance -= action.payload.total;
        // Reset payment method for next payment
        state.activeCheckout.selectedPaymentMethod = null;
      }
    },

    // Update remaining balance
    updateRemainingBalance: (state, action: PayloadAction<number>) => {
      if (state.activeCheckout) {
        state.activeCheckout.remainingBalance = action.payload;
      }
    },

    // Set checkout error
    setCheckoutError: (state, action: PayloadAction<string | null>) => {
      if (state.activeCheckout) {
        state.activeCheckout.error = action.payload;
      }
    },

    // Clear active checkout
    clearCheckout: (state) => {
      state.activeCheckout = null;
      state.isProcessingPayment = false;
      state.showReceiptOptions = false;
    },

    // Set processing state
    setProcessingPayment: (state, action: PayloadAction<boolean>) => {
      state.isProcessingPayment = action.payload;
    },

    // Toggle receipt options
    setShowReceiptOptions: (state, action: PayloadAction<boolean>) => {
      state.showReceiptOptions = action.payload;
    },

    // Auto-save tracking
    setAutoSavePending: (state, action: PayloadAction<boolean>) => {
      state.autoSavePending = action.payload;
    },

    setLastAutoSave: (state, action: PayloadAction<Date>) => {
      state.lastAutoSave = action.payload;
      state.autoSavePending = false;
    },

    // Update session config
    updateSessionConfig: (state, action: PayloadAction<Partial<CheckoutState['sessionConfig']>>) => {
      state.sessionConfig = { ...state.sessionConfig, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load drafts
      .addCase(loadDrafts.pending, (state) => {
        state.draftsLoading = true;
      })
      .addCase(loadDrafts.fulfilled, (state, action) => {
        state.draftsLoading = false;
        state.drafts = action.payload;
      })
      .addCase(loadDrafts.rejected, (state) => {
        state.draftsLoading = false;
      })
      // Save draft
      .addCase(saveDraft.fulfilled, (state) => {
        state.autoSavePending = false;
        state.lastAutoSave = new Date();
      })
      // Delete draft
      .addCase(deleteDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter(d => d.ticketId !== action.payload);
      });
  },
});

// ===================
// EXPORTS
// ===================
export const {
  startCheckout,
  setCheckoutStep,
  setTip,
  selectPaymentMethod,
  addPartialPayment,
  updateRemainingBalance,
  setCheckoutError,
  clearCheckout,
  setProcessingPayment,
  setShowReceiptOptions,
  setAutoSavePending,
  setLastAutoSave,
  updateSessionConfig,
} = checkoutSlice.actions;

// Selectors
export const selectActiveCheckout = (state: RootState) => state.checkout.activeCheckout;
export const selectCheckoutStep = (state: RootState) => state.checkout.activeCheckout?.step;
export const selectDrafts = (state: RootState) => state.checkout.drafts;
export const selectIsProcessingPayment = (state: RootState) => state.checkout.isProcessingPayment;
export const selectRemainingBalance = (state: RootState) => state.checkout.activeCheckout?.remainingBalance ?? 0;
export const selectPartialPayments = (state: RootState) => state.checkout.activeCheckout?.partialPayments ?? [];
export const selectSessionConfig = (state: RootState) => state.checkout.sessionConfig;

export default checkoutSlice.reducer;
```

---

## Task 1.8: Register Checkout Slice in Store

**File:** `src/store/index.ts`
**Effort:** ~5 minutes

### Changes to Make:
- [ ] Import checkoutReducer
- [ ] Add to store configuration
- [ ] Add to serializable check ignored paths

```typescript
// Add import
import checkoutReducer from './slices/checkoutSlice';

// Add to reducer object
reducer: {
  // ... existing reducers
  checkout: checkoutReducer,
},

// Add to ignoredPaths
'checkout.activeCheckout.partialPayments',
'checkout.lastAutoSave',
'checkout.drafts',
```

---

## Task 1.9: Add Service Status Actions to Tickets Slice

**File:** `src/store/slices/ticketsSlice.ts`
**Effort:** ~45 minutes

### New Actions to Add:
```typescript
// Service status update thunk
export const updateServiceStatus = createAsyncThunk(
  'tickets/updateServiceStatus',
  async ({
    ticketId,
    serviceId,
    status,
    userId,
  }: {
    ticketId: string;
    serviceId: string;
    status: ServiceStatus;
    userId: string;
  }) => {
    // Get current ticket
    const ticket = await ticketsDB.getById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    // Find and update service
    const services = ticket.services.map(service => {
      if (service.serviceId !== serviceId) return service;

      const now = new Date();
      const statusChange: StatusChange = {
        from: service.status,
        to: status,
        timestamp: now,
        userId,
      };

      const updates: Partial<TicketService> = {
        status,
        statusHistory: [...(service.statusHistory || []), statusChange],
      };

      // Handle specific status transitions
      if (status === 'in_progress' && service.status === 'not_started') {
        updates.actualStartTime = now;
      } else if (status === 'paused') {
        updates.pausedAt = now;
      } else if (status === 'in_progress' && service.status === 'paused') {
        // Resuming from pause
        const pausedDuration = service.pausedAt
          ? now.getTime() - service.pausedAt.getTime()
          : 0;
        updates.totalPausedDuration = (service.totalPausedDuration || 0) + pausedDuration;
        updates.pausedAt = undefined;
      } else if (status === 'completed') {
        updates.endTime = now;
        if (service.actualStartTime) {
          const totalTime = now.getTime() - service.actualStartTime.getTime();
          const actualMinutes = Math.round((totalTime - (service.totalPausedDuration || 0)) / 60000);
          updates.actualDuration = actualMinutes;
        }
      }

      return { ...service, ...updates };
    });

    // Update ticket
    const updatedTicket = await ticketsDB.update(ticketId, { services }, userId);

    // Queue for sync
    await syncQueueDB.add({
      type: 'update',
      entity: 'ticket',
      entityId: ticketId,
      action: 'UPDATE',
      payload: updatedTicket,
      priority: 2,
      maxAttempts: 5,
    });

    return updatedTicket;
  }
);
```

---

## Task 1.10: Update Types Index Export

**File:** `src/types/index.ts`
**Effort:** ~5 minutes

### Changes to Make:
- [ ] Export new types: `ServiceStatus`, `StatusChange`, `ServiceDiscount`, `TipAllocation`, `ServiceCharge`

---

## Validation Checkpoint

After completing all Phase 1 tasks, validate by:

### 1. TypeScript Compilation
```bash
npm run type-check
```
Should pass with no errors related to Ticket, Payment, or checkout types.

### 2. Redux DevTools Check
1. Start dev server: `npm run dev`
2. Open browser DevTools → Redux tab
3. Verify `checkout` slice exists in state tree
4. Verify initial state structure matches implementation

### 3. Create Test Ticket
1. Open the app
2. Create a new ticket (if UI exists)
3. Verify services have `status: 'not_started'`
4. Verify ticket has `source` field

### 4. Manual Type Verification
Create a temporary test file to verify types compile:

```typescript
// src/test-types.ts (delete after testing)
import type { TicketService, Payment, ServiceStatus } from './types';

const testService: TicketService = {
  serviceId: '1',
  serviceName: 'Test',
  staffId: '1',
  staffName: 'Staff',
  price: 50,
  duration: 60,
  commission: 10,
  startTime: new Date(),
  status: 'not_started',
  statusHistory: [],
  totalPausedDuration: 0,
};

const testPayment: Payment = {
  id: '1',
  method: 'card',
  amount: 50,
  tip: 10,
  total: 60,
  processedAt: new Date(),
  offlineQueued: false,
};

console.log('Types valid!', testService, testPayment);
```

---

## Files Summary

| File | Action | Task | Effort |
|------|--------|------|--------|
| `src/types/common.ts` | MODIFY | 1.1 | 10 min |
| `src/types/Ticket.ts` | MODIFY | 1.2, 1.3, 1.4, 1.5 | 75 min |
| `src/constants/checkoutConfig.ts` | MODIFY | 1.6 | 20 min |
| `src/store/slices/checkoutSlice.ts` | CREATE | 1.7 | 1-2 hr |
| `src/store/index.ts` | MODIFY | 1.8 | 5 min |
| `src/store/slices/ticketsSlice.ts` | MODIFY | 1.9 | 45 min |
| `src/types/index.ts` | MODIFY | 1.10 | 5 min |

**Total Estimated Time:** 3-5 hours

---

## Order of Implementation

1. **Task 1.1:** `src/types/common.ts` - Add ServiceStatus type & ServiceStatusChange interface
2. **Task 1.2:** `src/types/Ticket.ts` - Update TicketService interface
3. **Task 1.3:** `src/types/Ticket.ts` - Add TipAllocation interface
4. **Task 1.4:** `src/types/Ticket.ts` - Update Payment interface
5. **Task 1.5:** `src/types/Ticket.ts` - Update Ticket interface (draft/source fields)
6. **Task 1.6:** `src/constants/checkoutConfig.ts` - Full configuration constants
7. **Task 1.7:** `src/store/slices/checkoutSlice.ts` - Create new Redux slice
8. **Task 1.8:** `src/store/index.ts` - Register checkout slice
9. **Task 1.9:** `src/store/slices/ticketsSlice.ts` - Add service status actions
10. **Task 1.10:** `src/types/index.ts` - Export all new types
11. **Validation checkpoint**

---

## Key Alignment Notes from Technical Documentation

| Pattern | Source | Implementation |
|---------|--------|----------------|
| ServiceStatus type | DATA_STORAGE_STRATEGY.md 2.2 | Use exactly: `'not_started' \| 'in_progress' \| 'paused' \| 'completed'` |
| StatusChange fields | DATA_STORAGE_STRATEGY.md 2.2 | Use `changedAt`, `changedBy`, `changedByDevice` |
| TipAllocation.percentage | DATA_STORAGE_STRATEGY.md 5.2 | Use `percentage` NOT `percent` |
| Date fields | DATA_STORAGE_STRATEGY.md | All dates as ISO 8601 strings, not Date objects |
| Sync queue priority | DATA_STORAGE_STRATEGY.md 3.2 | Transactions=1, Tickets=2, Clients=3 |

---

**Ready to begin implementation? Confirm and I'll start with Task 1.1.**
