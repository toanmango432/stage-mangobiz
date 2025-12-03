/**
 * useSync Hook Tests
 *
 * Tests for sync hooks including mode-aware functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setDevice } from '@/store/slices/authSlice';
import syncReducer, {
  enableSync,
  disableSync,
  setOnlineStatus,
  setPendingOperations,
} from '@/store/slices/syncSlice';
import { useModeAwareSync, useCanOperate } from '../useSync';

// Mock syncService
vi.mock('@/services/syncService', () => ({
  syncService: {
    getStatus: vi.fn(() => ({ isOnline: true, isSyncing: false })),
    subscribe: vi.fn(() => () => {}),
    syncNow: vi.fn().mockResolvedValue({ success: true, synced: 0 }),
  },
  SyncStatus: {},
}));

// Create test store
function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      sync: syncReducer,
    },
  });
}

// Create wrapper with provider
function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

describe('useModeAwareSync', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useModeAwareSync(), { wrapper });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncEnabled).toBe(false);
    expect(result.current.pendingOperations).toBe(0);
    expect(result.current.canWorkOffline).toBe(false);
  });

  it('should reflect sync enabled state', () => {
    store.dispatch(enableSync());

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useModeAwareSync(), { wrapper });

    expect(result.current.syncEnabled).toBe(true);
    expect(result.current.syncDisabledReason).toBeNull();
  });

  it('should reflect sync disabled state with reason', () => {
    store.dispatch(disableSync('Device revoked'));

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useModeAwareSync(), { wrapper });

    expect(result.current.syncEnabled).toBe(false);
    expect(result.current.syncDisabledReason).toBe('Device revoked');
  });

  it('should reflect offline-enabled device', () => {
    store.dispatch(
      setDevice({
        id: 'device-123',
        mode: 'offline-enabled',
        offlineModeEnabled: true,
        registeredAt: new Date().toISOString(),
      })
    );
    store.dispatch(enableSync());

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useModeAwareSync(), { wrapper });

    expect(result.current.isOfflineEnabled).toBe(true);
    expect(result.current.deviceMode).toBe('offline-enabled');
    expect(result.current.canWorkOffline).toBe(true);
  });

  it('should show pending sync status', () => {
    store.dispatch(setPendingOperations(5));

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useModeAwareSync(), { wrapper });

    expect(result.current.pendingOperations).toBe(5);
    expect(result.current.hasPendingSync).toBe(true);
  });

  describe('statusMessage', () => {
    it('should show online mode message for online-only devices', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'online-only',
          offlineModeEnabled: false,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useModeAwareSync(), { wrapper });

      expect(result.current.statusMessage).toBe(
        'Online mode - changes saved directly to server'
      );
    });

    it('should show offline message with pending count', () => {
      store.dispatch(enableSync());
      store.dispatch(setOnlineStatus(false));
      store.dispatch(setPendingOperations(3));

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useModeAwareSync(), { wrapper });

      expect(result.current.statusMessage).toBe('Offline - 3 changes pending');
    });

    it('should show all synced message', () => {
      store.dispatch(enableSync());
      store.dispatch(setOnlineStatus(true));
      store.dispatch(setPendingOperations(0));

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useModeAwareSync(), { wrapper });

      expect(result.current.statusMessage).toBe('All changes synced');
    });
  });

  describe('syncNow', () => {
    it('should not sync when disabled', async () => {
      store.dispatch(disableSync('Test'));

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useModeAwareSync(), { wrapper });

      const response = await result.current.syncNow();
      expect(response.success).toBe(false);
      expect(response.error).toBe('Test');
    });
  });
});

describe('useCanOperate', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should return canOperate true when online', () => {
    store.dispatch(setOnlineStatus(true));

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useCanOperate(), { wrapper });

    expect(result.current.canOperate).toBe(true);
    expect(result.current.reason).toBeNull();
  });

  it('should return canOperate true when offline but offline-enabled', () => {
    store.dispatch(setOnlineStatus(false));
    store.dispatch(
      setDevice({
        id: 'device-123',
        mode: 'offline-enabled',
        offlineModeEnabled: true,
        registeredAt: new Date().toISOString(),
      })
    );

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useCanOperate(), { wrapper });

    expect(result.current.canOperate).toBe(true);
    expect(result.current.reason).toBeNull();
  });

  it('should return canOperate false when offline and online-only', () => {
    store.dispatch(setOnlineStatus(false));
    store.dispatch(
      setDevice({
        id: 'device-123',
        mode: 'online-only',
        offlineModeEnabled: false,
        registeredAt: new Date().toISOString(),
      })
    );

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useCanOperate(), { wrapper });

    expect(result.current.canOperate).toBe(false);
    expect(result.current.reason).toContain('No internet connection');
  });

  it('should return canOperate false when offline and no device', () => {
    store.dispatch(setOnlineStatus(false));

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useCanOperate(), { wrapper });

    expect(result.current.canOperate).toBe(false);
    expect(result.current.reason).toContain('offline mode');
  });
});
