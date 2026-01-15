/**
 * Pad Transaction Redux Slice
 * Tracks the state of transactions sent to Mango Pad for real-time status display.
 *
 * Part of: Mango Pad Integration (US-007)
 * Updated: Phase 1 Integration - Added real-time screen sync
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { PadScreen } from '@/services/mqtt/types';

/**
 * Status of a transaction on the Mango Pad
 */
export type PadTransactionStatus =
  | 'idle'           // No active transaction
  | 'waiting'        // Sent to Pad, waiting for customer
  | 'tip_selected'   // Customer selected tip
  | 'signature'      // Signature captured
  | 'receipt'        // Receipt preference selected
  | 'processing'     // Payment processing
  | 'complete'       // Payment successful
  | 'failed'         // Payment failed
  | 'cancelled';     // Transaction cancelled

export interface ActivePadTransaction {
  transactionId: string;
  ticketId: string;
  status: PadTransactionStatus;
  // NEW: Real-time screen sync
  currentPadScreen: PadScreen;
  previousPadScreen?: PadScreen;
  customerStarted: boolean;   // Has customer begun interacting?
  screenChangedAt?: string;   // When last screen change occurred
  // Existing fields
  tipAmount?: number;
  tipPercent?: number | null;
  signatureCaptured: boolean;
  receiptPreference?: 'email' | 'sms' | 'print' | 'none';
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface PadTransactionState {
  activeTransaction: ActivePadTransaction | null;
}

const initialState: PadTransactionState = {
  activeTransaction: null,
};

const padTransactionSlice = createSlice({
  name: 'padTransaction',
  initialState,
  reducers: {
    /**
     * Start a new Pad transaction when sent to Pad
     */
    startPadTransaction: (
      state,
      action: PayloadAction<{ transactionId: string; ticketId: string }>
    ) => {
      state.activeTransaction = {
        transactionId: action.payload.transactionId,
        ticketId: action.payload.ticketId,
        status: 'waiting',
        // NEW: Initialize screen sync state
        currentPadScreen: 'waiting',
        customerStarted: false,
        signatureCaptured: false,
        startedAt: new Date().toISOString(),
      };
    },

    /**
     * NEW: Update Pad screen from screen_changed message
     * Also updates status based on screen for progress tracking
     */
    setPadScreenChanged: (
      state,
      action: PayloadAction<{
        transactionId: string;
        screen: PadScreen;
        previousScreen: PadScreen;
        changedAt: string;
      }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.currentPadScreen = action.payload.screen;
        state.activeTransaction.previousPadScreen = action.payload.previousScreen;
        state.activeTransaction.screenChangedAt = action.payload.changedAt;

        // Map screen to status for progress tracking
        const screenToStatus: Record<PadScreen, PadTransactionStatus | null> = {
          'idle': null,
          'waiting': 'waiting',
          'order-review': 'waiting',
          'tip': 'tip_selected',
          'signature': 'signature',
          'receipt': 'receipt',
          'payment': 'processing',
          'result': null, // Let payment_result handler set this
          'thank-you': 'complete',
          'split-selection': 'tip_selected',
          'split-status': 'processing',
          'settings': null,
        };

        const newStatus = screenToStatus[action.payload.screen];
        if (newStatus && state.activeTransaction.status !== newStatus) {
          // Only advance status, never go backwards (except for special cases)
          const statusOrder: PadTransactionStatus[] = [
            'idle', 'waiting', 'tip_selected', 'signature', 'receipt', 'processing', 'complete'
          ];
          const currentIndex = statusOrder.indexOf(state.activeTransaction.status);
          const newIndex = statusOrder.indexOf(newStatus);
          if (newIndex > currentIndex) {
            state.activeTransaction.status = newStatus;
          }
        }
      }
    },

    /**
     * NEW: Mark that customer has started interacting
     */
    setCustomerStarted: (
      state,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.customerStarted = true;
      }
    },

    /**
     * Update when tip is selected on Pad
     */
    setTipSelected: (
      state,
      action: PayloadAction<{
        transactionId: string;
        tipAmount: number;
        tipPercent: number | null;
      }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'tip_selected';
        state.activeTransaction.tipAmount = action.payload.tipAmount;
        state.activeTransaction.tipPercent = action.payload.tipPercent;
      }
    },

    /**
     * Update when signature is captured on Pad
     */
    setSignatureCaptured: (
      state,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'signature';
        state.activeTransaction.signatureCaptured = true;
      }
    },

    /**
     * Update when receipt preference is selected on Pad
     */
    setReceiptPreference: (
      state,
      action: PayloadAction<{
        transactionId: string;
        preference: 'email' | 'sms' | 'print' | 'none';
      }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'receipt';
        state.activeTransaction.receiptPreference = action.payload.preference;
      }
    },

    /**
     * Set transaction to processing (during payment)
     */
    setProcessing: (
      state,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'processing';
      }
    },

    /**
     * Set transaction as complete
     */
    setTransactionComplete: (
      state,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'complete';
        state.activeTransaction.completedAt = new Date().toISOString();
      }
    },

    /**
     * Set transaction as failed
     */
    setTransactionFailed: (
      state,
      action: PayloadAction<{
        transactionId: string;
        errorMessage: string;
      }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'failed';
        state.activeTransaction.errorMessage = action.payload.errorMessage;
      }
    },

    /**
     * Set transaction as cancelled
     */
    setTransactionCancelled: (
      state,
      action: PayloadAction<{ transactionId: string }>
    ) => {
      if (
        state.activeTransaction &&
        state.activeTransaction.transactionId === action.payload.transactionId
      ) {
        state.activeTransaction.status = 'cancelled';
      }
    },

    /**
     * Clear the active transaction
     */
    clearPadTransaction: (state) => {
      state.activeTransaction = null;
    },
  },
});

export const {
  startPadTransaction,
  setPadScreenChanged,
  setCustomerStarted,
  setTipSelected,
  setSignatureCaptured,
  setReceiptPreference,
  setProcessing,
  setTransactionComplete,
  setTransactionFailed,
  setTransactionCancelled,
  clearPadTransaction,
} = padTransactionSlice.actions;

// Selectors
export const selectActivePadTransaction = (state: RootState) =>
  state.padTransaction.activeTransaction;

export const selectPadTransactionStatus = (state: RootState) =>
  state.padTransaction.activeTransaction?.status ?? 'idle';

export const selectHasActivePadTransaction = (state: RootState) =>
  state.padTransaction.activeTransaction !== null;

export const selectPadTransactionByTicketId = (ticketId: string) => (state: RootState) =>
  state.padTransaction.activeTransaction?.ticketId === ticketId
    ? state.padTransaction.activeTransaction
    : null;

// NEW: Screen sync selectors
export const selectCurrentPadScreen = (state: RootState) =>
  state.padTransaction.activeTransaction?.currentPadScreen ?? 'waiting';

export const selectCustomerStarted = (state: RootState) =>
  state.padTransaction.activeTransaction?.customerStarted ?? false;

export const selectPadScreenInfo = (state: RootState) => {
  const tx = state.padTransaction.activeTransaction;
  if (!tx) return null;
  return {
    currentScreen: tx.currentPadScreen,
    previousScreen: tx.previousPadScreen,
    customerStarted: tx.customerStarted,
    screenChangedAt: tx.screenChangedAt,
  };
};

export default padTransactionSlice.reducer;
