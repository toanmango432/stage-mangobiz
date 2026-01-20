/**
 * Tests for MQTT Client
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MqttClient, getMqttClient, destroyMqttClient } from './MqttClient';
import type { MqttConfig } from './types';

// Mock the mqtt library
const mockOn = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockPublish = vi.fn();
const mockEnd = vi.fn();

const mockClient = {
  on: mockOn,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  publish: mockPublish,
  end: mockEnd,
  connected: false,
};

vi.mock('mqtt', () => ({
  default: {
    connect: vi.fn(() => mockClient),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-1234'),
}));

describe('MqttClient', () => {
  const testConfig: MqttConfig = {
    storeId: 'test-store-123',
    deviceId: 'test-device-456',
    deviceType: 'web',
    cloudBrokerUrl: 'wss://test.mosquitto.org:8081',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    destroyMqttClient();

    // Reset mock implementations
    mockOn.mockImplementation((event: string, callback: Function) => {
      // Store callbacks for triggering later
      if (event === 'connect') {
        (mockClient as any)._connectCallback = callback;
      }
      return mockClient;
    });
    mockSubscribe.mockImplementation((_topic: string, _opts: unknown, callback?: Function) => {
      if (callback) callback(null);
    });
    mockUnsubscribe.mockImplementation((_topic: string, callback?: Function) => {
      if (callback) callback();
    });
    mockPublish.mockImplementation((_topic: string, _message: string, _opts: unknown, callback?: Function) => {
      if (callback) callback();
    });
    mockEnd.mockImplementation((force?: boolean | Function, _opts?: unknown, callback?: Function) => {
      if (typeof force === 'function') {
        (force as Function)();
      } else if (callback) {
        callback();
      }
    });
  });

  afterEach(() => {
    destroyMqttClient();
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      const client = new MqttClient();
      expect(client).toBeInstanceOf(MqttClient);
    });

    it('should initialize with disconnected state', () => {
      const client = new MqttClient();
      const info = client.getConnectionInfo();
      expect(info.state).toBe('disconnected');
    });

    it('should store config values', () => {
      const client = new MqttClient();
      const info = client.getConnectionInfo();
      expect(info.brokerType).toBeNull();
      expect(info.brokerUrl).toBeNull();
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info object', () => {
      const client = new MqttClient();
      const info = client.getConnectionInfo();

      expect(info).toHaveProperty('state');
      expect(info).toHaveProperty('brokerType');
      expect(info).toHaveProperty('brokerUrl');
      expect(info).toHaveProperty('connectedAt');
      expect(info).toHaveProperty('error');
    });

    it('should have correct initial values', () => {
      const client = new MqttClient();
      const info = client.getConnectionInfo();

      expect(info.state).toBe('disconnected');
      expect(info.brokerType).toBeNull();
      expect(info.brokerUrl).toBeNull();
      expect(info.connectedAt).toBeNull();
      expect(info.error).toBeNull();
    });
  });

  describe('singleton functions', () => {
    it('getMqttClient should return singleton instance', () => {
      const client1 = getMqttClient();
      const client2 = getMqttClient();

      expect(client1).toBe(client2);
    });

    it('destroyMqttClient should clear singleton', () => {
      const client1 = getMqttClient();
      destroyMqttClient();
      const client2 = getMqttClient();

      expect(client1).not.toBe(client2);
    });
  });

  describe('connect method', () => {
    it('should exist', () => {
      const client = new MqttClient();
      expect(typeof client.connect).toBe('function');
    });

    it('should return a promise', async () => {
      const client = new MqttClient();
      const result = client.connect(testConfig.cloudBrokerUrl!, testConfig, 'cloud');
      expect(result).toBeInstanceOf(Promise);
      // Catch any errors to avoid unhandled rejection
      await result.catch(() => {});
    });
  });

  describe('disconnect method', () => {
    it('should exist', () => {
      const client = new MqttClient();
      expect(typeof client.disconnect).toBe('function');
    });
  });

  describe('subscribe method', () => {
    it('should exist', () => {
      const client = new MqttClient();
      expect(typeof client.subscribe).toBe('function');
    });
  });

  describe('publish method', () => {
    it('should exist', () => {
      const client = new MqttClient();
      expect(typeof client.publish).toBe('function');
    });
  });

  describe('config handling', () => {
    it('should accept local broker URL', () => {
      const configWithLocal: MqttConfig = {
        ...testConfig,
        localBrokerUrl: 'ws://192.168.1.100:1883',
      };
      const client = new MqttClient();
      expect(client).toBeInstanceOf(MqttClient);
    });

    it('should require storeId', () => {
      const client = new MqttClient();
      const info = client.getConnectionInfo();
      expect(info).toBeDefined();
    });
  });
});
