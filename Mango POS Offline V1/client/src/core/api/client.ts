import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { settingsDB } from '@/core/db';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get token from IndexedDB
      const token = await settingsDB.get('auth_token');
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add salon ID if available
      const salonId = await settingsDB.get('salon_id');
      if (salonId && config.headers) {
        config.headers['X-Salon-ID'] = salonId;
      }

      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await settingsDB.get('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token: newToken } = response.data;

          // Save new token
          await settingsDB.set('auth_token', newToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Clear auth data and redirect to login
        await settingsDB.remove('auth_token');
        await settingsDB.remove('refresh_token');
        await settingsDB.remove('salon_id');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('❌ Network error - API unreachable');
      return Promise.reject({
        message: 'Network error - Please check your internet connection',
        isNetworkError: true,
      });
    }

    // Log error
    console.error(`❌ API Error: ${error.response?.status} - ${error.message}`);
    
    return Promise.reject(error);
  }
);

// Retry logic for failed requests
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        console.log(`🔄 Retrying request (${i + 1}/${maxRetries})...`);
      }
    }
  }

  throw lastError;
}

export default apiClient;

