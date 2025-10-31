import { createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api/endpoints';
import { settingsDB } from '../../db/database';
import { socketClient } from '../../api/socket';

// Login with email/password
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Save to IndexedDB
      await settingsDB.set('auth_token', response.token);
      await settingsDB.set('refresh_token', response.refreshToken);
      await settingsDB.set('salon_id', response.user.salonId);
      await settingsDB.set('user_data', JSON.stringify(response.user));

      // Connect socket
      await socketClient.connect();

      return {
        user: response.user,
        salonId: response.user.salonId,
        token: response.token,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Login with Salon Mode (PIN)
export const loginSalonMode = createAsyncThunk(
  'auth/loginSalonMode',
  async ({ salonId, pin }: { salonId: string; pin: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.loginSalonMode(salonId, pin);
      
      // Save to IndexedDB
      await settingsDB.set('auth_token', response.token);
      await settingsDB.set('refresh_token', response.refreshToken);
      await settingsDB.set('salon_id', salonId);
      await settingsDB.set('user_data', JSON.stringify(response.user));

      // Connect socket
      await socketClient.connect();

      return {
        user: response.user,
        salonId,
        token: response.token,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Salon mode login failed');
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      
      // Clear IndexedDB
      await settingsDB.remove('auth_token');
      await settingsDB.remove('refresh_token');
      await settingsDB.remove('salon_id');
      await settingsDB.remove('user_data');

      // Disconnect socket
      socketClient.disconnect();

      return null;
    } catch (error: any) {
      // Even if API call fails, clear local data
      await settingsDB.remove('auth_token');
      await settingsDB.remove('refresh_token');
      await settingsDB.remove('salon_id');
      await settingsDB.remove('user_data');
      socketClient.disconnect();
      
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// Verify token and restore session
export const verifyToken = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      const token = await settingsDB.get('auth_token');
      const salonId = await settingsDB.get('salon_id');
      const userData = await settingsDB.get('user_data');

      if (!token || !salonId || !userData) {
        return rejectWithValue('No session found');
      }

      // Verify token with backend
      await authAPI.verifyToken();

      // Connect socket
      await socketClient.connect();

      return {
        user: JSON.parse(userData),
        salonId,
        token,
      };
    } catch (error: any) {
      // Clear invalid session
      await settingsDB.remove('auth_token');
      await settingsDB.remove('refresh_token');
      await settingsDB.remove('salon_id');
      await settingsDB.remove('user_data');
      
      return rejectWithValue(error.response?.data?.message || 'Session expired');
    }
  }
);
