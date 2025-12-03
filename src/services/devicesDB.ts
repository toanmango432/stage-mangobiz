/**
 * Devices Database Operations
 *
 * Provides CRUD operations for device management via Supabase.
 * Handles device registration, mode toggling, and revocation.
 */

import { supabase } from '@/admin/db/supabaseClient';
import type {
  Device,
  DevicePolicy,
  DeviceRegistration,
  DeviceCheckResponse,
  DeviceActivityAction,
} from '@/types/device';

// ==================== HELPER FUNCTIONS ====================

// Convert snake_case to camelCase
function toCamelCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj as Record<string, unknown>).reduce(
    (acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
      return acc;
    },
    {} as Record<string, unknown>
  );
}

// Convert camelCase to snake_case (reserved for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// function __toSnakeCase(obj: unknown): unknown {
//   if (obj === null || typeof obj !== 'object') return obj;
//   if (Array.isArray(obj)) return obj.map(_toSnakeCase);
//   if (obj instanceof Date) return obj.toISOString();
//
//   return Object.keys(obj as Record<string, unknown>).reduce(
//     (acc, key) => {
//       const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
//       acc[snakeKey] = _toSnakeCase((obj as Record<string, unknown>)[key]);
//       return acc;
//     },
//     {} as Record<string, unknown>
//   );
// }

// ==================== DEVICES ====================

export const devicesDB = {
  /**
   * Get all devices for a store
   */
  async getByStoreId(storeId: string): Promise<Device[]> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('store_id', storeId)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCamelCase) as Device[];
  },

  /**
   * Get a device by ID
   */
  async getById(id: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? (toCamelCase(data) as Device) : null;
  },

  /**
   * Get a device by fingerprint and store
   */
  async getByFingerprint(storeId: string, fingerprint: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('store_id', storeId)
      .eq('device_fingerprint', fingerprint)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? (toCamelCase(data) as Device) : null;
  },

  /**
   * Register a new device or update existing
   */
  async registerDevice(
    storeId: string,
    licenseId: string,
    tenantId: string,
    registration: DeviceRegistration,
    policy: DevicePolicy,
    registeredBy?: string
  ): Promise<{ device: Device; isNewDevice: boolean }> {
    // Check if device already exists
    const existing = await this.getByFingerprint(storeId, registration.deviceFingerprint);

    if (existing) {
      // Update last login
      const updated = await this.recordLogin(existing.id);
      return { device: updated || existing, isNewDevice: false };
    }

    // Check max offline devices if requesting offline mode
    const requestingOffline =
      registration.requestedMode === 'offline-enabled' ||
      (policy.defaultMode === 'offline-enabled' && !registration.requestedMode);

    let offlineModeEnabled = false;

    if (requestingOffline) {
      const offlineCount = await this.countOfflineDevices(storeId);
      offlineModeEnabled = offlineCount < policy.maxOfflineDevices;
    }

    // Create new device
    const device = {
      store_id: storeId,
      license_id: licenseId,
      tenant_id: tenantId,
      device_fingerprint: registration.deviceFingerprint,
      device_name: registration.deviceName || null,
      device_type: registration.deviceType,
      user_agent: registration.userAgent,
      browser: registration.browser || null,
      os: registration.os || null,
      status: 'active',
      offline_mode_enabled: offlineModeEnabled,
      is_revoked: false,
      registered_by: registeredBy || null,
      last_login_at: new Date().toISOString(),
      registered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('devices')
      .insert(device)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(data.id, 'register', {
      deviceName: registration.deviceName,
      deviceType: registration.deviceType,
      offlineModeEnabled,
    });

    return { device: toCamelCase(data) as Device, isNewDevice: true };
  },

  /**
   * Update device settings
   */
  async update(
    id: string,
    updates: { deviceName?: string; offlineModeEnabled?: boolean }
  ): Promise<Device | null> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.deviceName !== undefined) {
      updateData.device_name = updates.deviceName;
    }

    if (updates.offlineModeEnabled !== undefined) {
      updateData.offline_mode_enabled = updates.offlineModeEnabled;

      // Log mode change
      await this.logActivity(id, 'mode_change', {
        offlineModeEnabled: updates.offlineModeEnabled,
      });
    }

    const { data, error } = await supabase
      .from('devices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? (toCamelCase(data) as Device) : null;
  },

  /**
   * Record device login
   */
  async recordLogin(id: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .update({
        last_login_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(id, 'login', {});

    return data ? (toCamelCase(data) as Device) : null;
  },

  /**
   * Record device sync
   */
  async recordSync(id: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .update({
        last_sync_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity (with throttling - not every sync)
    // await this.logActivity(id, 'sync', {});

    return data ? (toCamelCase(data) as Device) : null;
  },

  /**
   * Revoke a device
   */
  async revoke(id: string, revokedBy: string, reason?: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
        revoke_reason: reason || null,
        status: 'blocked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(id, 'revoke', { revokedBy, reason });

    return data ? (toCamelCase(data) as Device) : null;
  },

  /**
   * Check if device is valid (not revoked)
   */
  async checkDevice(deviceId: string): Promise<DeviceCheckResponse> {
    const device = await this.getById(deviceId);

    if (!device) {
      return {
        valid: false,
        reason: 'not_found',
        message: 'Device not found',
      };
    }

    if (device.isRevoked) {
      return {
        valid: false,
        reason: 'revoked',
        message: device.revokeReason || 'Device has been revoked',
      };
    }

    if (device.status === 'blocked') {
      return {
        valid: false,
        reason: 'blocked',
        message: 'Device has been blocked',
      };
    }

    // Update last seen
    await supabase
      .from('devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', deviceId);

    return {
      valid: true,
      offlineModeEnabled: device.offlineModeEnabled,
    };
  },

  /**
   * Count offline-enabled devices for a store
   */
  async countOfflineDevices(storeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('offline_mode_enabled', true)
      .eq('is_revoked', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Delete a device record
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('devices').delete().eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Log device activity
   */
  async logActivity(
    deviceId: string,
    action: DeviceActivityAction,
    details: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    try {
      await supabase.from('device_activity_log').insert({
        device_id: deviceId,
        action,
        details,
        ip_address: ipAddress || null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Don't fail main operation if logging fails
      console.warn('Failed to log device activity:', error);
    }
  },

  /**
   * Get activity log for a device
   */
  async getActivityLog(
    deviceId: string,
    limit: number = 50
  ): Promise<Array<{ id: string; action: string; details: unknown; createdAt: string }>> {
    const { data, error } = await supabase
      .from('device_activity_log')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(toCamelCase) as Array<{
      id: string;
      action: string;
      details: unknown;
      createdAt: string;
    }>;
  },
};

// ==================== STORE DEVICE POLICY ====================

export const devicePolicyDB = {
  /**
   * Get device policy for a store
   */
  async getPolicy(storeId: string): Promise<DevicePolicy> {
    const { data, error } = await supabase
      .from('stores')
      .select('device_policy')
      .eq('id', storeId)
      .single();

    if (error) throw error;

    // Return stored policy or default
    return (data?.device_policy as DevicePolicy) || {
      defaultMode: 'offline-enabled',
      allowUserOverride: false,
      maxOfflineDevices: 5,
      offlineGraceDays: 7,
    };
  },

  /**
   * Update device policy for a store
   */
  async updatePolicy(storeId: string, policy: Partial<DevicePolicy>): Promise<DevicePolicy> {
    // Get current policy
    const current = await this.getPolicy(storeId);

    // Merge with updates
    const updated = { ...current, ...policy };

    const { error } = await supabase
      .from('stores')
      .update({
        device_policy: updated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) throw error;
    return updated;
  },
};
