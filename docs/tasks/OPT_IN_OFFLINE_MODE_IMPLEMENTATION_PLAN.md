# Opt-In Offline Mode - Implementation Plan

**Version:** 1.0.0
**Status:** Ready for Review
**Created:** December 1, 2025
**PRD:** [PRD-Opt-In-Offline-Mode.md](../docs/product/PRD-Opt-In-Offline-Mode.md)

---

## Executive Summary

This plan implements "Opt-In Offline Mode" with an **improved architecture** that addresses scalability and maintainability concerns identified in the original implementation guide.

### Key Architectural Improvement

**Instead of:** Modifying 30+ Redux thunks with duplicate mode-checking logic
**We will:** Create a centralized `DataService` that handles mode routing transparently

---

## Phase Overview

| Phase | Description | Files Changed | Estimated Effort |
|-------|-------------|---------------|------------------|
| **0** | Architecture Refactoring | 5 new, 2 modified | Foundation |
| **1** | Device Registration & Auth | 3 new, 3 modified | Core |
| **2** | Mode Context & Conditional Init | 2 new, 3 modified | Core |
| **3** | Sync System Updates | 0 new, 3 modified | Integration |
| **4** | UI Updates | 3 new, 2 modified | UI |
| **5** | Admin Portal | 2 new, 1 modified | Admin |
| **6** | Testing & Polish | Tests + fixes | Quality |

---

## Phase 0: Architecture Refactoring (Foundation)

### Goal
Create a `DataService` abstraction that handles online-only vs offline-enabled routing in ONE place.

### Files to Create

#### 1. `src/services/dataService/types.ts`
```typescript
// Data operation types
export type DataMode = 'online-only' | 'offline-enabled';

export interface DataServiceConfig {
  mode: DataMode;
  storeId: string;
  deviceId: string;
}

export interface QueryOptions {
  forceRefresh?: boolean;
  includeDeleted?: boolean;
}

export interface MutationResult<T> {
  data: T;
  syncStatus: 'synced' | 'pending' | 'n/a';
}
```

#### 2. `src/services/dataService/DataService.ts`
```typescript
import { DataMode, DataServiceConfig, QueryOptions, MutationResult } from './types';
import { OnlineDataSource } from './OnlineDataSource';
import { OfflineDataSource } from './OfflineDataSource';

/**
 * Central data access layer that routes to appropriate source based on mode.
 * This is the ONLY place that knows about online vs offline differences.
 */
class DataService {
  private mode: DataMode;
  private source: OnlineDataSource | OfflineDataSource;

  constructor(config: DataServiceConfig) {
    this.mode = config.mode;
    this.source = config.mode === 'offline-enabled'
      ? new OfflineDataSource(config)
      : new OnlineDataSource(config);
  }

  // ============ APPOINTMENTS ============

  async getAppointments(date: string, options?: QueryOptions): Promise<Appointment[]> {
    return this.source.getAppointments(date, options);
  }

  async createAppointment(data: CreateAppointmentInput): Promise<MutationResult<Appointment>> {
    return this.source.createAppointment(data);
  }

  async updateAppointment(id: string, data: UpdateAppointmentInput): Promise<MutationResult<Appointment>> {
    return this.source.updateAppointment(id, data);
  }

  async deleteAppointment(id: string): Promise<MutationResult<void>> {
    return this.source.deleteAppointment(id);
  }

  // ============ TICKETS ============

  async getTickets(date: string, options?: QueryOptions): Promise<Ticket[]> {
    return this.source.getTickets(date, options);
  }

  async createTicket(data: CreateTicketInput): Promise<MutationResult<Ticket>> {
    return this.source.createTicket(data);
  }

  // ... similar methods for all entities

  // ============ UTILITY ============

  getMode(): DataMode {
    return this.mode;
  }

  isOfflineEnabled(): boolean {
    return this.mode === 'offline-enabled';
  }
}

// Singleton instance
let dataServiceInstance: DataService | null = null;

export function initializeDataService(config: DataServiceConfig): DataService {
  dataServiceInstance = new DataService(config);
  return dataServiceInstance;
}

export function getDataService(): DataService {
  if (!dataServiceInstance) {
    throw new Error('DataService not initialized. Call initializeDataService first.');
  }
  return dataServiceInstance;
}

export function resetDataService(): void {
  dataServiceInstance = null;
}
```

#### 3. `src/services/dataService/OnlineDataSource.ts`
```typescript
import { apiClient } from '@/api/client';

/**
 * Data source for online-only mode.
 * All operations go directly to API with NO local persistence.
 */
export class OnlineDataSource {
  private storeId: string;

  constructor(config: DataServiceConfig) {
    this.storeId = config.storeId;
  }

  // ============ APPOINTMENTS ============

  async getAppointments(date: string): Promise<Appointment[]> {
    const response = await apiClient.get(`/appointments`, {
      params: { storeId: this.storeId, date }
    });
    return response.data;
  }

  async createAppointment(data: CreateAppointmentInput): Promise<MutationResult<Appointment>> {
    const response = await apiClient.post('/appointments', {
      ...data,
      storeId: this.storeId
    });
    return {
      data: response.data,
      syncStatus: 'synced' // Online mode is always synced
    };
  }

  async updateAppointment(id: string, data: UpdateAppointmentInput): Promise<MutationResult<Appointment>> {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return {
      data: response.data,
      syncStatus: 'synced'
    };
  }

  async deleteAppointment(id: string): Promise<MutationResult<void>> {
    await apiClient.delete(`/appointments/${id}`);
    return {
      data: undefined,
      syncStatus: 'synced'
    };
  }

  // ... similar for tickets, clients, staff, etc.
}
```

#### 4. `src/services/dataService/OfflineDataSource.ts`
```typescript
import { db } from '@/db/database';
import { syncQueue } from '@/services/syncService';
import { generateId } from '@/utils/generateId';

/**
 * Data source for offline-enabled mode.
 * Operations go to IndexedDB first, then sync queue.
 * This is essentially the CURRENT behavior, extracted into a class.
 */
export class OfflineDataSource {
  private storeId: string;
  private deviceId: string;

  constructor(config: DataServiceConfig) {
    this.storeId = config.storeId;
    this.deviceId = config.deviceId;
  }

  // ============ APPOINTMENTS ============

  async getAppointments(date: string): Promise<Appointment[]> {
    return db.appointments
      .where('date')
      .equals(date)
      .and(a => a.storeId === this.storeId)
      .toArray();
  }

  async createAppointment(data: CreateAppointmentInput): Promise<MutationResult<Appointment>> {
    const appointment: Appointment = {
      ...data,
      id: generateId(),
      storeId: this.storeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByDevice: this.deviceId,
      lastModifiedByDevice: this.deviceId,
      syncStatus: 'pending',
      vectorClock: { [this.deviceId]: 1 }
    };

    await db.appointments.add(appointment);
    await syncQueue.add('create', 'appointment', appointment);

    return {
      data: appointment,
      syncStatus: 'pending'
    };
  }

  // ... similar for all entities (mirrors current behavior)
}
```

#### 5. `src/services/dataService/index.ts`
```typescript
export * from './types';
export * from './DataService';
export { OnlineDataSource } from './OnlineDataSource';
export { OfflineDataSource } from './OfflineDataSource';
```

### Files to Modify

#### 1. Update Redux Thunks Pattern

**Before (current):**
```typescript
// src/store/slices/appointmentsSlice.ts
export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (data: CreateAppointmentInput) => {
    const appointment = { ...data, id: generateId() };
    await db.appointments.add(appointment);
    await syncQueue.add('create', 'appointment', appointment);
    return appointment;
  }
);
```

**After (with DataService):**
```typescript
// src/store/slices/appointmentsSlice.ts
import { getDataService } from '@/services/dataService';

export const createAppointment = createAsyncThunk(
  'appointments/create',
  async (data: CreateAppointmentInput) => {
    const result = await getDataService().createAppointment(data);
    return result.data;
  }
);
```

### Validation Checkpoint

Before moving to Phase 1:
- [ ] DataService can be initialized with either mode
- [ ] OnlineDataSource makes API calls correctly
- [ ] OfflineDataSource uses IndexedDB correctly
- [ ] Existing app works unchanged (offline-enabled mode)
- [ ] Run `npm run build` - no TypeScript errors

---

## Phase 1: Device Registration & Auth

### Goal
Add device tracking to the authentication flow.

### Files to Create

#### 1. `src/types/device.ts`
```typescript
export type DeviceMode = 'online-only' | 'offline-enabled';
export type DeviceType = 'ios' | 'android' | 'web' | 'desktop';

export interface Device {
  id: string;
  tenantId: string;
  storeId: string;
  deviceFingerprint: string;
  deviceName: string | null;
  deviceType: DeviceType;
  userAgent: string;
  offlineModeEnabled: boolean;
  isActive: boolean;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
  registeredAt: string;
  registeredBy: string;
  lastLoginAt: string | null;
  lastSyncAt: string | null;
}

export interface DevicePolicy {
  defaultMode: DeviceMode;
  allowUserOverride: boolean;
  maxOfflineDevices: number;
  offlineGraceDays: number;
}

export interface DeviceRegistration {
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: DeviceType;
  userAgent: string;
  requestedMode?: DeviceMode;
}

export interface DeviceLoginResponse {
  device: {
    id: string;
    offlineModeEnabled: boolean;
    isNewDevice: boolean;
  };
  storePolicy: DevicePolicy;
}
```

#### 2. `src/services/deviceManager.ts`
```typescript
import { DeviceType, DeviceRegistration } from '@/types/device';

const DEVICE_ID_KEY = 'mango_device_id';

/**
 * Manages device identification and fingerprinting.
 */
class DeviceManager {
  private cachedFingerprint: string | null = null;

  /**
   * Get or create a stable device identifier.
   * Uses localStorage for persistence across sessions.
   */
  getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Generate a unique device ID.
   */
  private generateDeviceId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a fingerprint from device characteristics.
   * Used as secondary identifier for device matching.
   */
  async getFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency?.toString() || 'unknown',
      navigator.maxTouchPoints?.toString() || '0',
    ];

    const data = components.join('|');
    const hash = await this.sha256(data);
    this.cachedFingerprint = hash;
    return hash;
  }

  private async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Detect the device type based on user agent.
   */
  getDeviceType(): DeviceType {
    const ua = navigator.userAgent.toLowerCase();

    if (/ipad|iphone|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/electron/.test(ua)) return 'desktop';
    return 'web';
  }

  /**
   * Build registration payload for login.
   */
  async buildRegistration(deviceName?: string, requestedMode?: DeviceMode): Promise<DeviceRegistration> {
    return {
      deviceFingerprint: await this.getFingerprint(),
      deviceName,
      deviceType: this.getDeviceType(),
      userAgent: navigator.userAgent,
      requestedMode
    };
  }

  /**
   * Clear device identity (used when device is revoked).
   */
  clearDeviceId(): void {
    localStorage.removeItem(DEVICE_ID_KEY);
    this.cachedFingerprint = null;
  }
}

export const deviceManager = new DeviceManager();
```

#### 3. `src/services/revocationChecker.ts`
```typescript
import { apiClient } from '@/api/client';
import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { clearLocalData } from '@/utils/clearLocalData';

/**
 * Periodically checks if device has been revoked.
 */
class RevocationChecker {
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 5 * 60 * 1000; // 5 minutes
  private deviceId: string | null = null;

  start(deviceId: string): void {
    this.deviceId = deviceId;
    this.stop(); // Clear any existing interval

    // Check immediately
    this.check();

    // Then check periodically
    this.intervalId = setInterval(() => this.check(), this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async check(): Promise<void> {
    if (!this.deviceId) return;

    try {
      const response = await apiClient.get('/devices/check', {
        headers: { 'X-Device-ID': this.deviceId }
      });

      if (!response.data.valid) {
        await this.handleRevocation(response.data.reason);
      }
    } catch (error) {
      // Network error - continue with grace period if offline-enabled
      console.warn('Revocation check failed:', error);
    }
  }

  private async handleRevocation(reason: string): Promise<void> {
    this.stop();

    // Clear all local data
    await clearLocalData();

    // Logout from Redux
    store.dispatch(logout());

    // Show message (toast will be triggered by logout)
    console.error(`Device revoked: ${reason}`);
  }
}

export const revocationChecker = new RevocationChecker();
```

### Files to Modify

#### 1. `src/store/slices/authSlice.ts`
Add device info to auth state:
```typescript
interface AuthState {
  // ... existing fields
  device: {
    id: string;
    mode: DeviceMode;
    offlineModeEnabled: boolean;
    registeredAt: string;
  } | null;
  storePolicy: DevicePolicy | null;
}
```

#### 2. `src/services/storeAuthManager.ts`
Modify login to include device registration:
```typescript
async login(storeId: string, password: string, deviceInfo?: DeviceRegistration) {
  const response = await storeAuthApi.login({
    storeId,
    password,
    device: deviceInfo
  });

  // Store device info
  this.deviceMode = response.device.offlineModeEnabled ? 'offline-enabled' : 'online-only';

  return response;
}
```

#### 3. `src/api/storeAuthApi.ts`
Update login request/response types to include device info.

### Validation Checkpoint

Before moving to Phase 2:
- [ ] Device fingerprint generates consistently
- [ ] Device ID persists in localStorage
- [ ] Login request includes device registration
- [ ] Login response includes device mode
- [ ] Auth state includes device info
- [ ] Run `npm run build` - no TypeScript errors

---

## Phase 2: Mode Context & Conditional Initialization

### Goal
Create React context for mode and make database initialization conditional.

### Files to Create

#### 1. `src/contexts/ModeContext.tsx`
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DeviceMode } from '@/types/device';
import { initializeDataService, resetDataService } from '@/services/dataService';

interface ModeContextValue {
  mode: DeviceMode;
  deviceId: string;
  isOfflineEnabled: boolean;
  isInitialized: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

interface ModeProviderProps {
  mode: DeviceMode;
  deviceId: string;
  storeId: string;
  children: React.ReactNode;
}

export function ModeProvider({ mode, deviceId, storeId, children }: ModeProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize DataService with the correct mode
    initializeDataService({ mode, deviceId, storeId });
    setIsInitialized(true);

    return () => {
      resetDataService();
    };
  }, [mode, deviceId, storeId]);

  const value: ModeContextValue = {
    mode,
    deviceId,
    isOfflineEnabled: mode === 'offline-enabled',
    isInitialized
  };

  if (!isInitialized) {
    return <div>Initializing...</div>; // Or loading spinner
  }

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
}
```

#### 2. `src/utils/clearLocalData.ts`
```typescript
import { db } from '@/db/database';

/**
 * Clears all local data from the device.
 * Used when switching to online-only mode or on revocation.
 */
export async function clearLocalData(): Promise<void> {
  // 1. Clear IndexedDB
  try {
    await db.delete();
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }

  // 2. Clear localStorage (except device ID)
  const deviceId = localStorage.getItem('mango_device_id');
  localStorage.clear();
  if (deviceId) {
    localStorage.setItem('mango_device_id', deviceId);
  }

  // 3. Clear sessionStorage
  sessionStorage.clear();

  // 4. Clear service worker cache
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch (error) {
      console.warn('Failed to clear caches:', error);
    }
  }
}
```

### Files to Modify

#### 1. `src/App.tsx`
Make database initialization conditional:
```typescript
function App() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      // 1. Get device ID
      const id = deviceManager.getDeviceId();
      setDeviceId(id);

      // 2. Check if we have a stored session with device mode
      const session = await storeAuthManager.getStoredSession();

      if (session?.device?.offlineModeEnabled) {
        // 3a. Offline-enabled: Initialize IndexedDB
        await initializeDatabase();
        setDeviceMode('offline-enabled');
      } else if (session) {
        // 3b. Online-only: Skip IndexedDB
        setDeviceMode('online-only');
      } else {
        // 3c. No session: Show login
        setDeviceMode(null);
      }
    }

    initialize();
  }, []);

  if (!deviceMode || !deviceId) {
    return <StoreLoginScreen onLogin={handleLogin} />;
  }

  return (
    <ModeProvider mode={deviceMode} deviceId={deviceId} storeId={storeId}>
      <AppShell />
    </ModeProvider>
  );
}
```

#### 2. `src/db/database.ts`
Add conditional initialization check:
```typescript
let isInitialized = false;

export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;

  // Only initialize if we should have offline capability
  await db.open();
  isInitialized = true;
}

export function isDatabaseInitialized(): boolean {
  return isInitialized;
}
```

#### 3. `src/db/schema.ts`
Add deviceSettings table:
```typescript
// Version 6: Add device settings
this.version(6).stores({
  // ... existing tables
  deviceSettings: 'key' // Single row table for device config
});
```

### Validation Checkpoint

Before moving to Phase 3:
- [ ] ModeContext provides correct mode to components
- [ ] useMode() hook works throughout app
- [ ] Online-only login skips IndexedDB initialization
- [ ] Offline-enabled login initializes IndexedDB
- [ ] clearLocalData() removes all local storage
- [ ] App works in both modes
- [ ] Run `npm run build` - no TypeScript errors

**Frontend Validation:**
1. Login with offline mode disabled → verify no IndexedDB tables created
2. Login with offline mode enabled → verify IndexedDB tables exist
3. Check React DevTools for ModeContext value

---

## Phase 3: Sync System Updates

### Goal
Disable sync for online-only devices.

### Files to Modify

#### 1. `src/services/syncManager.ts`
```typescript
class SyncManager {
  private offlineModeEnabled: boolean = false;

  async initialize(offlineModeEnabled: boolean): Promise<void> {
    this.offlineModeEnabled = offlineModeEnabled;

    if (!this.offlineModeEnabled) {
      console.log('SyncManager: Disabled (online-only mode)');
      return;
    }

    // Current initialization logic...
    this.startBackgroundSync();
  }

  async pushChanges(): Promise<void> {
    if (!this.offlineModeEnabled) return;
    // Current push logic...
  }

  async pullChanges(): Promise<void> {
    if (!this.offlineModeEnabled) return;
    // Current pull logic...
  }

  stop(): void {
    // Stop background sync
  }
}
```

#### 2. `src/services/syncService.ts`
```typescript
// Add mode check at the top of queue operations
async add(operation: string, entity: string, data: any): Promise<void> {
  // Only queue if offline mode
  const mode = getDataService().getMode();
  if (mode !== 'offline-enabled') return;

  // Current queue logic...
}
```

#### 3. `src/store/slices/syncSlice.ts`
```typescript
// Update sync status to reflect mode
interface SyncState {
  // ... existing
  mode: DeviceMode;
  isEnabled: boolean;
}

// Set initial state based on mode
```

### Validation Checkpoint

Before moving to Phase 4:
- [ ] Online-only: No sync queue operations
- [ ] Online-only: No background sync running
- [ ] Offline-enabled: Sync works as before
- [ ] Sync status UI reflects correct mode
- [ ] Run `npm run build` - no TypeScript errors

**Frontend Validation:**
1. Online-only mode: Make changes, verify no syncQueue entries
2. Offline-enabled mode: Make changes, verify syncQueue has entries
3. Check Network tab: Online-only should have more API calls

---

## Phase 4: UI Updates

### Goal
Add mode indicators and network error handling for online-only mode.

### Files to Create

#### 1. `src/components/common/OnlineModeIndicator.tsx`
```typescript
import { Cloud, WifiOff, CheckCircle } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSelector } from 'react-redux';

export function OnlineModeIndicator() {
  const { mode, isOfflineEnabled } = useMode();
  const isOnline = useOnlineStatus();
  const pendingCount = useSelector(state => state.sync.pendingCount);

  if (!isOfflineEnabled) {
    // Online-only mode
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
        <Cloud className="h-3 w-3" />
        <span>Online</span>
      </div>
    );
  }

  if (!isOnline) {
    // Offline-enabled but currently offline
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
        <WifiOff className="h-3 w-3" />
        <span>Offline{pendingCount > 0 ? ` (${pendingCount})` : ''}</span>
      </div>
    );
  }

  // Offline-enabled and online (synced)
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
      <CheckCircle className="h-3 w-3" />
      <span>Synced</span>
    </div>
  );
}
```

#### 2. `src/components/common/NetworkErrorScreen.tsx`
```typescript
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NetworkErrorScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function NetworkErrorScreen({ onRetry, isRetrying }: NetworkErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="h-8 w-8 text-red-500" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connection Required
        </h2>

        <p className="text-gray-600 mb-6">
          This device requires an internet connection to operate.
          Please check your connection and try again.
        </p>

        <Button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            'Retry Connection'
          )}
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          Need offline access? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
```

#### 3. `src/components/common/NetworkErrorBoundary.tsx`
```typescript
import React, { Component, ErrorInfo } from 'react';
import { NetworkErrorScreen } from './NetworkErrorScreen';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasNetworkError: boolean;
  isRetrying: boolean;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  state: State = {
    hasNetworkError: false,
    isRetrying: false
  };

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    // Check if it's a network error
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return { hasNetworkError: true };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NetworkErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    // Wait a moment then retry
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState({ hasNetworkError: false, isRetrying: false });
  };

  render() {
    if (this.state.hasNetworkError) {
      return (
        <NetworkErrorScreen
          onRetry={this.handleRetry}
          isRetrying={this.state.isRetrying}
        />
      );
    }

    return this.props.children;
  }
}
```

### Files to Modify

#### 1. `src/components/auth/StoreLoginScreen.tsx`
Add device name input and offline toggle:
```typescript
// Add to form
<Input
  label="Device Name (optional)"
  placeholder="e.g., Front Desk iPad"
  value={deviceName}
  onChange={(e) => setDeviceName(e.target.value)}
/>

{storePolicy?.allowUserOverride && (
  <div className="flex items-center gap-2">
    <Checkbox
      id="enableOffline"
      checked={enableOffline}
      onCheckedChange={setEnableOffline}
    />
    <label htmlFor="enableOffline" className="text-sm">
      Enable offline mode
      <span className="block text-xs text-gray-500">
        Store data on this device for offline access
      </span>
    </label>
  </div>
)}
```

#### 2. `src/components/layout/AppShell.tsx`
Add mode indicator to header:
```typescript
import { OnlineModeIndicator } from '@/components/common/OnlineModeIndicator';

// In header section
<div className="flex items-center gap-4">
  <OnlineModeIndicator />
  {/* ... existing header content */}
</div>
```

### Validation Checkpoint

Before moving to Phase 5:
- [ ] OnlineModeIndicator shows correct state
- [ ] NetworkErrorScreen displays on network failure (online-only)
- [ ] Login screen shows device name input
- [ ] Login screen shows offline toggle (if policy allows)
- [ ] Header displays mode indicator
- [ ] Run `npm run build` - no TypeScript errors

**Frontend Validation:**
1. Login in online-only mode → see "Online" indicator
2. Login in offline-enabled mode → see "Synced" indicator
3. Disconnect network in online-only → see NetworkErrorScreen
4. Disconnect network in offline-enabled → see "Offline" indicator

---

## Phase 5: Admin Portal - Device Management

### Goal
Add device management UI for administrators.

### Files to Create

#### 1. `src/components/admin/DeviceManagement.tsx`
```typescript
import { useState, useEffect } from 'react';
import { Device, DevicePolicy } from '@/types/device';
import { apiClient } from '@/api/client';
import {
  Smartphone,
  Monitor,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2
} from 'lucide-react';

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [policy, setPolicy] = useState<DevicePolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    setLoading(true);
    try {
      const response = await apiClient.get('/devices');
      setDevices(response.data.devices);
      setPolicy(response.data.policy);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOfflineMode(deviceId: string, enabled: boolean) {
    await apiClient.put(`/devices/${deviceId}`, { offlineModeEnabled: enabled });
    fetchDevices();
  }

  async function revokeDevice(deviceId: string, reason: string) {
    await apiClient.post(`/devices/${deviceId}/revoke`, { reason });
    fetchDevices();
  }

  const offlineCount = devices.filter(d => d.offlineModeEnabled && !d.isRevoked).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          <p className="text-gray-600">
            Offline: {offlineCount} of {policy?.maxOfflineDevices || 5} allowed
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowPolicyModal(true)}>
          Edit Policy
        </Button>
      </div>

      <div className="space-y-4">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            onToggleOffline={toggleOfflineMode}
            onRevoke={revokeDevice}
            maxReached={offlineCount >= (policy?.maxOfflineDevices || 5)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 2. `src/components/admin/DevicePolicyModal.tsx`
```typescript
// Modal for editing store device policy
// - Default mode selection
// - Max offline devices
// - Allow user override checkbox
// - Offline grace days
```

### Files to Modify

#### 1. `src/components/admin/AdminRoutes.tsx`
Add device management route:
```typescript
<Route path="/admin/devices" element={<DeviceManagement />} />
```

### Validation Checkpoint

Before moving to Phase 6:
- [ ] Device list loads and displays
- [ ] Can toggle offline mode per device
- [ ] Can revoke a device
- [ ] Policy modal opens and saves
- [ ] Offline device count enforced
- [ ] Run `npm run build` - no TypeScript errors

**Frontend Validation:**
1. Navigate to /admin/devices
2. See list of registered devices
3. Toggle offline mode on a device
4. Revoke a device and verify it's marked

---

## Phase 6: Testing & Polish

### Unit Tests

| Component | Test File |
|-----------|-----------|
| DataService | `src/services/dataService/__tests__/DataService.test.ts` |
| DeviceManager | `src/services/__tests__/deviceManager.test.ts` |
| RevocationChecker | `src/services/__tests__/revocationChecker.test.ts` |
| ModeContext | `src/contexts/__tests__/ModeContext.test.tsx` |

### Integration Tests

| Scenario | Expected |
|----------|----------|
| Login (online-only, new device) | No IndexedDB, device registered |
| Login (offline-enabled, new device) | IndexedDB initialized, full sync |
| Network failure (online-only) | NetworkErrorScreen shown |
| Network failure (offline-enabled) | Continue working |
| Device revocation | Logout within 5 min, clear data |
| Mode switch: offline → online | Clear IndexedDB, confirm dialog |

### E2E Tests

```typescript
// tests/e2e/offline-mode.spec.ts
describe('Opt-In Offline Mode', () => {
  it('should work in online-only mode', async () => {
    // Login without offline mode
    // Verify no IndexedDB tables
    // Create appointment via API
    // Disconnect network → see error screen
  });

  it('should work in offline-enabled mode', async () => {
    // Login with offline mode
    // Verify IndexedDB tables exist
    // Create appointment → saved locally
    // Disconnect network → continue working
    // Reconnect → changes synced
  });
});
```

### Performance Checks

| Metric | Online-Only Target | Offline Target |
|--------|-------------------|----------------|
| Login time | <2s | <5s |
| Page load | <1s | <500ms |
| Action response | <500ms | <100ms |

---

## API Endpoints Required (Backend)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/auth/stores/login` | POST | Modified for device registration | Needs update |
| `/api/devices` | GET | List store devices | New |
| `/api/devices/:id` | PUT | Update device settings | New |
| `/api/devices/:id/revoke` | POST | Revoke device | New |
| `/api/devices/check` | GET | Revocation check | New |
| `/api/stores/:id/device-policy` | PUT | Update policy | New |

---

## Database Changes (Supabase)

```sql
-- See PRD Section 7 for full schema
CREATE TABLE devices ( ... );
ALTER TABLE stores ADD COLUMN device_policy JSONB;
CREATE TABLE device_activity_log ( ... );
```

---

## Feature Flags

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  DEVICE_REGISTRY: true,           // Phase 1
  ONLINE_ONLY_MODE: true,          // Phase 2
  ADMIN_DEVICE_MANAGEMENT: true,   // Phase 5
  DEFAULT_ONLINE_ONLY: false,      // Future: Change default
};
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing offline users | Auto-register as offline-enabled |
| Data loss on mode switch | Show confirmation with pending count |
| Online-only too slow | Add in-memory caching later |
| Fingerprint collisions | Use localStorage device ID as primary |

---

## Success Criteria

- [ ] Online-only devices don't create IndexedDB
- [ ] Offline-enabled devices work as before
- [ ] Admin can manage devices
- [ ] Revocation works within 5 minutes
- [ ] Mode indicator shows correct state
- [ ] No regressions in existing functionality

---

## Review Section

_To be filled after implementation_

### Changes Made
-

### Issues Encountered
-

### Lessons Learned
-

---

*Last Updated: December 1, 2025*
