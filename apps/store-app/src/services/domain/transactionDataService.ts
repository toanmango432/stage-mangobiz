/**
 * Transaction Data Service
 *
 * Domain-specific data operations for transactions.
 * Extracted from dataService.ts for better modularity.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB or SQLite (instant response)
 * - Writes queue for background sync with server
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron,
 * uses SQLite via sqliteTransactionsDB
 */

import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';
import { transactionsDB, syncQueueDB } from '@/db/database';
import { sqliteTransactionsDB } from '@/services/sqliteServices';
import type { Transaction } from '@/types';

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
    entity: 'transaction',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[TransactionDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== TRANSACTIONS SERVICE ====================

/**
 * Transactions data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite, writes queue for background sync
 */
export const transactionsService = {
  /**
   * Get transactions for a specific date
   */
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

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<Transaction | null> {
    if (USE_SQLITE) {
      const transaction = await sqliteTransactionsDB.getById(id);
      return transaction || null;
    }
    const transaction = await transactionsDB.getById(id);
    return transaction || null;
  },

  /**
   * Get transactions by ticket ID
   */
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

  /**
   * Get transactions by client ID
   */
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

  /**
   * Get transactions by payment method
   */
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

  /**
   * Create a new transaction
   */
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
    queueSyncOperation('create', created.id, created);

    return created;
  },

  /**
   * Update an existing transaction
   */
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
    queueSyncOperation('update', id, updated);

    return updated;
  },

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteTransactionsDB.delete(id);
    } else {
      await transactionsDB.delete(id);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('delete', id, { id });
  },

  /**
   * Get daily summary statistics
   */
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

  /**
   * Get payment breakdown by method
   */
  async getPaymentBreakdown(date: Date) {
    const transactions = await this.getByDate(date);
    return transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  },

  /**
   * Get transactions updated since a specific time
   */
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

export default transactionsService;
