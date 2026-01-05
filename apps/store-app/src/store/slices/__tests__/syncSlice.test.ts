/**
 * Sync Slice Tests
 *
 * Tests for sync state management including mode-aware functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import syncReducer, {
  setOnlineStatus,
  setSyncing,
  setPendingOperations,
  setSyncComplete,
  setSyncError,
  enableSync,
  disableSync,
  resetSyncState,
  selectIsOnline,
  selectIsSyncing,
  selectPendingOperations,
  selectLastSyncAt,
  selectSyncError,
  selectSyncEnabled,
  selectSyncDisabledReason,
  selectShouldSync,
} from '../syncSlice';

// Create a test store
function createTestStore() {
  return configureStore({
    reducer: {
      sync: syncReducer,
    },
  });
}

describe('syncSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = (store.getState() as any).sync;

      expect(state.isOnline).toBe(true); // navigator.onLine default
      expect(state.isSyncing).toBe(false);
      expect(state.pendingOperations).toBe(0);
      expect(state.lastSyncAt).toBeNull();
      expect(state.error).toBeNull();
      expect(state.syncEnabled).toBe(false);
      expect(state.syncDisabledReason).toBe('Device not registered for offline mode');
    });
  });

  describe('basic sync actions', () => {
    it('setOnlineStatus should update online status', () => {
      store.dispatch(setOnlineStatus(false));
      expect((store.getState() as any).sync.isOnline).toBe(false);

      store.dispatch(setOnlineStatus(true));
      expect((store.getState() as any).sync.isOnline).toBe(true);
    });

    it('setSyncing should update syncing status', () => {
      store.dispatch(setSyncing(true));
      expect((store.getState() as any).sync.isSyncing).toBe(true);

      store.dispatch(setSyncing(false));
      expect((store.getState() as any).sync.isSyncing).toBe(false);
    });

    it('setPendingOperations should update pending count', () => {
      store.dispatch(setPendingOperations(5));
      expect((store.getState() as any).sync.pendingOperations).toBe(5);

      store.dispatch(setPendingOperations(0));
      expect((store.getState() as any).sync.pendingOperations).toBe(0);
    });

    it('setSyncComplete should update state correctly', () => {
      store.dispatch(setSyncing(true));
      store.dispatch(setSyncComplete());

      const state = (store.getState() as any).sync;
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncAt).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('setSyncError should set error and stop syncing', () => {
      store.dispatch(setSyncing(true));
      store.dispatch(setSyncError('Network error'));

      const state = (store.getState() as any).sync;
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('mode-aware sync actions', () => {
    it('enableSync should enable sync and clear reason', () => {
      expect((store.getState() as any).sync.syncEnabled).toBe(false);

      store.dispatch(enableSync());

      const state = (store.getState() as any).sync;
      expect(state.syncEnabled).toBe(true);
      expect(state.syncDisabledReason).toBeNull();
    });

    it('disableSync should disable sync with reason', () => {
      store.dispatch(enableSync());
      store.dispatch(disableSync('Device revoked'));

      const state = (store.getState() as any).sync;
      expect(state.syncEnabled).toBe(false);
      expect(state.syncDisabledReason).toBe('Device revoked');
      expect(state.isSyncing).toBe(false);
    });

    it('disableSync should use default reason if none provided', () => {
      store.dispatch(enableSync());
      store.dispatch(disableSync(undefined));

      const state = (store.getState() as any).sync;
      expect(state.syncDisabledReason).toBe('Sync disabled');
    });

    it('resetSyncState should reset all sync state', () => {
      // Set up some state
      store.dispatch(enableSync());
      store.dispatch(setSyncing(true));
      store.dispatch(setPendingOperations(10));
      store.dispatch(setSyncComplete());

      // Reset
      store.dispatch(resetSyncState());

      const state = (store.getState() as any).sync;
      expect(state.isSyncing).toBe(false);
      expect(state.pendingOperations).toBe(0);
      expect(state.lastSyncAt).toBeNull();
      expect(state.error).toBeNull();
      expect(state.syncEnabled).toBe(false);
      expect(state.syncDisabledReason).toBe('Device not registered for offline mode');
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      store.dispatch(enableSync());
      store.dispatch(setOnlineStatus(true));
      store.dispatch(setPendingOperations(3));
    });

    it('selectIsOnline should return online status', () => {
      expect(selectIsOnline(store.getState() as any)).toBe(true);
    });

    it('selectIsSyncing should return syncing status', () => {
      expect(selectIsSyncing(store.getState() as any)).toBe(false);
    });

    it('selectPendingOperations should return pending count', () => {
      expect(selectPendingOperations(store.getState() as any)).toBe(3);
    });

    it('selectLastSyncAt should return last sync time', () => {
      store.dispatch(setSyncComplete());
      expect(selectLastSyncAt(store.getState() as any)).not.toBeNull();
    });

    it('selectSyncError should return error', () => {
      store.dispatch(setSyncError('Test error'));
      expect(selectSyncError(store.getState() as any)).toBe('Test error');
    });

    it('selectSyncEnabled should return enabled status', () => {
      expect(selectSyncEnabled(store.getState() as any)).toBe(true);
    });

    it('selectSyncDisabledReason should return reason', () => {
      store.dispatch(disableSync('Test reason'));
      expect(selectSyncDisabledReason(store.getState() as any)).toBe('Test reason');
    });

    describe('selectShouldSync', () => {
      it('should return true when enabled, online, and not syncing', () => {
        store.dispatch(enableSync());
        store.dispatch(setOnlineStatus(true));
        store.dispatch(setSyncing(false));

        expect(selectShouldSync(store.getState() as any)).toBe(true);
      });

      it('should return false when sync is disabled', () => {
        store.dispatch(disableSync('Disabled'));
        expect(selectShouldSync(store.getState() as any)).toBe(false);
      });

      it('should return false when offline', () => {
        store.dispatch(enableSync());
        store.dispatch(setOnlineStatus(false));
        expect(selectShouldSync(store.getState() as any)).toBe(false);
      });

      it('should return false when already syncing', () => {
        store.dispatch(enableSync());
        store.dispatch(setOnlineStatus(true));
        store.dispatch(setSyncing(true));
        expect(selectShouldSync(store.getState() as any)).toBe(false);
      });
    });
  });
});
