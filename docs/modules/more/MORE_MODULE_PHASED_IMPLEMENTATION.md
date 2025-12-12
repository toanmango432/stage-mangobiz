# MORE Module - Phased Implementation Guide

> A step-by-step implementation guide with code templates
> Total: 8 Phases | 47 Tasks | 8-10 Development Days

---

## Table of Contents

1. [Phase 1: End of Day Closeout - Foundation](#phase-1-end-of-day-closeout---foundation)
2. [Phase 2: End of Day Closeout - Wizard Steps](#phase-2-end-of-day-closeout---wizard-steps)
3. [Phase 3: End of Day Closeout - Integration](#phase-3-end-of-day-closeout---integration)
4. [Phase 4: Account Settings Module](#phase-4-account-settings-module)
5. [Phase 5: Admin Back Office Module](#phase-5-admin-back-office-module)
6. [Phase 6: Quick Stats Implementation](#phase-6-quick-stats-implementation)
7. [Phase 7: UX Improvements](#phase-7-ux-improvements)
8. [Phase 8: Testing & Polish](#phase-8-testing--polish)

---

## Phase 1: End of Day Closeout - Foundation

**Duration:** 1 day
**Tasks:** 4
**Dependencies:** None

### Phase 1.1: Create Directory Structure

```bash
# Run from project root
mkdir -p src/components/closeout/steps
mkdir -p src/components/closeout/components
mkdir -p src/components/closeout/hooks
mkdir -p src/store/selectors
```

---

### Phase 1.2: Type Definitions

**File:** `src/components/closeout/types.ts`

```typescript
/**
 * End of Day Closeout Types
 * Based on PRD Sections 7.8, 1878-1926, 2820-2880
 */

// ============================================================================
// ENUMS
// ============================================================================

export type CloseoutStep =
  | 'pre_check'
  | 'sales_summary'
  | 'cash_reconciliation'
  | 'tip_distribution'
  | 'final_sync'
  | 'confirmation';

export type TipDistributionMethod = 'equal' | 'by_hours' | 'custom';

export type CloseoutStatus = 'in_progress' | 'completed' | 'cancelled';

// ============================================================================
// PRE-CHECK
// ============================================================================

export interface PreCheckItem {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message?: string;
  canForce?: boolean;
}

export interface PreCheckResult {
  passed: boolean;
  canProceed: boolean;
  items: PreCheckItem[];
  openTicketCount: number;
  pendingSyncCount: number;
  isOnline: boolean;
  lastSyncTime: Date | null;
}

// ============================================================================
// SALES SUMMARY
// ============================================================================

export interface PaymentBreakdown {
  method: 'cash' | 'card' | 'check' | 'giftcard' | 'other';
  label: string;
  amount: number;
  count: number;
}

export interface SalesSummary {
  date: Date;
  totalRevenue: number;
  totalTransactions: number;
  subtotal: number;
  taxCollected: number;
  tipsCollected: number;
  discountsApplied: number;
  refundsProcessed: number;
  voidsProcessed: number;
  netRevenue: number;
  paymentBreakdown: PaymentBreakdown[];
  averageTicket: number;
}

// ============================================================================
// CASH RECONCILIATION
// ============================================================================

export interface CashDenomination {
  label: string;
  value: number;
  count: number;
}

export interface CashReconciliation {
  expectedCash: number;
  countedCash: number;
  variance: number;
  variancePercentage: number;
  denominations?: CashDenomination[];
  explanation?: string;
  managerApproved: boolean;
  managerPIN?: string;
  approvedAt?: Date;
}

// ============================================================================
// TIP DISTRIBUTION
// ============================================================================

export interface TipAllocation {
  staffId: string;
  staffName: string;
  hoursWorked?: number;
  percentage: number;
  amount: number;
}

export interface TipDistributionState {
  totalTips: number;
  method: TipDistributionMethod;
  allocations: TipAllocation[];
  isValid: boolean;
}

// ============================================================================
// SYNC STATUS
// ============================================================================

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  currentItem?: string;
}

// ============================================================================
// CLOSEOUT REPORT
// ============================================================================

export interface CloseoutReport {
  id: string;
  storeId: string;
  closedAt: Date;
  closedBy: {
    id: string;
    name: string;
  };
  salesSummary: SalesSummary;
  cashReconciliation: CashReconciliation;
  tipDistribution: TipDistributionState;
  syncStatus: {
    itemsSynced: number;
    syncCompleted: boolean;
  };
  notes?: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface EndOfDayCloseoutProps {
  onBack?: () => void;
  onComplete?: (report: CloseoutReport) => void;
}

export interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isActive: boolean;
}

export interface PreCheckStepProps extends StepProps {
  result: PreCheckResult | null;
  onRunCheck: () => Promise<void>;
  onForceOverride: (pin: string) => Promise<boolean>;
  loading: boolean;
}

export interface SalesSummaryStepProps extends StepProps {
  summary: SalesSummary | null;
  loading: boolean;
}

export interface CashReconciliationStepProps extends StepProps {
  expectedCash: number;
  onSubmit: (reconciliation: CashReconciliation) => void;
  varianceThreshold: number;
}

export interface TipDistributionStepProps extends StepProps {
  totalTips: number;
  activeStaff: Array<{ id: string; name: string; hoursWorked?: number }>;
  onSubmit: (distribution: TipDistributionState) => void;
}

export interface FinalSyncStepProps extends StepProps {
  progress: SyncProgress;
  onStartSync: () => Promise<void>;
  onRetry: () => Promise<void>;
}

export interface ConfirmationStepProps extends StepProps {
  report: Partial<CloseoutReport>;
  onConfirm: () => Promise<void>;
  onPrint: () => void;
  onEmail: () => void;
  loading: boolean;
}
```

**Checklist:**
- [ ] All interfaces defined
- [ ] JSDoc comments added
- [ ] Export all types
- [ ] No TypeScript errors

---

### Phase 1.3: Constants

**File:** `src/components/closeout/constants.ts`

```typescript
/**
 * End of Day Closeout Constants
 */

import type { CloseoutStep } from './types';

// ============================================================================
// WIZARD STEPS
// ============================================================================

export interface StepConfig {
  id: CloseoutStep;
  label: string;
  description: string;
  icon: string;
}

export const CLOSEOUT_STEPS: StepConfig[] = [
  {
    id: 'pre_check',
    label: 'Pre-Check',
    description: 'Verify system is ready for closeout',
    icon: 'ClipboardCheck',
  },
  {
    id: 'sales_summary',
    label: 'Sales Summary',
    description: 'Review today\'s transactions',
    icon: 'DollarSign',
  },
  {
    id: 'cash_reconciliation',
    label: 'Cash Count',
    description: 'Reconcile the cash drawer',
    icon: 'Banknote',
  },
  {
    id: 'tip_distribution',
    label: 'Tips',
    description: 'Allocate tips to staff',
    icon: 'Users',
  },
  {
    id: 'final_sync',
    label: 'Sync',
    description: 'Upload all pending data',
    icon: 'Cloud',
  },
  {
    id: 'confirmation',
    label: 'Complete',
    description: 'Finalize and generate report',
    icon: 'CheckCircle',
  },
];

// ============================================================================
// THRESHOLDS
// ============================================================================

export const VARIANCE_THRESHOLDS = {
  /** No action needed */
  acceptable: 5.0,
  /** Requires explanation */
  warning: 10.0,
  /** Requires manager PIN */
  requiresApproval: 20.0,
};

// ============================================================================
// CASH DENOMINATIONS (USD)
// ============================================================================

export const CASH_DENOMINATIONS = [
  { label: 'Pennies ($0.01)', value: 0.01 },
  { label: 'Nickels ($0.05)', value: 0.05 },
  { label: 'Dimes ($0.10)', value: 0.10 },
  { label: 'Quarters ($0.25)', value: 0.25 },
  { label: '$1 Bills', value: 1.0 },
  { label: '$5 Bills', value: 5.0 },
  { label: '$10 Bills', value: 10.0 },
  { label: '$20 Bills', value: 20.0 },
  { label: '$50 Bills', value: 50.0 },
  { label: '$100 Bills', value: 100.0 },
];

// ============================================================================
// TIP DISTRIBUTION
// ============================================================================

export const TIP_METHODS = [
  { id: 'equal', label: 'Equal Split', description: 'Divide tips equally among staff' },
  { id: 'by_hours', label: 'By Hours Worked', description: 'Proportional to hours worked today' },
  { id: 'custom', label: 'Custom', description: 'Manually set percentages' },
] as const;

// ============================================================================
// PRE-CHECK ITEMS
// ============================================================================

export const PRE_CHECK_ITEMS = [
  { id: 'open_tickets', label: 'No open tickets', critical: true },
  { id: 'pending_sync', label: 'All data synced', critical: true },
  { id: 'online_status', label: 'Device online', critical: true },
  { id: 'staff_clocked_out', label: 'All staff clocked out', critical: false },
] as const;

// ============================================================================
// MESSAGES
// ============================================================================

export const CLOSEOUT_MESSAGES = {
  PRE_CHECK_FAILED: 'Please resolve the issues above before continuing.',
  VARIANCE_WARNING: 'Cash variance detected. Please provide an explanation.',
  VARIANCE_APPROVAL: 'Variance exceeds threshold. Manager approval required.',
  SYNC_FAILED: 'Some items failed to sync. You can retry or continue with manual resolution.',
  COMPLETE_SUCCESS: 'End of Day completed successfully!',
  CONFIRM_CANCEL: 'Are you sure you want to cancel? Progress will be lost.',
};

// ============================================================================
// PRINT TEMPLATE
// ============================================================================

export const REPORT_SECTIONS = [
  'header',
  'sales_summary',
  'payment_breakdown',
  'cash_reconciliation',
  'tip_distribution',
  'signatures',
  'footer',
] as const;
```

**Checklist:**
- [ ] All constants defined
- [ ] Values match PRD requirements
- [ ] Export all constants

---

### Phase 1.4: Redux Slice

**File:** `src/store/slices/closeoutSlice.ts`

```typescript
/**
 * Closeout Redux Slice
 * Manages End of Day closeout state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  CloseoutStep,
  CloseoutStatus,
  PreCheckResult,
  SalesSummary,
  CashReconciliation,
  TipDistributionState,
  CloseoutReport,
  SyncProgress,
} from '../../components/closeout/types';

// ============================================================================
// STATE
// ============================================================================

interface CloseoutState {
  // Wizard state
  isActive: boolean;
  currentStep: CloseoutStep;
  status: CloseoutStatus;

  // Step data
  preCheck: PreCheckResult | null;
  salesSummary: SalesSummary | null;
  cashReconciliation: CashReconciliation | null;
  tipDistribution: TipDistributionState | null;
  syncProgress: SyncProgress | null;

  // Result
  report: CloseoutReport | null;
  history: CloseoutReport[];

  // UI state
  loading: boolean;
  error: string | null;
}

const initialState: CloseoutState = {
  isActive: false,
  currentStep: 'pre_check',
  status: 'in_progress',

  preCheck: null,
  salesSummary: null,
  cashReconciliation: null,
  tipDistribution: null,
  syncProgress: null,

  report: null,
  history: [],

  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Run pre-check validations
 */
export const runPreCheck = createAsyncThunk(
  'closeout/runPreCheck',
  async (_, { getState }) => {
    // Import dependencies dynamically to avoid circular imports
    const state = getState() as RootState;

    // Check open tickets
    const openTickets = state.uiTickets?.items?.filter(
      (t) => t.status === 'open' || t.status === 'in_progress'
    ) || [];

    // Check pending sync
    const pendingSync = state.sync?.pendingCount || 0;

    // Check online status
    const isOnline = state.sync?.isOnline ?? navigator.onLine;

    // Get last sync time
    const lastSyncTime = state.sync?.lastSyncTime
      ? new Date(state.sync.lastSyncTime)
      : null;

    const items = [
      {
        id: 'open_tickets',
        label: 'No open tickets',
        status: openTickets.length === 0 ? 'pass' : 'fail',
        message: openTickets.length > 0
          ? `${openTickets.length} ticket(s) still open`
          : undefined,
        canForce: true,
      },
      {
        id: 'pending_sync',
        label: 'All data synced',
        status: pendingSync === 0 ? 'pass' : 'warning',
        message: pendingSync > 0
          ? `${pendingSync} item(s) pending sync`
          : undefined,
        canForce: false,
      },
      {
        id: 'online_status',
        label: 'Device online',
        status: isOnline ? 'pass' : 'fail',
        message: !isOnline ? 'Device is offline' : undefined,
        canForce: false,
      },
    ];

    const passed = items.every((item) => item.status === 'pass');
    const canProceed = items.every(
      (item) => item.status === 'pass' || item.status === 'warning'
    );

    return {
      passed,
      canProceed,
      items,
      openTicketCount: openTickets.length,
      pendingSyncCount: pendingSync,
      isOnline,
      lastSyncTime,
    } as PreCheckResult;
  }
);

/**
 * Fetch today's sales summary
 */
export const fetchSalesSummary = createAsyncThunk(
  'closeout/fetchSalesSummary',
  async () => {
    const { dataService } = await import('../../services/dataService');
    const { toTransactions } = await import('../../services/supabase');

    const today = new Date();
    const rows = await dataService.transactions.getByDate(today);
    const transactions = toTransactions(rows);

    // Calculate summary
    const completed = transactions.filter((t) => t.status === 'completed');
    const refunds = transactions.filter((t) => t.status === 'refunded');
    const voids = transactions.filter((t) => t.status === 'voided');

    const subtotal = completed.reduce((sum, t) => sum + (t.subtotal || 0), 0);
    const taxCollected = completed.reduce((sum, t) => sum + (t.tax || 0), 0);
    const tipsCollected = completed.reduce((sum, t) => sum + (t.tip || 0), 0);
    const discountsApplied = completed.reduce((sum, t) => sum + (t.discount || 0), 0);
    const refundsProcessed = refunds.reduce((sum, t) => sum + (t.total || 0), 0);
    const voidsProcessed = voids.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalRevenue = completed.reduce((sum, t) => sum + (t.total || 0), 0);

    // Payment breakdown
    const paymentMap = new Map<string, { amount: number; count: number }>();
    for (const t of completed) {
      const method = t.paymentMethod || 'other';
      const existing = paymentMap.get(method) || { amount: 0, count: 0 };
      paymentMap.set(method, {
        amount: existing.amount + (t.total || 0),
        count: existing.count + 1,
      });
    }

    const paymentBreakdown = Array.from(paymentMap.entries()).map(
      ([method, data]) => ({
        method: method as any,
        label: method.charAt(0).toUpperCase() + method.slice(1),
        amount: data.amount,
        count: data.count,
      })
    );

    return {
      date: today,
      totalRevenue,
      totalTransactions: completed.length,
      subtotal,
      taxCollected,
      tipsCollected,
      discountsApplied,
      refundsProcessed,
      voidsProcessed,
      netRevenue: totalRevenue - refundsProcessed,
      paymentBreakdown,
      averageTicket: completed.length > 0 ? totalRevenue / completed.length : 0,
    } as SalesSummary;
  }
);

/**
 * Complete closeout and generate report
 */
export const completeCloseout = createAsyncThunk(
  'closeout/complete',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const closeout = state.closeout;
    const auth = state.auth;

    if (!closeout.salesSummary || !closeout.cashReconciliation) {
      throw new Error('Missing required closeout data');
    }

    const report: CloseoutReport = {
      id: crypto.randomUUID(),
      storeId: auth.store?.storeId || '',
      closedAt: new Date(),
      closedBy: {
        id: auth.member?.memberId || 'unknown',
        name: auth.member?.memberName || 'Unknown',
      },
      salesSummary: closeout.salesSummary,
      cashReconciliation: closeout.cashReconciliation,
      tipDistribution: closeout.tipDistribution || {
        totalTips: closeout.salesSummary.tipsCollected,
        method: 'equal',
        allocations: [],
        isValid: true,
      },
      syncStatus: {
        itemsSynced: closeout.syncProgress?.completed || 0,
        syncCompleted: closeout.syncProgress?.failed === 0,
      },
    };

    // TODO: Save report to Supabase
    // await dataService.closeoutReports.create(report);

    return report;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const closeoutSlice = createSlice({
  name: 'closeout',
  initialState,
  reducers: {
    // Start new closeout session
    startCloseout: (state) => {
      state.isActive = true;
      state.currentStep = 'pre_check';
      state.status = 'in_progress';
      state.preCheck = null;
      state.salesSummary = null;
      state.cashReconciliation = null;
      state.tipDistribution = null;
      state.syncProgress = null;
      state.report = null;
      state.error = null;
    },

    // Cancel closeout
    cancelCloseout: (state) => {
      state.isActive = false;
      state.status = 'cancelled';
    },

    // Navigate to step
    setStep: (state, action: PayloadAction<CloseoutStep>) => {
      state.currentStep = action.payload;
    },

    // Set cash reconciliation
    setCashReconciliation: (state, action: PayloadAction<CashReconciliation>) => {
      state.cashReconciliation = action.payload;
    },

    // Set tip distribution
    setTipDistribution: (state, action: PayloadAction<TipDistributionState>) => {
      state.tipDistribution = action.payload;
    },

    // Update sync progress
    setSyncProgress: (state, action: PayloadAction<SyncProgress>) => {
      state.syncProgress = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetCloseout: () => initialState,
  },
  extraReducers: (builder) => {
    // Pre-check
    builder
      .addCase(runPreCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(runPreCheck.fulfilled, (state, action) => {
        state.loading = false;
        state.preCheck = action.payload;
      })
      .addCase(runPreCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Pre-check failed';
      });

    // Sales summary
    builder
      .addCase(fetchSalesSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.salesSummary = action.payload;
      })
      .addCase(fetchSalesSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales summary';
      });

    // Complete closeout
    builder
      .addCase(completeCloseout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeCloseout.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'completed';
        state.report = action.payload;
        state.history.unshift(action.payload);
        state.isActive = false;
      })
      .addCase(completeCloseout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to complete closeout';
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  startCloseout,
  cancelCloseout,
  setStep,
  setCashReconciliation,
  setTipDistribution,
  setSyncProgress,
  clearError,
  resetCloseout,
} = closeoutSlice.actions;

// Selectors
export const selectCloseoutIsActive = (state: RootState) => state.closeout.isActive;
export const selectCloseoutStep = (state: RootState) => state.closeout.currentStep;
export const selectCloseoutStatus = (state: RootState) => state.closeout.status;
export const selectPreCheck = (state: RootState) => state.closeout.preCheck;
export const selectSalesSummary = (state: RootState) => state.closeout.salesSummary;
export const selectCashReconciliation = (state: RootState) => state.closeout.cashReconciliation;
export const selectTipDistribution = (state: RootState) => state.closeout.tipDistribution;
export const selectSyncProgress = (state: RootState) => state.closeout.syncProgress;
export const selectCloseoutReport = (state: RootState) => state.closeout.report;
export const selectCloseoutLoading = (state: RootState) => state.closeout.loading;
export const selectCloseoutError = (state: RootState) => state.closeout.error;

export default closeoutSlice.reducer;
```

**Checklist:**
- [ ] All actions defined
- [ ] All thunks implemented
- [ ] Selectors exported
- [ ] No TypeScript errors

---

### Phase 1.5: Register Slice in Store

**File:** `src/store/index.ts` (modify)

```typescript
// Add import
import closeoutReducer from './slices/closeoutSlice';

// Add to configureStore reducers
export const store = configureStore({
  reducer: {
    // ... existing reducers
    closeout: closeoutReducer,
  },
});
```

**Checklist:**
- [ ] Slice imported
- [ ] Added to store configuration
- [ ] No runtime errors

---

## Phase 2: End of Day Closeout - Wizard Steps

**Duration:** 2 days
**Tasks:** 8
**Dependencies:** Phase 1

### Phase 2.1: Wizard Hook

**File:** `src/components/closeout/hooks/useCloseoutWizard.ts`

```typescript
/**
 * Closeout Wizard Hook
 * Manages wizard state and step navigation
 */

import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store';
import type { CloseoutStep, CashReconciliation, TipDistributionState } from '../types';
import { CLOSEOUT_STEPS } from '../constants';
import {
  startCloseout,
  cancelCloseout,
  setStep,
  setCashReconciliation,
  setTipDistribution,
  runPreCheck,
  fetchSalesSummary,
  completeCloseout,
  selectCloseoutIsActive,
  selectCloseoutStep,
  selectPreCheck,
  selectSalesSummary,
  selectCashReconciliation as selectCashRecon,
  selectTipDistribution as selectTipDist,
  selectSyncProgress,
  selectCloseoutLoading,
  selectCloseoutError,
  selectCloseoutReport,
} from '../../../store/slices/closeoutSlice';

export function useCloseoutWizard() {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const isActive = useSelector(selectCloseoutIsActive);
  const currentStep = useSelector(selectCloseoutStep);
  const preCheck = useSelector(selectPreCheck);
  const salesSummary = useSelector(selectSalesSummary);
  const cashReconciliation = useSelector(selectCashRecon);
  const tipDistribution = useSelector(selectTipDist);
  const syncProgress = useSelector(selectSyncProgress);
  const loading = useSelector(selectCloseoutLoading);
  const error = useSelector(selectCloseoutError);
  const report = useSelector(selectCloseoutReport);

  // Step index
  const currentStepIndex = useMemo(
    () => CLOSEOUT_STEPS.findIndex((s) => s.id === currentStep),
    [currentStep]
  );

  // Navigation helpers
  const canGoBack = currentStepIndex > 0;
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 'pre_check':
        return preCheck?.canProceed ?? false;
      case 'sales_summary':
        return salesSummary !== null;
      case 'cash_reconciliation':
        return cashReconciliation !== null;
      case 'tip_distribution':
        return tipDistribution?.isValid ?? false;
      case 'final_sync':
        return syncProgress?.failed === 0;
      case 'confirmation':
        return false; // Last step
      default:
        return false;
    }
  }, [currentStep, preCheck, salesSummary, cashReconciliation, tipDistribution, syncProgress]);

  const isComplete = currentStep === 'confirmation' && report !== null;

  // Actions
  const start = useCallback(() => {
    dispatch(startCloseout());
  }, [dispatch]);

  const cancel = useCallback(() => {
    dispatch(cancelCloseout());
  }, [dispatch]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < CLOSEOUT_STEPS.length - 1) {
      const next = CLOSEOUT_STEPS[currentStepIndex + 1].id;
      dispatch(setStep(next));

      // Auto-fetch data for next step
      if (next === 'sales_summary') {
        dispatch(fetchSalesSummary());
      }
    }
  }, [dispatch, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      dispatch(setStep(CLOSEOUT_STEPS[currentStepIndex - 1].id));
    }
  }, [dispatch, currentStepIndex]);

  const goToStep = useCallback(
    (step: CloseoutStep) => {
      const targetIndex = CLOSEOUT_STEPS.findIndex((s) => s.id === step);
      // Can only go back to completed steps
      if (targetIndex <= currentStepIndex) {
        dispatch(setStep(step));
      }
    },
    [dispatch, currentStepIndex]
  );

  const runCheck = useCallback(() => {
    return dispatch(runPreCheck()).unwrap();
  }, [dispatch]);

  const updateCashReconciliation = useCallback(
    (data: CashReconciliation) => {
      dispatch(setCashReconciliation(data));
    },
    [dispatch]
  );

  const updateTipDistribution = useCallback(
    (data: TipDistributionState) => {
      dispatch(setTipDistribution(data));
    },
    [dispatch]
  );

  const complete = useCallback(() => {
    return dispatch(completeCloseout()).unwrap();
  }, [dispatch]);

  return {
    // State
    isActive,
    currentStep,
    currentStepIndex,
    steps: CLOSEOUT_STEPS,

    // Navigation
    canGoBack,
    canGoNext,
    isComplete,

    // Data
    preCheck,
    salesSummary,
    cashReconciliation,
    tipDistribution,
    syncProgress,
    report,

    // Status
    loading,
    error,

    // Actions
    start,
    cancel,
    nextStep,
    prevStep,
    goToStep,
    runCheck,
    updateCashReconciliation,
    updateTipDistribution,
    complete,
  };
}
```

**Checklist:**
- [ ] All state exposed
- [ ] Navigation logic correct
- [ ] Actions dispatch properly

---

### Phase 2.2: Pre-Check Step Component

**File:** `src/components/closeout/steps/PreCheckStep.tsx`

```typescript
/**
 * Pre-Check Step
 * Validates system is ready for closeout
 */

import { useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { PreCheckResult } from '../types';
import { cn } from '../../../lib/utils';

interface PreCheckStepProps {
  result: PreCheckResult | null;
  loading: boolean;
  onRunCheck: () => Promise<void>;
  onNext: () => void;
  onForceOverride?: () => void;
}

export function PreCheckStep({
  result,
  loading,
  onRunCheck,
  onNext,
  onForceOverride,
}: PreCheckStepProps) {
  // Run check on mount
  useEffect(() => {
    if (!result && !loading) {
      onRunCheck();
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">System Pre-Check</h2>
        <p className="text-gray-600 mt-1">
          Verifying the system is ready for end-of-day closeout.
        </p>
      </div>

      {/* Loading State */}
      {loading && !result && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-600">Running checks...</span>
        </div>
      )}

      {/* Check Results */}
      {result && (
        <div className="space-y-3">
          {result.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border',
                getStatusBg(item.status)
              )}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  {item.message && (
                    <p className="text-sm text-gray-600">{item.message}</p>
                  )}
                </div>
              </div>
              {item.status === 'fail' && item.canForce && onForceOverride && (
                <button
                  onClick={onForceOverride}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Force Continue
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {result && (
        <div
          className={cn(
            'p-4 rounded-lg',
            result.passed
              ? 'bg-green-50 text-green-800'
              : result.canProceed
              ? 'bg-yellow-50 text-yellow-800'
              : 'bg-red-50 text-red-800'
          )}
        >
          {result.passed ? (
            <p>✓ All checks passed. You can proceed with closeout.</p>
          ) : result.canProceed ? (
            <p>⚠ Some warnings detected. You can proceed with caution.</p>
          ) : (
            <p>✗ Please resolve the issues above before continuing.</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={() => onRunCheck()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Re-check
        </button>

        <button
          onClick={onNext}
          disabled={!result?.canProceed || loading}
          className={cn(
            'px-6 py-2 rounded-lg font-medium',
            result?.canProceed
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] Auto-runs check on mount
- [ ] Shows all check items
- [ ] Force override option
- [ ] Proper button states

---

### Phase 2.3-2.7: Remaining Step Components

Due to length, I'll provide the file structure and key implementation notes:

**Files to create:**

| File | Key Features |
|------|--------------|
| `steps/SalesSummaryStep.tsx` | Display-only summary cards, payment breakdown, transaction count |
| `steps/CashReconciliationStep.tsx` | Cash input (total or denominations), variance calc, PIN modal for approval |
| `steps/TipDistributionStep.tsx` | Method selector, staff list, percentage inputs, validation |
| `steps/FinalSyncStep.tsx` | Progress bar, retry button, status messages |
| `steps/ConfirmationStep.tsx` | Summary accordion, checkbox confirmation, print/email buttons |

---

### Phase 2.8: Supporting Components

**Files to create:**

| File | Purpose |
|------|---------|
| `components/CloseoutProgress.tsx` | Step progress indicator (horizontal stepper) |
| `components/VarianceAlert.tsx` | Color-coded variance display |
| `components/PrintSummary.tsx` | Print-friendly report layout |
| `components/PINModal.tsx` | Manager PIN entry modal |

---

## Phase 3: End of Day Closeout - Integration

**Duration:** 0.5 day
**Tasks:** 3
**Dependencies:** Phase 1, Phase 2

### Phase 3.1: Main Container

**File:** `src/components/closeout/EndOfDayCloseout.tsx`

```typescript
/**
 * End of Day Closeout
 * Main wizard container component
 */

import { useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useCloseoutWizard } from './hooks/useCloseoutWizard';
import { CloseoutProgress } from './components/CloseoutProgress';
import { PreCheckStep } from './steps/PreCheckStep';
import { SalesSummaryStep } from './steps/SalesSummaryStep';
import { CashReconciliationStep } from './steps/CashReconciliationStep';
import { TipDistributionStep } from './steps/TipDistributionStep';
import { FinalSyncStep } from './steps/FinalSyncStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useState } from 'react';

interface EndOfDayCloseoutProps {
  onBack?: () => void;
}

export function EndOfDayCloseout({ onBack }: EndOfDayCloseoutProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const wizard = useCloseoutWizard();

  // Start wizard on mount
  useEffect(() => {
    if (!wizard.isActive) {
      wizard.start();
    }
  }, []);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    wizard.cancel();
    setShowCancelConfirm(false);
    onBack?.();
  };

  const renderStep = () => {
    switch (wizard.currentStep) {
      case 'pre_check':
        return (
          <PreCheckStep
            result={wizard.preCheck}
            loading={wizard.loading}
            onRunCheck={wizard.runCheck}
            onNext={wizard.nextStep}
          />
        );
      case 'sales_summary':
        return (
          <SalesSummaryStep
            summary={wizard.salesSummary}
            loading={wizard.loading}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
          />
        );
      case 'cash_reconciliation':
        return (
          <CashReconciliationStep
            expectedCash={
              wizard.salesSummary?.paymentBreakdown.find(
                (p) => p.method === 'cash'
              )?.amount || 0
            }
            onSubmit={(data) => {
              wizard.updateCashReconciliation(data);
              wizard.nextStep();
            }}
            onBack={wizard.prevStep}
          />
        );
      case 'tip_distribution':
        return (
          <TipDistributionStep
            totalTips={wizard.salesSummary?.tipsCollected || 0}
            onSubmit={(data) => {
              wizard.updateTipDistribution(data);
              wizard.nextStep();
            }}
            onBack={wizard.prevStep}
          />
        );
      case 'final_sync':
        return (
          <FinalSyncStep
            progress={wizard.syncProgress}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationStep
            salesSummary={wizard.salesSummary}
            cashReconciliation={wizard.cashReconciliation}
            tipDistribution={wizard.tipDistribution}
            onConfirm={async () => {
              await wizard.complete();
              onBack?.();
            }}
            onBack={wizard.prevStep}
            loading={wizard.loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                End of Day Close Out
              </h1>
              <p className="text-sm text-gray-500">
                Complete daily reconciliation
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <CloseoutProgress
            steps={wizard.steps}
            currentStep={wizard.currentStep}
            onStepClick={wizard.goToStep}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">{renderStep()}</div>
      </div>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancel}
        title="Cancel Closeout?"
        message="Are you sure you want to cancel? All progress will be lost."
        confirmText="Yes, Cancel"
        variant="danger"
      />
    </div>
  );
}
```

---

### Phase 3.2: Index Export

**File:** `src/components/closeout/index.ts`

```typescript
export { EndOfDayCloseout } from './EndOfDayCloseout';
export { useCloseoutWizard } from './hooks/useCloseoutWizard';
export type * from './types';
```

---

### Phase 3.3: Route Handler

**File:** `src/components/layout/AppShell.tsx` (modify)

```typescript
// Add import at top
import { EndOfDayCloseout } from '../closeout';

// Add case in renderModule() switch statement (around line 290)
case 'closeout':
  return <EndOfDayCloseout onBack={() => setActiveModule('more')} />;
```

---

## Phase 4: Account Settings Module

**Duration:** 1 day
**Tasks:** 6
**Dependencies:** None

### Phase 4.1: Directory & Types

```bash
mkdir -p src/components/account/sections
```

**File:** `src/components/account/types.ts`

```typescript
export type AccountSection = 'store' | 'subscription' | 'billing' | 'security';

export interface StoreInfo {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  logo?: string;
}

export interface SubscriptionInfo {
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'expired' | 'suspended';
  expiresAt: Date;
  deviceLimit: number;
  deviceUsed: number;
  locationLimit: number;
  locationUsed: number;
}

export interface AccountSettingsProps {
  onBack?: () => void;
}
```

### Phase 4.2-4.5: Section Components

Create files:
- `sections/StoreInfoSection.tsx`
- `sections/SubscriptionSection.tsx`
- `sections/BillingSection.tsx`
- `sections/SecuritySection.tsx`

### Phase 4.6: Main Container & Route

**File:** `src/components/account/AccountSettings.tsx`

Similar pattern to RoleSettings - tabbed interface with sections.

**Route:** Add to AppShell.tsx:
```typescript
case 'account':
  return <AccountSettings onBack={() => setActiveModule('more')} />;
```

---

## Phase 5: Admin Back Office Module

**Duration:** 1 day
**Tasks:** 6
**Dependencies:** None

### Phase 5.1: Directory & Types

```bash
mkdir -p src/components/admin-backoffice/sections
```

### Phase 5.2-5.5: Section Components

Create files:
- `sections/GeneralSettingsSection.tsx` - Business hours, holidays
- `sections/TaxSettingsSection.tsx` - Tax rates
- `sections/PaymentSettingsSection.tsx` - Payment methods, tips
- `sections/ReceiptSettingsSection.tsx` - Receipt customization
- `sections/NotificationSettingsSection.tsx` - Reminders, marketing

### Phase 5.6: Main Container & Route

**File:** `src/components/admin-backoffice/AdminBackOffice.tsx`

**Route:** Add to AppShell.tsx:
```typescript
case 'admin':
  return <AdminBackOffice onBack={() => setActiveModule('more')} />;
```

---

## Phase 6: Quick Stats Implementation

**Duration:** 0.5 day
**Tasks:** 3
**Dependencies:** None

### Phase 6.1: Dashboard Selectors

**File:** `src/store/selectors/dashboardSelectors.ts`

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

/**
 * Select today's revenue from completed transactions
 */
export const selectTodayRevenue = createSelector(
  [(state: RootState) => state.transactions?.items || []],
  (transactions) => {
    const today = new Date().toDateString();
    return transactions
      .filter((t) => new Date(t.createdAt).toDateString() === today)
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.total || 0), 0);
  }
);

/**
 * Select unique client count from today's tickets
 */
export const selectTodayClientCount = createSelector(
  [(state: RootState) => state.uiTickets?.items || []],
  (tickets) => {
    const today = new Date().toDateString();
    const todayTickets = tickets.filter(
      (t) => new Date(t.createdAt).toDateString() === today
    );
    return new Set(todayTickets.map((t) => t.clientId).filter(Boolean)).size;
  }
);

/**
 * Select active staff count
 */
export const selectActiveStaffCount = createSelector(
  [(state: RootState) => state.uiStaff?.staff || []],
  (staff) => staff.filter((s) => s.isActive && s.status !== 'off').length
);
```

### Phase 6.2: Update More Component

**File:** `src/components/modules/More.tsx` (modify)

Add imports and update Quick Stats section with real data.

### Phase 6.3: Load Transactions on Init

**File:** `src/components/layout/AppShell.tsx` (modify)

Add to `initApp()`:
```typescript
// Load today's transactions
await dispatch(fetchTransactionsByDateFromSupabase(new Date()));
console.log('✅ Today\'s transactions loaded');
```

---

## Phase 7: UX Improvements

**Duration:** 0.5 day
**Tasks:** 4
**Dependencies:** None

### Phase 7.1: Logout Confirmation

Update `More.tsx` to use `ConfirmDialog` instead of native `confirm()`.

### Phase 7.2: Environment-Based Menu

Filter DEV items using `import.meta.env.DEV`.

### Phase 7.3: Permission Hook

**File:** `src/hooks/usePermissions.ts`

```typescript
import { useSelector } from 'react-redux';
import { selectMember } from '../store/slices/authSlice';

export function usePermissions() {
  const member = useSelector(selectMember);
  const role = member?.role || 'staff';

  return {
    isOwner: role === 'owner',
    isManager: role === 'manager' || role === 'owner',
    hasPermission: (permission: string) => {
      // Check member.permissions or role-based defaults
      return member?.permissions?.[permission] ?? false;
    },
    canAccessCloseout: role === 'owner' || role === 'manager',
    canAccessAdmin: role === 'owner' || role === 'manager',
    canAccessAccount: role === 'owner',
  };
}
```

### Phase 7.4: Permission-Based Menu Items

Update `More.tsx` to gray out or hide items based on permissions.

---

## Phase 8: Testing & Polish

**Duration:** 1 day
**Tasks:** 5
**Dependencies:** All previous phases

### Phase 8.1: Unit Tests

Create test files:
- `src/components/closeout/__tests__/useCloseoutWizard.test.ts`
- `src/store/slices/__tests__/closeoutSlice.test.ts`
- `src/store/selectors/__tests__/dashboardSelectors.test.ts`

### Phase 8.2: Integration Tests

Test full wizard flow with mock data.

### Phase 8.3: Error Boundaries

Wrap modules in `ErrorBoundary` components.

### Phase 8.4: Loading States

Add skeleton loaders for async data.

### Phase 8.5: Documentation

Update `MORE_MODULE_ANALYSIS.md` with implementation status.

---

## Implementation Checklist

### Phase 1 ✓
- [ ] 1.1 Directory structure
- [ ] 1.2 Type definitions
- [ ] 1.3 Constants
- [ ] 1.4 Redux slice
- [ ] 1.5 Store registration

### Phase 2 ✓
- [ ] 2.1 Wizard hook
- [ ] 2.2 PreCheckStep
- [ ] 2.3 SalesSummaryStep
- [ ] 2.4 CashReconciliationStep
- [ ] 2.5 TipDistributionStep
- [ ] 2.6 FinalSyncStep
- [ ] 2.7 ConfirmationStep
- [ ] 2.8 Supporting components

### Phase 3 ✓
- [ ] 3.1 Main container
- [ ] 3.2 Index export
- [ ] 3.3 Route handler

### Phase 4 ✓
- [ ] 4.1 Types
- [ ] 4.2 StoreInfoSection
- [ ] 4.3 SubscriptionSection
- [ ] 4.4 BillingSection
- [ ] 4.5 SecuritySection
- [ ] 4.6 Main container & route

### Phase 5 ✓
- [ ] 5.1 Types
- [ ] 5.2 GeneralSettingsSection
- [ ] 5.3 TaxSettingsSection
- [ ] 5.4 PaymentSettingsSection
- [ ] 5.5 ReceiptSettingsSection
- [ ] 5.6 Main container & route

### Phase 6 ✓
- [ ] 6.1 Dashboard selectors
- [ ] 6.2 More component update
- [ ] 6.3 Transaction loading

### Phase 7 ✓
- [ ] 7.1 Logout confirmation
- [ ] 7.2 Environment filtering
- [ ] 7.3 Permission hook
- [ ] 7.4 Permission-based menu

### Phase 8 ✓
- [ ] 8.1 Unit tests
- [ ] 8.2 Integration tests
- [ ] 8.3 Error boundaries
- [ ] 8.4 Loading states
- [ ] 8.5 Documentation

---

## Quick Start Commands

```bash
# Phase 1: Create directories
mkdir -p src/components/closeout/{steps,components,hooks}
mkdir -p src/components/account/sections
mkdir -p src/components/admin-backoffice/sections
mkdir -p src/store/selectors

# After each phase, verify
npm run lint
npm run typecheck
npm run test
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| All routes functional | 3/3 (account, closeout, admin) |
| Quick stats accuracy | Real-time data |
| Test coverage | >80% for new code |
| Zero TypeScript errors | Yes |
| Zero console errors | Yes |
| All PRD requirements met | Yes |
