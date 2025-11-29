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

// ==================== DEMO MODE ====================

// Demo credentials that work without a backend server
const DEMO_CREDENTIALS: Record<string, { password: string; store: { id: string; name: string; storeLoginId: string }; license: { tier: string; status: string } }> = {
  'demo@salon.com': {
    password: 'demo123',
    store: { id: 'store-demo-001', name: 'Demo Salon & Spa', storeLoginId: 'demo@salon.com' },
    license: { tier: 'professional', status: 'active' },
  },
  'admin@mangobiz.com': {
    password: 'admin123',
    store: { id: 'store-mango-001', name: 'Mango Business', storeLoginId: 'admin@mangobiz.com' },
    license: { tier: 'enterprise', status: 'active' },
  },
};

/**
 * Check if credentials match demo mode
 */
function checkDemoCredentials(storeId: string, password: string): StoreLoginResponse | null {
  const demo = DEMO_CREDENTIALS[storeId.toLowerCase()];
  if (demo && demo.password === password) {
    console.log('🎭 Demo mode: Using offline credentials for', storeId);
    return {
      success: true,
      store: demo.store,
      license: demo.license,
      token: 'demo-token-' + Date.now(),
      defaults: {
        taxSettings: [{ name: 'Sales Tax', rate: 8.5, isDefault: true }],
        categories: [
          { name: 'Manicure', icon: '💅', color: '#FF6B9D' },
          { name: 'Pedicure', icon: '🦶', color: '#4ECDC4' },
          { name: 'Waxing', icon: '✨', color: '#95E1D3' },
          { name: 'Facial', icon: '🧖', color: '#F9ED69' },
        ],
        items: [
          { name: 'Basic Manicure', category: 'Manicure', duration: 30, price: 20 },
          { name: 'Gel Manicure', category: 'Manicure', duration: 45, price: 35 },
          { name: 'Basic Pedicure', category: 'Pedicure', duration: 45, price: 30 },
          { name: 'Spa Pedicure', category: 'Pedicure', duration: 60, price: 50 },
        ],
        employeeRoles: [
          { name: 'Manager', permissions: ['all'], color: '#10B981' },
          { name: 'Technician', permissions: ['create_ticket', 'checkout'], color: '#3B82F6' },
        ],
        paymentMethods: [
          { name: 'Cash', type: 'cash', isActive: true },
          { name: 'Credit Card', type: 'card', isActive: true },
        ],
      },
    };
  }
  return null;
}

// ==================== API FUNCTIONS ====================

/**
 * Authenticate store with store ID and password
 */
export async function loginStore(
  storeId: string,
  password: string
): Promise<StoreLoginResponse> {
  // First, check demo credentials (works offline)
  const demoResponse = checkDemoCredentials(storeId, password);
  if (demoResponse) {
    return demoResponse;
  }

  // Try server authentication
  try {
    const response = await axios.post<StoreLoginResponse>(
      `${CONTROL_CENTER_URL}/api/auth/store`,
      { storeId, password } as StoreLoginRequest,
      { timeout: 10000 }
    );

    console.log('✅ Store login successful:', response.data);
    return response.data;
  } catch (error) {
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
