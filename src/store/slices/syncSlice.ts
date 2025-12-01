import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncAt: Date | null;
  error: string | null;
  /** Whether sync is enabled (only true for offline-enabled devices) */
  syncEnabled: boolean;
  /** Reason sync is disabled */
  syncDisabledReason: string | null;
}

const initialState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncAt: null,
  error: null,
  syncEnabled: false, // Default to false, enabled when offline mode is active
  syncDisabledReason: 'Device not registered for offline mode',
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setPendingOperations: (state, action: PayloadAction<number>) => {
      state.pendingOperations = action.payload;
    },
    setSyncComplete: (state) => {
      state.isSyncing = false;
      state.lastSyncAt = new Date();
      state.error = null;
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.isSyncing = false;
      state.error = action.payload;
    },
    /** Enable sync (called when device is registered with offline-enabled mode) */
    enableSync: (state) => {
      state.syncEnabled = true;
      state.syncDisabledReason = null;
    },
    /** Disable sync (called when switching to online-only or on revocation) */
    disableSync: (state, action: PayloadAction<string | undefined>) => {
      state.syncEnabled = false;
      state.syncDisabledReason = action.payload || 'Sync disabled';
      state.isSyncing = false;
    },
    /** Reset sync state (on logout) */
    resetSyncState: (state) => {
      state.isSyncing = false;
      state.pendingOperations = 0;
      state.lastSyncAt = null;
      state.error = null;
      state.syncEnabled = false;
      state.syncDisabledReason = 'Device not registered for offline mode';
    },
  },
});

export const {
  setOnlineStatus,
  setSyncing,
  setPendingOperations,
  setSyncComplete,
  setSyncError,
  enableSync,
  disableSync,
  resetSyncState,
} = syncSlice.actions;

// Selectors
export const selectIsOnline = (state: RootState) => state.sync.isOnline;
export const selectIsSyncing = (state: RootState) => state.sync.isSyncing;
export const selectPendingOperations = (state: RootState) => state.sync.pendingOperations;
export const selectLastSyncAt = (state: RootState) => state.sync.lastSyncAt;
export const selectSyncError = (state: RootState) => state.sync.error;
export const selectSyncEnabled = (state: RootState) => state.sync.syncEnabled;
export const selectSyncDisabledReason = (state: RootState) => state.sync.syncDisabledReason;

/** Check if sync should run (enabled + online) */
export const selectShouldSync = (state: RootState) =>
  state.sync.syncEnabled && state.sync.isOnline && !state.sync.isSyncing;

export default syncSlice.reducer;
