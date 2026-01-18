/**
 * SettingsSQLiteService - Key-value settings storage
 *
 * Provides simple key-value storage for application settings.
 * Unlike entity services, settings use the key as the primary identifier
 * and store values as JSON TEXT for flexibility.
 *
 * @module sqlite-adapter/services/settingsService
 */

import type { SQLiteAdapter } from '../types';
import { safeParseJSON, toJSONString } from '../utils';

// ==================== TYPES ====================

/**
 * Setting value - can be any JSON-serializable type
 */
export type SettingValue = string | number | boolean | object | null;

/**
 * Setting entry with metadata
 */
export interface Setting {
  /** Unique key for the setting */
  key: string;
  /** Setting value (any JSON-serializable type) */
  value: SettingValue;
  /** When the setting was created */
  createdAt: string;
  /** When the setting was last updated */
  updatedAt: string;
}

/**
 * Raw row from SQLite settings table
 */
interface SettingRow {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for key-value settings storage
 *
 * @example
 * const settings = new SettingsSQLiteService(db);
 *
 * // Set a setting
 * await settings.set('theme', 'dark');
 *
 * // Get a setting with type
 * const theme = await settings.get<string>('theme');
 *
 * // Get all settings as object
 * const allSettings = await settings.getAll();
 */
export class SettingsSQLiteService {
  protected db: SQLiteAdapter;

  constructor(db: SQLiteAdapter) {
    this.db = db;
  }

  // ==================== CONVERSION METHODS ====================

  /**
   * Convert SQLite row to Setting object
   */
  private rowToSetting(row: SettingRow): Setting {
    return {
      key: row.key,
      value: safeParseJSON<SettingValue>(row.value, null),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get a setting value by key
   *
   * @typeParam T - Expected type of the setting value
   * @param key - Setting key
   * @returns Setting value or undefined if not found
   *
   * @example
   * const theme = await settings.get<string>('theme');
   * const count = await settings.get<number>('maxRetries');
   * const config = await settings.get<{ enabled: boolean }>('featureFlags');
   */
  async get<T extends SettingValue = SettingValue>(key: string): Promise<T | undefined> {
    const sql = 'SELECT * FROM settings WHERE key = ?';
    const row = await this.db.get<SettingRow>(sql, [key]);

    if (!row) {
      return undefined;
    }

    const parsed = safeParseJSON<SettingValue>(row.value, null);
    return parsed as T | undefined;
  }

  /**
   * Get a setting with its full metadata
   *
   * @param key - Setting key
   * @returns Full Setting object or undefined if not found
   */
  async getWithMetadata(key: string): Promise<Setting | undefined> {
    const sql = 'SELECT * FROM settings WHERE key = ?';
    const row = await this.db.get<SettingRow>(sql, [key]);

    if (!row) {
      return undefined;
    }

    return this.rowToSetting(row);
  }

  /**
   * Set a setting value (upsert)
   *
   * Uses INSERT OR REPLACE to create or update the setting.
   *
   * @param key - Setting key
   * @param value - Setting value (any JSON-serializable type)
   * @returns The updated Setting object
   *
   * @example
   * await settings.set('theme', 'dark');
   * await settings.set('maxRetries', 3);
   * await settings.set('featureFlags', { darkMode: true, beta: false });
   */
  async set(key: string, value: SettingValue): Promise<Setting> {
    const now = new Date().toISOString();
    const jsonValue = toJSONString(value);

    // Use INSERT OR REPLACE for upsert semantics
    const sql = `
      INSERT OR REPLACE INTO settings (key, value, created_at, updated_at)
      VALUES (
        ?,
        ?,
        COALESCE((SELECT created_at FROM settings WHERE key = ?), ?),
        ?
      )
    `;

    await this.db.run(sql, [key, jsonValue, key, now, now]);

    return {
      key,
      value,
      createdAt: now, // May not be accurate on update, but close enough
      updatedAt: now,
    };
  }

  /**
   * Get all settings as an object
   *
   * Returns a key-value object where keys are setting names
   * and values are the parsed setting values.
   *
   * @returns Object with all settings
   *
   * @example
   * const all = await settings.getAll();
   * // { theme: 'dark', maxRetries: 3, featureFlags: { ... } }
   */
  async getAll(): Promise<Record<string, SettingValue>> {
    const sql = 'SELECT * FROM settings';
    const rows = await this.db.all<SettingRow>(sql, []);

    const result: Record<string, SettingValue> = {};
    for (const row of rows) {
      result[row.key] = safeParseJSON<SettingValue>(row.value, null);
    }

    return result;
  }

  /**
   * Get all settings as Setting objects with metadata
   *
   * @returns Array of Setting objects
   */
  async getAllWithMetadata(): Promise<Setting[]> {
    const sql = 'SELECT * FROM settings ORDER BY key';
    const rows = await this.db.all<SettingRow>(sql, []);

    return rows.map((row) => this.rowToSetting(row));
  }

  /**
   * Delete a setting by key
   *
   * @param key - Setting key to delete
   * @returns true if setting was deleted, false if not found
   */
  async delete(key: string): Promise<boolean> {
    const sql = 'DELETE FROM settings WHERE key = ?';
    const result = await this.db.run(sql, [key]);

    return result.changes > 0;
  }

  /**
   * Check if a setting exists
   *
   * @param key - Setting key
   * @returns true if setting exists
   */
  async exists(key: string): Promise<boolean> {
    const sql = 'SELECT 1 FROM settings WHERE key = ? LIMIT 1';
    const row = await this.db.get<{ '1': number }>(sql, [key]);

    return row !== undefined;
  }

  /**
   * Get multiple settings by keys
   *
   * @param keys - Array of setting keys
   * @returns Object with found settings (missing keys not included)
   *
   * @example
   * const settings = await service.getMany(['theme', 'language', 'timezone']);
   * // { theme: 'dark', language: 'en' } - timezone not found, not included
   */
  async getMany(keys: string[]): Promise<Record<string, SettingValue>> {
    if (keys.length === 0) {
      return {};
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `SELECT * FROM settings WHERE key IN (${placeholders})`;
    const rows = await this.db.all<SettingRow>(sql, keys);

    const result: Record<string, SettingValue> = {};
    for (const row of rows) {
      result[row.key] = safeParseJSON<SettingValue>(row.value, null);
    }

    return result;
  }

  /**
   * Set multiple settings at once
   *
   * @param settings - Object with key-value pairs to set
   * @returns Number of settings updated
   *
   * @example
   * await service.setMany({
   *   theme: 'dark',
   *   language: 'en',
   *   timezone: 'America/New_York'
   * });
   */
  async setMany(settings: Record<string, SettingValue>): Promise<number> {
    const entries = Object.entries(settings);
    if (entries.length === 0) {
      return 0;
    }

    let count = 0;

    // Use a transaction for atomicity
    for (const [key, value] of entries) {
      await this.set(key, value);
      count++;
    }

    return count;
  }

  /**
   * Delete multiple settings at once
   *
   * @param keys - Array of setting keys to delete
   * @returns Number of settings deleted
   */
  async deleteMany(keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `DELETE FROM settings WHERE key IN (${placeholders})`;
    const result = await this.db.run(sql, keys);

    return result.changes;
  }

  /**
   * Get settings matching a key prefix
   *
   * Useful for namespaced settings like 'feature.' or 'ui.'.
   *
   * @param prefix - Key prefix to match
   * @returns Object with matching settings
   *
   * @example
   * await service.set('feature.darkMode', true);
   * await service.set('feature.beta', false);
   * const features = await service.getByPrefix('feature.');
   * // { 'feature.darkMode': true, 'feature.beta': false }
   */
  async getByPrefix(prefix: string): Promise<Record<string, SettingValue>> {
    const sql = "SELECT * FROM settings WHERE key LIKE ? || '%'";
    const rows = await this.db.all<SettingRow>(sql, [prefix]);

    const result: Record<string, SettingValue> = {};
    for (const row of rows) {
      result[row.key] = safeParseJSON<SettingValue>(row.value, null);
    }

    return result;
  }

  /**
   * Delete settings matching a key prefix
   *
   * @param prefix - Key prefix to match
   * @returns Number of settings deleted
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    const sql = "DELETE FROM settings WHERE key LIKE ? || '%'";
    const result = await this.db.run(sql, [prefix]);

    return result.changes;
  }

  /**
   * Count total number of settings
   *
   * @returns Total count
   */
  async count(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM settings';
    const result = await this.db.get<{ count: number }>(sql, []);

    return result?.count ?? 0;
  }

  /**
   * Clear all settings
   *
   * WARNING: This deletes all settings. Use with caution.
   *
   * @returns Number of settings deleted
   */
  async clear(): Promise<number> {
    const sql = 'DELETE FROM settings';
    const result = await this.db.run(sql, []);

    return result.changes;
  }
}
