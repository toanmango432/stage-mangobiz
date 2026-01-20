/**
 * Client Data Service
 *
 * Domain-specific data operations for clients.
 * Extracted from dataService.ts for better modularity.
 *
 * MODES:
 * - LOCAL-FIRST (default): Reads from IndexedDB or SQLite, writes queue for background sync
 * - API (when VITE_USE_API_LAYER=true): All operations go through REST API endpoints
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron,
 * uses SQLite via sqliteClientsDB
 */

import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';
import { clientsDB, syncQueueDB } from '@/db/database';
import { sqliteClientsDB } from '@/services/sqliteServices';
import { createAPIClient, endpoints } from '@mango/api-client';
import type { APIResponse } from '@mango/api-client';
import type {
  ListResponse,
  ItemResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from '@mango/api-contracts';
import type { Client } from '@/types';

// ==================== CONFIG ====================

/**
 * API mode flag - when true, uses REST API instead of local-first
 */
const USE_API = import.meta.env.VITE_USE_API_LAYER === 'true';

/**
 * SQLite mode flag - when true, uses SQLite instead of IndexedDB
 */
const USE_SQLITE = shouldUseSQLite();

// Singleton API client instance
let _apiClient: ReturnType<typeof createAPIClient> | null = null;

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Get or create API client instance
 */
function getAPIClient() {
  if (!_apiClient) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    _apiClient = createAPIClient({
      baseUrl,
      timeout: 15000,
      retries: 2,
      getAuthToken: () => {
        const state = store.getState();
        return state.auth.token || localStorage.getItem('auth_token');
      },
      onUnauthorized: () => {
        console.warn('[ClientDataService] Unauthorized API request');
        store.dispatch({ type: 'auth/logout' });
      },
    });
  }
  return _apiClient;
}

/**
 * Extract data from API response with fallback
 */
function extractData<T>(response: APIResponse<T>, fallback: T): T {
  if (response.success && response.data !== null) {
    return response.data;
  }
  if (response.error) {
    console.error('[ClientDataService] API Error:', response.error);
  }
  return fallback;
}

/**
 * Queue a sync operation for background processing
 * LOCAL-FIRST: Non-blocking, fire-and-forget
 */
function queueSyncOperation(
  action: 'create' | 'update' | 'delete',
  entityId: string,
  payload: unknown
): void {
  // Don't await - queue async
  syncQueueDB.add({
    type: action,
    entity: 'client',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[ClientDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== CLIENT SERVICE ====================

/**
 * Clients data operations
 *
 * API MODE: REST API calls to Edge Functions
 * LOCAL-FIRST MODE: IndexedDB or SQLite reads, writes queue for background sync
 */
export const clientsService = {
  async getAll(): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_API) {
      // API MODE: Fetch from REST endpoint
      const api = getAPIClient();
      const response = await api.get<ListResponse<Client>>(
        endpoints.clients.list(storeId)
      );
      return extractData(response, { data: [], pagination: {} as never, timestamp: '' }).data;
    }

    // LOCAL-FIRST MODE: Read from SQLite or IndexedDB
    if (USE_SQLITE) {
      return sqliteClientsDB.getAll(storeId);
    }
    return clientsDB.getAll(storeId);
  },

  async getById(id: string): Promise<Client | null> {
    if (USE_API) {
      // API MODE: Fetch from REST endpoint
      const api = getAPIClient();
      const response = await api.get<ItemResponse<Client>>(
        endpoints.clients.get(id)
      );
      return extractData(response, { data: null as unknown as Client, timestamp: '' }).data || null;
    }

    // LOCAL-FIRST MODE: Read from SQLite or IndexedDB
    if (USE_SQLITE) {
      const client = await sqliteClientsDB.getById(id);
      return client || null;
    }
    const client = await clientsDB.getById(id);
    return client || null;
  },

  async search(query: string): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_API) {
      // API MODE: Search via REST endpoint
      const api = getAPIClient();
      const response = await api.get<{ data: Client[]; query: string; timestamp: string }>(
        endpoints.clients.search(storeId, query)
      );
      return extractData(response, { data: [], query: '', timestamp: '' }).data;
    }

    // LOCAL-FIRST MODE: Search SQLite or IndexedDB
    if (USE_SQLITE) {
      return sqliteClientsDB.search(storeId, query);
    }
    return clientsDB.search(storeId, query);
  },

  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Client> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    if (USE_API) {
      // API MODE: Create via REST endpoint
      const api = getAPIClient();
      const response = await api.post<CreateResponse<Client>>(
        endpoints.clients.create,
        { ...client, storeId }
      );
      const result = extractData(response, null);
      if (!result) throw new Error('Failed to create client');
      return result.data;
    }

    // LOCAL-FIRST MODE: Write to SQLite or IndexedDB first (instant)
    let created: Client;
    const clientWithStore = { ...client, storeId };
    if (USE_SQLITE) {
      // Type assertion needed because input excludes syncStatus but sqliteClientsDB adds it
      created = await sqliteClientsDB.create(clientWithStore as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
      created = await clientsDB.create(clientWithStore);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    if (USE_API) {
      // API MODE: Update via REST endpoint
      const api = getAPIClient();
      const response = await api.put<UpdateResponse<Client>>(
        endpoints.clients.update(id),
        updates
      );
      return extractData(response, { data: null as unknown as Client, timestamp: '' }).data || null;
    }

    // LOCAL-FIRST MODE: Update SQLite or IndexedDB first (instant)
    let updated: Client | null;
    if (USE_SQLITE) {
      updated = await sqliteClientsDB.update(id, updates);
    } else {
      const result = await clientsDB.update(id, updates);
      updated = result ?? null;
    }
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('update', id, updated);

    return updated;
  },

  async delete(id: string): Promise<void> {
    if (USE_API) {
      // API MODE: Delete via REST endpoint
      const api = getAPIClient();
      await api.delete<DeleteResponse>(endpoints.clients.delete(id));
      return;
    }

    // LOCAL-FIRST MODE: Delete from SQLite or IndexedDB first (instant)
    if (USE_SQLITE) {
      await sqliteClientsDB.delete(id);
    } else {
      await clientsDB.delete(id);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('delete', id, { id });
  },

  async getVipClients(): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_API) {
      // API MODE: Fetch VIP clients via REST endpoint
      const api = getAPIClient();
      const response = await api.get<{ data: Client[]; timestamp: string }>(
        `${endpoints.clients.list(storeId)}/vip`
      );
      return extractData(response, { data: [], timestamp: '' }).data;
    }

    // LOCAL-FIRST MODE: Query SQLite or IndexedDB
    if (USE_SQLITE) {
      return sqliteClientsDB.getVips(storeId);
    }
    return clientsDB.getVips(storeId);
  },
};

export default clientsService;
