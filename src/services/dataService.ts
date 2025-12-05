/**
 * Data Service
 *
 * Provides a unified interface for data operations that automatically
 * routes to local IndexedDB or server API based on device mode.
 *
 * This is the key abstraction for the opt-in offline mode feature.
 * Components should use this service instead of directly accessing
 * database operations or API calls.
 */

import { store } from '@/store';
import { selectIsOfflineEnabled, selectDeviceMode } from '@/store/slices/authSlice';
import type { DeviceMode } from '@/types/device';

// Supabase table operations
import {
  clientsTable,
  staffTable,
  servicesTable,
  appointmentsTable,
  ticketsTable,
  transactionsTable,
  type ClientRow,
  type ClientInsert,
  type ClientUpdate,
  type StaffRow,
  type StaffInsert,
  type StaffUpdate,
  type ServiceRow,
  type ServiceInsert,
  type ServiceUpdate,
  type AppointmentRow,
  type AppointmentInsert,
  type AppointmentUpdate,
  type TicketRow,
  type TicketInsert,
  type TicketUpdate,
  type TransactionRow,
  type TransactionInsert,
  type TransactionUpdate,
} from './supabase';

// Note: IndexedDB operations (clientsDB, staffDB, appointmentsDB, ticketsDB)
// from '../db/database' will be imported in Phase 5 for offline-enabled mode

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
 * Get current device mode from Redux store
 */
function getMode(): DeviceMode | null {
  const state = store.getState();
  return selectDeviceMode(state);
}

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.salonId || '';
}

/**
 * Check if offline mode is enabled
 */
function isOfflineEnabled(): boolean {
  const state = store.getState();
  return selectIsOfflineEnabled(state);
}

/**
 * Check if browser is online
 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Determine which data source to use
 */
function getDataSource(config?: DataServiceConfig): DataSourceType {
  // Respect forced source
  if (config?.forceSource) {
    return config.forceSource;
  }

  const mode = getMode();
  const offlineEnabled = isOfflineEnabled();
  const online = isOnline();

  // Online-only mode: always use server
  if (!offlineEnabled || mode === 'online-only') {
    return 'server';
  }

  // Offline-enabled mode: use local when offline, prefer local when online
  if (!online) {
    return 'local';
  }

  // When online in offline-enabled mode, prefer local for reads (faster)
  return 'local';
}

// ==================== DATA SERVICE ====================

/**
 * Create a mode-aware data operation
 *
 * @param localFn - Function to execute for local database
 * @param serverFn - Function to execute for server API
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
      const data = await serverFn();
      return { data, source: 'server' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // If server fails and we have offline capability, fallback to local
    if (source === 'server' && isOfflineEnabled() && getMode() === 'offline-enabled') {
      console.warn('[DataService] Server failed, falling back to local:', message);
      try {
        const data = await localFn();
        return { data, source: 'local', cached: true };
      } catch (localError) {
        return { data: null, source: 'local', error: message };
      }
    }

    return { data: null, source, error: message };
  }
}

/**
 * Execute a write operation with proper sync handling
 *
 * For offline-enabled mode:
 * - Writes to local database immediately
 * - Queues for sync with server
 *
 * For online-only mode:
 * - Writes directly to server
 */
export async function executeWriteOperation<T>(
  localFn: () => Promise<T>,
  serverFn: () => Promise<T>,
  syncQueueFn?: () => Promise<void>,
  _config?: DataServiceConfig
): Promise<DataResult<T>> {
  const mode = getMode();
  const offlineEnabled = isOfflineEnabled();
  const online = isOnline();

  // Online-only mode: write directly to server
  if (!offlineEnabled || mode === 'online-only') {
    if (!online) {
      return {
        data: null,
        source: 'server',
        error: 'Cannot save changes while offline. Please check your internet connection.',
      };
    }

    try {
      const data = await serverFn();
      return { data, source: 'server' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      return { data: null, source: 'server', error: message };
    }
  }

  // Offline-enabled mode: write to local, queue for sync
  try {
    const data = await localFn();

    // Queue for sync if online and sync function provided
    if (online && syncQueueFn) {
      try {
        await syncQueueFn();
      } catch (syncError) {
        console.warn('[DataService] Failed to queue sync:', syncError);
        // Don't fail the operation, sync will retry later
      }
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
 */
export function shouldUseLocalDB(): boolean {
  return getDataSource() === 'local';
}

/**
 * Check if server should be used for the current operation
 */
export function shouldUseServer(): boolean {
  return getDataSource() === 'server';
}

/**
 * Check if sync operations should run
 */
export function shouldSync(): boolean {
  const offlineEnabled = isOfflineEnabled();
  const online = isOnline();
  return offlineEnabled && online;
}

/**
 * Get current mode info for debugging/logging
 */
export function getModeInfo(): {
  mode: DeviceMode | null;
  offlineEnabled: boolean;
  online: boolean;
  dataSource: DataSourceType;
} {
  return {
    mode: getMode(),
    offlineEnabled: isOfflineEnabled(),
    online: isOnline(),
    dataSource: getDataSource(),
  };
}

// ==================== SUPABASE ENTITY SERVICES ====================
// These services provide direct access to Supabase tables.
// For Phase 4, we use Supabase directly. IndexedDB integration can be added later.

/**
 * Clients data operations via Supabase
 */
export const clientsService = {
  async getAll(): Promise<ClientRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return clientsTable.getByStoreId(storeId);
  },

  async getById(id: string): Promise<ClientRow | null> {
    return clientsTable.getById(id);
  },

  async search(query: string): Promise<ClientRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return clientsTable.search(storeId, query);
  },

  async create(client: Omit<ClientInsert, 'store_id'>): Promise<ClientRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return clientsTable.create({ ...client, store_id: storeId });
  },

  async update(id: string, updates: ClientUpdate): Promise<ClientRow> {
    return clientsTable.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    return clientsTable.delete(id);
  },

  async getVipClients(): Promise<ClientRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return clientsTable.getVipClients(storeId);
  },
};

/**
 * Staff data operations via Supabase
 */
export const staffService = {
  async getAll(): Promise<StaffRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return staffTable.getByStoreId(storeId);
  },

  async getById(id: string): Promise<StaffRow | null> {
    return staffTable.getById(id);
  },

  async getActive(): Promise<StaffRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return staffTable.getActiveByStoreId(storeId);
  },

  async create(staff: Omit<StaffInsert, 'store_id'>): Promise<StaffRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return staffTable.create({ ...staff, store_id: storeId });
  },

  async update(id: string, updates: StaffUpdate): Promise<StaffRow> {
    return staffTable.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    return staffTable.delete(id);
  },
};

/**
 * Services data operations via Supabase
 */
export const servicesService = {
  async getAll(): Promise<ServiceRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return servicesTable.getByStoreId(storeId);
  },

  async getById(id: string): Promise<ServiceRow | null> {
    return servicesTable.getById(id);
  },

  async getActive(): Promise<ServiceRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    // Use getByStoreId and filter active
    const services = await servicesTable.getByStoreId(storeId);
    return services.filter(s => s.is_active);
  },

  async create(service: Omit<ServiceInsert, 'store_id'>): Promise<ServiceRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return servicesTable.create({ ...service, store_id: storeId });
  },

  async update(id: string, updates: ServiceUpdate): Promise<ServiceRow> {
    return servicesTable.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    return servicesTable.delete(id);
  },
};

/**
 * Appointments data operations via Supabase
 */
export const appointmentsService = {
  async getByDate(date: Date): Promise<AppointmentRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return appointmentsTable.getByDate(storeId, date);
  },

  async getById(id: string): Promise<AppointmentRow | null> {
    return appointmentsTable.getById(id);
  },

  async create(appointment: Omit<AppointmentInsert, 'store_id'>): Promise<AppointmentRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return appointmentsTable.create({ ...appointment, store_id: storeId });
  },

  async update(id: string, updates: AppointmentUpdate): Promise<AppointmentRow> {
    return appointmentsTable.update(id, updates);
  },

  async getUpcoming(limit = 50): Promise<AppointmentRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return appointmentsTable.getUpcoming(storeId, limit);
  },

  async updateStatus(id: string, status: string): Promise<AppointmentRow> {
    return appointmentsTable.updateStatus(id, status);
  },

  async delete(id: string): Promise<void> {
    return appointmentsTable.delete(id);
  },
};

/**
 * Tickets data operations via Supabase
 */
export const ticketsService = {
  async getByDate(date: Date): Promise<TicketRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.getByDate(storeId, date);
  },

  async getById(id: string): Promise<TicketRow | null> {
    return ticketsTable.getById(id);
  },

  async getOpenTickets(): Promise<TicketRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.getOpenTickets(storeId);
  },

  async getByStatus(status: string): Promise<TicketRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.getByStatus(storeId, status);
  },

  async getByClientId(clientId: string): Promise<TicketRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.getByClientId(storeId, clientId);
  },

  async getByAppointmentId(appointmentId: string): Promise<TicketRow | null> {
    return ticketsTable.getByAppointmentId(appointmentId);
  },

  async create(ticket: Omit<TicketInsert, 'store_id'>): Promise<TicketRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.create({ ...ticket, store_id: storeId });
  },

  async update(id: string, updates: TicketUpdate): Promise<TicketRow> {
    return ticketsTable.update(id, updates);
  },

  async updateStatus(id: string, status: string): Promise<TicketRow> {
    return ticketsTable.updateStatus(id, status);
  },

  async complete(id: string, payments: unknown[]): Promise<TicketRow> {
    return ticketsTable.complete(id, payments);
  },

  async delete(id: string): Promise<void> {
    return ticketsTable.delete(id);
  },

  async getDailySummary(date: Date) {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.getDailySummary(storeId, date);
  },

  async getUpdatedSince(since: Date): Promise<TicketRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return ticketsTable.getUpdatedSince(storeId, since);
  },
};

/**
 * Transactions data operations via Supabase
 */
export const transactionsService = {
  async getByDate(date: Date): Promise<TransactionRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.getByDate(storeId, date);
  },

  async getById(id: string): Promise<TransactionRow | null> {
    return transactionsTable.getById(id);
  },

  async getByTicketId(ticketId: string): Promise<TransactionRow[]> {
    return transactionsTable.getByTicketId(ticketId);
  },

  async getByClientId(clientId: string): Promise<TransactionRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.getByClientId(storeId, clientId);
  },

  async getByType(type: string, date?: Date): Promise<TransactionRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.getByType(storeId, type, date);
  },

  async create(transaction: Omit<TransactionInsert, 'store_id'>): Promise<TransactionRow> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.create({ ...transaction, store_id: storeId });
  },

  async update(id: string, updates: TransactionUpdate): Promise<TransactionRow> {
    return transactionsTable.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    return transactionsTable.delete(id);
  },

  async getDailySummary(date: Date) {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.getDailySummary(storeId, date);
  },

  async getPaymentBreakdown(date: Date) {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.getPaymentBreakdown(storeId, date);
  },

  async getUpdatedSince(since: Date): Promise<TransactionRow[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');
    return transactionsTable.getUpdatedSince(storeId, since);
  },
};

// ==================== EXPORTS ====================

export const dataService = {
  execute: executeDataOperation,
  write: executeWriteOperation,
  shouldUseLocalDB,
  shouldUseServer,
  shouldSync,
  getModeInfo,
  getDataSource,
  getStoreId,

  // Entity-specific services
  clients: clientsService,
  staff: staffService,
  services: servicesService,
  appointments: appointmentsService,
  tickets: ticketsService,
  transactions: transactionsService,
};

export default dataService;
