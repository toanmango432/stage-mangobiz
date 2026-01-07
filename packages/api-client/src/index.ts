/**
 * @mango/api-client
 *
 * Backend-agnostic API client for Mango POS applications.
 * Provides a unified interface for REST API communication that can work
 * with any backend provider (Supabase Edge Functions, Firebase, custom API, etc.)
 *
 * @example
 * ```typescript
 * import { createAPIClient, endpoints } from '@mango/api-client';
 *
 * // Create a configured client instance
 * const api = createAPIClient({
 *   baseUrl: import.meta.env.VITE_API_BASE_URL,
 *   getAuthToken: () => localStorage.getItem('auth_token'),
 * });
 *
 * // Make API calls
 * const clients = await api.get(endpoints.clients.list('store-123'));
 * ```
 */

// =============================================================================
// Re-exports
// =============================================================================

// Client
export { APIClient } from './client';

// Endpoints
export { endpoints, API_VERSION, API_PREFIX } from './endpoints';
export type {
  Endpoints,
  AuthEndpoints,
  ClientEndpoints,
  StaffEndpoints,
  ServiceEndpoints,
  AppointmentEndpoints,
  TicketEndpoints,
  TransactionEndpoints,
  SyncEndpoints,
} from './endpoints';

// Types
export type {
  APIClientConfig,
  APIResponse,
  APIError,
  RequestOptions,
  BatchOperation,
  BatchResponse,
  ResponseMeta,
  PaginationMeta,
  HttpMethod,
  ExtractData,
  PartialExcept,
} from './types';

export {
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from './types';

// =============================================================================
// Factory Function
// =============================================================================

import { APIClient } from './client';
import type { APIClientConfig } from './types';

/**
 * Create a configured API client instance
 *
 * @example
 * ```typescript
 * const api = createAPIClient({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: async () => {
 *     const session = await getSession();
 *     return session?.token ?? null;
 *   },
 *   onUnauthorized: () => {
 *     window.location.href = '/login';
 *   },
 * });
 * ```
 */
export function createAPIClient(config: APIClientConfig): APIClient {
  return new APIClient(config);
}

// =============================================================================
// Default Instance (Optional)
// =============================================================================

/**
 * Default API client instance.
 * Uses environment variables for configuration.
 * Import this for quick usage without manual configuration.
 *
 * @example
 * ```typescript
 * import { defaultClient, endpoints } from '@mango/api-client';
 *
 * const response = await defaultClient.get(endpoints.clients.list('store-123'));
 * ```
 */
let _defaultClient: APIClient | null = null;

export function getDefaultClient(): APIClient {
  if (!_defaultClient) {
    // Use environment variables if available
    const baseUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
      '/api';

    _defaultClient = new APIClient({
      baseUrl,
      timeout: 10000,
      retries: 3,
    });
  }
  return _defaultClient;
}

/**
 * Configure the default client with custom settings
 */
export function configureDefaultClient(config: Partial<APIClientConfig>): APIClient {
  const baseUrl =
    config.baseUrl ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
    '/api';

  _defaultClient = new APIClient({
    ...config,
    baseUrl,
  });

  return _defaultClient;
}
