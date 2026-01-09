import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { syncQueueDB } from './database';
import type {
  GiftCard,
  GiftCardTransaction,
  GiftCardTransactionType,
  GiftCardStatus,
  GiftCardDesign,
  GiftCardDesignCategory,
  IssueGiftCardInput,
  RedeemGiftCardInput,
  ReloadGiftCardInput,
} from '../types/gift-card';
import { generateGiftCardCode, isGiftCardRedeemable } from '../types/gift-card';
import {
  incrementEntityVersion,
  markEntityDeleted,
} from '../types/common';

// ============================================
// SYNC CONFIGURATION FOR GIFT CARDS
// See: docs/DATA_STORAGE_STRATEGY.md
// ============================================

const SYNC_CONFIG = {
  entity: 'giftcard' as const,
  priority: 2, // Higher priority - financial data
  tombstoneRetentionMs: 365 * 24 * 60 * 60 * 1000, // 1 year (for compliance)
};

const TRANSACTION_SYNC_CONFIG = {
  entity: 'giftcard_transaction' as const,
  priority: 2,
  tombstoneRetentionMs: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Add operation to sync queue
 */
async function queueForSync(
  type: 'create' | 'update' | 'delete',
  entity: GiftCard | GiftCardTransaction,
  entityType: 'giftcard' | 'giftcard_transaction',
  _storeId: string
): Promise<void> {
  const actionMap = {
    create: 'CREATE' as const,
    update: 'UPDATE' as const,
    delete: 'DELETE' as const,
  };

  const config = entityType === 'giftcard' ? SYNC_CONFIG : TRANSACTION_SYNC_CONFIG;

  await syncQueueDB.add({
    type,
    entity: config.entity,
    entityId: entity.id,
    action: actionMap[type],
    payload: entity,
    priority: config.priority,
    maxAttempts: 5,
  });
}

// ============================================
// GIFT CARD DATABASE OPERATIONS
// Production-ready with sync queue integration
// ============================================

export const giftCardDB = {
  // ---- Gift Card Read Operations ----

  /**
   * Get all gift cards for a store (excludes deleted)
   */
  async getAllGiftCards(storeId: string): Promise<GiftCard[]> {
    if (!storeId) return [];
    const giftCards = await db.giftCards
      .where('storeId')
      .equals(storeId)
      .toArray();
    return giftCards.filter((gc) => !gc.isDeleted);
  },

  /**
   * Get gift card by ID
   */
  async getGiftCardById(id: string): Promise<GiftCard | undefined> {
    return await db.giftCards.get(id);
  },

  /**
   * Get gift card by code (primary lookup for redemption)
   */
  async getGiftCardByCode(storeId: string, code: string): Promise<GiftCard | undefined> {
    if (!storeId || !code) return undefined;
    const normalizedCode = code.trim().toUpperCase();
    const giftCards = await db.giftCards
      .where('[storeId+code]')
      .equals([storeId, normalizedCode])
      .toArray();
    return giftCards.find((gc) => !gc.isDeleted);
  },

  /**
   * Get gift cards by status
   */
  async getGiftCardsByStatus(storeId: string, status: GiftCardStatus): Promise<GiftCard[]> {
    if (!storeId) return [];
    const giftCards = await db.giftCards
      .where('[storeId+status]')
      .equals([storeId, status])
      .toArray();
    return giftCards.filter((gc) => !gc.isDeleted);
  },

  /**
   * Get gift cards by purchaser (client ID)
   */
  async getGiftCardsByPurchaser(storeId: string, purchaserId: string): Promise<GiftCard[]> {
    if (!storeId || !purchaserId) return [];
    const giftCards = await db.giftCards
      .where('purchaserId')
      .equals(purchaserId)
      .toArray();
    return giftCards.filter((gc) => gc.storeId === storeId && !gc.isDeleted);
  },

  /**
   * Search gift cards by recipient email
   */
  async getGiftCardsByRecipientEmail(storeId: string, email: string): Promise<GiftCard[]> {
    if (!storeId || !email) return [];
    const normalizedEmail = email.trim().toLowerCase();
    const giftCards = await db.giftCards
      .where('storeId')
      .equals(storeId)
      .toArray();
    return giftCards.filter(
      (gc) =>
        !gc.isDeleted &&
        gc.recipientEmail?.toLowerCase() === normalizedEmail
    );
  },

  // ---- Gift Card Write Operations ----

  /**
   * Issue a new gift card
   */
  async issueGiftCard(
    input: IssueGiftCardInput,
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId: string = 'default-tenant',
    ticketId?: string
  ): Promise<{ giftCard: GiftCard; transaction: GiftCardTransaction }> {
    const now = new Date().toISOString();
    const giftCardId = uuidv4();
    const transactionId = uuidv4();
    const code = generateGiftCardCode();

    const giftCard: GiftCard = {
      // BaseSyncableEntity fields
      id: giftCardId,
      tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // GiftCard specific fields
      code,
      type: input.type,
      originalAmount: input.amount,
      currentBalance: input.amount,
      purchaserId: input.purchaserId,
      purchaserName: input.purchaserName,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      recipientPhone: input.recipientPhone,
      message: input.message,
      designId: input.designId,
      issuedAt: now,
      expiresAt: input.expiresAt,
      status: 'active',
      purchaseTicketId: ticketId,
      // Delivery tracking
      deliveryMethod: input.deliveryMethod || (input.recipientEmail ? 'email' : 'none'),
      scheduledDeliveryAt: input.scheduledDeliveryAt,
      isReloadable: input.isReloadable ?? true, // Default to reloadable
    };

    const transaction: GiftCardTransaction = {
      // BaseSyncableEntity fields
      id: transactionId,
      tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // GiftCardTransaction specific fields
      giftCardId,
      type: 'purchase',
      amount: input.amount,
      balanceAfter: input.amount,
      ticketId,
      staffId: userId,
      notes: `Gift card issued: ${code}`,
    };

    await db.giftCards.add(giftCard);
    await db.giftCardTransactions.add(transaction);
    await queueForSync('create', giftCard, 'giftcard', storeId);
    await queueForSync('create', transaction, 'giftcard_transaction', storeId);

    return { giftCard, transaction };
  },

  /**
   * Redeem gift card (partial or full)
   */
  async redeemGiftCard(
    input: RedeemGiftCardInput,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<{ giftCard: GiftCard; transaction: GiftCardTransaction }> {
    const giftCard = await this.getGiftCardByCode(storeId, input.code);
    if (!giftCard) {
      throw new Error(`Gift card not found: ${input.code}`);
    }

    if (!isGiftCardRedeemable(giftCard)) {
      throw new Error(`Gift card is not redeemable: status=${giftCard.status}, balance=${giftCard.currentBalance}`);
    }

    if (input.amount > giftCard.currentBalance) {
      throw new Error(`Insufficient balance: requested=${input.amount}, available=${giftCard.currentBalance}`);
    }

    const newBalance = giftCard.currentBalance - input.amount;
    const newStatus: GiftCardStatus = newBalance <= 0 ? 'depleted' : 'active';

    const now = new Date().toISOString();
    const transactionId = uuidv4();

    const transaction: GiftCardTransaction = {
      // BaseSyncableEntity fields
      id: transactionId,
      tenantId: giftCard.tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // GiftCardTransaction specific fields
      giftCardId: giftCard.id,
      type: 'redeem',
      amount: -input.amount, // Negative for redemption
      balanceAfter: newBalance,
      ticketId: input.ticketId,
      staffId: input.staffId,
      notes: `Redeemed $${input.amount.toFixed(2)} at checkout`,
    };

    const updatedGiftCard = incrementEntityVersion(
      {
        ...giftCard,
        currentBalance: newBalance,
        status: newStatus,
        lastUsedAt: now,
      },
      userId,
      deviceId
    );

    await db.giftCards.put(updatedGiftCard);
    await db.giftCardTransactions.add(transaction);
    await queueForSync('update', updatedGiftCard, 'giftcard', storeId);
    await queueForSync('create', transaction, 'giftcard_transaction', storeId);

    return { giftCard: updatedGiftCard, transaction };
  },

  /**
   * Reload gift card (add balance)
   */
  async reloadGiftCard(
    input: ReloadGiftCardInput,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<{ giftCard: GiftCard; transaction: GiftCardTransaction }> {
    const giftCard = await this.getGiftCardById(input.giftCardId);
    if (!giftCard) {
      throw new Error(`Gift card not found: ${input.giftCardId}`);
    }

    if (giftCard.status === 'voided') {
      throw new Error('Cannot reload a voided gift card');
    }

    const newBalance = giftCard.currentBalance + input.amount;
    const now = new Date().toISOString();
    const transactionId = uuidv4();

    const transaction: GiftCardTransaction = {
      // BaseSyncableEntity fields
      id: transactionId,
      tenantId: giftCard.tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // GiftCardTransaction specific fields
      giftCardId: giftCard.id,
      type: 'reload',
      amount: input.amount,
      balanceAfter: newBalance,
      ticketId: input.ticketId,
      staffId: input.staffId,
      notes: `Reloaded $${input.amount.toFixed(2)}`,
    };

    const updatedGiftCard = incrementEntityVersion(
      {
        ...giftCard,
        currentBalance: newBalance,
        status: 'active' as const, // Reactivate if depleted
      },
      userId,
      deviceId
    );

    await db.giftCards.put(updatedGiftCard as GiftCard);
    await db.giftCardTransactions.add(transaction);
    await queueForSync('update', updatedGiftCard as GiftCard, 'giftcard', storeId);
    await queueForSync('create', transaction, 'giftcard_transaction', storeId);

    return { giftCard: updatedGiftCard as GiftCard, transaction };
  },

  /**
   * Adjust gift card balance (manual correction)
   */
  async adjustBalance(
    giftCardId: string,
    amount: number,
    notes: string,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<{ giftCard: GiftCard; transaction: GiftCardTransaction }> {
    const giftCard = await this.getGiftCardById(giftCardId);
    if (!giftCard) {
      throw new Error(`Gift card not found: ${giftCardId}`);
    }

    if (giftCard.status === 'voided') {
      throw new Error('Cannot adjust a voided gift card');
    }

    const newBalance = giftCard.currentBalance + amount;
    if (newBalance < 0) {
      throw new Error('Balance cannot be negative');
    }

    const now = new Date().toISOString();
    const transactionId = uuidv4();
    const newStatus: GiftCardStatus = newBalance <= 0 ? 'depleted' : 'active';

    const transaction: GiftCardTransaction = {
      // BaseSyncableEntity fields
      id: transactionId,
      tenantId: giftCard.tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // GiftCardTransaction specific fields
      giftCardId: giftCard.id,
      type: 'refund', // Using refund type for adjustments
      amount,
      balanceAfter: newBalance,
      staffId: userId,
      notes: `Balance adjustment: ${notes}`,
    };

    const updatedGiftCard = incrementEntityVersion(
      {
        ...giftCard,
        currentBalance: newBalance,
        status: newStatus,
      },
      userId,
      deviceId
    );

    await db.giftCards.put(updatedGiftCard);
    await db.giftCardTransactions.add(transaction);
    await queueForSync('update', updatedGiftCard, 'giftcard', storeId);
    await queueForSync('create', transaction, 'giftcard_transaction', storeId);

    return { giftCard: updatedGiftCard, transaction };
  },

  /**
   * Void a gift card
   */
  async voidGiftCard(
    giftCardId: string,
    reason: string,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<{ giftCard: GiftCard; transaction: GiftCardTransaction }> {
    const giftCard = await this.getGiftCardById(giftCardId);
    if (!giftCard) {
      throw new Error(`Gift card not found: ${giftCardId}`);
    }

    if (giftCard.status === 'voided') {
      throw new Error('Gift card is already voided');
    }

    const now = new Date().toISOString();
    const transactionId = uuidv4();
    const previousBalance = giftCard.currentBalance;

    const transaction: GiftCardTransaction = {
      // BaseSyncableEntity fields
      id: transactionId,
      tenantId: giftCard.tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // GiftCardTransaction specific fields
      giftCardId: giftCard.id,
      type: 'void',
      amount: -previousBalance, // Zero out balance
      balanceAfter: 0,
      staffId: userId,
      notes: `Voided: ${reason}`,
    };

    const updatedGiftCard = incrementEntityVersion(
      {
        ...giftCard,
        currentBalance: 0,
        status: 'voided' as const,
      },
      userId,
      deviceId
    );

    await db.giftCards.put(updatedGiftCard as GiftCard);
    await db.giftCardTransactions.add(transaction);
    await queueForSync('update', updatedGiftCard as GiftCard, 'giftcard', storeId);
    await queueForSync('create', transaction, 'giftcard_transaction', storeId);

    return { giftCard: updatedGiftCard as GiftCard, transaction };
  },

  /**
   * Update gift card details (non-financial)
   */
  async updateGiftCard(
    giftCardId: string,
    updates: Partial<Pick<GiftCard, 'recipientName' | 'recipientEmail' | 'recipientPhone' | 'message' | 'designId' | 'expiresAt'>>,
    userId: string,
    deviceId: string
  ): Promise<GiftCard> {
    const giftCard = await this.getGiftCardById(giftCardId);
    if (!giftCard) {
      throw new Error(`Gift card not found: ${giftCardId}`);
    }

    const updatedGiftCard = incrementEntityVersion(
      { ...giftCard, ...updates },
      userId,
      deviceId
    );

    await db.giftCards.put(updatedGiftCard);
    await queueForSync('update', updatedGiftCard, 'giftcard', giftCard.storeId);

    return updatedGiftCard;
  },

  /**
   * Soft delete a gift card (only if unused)
   */
  async deleteGiftCard(
    giftCardId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const giftCard = await this.getGiftCardById(giftCardId);
    if (!giftCard) {
      throw new Error(`Gift card not found: ${giftCardId}`);
    }

    // Only allow deletion of unused cards
    if (giftCard.currentBalance !== giftCard.originalAmount) {
      throw new Error('Cannot delete a gift card that has been used');
    }

    const deleted = markEntityDeleted(
      giftCard,
      userId,
      deviceId,
      SYNC_CONFIG.tombstoneRetentionMs
    );

    await db.giftCards.put(deleted);
    await queueForSync('delete', deleted, 'giftcard', giftCard.storeId);
  },

  // ---- Transaction Read Operations ----

  /**
   * Get all transactions for a gift card
   */
  async getTransactionsByGiftCard(giftCardId: string): Promise<GiftCardTransaction[]> {
    if (!giftCardId) return [];
    const transactions = await db.giftCardTransactions
      .where('giftCardId')
      .equals(giftCardId)
      .toArray();
    return transactions
      .filter((t) => !t.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get transactions by store and date range
   */
  async getTransactionsByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<GiftCardTransaction[]> {
    if (!storeId) return [];
    const transactions = await db.giftCardTransactions
      .where('[storeId+createdAt]')
      .between([storeId, startDate], [storeId, endDate], true, true)
      .toArray();
    return transactions.filter((t) => !t.isDeleted);
  },

  /**
   * Get transactions by type
   */
  async getTransactionsByType(
    storeId: string,
    type: GiftCardTransactionType
  ): Promise<GiftCardTransaction[]> {
    if (!storeId) return [];
    const transactions = await db.giftCardTransactions
      .where('[storeId+type]')
      .equals([storeId, type])
      .toArray();
    return transactions.filter((t) => !t.isDeleted);
  },

  /**
   * Get transactions by ticket ID
   */
  async getTransactionsByTicket(ticketId: string): Promise<GiftCardTransaction[]> {
    if (!ticketId) return [];
    const transactions = await db.giftCardTransactions
      .where('ticketId')
      .equals(ticketId)
      .toArray();
    return transactions.filter((t) => !t.isDeleted);
  },

  // ---- Design Operations ----

  /**
   * Get all active gift card designs for a store
   */
  async getActiveDesigns(storeId: string): Promise<GiftCardDesign[]> {
    if (!storeId) return [];
    const designs = await db.giftCardDesigns
      .where('[storeId+isActive]')
      .equals([storeId, 1]) // Dexie uses 1 for true in indexes
      .toArray();
    return designs.filter((d) => !d.isDeleted);
  },

  /**
   * Get default design for a store
   */
  async getDefaultDesign(storeId: string): Promise<GiftCardDesign | undefined> {
    if (!storeId) return undefined;
    const designs = await db.giftCardDesigns
      .where('[storeId+isDefault]')
      .equals([storeId, 1])
      .toArray();
    return designs.find((d) => !d.isDeleted);
  },

  /**
   * Get designs by category
   */
  async getDesignsByCategory(
    storeId: string,
    category: GiftCardDesign['category']
  ): Promise<GiftCardDesign[]> {
    if (!storeId) return [];
    const designs = await db.giftCardDesigns
      .where('[storeId+category]')
      .equals([storeId, category])
      .toArray();
    return designs.filter((d) => d.isActive && !d.isDeleted);
  },

  // ---- Reporting Helpers ----

  /**
   * Calculate total outstanding gift card liability
   */
  async getTotalLiability(storeId: string): Promise<number> {
    const activeCards = await this.getGiftCardsByStatus(storeId, 'active');
    return activeCards.reduce((sum, gc) => sum + gc.currentBalance, 0);
  },

  /**
   * Get gift cards expiring within days
   */
  async getExpiringGiftCards(storeId: string, withinDays: number): Promise<GiftCard[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    const futureDateStr = futureDate.toISOString();

    const activeCards = await this.getGiftCardsByStatus(storeId, 'active');
    return activeCards.filter(
      (gc) => gc.expiresAt && gc.expiresAt <= futureDateStr && gc.expiresAt > now.toISOString()
    );
  },

  /**
   * Get sales summary for date range
   */
  async getSalesSummary(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalIssued: number;
    totalRedeemed: number;
    totalReloaded: number;
    countIssued: number;
    countRedeemed: number;
  }> {
    const transactions = await this.getTransactionsByDateRange(storeId, startDate, endDate);

    return {
      totalIssued: transactions
        .filter((t) => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0),
      totalRedeemed: transactions
        .filter((t) => t.type === 'redeem')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalReloaded: transactions
        .filter((t) => t.type === 'reload')
        .reduce((sum, t) => sum + t.amount, 0),
      countIssued: transactions.filter((t) => t.type === 'purchase').length,
      countRedeemed: transactions.filter((t) => t.type === 'redeem').length,
    };
  },

  // ---- Sync Operations (for syncManager) ----

  /**
   * Get gift card by ID (alias for getGiftCardById)
   */
  async getById(id: string): Promise<GiftCard | undefined> {
    return this.getGiftCardById(id);
  },

  /**
   * Upsert a gift card (for sync from server)
   */
  async upsert(giftCard: GiftCard): Promise<void> {
    await db.giftCards.put(giftCard);
  },

  /**
   * Upsert a gift card transaction (for sync from server)
   */
  async upsertTransaction(transaction: GiftCardTransaction): Promise<void> {
    await db.giftCardTransactions.put(transaction);
  },

  /**
   * Delete a gift card by ID (hard delete, for sync)
   */
  async delete(id: string): Promise<void> {
    await db.giftCards.delete(id);
    // Also delete associated transactions
    await db.giftCardTransactions
      .where('giftCardId')
      .equals(id)
      .delete();
  },
};

export default giftCardDB;
