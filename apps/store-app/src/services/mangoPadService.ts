/**
 * Mango Pad Service
 * Handles communication between Store App (POS) and Mango Pad devices via MQTT
 *
 * Store App publishes:
 * - ready_to_pay: Send transaction to Pad for customer checkout
 * - payment_result: Send payment success/failure to Pad
 * - cancel: Cancel current transaction on Pad
 */

import { getMqttClient } from './mqtt/MqttClient';
import { buildTopic, TOPIC_PATTERNS } from './mqtt/topics';
import { isMqttEnabled } from './mqtt/featureFlags';
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

  setStoreId(storeId: string): void {
    this.storeId = storeId;
  }

  getStoreId(): string | null {
    return this.storeId;
  }

  private ensureStoreId(): string {
    if (!this.storeId) {
      throw new Error('MangoPadService: storeId not set. Call setStoreId() first.');
    }
    return this.storeId;
  }

  private ensureMqttEnabled(): void {
    if (!isMqttEnabled()) {
      throw new Error('MQTT is not enabled. Check feature flags.');
    }
  }

  async sendReadyToPay(transaction: PadTransaction): Promise<void> {
    this.ensureMqttEnabled();
    const storeId = this.ensureStoreId();
    const mqttClient = getMqttClient();

    if (!mqttClient.isConnected()) {
      throw new Error('MQTT client is not connected');
    }

    const topic = buildTopic(TOPIC_PATTERNS.PAD_READY_TO_PAY, { storeId });
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

    await mqttClient.publish(topic, payload, { qos: 1 });
  }

  async sendPaymentResult(result: PaymentResult): Promise<void> {
    this.ensureMqttEnabled();
    const storeId = this.ensureStoreId();
    const mqttClient = getMqttClient();

    if (!mqttClient.isConnected()) {
      throw new Error('MQTT client is not connected');
    }

    const topic = buildTopic(TOPIC_PATTERNS.PAD_PAYMENT_RESULT, { storeId });
    const payload: PadPaymentResultPayload = {
      transactionId: result.transactionId,
      ticketId: result.ticketId,
      success: result.success,
      cardLast4: result.cardLast4,
      cardBrand: result.cardBrand,
      authCode: result.authCode,
      errorMessage: result.errorMessage,
    };

    await mqttClient.publish(topic, payload, { qos: 1 });
  }

  async sendCancel(cancel: CancelTransaction): Promise<void> {
    this.ensureMqttEnabled();
    const storeId = this.ensureStoreId();
    const mqttClient = getMqttClient();

    if (!mqttClient.isConnected()) {
      throw new Error('MQTT client is not connected');
    }

    const topic = buildTopic(TOPIC_PATTERNS.PAD_CANCEL, { storeId });
    const payload: PadCancelPayload = {
      transactionId: cancel.transactionId,
      ticketId: cancel.ticketId,
      reason: cancel.reason,
    };

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
