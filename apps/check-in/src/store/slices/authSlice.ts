import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Store, AuthState } from '../../types';

const initialState: AuthState = {
  storeId: null,
  deviceId: null,
  isAuthenticated: false,
  store: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setStore: (state, action: PayloadAction<Store>) => {
      state.store = action.payload;
      state.storeId = action.payload.id;
      state.isAuthenticated = true;
    },
    setDeviceId: (state, action: PayloadAction<string>) => {
      state.deviceId = action.payload;
    },
    clearAuth: (state) => {
      state.storeId = null;
      state.deviceId = null;
      state.isAuthenticated = false;
      state.store = null;
    },
  },
});

export const { setStore, setDeviceId, clearAuth } = authSlice.actions;
export default authSlice.reducer;
