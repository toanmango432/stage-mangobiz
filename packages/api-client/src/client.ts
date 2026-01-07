/**
 * API Client
 *
 * Backend-agnostic HTTP client for REST API communication.
 * Uses native fetch API with retry logic, timeout handling, and Zod validation.
 *
 * @example
 * ```typescript
 * import { APIClient } from '@mango/api-client';
 *
 * const client = new APIClient({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: () => localStorage.getItem('token'),
 * });
 *
 * const response = await client.get('/users');
 * if (response.success) {
 *   console.log(response.data);
 * }
 * ```
 */

import { ZodSchema } from 'zod';
import {
  APIClientConfig,
  APIResponse,
  APIError,
  RequestOptions,
  BatchOperation,
  BatchResponse,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
  HttpMethod,
} from './types';

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<Omit<APIClientConfig, 'baseUrl' | 'getAuthToken' | 'onUnauthorized' | 'onRequest' | 'onResponse' | 'onError'>> = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {},
};

// =============================================================================
// API Client Class
// =============================================================================

export class APIClient {
  private baseUrl: string;
  private config: Required<Omit<APIClientConfig, 'getAuthToken' | 'onUnauthorized' | 'onRequest' | 'onResponse' | 'onError'>> & Pick<APIClientConfig, 'getAuthToken' | 'onUnauthorized' | 'onRequest' | 'onResponse' | 'onError'>;

  constructor(config: APIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      headers: { ...DEFAULT_CONFIG.headers, ...config.headers },
    };
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Perform a GET request
   */
  async get<T>(path: string, options?: RequestOptions<T>): Promise<APIResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  /**
   * Perform a POST request
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<APIResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  /**
   * Perform a PUT request
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<APIResponse<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  /**
   * Perform a PATCH request
   */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<APIResponse<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions<T>): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /**
   * Perform multiple operations in a single batch request
   * Useful for offline sync operations
   */
  async batch(operations: BatchOperation[]): Promise<BatchResponse> {
    const response = await this.post<{ results: Array<{ id: string; success: boolean; data?: unknown; error?: APIError }> }>(
      '/batch',
      { operations }
    );

    if (!response.success || !response.data) {
      return {
        results: {},
        success: false,
        successCount: 0,
        failureCount: operations.length,
      };
    }

    const results: Record<string, APIResponse<unknown>> = {};
    let successCount = 0;
    let failureCount = 0;

    response.data.results.forEach((result, index) => {
      const id = result.id || operations[index]?.id || `op_${index}`;
      if (result.success) {
        successCount++;
        results[id] = {
          data: result.data ?? null,
          success: true,
          status: 200,
          meta: response.meta,
        };
      } else {
        failureCount++;
        results[id] = {
          data: null,
          success: false,
          status: result.error?.status || 500,
          error: result.error,
          meta: response.meta,
        };
      }
    });

    return {
      results,
      success: failureCount === 0,
      successCount,
      failureCount,
    };
  }

  // ===========================================================================
  // Header Management
  // ===========================================================================

  /**
   * Set auth token for all future requests
   */
  setAuthToken(token: string): void {
    this.config.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove auth token
   */
  clearAuthToken(): void {
    delete this.config.headers['Authorization'];
  }

  /**
   * Set a custom header for all future requests
   */
  setHeader(key: string, value: string): void {
    this.config.headers[key] = value;
  }

  /**
   * Remove a custom header
   */
  removeHeader(key: string): void {
    delete this.config.headers[key];
  }

  /**
   * Update base URL (useful for switching environments)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions<T>
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const url = this.buildUrl(path, options?.params);
    const timeout = options?.timeout ?? this.config.timeout;
    const maxRetries = options?.skipRetry ? 0 : this.config.retries;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...this.config.headers,
      ...options?.headers,
    };

    // Add auth token if available
    if (!headers['Authorization'] && this.config.getAuthToken) {
      const token = await Promise.resolve(this.config.getAuthToken());
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Log request
    this.config.onRequest?.(method, url, body);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest(method, url, headers, body, timeout, options?.signal);
        const duration = Date.now() - startTime;

        // Log response
        this.config.onResponse?.(method, url, response.status, duration);

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);

          // Handle 401 Unauthorized
          if (response.status === 401) {
            this.config.onUnauthorized?.();
            throw new UnauthorizedError(errorData.message);
          }

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return this.createErrorResponse<T>(response.status, errorData, requestId, duration);
          }

          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        // Parse response body
        const responseData = await this.parseResponse(response);

        // Validate with Zod schema if provided
        if (options?.schema) {
          try {
            const validatedData = options.schema.parse(responseData);
            return this.createSuccessResponse<T>(validatedData as T, response.status, requestId, duration);
          } catch (zodError) {
            throw new ValidationError('Response validation failed', zodError);
          }
        }

        return this.createSuccessResponse<T>(responseData as T, response.status, requestId, duration);
      } catch (error) {
        lastError = error as Error;

        // Log error
        this.config.onError?.(method, url, lastError);

        // Don't retry certain errors
        if (
          error instanceof UnauthorizedError ||
          error instanceof ValidationError ||
          (error instanceof Error && error.message.includes('HTTP 4'))
        ) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    return this.createErrorResponse<T>(
      0,
      {
        code: this.getErrorCode(lastError),
        message: lastError?.message || 'Request failed after all retries',
        details: lastError,
      },
      requestId,
      duration
    );
  }

  private async executeRequest(
    method: HttpMethod,
    url: string,
    headers: Record<string, string>,
    body: unknown,
    timeout: number,
    signal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine signals if external signal provided
    const combinedSignal = signal
      ? this.combineSignals(signal, controller.signal)
      : controller.signal;

    try {
      const config: RequestInit = {
        method,
        headers,
        signal: combinedSignal,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      return await fetch(url, config);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError(timeout);
      }
      if (!(error as Error).message?.includes('fetch')) {
        throw error;
      }
      throw new NetworkError();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${this.baseUrl}${normalizedPath}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  private async parseErrorResponse(response: Response): Promise<APIError> {
    try {
      const data = await response.json();
      return {
        code: data.code || `HTTP_${response.status}`,
        message: data.message || data.error || response.statusText,
        details: data.details,
        status: response.status,
      };
    } catch {
      return {
        code: `HTTP_${response.status}`,
        message: response.statusText,
        status: response.status,
      };
    }
  }

  private createSuccessResponse<T>(
    data: T,
    status: number,
    requestId: string,
    duration: number
  ): APIResponse<T> {
    return {
      data,
      success: true,
      status,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        duration,
      },
    };
  }

  private createErrorResponse<T>(
    status: number,
    error: APIError,
    requestId: string,
    duration: number
  ): APIResponse<T> {
    return {
      data: null,
      success: false,
      status,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        duration,
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getErrorCode(error: Error | null): string {
    if (error instanceof NetworkError) return 'NETWORK_ERROR';
    if (error instanceof TimeoutError) return 'TIMEOUT_ERROR';
    if (error instanceof UnauthorizedError) return 'UNAUTHORIZED';
    if (error instanceof ValidationError) return 'VALIDATION_ERROR';
    return 'REQUEST_FAILED';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal1.addEventListener('abort', onAbort);
    signal2.addEventListener('abort', onAbort);
    return controller.signal;
  }
}
