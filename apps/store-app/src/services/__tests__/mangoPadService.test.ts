/**
 * Mango Pad Service Tests
 *
 * Tests for outgoing MQTT messages from Store App to Mango Pad devices.
 * Specifically tests sendPaymentResult payload structure for success and failure cases.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MangoPadService,
  getMangoPadService,
  destroyMangoPadService,
  type PaymentResult,
} from '../mangoPadService';
import { getMqttClient } from '../mqtt/MqttClient';
import { isMqttEnabled } from '../mqtt/featureFlags';
import { getOrCreateDeviceId } from '../deviceRegistration';
import { buildTopic, TOPIC_PATTERNS } from '../mqtt/topics';

// Mock dependencies
vi.mock('../mqtt/MqttClient', () => ({
  getMqttClient: vi.fn(),
}));

vi.mock('../mqtt/featureFlags', () => ({
  isMqttEnabled: vi.fn(() => true),
}));

vi.mock('../deviceRegistration', () => ({
  getOrCreateDeviceId: vi.fn(() => 'test-station-123'),
}));

describe('MangoPadService', () => {
  const mockPublish = vi.fn().mockResolvedValue(undefined);
  const mockMqttClient = {
    isConnected: vi.fn(() => true),
    publish: mockPublish,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    destroyMangoPadService();
    (getMqttClient as any).mockReturnValue(mockMqttClient);
    (isMqttEnabled as any).mockReturnValue(true);
    mockMqttClient.isConnected.mockReturnValue(true);
  });

  afterEach(() => {
    destroyMangoPadService();
  });

  describe('sendPaymentResult', () => {
    let service: MangoPadService;

    beforeEach(() => {
      service = getMangoPadService();
      service.setStoreId('test-store-456');
    });

    it('should publish success payment result with card info', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-001',
        ticketId: 'ticket-001',
        success: true,
        cardLast4: '4242',
        cardBrand: 'Visa',
        authCode: 'AUTH123',
      };

      await service.sendPaymentResult(result);

      expect(mockPublish).toHaveBeenCalledTimes(1);

      // Verify topic pattern
      const expectedTopic = buildTopic(TOPIC_PATTERNS.PAD_PAYMENT_RESULT, {
        storeId: 'test-store-456',
        stationId: 'test-station-123',
      });
      expect(mockPublish).toHaveBeenCalledWith(
        expectedTopic,
        expect.objectContaining({
          transactionId: 'txn-001',
          ticketId: 'ticket-001',
          success: true,
          cardLast4: '4242',
          cardBrand: 'Visa',
          authCode: 'AUTH123',
        }),
        { qos: 1 }
      );
    });

    it('should publish failure payment result with error message', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-002',
        ticketId: 'ticket-002',
        success: false,
        errorMessage: 'Card declined - insufficient funds',
      };

      await service.sendPaymentResult(result);

      expect(mockPublish).toHaveBeenCalledTimes(1);
      expect(mockPublish).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transactionId: 'txn-002',
          ticketId: 'ticket-002',
          success: false,
          errorMessage: 'Card declined - insufficient funds',
        }),
        { qos: 1 }
      );
    });

    it('should include all required fields in success payload', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-003',
        ticketId: 'ticket-003',
        success: true,
        cardLast4: '1234',
        cardBrand: 'Mastercard',
      };

      await service.sendPaymentResult(result);

      const publishedPayload = mockPublish.mock.calls[0][1];

      // Verify required fields exist
      expect(publishedPayload).toHaveProperty('transactionId');
      expect(publishedPayload).toHaveProperty('ticketId');
      expect(publishedPayload).toHaveProperty('success');

      // Verify types
      expect(typeof publishedPayload.transactionId).toBe('string');
      expect(typeof publishedPayload.ticketId).toBe('string');
      expect(typeof publishedPayload.success).toBe('boolean');
    });

    it('should include all required fields in failure payload', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-004',
        ticketId: 'ticket-004',
        success: false,
        errorMessage: 'Network error',
      };

      await service.sendPaymentResult(result);

      const publishedPayload = mockPublish.mock.calls[0][1];

      // Verify required fields exist
      expect(publishedPayload).toHaveProperty('transactionId');
      expect(publishedPayload).toHaveProperty('ticketId');
      expect(publishedPayload).toHaveProperty('success');
      expect(publishedPayload.success).toBe(false);
      expect(publishedPayload.errorMessage).toBe('Network error');
    });

    it('should publish to correct topic with station ID', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-005',
        ticketId: 'ticket-005',
        success: true,
      };

      await service.sendPaymentResult(result);

      const publishedTopic = mockPublish.mock.calls[0][0];

      // Topic should include store ID and station ID
      expect(publishedTopic).toContain('test-store-456');
      expect(publishedTopic).toContain('test-station-123');
      expect(publishedTopic).toContain('payment_result');
    });

    it('should use QoS 1 for payment results', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-006',
        ticketId: 'ticket-006',
        success: true,
      };

      await service.sendPaymentResult(result);

      const publishOptions = mockPublish.mock.calls[0][2];
      expect(publishOptions).toEqual({ qos: 1 });
    });

    it('should throw error if MQTT is not enabled', async () => {
      (isMqttEnabled as any).mockReturnValue(false);

      const result: PaymentResult = {
        transactionId: 'txn-007',
        ticketId: 'ticket-007',
        success: true,
      };

      await expect(service.sendPaymentResult(result)).rejects.toThrow(
        'MQTT is not enabled'
      );
    });

    it('should throw error if MQTT client is not connected', async () => {
      mockMqttClient.isConnected.mockReturnValue(false);

      const result: PaymentResult = {
        transactionId: 'txn-008',
        ticketId: 'ticket-008',
        success: true,
      };

      await expect(service.sendPaymentResult(result)).rejects.toThrow(
        'MQTT client is not connected'
      );
    });

    it('should throw error if storeId is not set', async () => {
      const freshService = new MangoPadService();

      const result: PaymentResult = {
        transactionId: 'txn-009',
        ticketId: 'ticket-009',
        success: true,
      };

      await expect(freshService.sendPaymentResult(result)).rejects.toThrow(
        'storeId not set'
      );
    });

    it('should handle optional card fields for success', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-010',
        ticketId: 'ticket-010',
        success: true,
        // cardLast4, cardBrand, authCode are optional
      };

      await service.sendPaymentResult(result);

      const publishedPayload = mockPublish.mock.calls[0][1];
      expect(publishedPayload.success).toBe(true);
      // Optional fields should be undefined (not throw)
      expect(publishedPayload.cardLast4).toBeUndefined();
      expect(publishedPayload.cardBrand).toBeUndefined();
    });

    it('should handle optional errorMessage for failure', async () => {
      const result: PaymentResult = {
        transactionId: 'txn-011',
        ticketId: 'ticket-011',
        success: false,
        // errorMessage is optional
      };

      await service.sendPaymentResult(result);

      const publishedPayload = mockPublish.mock.calls[0][1];
      expect(publishedPayload.success).toBe(false);
      expect(publishedPayload.errorMessage).toBeUndefined();
    });
  });

  describe('singleton functions', () => {
    it('getMangoPadService should return singleton instance', () => {
      const service1 = getMangoPadService();
      const service2 = getMangoPadService();
      expect(service1).toBe(service2);
    });

    it('destroyMangoPadService should clear singleton', () => {
      const service1 = getMangoPadService();
      destroyMangoPadService();
      const service2 = getMangoPadService();
      expect(service1).not.toBe(service2);
    });
  });
});
