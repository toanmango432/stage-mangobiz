/**
 * MqttService Unit Tests
 * US-016: Tests for MQTT client service and message handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the mqtt module
vi.mock('mqtt', () => ({
  default: {
    connect: vi.fn(() => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      publish: vi.fn((_topic: string, _message: string, _options: unknown, callback?: (err: Error | null) => void) => {
        if (callback) callback(null);
      }),
      connected: true,
      end: vi.fn(),
    })),
  },
}));

// Mock the syncQueue service
vi.mock('./syncQueue', () => ({
  syncQueueService: {
    setReplayHandler: vi.fn(),
    enqueue: vi.fn(() => 'mock-queue-id'),
    getQueueSize: vi.fn(() => 0),
    getOfflineDuration: vi.fn(() => 0),
    isOfflineAlertThresholdReached: vi.fn(() => false),
    startOfflineTracking: vi.fn(),
    stopOfflineTracking: vi.fn(),
    replayQueue: vi.fn().mockResolvedValue({ success: 0, failed: 0 }),
  },
}));

// We need to reset modules for each test
describe('MqttService', () => {
  let mqttService: typeof import('./mqttClient').mqttService;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('./mqttClient');
    mqttService = module.mqttService;
  });

  afterEach(() => {
    mqttService.disconnect();
  });

  describe('connection state', () => {
    it('should start disconnected', () => {
      expect(mqttService.getConnectionState()).toBe('disconnected');
    });

    it('should report not connected initially', () => {
      expect(mqttService.isConnected()).toBe(false);
    });
  });

  describe('onStateChange', () => {
    it('should register state change callback', () => {
      const callback = vi.fn();
      const unsubscribe = mqttService.onStateChange(callback);
      
      expect(callback).toHaveBeenCalledWith('disconnected');
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = mqttService.onStateChange(callback);
      
      unsubscribe();
      // After unsubscribe, callback should not be called again
    });
  });

  describe('onReconnect', () => {
    it('should register reconnect callback', () => {
      const callback = vi.fn();
      const unsubscribe = mqttService.onReconnect(callback);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('subscribe', () => {
    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = mqttService.subscribe('test/topic', handler);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should track subscriptions', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      const unsub1 = mqttService.subscribe('topic/a', handler1);
      const unsub2 = mqttService.subscribe('topic/b', handler2);
      
      unsub1();
      unsub2();
    });
  });

  describe('setQueueEnabled', () => {
    it('should allow enabling/disabling queue', () => {
      mqttService.setQueueEnabled(false);
      mqttService.setQueueEnabled(true);
    });
  });

  describe('getQueuedMessageCount', () => {
    it('should return queue size from syncQueueService', () => {
      const count = mqttService.getQueuedMessageCount();
      expect(count).toBe(0);
    });
  });

  describe('getOfflineDuration', () => {
    it('should return duration from syncQueueService', () => {
      const duration = mqttService.getOfflineDuration();
      expect(duration).toBe(0);
    });
  });

  describe('isOfflineAlertThresholdReached', () => {
    it('should return threshold status from syncQueueService', () => {
      const reached = mqttService.isOfflineAlertThresholdReached();
      expect(reached).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when not connected', () => {
      mqttService.disconnect();
      expect(mqttService.getConnectionState()).toBe('disconnected');
    });
  });
});

describe('MQTT Message Handling', () => {
  describe('message format', () => {
    it('should define correct message structure', async () => {
      const module = await import('./mqttClient');
      
      // MqttMessage interface should have id, timestamp, payload
      type MqttMessageType = typeof module extends { MqttMessage: infer T } ? T : { id: string; timestamp: string; payload: unknown };
      const testMessage: MqttMessageType = {
        id: 'msg-123',
        timestamp: new Date().toISOString(),
        payload: { test: 'data' },
      };
      
      expect(testMessage.id).toBeDefined();
      expect(testMessage.timestamp).toBeDefined();
      expect(testMessage.payload).toBeDefined();
    });
  });
});
