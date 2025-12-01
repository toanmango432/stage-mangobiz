/**
 * useOfflineMode Hook Tests
 *
 * Tests for mode-aware data fetching hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setDevice } from '@/store/slices/authSlice';
import {
  useOfflineMode,
  useIsOnlineOnly,
  useShouldUseLocalDB,
  useNetworkStatus,
} from '../useOfflineMode';

// Create test store
function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
}

// Create wrapper with provider
function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

describe('useOfflineMode', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  describe('useOfflineMode hook', () => {
    it('should return online-only state with no device', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useOfflineMode(), { wrapper });

      expect(result.current.mode).toBeNull();
      expect(result.current.isOfflineEnabled).toBe(false);
      expect(result.current.shouldUseLocalDB).toBe(false);
      expect(result.current.isOnline).toBe(true);
    });

    it('should return offline-enabled state with offline device', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useOfflineMode(), { wrapper });

      expect(result.current.mode).toBe('offline-enabled');
      expect(result.current.isOfflineEnabled).toBe(true);
      expect(result.current.shouldUseLocalDB).toBe(true);
    });

    it('should return online-only state with online-only device', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'online-only',
          offlineModeEnabled: false,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useOfflineMode(), { wrapper });

      expect(result.current.mode).toBe('online-only');
      expect(result.current.isOfflineEnabled).toBe(false);
      expect(result.current.shouldUseLocalDB).toBe(false);
    });
  });

  describe('getDataSource', () => {
    it('should return server for online-only mode', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'online-only',
          offlineModeEnabled: false,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useOfflineMode(), { wrapper });

      const dataSource = result.current.getDataSource();
      expect(dataSource.read).toBe('server');
      expect(dataSource.write).toBe('server');
    });

    it('should return local-first for offline-enabled mode when online', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useOfflineMode(), { wrapper });

      const dataSource = result.current.getDataSource();
      expect(dataSource.read).toBe('both');
      expect(dataSource.write).toBe('both');
      expect(dataSource.readPriority).toBe('local-first');
    });

    it('should return local-only for offline-enabled mode when offline', () => {
      // Simulate being offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useOfflineMode(), { wrapper });

      const dataSource = result.current.getDataSource();
      expect(dataSource.read).toBe('local');
      expect(dataSource.write).toBe('local');
    });
  });

  describe('useIsOnlineOnly', () => {
    it('should return true when no device is set', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useIsOnlineOnly(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return true for online-only device', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'online-only',
          offlineModeEnabled: false,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useIsOnlineOnly(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return false for offline-enabled device', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useIsOnlineOnly(), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  describe('useShouldUseLocalDB', () => {
    it('should return false when offline mode is disabled', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useShouldUseLocalDB(), { wrapper });

      expect(result.current).toBe(false);
    });

    it('should return true when offline mode is enabled', () => {
      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useShouldUseLocalDB(), { wrapper });

      expect(result.current).toBe(true);
    });
  });

  describe('useNetworkStatus', () => {
    it('should indicate can operate when online', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useNetworkStatus(), { wrapper });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.canOperate).toBe(true);
    });

    it('should indicate cannot operate when offline without offline mode', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useNetworkStatus(), { wrapper });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.canOperate).toBe(false);
    });

    it('should indicate can operate when offline with offline mode', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      store.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useNetworkStatus(), { wrapper });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.canOperate).toBe(true);
    });
  });
});
