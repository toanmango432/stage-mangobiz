/**
 * Transaction Type Adapter
 *
 * Converts between Supabase TransactionRow and app Transaction types.
 */

import type { TransactionRow, TransactionInsert, TransactionUpdate } from '../types';
import type { Transaction } from '@/types/transaction';
import type { TransactionStatus, PaymentMethod, SyncStatus } from '@/types/common';

/**
 * Convert Supabase TransactionRow to app Transaction type
 */
export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    storeId: row.store_id,
    ticketId: row.ticket_id || '',
    ticketNumber: 0, // Not stored in Supabase row - computed at runtime
    clientId: row.client_id || undefined,
    clientName: '', // Not stored in Supabase row
    // Correct formula: subtotal = total - tip (when tax=0 and discount=0)
    // Using total - tip because total = subtotal + tax + tip - discount
    subtotal: row.total - row.tip,
    tax: 0, // TODO: Add tax column to Supabase transactions table
    tip: row.tip,
    discount: 0, // TODO: Add discount column to Supabase transactions table
    amount: row.amount,
    total: row.total,
    paymentMethod: row.payment_method as PaymentMethod,
    paymentDetails: {}, // Not stored in current Supabase schema
    status: row.status as TransactionStatus,
    createdAt: row.created_at, // ISO string (UTC)
    syncStatus: row.sync_status as SyncStatus,
  };
}

/**
 * Convert app Transaction to Supabase TransactionInsert
 */
export function toTransactionInsert(
  transaction: Omit<Transaction, 'id' | 'createdAt'>,
  storeId?: string
): Omit<TransactionInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || transaction.storeId,
    ticket_id: transaction.ticketId || null,
    client_id: transaction.clientId || null,
    type: 'payment', // Default type
    payment_method: transaction.paymentMethod,
    amount: transaction.amount,
    tip: transaction.tip,
    total: transaction.total,
    status: transaction.status,
    sync_status: transaction.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial Transaction updates to Supabase TransactionUpdate
 */
export function toTransactionUpdate(updates: Partial<Transaction>): TransactionUpdate {
  const result: TransactionUpdate = {};

  if (updates.ticketId !== undefined) {
    result.ticket_id = updates.ticketId || null;
  }
  if (updates.clientId !== undefined) {
    result.client_id = updates.clientId || null;
  }
  if (updates.paymentMethod !== undefined) {
    result.payment_method = updates.paymentMethod;
  }
  if (updates.amount !== undefined) {
    result.amount = updates.amount;
  }
  if (updates.tip !== undefined) {
    result.tip = updates.tip;
  }
  if (updates.total !== undefined) {
    result.total = updates.total;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

/**
 * Convert array of TransactionRows to Transactions
 */
export function toTransactions(rows: TransactionRow[]): Transaction[] {
  return rows.map(toTransaction);
}
