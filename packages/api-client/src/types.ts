/**
 * API Client Types
 *
 * Backend-agnostic types for REST API communication.
 * These types define the contract between frontend and any backend provider.
 */

import { ZodSchema } from 'zod';

// =============================================================================
// Client Configuration
// =============================================================================

export interface APIClientConfig {
  /** Base URL for all API requests (e.g., 'https://api.example.com' or '/api') */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Callback to get auth token dynamically */
  getAuthToken?: () => Promise<string | null> | string | null;
  /** Callback when request receives 401 Unauthorized */
  onUnauthorized?: () => void;
  /** Callback for request logging */
  onRequest?: (method: string, url: string, body?: unknown) => void;
  /** Callback for response logging */
  onResponse?: (method: string, url: string, status: number, duration: number) => void;
  /** Callback for error logging */
  onError?: (method: string, url: string, error: Error) => void;
}

// =============================================================================
// Request Types
// =============================================================================

export interface RequestOptions<T = unknown> {
  /** Query parameters to append to URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Additional headers for this request */
  headers?: Record<string, string>;
  /** Zod schema for response validation */
  schema?: ZodSchema<T>;
  /** Override timeout for this request */
  timeout?: number;
  /** Skip retry logic for this request */
  skipRetry?: boolean;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

export interface BatchOperation {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** API path */
  path: string;
  /** Request body (for POST/PUT/PATCH) */
  body?: unknown;
  /** Unique identifier for this operation */
  id?: string;
}

// =============================================================================
// Response Types
// =============================================================================

export interface APIResponse<T> {
  /** Response data (null if request failed) */
  data: T | null;
  /** Whether the request was successful */
  success: boolean;
  /** HTTP status code */
  status: number;
  /** Error information (if request failed) */
  error?: APIError;
  /** Response metadata */
  meta?: ResponseMeta;
}

export interface APIError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: unknown;
  /** HTTP status code */
  status?: number;
}

export interface ResponseMeta {
  /** Pagination information */
  pagination?: PaginationMeta;
  /** Response timestamp */
  timestamp: string;
  /** Unique request ID for debugging */
  requestId: string;
  /** Request duration in milliseconds */
  duration?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface BatchResponse {
  /** Results for each operation, keyed by operation ID */
  results: Record<string, APIResponse<unknown>>;
  /** Overall success (true if all operations succeeded) */
  success: boolean;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failureCount: number;
}

// =============================================================================
// Error Classes
// =============================================================================

export class NetworkError extends Error {
  constructor(message: string = 'Network error - Please check your internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized - Please log in again') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  public details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// =============================================================================
// Utility Types
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Extract the data type from an APIResponse */
export type ExtractData<T> = T extends APIResponse<infer U> ? U : never;

/** Make all properties optional except specified keys */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
