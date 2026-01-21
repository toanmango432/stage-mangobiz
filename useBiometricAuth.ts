/**
 * useBiometricAuth Hook
 *
 * Provides a unified React hook interface for biometric authentication.
 * Automatically uses the appropriate implementation based on platform:
 * - Native (iOS/Android): Uses Capacitor native biometric plugin
 * - Web/Desktop: Uses WebAuthn API
 *
 * Usage:
 * ```tsx
 * const {
 *   isAvailable,
 *   biometricType,
 *   platformName,
 *   isEnabled,
 *   isLoading,
 *   error,
 *   register,
 *   authenticate,
 *   disable,
 * } = useBiometricAuth(userId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { biometricService, type BiometricAvailability } from '../services/biometricService';
import type { BiometricType } from '../services/webAuthnService';

export interface UseBiometricAuthResult {
  /** Whether biometric authentication is available on this device */
  isAvailable: boolean;
  /** Type of biometric available */
  biometricType: BiometricType;
  /** Human-readable name for the biometric type */
  platformName: string;
  /** Whether using native (Capacitor) or web (WebAuthn) implementation */
  isNative: boolean;
  /** Whether biometrics are enabled for the current user */
  isEnabled: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Register/enroll biometric credential */
  register: (userName: string) => Promise<boolean>;
  /** Authenticate using biometrics */
  authenticate: () => Promise<boolean>;
  /** Disable biometric authentication */
  disable: () => Promise<void>;
  /** Re-enable biometric authentication */
  enable: () => Promise<boolean>;
  /** Refresh availability and enabled state */
  refresh: () => Promise<void>;
}

/**
 * Hook for biometric authentication
 *
 * @param userId - The user ID to check/enable biometrics for. If null, only checks availability.
 */
export function useBiometricAuth(userId: string | null): UseBiometricAuthResult {
  const [availability, setAvailability] = useState<BiometricAvailability>({
    available: false,
    type: 'none',
    platformName: 'None',
    isNative: false,
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check availability and enabled state
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check availability
      const avail = await biometricService.isAvailable();
      setAvailability(avail);

      // Check if enabled for this user
      if (userId && avail.available) {
        const enabled = await biometricService.isEnabled(userId);
        setIsEnabled(enabled);
      } else {
        setIsEnabled(false);
      }
    } catch (err) {
      console.error('Failed to check biometric availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to check biometric availability');
      setAvailability({
        available: false,
        type: 'none',
        platformName: 'None',
        isNative: false,
      });
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial check on mount and when userId changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Register biometric credential
  const register = useCallback(
    async (userName: string): Promise<boolean> => {
      if (!userId) {
        setError('No user ID provided');
        return false;
      }

      if (!availability.available) {
        setError('Biometric authentication is not available');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await biometricService.register(userId, userName);
        if (success) {
          biometricService.setLastBiometricUser(userId);
          setIsEnabled(true);
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to register biometric';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, availability.available]
  );

  // Authenticate using biometrics
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setError('No user ID provided');
      return false;
    }

    if (!availability.available) {
      setError('Biometric authentication is not available');
      return false;
    }

    if (!isEnabled) {
      setError('Biometric authentication is not enabled for this user');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await biometricService.authenticate(userId);
      if (!success) {
        setError('Authentication failed');
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, availability.available, isEnabled]);

  // Disable biometric authentication
  const disable = useCallback(async (): Promise<void> => {
    if (!userId) {
      setError('No user ID provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await biometricService.disable(userId);
      setIsEnabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable biometric';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Re-enable biometric authentication
  const enable = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setError('No user ID provided');
      return false;
    }

    if (!availability.available) {
      setError('Biometric authentication is not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await biometricService.enable(userId);
      if (success) {
        setIsEnabled(true);
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable biometric';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, availability.available]);

  return {
    isAvailable: availability.available,
    biometricType: availability.type,
    platformName: availability.platformName,
    isNative: availability.isNative,
    isEnabled,
    isLoading,
    error,
    register,
    authenticate,
    disable,
    enable,
    refresh,
  };
}

export default useBiometricAuth;
