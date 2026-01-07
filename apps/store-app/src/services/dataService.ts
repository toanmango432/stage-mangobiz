/**
 * Data Service
 *
 * LOCAL-FIRST architecture - Phase 4 Implementation
 * With API-FIRST abstraction layer for backend flexibility
 *
 * MODES:
 * - LOCAL-FIRST (default): Reads from IndexedDB, writes queue for background sync
 * - API (when VITE_USE_API_LAYER=true): All operations go through REST API endpoints
 *
 * The API mode provides a clean abstraction that allows easy migration
 * to any backend provider (Supabase Edge Functions, Firebase, custom API, etc.)
 *
 * This service is the single source of truth for all data operations.
 * Components should use this service instead of directly accessing
 * database operations or API calls.
 */

import { store } from '@/store';

// LOCAL-FIRST: Import IndexedDB operations
import {
  clientsDB,
  staffDB,
  servicesDB,
  appointmentsDB,
  ticketsDB,
  transactionsDB,
  syncQueueDB,
  // PR #2: Import missing modules for unified data access
  patchTestsDB,
  formResponsesDB,
  referralsDB,
  clientReviewsDB,
  loyaltyRewardsDB,
  reviewRequestsDB,
  customSegmentsDB,
} from '@/db/database';

// API-FIRST: Import API client and endpoints
import { createAPIClient, endpoints } from '@mango/api-client';
import type { APIResponse } from '@mango/api-client';
import type {
  ListResponse,
  ItemResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from '@mango/api-contracts';

// Type imports for compatibility
import type {
  Client,
  Staff,
  Service,
  Appointment,
  Ticket,
  Transaction,
  // PR #2: Types for missing modules
  PatchTest,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward,
  ReviewRequest,
  ReviewRequestStatus,
  CustomSegment,
  SegmentFilterGroup,
} from '@/types';

// ==================== API MODE CONFIGURATION ====================

/**
 * Feature flag: Enable API-first mode
 * When true, all data operations go through REST API endpoints
 * When false (default), uses local-first IndexedDB with background sync
 */
const USE_API = import.meta.env.VITE_USE_API_LAYER === 'true';

/**
 * Build the API base URL for Supabase Edge Functions
 * Pattern: https://<project-ref>.supabase.co/functions/v1
 */
function getAPIBaseUrl(): string {
  // First check for explicit API base URL override
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Build from Supabase URL (default for Edge Functions)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/functions/v1`;
  }

  // Fallback for development
  console.warn('[DataService] No VITE_SUPABASE_URL configured, using fallback');
  return 'https://cpaldkcvdcdyzytosntc.supabase.co/functions/v1';
}

/**
 * API Client instance (lazy initialized)
 */
let _apiClient: ReturnType<typeof createAPIClient> | null = null;

function getAPIClient() {
  if (!_apiClient) {
    const baseUrl = getAPIBaseUrl();
    console.log('[DataService] API Client initialized with baseUrl:', baseUrl);

    _apiClient = createAPIClient({
      baseUrl,
      timeout: 15000,
      retries: 2,
      getAuthToken: () => {
        // Get token from Redux store or localStorage
        const state = store.getState();
        return state.auth.token || localStorage.getItem('auth_token');
      },
      onUnauthorized: () => {
        // Handle unauthorized - could dispatch logout action
        console.warn('[DataService] Unauthorized API request');
        store.dispatch({ type: 'auth/logout' });
      },
    });
  }
  return _apiClient;
}

/**
 * Extract data from API response, throw on error
 */
function extractData<T>(response: APIResponse<T>, fallback: T): T {
  if (response.success && response.data !== null) {
    return response.data;
  }
  if (response.error) {
    console.error('[DataService] API Error:', response.error);
  }
  return fallback;
}

// ==================== TYPES ====================

export type DataSourceType = 'local' | 'server';

export interface DataServiceConfig {
  /** Force a specific data source */
  forceSource?: DataSourceType;
  /** Skip cache and fetch fresh data */
  skipCache?: boolean;
  /** Custom timeout for server requests */
  timeout?: number;
}

export interface DataResult<T> {
  data: T | null;
  source: DataSourceType;
  error?: string;
  cached?: boolean;
}

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Check if browser is online
 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Determine which data source to use
 * LOCAL-FIRST: Always use local IndexedDB for reads, sync in background
 */
function getDataSource(config?: DataServiceConfig): DataSourceType {
  // Respect forced source (for special cases like initial hydration)
  if (config?.forceSource) {
    return config.forceSource;
  }

  // LOCAL-FIRST: Always prefer local for instant response
  return 'local';
}

// ==================== DATA SERVICE ====================

/**
 * Execute a data read operation (LOCAL-FIRST)
 *
 * Always reads from local IndexedDB first for instant response.
 * Background sync will keep data fresh.
 *
 * @param localFn - Function to execute for local database
 * @param serverFn - Function to execute for server API (used for forced server reads)
 * @param config - Optional configuration
 */
export async function executeDataOperation<T>(
  localFn: () => Promise<T>,
  serverFn: () => Promise<T>,
  config?: DataServiceConfig
): Promise<DataResult<T>> {
  const source = getDataSource(config);

  try {
    if (source === 'local') {
      const data = await localFn();
      return { data, source: 'local' };
    } else {
      // Forced server read (e.g., during hydration)
      const data = await serverFn();
      return { data, source: 'server' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, source, error: message };
  }
}

/**
 * Execute a write operation (LOCAL-FIRST)
 *
 * LOCAL-FIRST architecture:
 * - Always writes to local database immediately (instant response)
 * - Queues for background sync with server
 * - Never blocks on network
 */
export async function executeWriteOperation<T>(
  localFn: () => Promise<T>,
  _serverFn: () => Promise<T>,
  syncQueueFn?: () => Promise<void>,
  _config?: DataServiceConfig
): Promise<DataResult<T>> {
  // LOCAL-FIRST: Always write to local first for instant response
  try {
    const data = await localFn();

    // Queue for background sync (non-blocking)
    if (syncQueueFn) {
      // Don't await - queue sync in background
      syncQueueFn().catch(syncError => {
        console.warn('[DataService] Failed to queue sync:', syncError);
        // Don't fail the operation, sync will retry later
      });
    }

    return { data, source: 'local' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save locally';
    return { data: null, source: 'local', error: message };
  }
}

// ==================== CONVENIENCE WRAPPERS ====================

/**
 * Check if local database should be used for the current operation
 * Returns true in local-first mode, false in API mode
 */
export function shouldUseLocalDB(): boolean {
  return !USE_API;
}

/**
 * Check if server/API should be used for the current operation
 * Returns true in API mode, false in local-first mode
 */
export function shouldUseServer(): boolean {
  return USE_API;
}

/**
 * Check if sync operations should run
 * Returns true if we're online and can sync
 */
export function shouldSync(): boolean {
  return isOnline();
}

/**
 * Queue a sync operation for background processing
 * LOCAL-FIRST: Non-blocking, fire-and-forget
 */
function queueSyncOperation(
  entity: 'client' | 'staff' | 'service' | 'appointment' | 'ticket' | 'transaction',
  action: 'create' | 'update' | 'delete',
  entityId: string,
  payload: unknown
): void {
  // Don't await - queue async
  syncQueueDB.add({
    type: action,
    entity,
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[DataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

/**
 * Get current mode info for debugging/logging
 */
export function getModeInfo(): {
  mode: 'local-first' | 'api';
  online: boolean;
  dataSource: DataSourceType;
  apiEnabled: boolean;
  apiBaseUrl: string | undefined;
} {
  return {
    mode: USE_API ? 'api' : 'local-first',
    online: isOnline(),
    dataSource: getDataSource(),
    apiEnabled: USE_API,
    apiBaseUrl: USE_API ? getAPIBaseUrl() : undefined,
  };
}

/**
 * Check if API mode is enabled
 */
export function isAPIMode(): boolean {
  return USE_API;
}

// ==================== LOCAL-FIRST ENTITY SERVICES ====================
// All reads from IndexedDB (instant), writes queue to sync

/**
 * Clients data operations
 *
 * API MODE: REST API calls to Edge Functions
 * LOCAL-FIRST MODE: IndexedDB reads, writes queue for background sync
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

    // LOCAL-FIRST MODE: Read from IndexedDB
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

    // LOCAL-FIRST MODE: Read from IndexedDB
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

    // LOCAL-FIRST MODE: Search IndexedDB
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

    // LOCAL-FIRST MODE: Write to IndexedDB first (instant)
    const created = await clientsDB.create({ ...client, storeId: storeId });

    // Queue for background sync (non-blocking)
    queueSyncOperation('client', 'create', created.id, created);

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

    // LOCAL-FIRST MODE: Update IndexedDB first (instant)
    const updated = await clientsDB.update(id, updates);
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('client', 'update', id, updated);

    return updated;
  },

  async delete(id: string): Promise<void> {
    if (USE_API) {
      // API MODE: Delete via REST endpoint
      const api = getAPIClient();
      await api.delete<DeleteResponse>(endpoints.clients.delete(id));
      return;
    }

    // LOCAL-FIRST MODE: Delete from IndexedDB first (instant)
    await clientsDB.delete(id);

    // Queue for background sync (non-blocking)
    queueSyncOperation('client', 'delete', id, { id });
  },

  async getVipClients(): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_API) {
      // API MODE: Fetch VIP clients via REST endpoint
      const api = getAPIClient();
      const response = await api.get<{ data: Client[]; timestamp: string }>(
        endpoints.clients.vip(storeId)
      );
      return extractData(response, { data: [], timestamp: '' }).data;
    }

    // LOCAL-FIRST MODE: Query IndexedDB
    return clientsDB.getVips(storeId);
  },
};

/**
 * Staff data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const staffService = {
  async getAll(): Promise<Staff[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return staffDB.getAll(storeId);
  },

  async getById(id: string): Promise<Staff | null> {
    const staff = await staffDB.getById(id);
    return staff || null;
  },

  async getActive(): Promise<Staff[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return staffDB.getAvailable(storeId);
  },

  async create(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> {
    // Create in IndexedDB first (instant)
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');
    const created = await staffDB.create({ ...staffData, storeId: storeId });

    // Queue for background sync (non-blocking)
    queueSyncOperation('staff', 'create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    // Update IndexedDB first (instant)
    const updated = await staffDB.update(id, updates);
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('staff', 'update', id, updated);

    return updated;
  },

  async delete(id: string): Promise<void> {
    // Delete from IndexedDB first (instant)
    await staffDB.delete(id);

    // Queue for background sync (non-blocking)
    queueSyncOperation('staff', 'delete', id, null);
  },

  async clockIn(id: string): Promise<Staff | null> {
    const updated = await staffDB.clockIn(id);
    if (updated) {
      queueSyncOperation('staff', 'update', id, updated);
    }
    return updated || null;
  },

  async clockOut(id: string): Promise<Staff | null> {
    const updated = await staffDB.clockOut(id);
    if (updated) {
      queueSyncOperation('staff', 'update', id, updated);
    }
    return updated || null;
  },
};

/**
 * Services data operations - LOCAL-FIRST
 * Reads from IndexedDB (services are read-only in POS, managed via Admin)
 */
export const servicesService = {
  async getAll(): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return servicesDB.getAll(storeId);
  },

  async getById(id: string): Promise<Service | null> {
    const service = await servicesDB.getById(id);
    return service || null;
  },

  async getActive(): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const services = await servicesDB.getAll(storeId);
    return services.filter(s => s.isActive);
  },

  async getByCategory(category: string): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return servicesDB.getByCategory(storeId, category);
  },
};

/**
 * Appointments data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const appointmentsService = {
  async getByDate(date: Date): Promise<Appointment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return appointmentsDB.getByDate(storeId, date);
  },

  async getById(id: string): Promise<Appointment | null> {
    const appointment = await appointmentsDB.getById(id);
    return appointment || null;
  },

  async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Appointment> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    // Write to IndexedDB first (instant)
    const created = await appointmentsDB.create(
      appointment as Parameters<typeof appointmentsDB.create>[0],
      'system', // userId - will be replaced by actual user context
      storeId
    );

    // Queue for background sync (non-blocking)
    queueSyncOperation('appointment', 'create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    // Update IndexedDB first (instant)
    const updated = await appointmentsDB.update(id, updates, 'system');
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('appointment', 'update', id, updated);

    return updated;
  },

  async getUpcoming(limit = 50): Promise<Appointment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    // Get appointments from today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentsDB.getByDate(storeId, today, limit);
  },

  async updateStatus(id: string, status: string): Promise<Appointment | null> {
    return this.update(id, { status: status as Appointment['status'] });
  },

  async delete(id: string): Promise<void> {
    // Delete from IndexedDB first (instant)
    await appointmentsDB.delete(id);

    // Queue for background sync (non-blocking)
    queueSyncOperation('appointment', 'delete', id, { id });
  },

  async checkIn(id: string): Promise<Appointment | null> {
    const updated = await appointmentsDB.checkIn(id, 'system');
    if (updated) {
      queueSyncOperation('appointment', 'update', id, updated);
    }
    return updated || null;
  },
};

/**
 * Tickets data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const ticketsService = {
  async getByDate(date: Date): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    // Get all tickets and filter by date
    const allTickets = await ticketsDB.getAll(storeId, 500);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return allTickets.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= startOfDay && createdAt <= endOfDay;
    });
  },

  async getById(id: string): Promise<Ticket | null> {
    const ticket = await ticketsDB.getById(id);
    return ticket || null;
  },

  async getOpenTickets(): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return ticketsDB.getActive(storeId);
  },

  async getByStatus(status: string): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return ticketsDB.getByStatus(storeId, status);
  },

  async getByClientId(clientId: string): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const allTickets = await ticketsDB.getAll(storeId, 500);
    return allTickets.filter(t => t.clientId === clientId);
  },

  async getByAppointmentId(appointmentId: string): Promise<Ticket | null> {
    const storeId = getStoreId();
    if (!storeId) return null;
    const allTickets = await ticketsDB.getAll(storeId, 500);
    return allTickets.find(t => t.appointmentId === appointmentId) || null;
  },

  async create(input: Parameters<typeof ticketsDB.create>[0]): Promise<Ticket> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    // Write to IndexedDB first (instant)
    const created = await ticketsDB.create(input, 'system', storeId);

    // Queue for background sync (non-blocking)
    queueSyncOperation('ticket', 'create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    // Update IndexedDB first (instant)
    const updated = await ticketsDB.update(id, updates, 'system');
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('ticket', 'update', id, updated);

    return updated;
  },

  async updateStatus(id: string, status: string): Promise<Ticket | null> {
    return this.update(id, { status: status as Ticket['status'] });
  },

  async complete(id: string, _payments: unknown[]): Promise<Ticket | null> {
    // Complete ticket in IndexedDB
    const completed = await ticketsDB.complete(id, 'system');
    if (completed) {
      queueSyncOperation('ticket', 'update', id, completed);
    }
    return completed || null;
  },

  async delete(id: string): Promise<void> {
    // Delete from IndexedDB first (instant)
    await ticketsDB.delete(id);

    // Queue for background sync (non-blocking)
    queueSyncOperation('ticket', 'delete', id, { id });
  },

  async getDailySummary(date: Date) {
    const tickets = await this.getByDate(date);
    const completedTickets = tickets.filter(t => t.status === 'paid');
    return {
      totalTickets: tickets.length,
      completedTickets: completedTickets.length,
      totalRevenue: completedTickets.reduce((sum, t) => sum + t.total, 0),
      totalTips: completedTickets.reduce((sum, t) => sum + (t.tip || 0), 0),
    };
  },

  async getUpdatedSince(since: Date): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const allTickets = await ticketsDB.getAll(storeId, 1000);
    return allTickets.filter(t => {
      // Check if ticket was updated since the given date
      // This is a simplified version - in production you'd have an updatedAt field
      const createdAt = new Date(t.createdAt);
      return createdAt >= since;
    });
  },

  async getDrafts(): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return ticketsDB.getDrafts(storeId);
  },

  async createDraft(services: Ticket['services'], clientInfo?: { clientId: string; clientName: string; clientPhone: string }): Promise<Ticket> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsDB.createDraft(services, 'system', storeId, clientInfo);
  },
};

/**
 * Transactions data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const transactionsService = {
  async getByDate(date: Date): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return transactionsDB.getByDateRange(storeId, startOfDay, endOfDay);
  },

  async getById(id: string): Promise<Transaction | null> {
    const transaction = await transactionsDB.getById(id);
    return transaction || null;
  },

  async getByTicketId(ticketId: string): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const allTransactions = await transactionsDB.getAll(storeId, 1000);
    return allTransactions.filter(t => t.ticketId === ticketId);
  },

  async getByClientId(clientId: string): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const allTransactions = await transactionsDB.getAll(storeId, 1000);
    return allTransactions.filter(t => t.clientId === clientId);
  },

  async getByPaymentMethod(paymentMethod: string, date?: Date): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    let transactions: Transaction[];
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      transactions = await transactionsDB.getByDateRange(storeId, startOfDay, endOfDay);
    } else {
      transactions = await transactionsDB.getAll(storeId, 1000);
    }
    return transactions.filter(t => t.paymentMethod === paymentMethod);
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'>): Promise<Transaction> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    // Write to IndexedDB first (instant)
    const created = await transactionsDB.create({ ...transaction, storeId: storeId });

    // Queue for background sync (non-blocking)
    queueSyncOperation('transaction', 'create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    // Update IndexedDB first (instant)
    const updated = await transactionsDB.update(id, updates);
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('transaction', 'update', id, updated);

    return updated;
  },

  async delete(id: string): Promise<void> {
    // Delete from IndexedDB first (instant)
    await transactionsDB.delete(id);

    // Queue for background sync (non-blocking)
    queueSyncOperation('transaction', 'delete', id, { id });
  },

  async getDailySummary(date: Date) {
    const transactions = await this.getByDate(date);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const byPaymentMethod = transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTransactions: transactions.length,
      totalAmount,
      byPaymentMethod,
    };
  },

  async getPaymentBreakdown(date: Date) {
    const transactions = await this.getByDate(date);
    return transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  },

  async getUpdatedSince(since: Date): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const sinceIso = since.toISOString();
    const allTransactions = await transactionsDB.getAll(storeId, 1000);
    return allTransactions.filter(t => t.createdAt >= sinceIso);
  },
};

// ==================== PR #2: EXTENDED ENTITY SERVICES ====================
// These services wrap the 7 IndexedDB modules that were previously accessed directly

/**
 * Patch Tests data operations - LOCAL-FIRST
 * Tracks patch test results for services (e.g., hair color allergy tests)
 */
export const patchTestsService = {
  async getByClientId(clientId: string): Promise<PatchTest[]> {
    return patchTestsDB.getByClientId(clientId);
  },

  async getById(id: string): Promise<PatchTest | null> {
    const patchTest = await patchTestsDB.getById(id);
    return patchTest || null;
  },

  async getValidForService(clientId: string, serviceId: string): Promise<PatchTest | null> {
    const patchTest = await patchTestsDB.getValidForService(clientId, serviceId);
    return patchTest || null;
  },

  async getExpiring(clientId: string, daysAhead: number = 7): Promise<PatchTest[]> {
    return patchTestsDB.getExpiring(clientId, daysAhead);
  },

  async create(patchTest: Omit<PatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<PatchTest> {
    const created = await patchTestsDB.create(patchTest);
    // Queue for background sync
    queueSyncOperation('client', 'create', created.id, { entityType: 'patchTest', ...created });
    return created;
  },

  async update(id: string, updates: Partial<PatchTest>): Promise<PatchTest | null> {
    const updated = await patchTestsDB.update(id, updates);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'patchTest', ...updated });
    }
    return updated || null;
  },

  async delete(id: string): Promise<void> {
    await patchTestsDB.delete(id);
    queueSyncOperation('client', 'delete', id, { entityType: 'patchTest', id });
  },
};

/**
 * Form Responses data operations - LOCAL-FIRST
 * Client-filled forms (intake forms, consent forms, etc.)
 */
export const formResponsesService = {
  async getByClientId(clientId: string, limit: number = 50): Promise<ClientFormResponse[]> {
    return formResponsesDB.getByClientId(clientId, limit);
  },

  async getById(id: string): Promise<ClientFormResponse | null> {
    const response = await formResponsesDB.getById(id);
    return response || null;
  },

  async getPending(clientId: string): Promise<ClientFormResponse[]> {
    return formResponsesDB.getPending(clientId);
  },

  async getByAppointmentId(appointmentId: string): Promise<ClientFormResponse[]> {
    return formResponsesDB.getByAppointmentId(appointmentId);
  },

  async create(response: Omit<ClientFormResponse, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ClientFormResponse> {
    const created = await formResponsesDB.create(response);
    queueSyncOperation('client', 'create', created.id, { entityType: 'formResponse', ...created });
    return created;
  },

  async update(id: string, updates: Partial<ClientFormResponse>): Promise<ClientFormResponse | null> {
    const updated = await formResponsesDB.update(id, updates);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'formResponse', ...updated });
    }
    return updated || null;
  },

  async complete(id: string, responses: Record<string, unknown>, completedBy: string, signatureImage?: string): Promise<ClientFormResponse | null> {
    const completed = await formResponsesDB.complete(id, responses, completedBy, signatureImage);
    if (completed) {
      queueSyncOperation('client', 'update', id, { entityType: 'formResponse', ...completed });
    }
    return completed || null;
  },
};

/**
 * Referrals data operations - LOCAL-FIRST
 * Tracks client referrals and rewards
 */
export const referralsService = {
  async getByReferrerId(clientId: string): Promise<Referral[]> {
    return referralsDB.getByReferrerId(clientId);
  },

  async getByReferredId(clientId: string): Promise<Referral | null> {
    const referral = await referralsDB.getByReferredId(clientId);
    return referral || null;
  },

  async getById(id: string): Promise<Referral | null> {
    const referral = await referralsDB.getById(id);
    return referral || null;
  },

  async getByCode(code: string): Promise<Referral | null> {
    const referral = await referralsDB.getByCode(code);
    return referral || null;
  },

  async create(referral: Omit<Referral, 'id' | 'createdAt' | 'syncStatus'>): Promise<Referral> {
    const created = await referralsDB.create(referral);
    queueSyncOperation('client', 'create', created.id, { entityType: 'referral', ...created });
    return created;
  },

  async update(id: string, updates: Partial<Referral>): Promise<Referral | null> {
    const updated = await referralsDB.update(id, updates);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'referral', ...updated });
    }
    return updated || null;
  },

  async completeReferral(id: string, appointmentId: string): Promise<Referral | null> {
    const completed = await referralsDB.completeReferral(id, appointmentId);
    if (completed) {
      queueSyncOperation('client', 'update', id, { entityType: 'referral', ...completed });
    }
    return completed || null;
  },
};

/**
 * Client Reviews data operations - LOCAL-FIRST
 * Reviews left by clients for staff/services
 */
export const reviewsService = {
  async getByClientId(clientId: string, limit: number = 50): Promise<ClientReview[]> {
    return clientReviewsDB.getByClientId(clientId, limit);
  },

  async getById(id: string): Promise<ClientReview | null> {
    const review = await clientReviewsDB.getById(id);
    return review || null;
  },

  async getByStaffId(staffId: string, limit: number = 100): Promise<ClientReview[]> {
    return clientReviewsDB.getByStaffId(staffId, limit);
  },

  async create(review: Omit<ClientReview, 'id' | 'createdAt' | 'syncStatus'>): Promise<ClientReview> {
    const created = await clientReviewsDB.create(review);
    queueSyncOperation('client', 'create', created.id, { entityType: 'review', ...created });
    return created;
  },

  async addResponse(id: string, response: string): Promise<ClientReview | null> {
    const updated = await clientReviewsDB.addResponse(id, response);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'review', ...updated });
    }
    return updated || null;
  },

  async update(id: string, updates: Partial<ClientReview>): Promise<ClientReview | null> {
    const updated = await clientReviewsDB.update(id, updates);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'review', ...updated });
    }
    return updated || null;
  },
};

/**
 * Loyalty Rewards data operations - LOCAL-FIRST
 * Tracks earned and redeemed loyalty rewards
 */
export const loyaltyService = {
  async getByClientId(clientId: string, includeRedeemed: boolean = false): Promise<LoyaltyReward[]> {
    return loyaltyRewardsDB.getByClientId(clientId, includeRedeemed);
  },

  async getById(id: string): Promise<LoyaltyReward | null> {
    const reward = await loyaltyRewardsDB.getById(id);
    return reward || null;
  },

  async getAvailable(clientId: string): Promise<LoyaltyReward[]> {
    return loyaltyRewardsDB.getAvailable(clientId);
  },

  async create(reward: Omit<LoyaltyReward, 'id' | 'createdAt' | 'syncStatus'>): Promise<LoyaltyReward> {
    const created = await loyaltyRewardsDB.create(reward);
    queueSyncOperation('client', 'create', created.id, { entityType: 'loyaltyReward', ...created });
    return created;
  },

  async redeem(id: string): Promise<LoyaltyReward | null> {
    const redeemed = await loyaltyRewardsDB.redeem(id);
    if (redeemed) {
      queueSyncOperation('client', 'update', id, { entityType: 'loyaltyReward', ...redeemed });
    }
    return redeemed || null;
  },
};

/**
 * Review Requests data operations - LOCAL-FIRST
 * Tracks requests sent to clients asking for reviews
 */
export const reviewRequestsService = {
  async getById(id: string): Promise<ReviewRequest | null> {
    const request = await reviewRequestsDB.getById(id);
    return request || null;
  },

  async getByClientId(clientId: string, limit: number = 50): Promise<ReviewRequest[]> {
    return reviewRequestsDB.getByClientId(clientId, limit);
  },

  async getBySalonId(limit: number = 100): Promise<ReviewRequest[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return reviewRequestsDB.getBySalonId(storeId, limit);
  },

  async getByStatus(status: ReviewRequestStatus, limit: number = 100): Promise<ReviewRequest[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return reviewRequestsDB.getByStatus(storeId, status, limit);
  },

  async getPendingByClient(clientId: string): Promise<ReviewRequest[]> {
    return reviewRequestsDB.getPendingByClient(clientId);
  },

  async create(request: Omit<ReviewRequest, 'id' | 'createdAt' | 'syncStatus'>): Promise<ReviewRequest> {
    const created = await reviewRequestsDB.create(request);
    queueSyncOperation('client', 'create', created.id, { entityType: 'reviewRequest', ...created });
    return created;
  },

  async update(id: string, updates: Partial<ReviewRequest>): Promise<ReviewRequest | null> {
    const updated = await reviewRequestsDB.update(id, updates);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markSent(id: string, sentVia: 'email' | 'sms' | 'both'): Promise<ReviewRequest | null> {
    const updated = await reviewRequestsDB.markSent(id, sentVia);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markOpened(id: string): Promise<ReviewRequest | null> {
    const updated = await reviewRequestsDB.markOpened(id);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markCompleted(id: string, reviewId: string): Promise<ReviewRequest | null> {
    const updated = await reviewRequestsDB.markCompleted(id, reviewId);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markExpired(id: string): Promise<ReviewRequest | null> {
    const updated = await reviewRequestsDB.markExpired(id);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async delete(id: string): Promise<void> {
    await reviewRequestsDB.delete(id);
    queueSyncOperation('client', 'delete', id, { entityType: 'reviewRequest', id });
  },
};

/**
 * Custom Segments data operations - LOCAL-FIRST
 * User-defined client groupings based on filters
 */
export const segmentsService = {
  async getById(id: string): Promise<CustomSegment | null> {
    const segment = await customSegmentsDB.getById(id);
    return segment || null;
  },

  async getAll(activeOnly: boolean = true): Promise<CustomSegment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return customSegmentsDB.getBySalonId(storeId, activeOnly);
  },

  async getActive(): Promise<CustomSegment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return customSegmentsDB.getActive(storeId);
  },

  async getByName(name: string): Promise<CustomSegment | null> {
    const storeId = getStoreId();
    if (!storeId) return null;
    const segment = await customSegmentsDB.getByName(storeId, name);
    return segment || null;
  },

  async create(segment: Omit<CustomSegment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<CustomSegment> {
    const created = await customSegmentsDB.create(segment);
    queueSyncOperation('client', 'create', created.id, { entityType: 'segment', ...created });
    return created;
  },

  async update(id: string, updates: Partial<CustomSegment>): Promise<CustomSegment | null> {
    const updated = await customSegmentsDB.update(id, updates);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async updateFilters(id: string, filters: SegmentFilterGroup): Promise<CustomSegment | null> {
    const updated = await customSegmentsDB.updateFilters(id, filters);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async activate(id: string): Promise<CustomSegment | null> {
    const updated = await customSegmentsDB.activate(id);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async deactivate(id: string): Promise<CustomSegment | null> {
    const updated = await customSegmentsDB.deactivate(id);
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async delete(id: string): Promise<void> {
    await customSegmentsDB.delete(id);
    queueSyncOperation('client', 'delete', id, { entityType: 'segment', id });
  },

  async duplicate(id: string, newName: string, createdBy: string): Promise<CustomSegment | null> {
    const duplicated = await customSegmentsDB.duplicate(id, newName, createdBy);
    if (duplicated) {
      queueSyncOperation('client', 'create', duplicated.id, { entityType: 'segment', ...duplicated });
    }
    return duplicated || null;
  },
};

// ==================== EXPORTS ====================

export const dataService = {
  // Execution helpers
  execute: executeDataOperation,
  write: executeWriteOperation,

  // Mode helpers
  shouldUseLocalDB,
  shouldUseServer,
  shouldSync,
  getModeInfo,
  getDataSource,
  getStoreId,
  isAPIMode,

  // API Mode: Get configured API client (for advanced usage)
  getAPIClient: USE_API ? getAPIClient : () => null,

  // Entity-specific services
  clients: clientsService,
  staff: staffService,
  services: servicesService,
  appointments: appointmentsService,
  tickets: ticketsService,
  transactions: transactionsService,

  // PR #2: Extended entity services (previously accessed directly via IndexedDB)
  patchTests: patchTestsService,
  formResponses: formResponsesService,
  referrals: referralsService,
  reviews: reviewsService,
  loyalty: loyaltyService,
  reviewRequests: reviewRequestsService,
  segments: segmentsService,
};

export default dataService;
