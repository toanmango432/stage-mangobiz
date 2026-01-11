/**
 * Unit Tests for Auth Slice
 */

import { describe, it, expect } from 'vitest';
import authReducer, {
  setStore,
  setDeviceId,
  clearAuth,
} from './authSlice';
import type { AuthState, Store } from '../../types';

describe('authSlice', () => {
  const initialState: AuthState = {
    storeId: null,
    deviceId: null,
    isAuthenticated: false,
    store: null,
  };

  const mockStore: Store = {
    id: 'store-123',
    name: 'Mango Salon',
    logo: 'https://example.com/logo.png',
    timezone: 'America/Los_Angeles',
  };

  describe('initial state', () => {
    it('returns initial state', () => {
      const result = authReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('setStore', () => {
    it('sets store and authenticates', () => {
      const result = authReducer(initialState, setStore(mockStore));
      
      expect(result.store).toEqual(mockStore);
      expect(result.storeId).toBe('store-123');
      expect(result.isAuthenticated).toBe(true);
    });

    it('overwrites existing store', () => {
      const stateWithStore: AuthState = {
        ...initialState,
        store: { ...mockStore, id: 'old-store' },
        storeId: 'old-store',
        isAuthenticated: true,
      };
      
      const result = authReducer(stateWithStore, setStore(mockStore));
      
      expect(result.storeId).toBe('store-123');
      expect(result.store?.name).toBe('Mango Salon');
    });
  });

  describe('setDeviceId', () => {
    it('sets device ID', () => {
      const result = authReducer(initialState, setDeviceId('device-abc-123'));
      expect(result.deviceId).toBe('device-abc-123');
    });

    it('overwrites existing device ID', () => {
      const stateWithDevice: AuthState = {
        ...initialState,
        deviceId: 'old-device',
      };
      
      const result = authReducer(stateWithDevice, setDeviceId('new-device'));
      expect(result.deviceId).toBe('new-device');
    });
  });

  describe('clearAuth', () => {
    it('clears all auth state', () => {
      const authenticatedState: AuthState = {
        storeId: 'store-123',
        deviceId: 'device-abc',
        isAuthenticated: true,
        store: mockStore,
      };
      
      const result = authReducer(authenticatedState, clearAuth());
      
      expect(result.storeId).toBeNull();
      expect(result.deviceId).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(result.store).toBeNull();
    });

    it('is idempotent on initial state', () => {
      const result = authReducer(initialState, clearAuth());
      expect(result).toEqual(initialState);
    });
  });
});
