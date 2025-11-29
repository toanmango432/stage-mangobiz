/**
 * Device Types
 * A device is a specific machine/browser that accesses the POS
 */

export type DeviceStatus = 'active' | 'inactive' | 'blocked';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution?: string;
  language?: string;
}

export interface Device {
  id: string;
  storeId: string;
  licenseId: string;            // Denormalized for easier queries
  tenantId: string;             // Denormalized for easier queries
  deviceFingerprint: string;    // Unique identifier for the device
  name?: string;                // Optional friendly name
  deviceInfo: DeviceInfo;
  status: DeviceStatus;
  lastSeenAt: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceInput {
  storeId: string;
  licenseId: string;
  tenantId: string;
  deviceFingerprint: string;
  name?: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
}

export interface UpdateDeviceInput {
  name?: string;
  status?: DeviceStatus;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
}
