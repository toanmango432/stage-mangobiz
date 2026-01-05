/**
 * Data Service Tests
 *
 * Tests for LOCAL-FIRST data operations.
 * All operations read/write to local IndexedDB first, sync in background.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import dataService functions
import {
  dataService,
  executeDataOperation,
  executeWriteOperation,
  shouldUseLocalDB,
  shouldUseServer,
  shouldSync,
  getModeInfo,
} from '../dataService';

describe('dataService - LOCAL-FIRST', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  describe('shouldUseLocalDB', () => {
    it('should always return true (local-first)', () => {
      expect(shouldUseLocalDB()).toBe(true);
    });
  });

  describe('shouldUseServer', () => {
    it('should always return false (local-first, server is for sync only)', () => {
      expect(shouldUseServer()).toBe(false);
    });
  });

  describe('shouldSync', () => {
    it('should return true when online', () => {
      expect(shouldSync()).toBe(true);
    });

    it('should return false when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      expect(shouldSync()).toBe(false);
    });
  });

  describe('getModeInfo', () => {
    it('should return local-first mode info', () => {
      const info = getModeInfo();

      expect(info.mode).toBe('local-first');
      expect(info.online).toBe(true);
      expect(info.dataSource).toBe('local');
    });

    it('should reflect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const info = getModeInfo();

      expect(info.mode).toBe('local-first');
      expect(info.online).toBe(false);
      expect(info.dataSource).toBe('local');
    });
  });

  describe('executeDataOperation', () => {
    it('should always execute local function (local-first)', async () => {
      const localFn = vi.fn().mockResolvedValue('local-data');
      const serverFn = vi.fn().mockResolvedValue('server-data');

      const result = await executeDataOperation(localFn, serverFn);

      expect(localFn).toHaveBeenCalled();
      expect(serverFn).not.toHaveBeenCalled();
      expect(result.data).toBe('local-data');
      expect(result.source).toBe('local');
    });

    it('should use server when forceSource is set', async () => {
      const localFn = vi.fn().mockResolvedValue('local-data');
      const serverFn = vi.fn().mockResolvedValue('server-data');

      const result = await executeDataOperation(localFn, serverFn, {
        forceSource: 'server',
      });

      expect(serverFn).toHaveBeenCalled();
      expect(localFn).not.toHaveBeenCalled();
      expect(result.data).toBe('server-data');
      expect(result.source).toBe('server');
    });

    it('should return error when local function fails', async () => {
      const localFn = vi.fn().mockRejectedValue(new Error('Local error'));
      const serverFn = vi.fn().mockResolvedValue('server-data');

      const result = await executeDataOperation(localFn, serverFn);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Local error');
    });
  });

  describe('executeWriteOperation', () => {
    it('should always write to local first (local-first)', async () => {
      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');
      const syncFn = vi.fn().mockResolvedValue(undefined);

      const result = await executeWriteOperation(localFn, serverFn, syncFn);

      expect(localFn).toHaveBeenCalled();
      expect(serverFn).not.toHaveBeenCalled();
      expect(result.data).toBe('local-result');
      expect(result.source).toBe('local');
    });

    it('should queue sync in background (non-blocking)', async () => {
      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');
      const syncFn = vi.fn().mockResolvedValue(undefined);

      await executeWriteOperation(localFn, serverFn, syncFn);

      // Sync is queued in background (non-blocking)
      // Wait for microtask to process
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(syncFn).toHaveBeenCalled();
    });

    it('should work when offline (writes locally, syncs later)', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const localFn = vi.fn().mockResolvedValue('local-result');
      const serverFn = vi.fn().mockResolvedValue('server-result');
      const syncFn = vi.fn().mockResolvedValue(undefined);

      const result = await executeWriteOperation(localFn, serverFn, syncFn);

      expect(localFn).toHaveBeenCalled();
      expect(serverFn).not.toHaveBeenCalled();
      expect(result.data).toBe('local-result');
      expect(result.source).toBe('local');
    });

    it('should return error when local write fails', async () => {
      const localFn = vi.fn().mockRejectedValue(new Error('Write failed'));
      const serverFn = vi.fn().mockResolvedValue('server-result');

      const result = await executeWriteOperation(localFn, serverFn);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Write failed');
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
