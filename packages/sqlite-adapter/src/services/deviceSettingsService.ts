/**
 * DeviceSettingsSQLiteService - Device-specific settings storage
 *
 * Provides storage for device-specific configuration including:
 * - Device mode (online, offline)
 * - Offline mode enabled flag
 * - Last sync timestamp
 * - Device-specific settings (printer config, etc.)
 *
 * Unlike entity services, device settings use deviceId as the primary identifier.
 *
 * @module sqlite-adapter/services/deviceSettingsService
 */

import type { SQLiteAdapter } from '../types';
import { safeParseJSON, toJSONString, sqliteToBool, boolToSQLite } from '../utils';

// ==================== TYPES ====================

/**
 * Device mode - determines how the device operates
 */
export type DeviceMode = 'online' | 'offline' | 'hybrid';

/**
 * Device-specific settings stored as JSON
 */
export interface DeviceConfig {
  /** Printer configuration */
  printer?: {
    enabled: boolean;
    name?: string;
    connectionType?: 'usb' | 'network' | 'bluetooth';
    ipAddress?: string;
    port?: number;
  };
  /** Cash drawer configuration */
  cashDrawer?: {
    enabled: boolean;
    printerControlled?: boolean;
  };
  /** Display configuration */
  display?: {
    brightness?: number;
    autoLock?: boolean;
    autoLockMinutes?: number;
  };
  /** Payment terminal configuration */
  paymentTerminal?: {
    enabled: boolean;
    terminalId?: string;
    connectionType?: 'usb' | 'network' | 'bluetooth';
  };
  /** Barcode scanner configuration */
  barcodeScanner?: {
    enabled: boolean;
    connectionType?: 'usb' | 'camera' | 'bluetooth';
  };
  /** Custom device settings */
  [key: string]: unknown;
}

/**
 * Device settings entry
 */
export interface DeviceSettings {
  /** Unique device identifier */
  deviceId: string;
  /** Device operating mode */
  mode: DeviceMode;
  /** Whether offline mode is enabled for this device */
  offlineModeEnabled: boolean;
  /** Last successful sync timestamp */
  lastSyncAt: string | null;
  /** When the device was registered */
  registeredAt: string | null;
  /** Device-specific configuration */
  settings: DeviceConfig | null;
  /** When the settings were created */
  createdAt: string;
  /** When the settings were last updated */
  updatedAt: string;
}

/**
 * Input for creating/updating device settings
 */
export interface DeviceSettingsInput {
  deviceId: string;
  mode?: DeviceMode;
  offlineModeEnabled?: boolean;
  lastSyncAt?: string | null;
  registeredAt?: string | null;
  settings?: DeviceConfig | null;
}

/**
 * Raw row from SQLite device_settings table
 */
interface DeviceSettingsRow {
  device_id: string;
  mode: string;
  offline_mode_enabled: number;
  last_sync_at: string | null;
  registered_at: string | null;
  settings: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for device-specific settings storage
 *
 * @example
 * const deviceSettings = new DeviceSettingsSQLiteService(db);
 *
 * // Register a new device
 * await deviceSettings.register('device-123', 'hybrid');
 *
 * // Get device settings
 * const settings = await deviceSettings.get('device-123');
 *
 * // Update device configuration
 * await deviceSettings.updateConfig('device-123', {
 *   printer: { enabled: true, name: 'Receipt Printer' }
 * });
 */
export class DeviceSettingsSQLiteService {
  protected db: SQLiteAdapter;

  constructor(db: SQLiteAdapter) {
    this.db = db;
  }

  // ==================== CONVERSION METHODS ====================

  /**
   * Convert SQLite row to DeviceSettings object
   */
  private rowToDeviceSettings(row: DeviceSettingsRow): DeviceSettings {
    return {
      deviceId: row.device_id,
      mode: row.mode as DeviceMode,
      offlineModeEnabled: sqliteToBool(row.offline_mode_enabled) ?? false,
      lastSyncAt: row.last_sync_at,
      registeredAt: row.registered_at,
      settings: row.settings ? safeParseJSON<DeviceConfig | null>(row.settings, null) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get device settings by device ID
   *
   * @param deviceId - Device identifier
   * @returns DeviceSettings or undefined if not found
   *
   * @example
   * const settings = await deviceSettings.get('device-123');
   * if (settings) {
   *   console.log(`Device mode: ${settings.mode}`);
   * }
   */
  async get(deviceId: string): Promise<DeviceSettings | undefined> {
    const sql = 'SELECT * FROM device_settings WHERE device_id = ?';
    const row = await this.db.get<DeviceSettingsRow>(sql, [deviceId]);

    if (!row) {
      return undefined;
    }

    return this.rowToDeviceSettings(row);
  }

  /**
   * Set device settings (upsert)
   *
   * Creates new device settings or updates existing.
   *
   * @param deviceId - Device identifier
   * @param input - Settings to set
   * @returns The updated DeviceSettings object
   *
   * @example
   * await deviceSettings.set('device-123', {
   *   deviceId: 'device-123',
   *   mode: 'hybrid',
   *   offlineModeEnabled: true,
   *   settings: { printer: { enabled: true } }
   * });
   */
  async set(deviceId: string, input: Omit<DeviceSettingsInput, 'deviceId'>): Promise<DeviceSettings> {
    const now = new Date().toISOString();
    const existing = await this.get(deviceId);

    const mode = input.mode ?? existing?.mode ?? 'online';
    const offlineModeEnabled = input.offlineModeEnabled ?? existing?.offlineModeEnabled ?? false;
    const lastSyncAt = input.lastSyncAt ?? existing?.lastSyncAt ?? null;
    const registeredAt = input.registeredAt ?? existing?.registeredAt ?? now;
    const settings = input.settings ?? existing?.settings ?? null;

    const sql = `
      INSERT OR REPLACE INTO device_settings (
        device_id, mode, offline_mode_enabled, last_sync_at, registered_at,
        settings, created_at, updated_at
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        COALESCE((SELECT created_at FROM device_settings WHERE device_id = ?), ?),
        ?
      )
    `;

    await this.db.run(sql, [
      deviceId,
      mode,
      boolToSQLite(offlineModeEnabled),
      lastSyncAt,
      registeredAt,
      settings ? toJSONString(settings) : null,
      deviceId,
      now,
      now,
    ]);

    return {
      deviceId,
      mode,
      offlineModeEnabled,
      lastSyncAt,
      registeredAt,
      settings,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  }

  /**
   * Delete device settings
   *
   * @param deviceId - Device identifier
   * @returns true if settings were deleted, false if not found
   */
  async delete(deviceId: string): Promise<boolean> {
    const sql = 'DELETE FROM device_settings WHERE device_id = ?';
    const result = await this.db.run(sql, [deviceId]);

    return result.changes > 0;
  }

  /**
   * Get all device settings
   *
   * @returns Array of all DeviceSettings
   */
  async getAll(): Promise<DeviceSettings[]> {
    const sql = 'SELECT * FROM device_settings ORDER BY registered_at DESC';
    const rows = await this.db.all<DeviceSettingsRow>(sql, []);

    return rows.map((row) => this.rowToDeviceSettings(row));
  }

  /**
   * Check if device exists
   *
   * @param deviceId - Device identifier
   * @returns true if device exists
   */
  async exists(deviceId: string): Promise<boolean> {
    const sql = 'SELECT 1 FROM device_settings WHERE device_id = ? LIMIT 1';
    const row = await this.db.get<{ '1': number }>(sql, [deviceId]);

    return row !== undefined;
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Register a new device
   *
   * Creates settings for a new device with default values.
   *
   * @param deviceId - Device identifier
   * @param mode - Initial device mode (default: 'online')
   * @returns The created DeviceSettings
   *
   * @example
   * const settings = await deviceSettings.register('device-123', 'hybrid');
   */
  async register(deviceId: string, mode: DeviceMode = 'online'): Promise<DeviceSettings> {
    const now = new Date().toISOString();

    // Check if already registered
    const existing = await this.get(deviceId);
    if (existing) {
      return existing;
    }

    const sql = `
      INSERT INTO device_settings (
        device_id, mode, offline_mode_enabled, last_sync_at, registered_at,
        settings, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      deviceId,
      mode,
      0, // offlineModeEnabled = false
      null, // lastSyncAt
      now, // registeredAt
      null, // settings
      now,
      now,
    ]);

    return {
      deviceId,
      mode,
      offlineModeEnabled: false,
      lastSyncAt: null,
      registeredAt: now,
      settings: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update device mode
   *
   * @param deviceId - Device identifier
   * @param mode - New device mode
   * @returns true if updated, false if device not found
   */
  async updateMode(deviceId: string, mode: DeviceMode): Promise<boolean> {
    const now = new Date().toISOString();

    const sql = `
      UPDATE device_settings
      SET mode = ?, updated_at = ?
      WHERE device_id = ?
    `;

    const result = await this.db.run(sql, [mode, now, deviceId]);

    return result.changes > 0;
  }

  /**
   * Enable or disable offline mode
   *
   * @param deviceId - Device identifier
   * @param enabled - Whether offline mode is enabled
   * @returns true if updated, false if device not found
   */
  async setOfflineModeEnabled(deviceId: string, enabled: boolean): Promise<boolean> {
    const now = new Date().toISOString();

    const sql = `
      UPDATE device_settings
      SET offline_mode_enabled = ?, updated_at = ?
      WHERE device_id = ?
    `;

    const result = await this.db.run(sql, [boolToSQLite(enabled), now, deviceId]);

    return result.changes > 0;
  }

  /**
   * Record last sync timestamp
   *
   * @param deviceId - Device identifier
   * @param timestamp - Sync timestamp (default: now)
   * @returns true if updated, false if device not found
   */
  async recordSync(deviceId: string, timestamp?: string): Promise<boolean> {
    const now = new Date().toISOString();
    const syncTime = timestamp ?? now;

    const sql = `
      UPDATE device_settings
      SET last_sync_at = ?, updated_at = ?
      WHERE device_id = ?
    `;

    const result = await this.db.run(sql, [syncTime, now, deviceId]);

    return result.changes > 0;
  }

  /**
   * Update device configuration
   *
   * Merges the provided config with existing config.
   *
   * @param deviceId - Device identifier
   * @param config - Configuration to merge
   * @returns true if updated, false if device not found
   *
   * @example
   * await deviceSettings.updateConfig('device-123', {
   *   printer: { enabled: true, name: 'Receipt Printer' }
   * });
   */
  async updateConfig(deviceId: string, config: Partial<DeviceConfig>): Promise<boolean> {
    const existing = await this.get(deviceId);
    if (!existing) {
      return false;
    }

    const mergedConfig: DeviceConfig = {
      ...existing.settings,
      ...config,
    };

    const now = new Date().toISOString();

    const sql = `
      UPDATE device_settings
      SET settings = ?, updated_at = ?
      WHERE device_id = ?
    `;

    const result = await this.db.run(sql, [toJSONString(mergedConfig), now, deviceId]);

    return result.changes > 0;
  }

  /**
   * Get device configuration
   *
   * @param deviceId - Device identifier
   * @returns Device configuration or null if not found
   */
  async getConfig(deviceId: string): Promise<DeviceConfig | null> {
    const settings = await this.get(deviceId);

    return settings?.settings ?? null;
  }

  /**
   * Clear device configuration
   *
   * Sets settings to null while keeping other device settings.
   *
   * @param deviceId - Device identifier
   * @returns true if updated, false if device not found
   */
  async clearConfig(deviceId: string): Promise<boolean> {
    const now = new Date().toISOString();

    const sql = `
      UPDATE device_settings
      SET settings = NULL, updated_at = ?
      WHERE device_id = ?
    `;

    const result = await this.db.run(sql, [now, deviceId]);

    return result.changes > 0;
  }

  // ==================== QUERY METHODS ====================

  /**
   * Get devices by mode
   *
   * @param mode - Device mode to filter by
   * @returns Array of matching DeviceSettings
   */
  async getByMode(mode: DeviceMode): Promise<DeviceSettings[]> {
    const sql = 'SELECT * FROM device_settings WHERE mode = ? ORDER BY registered_at DESC';
    const rows = await this.db.all<DeviceSettingsRow>(sql, [mode]);

    return rows.map((row) => this.rowToDeviceSettings(row));
  }

  /**
   * Get devices with offline mode enabled
   *
   * @returns Array of devices with offline mode enabled
   */
  async getOfflineEnabled(): Promise<DeviceSettings[]> {
    const sql = 'SELECT * FROM device_settings WHERE offline_mode_enabled = 1 ORDER BY registered_at DESC';
    const rows = await this.db.all<DeviceSettingsRow>(sql, []);

    return rows.map((row) => this.rowToDeviceSettings(row));
  }

  /**
   * Get devices that haven't synced since a given time
   *
   * Useful for finding devices that may need attention.
   *
   * @param since - ISO timestamp to compare against
   * @returns Array of devices that haven't synced since the given time
   */
  async getNotSyncedSince(since: string): Promise<DeviceSettings[]> {
    const sql = `
      SELECT * FROM device_settings
      WHERE last_sync_at IS NULL OR last_sync_at < ?
      ORDER BY last_sync_at ASC NULLS FIRST
    `;
    const rows = await this.db.all<DeviceSettingsRow>(sql, [since]);

    return rows.map((row) => this.rowToDeviceSettings(row));
  }

  /**
   * Count total devices
   *
   * @returns Total count of registered devices
   */
  async count(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM device_settings';
    const result = await this.db.get<{ count: number }>(sql, []);

    return result?.count ?? 0;
  }

  /**
   * Count devices by mode
   *
   * @returns Object with counts per mode
   */
  async countByMode(): Promise<Record<DeviceMode, number>> {
    const sql = `
      SELECT mode, COUNT(*) as count
      FROM device_settings
      GROUP BY mode
    `;
    const rows = await this.db.all<{ mode: string; count: number }>(sql, []);

    // Initialize with zeros
    const result: Record<DeviceMode, number> = {
      online: 0,
      offline: 0,
      hybrid: 0,
    };

    // Fill in actual counts
    for (const row of rows) {
      const mode = row.mode as DeviceMode;
      if (mode in result) {
        result[mode] = row.count;
      }
    }

    return result;
  }

  /**
   * Clear all device settings
   *
   * WARNING: This deletes all device settings. Use with caution.
   *
   * @returns Number of devices deleted
   */
  async clear(): Promise<number> {
    const sql = 'DELETE FROM device_settings';
    const result = await this.db.run(sql, []);

    return result.changes;
  }
}
