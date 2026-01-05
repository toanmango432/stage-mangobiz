/**
 * Electron Main Process
 * Entry point for the Mango POS desktop application
 *
 * Part of: MQTT Architecture Implementation (Phase 2)
 */

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { MosquittoManager } from './mosquitto/MosquittoManager';
import { NetworkMonitor } from './services/NetworkMonitor';
import { HeartbeatService } from './services/HeartbeatService';

// =============================================================================
// Constants
// =============================================================================

const isDev = process.env.NODE_ENV === 'development';
const WINDOW_WIDTH = 1400;
const WINDOW_HEIGHT = 900;
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;

// =============================================================================
// Global References
// =============================================================================

let mainWindow: BrowserWindow | null = null;
let mosquittoManager: MosquittoManager | null = null;
let networkMonitor: NetworkMonitor | null = null;
let heartbeatService: HeartbeatService | null = null;

// =============================================================================
// Window Creation
// =============================================================================

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    title: 'Mango POS',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for preload scripts
    },
  });

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load the app
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =============================================================================
// Mosquitto Broker Management
// =============================================================================

async function startMosquittoBroker(): Promise<void> {
  try {
    mosquittoManager = new MosquittoManager();
    await mosquittoManager.start();
    console.log('[Main] Mosquitto broker started');

    // Send broker info to renderer
    if (mainWindow) {
      const brokerInfo = mosquittoManager.getBrokerInfo();
      mainWindow.webContents.send('mosquitto:started', brokerInfo);
    }
  } catch (error) {
    console.error('[Main] Failed to start Mosquitto:', error);
    // Continue without local broker - will use cloud fallback
  }
}

async function stopMosquittoBroker(): Promise<void> {
  if (mosquittoManager) {
    await mosquittoManager.stop();
    mosquittoManager = null;
    console.log('[Main] Mosquitto broker stopped');
  }
}

// =============================================================================
// Network Monitoring
// =============================================================================

function startNetworkMonitor(): void {
  networkMonitor = new NetworkMonitor();

  networkMonitor.on('ip-changed', (newIp: string) => {
    console.log('[Main] IP address changed:', newIp);

    // Update heartbeat service with new IP
    if (heartbeatService) {
      heartbeatService.updateLocalIp(newIp);
    }

    // Notify renderer
    if (mainWindow) {
      mainWindow.webContents.send('network:ip-changed', newIp);
    }
  });

  networkMonitor.start();
  console.log('[Main] Network monitor started');
}

function stopNetworkMonitor(): void {
  if (networkMonitor) {
    networkMonitor.stop();
    networkMonitor = null;
    console.log('[Main] Network monitor stopped');
  }
}

// =============================================================================
// Heartbeat Service
// =============================================================================

function startHeartbeatService(): void {
  const localIp = networkMonitor?.getCurrentIp() || null;
  const mqttPort = mosquittoManager?.getPort() || 1883;

  heartbeatService = new HeartbeatService({
    localIp,
    mqttPort,
    isHub: true, // Store App is always the hub
  });

  heartbeatService.start();
  console.log('[Main] Heartbeat service started');
}

function stopHeartbeatService(): void {
  if (heartbeatService) {
    heartbeatService.stop();
    heartbeatService = null;
    console.log('[Main] Heartbeat service stopped');
  }
}

// =============================================================================
// IPC Handlers
// =============================================================================

function setupIpcHandlers(): void {
  // Get Mosquitto broker info
  ipcMain.handle('mosquitto:get-info', () => {
    return mosquittoManager?.getBrokerInfo() || null;
  });

  // Get network info
  ipcMain.handle('network:get-ip', () => {
    return networkMonitor?.getCurrentIp() || null;
  });

  // Get device info
  ipcMain.handle('device:get-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      isHub: true,
      localIp: networkMonitor?.getCurrentIp() || null,
      mqttPort: mosquittoManager?.getPort() || 1883,
    };
  });

  // Restart Mosquitto broker
  ipcMain.handle('mosquitto:restart', async () => {
    await stopMosquittoBroker();
    await startMosquittoBroker();
    return mosquittoManager?.getBrokerInfo() || null;
  });
}

// =============================================================================
// App Lifecycle
// =============================================================================

app.whenReady().then(async () => {
  console.log('[Main] App ready');

  // Setup IPC handlers
  setupIpcHandlers();

  // Start network monitor first (needed for IP detection)
  startNetworkMonitor();

  // Start Mosquitto broker
  await startMosquittoBroker();

  // Start heartbeat service
  startHeartbeatService();

  // Create main window
  await createWindow();

  // macOS: Re-create window when dock icon clicked
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log('[Main] App quitting...');

  // Stop services in reverse order
  stopHeartbeatService();
  stopNetworkMonitor();
  await stopMosquittoBroker();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason);
});
