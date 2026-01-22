/**
 * WebAuthn Service
 *
 * Provides biometric authentication (Face ID, Touch ID, Windows Hello)
 * via the Web Authentication API for web and desktop platforms.
 *
 * Credentials are stored in IndexedDB and verified against the device's
 * platform authenticator (secure enclave on Mac, TPM on Windows).
 */

import { settingsDB } from '@/db/database';

// Export types for external use
export type { StoredSessionData };

// Storage key prefixes
const WEBAUTHN_CREDENTIAL_PREFIX = 'webauthn_credential_';
const WEBAUTHN_PREFERENCE_PREFIX = 'webauthn_enabled_';

/**
 * Biometric type detected on the device
 */
export type BiometricType = 'face' | 'fingerprint' | 'unknown' | 'none';

/**
 * Result of biometric capability check
 */
export interface BiometricCapability {
  available: boolean;
  type: BiometricType;
  platformName: string;
}

/**
 * Platform biometric info (type and display name)
 */
interface PlatformBiometricInfo {
  type: BiometricType;
  platformName: string;
}

/**
 * Stored session data for biometric login recovery
 */
interface StoredSessionData {
  memberId: string;
  email: string;
  name: string;
  role: string;
  storeIds: string[];
  permissions?: Record<string, boolean> | null;
  defaultStoreId?: string | null;
}

/**
 * Stored credential data structure
 */
interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  createdAt: string;
  deviceName?: string;
  /** Session data stored with credential for recovery after logout */
  sessionData?: StoredSessionData;
}

/** Default unavailable capability result */
const UNAVAILABLE: BiometricCapability = {
  available: false,
  type: 'none',
  platformName: 'None',
};

/**
 * Detect platform biometric type and name from user agent
 */
function detectPlatformBiometrics(): PlatformBiometricInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // macOS with Touch ID
  if (platform.includes('mac') || userAgent.includes('macintosh')) {
    return { type: 'fingerprint', platformName: 'Touch ID' };
  }

  // iOS devices (Face ID or Touch ID)
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return { type: 'face', platformName: 'Face ID / Touch ID' };
  }

  // Windows Hello
  if (platform.includes('win') || userAgent.includes('windows')) {
    return { type: 'unknown', platformName: 'Windows Hello' };
  }

  // Android
  if (userAgent.includes('android')) {
    return { type: 'fingerprint', platformName: 'Fingerprint' };
  }

  return { type: 'unknown', platformName: 'Biometric' };
}

/**
 * Get Relying Party configuration for WebAuthn
 */
function getRelyingParty(): { name: string; id: string } {
  return {
    name: 'Mango POS',
    id: window.location.hostname,
  };
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random challenge for WebAuthn operations
 */
function generateChallenge(): ArrayBuffer {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array.buffer as ArrayBuffer;
}

/**
 * Get storage key for credential
 */
function getCredentialKey(userId: string): string {
  return `${WEBAUTHN_CREDENTIAL_PREFIX}${userId}`;
}

/**
 * Get storage key for preference
 */
function getPreferenceKey(userId: string): string {
  return `${WEBAUTHN_PREFERENCE_PREFIX}${userId}`;
}

export const webAuthnService = {
  /**
   * Check if WebAuthn is supported on this device
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function'
    );
  },

  /**
   * Check if platform authenticator (biometrics) is available
   */
  async isAvailable(): Promise<BiometricCapability> {
    if (!this.isSupported()) {
      return UNAVAILABLE;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

      if (!available) {
        return UNAVAILABLE;
      }

      const { type, platformName } = detectPlatformBiometrics();
      return { available: true, type, platformName };
    } catch (error) {
      console.error('WebAuthn availability check failed:', error);
      return UNAVAILABLE;
    }
  },

  /**
   * Check if a user has a stored credential
   */
  async hasCredential(userId: string): Promise<boolean> {
    const credential = await settingsDB.get(getCredentialKey(userId));
    return credential != null;
  },

  /**
   * Check if biometric login is enabled for a user
   */
  async isEnabled(userId: string): Promise<boolean> {
    const enabled = await settingsDB.get(getPreferenceKey(userId));
    return enabled === true;
  },

  /**
   * Register a new biometric credential for a user
   * @param userId - User ID to register
   * @param userName - Display name for the credential
   * @param sessionData - Optional session data to store for recovery after logout
   */
  async register(userId: string, userName: string, sessionData?: StoredSessionData): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported on this device');
    }

    const capability = await this.isAvailable();
    if (!capability.available) {
      throw new Error('No platform authenticator available');
    }

    try {
      const rp = getRelyingParty();
      const challenge = generateChallenge();
      const userIdBuffer = new TextEncoder().encode(userId);

      const options: PublicKeyCredentialCreationOptions = {
        challenge,
        rp,
        user: {
          id: userIdBuffer,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Credential creation was cancelled');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      const storedCredential: StoredCredential = {
        credentialId: arrayBufferToBase64(credential.rawId),
        publicKey: arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0)),
        counter: 0,
        createdAt: new Date().toISOString(),
        deviceName: capability.platformName,
        sessionData, // Store session data for recovery after logout
      };

      await settingsDB.set(getCredentialKey(userId), storedCredential);
      await settingsDB.set(getPreferenceKey(userId), true);

      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Biometric registration was cancelled');
        }
        if (error.name === 'InvalidStateError') {
          throw new Error('A credential already exists for this device');
        }
      }
      console.error('WebAuthn registration error:', error);
      throw new Error('Failed to register biometric credential');
    }
  },

  /**
   * Authenticate a user using their stored biometric credential
   */
  async authenticate(userId: string): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported on this device');
    }

    const storedCredential: StoredCredential | null = await settingsDB.get(getCredentialKey(userId));

    if (!storedCredential) {
      throw new Error('No biometric credential found. Please set up biometric login first.');
    }

    try {
      const rp = getRelyingParty();
      const challenge = generateChallenge();

      const options: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: rp.id,
        allowCredentials: [
          {
            id: base64ToArrayBuffer(storedCredential.credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Authentication was cancelled');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Verify credential ID matches
      const returnedCredentialId = arrayBufferToBase64(assertion.rawId);
      if (returnedCredentialId !== storedCredential.credentialId) {
        throw new Error('Credential ID mismatch');
      }

      // Update counter to prevent replay attacks
      const authenticatorData = new Uint8Array(response.authenticatorData);
      const counter = new DataView(authenticatorData.buffer).getUint32(33, false);

      if (counter <= storedCredential.counter) {
        console.warn('WebAuthn counter did not increase - possible security issue');
      }

      storedCredential.counter = counter;
      await settingsDB.set(getCredentialKey(userId), storedCredential);

      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Biometric authentication was cancelled');
        }
        if (error.name === 'SecurityError') {
          throw new Error('Security error during authentication');
        }
      }
      console.error('WebAuthn authentication error:', error);
      throw new Error('Biometric authentication failed');
    }
  },

  /**
   * Get stored session data for a user (for recovery after logout)
   */
  async getStoredSessionData(userId: string): Promise<StoredSessionData | null> {
    const storedCredential: StoredCredential | null = await settingsDB.get(getCredentialKey(userId));
    return storedCredential?.sessionData || null;
  },

  /**
   * Update stored session data for an existing credential
   */
  async updateStoredSessionData(userId: string, sessionData: StoredSessionData): Promise<void> {
    const storedCredential: StoredCredential | null = await settingsDB.get(getCredentialKey(userId));
    if (storedCredential) {
      storedCredential.sessionData = sessionData;
      await settingsDB.set(getCredentialKey(userId), storedCredential);
    }
  },

  /**
   * Remove stored credential for a user
   */
  async removeCredential(userId: string): Promise<void> {
    await settingsDB.remove(getCredentialKey(userId));
    await settingsDB.remove(getPreferenceKey(userId));
  },

  /**
   * Disable biometric login for a user (keeps credential for re-enabling)
   */
  async disable(userId: string): Promise<void> {
    await settingsDB.set(getPreferenceKey(userId), false);
  },

  /**
   * Enable biometric login for a user (requires existing credential)
   */
  async enable(userId: string): Promise<boolean> {
    const hasCredential = await this.hasCredential(userId);
    if (!hasCredential) {
      return false;
    }
    await settingsDB.set(getPreferenceKey(userId), true);
    return true;
  },
};

export default webAuthnService;
