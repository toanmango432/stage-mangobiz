/**
 * Pad Slice
 * Manages screen navigation and flow state
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PadScreen, MqttConnectionStatus } from '@/types';

interface PadState {
  currentScreen: PadScreen;
  previousScreen: PadScreen | null;
  mqttConnectionStatus: MqttConnectionStatus;
  isLoading: boolean;
}

const initialState: PadState = {
  currentScreen: 'idle',
  previousScreen: null,
  mqttConnectionStatus: 'disconnected',
  isLoading: false,
};

export const padSlice = createSlice({
  name: 'pad',
  initialState,
  reducers: {
    setScreen: (state, action: PayloadAction<PadScreen>) => {
      state.previousScreen = state.currentScreen;
      state.currentScreen = action.payload;
    },
    goBack: (state) => {
      if (state.previousScreen) {
        state.currentScreen = state.previousScreen;
        state.previousScreen = null;
      }
    },
    setMqttConnectionStatus: (state, action: PayloadAction<MqttConnectionStatus>) => {
      state.mqttConnectionStatus = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetToIdle: (state) => {
      state.currentScreen = 'idle';
      state.previousScreen = null;
      state.isLoading = false;
    },
  },
});

export const {
  setScreen,
  goBack,
  setMqttConnectionStatus,
  setLoading,
  resetToIdle,
} = padSlice.actions;

export default padSlice.reducer;
