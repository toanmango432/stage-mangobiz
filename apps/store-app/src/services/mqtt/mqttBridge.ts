/**
 * MQTT Bridge Service
 * Bridges MQTT events to Redux store and vice versa
 *
 * Part of: MQTT Architecture Implementation (Phase 3)
 */

import { store } from '@/store';
import {
  setMqttConnected,
  setMqttError,
  upsertDiscoveredDevice,
  removeDiscoveredDevice,
  type DevicePresence,
} from '@/store/slices/syncSlice';
import { MqttClient } from './MqttClient';
import { TOPIC_PATTERNS, buildTopic } from './topics';
import type { MqttMessage, DevicePresencePayload } from './types';

// Alias for cleaner code
const TOPICS = TOPIC_PATTERNS;

// =============================================================================
// Types
// =============================================================================

interface MqttBridgeConfig {
  storeId: string;
  deviceId: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  localBrokerUrl?: string;
  cloudBrokerUrl?: string;
}

type EventHandler = (message: MqttMessage) => void;

// =============================================================================
// MqttBridgeService Class
// =============================================================================

class MqttBridgeService {
  private client: MqttClient | null = null;
  private config: MqttBridgeConfig | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private isInitialized = false;

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initialize the MQTT bridge with store and device info
   */
  async initialize(config: MqttBridgeConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('[MqttBridge] Already initialized');
      return;
    }

    this.config = config;
    this.client = MqttClient.getInstance();

    // Configure the client
    this.client.configure({
      storeId: config.storeId,
      deviceId: config.deviceId,
      deviceType: config.deviceType,
      localBrokerUrl: config.localBrokerUrl,
      cloudBrokerUrl: config.cloudBrokerUrl,
    });

    // Set up connection status listeners
    this.setupConnectionListeners();

    this.isInitialized = true;
    console.log('[MqttBridge] Initialized');
  }

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('MqttBridge not initialized');
    }

    try {
      await this.client.connect();

      // Subscribe to device presence for this store
      if (this.config?.storeId) {
        await this.subscribeToDevicePresence();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      store.dispatch(setMqttError(errorMessage));
      throw error;
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
    this.isInitialized = false;
    console.log('[MqttBridge] Disconnected');
  }

  // ===========================================================================
  // Connection Listeners
  // ===========================================================================

  private setupConnectionListeners(): void {
    if (!this.client) return;

    this.client.on('connected', (brokerType: 'local' | 'cloud') => {
      console.log(`[MqttBridge] Connected to ${brokerType} broker`);
      store.dispatch(
        setMqttConnected({ connected: true, connectionType: brokerType })
      );
    });

    this.client.on('disconnected', () => {
      console.log('[MqttBridge] Disconnected');
      store.dispatch(setMqttConnected({ connected: false, connectionType: null }));
    });

    this.client.on('error', (error: Error) => {
      console.error('[MqttBridge] Error:', error.message);
      store.dispatch(setMqttError(error.message));
    });

    this.client.on('message', (topic: string, message: MqttMessage) => {
      this.handleMessage(topic, message);
    });
  }

  // ===========================================================================
  // Device Presence
  // ===========================================================================

  private async subscribeToDevicePresence(): Promise<void> {
    if (!this.client || !this.config?.storeId) return;

    const presenceTopic = buildTopic(TOPICS.DEVICE_PRESENCE, {
      storeId: this.config.storeId,
      deviceId: '+', // Wildcard to receive all devices
    });

    await this.client.subscribe(presenceTopic, 1);
    console.log(`[MqttBridge] Subscribed to device presence: ${presenceTopic}`);
  }

  /**
   * Publish this device's presence
   */
  async publishPresence(isOnline: boolean): Promise<void> {
    if (!this.client || !this.config) {
      console.warn('[MqttBridge] Cannot publish presence - not initialized');
      return;
    }

    const topic = buildTopic(TOPICS.DEVICE_PRESENCE, {
      storeId: this.config.storeId,
      deviceId: this.config.deviceId,
    });

    const payload: DevicePresencePayload = {
      deviceId: this.config.deviceId,
      deviceName: `Device ${this.config.deviceId.substring(0, 8)}`,
      deviceType: this.config.deviceType,
      isOnline,
      timestamp: new Date().toISOString(),
    };

    await this.client.publish(topic, payload, 1, true); // QoS 1, retained
    console.log(`[MqttBridge] Published presence: ${isOnline ? 'online' : 'offline'}`);
  }

  // ===========================================================================
  // Message Handling
  // ===========================================================================

  private handleMessage(topic: string, message: MqttMessage): void {
    // Handle device presence messages
    if (topic.includes('/devices/') && topic.includes('/presence')) {
      this.handleDevicePresence(message);
      return;
    }

    // Dispatch to registered handlers
    const handlers = this.eventHandlers.get(topic) || [];
    handlers.forEach((handler) => handler(message));
  }

  private handleDevicePresence(message: MqttMessage): void {
    const payload = message.payload as DevicePresencePayload;

    if (!payload.deviceId) {
      console.warn('[MqttBridge] Invalid presence payload:', payload);
      return;
    }

    if (payload.isOnline === false) {
      // Device went offline
      store.dispatch(removeDiscoveredDevice(payload.deviceId));
    } else {
      // Device online - add/update
      const device: DevicePresence = {
        deviceId: payload.deviceId,
        deviceName: payload.deviceName || `Device ${payload.deviceId.substring(0, 8)}`,
        deviceType: payload.deviceType || 'web',
        localIp: payload.localIp || null,
        mqttPort: payload.mqttPort || 1883,
        isHub: payload.isHub || false,
        isOnline: true,
        lastSeenAt: new Date(),
      };
      store.dispatch(upsertDiscoveredDevice(device));
    }
  }

  // ===========================================================================
  // Event Publishing
  // ===========================================================================

  /**
   * Publish an appointment event
   */
  async publishAppointmentEvent(
    action: 'created' | 'updated' | 'deleted' | 'checked_in',
    appointmentId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.client || !this.config?.storeId) return;

    const topic = buildTopic(TOPICS.APPOINTMENTS, {
      storeId: this.config.storeId,
      action,
    });

    await this.client.publish(
      topic,
      { appointmentId, action, data, timestamp: new Date().toISOString() },
      1 // QoS 1 for reliable delivery
    );
  }

  /**
   * Publish a ticket event
   */
  async publishTicketEvent(
    action: 'created' | 'updated' | 'closed' | 'voided',
    ticketId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.client || !this.config?.storeId) return;

    const topic = buildTopic(TOPICS.TICKETS, {
      storeId: this.config.storeId,
      action,
    });

    await this.client.publish(
      topic,
      { ticketId, action, data, timestamp: new Date().toISOString() },
      1 // QoS 1 for reliable delivery
    );
  }

  /**
   * Publish a check-in event (walk-in customer)
   */
  async publishCheckinEvent(
    clientName: string,
    serviceIds: string[],
    staffId?: string
  ): Promise<void> {
    if (!this.client || !this.config?.storeId) return;

    const topic = buildTopic(TOPICS.CHECKIN_WALKIN, {
      storeId: this.config.storeId,
    });

    await this.client.publish(
      topic,
      {
        clientName,
        serviceIds,
        staffId,
        timestamp: new Date().toISOString(),
        deviceId: this.config.deviceId,
      },
      1 // QoS 1 for reliable delivery
    );
  }

  // ===========================================================================
  // Event Subscription
  // ===========================================================================

  /**
   * Subscribe to a specific event topic
   */
  async subscribeToEvent(topic: string, handler: EventHandler): Promise<void> {
    if (!this.client) return;

    const handlers = this.eventHandlers.get(topic) || [];
    handlers.push(handler);
    this.eventHandlers.set(topic, handlers);

    await this.client.subscribe(topic, 1);
  }

  /**
   * Unsubscribe from a specific event topic
   */
  async unsubscribeFromEvent(topic: string, handler?: EventHandler): Promise<void> {
    if (!this.client) return;

    if (handler) {
      const handlers = this.eventHandlers.get(topic) || [];
      const filtered = handlers.filter((h) => h !== handler);
      this.eventHandlers.set(topic, filtered);

      if (filtered.length === 0) {
        await this.client.unsubscribe(topic);
        this.eventHandlers.delete(topic);
      }
    } else {
      await this.client.unsubscribe(topic);
      this.eventHandlers.delete(topic);
    }
  }

  // ===========================================================================
  // Status
  // ===========================================================================

  /**
   * Check if bridge is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Check if connected to broker
   */
  isConnected(): boolean {
    return this.client?.isConnected() || false;
  }

  /**
   * Get current connection type
   */
  getConnectionType(): 'local' | 'cloud' | null {
    return this.client?.getConnectionType() || null;
  }

  /**
   * Get the underlying MQTT client for direct operations
   */
  getClient(): MqttClient | null {
    return this.client;
  }

  /**
   * Publish a raw message to a topic (for heartbeats and simple messages)
   */
  async publishRaw(topic: string, payload: unknown, qos: 0 | 1 | 2 = 0): Promise<void> {
    if (!this.client) {
      throw new Error('MqttBridge not initialized');
    }
    await this.client.publish(topic, payload, { qos });
  }
}

// Export singleton instance
export const mqttBridge = new MqttBridgeService();
export default mqttBridge;
