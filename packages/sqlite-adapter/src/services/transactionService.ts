/**
 * TransactionSQLiteService - SQLite service for payment transactions
 *
 * Provides SQLite-based CRUD operations for payment transactions with
 * aggregation queries, date range filtering, and payment method filtering.
 *
 * @module sqlite-adapter/services/transactionService
 */

import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';
import type { SQLiteAdapter } from '../types';

// ==================== TYPES ====================

/**
 * Payment method type
 */
export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'gift_card'
  | 'store_credit'
  | 'check'
  | 'other';

/**
 * Transaction status type
 */
export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'voided';

/**
 * Transaction entity type
 *
 * Extends Record<string, unknown> to satisfy BaseSQLiteService constraint.
 */
export interface Transaction extends Record<string, unknown> {
  id: string;
  storeId: string;
  ticketId: string;
  clientId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  cardLast4?: string;
  cardBrand?: string;
  authCode?: string;
  refundedAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  syncStatus?: string;
}

/**
 * Transaction SQLite row type
 */
export interface TransactionRow {
  id: string;
  store_id: string;
  ticket_id: string;
  client_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  card_last4: string | null;
  card_brand: string | null;
  auth_code: string | null;
  refunded_amount: number | null;
  refunded_at: string | null;
  refund_reason: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string | null;
}

/**
 * Transaction totals result from aggregation queries
 */
export interface TransactionTotals {
  totalAmount: number;
  transactionCount: number;
  refundedAmount: number;
  netAmount: number;
}

/**
 * Totals by payment method
 */
export interface TotalsByPaymentMethod {
  paymentMethod: PaymentMethod;
  totalAmount: number;
  transactionCount: number;
}

// ==================== SCHEMA ====================

/**
 * Transaction table schema
 *
 * Note: Uses snake_case column names matching the database schema.
 */
const transactionSchema: TableSchema = {
  tableName: 'transactions',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    ticketId: 'ticket_id',
    clientId: 'client_id',
    amount: { column: 'amount', type: 'number', defaultValue: 0 },
    paymentMethod: 'payment_method',
    status: 'status',
    cardLast4: 'card_last4',
    cardBrand: 'card_brand',
    authCode: 'auth_code',
    refundedAmount: { column: 'refunded_amount', type: 'number', defaultValue: 0 },
    refundedAt: { column: 'refunded_at', type: 'date' },
    refundReason: 'refund_reason',
    metadata: { column: 'metadata', type: 'json', defaultValue: {} },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for payment transactions
 *
 * Extends BaseSQLiteService with transaction-specific query methods:
 * - Ticket-based queries for checkout flow
 * - Date range queries for reporting
 * - SQL aggregation for totals (SUM instead of JS reduce)
 * - Payment method filtering for analytics
 *
 * @example
 * const service = new TransactionSQLiteService(db);
 * const ticketTransactions = await service.getByTicket(ticketId);
 * const totals = await service.getTotalByDateRange(storeId, startDate, endDate);
 */
export class TransactionSQLiteService extends BaseSQLiteService<Transaction, TransactionRow> {
  constructor(db: SQLiteAdapter) {
    super(db, transactionSchema);
  }

  /**
   * Get all transactions for a ticket
   *
   * Retrieves all payment transactions associated with a specific ticket.
   * Used in checkout flow and ticket detail views.
   *
   * @param ticketId - Ticket ID to filter by
   * @returns Transactions for the ticket, ordered by creation time
   */
  async getByTicket(ticketId: string): Promise<Transaction[]> {
    return this.findWhere('ticket_id = ?', [ticketId], 'created_at ASC');
  }

  /**
   * Get transactions by date range
   *
   * Retrieves all transactions within a time range for a store.
   * Uses SQL BETWEEN for efficient date filtering.
   * Only includes completed and partially_refunded transactions.
   *
   * @param storeId - Store ID to filter by
   * @param start - Start of date range (ISO string)
   * @param end - End of date range (ISO string)
   * @returns Transactions within the date range, ordered by creation time
   */
  async getByDateRange(storeId: string, start: string, end: string): Promise<Transaction[]> {
    return this.findWhere(
      'store_id = ? AND created_at >= ? AND created_at <= ? AND status IN (?, ?)',
      [storeId, start, end, 'completed', 'partially_refunded'],
      'created_at ASC'
    );
  }

  /**
   * Get total amounts by date range
   *
   * Uses SQL SUM aggregation for efficient totaling instead of loading
   * all records and using JavaScript reduce.
   *
   * @param storeId - Store ID to filter by
   * @param start - Start of date range (ISO string)
   * @param end - End of date range (ISO string)
   * @returns Aggregated totals for the date range
   */
  async getTotalByDateRange(storeId: string, start: string, end: string): Promise<TransactionTotals> {
    const sql = `
      SELECT
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        COALESCE(SUM(refunded_amount), 0) as refunded_amount
      FROM transactions
      WHERE store_id = ?
        AND created_at >= ?
        AND created_at <= ?
        AND status IN ('completed', 'partially_refunded')
    `;

    interface AggregateRow {
      total_amount: number;
      transaction_count: number;
      refunded_amount: number;
    }

    const result = await this.db.get<AggregateRow>(sql, [storeId, start, end]);

    return {
      totalAmount: result?.total_amount ?? 0,
      transactionCount: result?.transaction_count ?? 0,
      refundedAmount: result?.refunded_amount ?? 0,
      netAmount: (result?.total_amount ?? 0) - (result?.refunded_amount ?? 0),
    };
  }

  /**
   * Get transactions by payment method
   *
   * Retrieves all transactions for a specific payment method in a store.
   * Useful for payment analytics and reconciliation.
   *
   * @param storeId - Store ID to filter by
   * @param method - Payment method to filter by
   * @returns Transactions with the given payment method, ordered by creation time
   */
  async getByPaymentMethod(storeId: string, method: PaymentMethod): Promise<Transaction[]> {
    return this.findWhere(
      'store_id = ? AND payment_method = ?',
      [storeId, method],
      'created_at DESC'
    );
  }

  /**
   * Get transactions by client
   *
   * Retrieves all transactions for a specific client.
   * Useful for client history and loyalty tracking.
   *
   * @param clientId - Client ID to filter by
   * @returns Client transactions, ordered by creation time (most recent first)
   */
  async getByClient(clientId: string): Promise<Transaction[]> {
    return this.findWhere('client_id = ?', [clientId], 'created_at DESC');
  }

  /**
   * Get transactions by status
   *
   * Retrieves all transactions with a specific status for a store.
   *
   * @param storeId - Store ID to filter by
   * @param status - Transaction status to filter by
   * @returns Transactions with the given status, ordered by creation time
   */
  async getByStatus(storeId: string, status: TransactionStatus): Promise<Transaction[]> {
    return this.findWhere(
      'store_id = ? AND status = ?',
      [storeId, status],
      'created_at DESC'
    );
  }

  /**
   * Get totals by payment method for a date range
   *
   * Uses SQL GROUP BY for efficient aggregation.
   *
   * @param storeId - Store ID to filter by
   * @param start - Start of date range (ISO string)
   * @param end - End of date range (ISO string)
   * @returns Array of totals by payment method
   */
  async getTotalsByPaymentMethod(
    storeId: string,
    start: string,
    end: string
  ): Promise<TotalsByPaymentMethod[]> {
    const sql = `
      SELECT
        payment_method,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE store_id = ?
        AND created_at >= ?
        AND created_at <= ?
        AND status IN ('completed', 'partially_refunded')
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;

    interface GroupRow {
      payment_method: string;
      total_amount: number;
      transaction_count: number;
    }

    const rows = await this.db.all<GroupRow>(sql, [storeId, start, end]);

    return rows.map((row) => ({
      paymentMethod: row.payment_method as PaymentMethod,
      totalAmount: row.total_amount,
      transactionCount: row.transaction_count,
    }));
  }

  /**
   * Get all transactions for a store
   *
   * Retrieves all transactions for a store with pagination.
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns Transactions for the store, ordered by creation time descending
   */
  async getByStore(storeId: string, limit: number = 1000, offset: number = 0): Promise<Transaction[]> {
    return this.findWhere('store_id = ?', [storeId], 'created_at DESC', limit, offset);
  }

  /**
   * Count transactions by status
   *
   * Returns the count of transactions with a specific status for a store.
   * Useful for dashboard metrics.
   *
   * @param storeId - Store ID to filter by
   * @param status - Transaction status to count
   * @returns Count of transactions with the given status
   */
  async countByStatus(storeId: string, status: TransactionStatus): Promise<number> {
    return this.countWhere('store_id = ? AND status = ?', [storeId, status]);
  }

  /**
   * Update transaction status
   *
   * Quick method to update just the status of a transaction.
   * Also updates the updatedAt timestamp.
   *
   * @param id - Transaction ID
   * @param status - New status
   * @returns Updated transaction or undefined if not found
   */
  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction | undefined> {
    return this.update(id, { status } as Partial<Transaction>);
  }

  /**
   * Record a refund
   *
   * Updates the transaction with refund information.
   *
   * @param id - Transaction ID
   * @param amount - Amount refunded
   * @param reason - Reason for refund
   * @returns Updated transaction or undefined if not found
   */
  async recordRefund(
    id: string,
    amount: number,
    reason?: string
  ): Promise<Transaction | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    // Determine new status based on refund amount
    const totalRefunded = (existing.refundedAmount ?? 0) + amount;
    const isFullRefund = totalRefunded >= existing.amount;

    return this.update(id, {
      refundedAmount: totalRefunded,
      refundedAt: new Date().toISOString(),
      refundReason: reason,
      status: isFullRefund ? 'refunded' : 'partially_refunded',
    } as Partial<Transaction>);
  }

  /**
   * Void a transaction
   *
   * Sets transaction status to 'voided'.
   *
   * @param id - Transaction ID
   * @returns Updated transaction or undefined if not found
   */
  async void(id: string): Promise<Transaction | undefined> {
    return this.update(id, { status: 'voided' } as Partial<Transaction>);
  }

  /**
   * Get today's total
   *
   * Convenience method for getting the total amount for today.
   *
   * @param storeId - Store ID to filter by
   * @returns Today's transaction totals
   */
  async getTodayTotal(storeId: string): Promise<TransactionTotals> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    return this.getTotalByDateRange(storeId, startOfDay, endOfDay);
  }
}
