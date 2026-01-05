/**
 * Checkout Redux Slice
 * Manages checkout-specific state separate from tickets slice.
 * Includes active checkout session, drafts, and payment flow state.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Ticket, Payment } from '../../types/Ticket';
import type { RootState } from '../index';
import { getDynamicTipConfig } from '../../constants/checkoutConfig';
import { ticketsDB } from '../../db/database';

// ===================
// TYPES
// ===================

/**
 * Summary of a draft sale for display in draft list.
 */
export interface DraftSale {
  ticketId: string;
  createdAt: string;            // ISO 8601
  lastSavedAt: string;          // ISO 8601
  expiresAt: string;            // ISO 8601
  staffId: string;
  staffName: string;
  clientName?: string;
  totalAmount: number;
  serviceCount: number;
}

/**
 * Current checkout step in the payment flow.
 */
export type CheckoutStep =
  | 'services'    // Adding/editing services
  | 'review'      // Reviewing ticket before payment
  | 'tip'         // Selecting tip amount
  | 'payment'     // Selecting payment method
  | 'processing'  // Processing payment
  | 'complete';   // Payment successful

/**
 * Active checkout session state.
 */
export interface ActiveCheckout {
  ticketId: string;
  step: CheckoutStep;
  tipAmount: number;
  tipPercent: number | null;
  selectedPaymentMethod: string | null;
  partialPayments: Payment[];
  remainingBalance: number;
  error: string | null;
}

/**
 * Session-level checkout configuration overrides.
 */
export interface SessionConfig {
  tipPercentages: number[];
  tipBasis: 'pre-tax' | 'post-tax';
}

/**
 * Main checkout state shape.
 */
export interface CheckoutState {
  // Active checkout session
  activeCheckout: ActiveCheckout | null;

  // Draft sales
  drafts: DraftSale[];
  draftsLoading: boolean;
  draftsError: string | null;

  // Auto-save state
  autoSaveEnabled: boolean;
  lastAutoSave: string | null;  // ISO 8601
  autoSavePending: boolean;

  // UI state
  isProcessingPayment: boolean;
  showReceiptOptions: boolean;

  // Configuration (can be overridden per session)
  sessionConfig: SessionConfig;
}

// ===================
// INITIAL STATE
// ===================

// Get initial tip config from system config
const tipConfig = getDynamicTipConfig();

const initialState: CheckoutState = {
  activeCheckout: null,
  drafts: [],
  draftsLoading: false,
  draftsError: null,
  autoSaveEnabled: true,
  lastAutoSave: null,
  autoSavePending: false,
  isProcessingPayment: false,
  showReceiptOptions: false,
  sessionConfig: {
    tipPercentages: [...tipConfig.defaultPercentages],
    tipBasis: tipConfig.calculationBasis,
  },
};

// ===================
// ASYNC THUNKS
// ===================

/**
 * Load drafts for a salon.
 * Returns DraftSale summaries for the draft list UI.
 */
export const loadDrafts = createAsyncThunk(
  'checkout/loadDrafts',
  async (salonId: string, { rejectWithValue }) => {
    try {
      // Clean up expired drafts first
      await ticketsDB.cleanupExpiredDrafts(salonId);

      // Load all drafts for the salon
      const tickets = await ticketsDB.getDrafts(salonId);

      // Convert to DraftSale summaries
      const drafts: DraftSale[] = tickets.map(ticket => ({
        ticketId: ticket.id,
        createdAt: ticket.createdAt,
        lastSavedAt: ticket.lastAutoSaveAt || ticket.createdAt,
        expiresAt: ticket.draftExpiresAt || '',
        staffId: ticket.services[0]?.staffId || '',
        staffName: ticket.services[0]?.staffName || 'Unknown',
        clientName: ticket.clientName !== 'Walk-in' ? ticket.clientName : undefined,
        totalAmount: ticket.total,
        serviceCount: ticket.services.length,
      }));

      // Sort by last saved (most recent first)
      drafts.sort((a, b) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime());

      return drafts;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load drafts');
    }
  }
);

/**
 * Save current checkout as draft (update existing or create new).
 */
export const saveDraft = createAsyncThunk(
  'checkout/saveDraft',
  async (
    { ticketId, updates, userId }: { ticketId: string; updates: Partial<Ticket>; userId: string },
    { rejectWithValue }
  ) => {
    try {
      const now = new Date().toISOString();
      const savedTicket = await ticketsDB.update(ticketId, {
        ...updates,
        isDraft: true,
        lastAutoSaveAt: now,
      }, userId);

      if (!savedTicket) {
        throw new Error('Draft not found');
      }

      return savedTicket;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save draft');
    }
  }
);

/**
 * Delete a draft sale.
 */
export const deleteDraft = createAsyncThunk(
  'checkout/deleteDraft',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      await ticketsDB.delete(ticketId);
      return ticketId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete draft');
    }
  }
);

/**
 * Resume a draft sale by loading it from IndexedDB.
 * Returns the full ticket for the checkout UI to restore.
 */
export const resumeDraft = createAsyncThunk(
  'checkout/resumeDraft',
  async (ticketId: string, { rejectWithValue }) => {
    try {
      const ticket = await ticketsDB.getById(ticketId);
      if (!ticket) {
        throw new Error('Draft not found');
      }
      if (!ticket.isDraft) {
        throw new Error('Ticket is not a draft');
      }
      return ticket;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to resume draft');
    }
  }
);

// ===================
// SLICE
// ===================

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    /**
     * Start a new checkout session.
     */
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

    /**
     * Update checkout step.
     */
    setCheckoutStep: (state, action: PayloadAction<CheckoutStep>) => {
      if (state.activeCheckout) {
        state.activeCheckout.step = action.payload;
      }
    },

    /**
     * Set tip amount and percentage.
     */
    setTip: (state, action: PayloadAction<{ amount: number; percent: number | null }>) => {
      if (state.activeCheckout) {
        state.activeCheckout.tipAmount = action.payload.amount;
        state.activeCheckout.tipPercent = action.payload.percent;
      }
    },

    /**
     * Select payment method for current payment.
     */
    selectPaymentMethod: (state, action: PayloadAction<string>) => {
      if (state.activeCheckout) {
        state.activeCheckout.selectedPaymentMethod = action.payload;
      }
    },

    /**
     * Add partial payment (for split payments).
     */
    addPartialPayment: (state, action: PayloadAction<Payment>) => {
      if (state.activeCheckout) {
        state.activeCheckout.partialPayments.push(action.payload);
        state.activeCheckout.remainingBalance -= action.payload.total;
        // Reset payment method for next payment
        state.activeCheckout.selectedPaymentMethod = null;
      }
    },

    /**
     * Update remaining balance directly.
     */
    updateRemainingBalance: (state, action: PayloadAction<number>) => {
      if (state.activeCheckout) {
        state.activeCheckout.remainingBalance = action.payload;
      }
    },

    /**
     * Set checkout error message.
     */
    setCheckoutError: (state, action: PayloadAction<string | null>) => {
      if (state.activeCheckout) {
        state.activeCheckout.error = action.payload;
      }
    },

    /**
     * Clear active checkout session.
     */
    clearCheckout: (state) => {
      state.activeCheckout = null;
      state.isProcessingPayment = false;
      state.showReceiptOptions = false;
    },

    /**
     * Set payment processing state.
     */
    setProcessingPayment: (state, action: PayloadAction<boolean>) => {
      state.isProcessingPayment = action.payload;
    },

    /**
     * Toggle receipt options display.
     */
    setShowReceiptOptions: (state, action: PayloadAction<boolean>) => {
      state.showReceiptOptions = action.payload;
    },

    /**
     * Set auto-save pending state.
     */
    setAutoSavePending: (state, action: PayloadAction<boolean>) => {
      state.autoSavePending = action.payload;
    },

    /**
     * Record successful auto-save.
     */
    setLastAutoSave: (state, action: PayloadAction<string>) => {
      state.lastAutoSave = action.payload;
      state.autoSavePending = false;
    },

    /**
     * Toggle auto-save functionality.
     */
    setAutoSaveEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoSaveEnabled = action.payload;
    },

    /**
     * Update session configuration.
     */
    updateSessionConfig: (state, action: PayloadAction<Partial<SessionConfig>>) => {
      state.sessionConfig = { ...state.sessionConfig, ...action.payload };
    },

    /**
     * Clear drafts error.
     */
    clearDraftsError: (state) => {
      state.draftsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load drafts
      .addCase(loadDrafts.pending, (state) => {
        state.draftsLoading = true;
        state.draftsError = null;
      })
      .addCase(loadDrafts.fulfilled, (state, action) => {
        state.draftsLoading = false;
        state.drafts = action.payload;
      })
      .addCase(loadDrafts.rejected, (state, action) => {
        state.draftsLoading = false;
        state.draftsError = action.payload as string;
      })
      // Save draft
      .addCase(saveDraft.fulfilled, (state) => {
        state.autoSavePending = false;
        state.lastAutoSave = new Date().toISOString();
      })
      .addCase(saveDraft.rejected, (state, action) => {
        state.autoSavePending = false;
        // Could set an error here if needed
        console.error('Failed to save draft:', action.payload);
      })
      // Delete draft
      .addCase(deleteDraft.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter(d => d.ticketId !== action.payload);
      })
      // Resume draft
      .addCase(resumeDraft.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeCheckout = {
            ticketId: action.payload.id,
            step: 'services',
            tipAmount: action.payload.tip || 0,
            tipPercent: null,
            selectedPaymentMethod: null,
            partialPayments: action.payload.payments || [],
            remainingBalance: action.payload.total -
              (action.payload.payments?.reduce((sum, p) => sum + p.total, 0) || 0),
            error: null,
          };
        }
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
  setAutoSaveEnabled,
  updateSessionConfig,
  clearDraftsError,
} = checkoutSlice.actions;

// ===================
// SELECTORS
// ===================

export const selectActiveCheckout = (state: RootState) => state.checkout.activeCheckout;
export const selectCheckoutStep = (state: RootState) => state.checkout.activeCheckout?.step;
export const selectDrafts = (state: RootState) => state.checkout.drafts;
export const selectDraftsLoading = (state: RootState) => state.checkout.draftsLoading;
export const selectDraftsError = (state: RootState) => state.checkout.draftsError;
export const selectIsProcessingPayment = (state: RootState) => state.checkout.isProcessingPayment;
export const selectRemainingBalance = (state: RootState) =>
  state.checkout.activeCheckout?.remainingBalance ?? 0;
export const selectPartialPayments = (state: RootState) =>
  state.checkout.activeCheckout?.partialPayments ?? [];
export const selectSessionConfig = (state: RootState) => state.checkout.sessionConfig;
export const selectAutoSaveEnabled = (state: RootState) => state.checkout.autoSaveEnabled;
export const selectLastAutoSave = (state: RootState) => state.checkout.lastAutoSave;
export const selectShowReceiptOptions = (state: RootState) => state.checkout.showReceiptOptions;

export default checkoutSlice.reducer;
