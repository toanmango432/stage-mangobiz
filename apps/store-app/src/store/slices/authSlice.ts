import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { loginUser, loginSalonMode, logoutUser, verifyToken } from './authThunks';
import type { DeviceMode, DevicePolicy, AuthDeviceState } from '@/types/device';

// Member session type (from storeAuthManager)
interface MemberSession {
  memberId: string;
  memberName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior' | 'admin';
  avatarUrl?: string;
  permissions?: Record<string, boolean>;
}

// Store session type (from storeAuthManager)
interface StoreSession {
  storeId: string;
  storeName: string;
  storeLoginId: string;
  tenantId: string;
  tier: string;
}

// Auth status for two-tier authentication
type AuthStatus =
  | 'not_logged_in'
  | 'store_logged_in'  // Store authenticated, awaiting member PIN
  | 'active'           // Fully authenticated (store + member)
  | 'offline_grace'
  | 'offline_expired'
  | 'suspended'
  | 'checking';

interface AuthState {
  // Two-tier auth state
  status: AuthStatus;
  store: StoreSession | null;
  member: MemberSession | null;
  availableStores: StoreSession[]; // Stores the member has access to (for store switching)

  // Legacy fields for backward compatibility
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    storeId?: string;
  } | null;
  storeId: string | null;
  activeSalonId?: string;  // Alias for storeId
  token: string | null;
  loading: boolean;
  error: string | null;

  // Device state for offline mode
  device: AuthDeviceState | null;
  storePolicy: DevicePolicy | null;
}

const initialState: AuthState = {
  // Two-tier auth state
  status: 'not_logged_in',
  store: null,
  member: null,
  availableStores: [],

  // Legacy fields
  isAuthenticated: false,
  user: null,
  storeId: null,
  token: null,
  loading: false,
  error: null,

  // Device defaults
  device: null,
  storePolicy: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ==================== TWO-TIER AUTH ACTIONS ====================

    // Set store session (after store login, before PIN)
    setStoreSession: (state, action: PayloadAction<StoreSession>) => {
      state.status = 'store_logged_in';
      state.store = action.payload;
      state.storeId = action.payload.storeId; // Sync with legacy field
      state.isAuthenticated = false; // Not fully authenticated until member logs in
    },

    // Set member session (after PIN verification)
    setMemberSession: (state, action: PayloadAction<MemberSession>) => {
      state.status = 'active';
      state.member = action.payload;
      state.isAuthenticated = true;
      // Sync with legacy user field
      state.user = {
        id: action.payload.memberId,
        name: action.payload.memberName,
        email: action.payload.email,
        role: action.payload.role,
        storeId: state.storeId || undefined,
      };
    },

    // Set full auth session (store + member at once)
    setFullSession: (state, action: PayloadAction<{ store: StoreSession; member: MemberSession }>) => {
      state.status = 'active';
      state.store = action.payload.store;
      state.member = action.payload.member;
      state.storeId = action.payload.store.storeId;
      state.isAuthenticated = true;
      state.user = {
        id: action.payload.member.memberId,
        name: action.payload.member.memberName,
        email: action.payload.member.email,
        role: action.payload.member.role,
        storeId: action.payload.store.storeId,
      };
    },

    // Set auth status
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },

    // Clear member session (but keep store logged in)
    clearMemberSession: (state) => {
      state.status = state.store ? 'store_logged_in' : 'not_logged_in';
      state.member = null;
      state.user = null;
      state.isAuthenticated = false;
    },

    // Clear all auth (full logout)
    clearAllAuth: (state) => {
      state.status = 'not_logged_in';
      state.store = null;
      state.member = null;
      state.availableStores = [];
      state.isAuthenticated = false;
      state.user = null;
      state.storeId = null;
      state.token = null;
      state.error = null;
      state.device = null;
      state.storePolicy = null;
    },

    // Set available stores (for store switching)
    setAvailableStores: (state, action: PayloadAction<StoreSession[]>) => {
      state.availableStores = action.payload;
    },

    // Switch to a different store (for multi-store users)
    switchStore: (state, action: PayloadAction<StoreSession>) => {
      state.store = action.payload;
      state.storeId = action.payload.storeId;
    },

    // ==================== LEGACY ACTIONS (for backward compatibility) ====================

    setAuth: (state, action: PayloadAction<{ user: AuthState['user']; storeId: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.storeId = action.payload.storeId;
      state.token = action.payload.token;
      state.error = null;
      // Also update new fields
      state.status = 'active';
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.storeId = null;
      state.token = null;
      state.error = null;
      state.device = null;
      state.storePolicy = null;
      // Also clear new fields
      state.status = 'not_logged_in';
      state.store = null;
      state.member = null;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Device management actions
    setDevice: (state, action: PayloadAction<AuthDeviceState>) => {
      state.device = action.payload;
    },
    setStorePolicy: (state, action: PayloadAction<DevicePolicy>) => {
      state.storePolicy = action.payload;
    },
    updateDeviceMode: (state, action: PayloadAction<DeviceMode>) => {
      if (state.device) {
        state.device.mode = action.payload;
        state.device.offlineModeEnabled = action.payload === 'offline-enabled';
      }
    },
    clearDevice: (state) => {
      state.device = null;
      state.storePolicy = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.storeId = action.payload.storeId;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Salon Mode Login
      .addCase(loginSalonMode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginSalonMode.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.storeId = action.payload.storeId;
        state.token = action.payload.token;
      })
      .addCase(loginSalonMode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.storeId = null;
        state.token = null;
        state.error = null;
      })
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.storeId = action.payload.storeId;
        state.token = action.payload.token;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      });
  },
});

export const {
  // Two-tier auth actions
  setStoreSession,
  setMemberSession,
  setFullSession,
  setAuthStatus,
  clearMemberSession,
  clearAllAuth,
  setAvailableStores,
  switchStore,
  // Legacy actions
  setAuth,
  logout,
  clearError,
  setDevice,
  setStorePolicy,
  updateDeviceMode,
  clearDevice,
} = authSlice.actions;

// ==================== TWO-TIER AUTH SELECTORS ====================

// Auth status selector
export const selectAuthStatus = (state: RootState): AuthStatus => state.auth.status;

// Store session selector
export const selectStore = (state: RootState): StoreSession | null => state.auth.store;
export const selectStoreId = (state: RootState): string | null => state.auth.store?.storeId ?? null;
export const selectStoreName = (state: RootState): string | null => state.auth.store?.storeName ?? null;
export const selectTenantId = (state: RootState): string | null => state.auth.store?.tenantId ?? null;
export const selectAvailableStores = (state: RootState): StoreSession[] => state.auth.availableStores;

// Member session selector
export const selectMember = (state: RootState): MemberSession | null => state.auth.member;
export const selectMemberId = (state: RootState): string | null => state.auth.member?.memberId ?? null;
export const selectMemberName = (state: RootState): string => {
  const member = state.auth.member;
  if (!member) return '';
  return member.memberName || `${member.firstName} ${member.lastName}`.trim();
};
export const selectMemberRole = (state: RootState): string | null => state.auth.member?.role ?? null;

// Derived selectors
export const selectIsStoreLoggedIn = (state: RootState): boolean =>
  state.auth.status === 'store_logged_in' || state.auth.status === 'active';
export const selectIsMemberLoggedIn = (state: RootState): boolean =>
  state.auth.status === 'active' && state.auth.member !== null;
export const selectIsMemberLoginRequired = (state: RootState): boolean =>
  state.auth.status === 'store_logged_in';
export const selectIsFullyAuthenticated = (state: RootState): boolean =>
  state.auth.status === 'active' && state.auth.store !== null && state.auth.member !== null;

// ==================== LEGACY SELECTORS ====================

// Basic auth selectors (kept for backward compatibility)
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectSalonId = (state: RootState) => state.auth.storeId;
export const selectToken = (state: RootState) => state.auth.token;

// Device selectors
// LOCAL-FIRST: Device is always offline-enabled, no toggle needed
export const selectDevice = (state: RootState) => state.auth.device;
export const selectStorePolicy = (state: RootState) => state.auth.storePolicy;
// Always returns 'offline-enabled' for local-first architecture
export const selectDeviceMode = (_state: RootState): 'offline-enabled' => 'offline-enabled';
// Always returns true for local-first architecture
export const selectIsOfflineEnabled = (_state: RootState): boolean => true;
export const selectDeviceId = (state: RootState): string | null =>
  state.auth.device?.id ?? null;

// ==================== TYPE EXPORTS ====================
export type { AuthStatus, StoreSession, MemberSession };

export default authSlice.reducer;
