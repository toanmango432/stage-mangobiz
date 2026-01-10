/**
 * SyncQueue Unit Tests
 * US-016: Tests for offline message queuing and replay
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We need to reset the module for each test to get a fresh instance
let syncQueueService: typeof import('./syncQueue').syncQueueService;

describe('SyncQueueService', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.resetModules();
    const module = await import('./syncQueue');
    syncQueueService = module.syncQueueService;
  });

  afterEach(() => {
    vi.useRealTimers();
    syncQueueService.stopOfflineTracking();
    syncQueueService.clearQueue();
  });

  describe('enqueue', () => {
    it('should add message to queue', () => {
      const id = syncQueueService.enqueue('test/topic', { data: 'test' });
      expect(id).toBeDefined();
      expect(syncQueueService.getQueueSize()).toBe(1);
    });

    it('should preserve message order by priority', () => {
      syncQueueService.enqueue('topic/low', { priority: 'low' }, 1);
      syncQueueService.enqueue('topic/high', { priority: 'high' }, 2);
      const queue = syncQueueService.getQueue();
      expect(queue[0].topic).toBe('topic/high');
      expect(queue[1].topic).toBe('topic/low');
    });

    it('should persist to localStorage', () => {
      syncQueueService.enqueue('test/topic', { data: 'persist' });
      const stored = JSON.parse(localStorage.getItem('mango-pad-sync-queue') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].topic).toBe('test/topic');
    });

    it('should include timestamp', () => {
      const beforeTime = new Date().toISOString();
      syncQueueService.enqueue('test/topic', { data: 'timestamp' });
      const queue = syncQueueService.getQueue();
      expect(queue[0].timestamp).toBeDefined();
      expect(new Date(queue[0].timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime() - 1000);
    });
  });

  describe('getQueue', () => {
    it('should return copy of queue', () => {
      syncQueueService.enqueue('test/topic', { data: 'test' });
      const queue1 = syncQueueService.getQueue();
      const queue2 = syncQueueService.getQueue();
      expect(queue1).not.toBe(queue2);
      expect(queue1).toEqual(queue2);
    });

    it('should return empty array when no messages', () => {
      expect(syncQueueService.getQueue()).toEqual([]);
    });
  });

  describe('getQueueSize', () => {
    it('should return 0 for empty queue', () => {
      expect(syncQueueService.getQueueSize()).toBe(0);
    });

    it('should return correct count', () => {
      syncQueueService.enqueue('topic1', {});
      syncQueueService.enqueue('topic2', {});
      syncQueueService.enqueue('topic3', {});
      expect(syncQueueService.getQueueSize()).toBe(3);
    });
  });

  describe('clearQueue', () => {
    it('should remove all messages', () => {
      syncQueueService.enqueue('topic1', {});
      syncQueueService.enqueue('topic2', {});
      syncQueueService.clearQueue();
      expect(syncQueueService.getQueueSize()).toBe(0);
    });

    it('should clear localStorage', () => {
      syncQueueService.enqueue('topic', {});
      syncQueueService.clearQueue();
      const stored = JSON.parse(localStorage.getItem('mango-pad-sync-queue') || '[]');
      expect(stored).toEqual([]);
    });
  });

  describe('removeMessage', () => {
    it('should remove specific message by id', () => {
      const id1 = syncQueueService.enqueue('topic1', {});
      syncQueueService.enqueue('topic2', {});
      syncQueueService.removeMessage(id1);
      const queue = syncQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].topic).toBe('topic2');
    });

    it('should do nothing for non-existent id', () => {
      syncQueueService.enqueue('topic', {});
      syncQueueService.removeMessage('non-existent');
      expect(syncQueueService.getQueueSize()).toBe(1);
    });
  });

  describe('replayQueue', () => {
    it('should return zeros when no handler set', async () => {
      syncQueueService.enqueue('topic', {});
      const result = await syncQueueService.replayQueue();
      expect(result).toEqual({ success: 0, failed: 0 });
    });

    it('should return zeros when queue is empty', async () => {
      syncQueueService.setReplayHandler(async () => true);
      const result = await syncQueueService.replayQueue();
      expect(result).toEqual({ success: 0, failed: 0 });
    });

    it('should replay messages successfully', async () => {
      const handler = vi.fn().mockResolvedValue(true);
      syncQueueService.setReplayHandler(handler);
      syncQueueService.enqueue('topic1', { data: 1 });
      syncQueueService.enqueue('topic2', { data: 2 });
      
      const result = await syncQueueService.replayQueue();
      
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(handler).toHaveBeenCalledTimes(2);
      expect(syncQueueService.getQueueSize()).toBe(0);
    });

    it('should retry failed messages up to max attempts', async () => {
      let attempts = 0;
      syncQueueService.setReplayHandler(async () => {
        attempts++;
        return false;
      });
      syncQueueService.enqueue('topic', {});
      
      await syncQueueService.replayQueue();
      await syncQueueService.replayQueue();
      const result = await syncQueueService.replayQueue();
      
      expect(result.failed).toBe(1);
      expect(attempts).toBe(3);
      expect(syncQueueService.getQueueSize()).toBe(0);
    });

    it('should handle handler exceptions', async () => {
      syncQueueService.setReplayHandler(async () => {
        throw new Error('Handler error');
      });
      syncQueueService.enqueue('topic', {});
      
      await syncQueueService.replayQueue();
      await syncQueueService.replayQueue();
      const result = await syncQueueService.replayQueue();
      
      expect(result.failed).toBe(1);
    });
  });

  describe('offline tracking', () => {
    it('should start tracking offline time', () => {
      syncQueueService.startOfflineTracking();
      expect(syncQueueService.getOfflineDuration()).toBeGreaterThanOrEqual(0);
    });

    it('should calculate offline duration', () => {
      syncQueueService.startOfflineTracking();
      vi.advanceTimersByTime(10000);
      expect(syncQueueService.getOfflineDuration()).toBeGreaterThanOrEqual(10000);
    });

    it('should stop tracking and reset duration', () => {
      syncQueueService.startOfflineTracking();
      vi.advanceTimersByTime(5000);
      syncQueueService.stopOfflineTracking();
      expect(syncQueueService.getOfflineDuration()).toBe(0);
    });

    it('should not start multiple trackers', () => {
      syncQueueService.startOfflineTracking();
      vi.advanceTimersByTime(5000);
      syncQueueService.startOfflineTracking();
      expect(syncQueueService.getOfflineDuration()).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('offline alert threshold', () => {
    it('should not be reached initially', () => {
      syncQueueService.startOfflineTracking();
      expect(syncQueueService.isOfflineAlertThresholdReached()).toBe(false);
    });

    it('should be reached after 30 seconds', () => {
      syncQueueService.startOfflineTracking();
      vi.advanceTimersByTime(30001);
      expect(syncQueueService.isOfflineAlertThresholdReached()).toBe(true);
    });

    it('should trigger callback after threshold', () => {
      const callback = vi.fn();
      syncQueueService.setOfflineAlertCallback(callback);
      syncQueueService.startOfflineTracking();
      
      vi.advanceTimersByTime(35000);
      
      expect(callback).toHaveBeenCalled();
    });
  });
});
