/**
 * License Validation API Handler
 * Implements POST /api/validate-license endpoint logic
 * Can be used directly or integrated with Express/backend server
 */

import { licensesDB, storesDB, devicesDB, auditLogsDB } from '../db/database';
import { normalizeLicenseKey } from '../utils/licenseKeyGenerator';

// ==================== REQUEST/RESPONSE TYPES ====================

export interface ValidateLicenseRequest {
  licenseKey: string;
  appVersion: string;
  deviceInfo?: {
    platform?: string;
    userAgent?: string;
    screenResolution?: string;
    language?: string;
  };
}

export interface TaxSetting {
  name: string;
  rate: number;
  isDefault: boolean;
}

export interface Category {
  name: string;
  icon: string;
  color: string;
}

export interface ServiceItem {
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  commissionRate: number;
}

export interface EmployeeRole {
  name: string;
  permissions: string[];
  color: string;
}

export interface PaymentMethod {
  name: string;
  type: 'cash' | 'card' | 'other';
  isActive: boolean;
}

export interface LicenseDefaults {
  taxSettings?: TaxSetting[];
  categories?: Category[];
  items?: ServiceItem[];
  employeeRoles?: EmployeeRole[];
  paymentMethods?: PaymentMethod[];
}

export interface ValidateLicenseSuccessResponse {
  valid: true;
  storeId: string;
  tier: string;
  status: 'active';
  message?: string;
  defaults?: LicenseDefaults;
  requiredVersion?: string;
  expiresAt?: string;
}

export interface ValidateLicenseErrorResponse {
  valid: false;
  status: 'deactivated' | 'inactive' | 'expired' | 'suspended';
  message: string;
  requiredVersion?: string;
}

export type ValidateLicenseResponse = ValidateLicenseSuccessResponse | ValidateLicenseErrorResponse;

// ==================== CONFIGURATION ====================

// Minimum required app version (configurable)
const MINIMUM_APP_VERSION = '1.0.0';

// Default configurations for new stores
const DEFAULT_STORE_SETUP: LicenseDefaults = {
  taxSettings: [
    { name: 'Sales Tax', rate: 8.5, isDefault: true },
  ],
  categories: [
    { name: 'Manicure', icon: '💅', color: '#FF6B9D' },
    { name: 'Pedicure', icon: '🦶', color: '#4ECDC4' },
    { name: 'Waxing', icon: '✨', color: '#95E1D3' },
    { name: 'Facial', icon: '🧖', color: '#F9ED69' },
    { name: 'Massage', icon: '💆', color: '#A8D8EA' },
  ],
  items: [
    { name: 'Basic Manicure', category: 'Manicure', description: 'Filing, shaping, cuticle care, buffing, and regular polish', duration: 30, price: 20, commissionRate: 50 },
    { name: 'Gel Manicure', category: 'Manicure', description: 'Premium gel polish with long-lasting shine', duration: 45, price: 35, commissionRate: 50 },
    { name: 'Basic Pedicure', category: 'Pedicure', description: 'Soak, filing, cuticle care, scrub, and regular polish', duration: 45, price: 30, commissionRate: 50 },
    { name: 'Spa Pedicure', category: 'Pedicure', description: 'Deluxe pedicure with extended massage and mask', duration: 60, price: 50, commissionRate: 50 },
    { name: 'Eyebrow Wax', category: 'Waxing', description: 'Precision eyebrow shaping', duration: 15, price: 15, commissionRate: 50 },
    { name: 'Full Leg Wax', category: 'Waxing', description: 'Complete leg waxing service', duration: 45, price: 60, commissionRate: 50 },
  ],
  employeeRoles: [
    { name: 'Manager', permissions: ['all'], color: '#10B981' },
    { name: 'Technician', permissions: ['create_ticket', 'checkout', 'view_appointments'], color: '#3B82F6' },
    { name: 'Receptionist', permissions: ['create_appointment', 'check_in', 'view_appointments'], color: '#8B5CF6' },
  ],
  paymentMethods: [
    { name: 'Cash', type: 'cash', isActive: true },
    { name: 'Credit Card', type: 'card', isActive: true },
    { name: 'Debit Card', type: 'card', isActive: true },
    { name: 'Gift Card', type: 'other', isActive: true },
  ],
};

// ==================== VERSION COMPARISON ====================

/**
 * Compare semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }

  return 0;
}

// ==================== MAIN HANDLER ====================

/**
 * Validate a license key and return the appropriate response
 * This is the main logic for POST /api/validate-license
 */
export async function validateLicense(
  request: ValidateLicenseRequest,
  clientIp?: string
): Promise<{ status: number; body: ValidateLicenseResponse }> {
  try {
    const { licenseKey, appVersion, deviceInfo } = request;

    // Normalize the license key
    const normalizedKey = normalizeLicenseKey(licenseKey);

    // Check app version
    if (compareVersions(appVersion, MINIMUM_APP_VERSION) < 0) {
      await logValidation('license_validation_failed', undefined, undefined, {
        reason: 'version_mismatch',
        providedVersion: appVersion,
        requiredVersion: MINIMUM_APP_VERSION,
      }, clientIp, deviceInfo?.userAgent);

      return {
        status: 426,
        body: {
          valid: false,
          status: 'inactive',
          message: `App version ${appVersion} is outdated. Please update to version ${MINIMUM_APP_VERSION} or higher.`,
          requiredVersion: MINIMUM_APP_VERSION,
        },
      };
    }

    // Look up the license
    const license = await licensesDB.getByLicenseKey(normalizedKey);

    if (!license) {
      await logValidation('license_validation_failed', undefined, undefined, {
        reason: 'invalid_key',
        providedKey: normalizedKey.substring(0, 4) + '****',
      }, clientIp, deviceInfo?.userAgent);

      return {
        status: 400,
        body: {
          valid: false,
          status: 'inactive',
          message: 'Invalid license key. Please check your license key and try again.',
        },
      };
    }

    // Check license status
    if (license.status === 'revoked') {
      await logValidation('license_validation_failed', license.id, undefined, {
        reason: 'revoked',
      }, clientIp, deviceInfo?.userAgent);

      return {
        status: 403,
        body: {
          valid: false,
          status: 'deactivated',
          message: 'This license has been revoked. Please contact support for assistance.',
        },
      };
    }

    if (license.status === 'suspended') {
      await logValidation('license_validation_failed', license.id, undefined, {
        reason: 'suspended',
      }, clientIp, deviceInfo?.userAgent);

      return {
        status: 403,
        body: {
          valid: false,
          status: 'suspended',
          message: 'This license has been suspended. Please contact support for assistance.',
        },
      };
    }

    if (license.status === 'expired') {
      await logValidation('license_validation_failed', license.id, undefined, {
        reason: 'expired',
      }, clientIp, deviceInfo?.userAgent);

      return {
        status: 403,
        body: {
          valid: false,
          status: 'expired',
          message: 'This license has expired. Please renew your subscription.',
        },
      };
    }

    // Check expiration date
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      // Update license status to expired
      await licensesDB.update(license.id, { status: 'expired' });

      await logValidation('license_validation_failed', license.id, undefined, {
        reason: 'expired',
        expiresAt: license.expiresAt,
      }, clientIp, deviceInfo?.userAgent);

      return {
        status: 403,
        body: {
          valid: false,
          status: 'expired',
          message: 'This license has expired. Please renew your subscription.',
        },
      };
    }

    // Find or create store for this device
    let store = await findOrCreateStore(license, deviceInfo, clientIp);
    const isFirstActivation = !license.activatedAt;

    // Record validation
    await licensesDB.recordValidation(license.id);
    await storesDB.recordActivity(store.id);

    // Track device if device info provided
    if (deviceInfo) {
      await trackDevice(store, license, deviceInfo, clientIp);
    }

    // Log successful validation
    await logValidation('license_validated', license.id, store.id, {
      tier: license.tier,
      isFirstActivation,
    }, clientIp, deviceInfo?.userAgent);

    // Build response
    const response: ValidateLicenseSuccessResponse = {
      valid: true,
      storeId: store.id,
      tier: license.tier,
      status: 'active',
      message: isFirstActivation
        ? 'License activated successfully! Your store is now set up.'
        : 'License validated successfully.',
    };

    // Include defaults on first activation
    if (isFirstActivation) {
      response.defaults = DEFAULT_STORE_SETUP;

      // Mark license as activated
      await licensesDB.update(license.id, {
        activatedAt: new Date(),
      } as any);
    }

    // Include required version if set
    response.requiredVersion = MINIMUM_APP_VERSION;

    // Include expiration if set
    if (license.expiresAt) {
      response.expiresAt = license.expiresAt.toISOString();
    }

    return {
      status: 200,
      body: response,
    };
  } catch (error) {
    console.error('License validation error:', error);

    return {
      status: 500,
      body: {
        valid: false,
        status: 'inactive',
        message: 'Internal server error. Please try again later.',
      },
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Find existing store or create new one for this license
 */
async function findOrCreateStore(
  license: Awaited<ReturnType<typeof licensesDB.getByLicenseKey>>,
  deviceInfo?: ValidateLicenseRequest['deviceInfo'],
  clientIp?: string
) {
  if (!license) throw new Error('License not found');

  // Check if store limit reached
  const existingStores = await storesDB.getByLicenseId(license.id);

  // For simplicity, return first active store if exists
  const activeStore = existingStores.find(s => s.status === 'active');
  if (activeStore) {
    return activeStore;
  }

  // Check store limit
  if (existingStores.length >= license.maxStores) {
    throw new Error(`Store limit (${license.maxStores}) reached for this license`);
  }

  // Create new store
  const store = await storesDB.create({
    licenseId: license.id,
    tenantId: license.tenantId,
    name: `Store ${existingStores.length + 1}`,
  });

  await logValidation('store_created', license.id, store.id, {
    storeName: store.name,
  }, clientIp, deviceInfo?.userAgent);

  return store;
}

/**
 * Track device for analytics and limit enforcement
 */
async function trackDevice(
  store: Awaited<ReturnType<typeof storesDB.getById>>,
  license: Awaited<ReturnType<typeof licensesDB.getByLicenseKey>>,
  deviceInfo: NonNullable<ValidateLicenseRequest['deviceInfo']>,
  clientIp?: string
) {
  if (!store || !license) return;

  // Generate simple device fingerprint
  const fingerprint = generateDeviceFingerprint(deviceInfo);

  // Check if device already registered
  let device = await devicesDB.getByFingerprint(fingerprint);

  if (device) {
    // Update existing device
    await devicesDB.recordActivity(device.id, clientIp);
  } else {
    // Check device limit
    const existingDevices = await devicesDB.getByStoreId(store.id);
    if (existingDevices.length >= license.maxDevicesPerStore) {
      console.warn(`Device limit (${license.maxDevicesPerStore}) reached for store ${store.id}`);
      // Don't block, just warn for now
      return;
    }

    // Register new device
    device = await devicesDB.create({
      storeId: store.id,
      licenseId: license.id,
      tenantId: license.tenantId,
      deviceFingerprint: fingerprint,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || 'Unknown',
        platform: deviceInfo.platform || 'Unknown',
        screenResolution: deviceInfo.screenResolution,
        language: deviceInfo.language,
      },
      ipAddress: clientIp,
    });

    // Increment store device count
    await storesDB.incrementDeviceCount(store.id);

    await logValidation('device_registered', license.id, store.id, {
      deviceId: device.id,
      fingerprint: fingerprint.substring(0, 8) + '...',
    }, clientIp, deviceInfo.userAgent);
  }
}

/**
 * Generate a simple device fingerprint from device info
 */
function generateDeviceFingerprint(deviceInfo: NonNullable<ValidateLicenseRequest['deviceInfo']>): string {
  const data = [
    deviceInfo.platform || '',
    deviceInfo.userAgent || '',
    deviceInfo.screenResolution || '',
    deviceInfo.language || '',
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * Log validation events to audit log
 */
async function logValidation(
  action: 'license_validated' | 'license_validation_failed' | 'store_created' | 'device_registered',
  licenseId?: string,
  storeId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await auditLogsDB.create({
      action: action as any,
      entityType: licenseId ? 'license' : 'system',
      entityId: licenseId || storeId,
      details: {
        ...details,
        storeId,
      },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log validation:', error);
  }
}

// ==================== EXPRESS ROUTE HANDLER ====================

/**
 * Express-compatible route handler
 * Usage: app.post('/api/validate-license', expressHandler)
 */
export function createExpressHandler() {
  return async (req: any, res: any) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const result = await validateLicense(req.body, clientIp);
    res.status(result.status).json(result.body);
  };
}
