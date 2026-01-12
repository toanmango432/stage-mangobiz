import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CheckInStep, UIState } from '../../types';

const initialState: UIState = {
  currentStep: 'welcome',
  isLoading: false,
  error: null,
  isOffline: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<CheckInStep>) => {
      state.currentStep = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setOffline: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    resetUI: (state) => {
      state.currentStep = 'welcome';
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setCurrentStep, setLoading, setError, setOffline, resetUI } = uiSlice.actions;
export default uiSlice.reducer;
