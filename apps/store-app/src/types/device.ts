/**
 * Device Types for Opt-In Offline Mode
 *
 * These types define device registration, mode management,
 * and policy configuration for the offline mode feature.
 */

// ==================== CORE TYPES ====================

/**
 * Device operating mode
 * - online-only: No local storage, requires network
 * - offline-enabled: Full IndexedDB storage, works offline
 */
export type DeviceMode = 'online-only' | 'offline-enabled';

/**
 * Device platform type
 */
export type DeviceType = 'ios' | 'android' | 'web' | 'desktop';

/**
 * Device status
 */
export type DeviceStatus = 'active' | 'blocked' | 'pending';

// ==================== DEVICE ====================

/**
 * Registered device in the system
 */
export interface Device {
  id: string;
  tenantId: string;
  storeId: string;
  licenseId: string;

  // Identification
  deviceFingerprint: string;
  deviceName: string | null;
  deviceType: DeviceType;
  userAgent: string;
  browser: string | null;
  os: string | null;

  // Mode & Status
  status: DeviceStatus;
  offlineModeEnabled: boolean;

  // Revocation
  isRevoked: boolean;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;

  // Tracking
  registeredAt: string;
  registeredBy: string | null;
  lastLoginAt: string | null;
  lastSyncAt: string | null;
  lastSeenAt: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ==================== DEVICE POLICY ====================

/**
 * Store-level device policy configuration
 */
export interface DevicePolicy {
  /** Default mode for new devices */
  defaultMode: DeviceMode;

  /** Whether users can request a different mode at login */
  allowUserOverride: boolean;

  /** Maximum number of offline-enabled devices per store */
  maxOfflineDevices: number;

  /** Days a device can operate offline before requiring re-auth */
  offlineGraceDays: number;
}

/**
 * Default device policy
 */
export const DEFAULT_DEVICE_POLICY: DevicePolicy = {
  defaultMode: 'offline-enabled',
  allowUserOverride: false,
  maxOfflineDevices: 5,
  offlineGraceDays: 7,
};

// ==================== REGISTRATION ====================

/**
 * Device registration payload sent during login
 */
export interface DeviceRegistration {
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: DeviceType;
  userAgent: string;
  browser?: string;
  os?: string;
  requestedMode?: DeviceMode;
}

/**
 * Device info returned in login response
 */
export interface DeviceLoginResponse {
  device: {
    id: string;
    offlineModeEnabled: boolean;
    isNewDevice: boolean;
  };
  storePolicy: DevicePolicy;
}

// ==================== DEVICE MANAGEMENT ====================

/**
 * Request to update device settings
 */
export interface UpdateDeviceRequest {
  deviceName?: string;
  offlineModeEnabled?: boolean;
}

/**
 * Request to revoke a device
 */
export interface RevokeDeviceRequest {
  reason?: string;
}

/**
 * Device revocation check response
 */
export interface DeviceCheckResponse {
  valid: boolean;
  offlineModeEnabled?: boolean;
  reason?: string;
  message?: string;
}

// ==================== ACTIVITY LOG ====================

/**
 * Device activity types
 */
export type DeviceActivityAction =
  | 'login'
  | 'logout'
  | 'sync'
  | 'mode_change'
  | 'revoke'
  | 'register';

/**
 * Device activity log entry
 */
export interface DeviceActivityLog {
  id: string;
  deviceId: string;
  action: DeviceActivityAction;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

// ==================== AUTH STATE EXTENSION ====================

/**
 * Device state stored in Redux auth slice
 */
export interface AuthDeviceState {
  id: string;
  mode: DeviceMode;
  offlineModeEnabled: boolean;
  registeredAt: string;
}
