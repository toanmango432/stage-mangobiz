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
import { getMqttClient, MqttClient } from './MqttClient';
import { TOPIC_PATTERNS, buildTopic } from './topics';
import type { MqttMessage, DevicePresencePayload, MqttConfig, MqttBrokerType } from './types';

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
  private unsubscribeFunctions: Map<string, () => void> = new Map();
  private stateUnsubscribe: (() => void) | null = null;
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
    this.client = getMqttClient();

    // Set up connection status listeners
    this.setupConnectionListeners();

    this.isInitialized = true;
    console.log('[MqttBridge] Initialized');
  }

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('MqttBridge not initialized');
    }

    try {
      // Determine broker URL and type
      const brokerUrl = this.config.localBrokerUrl || this.config.cloudBrokerUrl || 'ws://localhost:9001';
      const brokerType: MqttBrokerType = this.config.localBrokerUrl ? 'local' : 'cloud';

      const mqttConfig: MqttConfig = {
        storeId: this.config.storeId,
        deviceId: this.config.deviceId,
        deviceType: this.config.deviceType,
        cloudBrokerUrl: this.config.cloudBrokerUrl || 'wss://mqtt.mango.cloud:8883',
        localBrokerUrl: this.config.localBrokerUrl,
      };

      await this.client.connect(brokerUrl, mqttConfig, brokerType);

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
    // Clean up subscriptions
    for (const unsubscribe of this.unsubscribeFunctions.values()) {
      unsubscribe();
    }
    this.unsubscribeFunctions.clear();
    this.eventHandlers.clear();

    // Clean up state listener
    if (this.stateUnsubscribe) {
      this.stateUnsubscribe();
      this.stateUnsubscribe = null;
    }

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

    // Subscribe to state changes using onStateChange
    this.stateUnsubscribe = this.client.onStateChange((info) => {
      if (info.state === 'connected') {
        console.log(`[MqttBridge] Connected to ${info.brokerType} broker`);
        store.dispatch(
          setMqttConnected({ connected: true, connectionType: info.brokerType })
        );
      } else if (info.state === 'disconnected') {
        console.log('[MqttBridge] Disconnected');
        store.dispatch(setMqttConnected({ connected: false, connectionType: null }));
      } else if (info.state === 'error' && info.error) {
        console.error('[MqttBridge] Error:', info.error.message);
        store.dispatch(setMqttError(info.error.message));
      }
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

    // Subscribe returns an unsubscribe function
    const unsubscribe = this.client.subscribe(presenceTopic, (topic, message) => {
      this.handleMessage(topic, message);
    });
    this.unsubscribeFunctions.set(presenceTopic, unsubscribe);
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

    await this.client.publish(topic, payload, { qos: 1, retain: true }); // QoS 1, retained
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

    // Map action to topic pattern
    const topicPatternMap: Record<string, string> = {
      created: TOPICS.APPOINTMENT_CREATED,
      updated: TOPICS.APPOINTMENT_UPDATED,
      deleted: TOPICS.APPOINTMENT_DELETED,
      checked_in: TOPICS.APPOINTMENT_STATUS,
    };

    const topicPattern = topicPatternMap[action] || TOPICS.APPOINTMENT_UPDATED;
    const topic = buildTopic(topicPattern, {
      storeId: this.config.storeId,
    });

    await this.client.publish(
      topic,
      { appointmentId, action, data, timestamp: new Date().toISOString() },
      { qos: 1 } // QoS 1 for reliable delivery
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

    // Map action to topic pattern
    const topicPatternMap: Record<string, string> = {
      created: TOPICS.TICKET_CREATED,
      updated: TOPICS.TICKET_UPDATED,
      closed: TOPICS.TICKET_COMPLETED,
      voided: TOPICS.TICKET_VOIDED,
    };

    const topicPattern = topicPatternMap[action] || TOPICS.TICKET_UPDATED;
    const topic = buildTopic(topicPattern, {
      storeId: this.config.storeId,
    });

    await this.client.publish(
      topic,
      { ticketId, action, data, timestamp: new Date().toISOString() },
      { qos: 1 } // QoS 1 for reliable delivery
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
      { qos: 1 } // QoS 1 for reliable delivery
    );
  }

  // ===========================================================================
  // Event Subscription
  // ===========================================================================

  /**
   * Subscribe to a specific event topic
   */
  subscribeToEvent(topic: string, handler: EventHandler): void {
    if (!this.client) return;

    const handlers = this.eventHandlers.get(topic) || [];
    handlers.push(handler);
    this.eventHandlers.set(topic, handlers);

    // If not already subscribed at MQTT level, subscribe now
    if (!this.unsubscribeFunctions.has(topic)) {
      const unsubscribe = this.client.subscribe(topic, (t, message) => {
        this.handleMessage(t, message);
      });
      this.unsubscribeFunctions.set(topic, unsubscribe);
    }
  }

  /**
   * Unsubscribe from a specific event topic
   */
  unsubscribeFromEvent(topic: string, handler?: EventHandler): void {
    if (!this.client) return;

    if (handler) {
      const handlers = this.eventHandlers.get(topic) || [];
      const filtered = handlers.filter((h) => h !== handler);
      this.eventHandlers.set(topic, filtered);

      if (filtered.length === 0) {
        // Call the unsubscribe function
        const unsubscribe = this.unsubscribeFunctions.get(topic);
        if (unsubscribe) {
          unsubscribe();
          this.unsubscribeFunctions.delete(topic);
        }
        this.eventHandlers.delete(topic);
      }
    } else {
      // Call the unsubscribe function
      const unsubscribe = this.unsubscribeFunctions.get(topic);
      if (unsubscribe) {
        unsubscribe();
        this.unsubscribeFunctions.delete(topic);
      }
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
    return this.client?.getBrokerType() || null;
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
