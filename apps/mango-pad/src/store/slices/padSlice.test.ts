/**
 * padSlice Unit Tests
 * US-016: Tests for screen navigation and pad state
 */

import { describe, it, expect } from 'vitest';
import padReducer, {
  setScreen,
  goBack,
  setMqttConnectionStatus,
  setLoading,
  resetToIdle,
} from './padSlice';
import type { PadScreen, MqttConnectionStatus } from '@/types';

describe('padSlice', () => {
  const initialState = {
    currentScreen: 'idle' as PadScreen,
    previousScreen: null as PadScreen | null,
    mqttConnectionStatus: 'disconnected' as MqttConnectionStatus,
    isLoading: false,
  };

  describe('setScreen', () => {
    it('should set current screen and track previous', () => {
      const state = padReducer(initialState, setScreen('order-review'));
      expect(state.currentScreen).toBe('order-review');
      expect(state.previousScreen).toBe('idle');
    });

    it('should update previous screen on subsequent navigation', () => {
      let state = padReducer(initialState, setScreen('order-review'));
      state = padReducer(state, setScreen('tip'));
      expect(state.currentScreen).toBe('tip');
      expect(state.previousScreen).toBe('order-review');
    });

    it('should handle all valid screens', () => {
      const screens: PadScreen[] = [
        'idle',
        'order-review',
        'tip',
        'signature',
        'payment',
        'result',
        'receipt',
        'thank-you',
        'split-selection',
        'split-status',
        'settings',
      ];

      screens.forEach((screen) => {
        const state = padReducer(initialState, setScreen(screen));
        expect(state.currentScreen).toBe(screen);
      });
    });
  });

  describe('goBack', () => {
    it('should return to previous screen if available', () => {
      let state = padReducer(initialState, setScreen('order-review'));
      state = padReducer(state, goBack());
      expect(state.currentScreen).toBe('idle');
      expect(state.previousScreen).toBeNull();
    });

    it('should do nothing if no previous screen', () => {
      const state = padReducer(initialState, goBack());
      expect(state.currentScreen).toBe('idle');
      expect(state.previousScreen).toBeNull();
    });
  });

  describe('setMqttConnectionStatus', () => {
    it('should update connection status to connected', () => {
      const state = padReducer(initialState, setMqttConnectionStatus('connected'));
      expect(state.mqttConnectionStatus).toBe('connected');
    });

    it('should update connection status to reconnecting', () => {
      const state = padReducer(initialState, setMqttConnectionStatus('reconnecting'));
      expect(state.mqttConnectionStatus).toBe('reconnecting');
    });

    it('should update connection status to disconnected', () => {
      const state = padReducer({ ...initialState, mqttConnectionStatus: 'connected' }, setMqttConnectionStatus('disconnected'));
      expect(state.mqttConnectionStatus).toBe('disconnected');
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = padReducer(initialState, setLoading(true));
      expect(state.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const state = padReducer({ ...initialState, isLoading: true }, setLoading(false));
      expect(state.isLoading).toBe(false);
    });
  });

  describe('resetToIdle', () => {
    it('should reset screen to idle and clear state', () => {
      let state = { ...initialState };
      state = padReducer(state, setScreen('payment'));
      state = padReducer(state, setLoading(true));
      state = padReducer(state, resetToIdle());

      expect(state.currentScreen).toBe('idle');
      expect(state.previousScreen).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });
});
