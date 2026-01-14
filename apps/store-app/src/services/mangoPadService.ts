/**
 * Mango Pad Service
 * Handles communication between Store App (POS) and Mango Pad devices via MQTT
 *
 * Device-to-Device (1:1) Architecture:
 * - Each Store App station has a unique stationId (device fingerprint)
 * - Topics include stationId: salon/{storeId}/station/{stationId}/pad/...
 * - Only the Mango Pad paired to this station receives messages
 *
 * Store App publishes:
 * - ready_to_pay: Send transaction to Pad for customer checkout
 * - payment_result: Send payment success/failure to Pad
 * - cancel: Cancel current transaction on Pad
 *
 * Connection: Uses direct MQTT connection to cloud broker (same as usePadHeartbeat)
 */

import mqtt, { type MqttClient } from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import { buildTopic, TOPIC_PATTERNS } from './mqtt/topics';
import { isMqttEnabled, getCloudBrokerUrl } from './mqtt/featureFlags';
import { getOrCreateDeviceId } from './deviceRegistration';
import type {
  PadReadyToPayPayload,
  PadPaymentResultPayload,
  PadCancelPayload,
  PadTransactionItem,
} from './mqtt/types';

export type { PadTransactionItem };

export interface PadTransaction {
  transactionId: string;
  ticketId: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName?: string;
  items: PadTransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  suggestedTips: number[];
}

export interface PaymentResult {
  transactionId: string;
  ticketId: string;
  success: boolean;
  cardLast4?: string;
  cardBrand?: string;
  authCode?: string;
  errorMessage?: string;
}

export interface CancelTransaction {
  transactionId: string;
  ticketId: string;
  reason?: string;
}

/**
 * MQTT Message envelope format expected by Mango Pad
 */
interface MqttMessageEnvelope<T> {
  id: string;
  timestamp: string;
  payload: T;
}

export class MangoPadService {
  private storeId: string | null = null;
  private stationId: string | null = null;
  private client: MqttClient | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  setStoreId(storeId: string): void {
    // In dev mode, ALWAYS use VITE_STORE_ID (demo-salon) for consistent pairing with Mango Pad
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
    const envStoreId = import.meta.env.VITE_STORE_ID;
    this.storeId = (isDevMode && envStoreId) ? envStoreId : storeId;

    // Station ID is this device's fingerprint (device-to-device pairing)
    this.stationId = getOrCreateDeviceId();

    console.log('[MangoPadService] Configured with storeId:', this.storeId, 'stationId:', this.stationId);
  }

  getStoreId(): string | null {
    return this.storeId;
  }

  getStationId(): string | null {
    return this.stationId;
  }

  private ensureIds(): { storeId: string; stationId: string } {
    // In dev mode, auto-configure with env variables if not already set
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
    const envStoreId = import.meta.env.VITE_STORE_ID;

    if (!this.storeId) {
      if (isDevMode && envStoreId) {
        this.storeId = envStoreId;
        console.log('[MangoPadService] Auto-configured storeId from env:', this.storeId);
      } else {
        throw new Error('MangoPadService: storeId not set. Call setStoreId() first.');
      }
    }
    if (!this.stationId) {
      this.stationId = getOrCreateDeviceId();
    }
    // TypeScript doesn't narrow class fields after control flow, so use assertion
    return { storeId: this.storeId as string, stationId: this.stationId as string };
  }

  private ensureMqttEnabled(): void {
    if (!isMqttEnabled()) {
      throw new Error('MQTT is not enabled. Check feature flags.');
    }
  }

  /**
   * Connect to the cloud MQTT broker
   * Uses the same approach as usePadHeartbeat hook for consistency
   */
  async connect(): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      console.log('[MangoPadService] Already connecting, reusing promise');
      return this.connectionPromise;
    }

    // Already connected
    if (this.client?.connected) {
      console.log('[MangoPadService] Already connected');
      return Promise.resolve();
    }

    this.isConnecting = true;
    const { stationId } = this.ensureIds();
    const brokerUrl = getCloudBrokerUrl();

    console.log('[MangoPadService] Connecting to cloud broker:', brokerUrl, 'stationId:', stationId);

    this.connectionPromise = new Promise((resolve, reject) => {
      const client = mqtt.connect(brokerUrl, {
        clientId: `mango-pad-service-${stationId}-${Date.now()}`,
        clean: true,
        keepalive: 30,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });

      const timeout = setTimeout(() => {
        this.isConnecting = false;
        this.connectionPromise = null;
        client.end(true);
        reject(new Error('MQTT connection timeout'));
      }, 15000);

      client.on('connect', () => {
        clearTimeout(timeout);
        this.client = client;
        this.isConnecting = false;
        console.log('[MangoPadService] Connected to cloud broker');
        resolve();
      });

      client.on('error', (err) => {
        console.error('[MangoPadService] MQTT error:', err);
        if (this.isConnecting) {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(err);
        }
      });

      client.on('close', () => {
        console.log('[MangoPadService] MQTT connection closed');
      });

      client.on('reconnect', () => {
        console.log('[MangoPadService] MQTT reconnecting...');
      });
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    this.connectionPromise = null;
    this.isConnecting = false;
  }

  /**
   * Check if connected to MQTT broker
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Wrap payload in message envelope format expected by Mango Pad
   */
  private wrapPayload<T>(payload: T): MqttMessageEnvelope<T> {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  /**
   * Publish message with automatic connection handling
   */
  private async publishMessage<T>(topic: string, payload: T): Promise<void> {
    // Auto-connect if not connected
    if (!this.client?.connected) {
      await this.connect();
    }

    // Safety check - if still not connected after connect(), throw
    if (!this.client) {
      throw new Error('MangoPadService: Failed to connect to MQTT broker');
    }

    const message = this.wrapPayload(payload);

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
        if (err) {
          console.error('[MangoPadService] Publish error:', err);
          reject(err);
        } else {
          console.log('[MangoPadService] Published to:', topic);
          resolve();
        }
      });
    });
  }

  async sendReadyToPay(transaction: PadTransaction): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();

    const topic = buildTopic(TOPIC_PATTERNS.PAD_READY_TO_PAY, { storeId, stationId });
    const payload: PadReadyToPayPayload = {
      transactionId: transaction.transactionId,
      ticketId: transaction.ticketId,
      clientId: transaction.clientId,
      clientName: transaction.clientName,
      clientEmail: transaction.clientEmail,
      clientPhone: transaction.clientPhone,
      staffName: transaction.staffName,
      items: transaction.items,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      discount: transaction.discount,
      total: transaction.total,
      suggestedTips: transaction.suggestedTips,
    };

    console.log('[MangoPadService] Sending ready_to_pay to station:', stationId);
    await this.publishMessage(topic, payload);
  }

  async sendPaymentResult(result: PaymentResult): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();

    const topic = buildTopic(TOPIC_PATTERNS.PAD_PAYMENT_RESULT, { storeId, stationId });
    const payload: PadPaymentResultPayload = {
      transactionId: result.transactionId,
      ticketId: result.ticketId,
      success: result.success,
      cardLast4: result.cardLast4,
      cardBrand: result.cardBrand,
      authCode: result.authCode,
      errorMessage: result.errorMessage,
    };

    console.log('[MangoPadService] Sending payment_result to station:', stationId);
    await this.publishMessage(topic, payload);
  }

  async sendCancel(cancel: CancelTransaction): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();

    const topic = buildTopic(TOPIC_PATTERNS.PAD_CANCEL, { storeId, stationId });
    const payload: PadCancelPayload = {
      transactionId: cancel.transactionId,
      ticketId: cancel.ticketId,
      reason: cancel.reason,
    };

    console.log('[MangoPadService] Sending cancel to station:', stationId);
    await this.publishMessage(topic, payload);
  }

  /**
   * Send a staff control action to Mango Pad
   * Common helper for skip/force actions
   */
  private async sendStaffControl(
    transactionId: string,
    topicPattern: string,
    timestampField: string
  ): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();

    const topic = buildTopic(topicPattern, { storeId, stationId });
    const payload = {
      transactionId,
      [timestampField]: new Date().toISOString(),
    };

    await this.publishMessage(topic, payload);
  }

  /**
   * Skip the tip step on Mango Pad (staff override)
   */
  async skipTip(transactionId: string): Promise<void> {
    await this.sendStaffControl(transactionId, TOPIC_PATTERNS.POS_SKIP_TIP, 'skippedAt');
  }

  /**
   * Skip the signature step on Mango Pad (staff override)
   */
  async skipSignature(transactionId: string): Promise<void> {
    await this.sendStaffControl(transactionId, TOPIC_PATTERNS.POS_SKIP_SIGNATURE, 'skippedAt');
  }

  /**
   * Force complete the transaction on Mango Pad (staff override)
   */
  async forceComplete(transactionId: string): Promise<void> {
    await this.sendStaffControl(transactionId, TOPIC_PATTERNS.POS_FORCE_COMPLETE, 'forcedAt');
  }

  /**
   * Cancel a transaction on Mango Pad (convenience wrapper)
   */
  async cancelTransaction(ticketId: string, transactionId: string, reason?: string): Promise<void> {
    await this.sendCancel({
      transactionId,
      ticketId,
      reason: reason || 'Cancelled by staff',
    });
  }
}

let instance: MangoPadService | null = null;

export function getMangoPadService(): MangoPadService {
  if (!instance) {
    instance = new MangoPadService();
  }
  return instance;
}

export function destroyMangoPadService(): void {
  if (instance) {
    instance.disconnect();
  }
  instance = null;
}
