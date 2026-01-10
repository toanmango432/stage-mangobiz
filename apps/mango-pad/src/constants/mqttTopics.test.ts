/**
 * mqttTopics Unit Tests
 * US-016: Tests for MQTT topic utilities
 */

import { describe, it, expect } from 'vitest';
import {
  PAD_TOPICS,
  buildPadTopic,
  getSubscribeTopics,
  getPublishTopics,
} from './mqttTopics';

describe('mqttTopics', () => {
  describe('PAD_TOPICS', () => {
    it('should have all required topics', () => {
      expect(PAD_TOPICS.READY_TO_PAY).toBe('salon/{salonId}/pad/ready_to_pay');
      expect(PAD_TOPICS.TIP_SELECTED).toBe('salon/{salonId}/pad/tip_selected');
      expect(PAD_TOPICS.SIGNATURE).toBe('salon/{salonId}/pad/signature');
      expect(PAD_TOPICS.PAYMENT_RESULT).toBe('salon/{salonId}/pad/payment_result');
      expect(PAD_TOPICS.RECEIPT_PREFERENCE).toBe('salon/{salonId}/pad/receipt_preference');
      expect(PAD_TOPICS.TRANSACTION_COMPLETE).toBe('salon/{salonId}/pad/transaction_complete');
      expect(PAD_TOPICS.CANCEL).toBe('salon/{salonId}/pad/cancel');
      expect(PAD_TOPICS.HELP_REQUESTED).toBe('salon/{salonId}/pad/help_requested');
      expect(PAD_TOPICS.SPLIT_PAYMENT).toBe('salon/{salonId}/pad/split_payment');
    });
  });

  describe('buildPadTopic', () => {
    it('should replace salonId placeholder', () => {
      const topic = buildPadTopic(PAD_TOPICS.READY_TO_PAY, { salonId: 'salon-123' });
      expect(topic).toBe('salon/salon-123/pad/ready_to_pay');
    });

    it('should work with different salon IDs', () => {
      const topic1 = buildPadTopic(PAD_TOPICS.TIP_SELECTED, { salonId: 'abc' });
      const topic2 = buildPadTopic(PAD_TOPICS.TIP_SELECTED, { salonId: 'xyz' });
      
      expect(topic1).toBe('salon/abc/pad/tip_selected');
      expect(topic2).toBe('salon/xyz/pad/tip_selected');
    });

    it('should handle special characters in salon ID', () => {
      const topic = buildPadTopic(PAD_TOPICS.SIGNATURE, { salonId: 'salon-1_test' });
      expect(topic).toBe('salon/salon-1_test/pad/signature');
    });

    it('should handle empty salon ID', () => {
      const topic = buildPadTopic(PAD_TOPICS.CANCEL, { salonId: '' });
      expect(topic).toBe('salon//pad/cancel');
    });
  });

  describe('getSubscribeTopics', () => {
    it('should return array of 3 subscribe topics', () => {
      const topics = getSubscribeTopics('test-salon');
      expect(topics).toHaveLength(3);
    });

    it('should include ready_to_pay topic', () => {
      const topics = getSubscribeTopics('salon-1');
      expect(topics).toContain('salon/salon-1/pad/ready_to_pay');
    });

    it('should include payment_result topic', () => {
      const topics = getSubscribeTopics('salon-1');
      expect(topics).toContain('salon/salon-1/pad/payment_result');
    });

    it('should include cancel topic', () => {
      const topics = getSubscribeTopics('salon-1');
      expect(topics).toContain('salon/salon-1/pad/cancel');
    });

    it('should use correct salon ID in all topics', () => {
      const topics = getSubscribeTopics('my-salon');
      topics.forEach((topic) => {
        expect(topic).toContain('my-salon');
      });
    });
  });

  describe('getPublishTopics', () => {
    it('should return object with all publish topics', () => {
      const topics = getPublishTopics('salon-abc');
      
      expect(topics.tipSelected).toBe('salon/salon-abc/pad/tip_selected');
      expect(topics.signature).toBe('salon/salon-abc/pad/signature');
      expect(topics.receiptPreference).toBe('salon/salon-abc/pad/receipt_preference');
      expect(topics.transactionComplete).toBe('salon/salon-abc/pad/transaction_complete');
      expect(topics.helpRequested).toBe('salon/salon-abc/pad/help_requested');
      expect(topics.splitPayment).toBe('salon/salon-abc/pad/split_payment');
    });

    it('should have 6 publish topics', () => {
      const topics = getPublishTopics('test');
      expect(Object.keys(topics)).toHaveLength(6);
    });
  });
});
