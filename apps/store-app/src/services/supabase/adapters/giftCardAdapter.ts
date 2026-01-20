/**
 * Gift Card Type Adapter
 *
 * Converts between Supabase GiftCardRow/GiftCardTransactionRow and app GiftCard/GiftCardTransaction types.
 * Handles the mapping between snake_case (Supabase) and camelCase (app) naming.
 */

import type {
  GiftCardRow,
  GiftCardInsert,
  GiftCardUpdate,
  GiftCardTransactionRow,
  GiftCardTransactionInsert,
  GiftCardStatus as SupabaseGiftCardStatus,
  GiftCardTransactionType as SupabaseTransactionType,
} from '../types';
import type {
  GiftCard,
  GiftCardTransaction,
  GiftCardStatus as AppGiftCardStatus,
  GiftCardTransactionType as AppTransactionType,
} from '../../../types/gift-card';

// ============================================================================
// STATUS MAPPING
// ============================================================================

/**
 * Map Supabase status to app status
 * Supabase: 'active' | 'used' | 'expired' | 'cancelled' | 'pending'
 * App: 'active' | 'depleted' | 'expired' | 'voided'
 */
function mapStatusToApp(supabaseStatus: SupabaseGiftCardStatus): AppGiftCardStatus {
  switch (supabaseStatus) {
    case 'active':
      return 'active';
    case 'used':
      return 'depleted';
    case 'expired':
      return 'expired';
    case 'cancelled':
    case 'pending':
      return 'voided';
    default:
      return 'active';
  }
}

/**
 * Map app status to Supabase status
 */
function mapStatusToSupabase(appStatus: AppGiftCardStatus): SupabaseGiftCardStatus {
  switch (appStatus) {
    case 'active':
      return 'active';
    case 'depleted':
      return 'used';
    case 'expired':
      return 'expired';
    case 'voided':
      return 'cancelled';
    default:
      return 'active';
  }
}

/**
 * Map Supabase transaction type to app transaction type
 * Supabase: 'purchase' | 'redemption' | 'reload' | 'refund' | 'adjustment' | 'expiry'
 * App: 'purchase' | 'redeem' | 'reload' | 'void' | 'refund'
 */
function mapTransactionTypeToApp(supabaseType: SupabaseTransactionType): AppTransactionType {
  switch (supabaseType) {
    case 'purchase':
      return 'purchase';
    case 'redemption':
      return 'redeem';
    case 'reload':
      return 'reload';
    case 'refund':
      return 'refund';
    case 'adjustment':
    case 'expiry':
      return 'void';
    default:
      return 'purchase';
  }
}

/**
 * Map app transaction type to Supabase transaction type
 */
function mapTransactionTypeToSupabase(appType: AppTransactionType): SupabaseTransactionType {
  switch (appType) {
    case 'purchase':
      return 'purchase';
    case 'redeem':
      return 'redemption';
    case 'reload':
      return 'reload';
    case 'refund':
      return 'refund';
    case 'void':
      return 'adjustment';
    default:
      return 'purchase';
  }
}

// ============================================================================
// GIFT CARD ADAPTERS
// ============================================================================

/**
 * Convert Supabase GiftCardRow to app GiftCard type
 */
export function toGiftCard(row: GiftCardRow): GiftCard {
  return {
    id: row.id,
    tenantId: (row as Record<string, unknown>).tenant_id as string || '',
    storeId: row.store_id,
    code: row.code,
    type: row.delivery_method === 'physical' ? 'physical' : 'digital',
    originalAmount: row.initial_balance,
    currentBalance: row.current_balance,
    purchaserId: row.purchased_by || undefined,
    recipientName: row.recipient_name || undefined,
    recipientEmail: row.recipient_email || undefined,
    recipientPhone: row.recipient_phone || undefined,
    message: row.personal_message || undefined,
    designId: row.design_template !== 'default' ? row.design_template : undefined,
    issuedAt: row.purchased_at || row.created_at,
    expiresAt: row.expires_at || undefined,
    status: mapStatusToApp(row.status),
    lastUsedAt: row.updated_at,
    purchaseTicketId: row.order_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: (row as Record<string, unknown>).created_by as string || 'system',
    createdByDevice: (row as Record<string, unknown>).created_by_device as string || 'unknown',
    lastModifiedBy: (row as Record<string, unknown>).last_modified_by as string || 'system',
    lastModifiedByDevice: (row as Record<string, unknown>).last_modified_by_device as string || 'unknown',
    isDeleted: false,
    deletedAt: (row as Record<string, unknown>).deleted_at as string | undefined,
    syncStatus: 'synced',
    version: 1,
    vectorClock: {},
    lastSyncedVersion: 1,
  };
}

/**
 * Convert multiple Supabase rows to app GiftCard array
 */
export function toGiftCards(rows: GiftCardRow[]): GiftCard[] {
  return rows.map(toGiftCard);
}

/**
 * Convert app GiftCard to Supabase GiftCardInsert
 */
export function toGiftCardInsert(
  giftCard: Omit<GiftCard, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
  storeId?: string
): GiftCardInsert {
  return {
    store_id: storeId || giftCard.storeId,
    code: giftCard.code,
    initial_balance: giftCard.originalAmount,
    current_balance: giftCard.currentBalance,
    status: mapStatusToSupabase(giftCard.status),
    card_type: 'standard',
    purchased_by: giftCard.purchaserId || null,
    purchased_at: giftCard.issuedAt,
    purchase_amount: giftCard.originalAmount,
    recipient_name: giftCard.recipientName || null,
    recipient_email: giftCard.recipientEmail || null,
    recipient_phone: giftCard.recipientPhone || null,
    personal_message: giftCard.message || null,
    delivery_method: giftCard.type === 'physical' ? 'physical' : 'email',
    design_template: giftCard.designId || 'default',
    expires_at: giftCard.expiresAt || null,
    is_reloadable: true,
  };
}

/**
 * Convert partial GiftCard updates to Supabase GiftCardUpdate
 */
export function toGiftCardUpdate(updates: Partial<GiftCard>): GiftCardUpdate {
  const result: GiftCardUpdate = {};

  if (updates.currentBalance !== undefined) {
    result.current_balance = updates.currentBalance;
  }
  if (updates.status !== undefined) {
    result.status = mapStatusToSupabase(updates.status);
  }
  if (updates.recipientName !== undefined) {
    result.recipient_name = updates.recipientName || null;
  }
  if (updates.recipientEmail !== undefined) {
    result.recipient_email = updates.recipientEmail || null;
  }
  if (updates.recipientPhone !== undefined) {
    result.recipient_phone = updates.recipientPhone || null;
  }
  if (updates.message !== undefined) {
    result.personal_message = updates.message || null;
  }
  if (updates.expiresAt !== undefined) {
    result.expires_at = updates.expiresAt || null;
  }

  return result;
}

// ============================================================================
// GIFT CARD TRANSACTION ADAPTERS
// ============================================================================

/**
 * Convert Supabase GiftCardTransactionRow to app GiftCardTransaction type
 */
export function toGiftCardTransaction(row: GiftCardTransactionRow): GiftCardTransaction {
  return {
    id: row.id,
    tenantId: (row as Record<string, unknown>).tenant_id as string || '',
    storeId: row.store_id,
    giftCardId: row.gift_card_id,
    type: mapTransactionTypeToApp(row.transaction_type),
    amount: row.amount,
    balanceAfter: row.balance_after,
    ticketId: row.ticket_id || undefined,
    staffId: row.performed_by || undefined,
    staffName: undefined, // Will need to be populated separately if needed
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.created_at, // Transactions are immutable
    createdBy: row.performed_by || 'system',
    createdByDevice: (row as Record<string, unknown>).created_by_device as string || 'unknown',
    lastModifiedBy: row.performed_by || 'system',
    lastModifiedByDevice: (row as Record<string, unknown>).last_modified_by_device as string || 'unknown',
    isDeleted: false,
    deletedAt: undefined,
    syncStatus: 'synced',
    version: 1,
    vectorClock: {},
    lastSyncedVersion: 1,
  };
}

/**
 * Convert multiple Supabase rows to app GiftCardTransaction array
 */
export function toGiftCardTransactions(rows: GiftCardTransactionRow[]): GiftCardTransaction[] {
  return rows.map(toGiftCardTransaction);
}

/**
 * Convert app GiftCardTransaction to Supabase GiftCardTransactionInsert
 */
export function toGiftCardTransactionInsert(
  transaction: Omit<GiftCardTransaction, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
  options?: { balanceBefore?: number }
): GiftCardTransactionInsert {
  return {
    gift_card_id: transaction.giftCardId,
    store_id: transaction.storeId,
    transaction_type: mapTransactionTypeToSupabase(transaction.type),
    amount: transaction.amount,
    balance_before: options?.balanceBefore ?? (transaction.balanceAfter - transaction.amount),
    balance_after: transaction.balanceAfter,
    ticket_id: transaction.ticketId || null,
    client_id: null, // Would need to be passed separately
    notes: transaction.notes || null,
    performed_by: transaction.staffId || null,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a GiftCardRow represents an active, redeemable card
 */
export function isRowRedeemable(row: GiftCardRow): boolean {
  if (row.status !== 'active') return false;
  if (row.current_balance <= 0) return false;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return false;
  return true;
}

/**
 * Get display-friendly status from GiftCardRow
 */
export function getRowStatusDisplay(row: GiftCardRow): {
  label: string;
  color: string;
  bgColor: string;
} {
  const appStatus = mapStatusToApp(row.status);

  switch (appStatus) {
    case 'active':
      return { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'depleted':
      return { label: 'Depleted', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'expired':
      return { label: 'Expired', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'voided':
      return { label: 'Voided', color: 'text-red-700', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}
