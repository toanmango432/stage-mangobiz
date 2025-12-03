/**
 * Data Service Tests
 *
 * Tests for mode-aware data operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setDevice } from '@/store/slices/authSlice';

// We need to mock the store import before importing dataService
let mockStore: ReturnType<typeof configureStore>;

vi.mock('@/store', () => {
  return {
    store: {
      getState: () => mockStore?.getState() ?? { auth: { device: null } },
    },
  };
});

// Import after mocking
import {
  dataService,
  executeDataOperation,
  executeWriteOperation,
  shouldUseLocalDB,
  shouldUseServer,
  shouldSync,
  getModeInfo,
} from '../dataService';

// Create test store
function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
}

describe('dataService', () => {
  beforeEach(() => {
    mockStore = createTestStore();
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  describe('shouldUseLocalDB', () => {
    it('should return false when no device is set', () => {
      expect(shouldUseLocalDB()).toBe(false);
    });

    it('should return false for online-only mode', () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'online-only',
          offlineModeEnabled: false,
          registeredAt: new Date().toISOString(),
        })
      );

      expect(shouldUseLocalDB()).toBe(false);
    });

    it('should return true for offline-enabled mode', () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      expect(shouldUseLocalDB()).toBe(true);
    });
  });

  describe('shouldUseServer', () => {
    it('should return true when no device is set', () => {
      expect(shouldUseServer()).toBe(true);
    });

    it('should return true for online-only mode', () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'online-only',
          offlineModeEnabled: false,
          registeredAt: new Date().toISOString(),
        })
      );

      expect(shouldUseServer()).toBe(true);
    });

    it('should return false for offline-enabled mode', () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      expect(shouldUseServer()).toBe(false);
    });
  });

  describe('shouldSync', () => {
    it('should return false when offline mode is not enabled', () => {
      expect(shouldSync()).toBe(false);
    });

    it('should return true for offline-enabled mode when online', () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      expect(shouldSync()).toBe(true);
    });

    it('should return false for offline-enabled mode when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      expect(shouldSync()).toBe(false);
    });
  });

  describe('getModeInfo', () => {
    it('should return correct mode info', () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const info = getModeInfo();

      expect(info.mode).toBe('offline-enabled');
      expect(info.offlineEnabled).toBe(true);
      expect(info.online).toBe(true);
      expect(info.dataSource).toBe('local');
    });
  });

  describe('executeDataOperation', () => {
    it('should execute server function in online-only mode', async () => {
      const localFn = vi.fn().mockResolvedValue('local-data');
      const serverFn = vi.fn().mockResolvedValue('server-data');

      const result = await executeDataOperation(localFn, serverFn);

      expect(serverFn).toHaveBeenCalled();
      expect(localFn).not.toHaveBeenCalled();
      expect(result.data).toBe('server-data');
      expect(result.source).toBe('server');
    });

    it('should execute local function in offline-enabled mode', async () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const localFn = vi.fn().mockResolvedValue('local-data');
      const serverFn = vi.fn().mockResolvedValue('server-data');

      const result = await executeDataOperation(localFn, serverFn);

      expect(localFn).toHaveBeenCalled();
      expect(serverFn).not.toHaveBeenCalled();
      expect(result.data).toBe('local-data');
      expect(result.source).toBe('local');
    });

    it('should fallback to local on server error when offline-enabled', async () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const localFn = vi.fn().mockResolvedValue('local-data');
      const serverFn = vi.fn().mockRejectedValue(new Error('Server error'));

      // Force server source
      const result = await executeDataOperation(localFn, serverFn, {
        forceSource: 'server',
      });

      // Should fallback to local
      expect(localFn).toHaveBeenCalled();
      expect(result.data).toBe('local-data');
      expect(result.cached).toBe(true);
    });

    it('should return error when server fails in online-only mode', async () => {
      const localFn = vi.fn().mockResolvedValue('local-data');
      const serverFn = vi.fn().mockRejectedValue(new Error('Server error'));

      const result = await executeDataOperation(localFn, serverFn);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Server error');
    });
  });

  describe('executeWriteOperation', () => {
    it('should write to server in online-only mode', async () => {
      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');
      const syncFn = vi.fn();

      const result = await executeWriteOperation(localFn, serverFn, syncFn);

      expect(serverFn).toHaveBeenCalled();
      expect(localFn).not.toHaveBeenCalled();
      expect(syncFn).not.toHaveBeenCalled();
      expect(result.data).toBe('server-result');
      expect(result.source).toBe('server');
    });

    it('should write to local and sync in offline-enabled mode', async () => {
      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');
      const syncFn = vi.fn().mockResolvedValue(undefined);

      const result = await executeWriteOperation(localFn, serverFn, syncFn);

      expect(localFn).toHaveBeenCalled();
      expect(serverFn).not.toHaveBeenCalled();
      expect(syncFn).toHaveBeenCalled();
      expect(result.data).toBe('local-result');
      expect(result.source).toBe('local');
    });

    it('should return error when offline in online-only mode', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');

      const result = await executeWriteOperation(localFn, serverFn);

      expect(result.data).toBeNull();
      expect(result.error).toContain('offline');
    });

    it('should write locally when offline in offline-enabled mode', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      mockStore.dispatch(
        setDevice({
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');
      const syncFn = vi.fn();

      const result = await executeWriteOperation(localFn, serverFn, syncFn);

      expect(localFn).toHaveBeenCalled();
      expect(serverFn).not.toHaveBeenCalled();
      expect(syncFn).not.toHaveBeenCalled(); // Not syncing when offline
      expect(result.data).toBe('local-result');
    });
  });

  describe('dataService object', () => {
    it('should expose all functions', () => {
      expect(dataService.execute).toBe(executeDataOperation);
      expect(dataService.write).toBe(executeWriteOperation);
      expect(dataService.shouldUseLocalDB).toBe(shouldUseLocalDB);
      expect(dataService.shouldUseServer).toBe(shouldUseServer);
      expect(dataService.shouldSync).toBe(shouldSync);
      expect(dataService.getModeInfo).toBe(getModeInfo);
    });
  });
});
