/**
 * Unified Biometric Service
 *
 * Provides a single interface for biometric authentication across all platforms:
 * - Web/Desktop: Uses WebAuthn API (Touch ID on Mac, Windows Hello)
 * - iOS/Android (Capacitor): Uses native biometric APIs (Face ID, Touch ID, Fingerprint)
 *
 * This service automatically detects the platform and uses the appropriate implementation.
 */

import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { webAuthnService, type BiometricType } from './webAuthnService';
import { deviceManager } from './deviceManager';

/** Credential storage key prefix for native biometrics */
const NATIVE_CREDENTIAL_KEY = 'mango_native_biometric_';
const WEB_LAST_USER_KEY = 'mango_last_biometric_user';

/**
 * Result of biometric availability check
 */
export interface BiometricAvailability {
  available: boolean;
  type: BiometricType;
  platformName: string;
  isNative: boolean;
}

/** Default unavailable result for native platform */
const NATIVE_UNAVAILABLE: BiometricAvailability = {
  available: false,
  type: 'none',
  platformName: 'None',
  isNative: true,
};

/** Default unavailable result for web platform */
const WEB_UNAVAILABLE: BiometricAvailability = {
  available: false,
  type: 'none',
  platformName: 'None',
  isNative: false,
};

/**
 * Map native BiometryType to unified type and platform name
 */
function mapNativeBiometryType(biometryType: BiometryType): { type: BiometricType; platformName: string } {
  switch (biometryType) {
    case BiometryType.FACE_ID:
      return { type: 'face', platformName: 'Face ID' };
    case BiometryType.TOUCH_ID:
      return { type: 'fingerprint', platformName: 'Touch ID' };
    case BiometryType.FINGERPRINT:
      return { type: 'fingerprint', platformName: 'Fingerprint' };
    case BiometryType.FACE_AUTHENTICATION:
      return { type: 'face', platformName: 'Face Authentication' };
    case BiometryType.IRIS_AUTHENTICATION:
      return { type: 'face', platformName: 'Iris Authentication' };
    default:
      return { type: 'unknown', platformName: 'Biometrics' };
  }
}

/**
 * Get native credential user ID from localStorage
 */
function getNativeCredentialUserId(): string | null {
  return localStorage.getItem(`${NATIVE_CREDENTIAL_KEY}user`);
}

/**
 * Clear all native credential data from localStorage
 */
function clearNativeCredential(): void {
  localStorage.removeItem(`${NATIVE_CREDENTIAL_KEY}user`);
  localStorage.removeItem(`${NATIVE_CREDENTIAL_KEY}name`);
  localStorage.removeItem(`${NATIVE_CREDENTIAL_KEY}enabled`);
}

/**
 * Store native credential data in localStorage
 */
function storeNativeCredential(userId: string, userName: string): void {
  localStorage.setItem(`${NATIVE_CREDENTIAL_KEY}user`, userId);
  localStorage.setItem(`${NATIVE_CREDENTIAL_KEY}name`, userName);
  localStorage.setItem(`${NATIVE_CREDENTIAL_KEY}enabled`, 'true');
}

/**
 * Unified biometric service that works across all platforms
 */
export const biometricService = {
  /**
   * Check if biometric authentication is available on this device.
   */
  async isAvailable(): Promise<BiometricAvailability> {
    if (deviceManager.isNative()) {
      return this.checkNativeAvailability();
    }
    return this.checkWebAuthnAvailability();
  },

  /**
   * Check native biometric availability (iOS/Android)
   */
  async checkNativeAvailability(): Promise<BiometricAvailability> {
    try {
      const result = await NativeBiometric.isAvailable();

      if (!result.isAvailable) {
        return NATIVE_UNAVAILABLE;
      }

      const { type, platformName } = mapNativeBiometryType(result.biometryType);
      return { available: true, type, platformName, isNative: true };
    } catch (error) {
      console.error('Failed to check native biometric availability:', error);
      return NATIVE_UNAVAILABLE;
    }
  },

  /**
   * Check WebAuthn availability (Web/Desktop)
   */
  async checkWebAuthnAvailability(): Promise<BiometricAvailability> {
    const capability = await webAuthnService.isAvailable();
    return {
      available: capability.available,
      type: capability.type,
      platformName: capability.platformName,
      isNative: false,
    };
  },

  /**
   * Check if a user has enrolled biometric credentials
   */
  async hasCredential(userId: string): Promise<boolean> {
    if (deviceManager.isNative()) {
      return getNativeCredentialUserId() === userId;
    }
    return webAuthnService.hasCredential(userId);
  },

  /**
   * Check if biometric is enabled for a user
   */
  async isEnabled(userId: string): Promise<boolean> {
    if (deviceManager.isNative()) {
      return getNativeCredentialUserId() === userId;
    }
    return webAuthnService.isEnabled(userId);
  },

  /**
   * Register/enroll biometric credential for a user.
   */
  async register(userId: string, userName: string): Promise<boolean> {
    if (deviceManager.isNative()) {
      return this.registerNative(userId, userName);
    }
    return webAuthnService.register(userId, userName);
  },

  /**
   * Register native biometric credential
   */
  async registerNative(userId: string, userName: string): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Verify your identity to enable biometric login',
        title: 'Enable Biometric Login',
        subtitle: `Setting up biometrics for ${userName}`,
        description: 'Please authenticate to enable biometric login',
      });

      storeNativeCredential(userId, userName);
      return true;
    } catch (error) {
      console.error('Failed to register native biometric:', error);
      return false;
    }
  },

  /**
   * Authenticate using biometrics.
   */
  async authenticate(userId: string): Promise<boolean> {
    if (deviceManager.isNative()) {
      return this.authenticateNative(userId);
    }
    return webAuthnService.authenticate(userId);
  },

  /**
   * Authenticate using native biometrics
   */
  async authenticateNative(userId: string): Promise<boolean> {
    try {
      if (getNativeCredentialUserId() !== userId) {
        console.error('No native biometric credential for this user');
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: 'Verify your identity to sign in',
        title: 'Sign In',
        subtitle: 'Use biometrics to sign in',
        description: 'Please authenticate to continue',
      });

      return true;
    } catch (error) {
      console.error('Native biometric authentication failed:', error);
      return false;
    }
  },

  /**
   * Remove biometric credential for a user
   */
  async removeCredential(userId: string): Promise<void> {
    if (deviceManager.isNative()) {
      if (getNativeCredentialUserId() === userId) {
        clearNativeCredential();
      }
    } else {
      await webAuthnService.removeCredential(userId);
    }
  },

  /**
   * Disable biometric authentication for a user
   */
  async disable(userId: string): Promise<void> {
    if (deviceManager.isNative()) {
      if (getNativeCredentialUserId() === userId) {
        clearNativeCredential();
      }
    } else {
      await webAuthnService.disable(userId);
    }
  },

  /**
   * Re-enable biometric authentication for a user
   */
  async enable(userId: string): Promise<boolean> {
    if (deviceManager.isNative()) {
      const userName = localStorage.getItem(`${NATIVE_CREDENTIAL_KEY}name`) || 'User';
      return this.registerNative(userId, userName);
    }
    return webAuthnService.enable(userId);
  },

  /**
   * Get the last user ID that enrolled in biometrics
   */
  getLastBiometricUser(): string | null {
    if (deviceManager.isNative()) {
      return getNativeCredentialUserId();
    }
    return localStorage.getItem(WEB_LAST_USER_KEY);
  },

  /**
   * Store the last user who enrolled in biometrics
   */
  setLastBiometricUser(userId: string): void {
    if (deviceManager.isNative()) {
      localStorage.setItem(`${NATIVE_CREDENTIAL_KEY}user`, userId);
    } else {
      localStorage.setItem(WEB_LAST_USER_KEY, userId);
    }
  },

  /**
   * Clear the last biometric user (used when credentials become invalid)
   */
  clearLastBiometricUser(): void {
    if (deviceManager.isNative()) {
      localStorage.removeItem(`${NATIVE_CREDENTIAL_KEY}user`);
    } else {
      localStorage.removeItem(WEB_LAST_USER_KEY);
    }
  },
};

export default biometricService;
