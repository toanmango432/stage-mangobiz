/**
 * Store Authentication API
 * Handles store login, member login, and PIN authentication
 */

import axios, { AxiosError } from 'axios';

// Use empty string for same-origin requests (works with vite proxy)
// Only fall back to localhost:4000 if env var is not defined at all
const CONTROL_CENTER_URL = import.meta.env.VITE_CONTROL_CENTER_URL !== undefined
  ? import.meta.env.VITE_CONTROL_CENTER_URL
  : 'http://localhost:4000';

// Demo mode: Enable mock responses when no backend is available
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || true; // Default to true for development

// Demo credentials
const DEMO_CREDENTIALS = {
  storeId: 'demo@salon.com',
  password: 'demo123',
};

// ==================== TYPES ====================

export interface StoreLoginRequest {
  storeId: string;
  password: string;
}

export interface StoreLoginResponse {
  success: boolean;
  store?: {
    id: string;
    name: string;
    storeLoginId: string;
  };
  license?: {
    tier: string;
    status: string;
  };
  token?: string;
  defaults?: {
    taxSettings?: any[];
    categories?: any[];
    items?: any[];
    employeeRoles?: any[];
    paymentMethods?: any[];
  };
  error?: string;
  status?: string;
}

export interface MemberLoginRequest {
  email: string;
  password: string;
  storeId?: string;
}

export interface MemberLoginResponse {
  success: boolean;
  member?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
  };
  stores?: Array<{
    id: string;
    name: string;
    storeLoginId: string;
  }>;
  requiresStoreSelection?: boolean;
  token?: string;
  error?: string;
  status?: string;
}

export interface PinLoginRequest {
  pin: string;
  storeId: string;
}

export interface PinLoginResponse {
  success: boolean;
  member?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
  };
  token?: string;
  error?: string;
}

export interface AuthError {
  code: 'NETWORK_ERROR' | 'INVALID_CREDENTIALS' | 'SUSPENDED' | 'INACTIVE' | 'NO_ACCESS' | 'UNKNOWN';
  message: string;
  details?: any;
}

// ==================== API FUNCTIONS ====================

/**
 * Mock response for demo login
 */
function getDemoLoginResponse(): StoreLoginResponse {
  return {
    success: true,
    store: {
      id: 'demo_store_001',
      name: 'Demo Salon',
      storeLoginId: 'demo@salon.com',
    },
    license: {
      tier: 'premium',
      status: 'active',
    },
    token: 'demo_token_' + Date.now(),
    defaults: {
      taxSettings: [{ name: 'Sales Tax', rate: 8.25, isDefault: true }],
      categories: [
        { id: 'cat_1', name: 'Hair Services' },
        { id: 'cat_2', name: 'Nail Services' },
        { id: 'cat_3', name: 'Spa Services' },
      ],
      paymentMethods: [
        { id: 'pm_1', name: 'Cash', isDefault: true },
        { id: 'pm_2', name: 'Credit Card' },
        { id: 'pm_3', name: 'Debit Card' },
      ],
    },
  };
}

/**
 * Authenticate store with store ID and password
 */
export async function loginStore(
  storeId: string,
  password: string
): Promise<StoreLoginResponse> {
  // Check for demo credentials first (works even without backend)
  if (DEMO_MODE) {
    const isDemoCredentials =
      storeId.toLowerCase() === DEMO_CREDENTIALS.storeId.toLowerCase() &&
      password === DEMO_CREDENTIALS.password;

    if (isDemoCredentials) {
      console.log('✅ Demo login successful (mock mode)');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return getDemoLoginResponse();
    }
  }

  try {
    const response = await axios.post<StoreLoginResponse>(
      `${CONTROL_CENTER_URL}/api/auth/store`,
      { storeId, password } as StoreLoginRequest,
      { timeout: 10000 }
    );

    console.log('✅ Store login successful:', response.data);
    return response.data;
  } catch (error) {
    // In demo mode, if API fails and credentials match demo, still allow login
    if (DEMO_MODE) {
      const isDemoCredentials =
        storeId.toLowerCase() === DEMO_CREDENTIALS.storeId.toLowerCase() &&
        password === DEMO_CREDENTIALS.password;

      if (isDemoCredentials) {
        console.log('✅ Demo login successful (API unavailable, using mock)');
        return getDemoLoginResponse();
      }
    }

    throw handleAuthError(error, 'Store login');
  }
}

/**
 * Authenticate member with email and password
 */
export async function loginMember(
  email: string,
  password: string,
  storeId?: string
): Promise<MemberLoginResponse> {
  try {
    const response = await axios.post<MemberLoginResponse>(
      `${CONTROL_CENTER_URL}/api/auth/member`,
      { email, password, storeId } as MemberLoginRequest,
      { timeout: 10000 }
    );

    console.log('✅ Member login successful:', response.data);
    return response.data;
  } catch (error) {
    throw handleAuthError(error, 'Member login');
  }
}

/**
 * Quick login with PIN (requires store to be already logged in)
 */
export async function loginWithPin(
  pin: string,
  storeId: string
): Promise<PinLoginResponse> {
  try {
    const response = await axios.post<PinLoginResponse>(
      `${CONTROL_CENTER_URL}/api/auth/pin`,
      { pin, storeId } as PinLoginRequest,
      { timeout: 10000 }
    );

    console.log('✅ PIN login successful:', response.data);
    return response.data;
  } catch (error) {
    throw handleAuthError(error, 'PIN login');
  }
}

/**
 * Handle authentication errors
 */
function handleAuthError(error: unknown, context: string): AuthError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Network error (no response from server)
    if (!axiosError.response) {
      console.error(`❌ ${context} network error:`, axiosError.message);
      return {
        code: 'NETWORK_ERROR',
        message: 'Cannot reach server. Please check your internet connection.',
        details: axiosError.message,
      };
    }

    // Server returned error response
    const status = axiosError.response.status;
    const data = axiosError.response.data;

    if (status === 400) {
      console.error(`❌ ${context} bad request:`, data);
      return {
        code: 'INVALID_CREDENTIALS',
        message: data.error || 'Invalid request.',
        details: data,
      };
    }

    if (status === 401) {
      console.error(`❌ ${context} unauthorized:`, data);
      return {
        code: 'INVALID_CREDENTIALS',
        message: data.error || 'Invalid credentials.',
        details: data,
      };
    }

    if (status === 403) {
      const statusCode = data.status;
      if (statusCode === 'suspended') {
        return {
          code: 'SUSPENDED',
          message: data.error || 'Account suspended.',
          details: data,
        };
      }
      if (statusCode === 'inactive') {
        return {
          code: 'INACTIVE',
          message: data.error || 'Account inactive.',
          details: data,
        };
      }
      return {
        code: 'NO_ACCESS',
        message: data.error || 'Access denied.',
        details: data,
      };
    }

    // Other server errors
    console.error(`❌ ${context} server error:`, status, data);
    return {
      code: 'UNKNOWN',
      message: data.error || 'Server error occurred. Please try again later.',
      details: data,
    };
  }

  // Unknown error
  console.error(`❌ ${context} unknown error:`, error);
  return {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred.',
    details: error,
  };
}
