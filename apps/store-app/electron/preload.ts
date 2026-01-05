/**
 * Electron Preload Script
 * Secure bridge between main process and renderer
 *
 * Part of: MQTT Architecture Implementation (Phase 2)
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// =============================================================================
// Types
// =============================================================================

export interface MosquittoInfo {
  isRunning: boolean;
  port: number;
  pid: number | null;
  startedAt: Date | null;
}

export interface DeviceInfo {
  platform: string;
  arch: string;
  isHub: boolean;
  localIp: string | null;
  mqttPort: number;
}

export interface ElectronAPI {
  // Mosquitto broker
  mosquitto: {
    getInfo: () => Promise<MosquittoInfo | null>;
    restart: () => Promise<MosquittoInfo | null>;
    onStarted: (callback: (info: MosquittoInfo) => void) => () => void;
    onStopped: (callback: () => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
  };

  // Network
  network: {
    getIp: () => Promise<string | null>;
    onIpChanged: (callback: (newIp: string) => void) => () => void;
  };

  // Device
  device: {
    getInfo: () => Promise<DeviceInfo>;
    isElectron: boolean;
    platform: string;
  };

  // App
  app: {
    getVersion: () => string;
    quit: () => void;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a subscription to an IPC event that can be cleaned up
 */
function createEventSubscription<T>(
  channel: string,
  callback: (data: T) => void
): () => void {
  const handler = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

// =============================================================================
// Exposed API
// =============================================================================

const electronAPI: ElectronAPI = {
  // Mosquitto broker management
  mosquitto: {
    getInfo: () => ipcRenderer.invoke('mosquitto:get-info'),
    restart: () => ipcRenderer.invoke('mosquitto:restart'),
    onStarted: (callback) =>
      createEventSubscription('mosquitto:started', callback),
    onStopped: (callback) =>
      createEventSubscription('mosquitto:stopped', callback),
    onError: (callback) =>
      createEventSubscription('mosquitto:error', callback),
  },

  // Network information
  network: {
    getIp: () => ipcRenderer.invoke('network:get-ip'),
    onIpChanged: (callback) =>
      createEventSubscription('network:ip-changed', callback),
  },

  // Device information
  device: {
    getInfo: () => ipcRenderer.invoke('device:get-info'),
    isElectron: true,
    platform: process.platform,
  },

  // App utilities
  app: {
    getVersion: () => process.env.npm_package_version || '1.0.0',
    quit: () => ipcRenderer.send('app:quit'),
  },
};

// =============================================================================
// Expose to Renderer
// =============================================================================

// Expose the API securely via contextBridge
contextBridge.exposeInMainWorld('electron', electronAPI);

// Also expose a flag to detect Electron environment
contextBridge.exposeInMainWorld('isElectron', true);

// =============================================================================
// TypeScript Declaration
// =============================================================================

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI;
    isElectron: boolean;
  }
}
