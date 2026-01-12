import { describe, it, expect } from 'vitest';
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  SUCCESS_REDIRECT_MS,
  MAX_GUESTS,
  PHONE_LENGTH,
  BUSY_WAIT_THRESHOLD_MINUTES,
  MQTT_TOPICS,
  COLORS,
  TECHNICIAN_STATUS_LABELS,
  TECHNICIAN_STATUS_COLORS,
} from './index';

describe('constants', () => {
  describe('Timeouts', () => {
    it('should have correct IDLE_TIMEOUT_MS value', () => {
      expect(IDLE_TIMEOUT_MS).toBe(60000);
    });

    it('should have correct IDLE_WARNING_MS value', () => {
      expect(IDLE_WARNING_MS).toBe(45000);
    });

    it('should have correct SUCCESS_REDIRECT_MS value', () => {
      expect(SUCCESS_REDIRECT_MS).toBe(10000);
    });

    it('should have IDLE_WARNING_MS less than IDLE_TIMEOUT_MS', () => {
      expect(IDLE_WARNING_MS).toBeLessThan(IDLE_TIMEOUT_MS);
    });
  });

  describe('Limits', () => {
    it('should have correct MAX_GUESTS value', () => {
      expect(MAX_GUESTS).toBe(6);
    });

    it('should have correct PHONE_LENGTH value', () => {
      expect(PHONE_LENGTH).toBe(10);
    });

    it('should have correct BUSY_WAIT_THRESHOLD_MINUTES value', () => {
      expect(BUSY_WAIT_THRESHOLD_MINUTES).toBe(45);
    });
  });

  describe('MQTT_TOPICS', () => {
    it('should have all required topics', () => {
      expect(MQTT_TOPICS.CHECKIN_NEW).toBe('salon/{storeId}/checkin/new');
      expect(MQTT_TOPICS.CHECKIN_UPDATE).toBe('salon/{storeId}/checkin/update');
      expect(MQTT_TOPICS.QUEUE_STATUS).toBe('salon/{storeId}/queue/status');
      expect(MQTT_TOPICS.STAFF_STATUS).toBe('salon/{storeId}/staff/status');
      expect(MQTT_TOPICS.CHECKIN_CALLED).toBe('salon/{storeId}/checkin/called');
    });

    it('should contain {storeId} placeholder in all topics', () => {
      Object.values(MQTT_TOPICS).forEach(topic => {
        expect(topic).toContain('{storeId}');
      });
    });
  });

  describe('COLORS', () => {
    it('should have primary color', () => {
      expect(COLORS.primary).toBe('#1a5f4a');
    });

    it('should have accent color', () => {
      expect(COLORS.accent).toBe('#d4a853');
    });

    it('should have status colors', () => {
      expect(COLORS.success).toBe('#22c55e');
      expect(COLORS.warning).toBe('#f59e0b');
      expect(COLORS.error).toBe('#ef4444');
    });

    it('should have gray scale', () => {
      expect(COLORS.gray).toBeDefined();
      expect(COLORS.gray[50]).toBe('#f9fafb');
      expect(COLORS.gray[900]).toBe('#111827');
    });
  });

  describe('TECHNICIAN_STATUS_LABELS', () => {
    it('should have all technician status labels', () => {
      expect(TECHNICIAN_STATUS_LABELS.available).toBe('Available');
      expect(TECHNICIAN_STATUS_LABELS.with_client).toBe('With Client');
      expect(TECHNICIAN_STATUS_LABELS.on_break).toBe('On Break');
      expect(TECHNICIAN_STATUS_LABELS.unavailable).toBe('Unavailable');
    });
  });

  describe('TECHNICIAN_STATUS_COLORS', () => {
    it('should have all technician status colors', () => {
      expect(TECHNICIAN_STATUS_COLORS.available).toBe('bg-green-500');
      expect(TECHNICIAN_STATUS_COLORS.with_client).toBe('bg-yellow-500');
      expect(TECHNICIAN_STATUS_COLORS.on_break).toBe('bg-gray-400');
      expect(TECHNICIAN_STATUS_COLORS.unavailable).toBe('bg-red-500');
    });
  });
});
