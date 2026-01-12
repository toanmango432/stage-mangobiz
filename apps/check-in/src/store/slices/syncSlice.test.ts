/**
 * Unit Tests for Sync Slice
 */

import { describe, it, expect } from 'vitest';
import syncReducer, {
  setOnlineStatus,
  setSyncStatus,
  setLastSyncedAt,
  addToSyncQueue,
  removeFromSyncQueue,
  incrementAttempts,
  clearSyncQueue,
  setPendingCount,
  setSyncError,
  resetSync,
} from './syncSlice';

describe('syncSlice', () => {
  const initialState = {
    status: 'idle' as const,
    isOnline: true,
    lastSyncedAt: null,
    pendingCount: 0,
    syncQueue: [],
    error: null,
  };

  describe('initial state', () => {
    it('returns initial state', () => {
      const result = syncReducer(undefined, { type: '' });
      expect(result.status).toBe('idle');
      expect(result.pendingCount).toBe(0);
      expect(result.syncQueue).toEqual([]);
    });
  });

  describe('setOnlineStatus', () => {
    it('sets online status to true', () => {
      const offlineState = { ...initialState, isOnline: false, status: 'offline' as const };
      const result = syncReducer(offlineState, setOnlineStatus(true));
      
      expect(result.isOnline).toBe(true);
      expect(result.status).toBe('idle');
    });

    it('sets online status to false and status to offline', () => {
      const result = syncReducer(initialState, setOnlineStatus(false));
      
      expect(result.isOnline).toBe(false);
      expect(result.status).toBe('offline');
    });

    it('keeps non-offline status when going online', () => {
      const syncingState = { ...initialState, isOnline: false, status: 'syncing' as const };
      const result = syncReducer(syncingState, setOnlineStatus(true));
      
      expect(result.isOnline).toBe(true);
      expect(result.status).toBe('syncing');
    });
  });

  describe('setSyncStatus', () => {
    it('sets sync status', () => {
      const result = syncReducer(initialState, setSyncStatus('syncing'));
      expect(result.status).toBe('syncing');
    });

    it('sets synced status', () => {
      const result = syncReducer(initialState, setSyncStatus('synced'));
      expect(result.status).toBe('synced');
    });

    it('sets error status', () => {
      const result = syncReducer(initialState, setSyncStatus('error'));
      expect(result.status).toBe('error');
    });
  });

  describe('setLastSyncedAt', () => {
    it('sets last synced timestamp', () => {
      const timestamp = '2026-01-11T10:00:00Z';
      const result = syncReducer(initialState, setLastSyncedAt(timestamp));
      expect(result.lastSyncedAt).toBe(timestamp);
    });
  });

  describe('addToSyncQueue', () => {
    it('adds item to sync queue', () => {
      const result = syncReducer(
        initialState,
        addToSyncQueue({ type: 'checkin', payload: { id: 'test-1' } })
      );
      
      expect(result.syncQueue).toHaveLength(1);
      expect(result.syncQueue[0].type).toBe('checkin');
      expect(result.syncQueue[0].payload).toEqual({ id: 'test-1' });
      expect(result.syncQueue[0].attempts).toBe(0);
      expect(result.pendingCount).toBe(1);
    });

    it('assigns unique ID and timestamps', () => {
      const result = syncReducer(
        initialState,
        addToSyncQueue({ type: 'client', payload: {} })
      );
      
      expect(result.syncQueue[0].id).toBeTruthy();
      expect(result.syncQueue[0].createdAt).toBeTruthy();
    });

    it('accumulates multiple items', () => {
      let state = syncReducer(
        initialState,
        addToSyncQueue({ type: 'checkin', payload: { id: '1' } })
      );
      state = syncReducer(
        state,
        addToSyncQueue({ type: 'client', payload: { id: '2' } })
      );
      
      expect(state.syncQueue).toHaveLength(2);
      expect(state.pendingCount).toBe(2);
    });
  });

  describe('removeFromSyncQueue', () => {
    it('removes item from sync queue by ID', () => {
      const stateWithItem = {
        ...initialState,
        syncQueue: [
          { id: 'item-1', type: 'checkin' as const, payload: {}, createdAt: '', attempts: 0 },
          { id: 'item-2', type: 'client' as const, payload: {}, createdAt: '', attempts: 0 },
        ],
        pendingCount: 2,
      };
      
      const result = syncReducer(stateWithItem, removeFromSyncQueue('item-1'));
      
      expect(result.syncQueue).toHaveLength(1);
      expect(result.syncQueue[0].id).toBe('item-2');
      expect(result.pendingCount).toBe(1);
    });

    it('handles removing non-existent item', () => {
      const stateWithItem = {
        ...initialState,
        syncQueue: [
          { id: 'item-1', type: 'checkin' as const, payload: {}, createdAt: '', attempts: 0 },
        ],
        pendingCount: 1,
      };
      
      const result = syncReducer(stateWithItem, removeFromSyncQueue('nonexistent'));
      
      expect(result.syncQueue).toHaveLength(1);
      expect(result.pendingCount).toBe(1);
    });
  });

  describe('incrementAttempts', () => {
    it('increments attempts for an item', () => {
      const stateWithItem = {
        ...initialState,
        syncQueue: [
          { id: 'item-1', type: 'checkin' as const, payload: {}, createdAt: '', attempts: 2 },
        ],
        pendingCount: 1,
      };
      
      const result = syncReducer(stateWithItem, incrementAttempts('item-1'));
      
      expect(result.syncQueue[0].attempts).toBe(3);
    });

    it('handles non-existent item gracefully', () => {
      const result = syncReducer(initialState, incrementAttempts('nonexistent'));
      expect(result.syncQueue).toEqual([]);
    });
  });

  describe('clearSyncQueue', () => {
    it('clears all items from sync queue', () => {
      const stateWithItems = {
        ...initialState,
        syncQueue: [
          { id: 'item-1', type: 'checkin' as const, payload: {}, createdAt: '', attempts: 0 },
          { id: 'item-2', type: 'client' as const, payload: {}, createdAt: '', attempts: 0 },
        ],
        pendingCount: 2,
      };
      
      const result = syncReducer(stateWithItems, clearSyncQueue());
      
      expect(result.syncQueue).toEqual([]);
      expect(result.pendingCount).toBe(0);
    });
  });

  describe('setPendingCount', () => {
    it('sets pending count', () => {
      const result = syncReducer(initialState, setPendingCount(5));
      expect(result.pendingCount).toBe(5);
    });
  });

  describe('setSyncError', () => {
    it('sets error message and status', () => {
      const result = syncReducer(initialState, setSyncError('Network error'));
      
      expect(result.error).toBe('Network error');
      expect(result.status).toBe('error');
    });

    it('clears error when null', () => {
      const stateWithError = {
        ...initialState,
        error: 'Previous error',
        status: 'error' as const,
      };
      
      const result = syncReducer(stateWithError, setSyncError(null));
      
      expect(result.error).toBeNull();
      expect(result.status).toBe('error'); // Status not cleared
    });
  });

  describe('resetSync', () => {
    it('resets all state to initial values', () => {
      const modifiedState = {
        status: 'error' as const,
        isOnline: false,
        lastSyncedAt: '2026-01-11T10:00:00Z',
        pendingCount: 5,
        syncQueue: [
          { id: 'item-1', type: 'checkin' as const, payload: {}, createdAt: '', attempts: 3 },
        ],
        error: 'Some error',
      };
      
      const result = syncReducer(modifiedState, resetSync());
      
      expect(result.status).toBe('idle');
      expect(result.lastSyncedAt).toBeNull();
      expect(result.pendingCount).toBe(0);
      expect(result.syncQueue).toEqual([]);
      expect(result.error).toBeNull();
    });
  });
});
