import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// =============================================================================
// Types
// =============================================================================

/** Device presence info discovered via MQTT */
export interface DevicePresence {
  deviceId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  localIp: string | null;
  mqttPort: number;
  isHub: boolean;
  isOnline: boolean;
  lastSeenAt: Date;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncAt: Date | null;
  error: string | null;
  /** Whether sync is enabled (only true for offline-enabled devices) */
  syncEnabled: boolean;
  /** Reason sync is disabled */
  syncDisabledReason: string | null;

  // MQTT State (Phase 3)
  /** Whether MQTT client is connected */
  mqttConnected: boolean;
  /** Which broker we're connected to: local (Mosquitto) or cloud */
  mqttConnectionType: 'local' | 'cloud' | null;
  /** Devices discovered via MQTT presence */
  discoveredDevices: DevicePresence[];
  /** MQTT connection error if any */
  mqttError: string | null;
}

const initialState: SyncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncAt: null,
  error: null,
  syncEnabled: false, // Default to false, enabled when offline mode is active
  syncDisabledReason: 'Device not registered for offline mode',

  // MQTT State
  mqttConnected: false,
  mqttConnectionType: null,
  discoveredDevices: [],
  mqttError: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setPendingOperations: (state, action: PayloadAction<number>) => {
      state.pendingOperations = action.payload;
    },
    setSyncComplete: (state) => {
      state.isSyncing = false;
      state.lastSyncAt = new Date();
      state.error = null;
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.isSyncing = false;
      state.error = action.payload;
    },
    /** Enable sync (called when device is registered with offline-enabled mode) */
    enableSync: (state) => {
      state.syncEnabled = true;
      state.syncDisabledReason = null;
    },
    /** Disable sync (called when switching to online-only or on revocation) */
    disableSync: (state, action: PayloadAction<string | undefined>) => {
      state.syncEnabled = false;
      state.syncDisabledReason = action.payload || 'Sync disabled';
      state.isSyncing = false;
    },
    /** Reset sync state (on logout) */
    resetSyncState: (state) => {
      state.isSyncing = false;
      state.pendingOperations = 0;
      state.lastSyncAt = null;
      state.error = null;
      state.syncEnabled = false;
      state.syncDisabledReason = 'Device not registered for offline mode';
      // Reset MQTT state
      state.mqttConnected = false;
      state.mqttConnectionType = null;
      state.discoveredDevices = [];
      state.mqttError = null;
    },

    // MQTT Reducers (Phase 3)
    /** Set MQTT connection status */
    setMqttConnected: (
      state,
      action: PayloadAction<{ connected: boolean; connectionType: 'local' | 'cloud' | null }>
    ) => {
      state.mqttConnected = action.payload.connected;
      state.mqttConnectionType = action.payload.connectionType;
      if (action.payload.connected) {
        state.mqttError = null;
      }
    },

    /** Set MQTT connection error */
    setMqttError: (state, action: PayloadAction<string | null>) => {
      state.mqttError = action.payload;
      if (action.payload) {
        state.mqttConnected = false;
      }
    },

    /** Update discovered devices list */
    setDiscoveredDevices: (state, action: PayloadAction<DevicePresence[]>) => {
      state.discoveredDevices = action.payload;
    },

    /** Add or update a single device in the discovered list */
    upsertDiscoveredDevice: (state, action: PayloadAction<DevicePresence>) => {
      const index = state.discoveredDevices.findIndex(
        (d) => d.deviceId === action.payload.deviceId
      );
      if (index >= 0) {
        state.discoveredDevices[index] = action.payload;
      } else {
        state.discoveredDevices.push(action.payload);
      }
    },

    /** Remove a device from discovered list (went offline) */
    removeDiscoveredDevice: (state, action: PayloadAction<string>) => {
      state.discoveredDevices = state.discoveredDevices.filter(
        (d) => d.deviceId !== action.payload
      );
    },
  },
});

export const {
  setOnlineStatus,
  setSyncing,
  setPendingOperations,
  setSyncComplete,
  setSyncError,
  enableSync,
  disableSync,
  resetSyncState,
  // MQTT actions
  setMqttConnected,
  setMqttError,
  setDiscoveredDevices,
  upsertDiscoveredDevice,
  removeDiscoveredDevice,
} = syncSlice.actions;

// Selectors
export const selectIsOnline = (state: RootState) => state.sync.isOnline;
export const selectIsSyncing = (state: RootState) => state.sync.isSyncing;
export const selectPendingOperations = (state: RootState) => state.sync.pendingOperations;
export const selectLastSyncAt = (state: RootState) => state.sync.lastSyncAt;
export const selectSyncError = (state: RootState) => state.sync.error;
export const selectSyncEnabled = (state: RootState) => state.sync.syncEnabled;
export const selectSyncDisabledReason = (state: RootState) => state.sync.syncDisabledReason;

/** Check if sync should run (enabled + online) */
export const selectShouldSync = (state: RootState) =>
  state.sync.syncEnabled && state.sync.isOnline && !state.sync.isSyncing;

// MQTT Selectors (Phase 3)
export const selectMqttConnected = (state: RootState) => state.sync.mqttConnected;
export const selectMqttConnectionType = (state: RootState) => state.sync.mqttConnectionType;
export const selectDiscoveredDevices = (state: RootState) => state.sync.discoveredDevices;
export const selectMqttError = (state: RootState) => state.sync.mqttError;

/** Get the hub device (Store App with embedded Mosquitto) */
export const selectHubDevice = (state: RootState) =>
  state.sync.discoveredDevices.find((d) => d.isHub && d.isOnline);

/** Check if connected to local broker */
export const selectIsLocalMqtt = (state: RootState) =>
  state.sync.mqttConnected && state.sync.mqttConnectionType === 'local';

export default syncSlice.reducer;
