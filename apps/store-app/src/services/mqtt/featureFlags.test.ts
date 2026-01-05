/**
 * Tests for MQTT Feature Flags
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMqttEnabled,
  getCloudBrokerUrl,
  isDevelopment,
  getMqttFeatureFlags,
  isMqttFeatureEnabled,
  MQTT_MIGRATION_PHASE,
  getCurrentMigrationPhase,
} from './featureFlags';

describe('MQTT Feature Flags', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('MQTT_MIGRATION_PHASE', () => {
    it('should have all migration phases defined', () => {
      expect(MQTT_MIGRATION_PHASE.PHASE_0_FOUNDATION).toBe(0);
      expect(MQTT_MIGRATION_PHASE.PHASE_1_CLIENT_LIBRARY).toBe(1);
      expect(MQTT_MIGRATION_PHASE.PHASE_2_ELECTRON).toBe(2);
      expect(MQTT_MIGRATION_PHASE.PHASE_3_INTEGRATION).toBe(3);
      expect(MQTT_MIGRATION_PHASE.PHASE_4_MONOREPO).toBe(4);
      expect(MQTT_MIGRATION_PHASE.PHASE_5_SATELLITE_APPS).toBe(5);
      expect(MQTT_MIGRATION_PHASE.PHASE_6_CLEANUP).toBe(6);
    });
  });

  describe('isMqttEnabled', () => {
    it('should return boolean', () => {
      const result = isMqttEnabled();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCloudBrokerUrl', () => {
    it('should return a string URL', () => {
      const url = getCloudBrokerUrl();
      expect(typeof url).toBe('string');
    });

    it('should return default URL when env not set', () => {
      const url = getCloudBrokerUrl();
      expect(url).toContain('mqtt');
    });
  });

  describe('isDevelopment', () => {
    it('should return boolean', () => {
      const result = isDevelopment();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getMqttFeatureFlags', () => {
    it('should return feature flags object', () => {
      const flags = getMqttFeatureFlags();
      expect(typeof flags).toBe('object');
    });

    it('should have all expected feature flags', () => {
      const flags = getMqttFeatureFlags();
      expect('devicePresence' in flags).toBe(true);
      expect('signatures' in flags).toBe(true);
      expect('checkIns' in flags).toBe(true);
      expect('appointments' in flags).toBe(true);
      expect('tickets' in flags).toBe(true);
      expect('payments' in flags).toBe(true);
      expect('waitlist' in flags).toBe(true);
      expect('onlineBookings' in flags).toBe(true);
    });

    it('should return boolean values for all flags', () => {
      const flags = getMqttFeatureFlags();
      Object.values(flags).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });
  });

  describe('isMqttFeatureEnabled', () => {
    it('should check if device presence is enabled', () => {
      const result = isMqttFeatureEnabled('devicePresence');
      expect(typeof result).toBe('boolean');
    });

    it('should check if signatures are enabled', () => {
      const result = isMqttFeatureEnabled('signatures');
      expect(typeof result).toBe('boolean');
    });

    it('should check if checkIns are enabled', () => {
      const result = isMqttFeatureEnabled('checkIns');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCurrentMigrationPhase', () => {
    it('should return a number', () => {
      const phase = getCurrentMigrationPhase();
      expect(typeof phase).toBe('number');
    });

    it('should return a valid phase value', () => {
      const phase = getCurrentMigrationPhase();
      const validPhases = Object.values(MQTT_MIGRATION_PHASE);
      expect(validPhases).toContain(phase);
    });
  });
});
