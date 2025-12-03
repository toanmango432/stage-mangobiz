import { secureStorage } from './secureStorage';
import {
  validateLicense,
  isLicenseDeactivated,
  checkVersionRequirement,
//   type ValidateLicenseResponse,
  type LicenseError,
} from '../api/licenseApi';

const APP_VERSION = '1.0.0'; // Should match package.json version
const OFFLINE_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const BACKGROUND_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export type LicenseStatus =
  | 'not_activated' // No license key stored
  | 'active' // Valid and active license
  | 'deactivated' // License revoked/deactivated
  | 'expired' // License expired
  | 'offline_grace' // Offline but within grace period
  | 'offline_expired' // Offline grace period expired
  | 'version_mismatch' // App version too old
  | 'checking'; // Currently validating

export interface LicenseState {
  status: LicenseStatus;
  licenseKey?: string;
  storeId?: string;
  tier?: string;
  message?: string;
  requiresUpdate?: boolean;
  requiredVersion?: string;
}

type LicenseStatusListener = (state: LicenseState) => void;

class LicenseManager {
  private listeners: LicenseStatusListener[] = [];
  private backgroundCheckInterval?: number;
  private currentState: LicenseState = {
    status: 'checking',
  };

  /**
   * Initialize license manager
   */
  async initialize(): Promise<LicenseState> {
    console.log('🔐 Initializing License Manager...');

    const licenseKey = await secureStorage.getLicenseKey();

    // No license key = not activated
    if (!licenseKey) {
      console.log('⚠️ No license key found - activation required');
      this.updateState({
        status: 'not_activated',
        message: 'Please activate your store with a valid license key.',
      });
      return this.currentState;
    }

    // Validate license
    return await this.checkLicense(licenseKey);
  }

  /**
   * Check license validity
   */
  async checkLicense(licenseKey?: string): Promise<LicenseState> {
    try {
      const key = licenseKey || (await secureStorage.getLicenseKey());
      if (!key) {
        this.updateState({
          status: 'not_activated',
          message: 'Please activate your store with a valid license key.',
        });
        return this.currentState;
      }

      console.log('🔍 Validating license...');
      this.updateState({ status: 'checking' });

      // Call control center API
      const response = await validateLicense(key, APP_VERSION);

      // Check version requirement
      if (response.requiredVersion) {
        const versionOk = checkVersionRequirement(APP_VERSION, response.requiredVersion);
        if (!versionOk) {
          this.updateState({
            status: 'version_mismatch',
            message: `App update required. Current: ${APP_VERSION}, Required: ${response.requiredVersion}`,
            requiresUpdate: true,
            requiredVersion: response.requiredVersion,
          });
          return this.currentState;
        }
      }

      // Check if license is deactivated
      if (isLicenseDeactivated(response)) {
        console.error('❌ License deactivated:', response.message);
        await secureStorage.clearLicenseData();
        this.updateState({
          status: 'deactivated',
          message: response.message || 'License is deactivated. Please contact your provider.',
        });
        return this.currentState;
      }

      // Valid license - save data
      if (response.storeId) {
        await secureStorage.setStoreId(response.storeId);
      }
      if (response.tier) {
        await secureStorage.setTier(response.tier);
      }
      if (response.defaults) {
        await secureStorage.setDefaults(response.defaults);
      }

      // Update last validation timestamp
      await secureStorage.setLastValidation(Date.now());

      console.log('✅ License valid:', response);
      this.updateState({
        status: 'active',
        licenseKey: key,
        storeId: response.storeId,
        tier: response.tier,
        message: 'License active and validated.',
      });

      return this.currentState;
    } catch (error) {
      return await this.handleLicenseError(error as LicenseError);
    }
  }

  /**
   * Handle license validation errors
   */
  private async handleLicenseError(error: LicenseError): Promise<LicenseState> {
    console.error('❌ License validation error:', error);

    // Network error - check grace period
    if (error.code === 'NETWORK_ERROR') {
      const lastValidation = await secureStorage.getLastValidation();

      if (lastValidation) {
        const timeSinceValidation = Date.now() - lastValidation;

        if (timeSinceValidation < OFFLINE_GRACE_PERIOD) {
          // Within grace period - allow offline use
          const daysRemaining = Math.ceil(
            (OFFLINE_GRACE_PERIOD - timeSinceValidation) / (24 * 60 * 60 * 1000)
          );
          console.log(`⚠️ Offline mode - ${daysRemaining} days remaining in grace period`);

          const storeId = await secureStorage.getStoreId();
          const tier = await secureStorage.getTier();

          this.updateState({
            status: 'offline_grace',
            storeId: storeId || undefined,
            tier: tier || undefined,
            message: `Offline mode: ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining. Please reconnect soon.`,
          });
          return this.currentState;
        } else {
          // Grace period expired
          console.error('❌ Offline grace period expired');
          this.updateState({
            status: 'offline_expired',
            message: 'Offline grace period expired. Please reconnect to the internet.',
          });
          return this.currentState;
        }
      }

      // No previous validation - cannot use offline
      this.updateState({
        status: 'not_activated',
        message: 'Cannot validate license. Please check your internet connection.',
      });
      return this.currentState;
    }

    // Invalid license
    if (error.code === 'INVALID_LICENSE') {
      await secureStorage.clearLicenseData();
      this.updateState({
        status: 'deactivated',
        message: error.message,
      });
      return this.currentState;
    }

    // Version mismatch
    if (error.code === 'VERSION_MISMATCH') {
      this.updateState({
        status: 'version_mismatch',
        message: error.message,
        requiresUpdate: true,
      });
      return this.currentState;
    }

    // Unknown error
    this.updateState({
      status: 'not_activated',
      message: error.message || 'An unexpected error occurred.',
    });
    return this.currentState;
  }

  /**
   * Activate with new license key
   */
  async activate(licenseKey: string): Promise<LicenseState> {
    console.log('🔐 Activating with license key...');

    // Save license key
    await secureStorage.setLicenseKey(licenseKey);

    // Validate
    const state = await this.checkLicense(licenseKey);

    // If activation successful, start background checks
    if (state.status === 'active') {
      this.startBackgroundChecks();
    }

    return state;
  }

  /**
   * Deactivate and clear all license data
   */
  async deactivate(): Promise<void> {
    console.log('🔓 Deactivating license...');

    await secureStorage.clearLicenseData();
    this.stopBackgroundChecks();

    this.updateState({
      status: 'not_activated',
      message: 'License deactivated.',
    });
  }

  /**
   * Start periodic background validation
   */
  startBackgroundChecks(): void {
    console.log('⏰ Starting background license checks (every 24h)...');

    // Clear any existing interval
    this.stopBackgroundChecks();

    // Check every 24 hours
    this.backgroundCheckInterval = window.setInterval(async () => {
      console.log('🔍 Background license check...');
      await this.checkLicense();
    }, BACKGROUND_CHECK_INTERVAL);
  }

  /**
   * Stop background validation
   */
  stopBackgroundChecks(): void {
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
      this.backgroundCheckInterval = undefined;
      console.log('⏸️ Background license checks stopped');
    }
  }

  /**
   * Get current license state
   */
  getState(): LicenseState {
    return this.currentState;
  }

  /**
   * Check if app is licensed and operational
   */
  isOperational(): boolean {
    return this.currentState.status === 'active' || this.currentState.status === 'offline_grace';
  }

  /**
   * Check if operations should be blocked
   */
  isBlocked(): boolean {
    return (
      this.currentState.status === 'not_activated' ||
      this.currentState.status === 'deactivated' ||
      this.currentState.status === 'expired' ||
      this.currentState.status === 'offline_expired' ||
      this.currentState.status === 'version_mismatch'
    );
  }

  /**
   * Subscribe to license state changes
   */
  subscribe(listener: LicenseStatusListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<LicenseState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  /**
   * Get app version
   */
  getAppVersion(): string {
    return APP_VERSION;
  }
}

// Singleton instance
export const licenseManager = new LicenseManager();
