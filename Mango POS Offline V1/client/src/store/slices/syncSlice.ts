import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncAt: Date | null;
  error: string | null;
}

const initialState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncAt: null,
  error: null,
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
  },
});

export const { setOnlineStatus, setSyncing, setPendingOperations, setSyncComplete, setSyncError } = syncSlice.actions;
export const selectIsOnline = (state: RootState) => state.sync.isOnline;
export const selectIsSyncing = (state: RootState) => state.sync.isSyncing;
export const selectPendingOperations = (state: RootState) => state.sync.pendingOperations;
export const selectLastSyncAt = (state: RootState) => state.sync.lastSyncAt;

export default syncSlice.reducer;
