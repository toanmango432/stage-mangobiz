/**
 * Auth Slice Tests
 *
 * Tests for auth state management including device state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  setAuth,
  logout,
  clearError,
  setDevice,
  setStorePolicy,
  updateDeviceMode,
  clearDevice,
  selectIsAuthenticated,
  selectCurrentUser,
  selectSalonId,
  selectToken,
  selectDevice,
  selectStorePolicy,
  selectDeviceMode,
  selectIsOfflineEnabled,
  selectDeviceId,
} from '../authSlice';
import type { DevicePolicy, AuthDeviceState } from '@/types/device';

// Create a test store
function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
}

describe('authSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = (store.getState() as any).auth;

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.storeId).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.device).toBeNull();
      expect(state.storePolicy).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should set authentication state', () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      store.dispatch(
        setAuth({
          user,
          storeId: 'salon-1',
          token: 'test-token',
        })
      );

      const state = (store.getState() as any).auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.storeId).toBe('salon-1');
      expect(state.token).toBe('test-token');
      expect(state.error).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear all auth state including device', () => {
      // First, set up some state
      store.dispatch(
        setAuth({
          user: { id: '1', name: 'Test', email: 'test@test.com', role: 'admin' },
          storeId: 'salon-1',
          token: 'token',
        })
      );
      store.dispatch(
        setDevice({
          id: 'device-1',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: new Date().toISOString(),
        })
      );

      // Then logout
      store.dispatch(logout());

      const state = (store.getState() as any).auth;

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.storeId).toBeNull();
      expect(state.token).toBeNull();
      expect(state.device).toBeNull();
      expect(state.storePolicy).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // Manually set error (normally set by rejected thunks)
      const storeWithError = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            // Two-tier auth state
            status: 'not_logged_in' as const,
            store: null,
            member: null,
            availableStores: [],
            // Legacy fields
            isAuthenticated: false,
            user: null,
            storeId: null,
            token: null,
            loading: false,
            error: 'Some error',
            device: null,
            storePolicy: null,
          },
        },
      });

      storeWithError.dispatch(clearError());

      expect(storeWithError.getState().auth.error).toBeNull();
    });
  });

  describe('device actions', () => {
    describe('setDevice', () => {
      it('should set device state', () => {
        const device: AuthDeviceState = {
          id: 'device-123',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: '2025-01-01T00:00:00Z',
        };

        store.dispatch(setDevice(device));

        const state = (store.getState() as any).auth;

        expect(state.device).toEqual(device);
      });
    });

    describe('setStorePolicy', () => {
      it('should set store policy', () => {
        const policy: DevicePolicy = {
          defaultMode: 'online-only',
          allowUserOverride: true,
          maxOfflineDevices: 3,
          offlineGraceDays: 14,
        };

        store.dispatch(setStorePolicy(policy));

        const state = (store.getState() as any).auth;

        expect(state.storePolicy).toEqual(policy);
      });
    });

    describe('updateDeviceMode', () => {
      it('should update device mode when device exists', () => {
        // First set a device
        store.dispatch(
          setDevice({
            id: 'device-1',
            mode: 'offline-enabled',
            offlineModeEnabled: true,
            registeredAt: '2025-01-01T00:00:00Z',
          })
        );

        // Then update mode
        store.dispatch(updateDeviceMode('online-only'));

        const state = (store.getState() as any).auth;

        expect(state.device?.mode).toBe('online-only');
        expect(state.device?.offlineModeEnabled).toBe(false);
      });

      it('should do nothing when no device exists', () => {
        store.dispatch(updateDeviceMode('online-only'));

        const state = (store.getState() as any).auth;

        expect(state.device).toBeNull();
      });
    });

    describe('clearDevice', () => {
      it('should clear device and policy', () => {
        store.dispatch(
          setDevice({
            id: 'device-1',
            mode: 'offline-enabled',
            offlineModeEnabled: true,
            registeredAt: '2025-01-01T00:00:00Z',
          })
        );
        store.dispatch(
          setStorePolicy({
            defaultMode: 'online-only',
            allowUserOverride: true,
            maxOfflineDevices: 5,
            offlineGraceDays: 7,
          })
        );

        store.dispatch(clearDevice());

        const state = (store.getState() as any).auth;

        expect(state.device).toBeNull();
        expect(state.storePolicy).toBeNull();
      });
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      store.dispatch(
        setAuth({
          user: { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'staff' },
          storeId: 'salon-123',
          token: 'token-abc',
        })
      );
      store.dispatch(
        setDevice({
          id: 'device-456',
          mode: 'offline-enabled',
          offlineModeEnabled: true,
          registeredAt: '2025-01-01T00:00:00Z',
        })
      );
      store.dispatch(
        setStorePolicy({
          defaultMode: 'offline-enabled',
          allowUserOverride: false,
          maxOfflineDevices: 5,
          offlineGraceDays: 7,
        })
      );
    });

    it('selectIsAuthenticated should return auth status', () => {
      expect(selectIsAuthenticated(store.getState() as any as any)).toBe(true);
    });

    it('selectCurrentUser should return user', () => {
      expect(selectCurrentUser(store.getState() as any)).toEqual({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        role: 'staff',
      });
    });

    it('selectSalonId should return salon ID', () => {
      expect(selectSalonId(store.getState() as any)).toBe('salon-123');
    });

    it('selectToken should return token', () => {
      expect(selectToken(store.getState() as any)).toBe('token-abc');
    });

    it('selectDevice should return device state', () => {
      expect(selectDevice(store.getState() as any)).toEqual({
        id: 'device-456',
        mode: 'offline-enabled',
        offlineModeEnabled: true,
        registeredAt: '2025-01-01T00:00:00Z',
      });
    });

    it('selectStorePolicy should return store policy', () => {
      expect(selectStorePolicy(store.getState() as any)).toEqual({
        defaultMode: 'offline-enabled',
        allowUserOverride: false,
        maxOfflineDevices: 5,
        offlineGraceDays: 7,
      });
    });

    it('selectDeviceMode should return device mode', () => {
      expect(selectDeviceMode(store.getState() as any)).toBe('offline-enabled');
    });

    it('selectIsOfflineEnabled should return offline status', () => {
      expect(selectIsOfflineEnabled(store.getState() as any)).toBe(true);
    });

    it('selectDeviceId should return device ID', () => {
      expect(selectDeviceId(store.getState() as any)).toBe('device-456');
    });

    describe('when no device is set', () => {
      beforeEach(() => {
        store.dispatch(clearDevice());
      });

      it('selectDeviceMode should return null', () => {
        expect(selectDeviceMode(store.getState() as any)).toBeNull();
      });

      it('selectIsOfflineEnabled should return false', () => {
        expect(selectIsOfflineEnabled(store.getState() as any)).toBe(false);
      });

      it('selectDeviceId should return null', () => {
        expect(selectDeviceId(store.getState() as any)).toBeNull();
      });
    });
  });
});
