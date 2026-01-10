import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncQueueItem {
  id: string;
  type: 'checkin' | 'client' | 'update';
  payload: unknown;
  createdAt: string;
  attempts: number;
}

interface SyncSliceState {
  status: SyncState;
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  syncQueue: SyncQueueItem[];
  error: string | null;
}

const initialState: SyncSliceState = {
  status: 'idle',
  isOnline: navigator.onLine,
  lastSyncedAt: null,
  pendingCount: 0,
  syncQueue: [],
  error: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload && state.status === 'offline') {
        state.status = 'idle';
      } else if (!action.payload) {
        state.status = 'offline';
      }
    },
    setSyncStatus: (state, action: PayloadAction<SyncState>) => {
      state.status = action.payload;
    },
    setLastSyncedAt: (state, action: PayloadAction<string>) => {
      state.lastSyncedAt = action.payload;
    },
    addToSyncQueue: (state, action: PayloadAction<Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>>) => {
      state.syncQueue.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        attempts: 0,
        ...action.payload,
      });
      state.pendingCount = state.syncQueue.length;
    },
    removeFromSyncQueue: (state, action: PayloadAction<string>) => {
      state.syncQueue = state.syncQueue.filter((item) => item.id !== action.payload);
      state.pendingCount = state.syncQueue.length;
    },
    incrementAttempts: (state, action: PayloadAction<string>) => {
      const item = state.syncQueue.find((i) => i.id === action.payload);
      if (item) {
        item.attempts += 1;
      }
    },
    clearSyncQueue: (state) => {
      state.syncQueue = [];
      state.pendingCount = 0;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'error';
      }
    },
    resetSync: () => initialState,
  },
});

export const {
  setOnlineStatus,
  setSyncStatus,
  setLastSyncedAt,
  addToSyncQueue,
  removeFromSyncQueue,
  incrementAttempts,
  clearSyncQueue,
  setSyncError,
  resetSync,
} = syncSlice.actions;

export default syncSlice.reducer;
