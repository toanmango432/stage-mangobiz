/**
 * MQTT Client Singleton
 * Core MQTT client with connection management and message handling
 *
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import mqtt, { MqttClient as MqttJsClient, IClientOptions } from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import type {
  MqttConfig,
  MqttConnectionState,
  MqttConnectionInfo,
  MqttBrokerType,
  MqttMessage,
  MqttPublishOptions,
  MqttMessageHandler,
} from './types';
import { getQosForTopic } from './topics';

// =============================================================================
// Constants
// =============================================================================

const MESSAGE_VERSION = 1;
const DEFAULT_KEEPALIVE = 60; // seconds
const DEFAULT_RECONNECT_PERIOD = 5000; // ms
const DEFAULT_CONNECT_TIMEOUT = 10000; // ms

// =============================================================================
// Message Deduplicator
// =============================================================================

class MessageDeduplicator {
  private processedIds = new Map<string, number>();
  private readonly ttl: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttl = ttlMs;
    this.startCleanup();
  }

  isDuplicate(messageId: string): boolean {
    return this.processedIds.has(messageId);
  }

  markProcessed(messageId: string): void {
    this.processedIds.set(messageId, Date.now());
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - this.ttl;
      for (const [id, timestamp] of this.processedIds.entries()) {
        if (timestamp < cutoff) {
          this.processedIds.delete(id);
        }
      }
    }, 60000); // Cleanup every minute
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.processedIds.clear();
  }
}

// =============================================================================
// MQTT Client Class
// =============================================================================

export class MqttClient {
  private client: MqttJsClient | null = null;
  private config: MqttConfig | null = null;
  private connectionState: MqttConnectionState = 'disconnected';
  private brokerType: MqttBrokerType | null = null;
  private brokerUrl: string | null = null;
  private connectedAt: Date | null = null;
  private lastError: Error | null = null;
  private clientId: string | null = null;

  private subscriptions = new Map<string, Set<MqttMessageHandler>>();
  private deduplicator = new MessageDeduplicator();
  private stateListeners = new Set<(info: MqttConnectionInfo) => void>();

  /** Track if we've logged the first connection error (to suppress subsequent spam) */
  private hasLoggedConnectionError = false;

  // =============================================================================
  // Connection Management
  // =============================================================================

  /**
   * Connect to an MQTT broker
   */
  async connect(
    url: string,
    config: MqttConfig,
    brokerType: MqttBrokerType
  ): Promise<boolean> {
    // Disconnect if already connected
    if (this.client) {
      await this.disconnect();
    }

    this.config = config;
    this.brokerType = brokerType;
    this.brokerUrl = url;
    this.clientId = `mango-${config.deviceType}-${config.deviceId}`;

    this.updateState('connecting');

    const options: IClientOptions = {
      clientId: this.clientId,
      clean: config.cleanSession ?? false, // Persistent session for QoS 1/2
      keepalive: config.keepAlive ?? DEFAULT_KEEPALIVE,
      reconnectPeriod: config.reconnectPeriod ?? DEFAULT_RECONNECT_PERIOD,
      connectTimeout: config.connectTimeout ?? DEFAULT_CONNECT_TIMEOUT,
      username: config.username,
      password: config.password,
      // Last Will and Testament for presence
      will: {
        topic: `mango/${config.storeId}/devices/${config.deviceId}/presence`,
        payload: JSON.stringify({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          version: MESSAGE_VERSION,
          source: {
            deviceId: config.deviceId,
            deviceType: config.deviceType,
            storeId: config.storeId,
          },
          payload: { status: 'offline' },
        }),
        qos: 1,
        retain: true,
      },
    };

    return new Promise((resolve) => {
      try {
        this.client = mqtt.connect(url, options);

        const connectTimeout = setTimeout(() => {
          if (this.connectionState === 'connecting') {
            this.updateState('error', new Error('Connection timeout'));
            this.client?.end(true);
            resolve(false);
          }
        }, options.connectTimeout);

        this.client.on('connect', () => {
          clearTimeout(connectTimeout);
          this.connectedAt = new Date();
          this.hasLoggedConnectionError = false; // Reset error flag on successful connection
          this.updateState('connected');
          this.resubscribeAll();
          resolve(true);
        });

        this.client.on('reconnect', () => {
          this.updateState('reconnecting');
        });

        this.client.on('close', () => {
          if (this.connectionState !== 'disconnected') {
            this.updateState('disconnected');
          }
        });

        this.client.on('error', (error) => {
          clearTimeout(connectTimeout);
          // Only log the first connection error to avoid console spam
          if (!this.hasLoggedConnectionError) {
            console.error('[MQTT] Connection error:', error.message);
            this.hasLoggedConnectionError = true;
          }
          this.updateState('error', error);
          resolve(false);
        });

        this.client.on('message', (topic, payload) => {
          this.handleMessage(topic, payload);
        });

        this.client.on('offline', () => {
          this.updateState('disconnected');
        });
      } catch (error) {
        this.updateState('error', error as Error);
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the broker
   */
  async disconnect(): Promise<void> {
    if (!this.client) return;

    return new Promise((resolve) => {
      this.client?.end(false, {}, () => {
        this.client = null;
        this.connectedAt = null;
        this.updateState('disconnected');
        resolve();
      });
    });
  }

  /**
   * Force disconnect (immediate)
   */
  forceDisconnect(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.connectedAt = null;
      this.updateState('disconnected');
    }
  }

  // =============================================================================
  // Publishing
  // =============================================================================

  /**
   * Publish a message to a topic
   */
  async publish<T>(
    topic: string,
    payload: T,
    options?: MqttPublishOptions
  ): Promise<void> {
    if (!this.client || this.connectionState !== 'connected') {
      throw new Error('MQTT client not connected');
    }

    if (!this.config) {
      throw new Error('MQTT client not configured');
    }

    const qos = options?.qos ?? getQosForTopic(topic);
    const retain = options?.retain ?? false;

    const message: MqttMessage<T> = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      version: MESSAGE_VERSION,
      source: {
        deviceId: this.config.deviceId,
        deviceType: this.config.deviceType,
        storeId: this.config.storeId,
      },
      payload,
    };

    return new Promise((resolve, reject) => {
      this.client?.publish(
        topic,
        JSON.stringify(message),
        { qos, retain },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // =============================================================================
  // Subscriptions
  // =============================================================================

  /**
   * Subscribe to a topic
   * Returns an unsubscribe function
   */
  subscribe(topic: string, handler: MqttMessageHandler): () => void {
    // Add handler to local map
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(handler);

    // Subscribe on broker if connected
    if (this.client && this.connectionState === 'connected') {
      const qos = getQosForTopic(topic);
      this.client.subscribe(topic, { qos });
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(topic);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscriptions.delete(topic);
          if (this.client && this.connectionState === 'connected') {
            this.client.unsubscribe(topic);
          }
        }
      }
    };
  }

  /**
   * Resubscribe to all topics (after reconnect)
   */
  private resubscribeAll(): void {
    if (!this.client) return;

    for (const topic of this.subscriptions.keys()) {
      const qos = getQosForTopic(topic);
      this.client.subscribe(topic, { qos });
    }
  }

  // =============================================================================
  // Message Handling
  // =============================================================================

  /**
   * Handle incoming message
   */
  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const message = JSON.parse(payload.toString()) as MqttMessage;

      // Check for duplicate
      if (this.deduplicator.isDuplicate(message.id)) {
        console.debug(`[MQTT] Duplicate message ${message.id}, skipping`);
        return;
      }
      this.deduplicator.markProcessed(message.id);

      // Find matching handlers
      for (const [pattern, handlers] of this.subscriptions.entries()) {
        if (this.topicMatches(topic, pattern)) {
          for (const handler of handlers) {
            try {
              handler(topic, message);
            } catch (error) {
              console.error('[MQTT] Handler error:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('[MQTT] Failed to parse message:', error);
    }
  }

  /**
   * Check if topic matches pattern (supports + and # wildcards)
   */
  private topicMatches(topic: string, pattern: string): boolean {
    const topicParts = topic.split('/');
    const patternParts = pattern.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];

      if (patternPart === '#') {
        return true;
      }

      if (patternPart === '+') {
        if (i >= topicParts.length) {
          return false;
        }
        continue;
      }

      if (i >= topicParts.length || topicParts[i] !== patternPart) {
        return false;
      }
    }

    return topicParts.length === patternParts.length;
  }

  // =============================================================================
  // State Management
  // =============================================================================

  /**
   * Update connection state and notify listeners
   */
  private updateState(state: MqttConnectionState, error?: Error): void {
    this.connectionState = state;
    this.lastError = error ?? null;

    const info = this.getConnectionInfo();
    for (const listener of this.stateListeners) {
      try {
        listener(info);
      } catch (e) {
        console.error('[MQTT] State listener error:', e);
      }
    }
  }

  /**
   * Get current connection info
   */
  getConnectionInfo(): MqttConnectionInfo {
    return {
      state: this.connectionState,
      brokerType: this.brokerType,
      brokerUrl: this.brokerUrl,
      clientId: this.clientId,
      connectedAt: this.connectedAt,
      error: this.lastError,
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(listener: (info: MqttConnectionInfo) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Get current broker type
   */
  getBrokerType(): MqttBrokerType | null {
    return this.brokerType;
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  /**
   * Destroy the client and cleanup resources
   */
  destroy(): void {
    this.forceDisconnect();
    this.deduplicator.destroy();
    this.subscriptions.clear();
    this.stateListeners.clear();
    this.config = null;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let instance: MqttClient | null = null;

/**
 * Get the MQTT client singleton instance
 */
export function getMqttClient(): MqttClient {
  if (!instance) {
    instance = new MqttClient();
  }
  return instance;
}

/**
 * Destroy the MQTT client singleton
 */
export function destroyMqttClient(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
