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

// Feature flags for backend selection
import { shouldUseSQLite, getBackendType, logBackendSelection } from '@/config/featureFlags';

// LOCAL-FIRST: Import IndexedDB operations
import {
  clientsDB,
  staffDB,
  servicesDB,
  appointmentsDB,
  ticketsDB,
  transactionsDB,
  syncQueueDB,
  settingsDB,
  // PR #2: Import missing modules for unified data access
  patchTestsDB,
  formResponsesDB,
  referralsDB,
  clientReviewsDB,
  loyaltyRewardsDB,
  reviewRequestsDB,
  customSegmentsDB,
  giftCardsDB,
} from '@/db/database';

// Catalog operations
import {
  serviceCategoriesDB,
  menuServicesDB,
  serviceVariantsDB,
  servicePackagesDB,
  addOnGroupsDB,
  addOnOptionsDB,
  staffServiceAssignmentsDB,
  catalogSettingsDB,
  productsDB,
} from '@/db/catalogDatabase';

// Scheduling operations
import {
  timeOffTypesDB,
  timeOffRequestsDB,
  blockedTimeTypesDB,
  blockedTimeEntriesDB,
  businessClosedPeriodsDB,
  resourcesDB,
  resourceBookingsDB,
  staffSchedulesDB,
} from '@/db/scheduleDatabase';

// SQLite: Import SQLite service wrappers (lazy initialized)
import {
  sqliteClientsDB,
  sqliteTicketsDB,
  sqliteAppointmentsDB,
  sqliteTransactionsDB,
  sqliteStaffDB,
  sqliteServicesDB,
  sqliteSettingsDB,
  sqliteSyncQueueDB,
  // Team and CRM services
  sqliteTeamMemberDB,
  sqlitePatchTestsDB,
  sqliteFormResponsesDB,
  sqliteReferralsDB,
  sqliteClientReviewsDB,
  sqliteLoyaltyRewardsDB,
  sqliteReviewRequestsDB,
  sqliteCustomSegmentsDB,
  // Catalog services
  sqliteServiceCategoriesDB,
  sqliteMenuServicesDB,
  sqliteServiceVariantsDB,
  sqliteServicePackagesDB,
  sqliteAddOnGroupsDB,
  sqliteAddOnOptionsDB,
  sqliteStaffServiceAssignmentsDB,
  sqliteCatalogSettingsDB,
  sqliteProductsDB,
  // Scheduling services
  sqliteTimeOffTypesDB,
  sqliteTimeOffRequestsDB,
  sqliteBlockedTimeTypesDB,
  sqliteBlockedTimeEntriesDB,
  sqliteBusinessClosedPeriodsDB,
  sqliteResourcesDB,
  sqliteResourceBookingsDB,
  sqliteStaffSchedulesDB,
  // Gift card services
  sqliteGiftCardDenominationsDB,
  sqliteGiftCardSettingsDB,
  sqliteGiftCardsDB,
  sqliteGiftCardTransactionsDB,
  sqliteGiftCardDesignsDB,
} from '@/services/sqliteServices';

// Domain services (extracted for modularity)
import { appointmentsService, clientsService, ticketsService, staffService } from '@/services/domain';

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
 * API Client instance (lazy initialized)
 */
let _apiClient: ReturnType<typeof createAPIClient> | null = null;

function getAPIClient() {
  if (!_apiClient) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
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
  backend: 'dexie' | 'sqlite';
  sqliteEnabled: boolean;
} {
  return {
    mode: USE_API ? 'api' : 'local-first',
    online: isOnline(),
    dataSource: getDataSource(),
    apiEnabled: USE_API,
    apiBaseUrl: USE_API ? (import.meta.env.VITE_API_BASE_URL || '/api') : undefined,
    backend: getBackendType(),
    sqliteEnabled: shouldUseSQLite(),
  };
}

/**
 * Check if API mode is enabled
 */
export function isAPIMode(): boolean {
  return USE_API;
}

// ==================== BACKEND SELECTION LOGGING ====================
// Log backend selection on module load (once)
logBackendSelection();

// ==================== LOCAL-FIRST ENTITY SERVICES ====================
// All reads from IndexedDB (instant), writes queue to sync
// Note: When VITE_USE_SQLITE=true and running in Electron, SQLite services
// will be used instead of Dexie. This routing is implemented in US-015/US-016.
// Current placeholder: always uses Dexie for backwards compatibility.
const USE_SQLITE = shouldUseSQLite();

// Note: clientsService is imported from '@/services/domain' (extracted for modularity)
// Note: staffService is imported from '@/services/domain' (extracted for modularity)

/**
 * Services data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite (services are read-only in POS, managed via Admin)
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteServicesDB
 */
export const servicesService = {
  async getAll(): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteServicesDB.getAll(storeId);
    }
    return servicesDB.getAll(storeId);
  },

  async getById(id: string): Promise<Service | null> {
    if (USE_SQLITE) {
      const service = await sqliteServicesDB.getById(id);
      return service || null;
    }
    const service = await servicesDB.getById(id);
    return service || null;
  },

  async getActive(): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      const services = await sqliteServicesDB.getAll(storeId);
      return services.filter(s => s.isActive);
    }
    const services = await servicesDB.getAll(storeId);
    return services.filter(s => s.isActive);
  },

  async getByCategory(category: string): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteServicesDB.getByCategory(storeId, category);
    }
    return servicesDB.getByCategory(storeId, category);
  },
};

// Note: appointmentsService is imported from '@/services/domain' (extracted for modularity)
// Note: ticketsService is imported from '@/services/domain' (extracted for modularity)

/**
 * Transactions data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite, writes queue for background sync
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteTransactionsDB
 */
export const transactionsService = {
  async getByDate(date: Date): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (USE_SQLITE) {
      return sqliteTransactionsDB.getByDateRange(storeId, startOfDay, endOfDay);
    }
    return transactionsDB.getByDateRange(storeId, startOfDay, endOfDay);
  },

  async getById(id: string): Promise<Transaction | null> {
    if (USE_SQLITE) {
      const transaction = await sqliteTransactionsDB.getById(id);
      return transaction || null;
    }
    const transaction = await transactionsDB.getById(id);
    return transaction || null;
  },

  async getByTicketId(ticketId: string): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      const allTransactions = await sqliteTransactionsDB.getAll(storeId, 1000);
      return allTransactions.filter(t => t.ticketId === ticketId);
    }
    const allTransactions = await transactionsDB.getAll(storeId, 1000);
    return allTransactions.filter(t => t.ticketId === ticketId);
  },

  async getByClientId(clientId: string): Promise<Transaction[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      const allTransactions = await sqliteTransactionsDB.getAll(storeId, 1000);
      return allTransactions.filter(t => t.clientId === clientId);
    }
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
      if (USE_SQLITE) {
        transactions = await sqliteTransactionsDB.getByDateRange(storeId, startOfDay, endOfDay);
      } else {
        transactions = await transactionsDB.getByDateRange(storeId, startOfDay, endOfDay);
      }
    } else {
      if (USE_SQLITE) {
        transactions = await sqliteTransactionsDB.getAll(storeId, 1000);
      } else {
        transactions = await transactionsDB.getAll(storeId, 1000);
      }
    }
    return transactions.filter(t => t.paymentMethod === paymentMethod);
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'>): Promise<Transaction> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    let created: Transaction;
    if (USE_SQLITE) {
      created = await sqliteTransactionsDB.create({ ...transaction, storeId });
    } else {
      created = await transactionsDB.create({ ...transaction, storeId });
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('transaction', 'create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    let updated: Transaction | null;
    if (USE_SQLITE) {
      updated = await sqliteTransactionsDB.update(id, updates);
    } else {
      const result = await transactionsDB.update(id, updates);
      updated = result ?? null;
    }
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('transaction', 'update', id, updated);

    return updated;
  },

  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteTransactionsDB.delete(id);
    } else {
      await transactionsDB.delete(id);
    }

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

    if (USE_SQLITE) {
      const allTransactions = await sqliteTransactionsDB.getAll(storeId, 1000);
      return allTransactions.filter(t => t.createdAt >= sinceIso);
    }
    const allTransactions = await transactionsDB.getAll(storeId, 1000);
    return allTransactions.filter(t => t.createdAt >= sinceIso);
  },
};

// ==================== PR #2: EXTENDED ENTITY SERVICES ====================
// These services wrap the 7 IndexedDB modules that were previously accessed directly

/**
 * Patch Tests data operations - LOCAL-FIRST
 * Tracks patch test results for services (e.g., hair color allergy tests)
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqlitePatchTestsDB
 */
export const patchTestsService = {
  async getByClientId(clientId: string): Promise<PatchTest[]> {
    if (USE_SQLITE) {
      return sqlitePatchTestsDB.getByClientId(clientId);
    }
    return patchTestsDB.getByClientId(clientId);
  },

  async getById(id: string): Promise<PatchTest | null> {
    if (USE_SQLITE) {
      const patchTest = await sqlitePatchTestsDB.getById(id);
      return patchTest || null;
    }
    const patchTest = await patchTestsDB.getById(id);
    return patchTest || null;
  },

  async getValidForService(clientId: string, serviceId: string): Promise<PatchTest | null> {
    if (USE_SQLITE) {
      const patchTest = await sqlitePatchTestsDB.getValidForService(clientId, serviceId);
      return patchTest || null;
    }
    const patchTest = await patchTestsDB.getValidForService(clientId, serviceId);
    return patchTest || null;
  },

  async getExpiring(clientId: string, daysAhead: number = 7): Promise<PatchTest[]> {
    if (USE_SQLITE) {
      return sqlitePatchTestsDB.getExpiring(clientId, daysAhead);
    }
    return patchTestsDB.getExpiring(clientId, daysAhead);
  },

  async create(patchTest: Omit<PatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<PatchTest> {
    let created: PatchTest;
    if (USE_SQLITE) {
      created = await sqlitePatchTestsDB.create(patchTest);
    } else {
      created = await patchTestsDB.create(patchTest);
    }
    // Queue for background sync
    queueSyncOperation('client', 'create', created.id, { entityType: 'patchTest', ...created });
    return created;
  },

  async update(id: string, updates: Partial<PatchTest>): Promise<PatchTest | null> {
    let updated: PatchTest | null | undefined;
    if (USE_SQLITE) {
      updated = await sqlitePatchTestsDB.update(id, updates);
    } else {
      updated = await patchTestsDB.update(id, updates);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'patchTest', ...updated });
    }
    return updated || null;
  },

  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqlitePatchTestsDB.delete(id);
    } else {
      await patchTestsDB.delete(id);
    }
    queueSyncOperation('client', 'delete', id, { entityType: 'patchTest', id });
  },
};

/**
 * Form Responses data operations - LOCAL-FIRST
 * Client-filled forms (intake forms, consent forms, etc.)
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteFormResponsesDB
 */
export const formResponsesService = {
  async getByClientId(clientId: string, limit: number = 50): Promise<ClientFormResponse[]> {
    if (USE_SQLITE) {
      return sqliteFormResponsesDB.getByClientId(clientId, limit);
    }
    return formResponsesDB.getByClientId(clientId, limit);
  },

  async getById(id: string): Promise<ClientFormResponse | null> {
    if (USE_SQLITE) {
      const response = await sqliteFormResponsesDB.getById(id);
      return response || null;
    }
    const response = await formResponsesDB.getById(id);
    return response || null;
  },

  async getPending(clientId: string): Promise<ClientFormResponse[]> {
    if (USE_SQLITE) {
      return sqliteFormResponsesDB.getPending(clientId);
    }
    return formResponsesDB.getPending(clientId);
  },

  async getByAppointmentId(appointmentId: string): Promise<ClientFormResponse[]> {
    if (USE_SQLITE) {
      return sqliteFormResponsesDB.getByAppointmentId(appointmentId);
    }
    return formResponsesDB.getByAppointmentId(appointmentId);
  },

  async create(response: Omit<ClientFormResponse, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ClientFormResponse> {
    let created: ClientFormResponse;
    if (USE_SQLITE) {
      created = await sqliteFormResponsesDB.create(response);
    } else {
      created = await formResponsesDB.create(response);
    }
    queueSyncOperation('client', 'create', created.id, { entityType: 'formResponse', ...created });
    return created;
  },

  async update(id: string, updates: Partial<ClientFormResponse>): Promise<ClientFormResponse | null> {
    let updated: ClientFormResponse | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteFormResponsesDB.update(id, updates);
    } else {
      updated = await formResponsesDB.update(id, updates);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'formResponse', ...updated });
    }
    return updated || null;
  },

  async complete(id: string, responses: Record<string, unknown>, completedBy: string, signatureImage?: string): Promise<ClientFormResponse | null> {
    let completed: ClientFormResponse | null | undefined;
    if (USE_SQLITE) {
      completed = await sqliteFormResponsesDB.complete(id, responses, completedBy, signatureImage);
    } else {
      completed = await formResponsesDB.complete(id, responses, completedBy, signatureImage);
    }
    if (completed) {
      queueSyncOperation('client', 'update', id, { entityType: 'formResponse', ...completed });
    }
    return completed || null;
  },
};

/**
 * Referrals data operations - LOCAL-FIRST
 * Tracks client referrals and rewards
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteReferralsDB
 */
export const referralsService = {
  async getByReferrerId(clientId: string): Promise<Referral[]> {
    if (USE_SQLITE) {
      return sqliteReferralsDB.getByReferrerId(clientId);
    }
    return referralsDB.getByReferrerId(clientId);
  },

  async getByReferredId(clientId: string): Promise<Referral | null> {
    if (USE_SQLITE) {
      const referral = await sqliteReferralsDB.getByReferredId(clientId);
      return referral || null;
    }
    const referral = await referralsDB.getByReferredId(clientId);
    return referral || null;
  },

  async getById(id: string): Promise<Referral | null> {
    if (USE_SQLITE) {
      const referral = await sqliteReferralsDB.getById(id);
      return referral || null;
    }
    const referral = await referralsDB.getById(id);
    return referral || null;
  },

  async getByCode(code: string): Promise<Referral | null> {
    if (USE_SQLITE) {
      const referral = await sqliteReferralsDB.getByCode(code);
      return referral || null;
    }
    const referral = await referralsDB.getByCode(code);
    return referral || null;
  },

  async create(referral: Omit<Referral, 'id' | 'createdAt' | 'syncStatus'>): Promise<Referral> {
    let created: Referral;
    if (USE_SQLITE) {
      created = await sqliteReferralsDB.create(referral);
    } else {
      created = await referralsDB.create(referral);
    }
    queueSyncOperation('client', 'create', created.id, { entityType: 'referral', ...created });
    return created;
  },

  async update(id: string, updates: Partial<Referral>): Promise<Referral | null> {
    let updated: Referral | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteReferralsDB.update(id, updates);
    } else {
      updated = await referralsDB.update(id, updates);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'referral', ...updated });
    }
    return updated || null;
  },

  async completeReferral(id: string, appointmentId: string): Promise<Referral | null> {
    let completed: Referral | null | undefined;
    if (USE_SQLITE) {
      completed = await sqliteReferralsDB.completeReferral(id, appointmentId);
    } else {
      completed = await referralsDB.completeReferral(id, appointmentId);
    }
    if (completed) {
      queueSyncOperation('client', 'update', id, { entityType: 'referral', ...completed });
    }
    return completed || null;
  },
};

/**
 * Client Reviews data operations - LOCAL-FIRST
 * Reviews left by clients for staff/services
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteClientReviewsDB
 */
export const reviewsService = {
  async getByClientId(clientId: string, limit: number = 50): Promise<ClientReview[]> {
    if (USE_SQLITE) {
      return sqliteClientReviewsDB.getByClientId(clientId, limit);
    }
    return clientReviewsDB.getByClientId(clientId, limit);
  },

  async getById(id: string): Promise<ClientReview | null> {
    if (USE_SQLITE) {
      const review = await sqliteClientReviewsDB.getById(id);
      return review || null;
    }
    const review = await clientReviewsDB.getById(id);
    return review || null;
  },

  async getByStaffId(staffId: string, limit: number = 100): Promise<ClientReview[]> {
    if (USE_SQLITE) {
      return sqliteClientReviewsDB.getByStaffId(staffId, limit);
    }
    return clientReviewsDB.getByStaffId(staffId, limit);
  },

  async create(review: Omit<ClientReview, 'id' | 'createdAt' | 'syncStatus'>): Promise<ClientReview> {
    let created: ClientReview;
    if (USE_SQLITE) {
      created = await sqliteClientReviewsDB.create(review);
    } else {
      created = await clientReviewsDB.create(review);
    }
    queueSyncOperation('client', 'create', created.id, { entityType: 'review', ...created });
    return created;
  },

  async addResponse(id: string, response: string): Promise<ClientReview | null> {
    let updated: ClientReview | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteClientReviewsDB.addResponse(id, response);
    } else {
      updated = await clientReviewsDB.addResponse(id, response);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'review', ...updated });
    }
    return updated || null;
  },

  async update(id: string, updates: Partial<ClientReview>): Promise<ClientReview | null> {
    let updated: ClientReview | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteClientReviewsDB.update(id, updates);
    } else {
      updated = await clientReviewsDB.update(id, updates);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'review', ...updated });
    }
    return updated || null;
  },
};

/**
 * Loyalty Rewards data operations - LOCAL-FIRST
 * Tracks earned and redeemed loyalty rewards
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteLoyaltyRewardsDB
 */
export const loyaltyService = {
  async getByClientId(clientId: string, includeRedeemed: boolean = false): Promise<LoyaltyReward[]> {
    if (USE_SQLITE) {
      return sqliteLoyaltyRewardsDB.getByClientId(clientId, includeRedeemed);
    }
    return loyaltyRewardsDB.getByClientId(clientId, includeRedeemed);
  },

  async getById(id: string): Promise<LoyaltyReward | null> {
    if (USE_SQLITE) {
      const reward = await sqliteLoyaltyRewardsDB.getById(id);
      return reward || null;
    }
    const reward = await loyaltyRewardsDB.getById(id);
    return reward || null;
  },

  async getAvailable(clientId: string): Promise<LoyaltyReward[]> {
    if (USE_SQLITE) {
      return sqliteLoyaltyRewardsDB.getAvailable(clientId);
    }
    return loyaltyRewardsDB.getAvailable(clientId);
  },

  async create(reward: Omit<LoyaltyReward, 'id' | 'createdAt' | 'syncStatus'>): Promise<LoyaltyReward> {
    let created: LoyaltyReward;
    if (USE_SQLITE) {
      created = await sqliteLoyaltyRewardsDB.create(reward);
    } else {
      created = await loyaltyRewardsDB.create(reward);
    }
    queueSyncOperation('client', 'create', created.id, { entityType: 'loyaltyReward', ...created });
    return created;
  },

  async redeem(id: string): Promise<LoyaltyReward | null> {
    let redeemed: LoyaltyReward | null | undefined;
    if (USE_SQLITE) {
      redeemed = await sqliteLoyaltyRewardsDB.redeem(id);
    } else {
      redeemed = await loyaltyRewardsDB.redeem(id);
    }
    if (redeemed) {
      queueSyncOperation('client', 'update', id, { entityType: 'loyaltyReward', ...redeemed });
    }
    return redeemed || null;
  },
};

/**
 * Review Requests data operations - LOCAL-FIRST
 * Tracks requests sent to clients asking for reviews
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteReviewRequestsDB
 */
export const reviewRequestsService = {
  async getById(id: string): Promise<ReviewRequest | null> {
    if (USE_SQLITE) {
      const request = await sqliteReviewRequestsDB.getById(id);
      return request || null;
    }
    const request = await reviewRequestsDB.getById(id);
    return request || null;
  },

  async getByClientId(clientId: string, limit: number = 50): Promise<ReviewRequest[]> {
    if (USE_SQLITE) {
      return sqliteReviewRequestsDB.getByClientId(clientId, limit);
    }
    return reviewRequestsDB.getByClientId(clientId, limit);
  },

  async getBySalonId(limit: number = 100): Promise<ReviewRequest[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    if (USE_SQLITE) {
      return sqliteReviewRequestsDB.getBySalonId(storeId, limit);
    }
    return reviewRequestsDB.getBySalonId(storeId, limit);
  },

  async getByStatus(status: ReviewRequestStatus, limit: number = 100): Promise<ReviewRequest[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    if (USE_SQLITE) {
      return sqliteReviewRequestsDB.getByStatus(storeId, status, limit);
    }
    return reviewRequestsDB.getByStatus(storeId, status, limit);
  },

  async getPendingByClient(clientId: string): Promise<ReviewRequest[]> {
    if (USE_SQLITE) {
      return sqliteReviewRequestsDB.getPendingByClient(clientId);
    }
    return reviewRequestsDB.getPendingByClient(clientId);
  },

  async create(request: Omit<ReviewRequest, 'id' | 'createdAt' | 'syncStatus'>): Promise<ReviewRequest> {
    let created: ReviewRequest;
    if (USE_SQLITE) {
      created = await sqliteReviewRequestsDB.create(request);
    } else {
      created = await reviewRequestsDB.create(request);
    }
    queueSyncOperation('client', 'create', created.id, { entityType: 'reviewRequest', ...created });
    return created;
  },

  async update(id: string, updates: Partial<ReviewRequest>): Promise<ReviewRequest | null> {
    let updated: ReviewRequest | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteReviewRequestsDB.update(id, updates);
    } else {
      updated = await reviewRequestsDB.update(id, updates);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markSent(id: string, sentVia: 'email' | 'sms' | 'both'): Promise<ReviewRequest | null> {
    let updated: ReviewRequest | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteReviewRequestsDB.markSent(id, sentVia);
    } else {
      updated = await reviewRequestsDB.markSent(id, sentVia);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markOpened(id: string): Promise<ReviewRequest | null> {
    let updated: ReviewRequest | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteReviewRequestsDB.markOpened(id);
    } else {
      updated = await reviewRequestsDB.markOpened(id);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markCompleted(id: string, reviewId: string): Promise<ReviewRequest | null> {
    let updated: ReviewRequest | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteReviewRequestsDB.markCompleted(id, reviewId);
    } else {
      updated = await reviewRequestsDB.markCompleted(id, reviewId);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async markExpired(id: string): Promise<ReviewRequest | null> {
    let updated: ReviewRequest | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteReviewRequestsDB.markExpired(id);
    } else {
      updated = await reviewRequestsDB.markExpired(id);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'reviewRequest', ...updated });
    }
    return updated || null;
  },

  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteReviewRequestsDB.delete(id);
    } else {
      await reviewRequestsDB.delete(id);
    }
    queueSyncOperation('client', 'delete', id, { entityType: 'reviewRequest', id });
  },
};

/**
 * Custom Segments data operations - LOCAL-FIRST
 * User-defined client groupings based on filters
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteCustomSegmentsDB
 */
export const segmentsService = {
  async getById(id: string): Promise<CustomSegment | null> {
    if (USE_SQLITE) {
      const segment = await sqliteCustomSegmentsDB.getById(id);
      return segment || null;
    }
    const segment = await customSegmentsDB.getById(id);
    return segment || null;
  },

  async getAll(activeOnly: boolean = true): Promise<CustomSegment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    if (USE_SQLITE) {
      return sqliteCustomSegmentsDB.getBySalonId(storeId, activeOnly);
    }
    return customSegmentsDB.getBySalonId(storeId, activeOnly);
  },

  async getActive(): Promise<CustomSegment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    if (USE_SQLITE) {
      return sqliteCustomSegmentsDB.getActive(storeId);
    }
    return customSegmentsDB.getActive(storeId);
  },

  async getByName(name: string): Promise<CustomSegment | null> {
    const storeId = getStoreId();
    if (!storeId) return null;
    if (USE_SQLITE) {
      const segment = await sqliteCustomSegmentsDB.getByName(storeId, name);
      return segment || null;
    }
    const segment = await customSegmentsDB.getByName(storeId, name);
    return segment || null;
  },

  async create(segment: Omit<CustomSegment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<CustomSegment> {
    let created: CustomSegment;
    if (USE_SQLITE) {
      created = await sqliteCustomSegmentsDB.create(segment);
    } else {
      created = await customSegmentsDB.create(segment);
    }
    queueSyncOperation('client', 'create', created.id, { entityType: 'segment', ...created });
    return created;
  },

  async update(id: string, updates: Partial<CustomSegment>): Promise<CustomSegment | null> {
    let updated: CustomSegment | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteCustomSegmentsDB.update(id, updates);
    } else {
      updated = await customSegmentsDB.update(id, updates);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async updateFilters(id: string, filters: SegmentFilterGroup): Promise<CustomSegment | null> {
    let updated: CustomSegment | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteCustomSegmentsDB.updateFilters(id, filters);
    } else {
      updated = await customSegmentsDB.updateFilters(id, filters);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async activate(id: string): Promise<CustomSegment | null> {
    let updated: CustomSegment | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteCustomSegmentsDB.activate(id);
    } else {
      updated = await customSegmentsDB.activate(id);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async deactivate(id: string): Promise<CustomSegment | null> {
    let updated: CustomSegment | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteCustomSegmentsDB.deactivate(id);
    } else {
      updated = await customSegmentsDB.deactivate(id);
    }
    if (updated) {
      queueSyncOperation('client', 'update', id, { entityType: 'segment', ...updated });
    }
    return updated || null;
  },

  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteCustomSegmentsDB.delete(id);
    } else {
      await customSegmentsDB.delete(id);
    }
    queueSyncOperation('client', 'delete', id, { entityType: 'segment', id });
  },

  async duplicate(id: string, newName: string, createdBy: string): Promise<CustomSegment | null> {
    let duplicated: CustomSegment | null | undefined;
    if (USE_SQLITE) {
      duplicated = await sqliteCustomSegmentsDB.duplicate(id, newName, createdBy);
    } else {
      duplicated = await customSegmentsDB.duplicate(id, newName, createdBy);
    }
    if (duplicated) {
      queueSyncOperation('client', 'create', duplicated.id, { entityType: 'segment', ...duplicated });
    }
    return duplicated || null;
  },
};

// ==================== TEAM MEMBER SERVICE (SQLITE ONLY) ====================

/**
 * Team Member data operations - SQLite ONLY
 * Team management with soft delete and role-based filtering
 *
 * Note: This service is only available when USE_SQLITE=true.
 * For non-SQLite mode, use staffService instead (legacy team data).
 *
 * SQLite routing: Uses SQLite via sqliteTeamMemberDB
 */
export const teamMembersService = {
  async getAll(): Promise<Staff[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    if (USE_SQLITE) {
      return sqliteTeamMemberDB.getAll(storeId);
    }
    // Fallback to staffService for non-SQLite mode
    return staffService.getAll();
  },

  async getById(id: string): Promise<Staff | null> {
    if (USE_SQLITE) {
      const member = await sqliteTeamMemberDB.getById(id);
      return member || null;
    }
    // Fallback to staffService for non-SQLite mode
    return staffService.getById(id);
  },

  async getByRole(role: string): Promise<Staff[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    if (USE_SQLITE) {
      return sqliteTeamMemberDB.getByRole(storeId, role);
    }
    // No role filtering in staffService, return all
    return staffService.getAll();
  },
};

// ==================== SETTINGS SERVICE ====================

/**
 * Settings data operations - LOCAL-FIRST
 * Simple key-value store for application settings
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteSettingsDB
 */
export const settingsService = {
  async get<T>(key: string): Promise<T | undefined> {
    if (USE_SQLITE) {
      return sqliteSettingsDB.get<T>(key);
    }
    return settingsDB.get(key);
  },

  async set(key: string, value: unknown): Promise<void> {
    if (USE_SQLITE) {
      await sqliteSettingsDB.set(key, value);
      return;
    }
    await settingsDB.set(key, value);
  },

  async remove(key: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteSettingsDB.remove(key);
      return;
    }
    await settingsDB.remove(key);
  },
};

// ==================== SYNC QUEUE SERVICE ====================

/**
 * Sync Queue data operations - LOCAL-FIRST
 * Manages offline sync operation queue
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteSyncQueueDB
 */
export const syncQueueService = {
  async getAll(limit: number = 100, offset: number = 0) {
    if (USE_SQLITE) {
      return sqliteSyncQueueDB.getAll(limit, offset);
    }
    return syncQueueDB.getAll(limit, offset);
  },

  async getPending(limit: number = 50) {
    if (USE_SQLITE) {
      return sqliteSyncQueueDB.getPending(limit);
    }
    return syncQueueDB.getPending(limit);
  },

  async add(operation: Parameters<typeof syncQueueDB.add>[0]) {
    if (USE_SQLITE) {
      return sqliteSyncQueueDB.add(operation);
    }
    return syncQueueDB.add(operation);
  },

  async update(id: string, updates: Parameters<typeof syncQueueDB.update>[1]) {
    if (USE_SQLITE) {
      // Map 'success' status to 'complete' for SQLite service compatibility
      const sqliteUpdates: { status?: 'pending' | 'syncing' | 'complete' | 'failed'; lastError?: string } = {};
      if (updates.status) {
        sqliteUpdates.status = updates.status === 'success' ? 'complete' : updates.status as 'pending' | 'syncing' | 'failed';
      }
      if (updates.error) {
        sqliteUpdates.lastError = updates.error;
      }
      await sqliteSyncQueueDB.update(id, sqliteUpdates);
      return;
    }
    await syncQueueDB.update(id, updates);
  },

  async remove(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteSyncQueueDB.remove(id);
      return;
    }
    await syncQueueDB.remove(id);
  },

  async clear(): Promise<void> {
    if (USE_SQLITE) {
      await sqliteSyncQueueDB.clear();
      return;
    }
    await syncQueueDB.clear();
  },
};

// ==================== CATALOG SERVICES ====================

const serviceCategoriesService = {
  async getAll(storeId: string, includeInactive = false) {
    if (USE_SQLITE) {
      return sqliteServiceCategoriesDB.getAll(storeId, includeInactive);
    }
    return serviceCategoriesDB.getAll(storeId, includeInactive);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteServiceCategoriesDB.getById(id);
    }
    return serviceCategoriesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteServiceCategoriesDB.create(input);
    }
    return serviceCategoriesDB.create(input as Parameters<typeof serviceCategoriesDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteServiceCategoriesDB.update(id, updates);
    }
    return serviceCategoriesDB.update(id, updates as Partial<unknown>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteServiceCategoriesDB.delete(id);
    }
    return serviceCategoriesDB.delete(id);
  },
};

const menuServicesService = {
  async getAll(storeId: string, includeInactive = false) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.getAll(storeId, includeInactive);
    }
    return menuServicesDB.getAll(storeId, includeInactive);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.getById(id);
    }
    return menuServicesDB.getById(id);
  },

  async getByCategory(storeId: string, categoryId: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.getByCategory(storeId, categoryId);
    }
    return menuServicesDB.getByCategory(storeId, categoryId);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.create(input);
    }
    return menuServicesDB.create(input as Parameters<typeof menuServicesDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.update(id, updates);
    }
    return menuServicesDB.update(id, updates as Partial<unknown>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.delete(id);
    }
    return menuServicesDB.delete(id);
  },

  async search(storeId: string, query: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.search(storeId, query);
    }
    return menuServicesDB.search(storeId, query);
  },
};

const serviceVariantsService = {
  async getByService(serviceId: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.getByService(serviceId);
    }
    return serviceVariantsDB.getByService(serviceId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.getById(id);
    }
    return serviceVariantsDB.getById(id);
  },

  async create(input: unknown, _userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.create(input);
    }
    // Dexie API: create(input, storeId) - no userId
    return serviceVariantsDB.create(input as Parameters<typeof serviceVariantsDB.create>[0], storeId);
  },

  async update(id: string, updates: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.update(id, updates);
    }
    // Dexie API: update(id, updates) - no userId
    return serviceVariantsDB.update(id, updates as Partial<unknown>);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.delete(id);
    }
    return serviceVariantsDB.delete(id);
  },
};

const servicePackagesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.getAll(storeId);
    }
    return servicePackagesDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.getById(id);
    }
    return servicePackagesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.create(input);
    }
    return servicePackagesDB.create(input as Parameters<typeof servicePackagesDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.update(id, updates);
    }
    return servicePackagesDB.update(id, updates as Partial<unknown>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.delete(id);
    }
    return servicePackagesDB.delete(id);
  },

  // Note: search not available in Dexie servicePackagesDB - can be added later if needed
};

const addOnGroupsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.getAll(storeId);
    }
    return addOnGroupsDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.getById(id);
    }
    return addOnGroupsDB.getById(id);
  },

  async create(input: unknown, _userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.create(input);
    }
    // Dexie API: create(input, storeId) - no userId
    return addOnGroupsDB.create(input as Parameters<typeof addOnGroupsDB.create>[0], storeId);
  },

  async update(id: string, updates: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.update(id, updates);
    }
    // Dexie API: update(id, updates) - no userId
    return addOnGroupsDB.update(id, updates as Partial<unknown>);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.delete(id);
    }
    return addOnGroupsDB.delete(id);
  },
};

const addOnOptionsService = {
  async getByGroup(groupId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.getByGroup(groupId);
    }
    return addOnOptionsDB.getByGroup(groupId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.getById(id);
    }
    return addOnOptionsDB.getById(id);
  },

  async create(input: unknown, _userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.create(input);
    }
    // Dexie API: create(input, storeId) - no userId
    return addOnOptionsDB.create(input as Parameters<typeof addOnOptionsDB.create>[0], storeId);
  },

  async update(id: string, updates: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.update(id, updates);
    }
    // Dexie API: update(id, updates) - no userId
    return addOnOptionsDB.update(id, updates as Partial<unknown>);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.delete(id);
    }
    return addOnOptionsDB.delete(id);
  },
};

const staffServiceAssignmentsService = {
  async getByStaff(storeId: string, staffId: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.getByStaff(staffId);
    }
    // Dexie API: getByStaff(storeId, staffId)
    return staffServiceAssignmentsDB.getByStaff(storeId, staffId);
  },

  async getByService(storeId: string, serviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.getByService(serviceId);
    }
    // Dexie API: getByService(storeId, serviceId)
    return staffServiceAssignmentsDB.getByService(storeId, serviceId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.getById(id);
    }
    return staffServiceAssignmentsDB.getById(id);
  },

  async create(input: unknown, _userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.create(input);
    }
    // Dexie API: create(input, storeId) - no userId
    return staffServiceAssignmentsDB.create(input as Parameters<typeof staffServiceAssignmentsDB.create>[0], storeId);
  },

  async update(id: string, updates: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.update(id, updates);
    }
    // Dexie API: update(id, updates) - no userId
    return staffServiceAssignmentsDB.update(id, updates as Partial<unknown>);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.delete(id);
    }
    return staffServiceAssignmentsDB.delete(id);
  },
};

const catalogSettingsService = {
  async get(storeId: string) {
    if (USE_SQLITE) {
      return sqliteCatalogSettingsDB.get(storeId);
    }
    return catalogSettingsDB.get(storeId);
  },

  async set(storeId: string, settings: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteCatalogSettingsDB.set(storeId, settings);
    }
    // Dexie API: update(storeId, updates) - no userId
    return catalogSettingsDB.update(storeId, settings as Partial<unknown>);
  },
};

const productsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getAll(storeId);
    }
    return productsDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getById(id);
    }
    return productsDB.getById(id);
  },

  async getByCategory(storeId: string, categoryId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getByCategory(storeId, categoryId);
    }
    return productsDB.getByCategory(storeId, categoryId);
  },

  async create(input: unknown, _userId: string, storeId: string, tenantId?: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.create(input);
    }
    // Dexie API: create(data, storeId, tenantId) - no userId
    return productsDB.create(input as Parameters<typeof productsDB.create>[0], storeId, tenantId || storeId);
  },

  async update(id: string, updates: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.update(id, updates);
    }
    // Dexie API: update(id, changes) - no userId
    return productsDB.update(id, updates as Partial<unknown>);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.delete(id);
    }
    return productsDB.delete(id);
  },

  // Note: search not available in Dexie productsDB

  async getBySku(storeId: string, sku: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getBySku(storeId, sku);
    }
    return productsDB.getBySku(storeId, sku);
  },

  async getByBarcode(storeId: string, barcode: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getByBarcode(barcode);
    }
    // Dexie API: getByBarcode(storeId, barcode)
    return productsDB.getByBarcode(storeId, barcode);
  },

  async getCategories(storeId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getCategories(storeId);
    }
    return productsDB.getCategories(storeId);
  },

  async getRetail(storeId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getRetail(storeId);
    }
    return productsDB.getRetail(storeId);
  },
};

// ==================== SCHEDULING SERVICES ====================

const timeOffTypesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getAll(storeId);
    }
    return timeOffTypesDB.getAll(storeId);
  },

  async getAllIncludingInactive(storeId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getAllIncludingInactive(storeId);
    }
    return timeOffTypesDB.getAllIncludingInactive(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getById(id);
    }
    return timeOffTypesDB.getById(id);
  },

  async getByCode(storeId: string, code: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getByCode(storeId, code);
    }
    return timeOffTypesDB.getByCode(storeId, code);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.create(input);
    }
    return timeOffTypesDB.create(input as Parameters<typeof timeOffTypesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.update(id, updates);
    }
    return timeOffTypesDB.update(id, updates as Parameters<typeof timeOffTypesDB.update>[1], userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.delete(id);
    }
    return timeOffTypesDB.delete(id, userId, deviceId);
  },
};

const timeOffRequestsService = {
  async getByStaff(staffId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getByStaff(staffId);
    }
    return timeOffRequestsDB.getByStaff(staffId);
  },

  async getAll(storeId: string, filters?: { status?: string; staffId?: string; dateRange?: string }) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getAll(storeId);
    }
    return timeOffRequestsDB.getAll(storeId, filters as Parameters<typeof timeOffRequestsDB.getAll>[1]);
  },

  async getPendingCount(storeId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getPendingCount(storeId);
    }
    return timeOffRequestsDB.getPendingCount(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getById(id);
    }
    return timeOffRequestsDB.getById(id);
  },

  async create(
    input: unknown,
    typeDetails: { name: string; emoji: string; color: string; isPaid: boolean; requiresApproval: boolean },
    totalHours: number,
    totalDays: number,
    conflictingAppointmentIds: string[],
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.create(input);
    }
    return timeOffRequestsDB.create(
      input as Parameters<typeof timeOffRequestsDB.create>[0],
      typeDetails,
      totalHours,
      totalDays,
      conflictingAppointmentIds,
      userId,
      storeId,
      tenantId,
      deviceId
    );
  },

  async approve(id: string, approverName: string, notes: string | null, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.approve(id, approverName, notes, userId, deviceId);
    }
    return timeOffRequestsDB.approve(id, approverName, notes, userId, deviceId);
  },

  async deny(id: string, denierName: string, reason: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.deny(id, denierName, reason, userId, deviceId);
    }
    return timeOffRequestsDB.deny(id, denierName, reason, userId, deviceId);
  },

  async cancel(id: string, reason: string | null, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.cancel(id, reason, userId, deviceId);
    }
    return timeOffRequestsDB.cancel(id, reason, userId, deviceId);
  },
};

const blockedTimeTypesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.getAll(storeId);
    }
    return blockedTimeTypesDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.getById(id);
    }
    return blockedTimeTypesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.create(input);
    }
    return blockedTimeTypesDB.create(input as Parameters<typeof blockedTimeTypesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.update(id, updates);
    }
    return blockedTimeTypesDB.update(id, updates as Parameters<typeof blockedTimeTypesDB.update>[1], userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.delete(id);
    }
    return blockedTimeTypesDB.delete(id, userId, deviceId);
  },

  async seedDefaults(storeId: string, tenantId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.seedDefaults(storeId);
    }
    return blockedTimeTypesDB.seedDefaults(storeId, tenantId, userId, deviceId);
  },
};

const blockedTimeEntriesService = {
  async getAll(storeId: string, filters?: { staffId?: string; startDate?: string; endDate?: string }) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getAll(storeId);
    }
    return blockedTimeEntriesDB.getAll(storeId, filters);
  },

  async getByStaffAndDate(staffId: string, date: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getByStaffAndDate(staffId, date);
    }
    return blockedTimeEntriesDB.getByStaffAndDate(staffId, date);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getById(id);
    }
    return blockedTimeEntriesDB.getById(id);
  },

  async create(
    input: unknown,
    typeDetails: { name: string; emoji: string; color: string; isPaid: boolean },
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string,
    isManager: boolean
  ) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.create(input);
    }
    return blockedTimeEntriesDB.create(
      input as Parameters<typeof blockedTimeEntriesDB.create>[0],
      typeDetails,
      userId,
      storeId,
      tenantId,
      deviceId,
      isManager
    );
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.delete(id);
    }
    return blockedTimeEntriesDB.delete(id, userId, deviceId);
  },

  async getBySeries(seriesId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getBySeries(seriesId);
    }
    return blockedTimeEntriesDB.getBySeries(seriesId);
  },

  async deleteSeries(seriesId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.deleteSeries(seriesId, userId, deviceId);
    }
    return blockedTimeEntriesDB.deleteSeries(seriesId, userId, deviceId);
  },
};

const businessClosedPeriodsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getAll(storeId);
    }
    return businessClosedPeriodsDB.getAll(storeId);
  },

  async getUpcoming(storeId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getUpcoming(storeId);
    }
    return businessClosedPeriodsDB.getUpcoming(storeId);
  },

  async getForDate(storeId: string, date: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getForDate(storeId, date);
    }
    return businessClosedPeriodsDB.getForDate(storeId, date);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getById(id);
    }
    return businessClosedPeriodsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.create(input);
    }
    return businessClosedPeriodsDB.create(input as Parameters<typeof businessClosedPeriodsDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.update(id, updates);
    }
    return businessClosedPeriodsDB.update(id, updates as Partial<Parameters<typeof businessClosedPeriodsDB.create>[0]>, userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.delete(id);
    }
    return businessClosedPeriodsDB.delete(id, userId, deviceId);
  },
};

const resourcesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getAll(storeId);
    }
    return resourcesDB.getAll(storeId);
  },

  async getAllIncludingInactive(storeId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getAllIncludingInactive(storeId);
    }
    return resourcesDB.getAllIncludingInactive(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getById(id);
    }
    return resourcesDB.getById(id);
  },

  async getByCategory(storeId: string, category: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getByCategory(storeId, category);
    }
    return resourcesDB.getByCategory(storeId, category);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.create(input);
    }
    return resourcesDB.create(input as Parameters<typeof resourcesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.update(id, updates);
    }
    return resourcesDB.update(id, updates as Parameters<typeof resourcesDB.update>[1], userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.delete(id);
    }
    return resourcesDB.delete(id, userId, deviceId);
  },
};

const resourceBookingsService = {
  async getByResource(resourceId: string, startDate: string, endDate: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.getByResource(resourceId, startDate, endDate);
    }
    return resourceBookingsDB.getByResource(resourceId, startDate, endDate);
  },

  async getByAppointment(appointmentId: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.getByAppointment(appointmentId);
    }
    return resourceBookingsDB.getByAppointment(appointmentId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.getById(id);
    }
    return resourceBookingsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.create(input);
    }
    return resourceBookingsDB.create(input as Parameters<typeof resourceBookingsDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.delete(id);
    }
    return resourceBookingsDB.delete(id, userId, deviceId);
  },
};

const staffSchedulesService = {
  async getByStaff(staffId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getByStaff(staffId);
    }
    return staffSchedulesDB.getByStaff(staffId);
  },

  async getCurrentForStaff(staffId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getCurrentForStaff(staffId);
    }
    return staffSchedulesDB.getCurrentForStaff(staffId);
  },

  async getByStore(storeId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getByStore(storeId);
    }
    return staffSchedulesDB.getByStore(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getById(id);
    }
    return staffSchedulesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.create(input);
    }
    return staffSchedulesDB.create(input as Parameters<typeof staffSchedulesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.update(id, updates);
    }
    return staffSchedulesDB.update(id, updates as Partial<Parameters<typeof staffSchedulesDB.create>[0]>, userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.delete(id);
    }
    return staffSchedulesDB.delete(id, userId, deviceId);
  },
};

// ==================== GIFT CARD SERVICES ====================

const giftCardDenominationsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDenominationsDB.getAll(storeId);
    }
    // Dexie doesn't have denominations - fallback to empty array
    return [];
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDenominationsDB.getById(id);
    }
    return undefined;
  },

  async create(input: unknown) {
    if (USE_SQLITE) {
      return sqliteGiftCardDenominationsDB.create(input);
    }
    throw new Error('Gift card denominations not supported in Dexie mode');
  },

  async update(id: string, updates: unknown) {
    if (USE_SQLITE) {
      return sqliteGiftCardDenominationsDB.update(id, updates);
    }
    throw new Error('Gift card denominations not supported in Dexie mode');
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDenominationsDB.delete(id);
    }
    throw new Error('Gift card denominations not supported in Dexie mode');
  },
};

const giftCardSettingsService = {
  async get(storeId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardSettingsDB.get(storeId);
    }
    // Dexie doesn't have gift card settings - fallback to undefined
    return undefined;
  },

  async set(storeId: string, settings: unknown) {
    if (USE_SQLITE) {
      return sqliteGiftCardSettingsDB.set(storeId, settings);
    }
    throw new Error('Gift card settings not supported in Dexie mode');
  },
};

const giftCardsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.getAll(storeId);
    }
    return giftCardsDB.getAllGiftCards(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.getById(id);
    }
    return giftCardsDB.getGiftCardById(id);
  },

  async getByCode(storeId: string, code: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.getByCode(storeId, code);
    }
    return giftCardsDB.getGiftCardByCode(storeId, code);
  },

  async getByStatus(storeId: string, status: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.getByStatus(storeId, status);
    }
    return giftCardsDB.getGiftCardsByStatus(storeId, status as 'active' | 'depleted' | 'expired' | 'voided');
  },

  async getByPurchaser(storeId: string, purchaserId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.getByPurchaser(storeId, purchaserId);
    }
    return giftCardsDB.getGiftCardsByPurchaser(storeId, purchaserId);
  },

  async issue(
    input: unknown,
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId?: string,
    ticketId?: string
  ) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.issue(input);
    }
    return giftCardsDB.issueGiftCard(
      input as Parameters<typeof giftCardsDB.issueGiftCard>[0],
      storeId,
      userId,
      deviceId,
      tenantId,
      ticketId
    );
  },

  async redeem(input: { code: string; amount: number; ticketId: string; staffId: string }, storeId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.redeem(input);
    }
    return giftCardsDB.redeemGiftCard(input, storeId, userId, deviceId);
  },

  async reload(input: { giftCardId: string; amount: number; ticketId?: string; staffId: string }, storeId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.reload(input);
    }
    return giftCardsDB.reloadGiftCard(input, storeId, userId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.update(id, updates);
    }
    return giftCardsDB.updateGiftCard(id, updates as Parameters<typeof giftCardsDB.updateGiftCard>[1], userId, deviceId);
  },

  async void(id: string, reason: string, storeId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.void(id);
    }
    return giftCardsDB.voidGiftCard(id, reason, storeId, userId, deviceId);
  },

  async search(storeId: string, query: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardsDB.search(storeId, query);
    }
    // Dexie search fallback - by code or recipient email
    const byCode = await giftCardsDB.getGiftCardByCode(storeId, query);
    if (byCode) return [byCode];
    return giftCardsDB.getGiftCardsByRecipientEmail(storeId, query);
  },
};

const giftCardTransactionsService = {
  async getByCard(giftCardId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardTransactionsDB.getByCard(giftCardId);
    }
    return giftCardsDB.getTransactionsByGiftCard(giftCardId);
  },

  async getByTicket(ticketId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardTransactionsDB.getByTicket(ticketId);
    }
    return giftCardsDB.getTransactionsByTicket(ticketId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardTransactionsDB.getById(id);
    }
    // Dexie doesn't have direct transaction get by ID
    return undefined;
  },

  async create(input: unknown) {
    if (USE_SQLITE) {
      return sqliteGiftCardTransactionsDB.create(input);
    }
    // Dexie transactions are created via redeem/reload operations
    throw new Error('Direct transaction creation not supported in Dexie mode');
  },

  async getByDateRange(storeId: string, start: string, end: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardTransactionsDB.getByDateRange(storeId, start, end);
    }
    return giftCardsDB.getTransactionsByDateRange(storeId, start, end);
  },
};

const giftCardDesignsService = {
  async getActive(storeId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.getActive(storeId);
    }
    return giftCardsDB.getActiveDesigns(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.getById(id);
    }
    // Dexie doesn't have direct design get by ID, use get from table
    return undefined;
  },

  async getDefault(storeId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.getDefault(storeId);
    }
    return giftCardsDB.getDefaultDesign(storeId);
  },

  async getByCategory(storeId: string, category: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.getByCategory(storeId, category);
    }
    return giftCardsDB.getDesignsByCategory(storeId, category as Parameters<typeof giftCardsDB.getDesignsByCategory>[1]);
  },

  async create(input: unknown) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.create(input);
    }
    // Dexie doesn't have design creation in giftCardDB
    throw new Error('Gift card design creation not supported in Dexie mode');
  },

  async update(id: string, updates: unknown) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.update(id, updates);
    }
    // Dexie doesn't have design update in giftCardDB
    throw new Error('Gift card design update not supported in Dexie mode');
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.delete(id);
    }
    // Dexie doesn't have design deletion in giftCardDB
    throw new Error('Gift card design deletion not supported in Dexie mode');
  },

  async setDefault(id: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteGiftCardDesignsDB.setDefault(id, storeId);
    }
    // Dexie doesn't have setDefaultDesign in giftCardDB
    throw new Error('Gift card design default setting not supported in Dexie mode');
  },
};

// ==================== EXPORTS ====================

// Re-export feature flags for convenience
export { shouldUseSQLite, getBackendType } from '@/config/featureFlags';

// Re-export domain services for backward compatibility
export { appointmentsService, clientsService, staffService } from '@/services/domain';

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

  // SQLite mode helpers (for future use)
  shouldUseSQLite: () => USE_SQLITE,
  getBackendType,

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

  // Team member service (SQLite-only, with fallback to staff)
  teamMembers: teamMembersService,

  // Catalog services
  serviceCategories: serviceCategoriesService,
  menuServices: menuServicesService,
  serviceVariants: serviceVariantsService,
  servicePackages: servicePackagesService,
  addOnGroups: addOnGroupsService,
  addOnOptions: addOnOptionsService,
  staffServiceAssignments: staffServiceAssignmentsService,
  catalogSettings: catalogSettingsService,
  products: productsService,

  // Scheduling services
  timeOffTypes: timeOffTypesService,
  timeOffRequests: timeOffRequestsService,
  blockedTimeTypes: blockedTimeTypesService,
  blockedTimeEntries: blockedTimeEntriesService,
  businessClosedPeriods: businessClosedPeriodsService,
  resources: resourcesService,
  resourceBookings: resourceBookingsService,
  staffSchedules: staffSchedulesService,

  // Gift card services
  giftCardDenominations: giftCardDenominationsService,
  giftCardSettings: giftCardSettingsService,
  giftCards: giftCardsService,
  giftCardTransactions: giftCardTransactionsService,
  giftCardDesigns: giftCardDesignsService,

  // Infrastructure services (settings, sync queue)
  settings: settingsService,
  syncQueue: syncQueueService,
};

export default dataService;
