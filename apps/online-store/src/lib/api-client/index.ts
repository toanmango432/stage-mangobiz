import { z } from 'zod';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
}

// API Error class
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request ID for logging
let requestId = 0;

// API Client class
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Make HTTP request
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const currentRequestId = ++requestId;
    const { method = 'GET', headers = {}, body, params } = config;

    // Build URL with query parameters
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare request
    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    // Log request
    console.log(`[API ${currentRequestId}] ${method} ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), requestConfig);
      
      // Log response
      console.log(`[API ${currentRequestId}] ${response.status} ${response.statusText}`);

      // Parse response
      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        const errorData = data.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' };
        throw new APIError(
          response.status,
          errorData.code,
          errorData.message,
          errorData.details
        );
      }

      // Validate response with schema if provided
      if (schema) {
        const validatedData = schema.parse(data);
        return validatedData;
      }

      return data;
    } catch (error) {
      // Log error
      console.error(`[API ${currentRequestId}] Error:`, error);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof z.ZodError) {
        throw new APIError(
          500,
          'VALIDATION_ERROR',
          'Response validation failed',
          error.errors
        );
      }

      // Network or other errors
      throw new APIError(
        0,
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed'
      );
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params }, schema);
  }

  // POST request
  async post<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body }, schema);
  }

  // PUT request
  async put<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body }, schema);
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, schema);
  }
}

// Create default API client instance
export const apiClient = new APIClient();

// Export convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean>, schema?: z.ZodSchema<T>) =>
    apiClient.get<T>(endpoint, params, schema),
  
  post: <T>(endpoint: string, body?: any, schema?: z.ZodSchema<T>) =>
    apiClient.post<T>(endpoint, body, schema),
  
  put: <T>(endpoint: string, body?: any, schema?: z.ZodSchema<T>) =>
    apiClient.put<T>(endpoint, body, schema),
  
  delete: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    apiClient.delete<T>(endpoint, schema),
};

// Export types
export type { RequestConfig };




