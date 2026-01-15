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
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private currentBrokerUrl: string | null = null;

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
    // If already connected to the same broker, return immediately
    if (this.client?.connected && this.currentBrokerUrl === brokerUrl) {
      console.log('[MqttService] Already connected to', brokerUrl);
      return Promise.resolve();
    }

    // If already connecting to the same broker, return the existing promise
    if (this.isConnecting && this.connectionPromise && this.currentBrokerUrl === brokerUrl) {
      console.log('[MqttService] Connection in progress, reusing promise');
      return this.connectionPromise;
    }

    // Disconnect existing client if any (different broker or stale connection)
    if (this.client) {
      console.log('[MqttService] Disconnecting existing client before reconnecting');
      this.client.removeAllListeners();
      this.client.end(true);
      this.client = null;
    }

    this.isConnecting = true;
    this.currentBrokerUrl = brokerUrl;

    const options: IClientOptions = {
      clientId: this.deviceId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    this.connectionPromise = new Promise((resolve, reject) => {
      this.setConnectionState('reconnecting');

      console.log('[MqttService] Connecting to', brokerUrl);
      this.client = mqtt.connect(brokerUrl, options);

      const connectTimeout = setTimeout(() => {
        if (this.isConnecting) {
          console.error('[MqttService] Connection timeout');
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(new Error('Connection timeout'));
        }
      }, 15000);

      this.client.on('connect', () => {
        clearTimeout(connectTimeout);
        this.isConnecting = false;
        console.log('[MqttService] Connected successfully');
        this.setConnectionState('connected');
        this.resubscribeAll();
        resolve();
      });

      this.client.on('reconnect', () => {
        console.log('[MqttService] Reconnecting...');
        this.setConnectionState('reconnecting');
      });

      this.client.on('offline', () => {
        console.log('[MqttService] Went offline');
        this.setConnectionState('disconnected');
      });

      this.client.on('close', () => {
        console.log('[MqttService] Connection closed');
        // Don't set disconnected here - let reconnect handle it
      });

      this.client.on('error', (error: Error) => {
        console.error('[MqttService] Error:', error.message);
        // Only reject and clean up if we're still in the initial connect phase
        if (this.isConnecting) {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.setConnectionState('disconnected');
          reject(error);
        }
        // For errors after connection, let the library handle reconnect
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

    return this.connectionPromise;
  }

  disconnect(): void {
    console.log('[MqttService] Disconnecting...');
    this.isConnecting = false;
    this.connectionPromise = null;
    this.currentBrokerUrl = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end(true);
      this.client = null;
    }
    this.setConnectionState('disconnected');
  }

  subscribe<T>(topic: string, handler: MessageHandler<T>): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      // Only subscribe if client is connected and not disconnecting
      if (this.client?.connected && !this.client.disconnecting) {
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
          // Only unsubscribe if client is connected and not disconnecting
          if (this.client?.connected && !this.client.disconnecting) {
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

    // Check if client exists and is truly connected (not closing)
    const isReallyConnected = this.client?.connected && !this.client.disconnecting;

    if (!isReallyConnected) {
      if (this.queueEnabled && !options?.skipQueue) {
        syncQueueService.enqueue(topic, payload, options?.qos ?? 1);
        console.log(`[MqttService] Message queued for topic: ${topic}`);
        return;
      }
      throw new Error('MQTT not connected');
    }

    return new Promise((resolve, reject) => {
      // Double-check before publishing
      if (!this.client?.connected || this.client.disconnecting) {
        if (this.queueEnabled && !options?.skipQueue) {
          syncQueueService.enqueue(topic, payload, options?.qos ?? 1);
          console.log(`[MqttService] Message queued (client closing) for topic: ${topic}`);
          resolve();
          return;
        }
        reject(new Error('MQTT client closing'));
        return;
      }

      this.client.publish(
        topic,
        JSON.stringify(message),
        { qos: options?.qos ?? 1, retain: options?.retain ?? false },
        (error: Error | undefined) => {
          if (error) {
            // If publish fails due to connection issues, queue it
            if (this.queueEnabled && !options?.skipQueue && error.message.includes('CLOS')) {
              syncQueueService.enqueue(topic, payload, options?.qos ?? 1);
              console.log(`[MqttService] Message queued (publish failed) for topic: ${topic}`);
              resolve();
              return;
            }
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
    // Only resubscribe if client is connected and not disconnecting
    if (!this.client?.connected || this.client.disconnecting) return;
    console.log(`[MqttClient] Resubscribing to ${this.subscriptions.size} topics`);
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
