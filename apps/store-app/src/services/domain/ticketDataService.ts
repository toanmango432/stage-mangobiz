/**
 * Ticket Data Service
 *
 * Domain-specific data operations for tickets.
 * Extracted from dataService.ts for better modularity.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB or SQLite (instant response)
 * - Writes queue for background sync with server
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron,
 * uses SQLite via sqliteTicketsDB
 */

import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';
import { ticketsDB, syncQueueDB } from '@/db/database';
import { sqliteTicketsDB } from '@/services/sqliteServices';
import type { Ticket } from '@/types';

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Check if SQLite should be used
 */
const USE_SQLITE = shouldUseSQLite();

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
    entity: 'ticket',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[TicketDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== TICKET SERVICE ====================

/**
 * Tickets data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite, writes queue for background sync
 */
export const ticketsService = {
  /**
   * Get tickets for a specific date
   */
  async getByDate(date: Date): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteTicketsDB.getByDate(storeId, date);
    }
    return ticketsDB.getByDate(storeId, date);
  },

  /**
   * Get a single ticket by ID
   */
  async getById(id: string): Promise<Ticket | null> {
    if (USE_SQLITE) {
      const ticket = await sqliteTicketsDB.getById(id);
      return ticket || null;
    }
    const ticket = await ticketsDB.getById(id);
    return ticket || null;
  },

  /**
   * Get all open tickets
   */
  async getOpenTickets(): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteTicketsDB.getActive(storeId);
    }
    return ticketsDB.getActive(storeId);
  },

  /**
   * Get tickets by status
   */
  async getByStatus(status: string): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteTicketsDB.getByStatus(storeId, status);
    }
    return ticketsDB.getByStatus(storeId, status);
  },

  /**
   * Get tickets by client ID
   */
  async getByClientId(clientId: string): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      const allTickets = await sqliteTicketsDB.getAll(storeId, 500);
      return allTickets.filter(t => t.clientId === clientId);
    }
    const allTickets = await ticketsDB.getAll(storeId, 500);
    return allTickets.filter(t => t.clientId === clientId);
  },

  /**
   * Get ticket by appointment ID
   */
  async getByAppointmentId(appointmentId: string): Promise<Ticket | null> {
    const storeId = getStoreId();
    if (!storeId) return null;

    if (USE_SQLITE) {
      const allTickets = await sqliteTicketsDB.getAll(storeId, 500);
      return allTickets.find(t => t.appointmentId === appointmentId) || null;
    }
    const allTickets = await ticketsDB.getAll(storeId, 500);
    return allTickets.find(t => t.appointmentId === appointmentId) || null;
  },

  /**
   * Create a new ticket
   */
  async create(input: Parameters<typeof ticketsDB.create>[0]): Promise<Ticket> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    let created: Ticket;
    if (USE_SQLITE) {
      created = await sqliteTicketsDB.create(input, 'system', storeId);
    } else {
      created = await ticketsDB.create(input, 'system', storeId);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('create', created.id, created);

    return created;
  },

  /**
   * Update an existing ticket
   */
  async update(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    let updated: Ticket | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteTicketsDB.update(id, updates, 'system');
    } else {
      updated = await ticketsDB.update(id, updates, 'system');
    }
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('update', id, updated);

    return updated;
  },

  /**
   * Update ticket status
   */
  async updateStatus(id: string, status: string): Promise<Ticket | null> {
    return this.update(id, { status: status as Ticket['status'] });
  },

  /**
   * Complete a ticket (mark as paid)
   */
  async complete(id: string, _payments: unknown[]): Promise<Ticket | null> {
    let completed: Ticket | null | undefined;
    if (USE_SQLITE) {
      completed = await sqliteTicketsDB.complete(id, 'system');
    } else {
      completed = await ticketsDB.complete(id, 'system');
    }
    if (completed) {
      queueSyncOperation('update', id, completed);
    }
    return completed || null;
  },

  /**
   * Delete a ticket
   */
  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteTicketsDB.delete(id);
    } else {
      await ticketsDB.delete(id);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('delete', id, { id });
  },

  /**
   * Get daily summary for a specific date
   */
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

  /**
   * Get tickets updated since a specific date
   */
  async getUpdatedSince(since: Date): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      const allTickets = await sqliteTicketsDB.getAll(storeId, 1000);
      return allTickets.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= since;
      });
    }
    const allTickets = await ticketsDB.getAll(storeId, 1000);
    return allTickets.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= since;
    });
  },

  /**
   * Get all draft tickets
   */
  async getDrafts(): Promise<Ticket[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteTicketsDB.getDrafts(storeId);
    }
    return ticketsDB.getDrafts(storeId);
  },

  /**
   * Create a draft ticket
   */
  async createDraft(
    services: Ticket['services'],
    clientInfo?: { clientId: string; clientName: string; clientPhone: string }
  ): Promise<Ticket> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    if (USE_SQLITE) {
      return sqliteTicketsDB.createDraft(services, 'system', storeId, clientInfo);
    }
    return ticketsDB.createDraft(services, 'system', storeId, clientInfo);
  },
};

export default ticketsService;
