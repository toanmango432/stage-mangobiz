/**
 * MQTT Client Service for Mango Pad
 * Handles connection to MQTT broker and message handling
 * Supports offline queuing via syncQueueService
 */

import mqtt, { type MqttClient as MqttClientType, type IClientOptions } from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import type { MqttConnectionStatus } from '@/types';
import { syncQueueService, type QueuedMessage } from './syncQueue';

export interface MqttMessage<T = unknown> {
  id: string;
  timestamp: string;
  payload: T;
}

export type MessageHandler<T = unknown> = (topic: string, message: MqttMessage<T>) => void;

type ConnectionStateCallback = (status: MqttConnectionStatus) => void;
type ReconnectCallback = () => void;

class MqttService {
  private client: MqttClientType | null = null;
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private connectionState: MqttConnectionStatus = 'disconnected';
  private stateCallbacks: Set<ConnectionStateCallback> = new Set();
  private reconnectCallbacks: Set<ReconnectCallback> = new Set();
  private deviceId: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private queueEnabled = true;

  constructor() {
    this.deviceId = `mango-pad-${uuidv4().slice(0, 8)}`;
    this.setupSyncQueueReplayHandler();
  }

  private setupSyncQueueReplayHandler(): void {
    syncQueueService.setReplayHandler(async (message: QueuedMessage) => {
      if (!this.client?.connected) return false;
      
      try {
        const mqttMessage: MqttMessage = {
          id: message.id,
          timestamp: message.timestamp,
          payload: message.payload,
        };

        return new Promise((resolve) => {
          this.client!.publish(
            message.topic,
            JSON.stringify(mqttMessage),
            { qos: 1 },
            (error: Error | undefined) => {
              resolve(!error);
            }
          );
        });
      } catch {
        return false;
      }
    });
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

  onReconnect(callback: ReconnectCallback): () => void {
    this.reconnectCallbacks.add(callback);
    return () => {
      this.reconnectCallbacks.delete(callback);
    };
  }

  setQueueEnabled(enabled: boolean): void {
    this.queueEnabled = enabled;
  }

  private setConnectionState(state: MqttConnectionStatus): void {
    const wasDisconnected = this.connectionState === 'disconnected' || this.connectionState === 'reconnecting';
    this.connectionState = state;
    this.stateCallbacks.forEach((cb) => cb(state));

    if (state === 'connected' && wasDisconnected) {
      this.onReconnected();
    }

    if (state === 'disconnected') {
      syncQueueService.startOfflineTracking();
    } else if (state === 'connected') {
      syncQueueService.stopOfflineTracking();
    }
  }

  private async onReconnected(): Promise<void> {
    this.reconnectCallbacks.forEach((cb) => cb());
    
    const result = await syncQueueService.replayQueue();
    if (result.success > 0 || result.failed > 0) {
      console.log(`[MqttService] Replayed queue: ${result.success} success, ${result.failed} failed`);
    }
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

      this.client.on('error', (error: Error) => {
        console.error('[MqttService] Error:', error);
        this.setConnectionState('disconnected');
        reject(error);
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
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
        this.client.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            console.error(`[MqttClient] Subscription FAILED for ${topic}:`, err);
          } else {
            console.log(`[MqttClient] Subscription SUCCESS for ${topic}`);
          }
        });
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
    options?: { qos?: 0 | 1 | 2; retain?: boolean; skipQueue?: boolean }
  ): Promise<void> {
    const message: MqttMessage<T> = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload,
    };

    if (!this.client?.connected) {
      if (this.queueEnabled && !options?.skipQueue) {
        syncQueueService.enqueue(topic, payload, options?.qos ?? 1);
        console.log(`[MqttService] Message queued for topic: ${topic}`);
        return;
      }
      throw new Error('MQTT not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(
        topic,
        JSON.stringify(message),
        { qos: options?.qos ?? 1, retain: options?.retain ?? false },
        (error: Error | undefined) => {
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

  getQueuedMessageCount(): number {
    return syncQueueService.getQueueSize();
  }

  getOfflineDuration(): number {
    return syncQueueService.getOfflineDuration();
  }

  isOfflineAlertThresholdReached(): boolean {
    return syncQueueService.isOfflineAlertThresholdReached();
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
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`[MqttClient] Subscription FAILED for ${topic}:`, err);
        } else {
          console.log(`[MqttClient] Subscription SUCCESS for ${topic}`);
        }
      });
    });
  }
}

export const mqttService = new MqttService();
