/**
 * Gift Card SQLite Services
 *
 * This file contains SQLite service implementations for all gift card-related tables:
 * - GiftCardDenomination - Preset gift card amounts for quick sale
 * - GiftCardSettings - Per-salon gift card configuration
 * - GiftCard - Gift card entities with balance tracking
 * - GiftCardTransaction - Transaction history for gift cards
 * - GiftCardDesign - Gift card design templates
 *
 * @module sqlite-adapter/services/giftCardServices
 */

import type { SQLiteAdapter } from '../types';
import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';
import { toISOString } from '../utils';

// ==================== COMMON TYPES ====================

/**
 * Sync status for gift card entities
 */
export type GiftCardSyncStatus = 'synced' | 'pending' | 'local' | 'conflict';

// ==================== GIFT CARD DENOMINATION ====================

/**
 * Gift card denomination entity - Preset gift card amounts for quick sale
 */
export interface GiftCardDenomination extends Record<string, unknown> {
  id: string;
  storeId: string;
  amount: number;
  label?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: GiftCardSyncStatus;
}

/**
 * Gift card denomination row - SQLite row format
 */
export interface GiftCardDenominationRow {
  id: string;
  store_id: string;
  amount: number;
  label: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const giftCardDenominationSchema: TableSchema = {
  tableName: 'gift_card_denominations',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    amount: { column: 'amount', type: 'number' },
    label: 'label',
    isActive: { column: 'is_active', type: 'boolean' },
    displayOrder: { column: 'display_order', type: 'number' },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Gift Card Denomination SQLite Service
 * Manages preset gift card amounts for quick sale during checkout
 */
export class GiftCardDenominationSQLiteService extends BaseSQLiteService<GiftCardDenomination, GiftCardDenominationRow> {
  constructor(db: SQLiteAdapter) {
    super(db, giftCardDenominationSchema);
  }

  /**
   * Get active denominations for a store, ordered by display order
   */
  async getActive(storeId: string): Promise<GiftCardDenomination[]> {
    return this.findWhere('store_id = ? AND is_active = 1', [storeId], 'display_order ASC');
  }

  /**
   * Get all denominations for a store
   */
  async getByStore(storeId: string): Promise<GiftCardDenomination[]> {
    return this.findWhere('store_id = ?', [storeId], 'display_order ASC');
  }

  /**
   * Get denomination by amount (for duplicate checking)
   */
  async getByAmount(storeId: string, amount: number): Promise<GiftCardDenomination | null> {
    const result = await this.findOneWhere('store_id = ? AND amount = ?', [storeId, amount]);
    return result ?? null;
  }

  /**
   * Update display order for multiple denominations
   */
  async updateDisplayOrder(updates: Array<{ id: string; displayOrder: number }>): Promise<void> {
    const now = toISOString(new Date());
    for (const { id, displayOrder } of updates) {
      await this.db.run(
        `UPDATE ${this.schema.tableName} SET display_order = ?, updated_at = ? WHERE id = ?`,
        [displayOrder, now, id]
      );
    }
  }

  /**
   * Activate a denomination
   */
  async activate(id: string): Promise<void> {
    const now = toISOString(new Date());
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_active = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Deactivate a denomination
   */
  async deactivate(id: string): Promise<void> {
    const now = toISOString(new Date());
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_active = 0, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Get count of active denominations for a store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }
}

// ==================== GIFT CARD SETTINGS ====================

/**
 * Gift card settings entity - Per-salon gift card configuration
 */
export interface GiftCardSettingsEntity extends Record<string, unknown> {
  id: string;
  storeId: string;
  allowCustomAmount: boolean;
  minAmount: number;
  maxAmount: number;
  defaultExpirationDays?: number;
  onlineEnabled: boolean;
  emailDeliveryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: GiftCardSyncStatus;
}

/**
 * Gift card settings row - SQLite row format
 */
export interface GiftCardSettingsRow {
  id: string;
  store_id: string;
  allow_custom_amount: number;
  min_amount: number;
  max_amount: number;
  default_expiration_days: number | null;
  online_enabled: number;
  email_delivery_enabled: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const giftCardSettingsSchema: TableSchema = {
  tableName: 'gift_card_settings',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    allowCustomAmount: { column: 'allow_custom_amount', type: 'boolean' },
    minAmount: { column: 'min_amount', type: 'number' },
    maxAmount: { column: 'max_amount', type: 'number' },
    defaultExpirationDays: { column: 'default_expiration_days', type: 'number' },
    onlineEnabled: { column: 'online_enabled', type: 'boolean' },
    emailDeliveryEnabled: { column: 'email_delivery_enabled', type: 'boolean' },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Gift Card Settings SQLite Service
 * Manages per-store gift card configuration (custom amounts, expiration, delivery)
 */
export class GiftCardSettingsSQLiteService extends BaseSQLiteService<GiftCardSettingsEntity, GiftCardSettingsRow> {
  constructor(db: SQLiteAdapter) {
    super(db, giftCardSettingsSchema);
  }

  /**
   * Get settings for a store
   */
  async get(storeId: string): Promise<GiftCardSettingsEntity | null> {
    const result = await this.findOneWhere('store_id = ?', [storeId]);
    return result ?? null;
  }

  /**
   * Upsert settings for a store (create or update)
   */
  async set(storeId: string, settings: Partial<GiftCardSettingsEntity>): Promise<GiftCardSettingsEntity> {
    const existing = await this.get(storeId);
    const now = toISOString(new Date());

    if (existing) {
      // Update existing settings - explicitly extract only defined values
      const updateData: Record<string, unknown> = { updatedAt: now };
      if (settings.allowCustomAmount !== undefined) updateData.allowCustomAmount = settings.allowCustomAmount;
      if (settings.minAmount !== undefined) updateData.minAmount = settings.minAmount;
      if (settings.maxAmount !== undefined) updateData.maxAmount = settings.maxAmount;
      if (settings.defaultExpirationDays !== undefined) updateData.defaultExpirationDays = settings.defaultExpirationDays;
      if (settings.onlineEnabled !== undefined) updateData.onlineEnabled = settings.onlineEnabled;
      if (settings.emailDeliveryEnabled !== undefined) updateData.emailDeliveryEnabled = settings.emailDeliveryEnabled;

      const updated = await this.update(existing.id, updateData as Partial<GiftCardSettingsEntity>);
      return updated!;
    } else {
      // Create new settings with defaults
      const newSettings: Omit<GiftCardSettingsEntity, 'id'> = {
        storeId,
        allowCustomAmount: settings.allowCustomAmount ?? true,
        minAmount: settings.minAmount ?? 10,
        maxAmount: settings.maxAmount ?? 500,
        defaultExpirationDays: settings.defaultExpirationDays,
        onlineEnabled: settings.onlineEnabled ?? false,
        emailDeliveryEnabled: settings.emailDeliveryEnabled ?? false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      };
      return this.create(newSettings);
    }
  }

  /**
   * Get settings or create with defaults
   */
  async getOrCreate(storeId: string): Promise<GiftCardSettingsEntity> {
    const existing = await this.get(storeId);
    if (existing) return existing;
    return this.set(storeId, {});
  }
}

// ==================== GIFT CARD ====================

/**
 * Gift card type - physical or digital
 */
export type GiftCardType = 'physical' | 'digital';

/**
 * Gift card status
 */
export type GiftCardStatus = 'active' | 'depleted' | 'expired' | 'voided';

/**
 * Gift card delivery method
 */
export type GiftCardDeliveryMethod = 'email' | 'sms' | 'print' | 'none';

/**
 * Gift card entity - Full gift card support
 */
export interface GiftCard extends Record<string, unknown> {
  id: string;
  storeId: string;
  code: string;
  type: GiftCardType;
  originalAmount: number;
  currentBalance: number;
  purchaserId?: string;
  purchaserName?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  designId?: string;
  issuedAt: string;
  expiresAt?: string;
  status: GiftCardStatus;
  lastUsedAt?: string;
  purchaseTicketId?: string;
  deliveryMethod?: GiftCardDeliveryMethod;
  scheduledDeliveryAt?: string;
  deliveredAt?: string;
  isReloadable?: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: GiftCardSyncStatus;
}

/**
 * Gift card row - SQLite row format
 */
export interface GiftCardRow {
  id: string;
  store_id: string;
  code: string;
  type: string;
  original_amount: number;
  current_balance: number;
  purchaser_id: string | null;
  purchaser_name: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  message: string | null;
  design_id: string | null;
  issued_at: string;
  expires_at: string | null;
  status: string;
  last_used_at: string | null;
  purchase_ticket_id: string | null;
  delivery_method: string | null;
  scheduled_delivery_at: string | null;
  delivered_at: string | null;
  is_reloadable: number | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const giftCardSchema: TableSchema = {
  tableName: 'gift_cards',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    code: 'code',
    type: 'type',
    originalAmount: { column: 'original_amount', type: 'number' },
    currentBalance: { column: 'current_balance', type: 'number' },
    purchaserId: 'purchaser_id',
    purchaserName: 'purchaser_name',
    recipientName: 'recipient_name',
    recipientEmail: 'recipient_email',
    recipientPhone: 'recipient_phone',
    message: 'message',
    designId: 'design_id',
    issuedAt: { column: 'issued_at', type: 'date' },
    expiresAt: { column: 'expires_at', type: 'date' },
    status: 'status',
    lastUsedAt: { column: 'last_used_at', type: 'date' },
    purchaseTicketId: 'purchase_ticket_id',
    deliveryMethod: 'delivery_method',
    scheduledDeliveryAt: { column: 'scheduled_delivery_at', type: 'date' },
    deliveredAt: { column: 'delivered_at', type: 'date' },
    isReloadable: { column: 'is_reloadable', type: 'boolean' },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Gift Card SQLite Service
 * Manages gift card entities with balance tracking and redemption
 */
export class GiftCardSQLiteService extends BaseSQLiteService<GiftCard, GiftCardRow> {
  constructor(db: SQLiteAdapter) {
    super(db, giftCardSchema);
  }

  /**
   * Get gift card by unique redemption code
   */
  async getByCode(code: string): Promise<GiftCard | null> {
    const result = await this.findOneWhere('code = ?', [code]);
    return result ?? null;
  }

  /**
   * Get gift card by code within a specific store
   */
  async getByStoreAndCode(storeId: string, code: string): Promise<GiftCard | null> {
    const result = await this.findOneWhere('store_id = ? AND code = ?', [storeId, code]);
    return result ?? null;
  }

  /**
   * Get gift cards by status
   */
  async getByStatus(storeId: string, status: GiftCardStatus): Promise<GiftCard[]> {
    return this.findWhere('store_id = ? AND status = ?', [storeId, status], 'created_at DESC');
  }

  /**
   * Get gift cards purchased by a client
   */
  async getByPurchaser(purchaserId: string): Promise<GiftCard[]> {
    return this.findWhere('purchaser_id = ?', [purchaserId], 'created_at DESC');
  }

  /**
   * Get all gift cards for a store
   */
  async getByStore(storeId: string, limit?: number): Promise<GiftCard[]> {
    if (limit) {
      const rows = await this.db.all<GiftCardRow>(
        `SELECT * FROM ${this.schema.tableName} WHERE store_id = ? ORDER BY created_at DESC LIMIT ?`,
        [storeId, limit]
      );
      return rows.map((row) => this.rowToEntity(row));
    }
    return this.findWhere('store_id = ?', [storeId], 'created_at DESC');
  }

  /**
   * Get active gift cards for a store (can be redeemed)
   */
  async getActive(storeId: string): Promise<GiftCard[]> {
    return this.findWhere(
      'store_id = ? AND status = ? AND current_balance > 0',
      [storeId, 'active'],
      'created_at DESC'
    );
  }

  /**
   * Get gift cards expiring within a date range
   */
  async getExpiringSoon(storeId: string, withinDays: number): Promise<GiftCard[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return this.findWhere(
      'store_id = ? AND status = ? AND expires_at IS NOT NULL AND expires_at >= ? AND expires_at <= ?',
      [storeId, 'active', toISOString(now), toISOString(futureDate)],
      'expires_at ASC'
    );
  }

  /**
   * Get expired gift cards that need status update
   */
  async getExpired(storeId: string): Promise<GiftCard[]> {
    const now = toISOString(new Date());
    return this.findWhere(
      'store_id = ? AND status = ? AND expires_at IS NOT NULL AND expires_at < ?',
      [storeId, 'active', now],
      'expires_at ASC'
    );
  }

  /**
   * Calculate gift card balance from transactions (for verification)
   * Balance = originalAmount + SUM(transactions.amount)
   */
  async calculateBalance(giftCardId: string): Promise<number> {
    const row = await this.db.get<{ original_amount: number; transaction_sum: number | null }>(
      `SELECT
        gc.original_amount,
        COALESCE(SUM(gct.amount), 0) as transaction_sum
      FROM ${this.schema.tableName} gc
      LEFT JOIN gift_card_transactions gct ON gct.gift_card_id = gc.id
      WHERE gc.id = ?
      GROUP BY gc.id`,
      [giftCardId]
    );
    if (!row) return 0;
    return row.original_amount + (row.transaction_sum ?? 0);
  }

  /**
   * Update gift card balance after transaction
   */
  async updateBalance(id: string, newBalance: number): Promise<void> {
    const now = toISOString(new Date());
    const status: GiftCardStatus = newBalance <= 0 ? 'depleted' : 'active';
    await this.db.run(
      `UPDATE ${this.schema.tableName}
       SET current_balance = ?, status = ?, last_used_at = ?, updated_at = ?
       WHERE id = ?`,
      [newBalance, status, now, now, id]
    );
  }

  /**
   * Void a gift card
   */
  async void(id: string): Promise<void> {
    const now = toISOString(new Date());
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET status = 'voided', updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Mark expired gift cards as expired
   */
  async markExpiredCards(storeId: string): Promise<number> {
    const now = toISOString(new Date());
    const result = await this.db.run(
      `UPDATE ${this.schema.tableName}
       SET status = 'expired', updated_at = ?
       WHERE store_id = ? AND status = 'active' AND expires_at IS NOT NULL AND expires_at < ?`,
      [now, storeId, now]
    );
    return result.changes ?? 0;
  }

  /**
   * Get total outstanding gift card balance for a store
   */
  async getTotalOutstandingBalance(storeId: string): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      `SELECT COALESCE(SUM(current_balance), 0) as total
       FROM ${this.schema.tableName}
       WHERE store_id = ? AND status = 'active'`,
      [storeId]
    );
    return row?.total ?? 0;
  }

  /**
   * Count gift cards by status for a store
   */
  async countByStatus(storeId: string): Promise<Record<GiftCardStatus, number>> {
    const result: Record<GiftCardStatus, number> = {
      active: 0,
      depleted: 0,
      expired: 0,
      voided: 0,
    };
    const rows = await this.db.all<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count
       FROM ${this.schema.tableName}
       WHERE store_id = ?
       GROUP BY status`,
      [storeId]
    );
    for (const row of rows) {
      if (row.status in result) {
        result[row.status as GiftCardStatus] = row.count;
      }
    }
    return result;
  }

  /**
   * Search gift cards by code, recipient name, or purchaser name
   */
  async search(storeId: string, query: string, limit = 50): Promise<GiftCard[]> {
    const likePattern = `%${query}%`;
    const rows = await this.db.all<GiftCardRow>(
      `SELECT * FROM ${this.schema.tableName}
       WHERE store_id = ?
         AND (code LIKE ? OR recipient_name LIKE ? OR purchaser_name LIKE ?)
       ORDER BY created_at DESC
       LIMIT ?`,
      [storeId, likePattern, likePattern, likePattern, limit]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Mark gift card as delivered
   */
  async markDelivered(id: string): Promise<void> {
    const now = toISOString(new Date());
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET delivered_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
  }

  /**
   * Get gift cards pending delivery
   */
  async getPendingDelivery(storeId: string): Promise<GiftCard[]> {
    return this.findWhere(
      'store_id = ? AND type = ? AND delivered_at IS NULL AND (scheduled_delivery_at IS NULL OR scheduled_delivery_at <= ?)',
      [storeId, 'digital', toISOString(new Date())],
      'created_at ASC'
    );
  }
}

// ==================== GIFT CARD TRANSACTION ====================

/**
 * Gift card transaction type
 */
export type GiftCardTransactionType = 'purchase' | 'redeem' | 'reload' | 'void' | 'refund';

/**
 * Gift card transaction entity - Transaction history for gift cards
 */
export interface GiftCardTransaction extends Record<string, unknown> {
  id: string;
  storeId: string;
  giftCardId: string;
  type: GiftCardTransactionType;
  amount: number;
  balanceAfter: number;
  ticketId?: string;
  staffId?: string;
  staffName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: GiftCardSyncStatus;
}

/**
 * Gift card transaction row - SQLite row format
 */
export interface GiftCardTransactionRow {
  id: string;
  store_id: string;
  gift_card_id: string;
  type: string;
  amount: number;
  balance_after: number;
  ticket_id: string | null;
  staff_id: string | null;
  staff_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const giftCardTransactionSchema: TableSchema = {
  tableName: 'gift_card_transactions',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    giftCardId: 'gift_card_id',
    type: 'type',
    amount: { column: 'amount', type: 'number' },
    balanceAfter: { column: 'balance_after', type: 'number' },
    ticketId: 'ticket_id',
    staffId: 'staff_id',
    staffName: 'staff_name',
    notes: 'notes',
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Gift Card Transaction SQLite Service
 * Tracks all gift card balance changes (purchase, redeem, reload, void, refund)
 */
export class GiftCardTransactionSQLiteService extends BaseSQLiteService<GiftCardTransaction, GiftCardTransactionRow> {
  constructor(db: SQLiteAdapter) {
    super(db, giftCardTransactionSchema);
  }

  /**
   * Get all transactions for a gift card
   */
  async getByCard(giftCardId: string): Promise<GiftCardTransaction[]> {
    return this.findWhere('gift_card_id = ?', [giftCardId], 'created_at DESC');
  }

  /**
   * Get transactions associated with a ticket
   */
  async getByTicket(ticketId: string): Promise<GiftCardTransaction[]> {
    return this.findWhere('ticket_id = ?', [ticketId], 'created_at DESC');
  }

  /**
   * Get transactions by type for a store
   */
  async getByType(storeId: string, type: GiftCardTransactionType): Promise<GiftCardTransaction[]> {
    return this.findWhere('store_id = ? AND type = ?', [storeId, type], 'created_at DESC');
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(storeId: string, start: string, end: string): Promise<GiftCardTransaction[]> {
    return this.findWhere(
      'store_id = ? AND created_at >= ? AND created_at <= ?',
      [storeId, start, end],
      'created_at DESC'
    );
  }

  /**
   * Get transaction totals by type for reporting
   */
  async getTotalsByType(
    storeId: string,
    start: string,
    end: string
  ): Promise<Record<GiftCardTransactionType, number>> {
    const result: Record<GiftCardTransactionType, number> = {
      purchase: 0,
      redeem: 0,
      reload: 0,
      void: 0,
      refund: 0,
    };
    const rows = await this.db.all<{ type: string; total: number | null }>(
      `SELECT type, COALESCE(SUM(ABS(amount)), 0) as total
       FROM ${this.schema.tableName}
       WHERE store_id = ? AND created_at >= ? AND created_at <= ?
       GROUP BY type`,
      [storeId, start, end]
    );
    for (const row of rows) {
      if (row.type in result) {
        result[row.type as GiftCardTransactionType] = row.total ?? 0;
      }
    }
    return result;
  }

  /**
   * Get total redemptions for a date range
   */
  async getTotalRedemptions(storeId: string, start: string, end: string): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      `SELECT COALESCE(SUM(ABS(amount)), 0) as total
       FROM ${this.schema.tableName}
       WHERE store_id = ? AND type = 'redeem' AND created_at >= ? AND created_at <= ?`,
      [storeId, start, end]
    );
    return row?.total ?? 0;
  }

  /**
   * Get total sales (purchases + reloads) for a date range
   */
  async getTotalSales(storeId: string, start: string, end: string): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM ${this.schema.tableName}
       WHERE store_id = ? AND type IN ('purchase', 'reload') AND created_at >= ? AND created_at <= ?`,
      [storeId, start, end]
    );
    return row?.total ?? 0;
  }

  /**
   * Get recent transactions for a store
   */
  async getRecent(storeId: string, limit = 50): Promise<GiftCardTransaction[]> {
    const rows = await this.db.all<GiftCardTransactionRow>(
      `SELECT * FROM ${this.schema.tableName}
       WHERE store_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [storeId, limit]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Count transactions by type for a store
   */
  async countByType(storeId: string): Promise<Record<GiftCardTransactionType, number>> {
    const result: Record<GiftCardTransactionType, number> = {
      purchase: 0,
      redeem: 0,
      reload: 0,
      void: 0,
      refund: 0,
    };
    const rows = await this.db.all<{ type: string; count: number }>(
      `SELECT type, COUNT(*) as count
       FROM ${this.schema.tableName}
       WHERE store_id = ?
       GROUP BY type`,
      [storeId]
    );
    for (const row of rows) {
      if (row.type in result) {
        result[row.type as GiftCardTransactionType] = row.count;
      }
    }
    return result;
  }
}

// ==================== GIFT CARD DESIGN ====================

/**
 * Gift card design category
 */
export type GiftCardDesignCategory = 'seasonal' | 'birthday' | 'thank-you' | 'general' | 'custom';

/**
 * Gift card design entity - Design templates for gift cards
 */
export interface GiftCardDesign extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: GiftCardDesignCategory;
  isActive: boolean;
  isDefault?: boolean;
  backgroundColor?: string;
  textColor?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: GiftCardSyncStatus;
}

/**
 * Gift card design row - SQLite row format
 */
export interface GiftCardDesignRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category: string;
  is_active: number;
  is_default: number | null;
  background_color: string | null;
  text_color: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const giftCardDesignSchema: TableSchema = {
  tableName: 'gift_card_designs',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    imageUrl: 'image_url',
    thumbnailUrl: 'thumbnail_url',
    category: 'category',
    isActive: { column: 'is_active', type: 'boolean' },
    isDefault: { column: 'is_default', type: 'boolean' },
    backgroundColor: 'background_color',
    textColor: 'text_color',
    displayOrder: { column: 'display_order', type: 'number' },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: 'sync_status',
  },
};

/**
 * Gift Card Design SQLite Service
 * Manages gift card design templates for visual customization
 */
export class GiftCardDesignSQLiteService extends BaseSQLiteService<GiftCardDesign, GiftCardDesignRow> {
  constructor(db: SQLiteAdapter) {
    super(db, giftCardDesignSchema);
  }

  /**
   * Get active designs for a store
   */
  async getActive(storeId: string): Promise<GiftCardDesign[]> {
    return this.findWhere('store_id = ? AND is_active = 1', [storeId], 'display_order ASC');
  }

  /**
   * Get default design for a store
   */
  async getDefault(storeId: string): Promise<GiftCardDesign | null> {
    const result = await this.findOneWhere('store_id = ? AND is_default = 1', [storeId]);
    return result ?? null;
  }

  /**
   * Get all designs for a store
   */
  async getByStore(storeId: string): Promise<GiftCardDesign[]> {
    return this.findWhere('store_id = ?', [storeId], 'display_order ASC');
  }

  /**
   * Get designs by category
   */
  async getByCategory(storeId: string, category: GiftCardDesignCategory): Promise<GiftCardDesign[]> {
    return this.findWhere(
      'store_id = ? AND category = ? AND is_active = 1',
      [storeId, category],
      'display_order ASC'
    );
  }

  /**
   * Set a design as the default (unsets previous default)
   */
  async setDefault(id: string, storeId: string): Promise<void> {
    const now = toISOString(new Date());
    // Unset previous default
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_default = 0, updated_at = ? WHERE store_id = ? AND is_default = 1`,
      [now, storeId]
    );
    // Set new default
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_default = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Activate a design
   */
  async activate(id: string): Promise<void> {
    const now = toISOString(new Date());
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_active = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Deactivate a design
   */
  async deactivate(id: string): Promise<void> {
    const now = toISOString(new Date());
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_active = 0, is_default = 0, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Update display order for multiple designs
   */
  async updateDisplayOrder(updates: Array<{ id: string; displayOrder: number }>): Promise<void> {
    const now = toISOString(new Date());
    for (const { id, displayOrder } of updates) {
      await this.db.run(
        `UPDATE ${this.schema.tableName} SET display_order = ?, updated_at = ? WHERE id = ?`,
        [displayOrder, now, id]
      );
    }
  }

  /**
   * Get count of active designs for a store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }

  /**
   * Get categories with design counts
   */
  async getCategoryCounts(storeId: string): Promise<Record<GiftCardDesignCategory, number>> {
    const result: Record<GiftCardDesignCategory, number> = {
      seasonal: 0,
      birthday: 0,
      'thank-you': 0,
      general: 0,
      custom: 0,
    };
    const rows = await this.db.all<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count
       FROM ${this.schema.tableName}
       WHERE store_id = ? AND is_active = 1
       GROUP BY category`,
      [storeId]
    );
    for (const row of rows) {
      if (row.category in result) {
        result[row.category as GiftCardDesignCategory] = row.count;
      }
    }
    return result;
  }
}
