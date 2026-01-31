/**
 * Supabase Gift Cards Table Operations
 * CRUD operations for gift_cards, gift_card_transactions, and client_gift_cards tables
 */

import { supabase } from '../client';
import type {
  GiftCardRow,
  GiftCardInsert,
  GiftCardUpdate,
  GiftCardTransactionRow,
  GiftCardTransactionInsert,
  ClientGiftCardRow,
  ClientGiftCardInsert,
  ClientGiftCardUpdate,
  GiftCardStatus,
} from '../types';

// ============================================================================
// GIFT CARDS TABLE OPERATIONS
// ============================================================================

export const giftCardsTable = {
  /**
   * Get all gift cards for a store
   */
  async getByStoreId(storeId: string): Promise<GiftCardRow[]> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get gift cards by status
   */
  async getByStatus(storeId: string, status: GiftCardStatus): Promise<GiftCardRow[]> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single gift card by ID
   */
  async getById(id: string): Promise<GiftCardRow | null> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  /**
   * Get a gift card by code (for redemption lookup)
   */
  async getByCode(storeId: string, code: string): Promise<GiftCardRow | null> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  /**
   * Search gift cards by code, recipient name, or email
   */
  async search(storeId: string, query: string): Promise<GiftCardRow[]> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('store_id', storeId)
      .or(`code.ilike.%${query}%,recipient_name.ilike.%${query}%,recipient_email.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new gift card
   */
  async create(giftCard: GiftCardInsert): Promise<GiftCardRow> {
    const { data, error } = await supabase
      .from('gift_cards')
      .insert(giftCard)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a gift card
   */
  async update(id: string, updates: GiftCardUpdate): Promise<GiftCardRow> {
    const { data, error } = await supabase
      .from('gift_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a gift card (soft delete by setting status to 'cancelled')
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('gift_cards')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get gift cards updated since a timestamp (for sync)
   */
  async getUpdatedSince(storeId: string, since: string): Promise<GiftCardRow[]> {
    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Upsert multiple gift cards (for sync)
   */
  async upsertMany(giftCards: GiftCardInsert[]): Promise<GiftCardRow[]> {
    if (giftCards.length === 0) return [];

    const { data, error } = await supabase
      .from('gift_cards')
      .upsert(giftCards, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get gift cards expiring soon
   */
  async getExpiringSoon(storeId: string, daysAhead = 30): Promise<GiftCardRow[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', futureDate.toISOString())
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get gift card statistics for a store
   */
  async getStats(storeId: string): Promise<{
    totalCards: number;
    activeCards: number;
    totalLiability: number;
    totalSold: number;
  }> {
    // Get all gift cards for the store
    const { data, error } = await supabase
      .from('gift_cards')
      .select('status, current_balance, initial_balance')
      .eq('store_id', storeId);

    if (error) throw error;

    const cards = data || [];
    const activeCards = cards.filter(c => c.status === 'active');

    return {
      totalCards: cards.length,
      activeCards: activeCards.length,
      totalLiability: activeCards.reduce((sum, c) => sum + (c.current_balance || 0), 0),
      totalSold: cards.reduce((sum, c) => sum + (c.initial_balance || 0), 0),
    };
  },
};

// ============================================================================
// GIFT CARD TRANSACTIONS TABLE OPERATIONS
// ============================================================================

export const giftCardTransactionsTable = {
  /**
   * Get all transactions for a gift card
   */
  async getByGiftCardId(giftCardId: string): Promise<GiftCardTransactionRow[]> {
    const { data, error } = await supabase
      .from('gift_card_transactions')
      .select('*')
      .eq('gift_card_id', giftCardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all transactions for a store (for reports)
   */
  async getByStoreId(storeId: string, options?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<GiftCardTransactionRow[]> {
    let query = supabase
      .from('gift_card_transactions')
      .select('*')
      .eq('store_id', storeId);

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options?.type) {
      query = query.eq('transaction_type', options.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new transaction
   */
  async create(transaction: GiftCardTransactionInsert): Promise<GiftCardTransactionRow> {
    const { data, error } = await supabase
      .from('gift_card_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get transactions updated since a timestamp (for sync)
   */
  async getUpdatedSince(storeId: string, since: string): Promise<GiftCardTransactionRow[]> {
    const { data, error } = await supabase
      .from('gift_card_transactions')
      .select('*')
      .eq('store_id', storeId)
      .gt('created_at', since)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Upsert multiple transactions (for sync)
   */
  async upsertMany(transactions: GiftCardTransactionInsert[]): Promise<GiftCardTransactionRow[]> {
    if (transactions.length === 0) return [];

    const { data, error } = await supabase
      .from('gift_card_transactions')
      .upsert(transactions, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};

// ============================================================================
// CLIENT GIFT CARDS (WALLET) TABLE OPERATIONS
// ============================================================================

export const clientGiftCardsTable = {
  /**
   * Get all gift cards in a client's wallet
   */
  async getByClientId(clientId: string): Promise<ClientGiftCardRow[]> {
    const { data, error } = await supabase
      .from('client_gift_cards')
      .select('*')
      .eq('client_id', clientId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add a gift card to a client's wallet
   */
  async addToWallet(entry: ClientGiftCardInsert): Promise<ClientGiftCardRow> {
    const { data, error } = await supabase
      .from('client_gift_cards')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update wallet entry (nickname, favorite)
   */
  async update(id: string, updates: ClientGiftCardUpdate): Promise<ClientGiftCardRow> {
    const { data, error } = await supabase
      .from('client_gift_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a gift card from a client's wallet
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_gift_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Check if a gift card is in a client's wallet
   */
  async isInWallet(clientId: string, giftCardId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('client_gift_cards')
      .select('id')
      .eq('client_id', clientId)
      .eq('gift_card_id', giftCardId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
};

// ============================================================================
// COMBINED OPERATIONS (Higher-level helpers)
// ============================================================================

export const giftCardOperationsSupabase = {
  /**
   * Issue a new gift card with initial transaction
   */
  async issueGiftCard(params: {
    storeId: string;
    code: string;
    initialBalance: number;
    purchasedBy?: string;
    purchaseTicketId?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    message?: string;
    deliveryMethod?: 'email' | 'sms' | 'print' | 'physical';
    expiresAt?: string;
    cardType?: 'standard' | 'promotional' | 'reward' | 'refund';
    performedBy?: string;
  }): Promise<{ giftCard: GiftCardRow; transaction: GiftCardTransactionRow }> {
    // Create the gift card
    const giftCard = await giftCardsTable.create({
      store_id: params.storeId,
      code: params.code,
      initial_balance: params.initialBalance,
      current_balance: params.initialBalance,
      status: 'active',
      card_type: params.cardType || 'standard',
      purchased_by: params.purchasedBy,
      purchased_at: new Date().toISOString(),
      purchase_amount: params.initialBalance,
      recipient_name: params.recipientName,
      recipient_email: params.recipientEmail,
      recipient_phone: params.recipientPhone,
      personal_message: params.message,
      delivery_method: params.deliveryMethod || 'email',
      expires_at: params.expiresAt,
      is_reloadable: true,
    });

    // Create the purchase transaction
    const transaction = await giftCardTransactionsTable.create({
      gift_card_id: giftCard.id,
      store_id: params.storeId,
      transaction_type: 'purchase',
      amount: params.initialBalance,
      balance_before: 0,
      balance_after: params.initialBalance,
      ticket_id: params.purchaseTicketId,
      client_id: params.purchasedBy,
      performed_by: params.performedBy || 'system',
    });

    // Add to purchaser's wallet if they have a client ID
    if (params.purchasedBy) {
      try {
        await clientGiftCardsTable.addToWallet({
          client_id: params.purchasedBy,
          gift_card_id: giftCard.id,
          store_id: params.storeId,
          acquisition_type: 'purchased',
        });
      } catch (e) {
        // Non-fatal: wallet addition is optional
        console.warn('Failed to add gift card to purchaser wallet:', e);
      }
    }

    return { giftCard, transaction };
  },

  /**
   * Redeem a gift card (partial or full)
   */
  async redeemGiftCard(params: {
    giftCardId: string;
    storeId: string;
    amount: number;
    ticketId?: string;
    clientId?: string;
    performedBy?: string;
    notes?: string;
  }): Promise<{ giftCard: GiftCardRow; transaction: GiftCardTransactionRow }> {
    // Get current gift card
    const giftCard = await giftCardsTable.getById(params.giftCardId);
    if (!giftCard) throw new Error('Gift card not found');
    if (giftCard.status !== 'active') throw new Error(`Gift card is ${giftCard.status}`);
    if (giftCard.current_balance < params.amount) {
      throw new Error(`Insufficient balance: ${giftCard.current_balance} < ${params.amount}`);
    }

    const balanceBefore = giftCard.current_balance;
    const balanceAfter = balanceBefore - params.amount;
    const newStatus = balanceAfter === 0 ? 'used' : 'active';

    // Update the gift card balance
    const updatedGiftCard = await giftCardsTable.update(params.giftCardId, {
      current_balance: balanceAfter,
      status: newStatus,
    });

    // Create the redemption transaction
    const transaction = await giftCardTransactionsTable.create({
      gift_card_id: params.giftCardId,
      store_id: params.storeId,
      transaction_type: 'redemption',
      amount: -params.amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      ticket_id: params.ticketId,
      client_id: params.clientId,
      performed_by: params.performedBy || 'system',
      notes: params.notes,
    });

    return { giftCard: updatedGiftCard, transaction };
  },

  /**
   * Reload a gift card
   */
  async reloadGiftCard(params: {
    giftCardId: string;
    storeId: string;
    amount: number;
    ticketId?: string;
    clientId?: string;
    performedBy?: string;
    notes?: string;
  }): Promise<{ giftCard: GiftCardRow; transaction: GiftCardTransactionRow }> {
    // Get current gift card
    const giftCard = await giftCardsTable.getById(params.giftCardId);
    if (!giftCard) throw new Error('Gift card not found');
    if (!giftCard.is_reloadable) throw new Error('Gift card is not reloadable');

    const balanceBefore = giftCard.current_balance;
    const balanceAfter = balanceBefore + params.amount;

    // Update the gift card balance
    const updatedGiftCard = await giftCardsTable.update(params.giftCardId, {
      current_balance: balanceAfter,
      status: 'active', // Reactivate if it was 'used'
    });

    // Create the reload transaction
    const transaction = await giftCardTransactionsTable.create({
      gift_card_id: params.giftCardId,
      store_id: params.storeId,
      transaction_type: 'reload',
      amount: params.amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      ticket_id: params.ticketId,
      client_id: params.clientId,
      performed_by: params.performedBy || 'system',
      notes: params.notes,
    });

    return { giftCard: updatedGiftCard, transaction };
  },

  /**
   * Get gift card with full transaction history
   */
  async getGiftCardWithHistory(giftCardId: string): Promise<{
    giftCard: GiftCardRow | null;
    transactions: GiftCardTransactionRow[];
  }> {
    const [giftCard, transactions] = await Promise.all([
      giftCardsTable.getById(giftCardId),
      giftCardTransactionsTable.getByGiftCardId(giftCardId),
    ]);

    return { giftCard, transactions };
  },
};

export default {
  giftCards: giftCardsTable,
  transactions: giftCardTransactionsTable,
  clientWallet: clientGiftCardsTable,
  operations: giftCardOperationsSupabase,
};
