/**
 * mqttTopics Unit Tests
 * US-016: Tests for MQTT topic utilities
 *
 * Device-to-Device (1:1) Architecture:
 * Topics include stationId for 1:1 pairing between Pad and Station
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
    it('should have all required topics with station ID placeholder', () => {
      // All topics now include {stationId} for device-to-device communication
      expect(PAD_TOPICS.READY_TO_PAY).toBe('salon/{salonId}/station/{stationId}/pad/ready_to_pay');
      expect(PAD_TOPICS.TIP_SELECTED).toBe('salon/{salonId}/station/{stationId}/pad/tip_selected');
      expect(PAD_TOPICS.SIGNATURE).toBe('salon/{salonId}/station/{stationId}/pad/signature');
      expect(PAD_TOPICS.PAYMENT_RESULT).toBe('salon/{salonId}/station/{stationId}/pad/payment_result');
      expect(PAD_TOPICS.RECEIPT_PREFERENCE).toBe('salon/{salonId}/station/{stationId}/pad/receipt_preference');
      expect(PAD_TOPICS.TRANSACTION_COMPLETE).toBe('salon/{salonId}/station/{stationId}/pad/transaction_complete');
      expect(PAD_TOPICS.CANCEL).toBe('salon/{salonId}/station/{stationId}/pad/cancel');
      expect(PAD_TOPICS.HELP_REQUESTED).toBe('salon/{salonId}/station/{stationId}/pad/help_requested');
      expect(PAD_TOPICS.SPLIT_PAYMENT).toBe('salon/{salonId}/station/{stationId}/pad/split_payment');
    });

    it('should have heartbeat topics', () => {
      expect(PAD_TOPICS.PAD_HEARTBEAT).toBe('salon/{salonId}/station/{stationId}/pad/heartbeat');
      expect(PAD_TOPICS.STATION_HEARTBEAT).toBe('salon/{salonId}/station/{stationId}/heartbeat');
    });

    it('should have unpaired topic with padId placeholder', () => {
      expect(PAD_TOPICS.PAD_UNPAIRED).toBe('salon/{salonId}/station/{stationId}/pad/{padId}/unpaired');
    });
  });

  describe('buildPadTopic', () => {
    it('should replace salonId and stationId placeholders', () => {
      const topic = buildPadTopic(PAD_TOPICS.READY_TO_PAY, {
        salonId: 'salon-123',
        stationId: 'station-abc',
      });
      expect(topic).toBe('salon/salon-123/station/station-abc/pad/ready_to_pay');
    });

    it('should work with different station IDs', () => {
      const topic1 = buildPadTopic(PAD_TOPICS.TIP_SELECTED, {
        salonId: 'salon-1',
        stationId: 'station-A',
      });
      const topic2 = buildPadTopic(PAD_TOPICS.TIP_SELECTED, {
        salonId: 'salon-1',
        stationId: 'station-B',
      });

      expect(topic1).toBe('salon/salon-1/station/station-A/pad/tip_selected');
      expect(topic2).toBe('salon/salon-1/station/station-B/pad/tip_selected');
    });

    it('should handle special characters in IDs', () => {
      const topic = buildPadTopic(PAD_TOPICS.SIGNATURE, {
        salonId: 'salon-1_test',
        stationId: 'station-2_dev',
      });
      expect(topic).toBe('salon/salon-1_test/station/station-2_dev/pad/signature');
    });

    it('should replace padId for unpaired topic', () => {
      const topic = buildPadTopic(PAD_TOPICS.PAD_UNPAIRED, {
        salonId: 'salon-123',
        stationId: 'station-abc',
        padId: 'pad-xyz',
      });
      expect(topic).toBe('salon/salon-123/station/station-abc/pad/pad-xyz/unpaired');
    });
  });

  describe('getSubscribeTopics', () => {
    it('should return array of 4 subscribe topics', () => {
      const topics = getSubscribeTopics('test-salon', 'test-station');
      expect(topics).toHaveLength(4);
    });

    it('should include ready_to_pay topic', () => {
      const topics = getSubscribeTopics('salon-1', 'station-1');
      expect(topics).toContain('salon/salon-1/station/station-1/pad/ready_to_pay');
    });

    it('should include payment_result topic', () => {
      const topics = getSubscribeTopics('salon-1', 'station-1');
      expect(topics).toContain('salon/salon-1/station/station-1/pad/payment_result');
    });

    it('should include cancel topic', () => {
      const topics = getSubscribeTopics('salon-1', 'station-1');
      expect(topics).toContain('salon/salon-1/station/station-1/pad/cancel');
    });

    it('should include station heartbeat topic', () => {
      const topics = getSubscribeTopics('salon-1', 'station-1');
      expect(topics).toContain('salon/salon-1/station/station-1/heartbeat');
    });

    it('should use correct salon and station ID in all topics', () => {
      const topics = getSubscribeTopics('my-salon', 'my-station');
      topics.forEach((topic) => {
        expect(topic).toContain('my-salon');
        expect(topic).toContain('my-station');
      });
    });
  });

  describe('getPublishTopics', () => {
    it('should return object with all publish topics', () => {
      const topics = getPublishTopics('salon-abc', 'station-xyz');

      expect(topics.tipSelected).toBe('salon/salon-abc/station/station-xyz/pad/tip_selected');
      expect(topics.signature).toBe('salon/salon-abc/station/station-xyz/pad/signature');
      expect(topics.receiptPreference).toBe('salon/salon-abc/station/station-xyz/pad/receipt_preference');
      expect(topics.transactionComplete).toBe('salon/salon-abc/station/station-xyz/pad/transaction_complete');
      expect(topics.helpRequested).toBe('salon/salon-abc/station/station-xyz/pad/help_requested');
      expect(topics.splitPayment).toBe('salon/salon-abc/station/station-xyz/pad/split_payment');
      expect(topics.padHeartbeat).toBe('salon/salon-abc/station/station-xyz/pad/heartbeat');
    });

    it('should have 7 publish topics', () => {
      const topics = getPublishTopics('test', 'station');
      expect(Object.keys(topics)).toHaveLength(7);
    });
  });
});
