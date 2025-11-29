/**
 * Local License Validator
 *
 * This allows the POS to validate licenses against the local Admin database
 * without needing a separate server. Useful for development and testing.
 *
 * Usage in POS:
 *   import { validateLicenseLocal } from '../admin/api/localValidator';
 *   const result = await validateLicenseLocal(licenseKey, appVersion);
 */

import { initializeAdminDatabase, seedAdminDatabase } from '../db/schema';
import { validateLicense, ValidateLicenseRequest, ValidateLicenseResponse } from './validateLicense';

let isInitialized = false;

/**
 * Initialize the admin database (call once at app start)
 */
export async function initializeLocalValidator(): Promise<void> {
  if (isInitialized) return;

  await initializeAdminDatabase();
  await seedAdminDatabase();
  isInitialized = true;

  console.log('✅ Local license validator initialized');
}

/**
 * Validate a license using the local admin database
 * This bypasses the HTTP layer for faster development
 */
export async function validateLicenseLocal(
  licenseKey: string,
  appVersion: string,
  deviceInfo?: ValidateLicenseRequest['deviceInfo']
): Promise<{ status: number; body: ValidateLicenseResponse }> {
  // Ensure database is initialized
  if (!isInitialized) {
    await initializeLocalValidator();
  }

  const request: ValidateLicenseRequest = {
    licenseKey,
    appVersion,
    deviceInfo,
  };

  return validateLicense(request, '127.0.0.1');
}

/**
 * Check if local validator is available
 */
export function isLocalValidatorAvailable(): boolean {
  return true; // Always available when this module is imported
}
