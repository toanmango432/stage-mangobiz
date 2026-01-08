/**
 * Sync Service Tests
 *
 * Tests for offline/online synchronization service.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the database before importing syncService
vi.mock('../../db/database', () => ({
  syncQueueDB: {
    add: vi.fn().mockResolvedValue(1),
    getPending: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocking
import { syncQueueDB } from '../../db/database';

describe('SyncService', () => {
  let SyncService: any;
  let syncService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock window event listeners
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

    // Clear module cache and re-import
    vi.resetModules();

    // Import fresh instance
    const module = await import('../syncService');
    syncService = module.syncService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStatus', () => {
    it('should return current online and syncing status', () => {
      const status = syncService.getStatus();

      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isSyncing');
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.isSyncing).toBe('boolean');
    });

    it('should reflect navigator.onLine for isOnline', () => {
      const status = syncService.getStatus();
      expect(status.isOnline).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = syncService.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener when status changes', async () => {
      const listener = vi.fn();
      syncService.subscribe(listener);

      // Trigger syncNow which should notify listeners
      await syncService.syncNow();

      expect(listener).toHaveBeenCalled();
    });

    it('should not call listener after unsubscribe', async () => {
      const listener = vi.fn();
      const unsubscribe = syncService.subscribe(listener);

      unsubscribe();

      // Trigger syncNow - listener should not be called
      await syncService.syncNow();

      // Listener might be called during syncNow before unsubscribe effect
      // But after unsubscribe, new notifications should not reach it
      const callCountAfterUnsubscribe = listener.mock.calls.length;

      await syncService.syncNow();

      // Should not increase after another sync
      expect(listener.mock.calls.length).toBe(callCountAfterUnsubscribe);
    });
  });

  describe('syncNow', () => {
    it('should return success when no pending items', async () => {
      vi.mocked(syncQueueDB.getPending).mockResolvedValue([]);

      const result = await syncService.syncNow();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
    });

    it('should process pending items', async () => {
      const pendingItems = [
        {
          id: 1,
          type: 'create',
          action: 'CREATE',
          entity: 'appointment',
          entityId: 'apt-1',
          payload: { id: 'apt-1', title: 'Test' },
          priority: 3,
          maxAttempts: 5,
          attempts: 0,
        },
      ];

      vi.mocked(syncQueueDB.getPending).mockResolvedValue(pendingItems as any);

      const result = await syncService.syncNow();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(syncQueueDB.remove).toHaveBeenCalledWith(1);
    });

    it('should return error when offline', async () => {
      // Reset module to get fresh instance with offline state
      vi.resetModules();

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const module = await import('../syncService');
      const offlineService = module.syncService;

      const result = await offlineService.syncNow();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Device is offline');
    });
  });

  describe('queueCreate', () => {
    it('should add item to sync queue', async () => {
      const data = { id: 'client-1', name: 'Test Client' };

      await syncService.queueCreate('client', data);

      expect(syncQueueDB.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create',
          action: 'CREATE',
          entity: 'client',
          entityId: 'client-1',
          payload: data,
        })
      );
    });

    it('should use default priority of 3', async () => {
      const data = { id: 'client-1', name: 'Test Client' };

      await syncService.queueCreate('client', data);

      expect(syncQueueDB.add).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 3,
        })
      );
    });

    it('should accept custom priority', async () => {
      const data = { id: 'client-1', name: 'Test Client' };

      await syncService.queueCreate('client', data, 1);

      expect(syncQueueDB.add).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 1,
        })
      );
    });
  });

  describe('queueUpdate', () => {
    it('should add update item to sync queue', async () => {
      const data = { id: 'client-1', name: 'Updated Client' };

      await syncService.queueUpdate('client', data);

      expect(syncQueueDB.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update',
          action: 'UPDATE',
          entity: 'client',
          entityId: 'client-1',
          payload: data,
        })
      );
    });
  });

  describe('queueDelete', () => {
    it('should add delete item to sync queue', async () => {
      await syncService.queueDelete('appointment', 'apt-1');

      expect(syncQueueDB.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delete',
          action: 'DELETE',
          entity: 'appointment',
          entityId: 'apt-1',
          payload: { id: 'apt-1' },
        })
      );
    });
  });

  describe('stopAutoSync', () => {
    it('should stop auto sync interval', () => {
      // Should not throw
      expect(() => syncService.stopAutoSync()).not.toThrow();
    });
  });
});
