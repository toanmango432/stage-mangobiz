/**
 * MQTT Client Service for Mango Pad
 * Handles connection to MQTT broker and message handling
 */

import mqtt, { type MqttClient as MqttClientType, type IClientOptions } from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import type { MqttConnectionStatus } from '@/types';

export interface MqttMessage<T = unknown> {
  id: string;
  timestamp: string;
  payload: T;
}

export type MessageHandler<T = unknown> = (topic: string, message: MqttMessage<T>) => void;

type ConnectionStateCallback = (status: MqttConnectionStatus) => void;

class MqttService {
  private client: MqttClientType | null = null;
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private connectionState: MqttConnectionStatus = 'disconnected';
  private stateCallbacks: Set<ConnectionStateCallback> = new Set();
  private deviceId: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.deviceId = `mango-pad-${uuidv4().slice(0, 8)}`;
  }

  getConnectionState(): MqttConnectionStatus {
    return this.connectionState;
  }

  onStateChange(callback: ConnectionStateCallback): () => void {
    this.stateCallbacks.add(callback);
    callback(this.connectionState);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  private setConnectionState(state: MqttConnectionStatus): void {
    this.connectionState = state;
    this.stateCallbacks.forEach((cb) => cb(state));
  }

  async connect(brokerUrl: string): Promise<void> {
    if (this.client) {
      this.disconnect();
    }

    const options: IClientOptions = {
      clientId: this.deviceId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    return new Promise((resolve, reject) => {
      this.setConnectionState('reconnecting');

      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.setConnectionState('connected');
        this.resubscribeAll();
        resolve();
      });

      this.client.on('reconnect', () => {
        this.setConnectionState('reconnecting');
      });

      this.client.on('offline', () => {
        this.setConnectionState('disconnected');
      });

      this.client.on('error', (error) => {
        console.error('[MqttService] Error:', error);
        this.setConnectionState('disconnected');
        reject(error);
      });

      this.client.on('message', (topic, payload) => {
        try {
          const message: MqttMessage = JSON.parse(payload.toString());
          this.handleMessage(topic, message);
        } catch (e) {
          try {
            const rawPayload = JSON.parse(payload.toString());
            const message: MqttMessage = {
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              payload: rawPayload,
            };
            this.handleMessage(topic, message);
          } catch (err) {
            console.error('[MqttService] Failed to parse message:', err);
          }
        }
      });
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    this.setConnectionState('disconnected');
  }

  subscribe<T>(topic: string, handler: MessageHandler<T>): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      if (this.client?.connected) {
        this.client.subscribe(topic, { qos: 1 });
      }
    }
    this.subscriptions.get(topic)!.add(handler as MessageHandler);

    return () => {
      const handlers = this.subscriptions.get(topic);
      if (handlers) {
        handlers.delete(handler as MessageHandler);
        if (handlers.size === 0) {
          this.subscriptions.delete(topic);
          if (this.client?.connected) {
            this.client.unsubscribe(topic);
          }
        }
      }
    };
  }

  async publish<T>(
    topic: string,
    payload: T,
    options?: { qos?: 0 | 1 | 2; retain?: boolean }
  ): Promise<void> {
    if (!this.client?.connected) {
      throw new Error('MQTT not connected');
    }

    const message: MqttMessage<T> = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload,
    };

    return new Promise((resolve, reject) => {
      this.client!.publish(
        topic,
        JSON.stringify(message),
        { qos: options?.qos ?? 1, retain: options?.retain ?? false },
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

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  private handleMessage<T>(topic: string, message: MqttMessage<T>): void {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          (handler as MessageHandler<T>)(topic, message);
        } catch (e) {
          console.error('[MqttService] Handler error:', e);
        }
      });
    }
  }

  private resubscribeAll(): void {
    if (!this.client?.connected) return;
    this.subscriptions.forEach((_, topic) => {
      this.client!.subscribe(topic, { qos: 1 });
    });
  }
}

export const mqttService = new MqttService();
