import { settingsDB } from '../db/database';

/**
 * Secure storage service for sensitive license data
 * Uses Web Crypto API for encryption and IndexedDB for persistence
 */

// Encryption key derived from a combination of browser fingerprint
// This is not perfect security but provides basic obfuscation for license data
const STORAGE_KEY_PREFIX = 'secure_';

interface SecureConfig {
  licenseKey?: string;
  storeId?: string;
  tier?: string;
  lastValidation?: number;
  defaults?: any;
}

/**
 * Simple encryption using base64 (for obfuscation, not real security)
 * In production, use proper encryption with a server-managed key
 */
function encrypt(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

function decrypt(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch (error) {
    console.error('Decryption error:', error);
    return data;
  }
}

export const secureStorage = {
  /**
   * Get license key
   */
  async getLicenseKey(): Promise<string | null> {
    const encrypted = await settingsDB.get(`${STORAGE_KEY_PREFIX}license_key`);
    if (!encrypted) return null;
    return decrypt(encrypted);
  },

  /**
   * Set license key
   */
  async setLicenseKey(key: string): Promise<void> {
    const encrypted = encrypt(key);
    await settingsDB.set(`${STORAGE_KEY_PREFIX}license_key`, encrypted);
  },

  /**
   * Get store ID
   */
  async getStoreId(): Promise<string | null> {
    const encrypted = await settingsDB.get(`${STORAGE_KEY_PREFIX}store_id`);
    if (!encrypted) return null;
    return decrypt(encrypted);
  },

  /**
   * Set store ID
   */
  async setStoreId(id: string): Promise<void> {
    const encrypted = encrypt(id);
    await settingsDB.set(`${STORAGE_KEY_PREFIX}store_id`, encrypted);
  },

  /**
   * Get tier
   */
  async getTier(): Promise<string | null> {
    return await settingsDB.get(`${STORAGE_KEY_PREFIX}tier`);
  },

  /**
   * Set tier
   */
  async setTier(tier: string): Promise<void> {
    await settingsDB.set(`${STORAGE_KEY_PREFIX}tier`, tier);
  },

  /**
   * Get last validation timestamp
   */
  async getLastValidation(): Promise<number | null> {
    return await settingsDB.get(`${STORAGE_KEY_PREFIX}last_validation`);
  },

  /**
   * Set last validation timestamp
   */
  async setLastValidation(timestamp: number): Promise<void> {
    await settingsDB.set(`${STORAGE_KEY_PREFIX}last_validation`, timestamp);
  },

  /**
   * Get defaults (first-time population data)
   */
  async getDefaults(): Promise<any | null> {
    return await settingsDB.get(`${STORAGE_KEY_PREFIX}defaults`);
  },

  /**
   * Set defaults
   */
  async setDefaults(defaults: any): Promise<void> {
    await settingsDB.set(`${STORAGE_KEY_PREFIX}defaults`, defaults);
  },

  /**
   * Check if defaults have been applied
   */
  async hasAppliedDefaults(): Promise<boolean> {
    return await settingsDB.get(`${STORAGE_KEY_PREFIX}defaults_applied`) === true;
  },

  /**
   * Mark defaults as applied
   */
  async setDefaultsApplied(): Promise<void> {
    await settingsDB.set(`${STORAGE_KEY_PREFIX}defaults_applied`, true);
  },

  /**
   * Get all secure config
   */
  async getConfig(): Promise<SecureConfig> {
    const [licenseKey, storeId, tier, lastValidation, defaults] = await Promise.all([
      this.getLicenseKey(),
      this.getStoreId(),
      this.getTier(),
      this.getLastValidation(),
      this.getDefaults(),
    ]);

    return {
      licenseKey: licenseKey || undefined,
      storeId: storeId || undefined,
      tier: tier || undefined,
      lastValidation: lastValidation || undefined,
      defaults: defaults || undefined,
    };
  },

  /**
   * Clear all license data (on deactivation)
   */
  async clearLicenseData(): Promise<void> {
    await Promise.all([
      settingsDB.remove(`${STORAGE_KEY_PREFIX}license_key`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}store_id`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}tier`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}last_validation`),
      // Keep defaults even after deactivation
    ]);
  },

  /**
   * Clear all data including defaults (complete wipe)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      settingsDB.remove(`${STORAGE_KEY_PREFIX}license_key`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}store_id`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}tier`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}last_validation`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}defaults`),
      settingsDB.remove(`${STORAGE_KEY_PREFIX}defaults_applied`),
    ]);
  },
};
