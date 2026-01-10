/**
 * UI Slice
 * Manages UI state like modals, errors, and loading indicators
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isNumericKeypadOpen: boolean;
  isSettingsOpen: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  showReconnecting: boolean;
  paymentTimeoutReached: boolean;
}

const initialState: UiState = {
  isNumericKeypadOpen: false,
  isSettingsOpen: false,
  errorMessage: null,
  successMessage: null,
  showReconnecting: false,
  paymentTimeoutReached: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openNumericKeypad: (state) => {
      state.isNumericKeypadOpen = true;
    },
    closeNumericKeypad: (state) => {
      state.isNumericKeypadOpen = false;
    },
    openSettings: (state) => {
      state.isSettingsOpen = true;
    },
    closeSettings: (state) => {
      state.isSettingsOpen = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    },
    setSuccess: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    clearMessages: (state) => {
      state.errorMessage = null;
      state.successMessage = null;
    },
    setShowReconnecting: (state, action: PayloadAction<boolean>) => {
      state.showReconnecting = action.payload;
    },
    setPaymentTimeoutReached: (state, action: PayloadAction<boolean>) => {
      state.paymentTimeoutReached = action.payload;
    },
    resetUi: (state) => {
      state.isNumericKeypadOpen = false;
      state.errorMessage = null;
      state.successMessage = null;
      state.paymentTimeoutReached = false;
    },
  },
});

export const {
  openNumericKeypad,
  closeNumericKeypad,
  openSettings,
  closeSettings,
  setError,
  setSuccess,
  clearMessages,
  setShowReconnecting,
  setPaymentTimeoutReached,
  resetUi,
} = uiSlice.actions;

export default uiSlice.reducer;
