/**
 * Pad Devices Slice
 * Redux state management for connected Mango Pad devices
 *
 * Part of: Mango Pad Integration (US-004)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { PadHeartbeatPayload } from '@/services/mqtt/types';

// =============================================================================
// Types
// =============================================================================

export interface PadDevice {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen: string;
  screen?: 'idle' | 'checkout' | 'tip' | 'signature' | 'receipt' | 'complete';
  salonId?: string;
}

interface PadDevicesState {
  devices: Record<string, PadDevice>;
  offlineTimeoutMs: number;
}

// =============================================================================
// Initial State
// =============================================================================

const OFFLINE_TIMEOUT_MS = 30000; // 30 seconds

const initialState: PadDevicesState = {
  devices: {},
  offlineTimeoutMs: OFFLINE_TIMEOUT_MS,
};

// =============================================================================
// Slice
// =============================================================================

const padDevicesSlice = createSlice({
  name: 'padDevices',
  initialState,
  reducers: {
    addDevice: (state, action: PayloadAction<PadDevice>) => {
      state.devices[action.payload.id] = action.payload;
    },

    removeDevice: (state, action: PayloadAction<string>) => {
      delete state.devices[action.payload];
    },

    updateDeviceStatus: (
      state,
      action: PayloadAction<{ id: string; status: 'online' | 'offline' }>
    ) => {
      const device = state.devices[action.payload.id];
      if (device) {
        device.status = action.payload.status;
      }
    },

    handleHeartbeat: (state, action: PayloadAction<PadHeartbeatPayload>) => {
      const { deviceId, deviceName, salonId, timestamp, screen } = action.payload;
      const existingDevice = state.devices[deviceId];

      if (existingDevice) {
        existingDevice.status = 'online';
        existingDevice.lastSeen = timestamp;
        existingDevice.screen = screen;
        if (deviceName) existingDevice.name = deviceName;
        if (salonId) existingDevice.salonId = salonId;
      } else {
        state.devices[deviceId] = {
          id: deviceId,
          name: deviceName || `Pad ${deviceId.slice(-4)}`,
          status: 'online',
          lastSeen: timestamp,
          screen,
          salonId,
        };
      }
    },

    checkOfflineDevices: (state) => {
      const now = Date.now();
      for (const device of Object.values(state.devices)) {
        const lastSeenTime = new Date(device.lastSeen).getTime();
        if (now - lastSeenTime > state.offlineTimeoutMs && device.status === 'online') {
          device.status = 'offline';
        }
      }
    },

    clearAllDevices: (state) => {
      state.devices = {};
    },
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  addDevice,
  removeDevice,
  updateDeviceStatus,
  handleHeartbeat,
  checkOfflineDevices,
  clearAllDevices,
} = padDevicesSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

export const selectAllPadDevices = (state: RootState) =>
  Object.values(state.padDevices.devices);

export const selectPadDeviceById = (state: RootState, deviceId: string) =>
  state.padDevices.devices[deviceId];

export const getConnectedPads = (state: RootState) =>
  Object.values(state.padDevices.devices).filter((d) => d.status === 'online');

export const selectHasConnectedPad = (state: RootState) =>
  getConnectedPads(state).length > 0;

export const selectOfflinePads = (state: RootState) =>
  Object.values(state.padDevices.devices).filter((d) => d.status === 'offline');

// =============================================================================
// Export
// =============================================================================

export default padDevicesSlice.reducer;
