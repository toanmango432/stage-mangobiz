/**
 * Data Service
 *
 * LOCAL-FIRST architecture - Phase 4 Implementation
 *
 * All reads come from IndexedDB first (instant response)
 * All writes go to IndexedDB first, then queue for background sync
 * Supabase is used for sync only, never blocks UI
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
} from '@/db/database';

// Type imports for compatibility
import type { Client, Staff, Service, Appointment, Ticket, Transaction } from '@/types';

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
  return state.auth.salonId || '';
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
 * LOCAL-FIRST: Always returns true
 */
export function shouldUseLocalDB(): boolean {
  return true; // Always local-first
}

/**
 * Check if server should be used for the current operation
 * LOCAL-FIRST: Always returns false (server is for sync only)
 */
export function shouldUseServer(): boolean {
  return false; // Never use server directly, sync in background
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
 * LOCAL-FIRST: Mode is always 'local-first'
 */
export function getModeInfo(): {
  mode: string;
  online: boolean;
  dataSource: DataSourceType;
} {
  return {
    mode: 'local-first',
    online: isOnline(),
    dataSource: getDataSource(),
  };
}

// ==================== LOCAL-FIRST ENTITY SERVICES ====================
// All reads from IndexedDB (instant), writes queue to sync

/**
 * Clients data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const clientsService = {
  async getAll(): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return clientsDB.getAll(storeId);
  },

  async getById(id: string): Promise<Client | null> {
    const client = await clientsDB.getById(id);
    return client || null;
  },

  async search(query: string): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    return clientsDB.search(storeId, query);
  },

  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Client> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    // Write to IndexedDB first (instant)
    const created = await clientsDB.create({ ...client, salonId: storeId });

    // Queue for background sync (non-blocking)
    queueSyncOperation('client', 'create', created.id, created);

    return created;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    // Update IndexedDB first (instant)
    const updated = await clientsDB.update(id, updates);
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('client', 'update', id, updated);

    return updated;
  },

  async delete(id: string): Promise<void> {
    // Delete from IndexedDB first (instant)
    await clientsDB.delete(id);

    // Queue for background sync (non-blocking)
    queueSyncOperation('client', 'delete', id, { id });
  },

  async getVipClients(): Promise<Client[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
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
    const created = await staffDB.create({ ...staffData, salonId: storeId });

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
    const created = await transactionsDB.create({ ...transaction, salonId: storeId });

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
