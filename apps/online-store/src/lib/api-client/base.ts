import { z, ZodSchema } from 'zod';

export interface ClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}

export class APIClient {
  private baseURL: string;
  private options: Required<ClientOptions>;

  constructor(baseURL: string, options: ClientOptions = {}) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.options = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      headers: {},
      ...options,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    schema?: ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`;
    const requestId = this.generateRequestId();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...this.options.headers,
      },
      signal: AbortSignal.timeout(this.options.timeout),
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `HTTP ${response.status}: ${errorData.message || response.statusText}`
          );
        }

        const responseData = await response.json();

        // Validate response schema if provided
        if (schema) {
          const validatedData = schema.parse(responseData);
          return {
            data: validatedData,
            success: true,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        return {
          data: responseData,
          success: true,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) or validation errors
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.options.retries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      data: null as T,
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed after all retries',
        details: lastError,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  async get<T>(path: string, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, schema);
  }

  async post<T>(path: string, body: any, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, schema);
  }

  async put<T>(path: string, body: any, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, schema);
  }

  async patch<T>(path: string, body: any, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, schema);
  }

  async delete<T>(path: string, schema?: ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, schema);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method to add auth headers
  setAuthToken(token: string): void {
    this.options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Helper method to add custom headers
  setHeader(key: string, value: string): void {
    this.options.headers[key] = value;
  }

  // Helper method to remove headers
  removeHeader(key: string): void {
    delete this.options.headers[key];
  }
}




