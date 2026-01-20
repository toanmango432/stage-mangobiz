/**
 * SecureStorage Utility
 *
 * Platform-aware secure storage for sensitive data like PIN hashes.
 * Provides abstraction layer for different storage mechanisms:
 *
 * - Native (Capacitor): iOS Keychain / Android Keystore (future)
 * - Electron: Node.js crypto via IPC (future enhancement)
 * - Web: Base64-encoded localStorage (basic obfuscation)
 *
 * SECURITY NOTES:
 * - This is used to store bcrypt PIN hashes, NOT plaintext PINs
 * - Web fallback uses base64 encoding (NOT cryptographically secure)
 * - For production on web, consider Web Crypto API with device-derived keys
 * - Native platforms provide hardware-backed security
 *
 * @module utils/secureStorage
 */

// Extend Window interface for Electron environment detection
// This type is set by electron/preload.ts via contextBridge
declare global {
  interface Window {
    isElectron?: boolean;
  }
}

// Storage key prefix for namespacing in localStorage
const STORAGE_PREFIX = 'secure_';

/**
 * Platform detection utilities
 */
const PlatformDetection = {
  /**
   * Check if running in Electron environment
   */
  isElectron(): boolean {
    return typeof window !== 'undefined' && window.isElectron === true;
  },

  /**
   * Check if running in Capacitor native environment
   * Note: Capacitor not yet configured - returns false until setup
   */
  isCapacitorNative(): boolean {
    // Capacitor is not yet set up in this project
    // When added, uncomment and use:
    // try {
    //   const { Capacitor } = await import('@capacitor/core');
    //   return Capacitor.isNativePlatform();
    // } catch {
    //   return false;
    // }
    return false;
  },

  /**
   * Check if running in web browser (not native)
   */
  isWeb(): boolean {
    return typeof window !== 'undefined' && !this.isElectron() && !this.isCapacitorNative();
  },
};

/**
 * Web fallback storage using base64 encoding
 * NOT cryptographically secure - provides basic obfuscation only
 */
const WebFallbackStorage = {
  /**
   * Get value from localStorage with base64 decoding
   */
  get(key: string): string | null {
    try {
      const prefixedKey = `${STORAGE_PREFIX}${key}`;
      const encoded = localStorage.getItem(prefixedKey);

      if (!encoded) {
        return null;
      }

      // Decode base64 value
      return atob(encoded);
    } catch (error) {
      // Decoding failed - likely corrupted data
      console.error('SecureStorage: Failed to decode value for key:', key);
      return null;
    }
  },

  /**
   * Set value to localStorage with base64 encoding
   */
  set(key: string, value: string): void {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    // Encode value as base64
    const encoded = btoa(value);
    localStorage.setItem(prefixedKey, encoded);
  },

  /**
   * Remove value from localStorage
   */
  remove(key: string): void {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(prefixedKey);
  },
};

/**
 * Electron storage - currently falls back to web storage
 * Future enhancement: Use electron-store or safeStorage via IPC
 */
const ElectronStorage = {
  /**
   * Get value from Electron secure storage
   * TODO: Implement via IPC when electron-store is added
   */
  get(key: string): string | null {
    // For now, use web fallback
    // Future: window.electron.secureStorage.get(key)
    return WebFallbackStorage.get(key);
  },

  /**
   * Set value in Electron secure storage
   * TODO: Implement via IPC when electron-store is added
   */
  set(key: string, value: string): void {
    // For now, use web fallback
    // Future: window.electron.secureStorage.set(key, value)
    WebFallbackStorage.set(key, value);
  },

  /**
   * Remove value from Electron secure storage
   * TODO: Implement via IPC when electron-store is added
   */
  remove(key: string): void {
    // For now, use web fallback
    // Future: window.electron.secureStorage.remove(key)
    WebFallbackStorage.remove(key);
  },
};

/**
 * Capacitor native storage - placeholder for future implementation
 * Will use capacitor-secure-storage-plugin when Capacitor is configured
 */
const CapacitorStorage = {
  /**
   * Get value from native secure storage (iOS Keychain / Android Keystore)
   */
  async get(key: string): Promise<string | null> {
    // Capacitor not yet configured
    // When added:
    // const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    // try {
    //   const result = await SecureStoragePlugin.get({ key });
    //   return result.value;
    // } catch {
    //   return null;
    // }
    return WebFallbackStorage.get(key);
  },

  /**
   * Set value in native secure storage
   */
  async set(key: string, value: string): Promise<void> {
    // Capacitor not yet configured
    // When added:
    // const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    // await SecureStoragePlugin.set({ key, value });
    WebFallbackStorage.set(key, value);
  },

  /**
   * Remove value from native secure storage
   */
  async remove(key: string): Promise<void> {
    // Capacitor not yet configured
    // When added:
    // const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    // try {
    //   await SecureStoragePlugin.remove({ key });
    // } catch {
    //   // Key might not exist
    // }
    WebFallbackStorage.remove(key);
  },
};

/**
 * Platform-aware secure storage for sensitive data like PIN hashes.
 *
 * Storage security by platform:
 * - iOS (Capacitor): Keychain - hardware-backed encryption
 * - Android (Capacitor): EncryptedSharedPreferences - Android Keystore backed
 * - Electron: Currently localStorage (future: electron-store/safeStorage)
 * - Web: Base64-encoded localStorage (basic obfuscation, NOT secure)
 *
 * @example
 * ```typescript
 * // Store a PIN hash
 * await SecureStorage.set(`pin_hash_${memberId}`, hashedPin);
 *
 * // Retrieve a PIN hash
 * const pinHash = await SecureStorage.get(`pin_hash_${memberId}`);
 *
 * // Remove a PIN hash
 * await SecureStorage.remove(`pin_hash_${memberId}`);
 * ```
 */
export const SecureStorage = {
  /**
   * Get a value from secure storage
   *
   * @param key - The key to retrieve
   * @returns The stored value or null if not found
   */
  async get(key: string): Promise<string | null> {
    if (PlatformDetection.isCapacitorNative()) {
      return CapacitorStorage.get(key);
    }

    if (PlatformDetection.isElectron()) {
      return ElectronStorage.get(key);
    }

    // Web fallback
    return WebFallbackStorage.get(key);
  },

  /**
   * Set a value in secure storage
   *
   * @param key - The key to store under
   * @param value - The value to store
   */
  async set(key: string, value: string): Promise<void> {
    if (PlatformDetection.isCapacitorNative()) {
      await CapacitorStorage.set(key, value);
      return;
    }

    if (PlatformDetection.isElectron()) {
      ElectronStorage.set(key, value);
      return;
    }

    // Web fallback
    WebFallbackStorage.set(key, value);
  },

  /**
   * Remove a value from secure storage
   *
   * @param key - The key to remove
   */
  async remove(key: string): Promise<void> {
    if (PlatformDetection.isCapacitorNative()) {
      await CapacitorStorage.remove(key);
      return;
    }

    if (PlatformDetection.isElectron()) {
      ElectronStorage.remove(key);
      return;
    }

    // Web fallback
    WebFallbackStorage.remove(key);
  },
};

export default SecureStorage;
