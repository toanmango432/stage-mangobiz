import { settingsDB } from '../db/database';

/**
 * Secure storage service for sensitive license data
 * Uses Web Crypto API for encryption and IndexedDB for persistence
 */

const STORAGE_KEY_PREFIX = 'secure_';
const ENCRYPTION_KEY_NAME = 'mango_secure_key';

interface SecureConfig {
  licenseKey?: string;
  storeId?: string;
  tier?: string;
  lastValidation?: number;
  defaults?: any;
}

/**
 * Get or create encryption key using Web Crypto API
 * Key is stored in IndexedDB for persistence across sessions
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Try to get existing key from storage
  const storedKey = await settingsDB.get(ENCRYPTION_KEY_NAME);

  if (storedKey) {
    // Import the stored key
    return await crypto.subtle.importKey(
      'raw',
      new Uint8Array(storedKey),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export and store the key
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  await settingsDB.set(ENCRYPTION_KEY_NAME, Array.from(new Uint8Array(exportedKey)));

  return key;
}

/**
 * Encrypt data using AES-GCM via Web Crypto API
 */
async function encrypt(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine IV and encrypted data, then convert to hex string
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-GCM via Web Crypto API
 */
async function decrypt(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Convert hex string back to bytes
    const combined = new Uint8Array(data.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

export const secureStorage = {
  /**
   * Get license key
   */
  async getLicenseKey(): Promise<string | null> {
    const encrypted = await settingsDB.get(`${STORAGE_KEY_PREFIX}license_key`);
    if (!encrypted) return null;
    return await decrypt(encrypted);
  },

  /**
   * Set license key
   */
  async setLicenseKey(key: string): Promise<void> {
    const encrypted = await encrypt(key);
    await settingsDB.set(`${STORAGE_KEY_PREFIX}license_key`, encrypted);
  },

  /**
   * Get store ID
   */
  async getStoreId(): Promise<string | null> {
    const encrypted = await settingsDB.get(`${STORAGE_KEY_PREFIX}store_id`);
    if (!encrypted) return null;
    return await decrypt(encrypted);
  },

  /**
   * Set store ID
   */
  async setStoreId(id: string): Promise<void> {
    const encrypted = await encrypt(id);
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
