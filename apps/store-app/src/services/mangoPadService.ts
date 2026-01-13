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
 */

import { getMqttClient } from './mqtt/MqttClient';
import { buildTopic, TOPIC_PATTERNS } from './mqtt/topics';
import { isMqttEnabled } from './mqtt/featureFlags';
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

export class MangoPadService {
  private storeId: string | null = null;
  private stationId: string | null = null;

  setStoreId(storeId: string): void {
    this.storeId = storeId;
    // Station ID is this device's fingerprint (device-to-device pairing)
    this.stationId = getOrCreateDeviceId();
  }

  getStoreId(): string | null {
    return this.storeId;
  }

  getStationId(): string | null {
    return this.stationId;
  }

  private ensureIds(): { storeId: string; stationId: string } {
    if (!this.storeId) {
      throw new Error('MangoPadService: storeId not set. Call setStoreId() first.');
    }
    if (!this.stationId) {
      this.stationId = getOrCreateDeviceId();
    }
    return { storeId: this.storeId, stationId: this.stationId };
  }

  private ensureMqttEnabled(): void {
    if (!isMqttEnabled()) {
      throw new Error('MQTT is not enabled. Check feature flags.');
    }
  }

  async sendReadyToPay(transaction: PadTransaction): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();
    const mqttClient = getMqttClient();

    if (!mqttClient.isConnected()) {
      throw new Error('MQTT client is not connected');
    }

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

    console.log('[MangoPadService] Publishing ready_to_pay to station:', stationId);
    await mqttClient.publish(topic, payload, { qos: 1 });
  }

  async sendPaymentResult(result: PaymentResult): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();
    const mqttClient = getMqttClient();

    if (!mqttClient.isConnected()) {
      throw new Error('MQTT client is not connected');
    }

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

    console.log('[MangoPadService] Publishing payment_result to station:', stationId);
    await mqttClient.publish(topic, payload, { qos: 1 });
  }

  async sendCancel(cancel: CancelTransaction): Promise<void> {
    this.ensureMqttEnabled();
    const { storeId, stationId } = this.ensureIds();
    const mqttClient = getMqttClient();

    if (!mqttClient.isConnected()) {
      throw new Error('MQTT client is not connected');
    }

    const topic = buildTopic(TOPIC_PATTERNS.PAD_CANCEL, { storeId, stationId });
    const payload: PadCancelPayload = {
      transactionId: cancel.transactionId,
      ticketId: cancel.ticketId,
      reason: cancel.reason,
    };

    console.log('[MangoPadService] Publishing cancel to station:', stationId);
    await mqttClient.publish(topic, payload, { qos: 1 });
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
  instance = null;
}
