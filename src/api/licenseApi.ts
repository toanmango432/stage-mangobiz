import axios, { AxiosError } from 'axios';

// Use empty string for same-origin requests (works with vite proxy)
// Only fallback to localhost:4000 if env variable is completely undefined
const CONTROL_CENTER_URL = import.meta.env.VITE_CONTROL_CENTER_URL !== undefined
  ? import.meta.env.VITE_CONTROL_CENTER_URL
  : 'http://localhost:4000';

export interface ValidateLicenseRequest {
  licenseKey: string;
  appVersion: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}

export interface ValidateLicenseResponse {
  valid: boolean;
  storeId?: string;
  tier?: string;
  status?: 'active' | 'inactive' | 'deactivated' | 'expired';
  message?: string;
  defaults?: {
    taxSettings?: any[];
    categories?: any[];
    items?: any[];
    employeeRoles?: any[];
    paymentMethods?: any[];
  };
  requiredVersion?: string;
  expiresAt?: string;
}

export interface LicenseError {
  code: 'NETWORK_ERROR' | 'INVALID_LICENSE' | 'DEACTIVATED' | 'VERSION_MISMATCH' | 'UNKNOWN';
  message: string;
  details?: any;
}

/**
 * Validate license with control center
 */
export async function validateLicense(
  licenseKey: string,
  appVersion: string = '1.0.0'
): Promise<ValidateLicenseResponse> {
  try {
    const response = await axios.post<ValidateLicenseResponse>(
      `${CONTROL_CENTER_URL}/api/validate-license`,
      {
        licenseKey,
        appVersion,
        deviceInfo: {
          platform: navigator.platform || 'unknown',
          userAgent: navigator.userAgent,
        },
      } as ValidateLicenseRequest,
      {
        timeout: 10000, // 10 second timeout
      }
    );

    console.log('✅ License validation successful:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      // Network error (no response from server)
      if (!axiosError.response) {
        console.error('❌ License validation network error:', axiosError.message);
        throw {
          code: 'NETWORK_ERROR',
          message: 'Cannot reach control center. Please check your internet connection.',
          details: axiosError.message,
        } as LicenseError;
      }

      // Server returned error response
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      if (status === 400 || status === 401 || status === 403) {
        console.error('❌ License validation failed:', data);
        throw {
          code: 'INVALID_LICENSE',
          message: data.message || 'Invalid or deactivated license key.',
          details: data,
        } as LicenseError;
      }

      if (status === 426) {
        // Upgrade Required - version mismatch
        console.error('❌ Version mismatch:', data);
        throw {
          code: 'VERSION_MISMATCH',
          message: data.message || 'App version outdated. Please update.',
          details: data,
        } as LicenseError;
      }

      // Other server errors
      console.error('❌ License validation server error:', status, data);
      throw {
        code: 'UNKNOWN',
        message: data.message || 'Server error occurred. Please try again later.',
        details: data,
      } as LicenseError;
    }

    // Unknown error
    console.error('❌ License validation unknown error:', error);
    throw {
      code: 'UNKNOWN',
      message: 'An unexpected error occurred.',
      details: error,
    } as LicenseError;
  }
}

/**
 * Check if license response indicates deactivation
 */
export function isLicenseDeactivated(response: ValidateLicenseResponse): boolean {
  return (
    !response.valid ||
    response.status === 'deactivated' ||
    response.status === 'inactive' ||
    response.status === 'expired'
  );
}

/**
 * Check if app version meets requirement
 */
export function checkVersionRequirement(
  currentVersion: string,
  requiredVersion?: string
): boolean {
  if (!requiredVersion) return true;

  try {
    const current = currentVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const c = current[i] || 0;
      const r = required[i] || 0;
      if (c < r) return false;
      if (c > r) return true;
    }

    return true; // Versions are equal
  } catch (error) {
    console.error('Error comparing versions:', error);
    return true; // Allow if version comparison fails
  }
}
