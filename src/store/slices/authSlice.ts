import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { loginUser, loginSalonMode, logoutUser, verifyToken } from './authThunks';
import type { DeviceMode, DevicePolicy, AuthDeviceState } from '@/types/device';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  salonId: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Device state for offline mode
  device: AuthDeviceState | null;
  storePolicy: DevicePolicy | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  salonId: null,
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
    setAuth: (state, action: PayloadAction<{ user: AuthState['user']; salonId: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.salonId = action.payload.salonId;
      state.token = action.payload.token;
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.salonId = null;
      state.token = null;
      state.error = null;
      state.device = null;
      state.storePolicy = null;
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
        state.salonId = action.payload.salonId;
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
        state.salonId = action.payload.salonId;
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
        state.salonId = null;
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
        state.salonId = action.payload.salonId;
        state.token = action.payload.token;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      });
  },
});

export const {
  setAuth,
  logout,
  clearError,
  setDevice,
  setStorePolicy,
  updateDeviceMode,
  clearDevice,
} = authSlice.actions;

// Basic auth selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectSalonId = (state: RootState) => state.auth.salonId;
export const selectToken = (state: RootState) => state.auth.token;

// Device selectors
export const selectDevice = (state: RootState) => state.auth.device;
export const selectStorePolicy = (state: RootState) => state.auth.storePolicy;
export const selectDeviceMode = (state: RootState): DeviceMode | null =>
  state.auth.device?.mode ?? null;
export const selectIsOfflineEnabled = (state: RootState): boolean =>
  state.auth.device?.offlineModeEnabled ?? false;
export const selectDeviceId = (state: RootState): string | null =>
  state.auth.device?.id ?? null;

export default authSlice.reducer;
