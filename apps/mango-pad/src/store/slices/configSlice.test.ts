/**
 * configSlice Unit Tests
 * US-016: Tests for configuration state and persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import configReducer, {
  setConfig,
  setSalonId,
  setMqttBrokerUrl,
  setTipSettings,
  setPromoSlides,
  addPromoSlide,
  removePromoSlide,
  setBrandColors,
  setAccessibilitySettings,
  resetConfig,
  importConfig,
} from './configSlice';
import type { PadConfig, PromoSlide } from '@/types';

describe('configSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const DEFAULT_CONFIG: PadConfig = {
    salonId: '',
    mqttBrokerUrl: 'ws://localhost:1883',
    tipEnabled: true,
    tipType: 'percentage',
    tipSuggestions: [18, 20, 25, 30],
    signatureRequired: true,
    showReceiptOptions: true,
    paymentTimeout: 60,
    thankYouDelay: 5,
    splitPaymentEnabled: true,
    maxSplits: 4,
    logoUrl: undefined,
    promoSlides: [],
    slideDuration: 8,
    brandColors: { primary: '#6366F1', secondary: '#818CF8' },
    highContrastMode: false,
    largeTextMode: false,
  };

  const getInitialState = () => ({
    config: DEFAULT_CONFIG,
  });

  describe('setConfig', () => {
    it('should update partial config', () => {
      const state = configReducer(getInitialState(), setConfig({ salonId: 'salon-123' }));
      expect(state.config.salonId).toBe('salon-123');
      expect(state.config.tipEnabled).toBe(true);
    });

    it('should persist to localStorage', () => {
      configReducer(getInitialState(), setConfig({ salonId: 'salon-456' }));
      const stored = JSON.parse(localStorage.getItem('mango-pad-config') || '{}');
      expect(stored.salonId).toBe('salon-456');
    });

    it('should update multiple fields at once', () => {
      const state = configReducer(getInitialState(), setConfig({
        salonId: 'salon-789',
        tipEnabled: false,
        signatureRequired: false,
      }));
      expect(state.config.salonId).toBe('salon-789');
      expect(state.config.tipEnabled).toBe(false);
      expect(state.config.signatureRequired).toBe(false);
    });
  });

  describe('setSalonId', () => {
    it('should set salon ID', () => {
      const state = configReducer(getInitialState(), setSalonId('salon-abc'));
      expect(state.config.salonId).toBe('salon-abc');
    });
  });

  describe('setMqttBrokerUrl', () => {
    it('should set MQTT broker URL', () => {
      const state = configReducer(getInitialState(), setMqttBrokerUrl('wss://mqtt.example.com:8883'));
      expect(state.config.mqttBrokerUrl).toBe('wss://mqtt.example.com:8883');
    });
  });

  describe('setTipSettings', () => {
    it('should update tip enabled flag', () => {
      const state = configReducer(getInitialState(), setTipSettings({ enabled: false }));
      expect(state.config.tipEnabled).toBe(false);
    });

    it('should update tip type to dollar', () => {
      const state = configReducer(getInitialState(), setTipSettings({ type: 'dollar' }));
      expect(state.config.tipType).toBe('dollar');
    });

    it('should update tip suggestions', () => {
      const state = configReducer(getInitialState(), setTipSettings({ suggestions: [5, 10, 15, 20] }));
      expect(state.config.tipSuggestions).toEqual([5, 10, 15, 20]);
    });

    it('should update all tip settings at once', () => {
      const state = configReducer(getInitialState(), setTipSettings({
        enabled: true,
        type: 'dollar',
        suggestions: [3, 5, 7, 10],
      }));
      expect(state.config.tipEnabled).toBe(true);
      expect(state.config.tipType).toBe('dollar');
      expect(state.config.tipSuggestions).toEqual([3, 5, 7, 10]);
    });
  });

  describe('promo slides', () => {
    const mockSlide: PromoSlide = {
      id: 'slide-1',
      type: 'promotion',
      title: 'Spring Sale',
      subtitle: '20% off all services',
    };

    it('should set promo slides array', () => {
      const state = configReducer(getInitialState(), setPromoSlides([mockSlide]));
      expect(state.config.promoSlides).toHaveLength(1);
      expect(state.config.promoSlides[0].title).toBe('Spring Sale');
    });

    it('should add a promo slide', () => {
      const state = configReducer(getInitialState(), addPromoSlide(mockSlide));
      expect(state.config.promoSlides).toHaveLength(1);
    });

    it('should add multiple promo slides', () => {
      let state = configReducer(getInitialState(), addPromoSlide(mockSlide));
      const slide2: PromoSlide = { id: 'slide-2', type: 'announcement', title: 'New Hours' };
      state = configReducer(state, addPromoSlide(slide2));
      expect(state.config.promoSlides).toHaveLength(2);
    });

    it('should remove a promo slide by id', () => {
      let state = configReducer(getInitialState(), addPromoSlide(mockSlide));
      state = configReducer(state, removePromoSlide('slide-1'));
      expect(state.config.promoSlides).toHaveLength(0);
    });

    it('should not fail when removing non-existent slide', () => {
      const state = configReducer(getInitialState(), removePromoSlide('non-existent'));
      expect(state.config.promoSlides).toHaveLength(0);
    });
  });

  describe('setBrandColors', () => {
    it('should update brand colors', () => {
      const state = configReducer(getInitialState(), setBrandColors({
        primary: '#FF0000',
        secondary: '#00FF00',
      }));
      expect(state.config.brandColors.primary).toBe('#FF0000');
      expect(state.config.brandColors.secondary).toBe('#00FF00');
    });
  });

  describe('setAccessibilitySettings', () => {
    it('should enable high contrast mode', () => {
      const state = configReducer(getInitialState(), setAccessibilitySettings({ highContrastMode: true }));
      expect(state.config.highContrastMode).toBe(true);
    });

    it('should enable large text mode', () => {
      const state = configReducer(getInitialState(), setAccessibilitySettings({ largeTextMode: true }));
      expect(state.config.largeTextMode).toBe(true);
    });

    it('should update both accessibility settings', () => {
      const state = configReducer(getInitialState(), setAccessibilitySettings({
        highContrastMode: true,
        largeTextMode: true,
      }));
      expect(state.config.highContrastMode).toBe(true);
      expect(state.config.largeTextMode).toBe(true);
    });
  });

  describe('resetConfig', () => {
    it('should reset to default config', () => {
      let state = configReducer(getInitialState(), setConfig({ salonId: 'custom-salon', tipEnabled: false }));
      state = configReducer(state, resetConfig());
      expect(state.config.salonId).toBe('');
      expect(state.config.tipEnabled).toBe(true);
    });
  });

  describe('importConfig', () => {
    it('should import full config', () => {
      const importedConfig: PadConfig = {
        ...DEFAULT_CONFIG,
        salonId: 'imported-salon',
        tipType: 'dollar',
        tipSuggestions: [2, 4, 6, 8],
      };
      const state = configReducer(getInitialState(), importConfig(importedConfig));
      expect(state.config.salonId).toBe('imported-salon');
      expect(state.config.tipType).toBe('dollar');
      expect(state.config.tipSuggestions).toEqual([2, 4, 6, 8]);
    });

    it('should merge with defaults for missing fields', () => {
      const partialImport = {
        salonId: 'partial-salon',
      } as PadConfig;
      const state = configReducer(getInitialState(), importConfig(partialImport));
      expect(state.config.salonId).toBe('partial-salon');
      expect(state.config.tipEnabled).toBe(true);
    });
  });
});
