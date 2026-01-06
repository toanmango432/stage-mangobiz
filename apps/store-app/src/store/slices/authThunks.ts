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
      await settingsDB.set('salon_id', response.user.storeId);
      await settingsDB.set('user_data', JSON.stringify(response.user));

      // Connect socket
      await socketClient.connect();

      return {
        user: response.user,
        storeId: response.user.storeId,
        token: response.token,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      return rejectWithValue(apiMessage || message);
    }
  }
);

// Login with Salon Mode (PIN)
export const loginSalonMode = createAsyncThunk(
  'auth/loginSalonMode',
  async ({ storeId, pin }: { storeId: string; pin: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.loginSalonMode(storeId, pin);
      
      // Save to IndexedDB
      await settingsDB.set('auth_token', response.token);
      await settingsDB.set('refresh_token', response.refreshToken);
      await settingsDB.set('salon_id', storeId);
      await settingsDB.set('user_data', JSON.stringify(response.user));

      // Connect socket
      await socketClient.connect();

      return {
        user: response.user,
        storeId,
        token: response.token,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Salon mode login failed';
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      return rejectWithValue(apiMessage || message);
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
    } catch (error: unknown) {
      // Even if API call fails, clear local data
      await settingsDB.remove('auth_token');
      await settingsDB.remove('refresh_token');
      await settingsDB.remove('salon_id');
      await settingsDB.remove('user_data');
      socketClient.disconnect();

      const message = error instanceof Error ? error.message : 'Logout failed';
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      return rejectWithValue(apiMessage || message);
    }
  }
);

// Verify token and restore session
export const verifyToken = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      const token = await settingsDB.get('auth_token');
      const storeId = await settingsDB.get('salon_id');
      const userData = await settingsDB.get('user_data');

      if (!token || !storeId || !userData) {
        return rejectWithValue('No session found');
      }

      // Verify token with backend
      await authAPI.verifyToken();

      // Connect socket
      await socketClient.connect();

      return {
        user: JSON.parse(userData),
        storeId,
        token,
      };
    } catch (error: unknown) {
      // Clear invalid session
      await settingsDB.remove('auth_token');
      await settingsDB.remove('refresh_token');
      await settingsDB.remove('salon_id');
      await settingsDB.remove('user_data');

      const message = error instanceof Error ? error.message : 'Session expired';
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      return rejectWithValue(apiMessage || message);
    }
  }
);
