import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { transactionsDB, ticketsDB, syncQueueDB } from '../../db/database';
import { dataService } from '../../services/dataService';
// toTransaction/toTransactions not needed - dataService returns converted types
import type { Transaction, PaymentMethod, CreateTransactionInput } from '../../types';
import type { RootState } from '../index';
import { v4 as uuidv4 } from 'uuid';

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate transaction amount
 */
const validateTransactionAmount = (amount: number, tip: number, total: number): boolean => {
  const calculatedTotal = amount + tip;
  return Math.abs(calculatedTotal - total) < 0.01; // Allow for floating point precision
};

/**
 * Validate payment method data
 */
const validatePaymentMethod = (method: PaymentMethod, details?: any): boolean => {
  if (method === 'card') {
    // Card payments should have last 4 digits or auth code
    return details?.cardLast4 || details?.authCode;
  }
  return true; // Cash, check, giftcard don't require additional details
};

/**
 * Validate refund amount
 */
const validateRefundAmount = (
  refundAmount: number,
  transactionTotal: number,
  existingRefund: number = 0
): boolean => {
  return refundAmount > 0 && (existingRefund + refundAmount) <= transactionTotal;
};

/**
 * Check if transaction can be voided (within 24 hours)
 */
const canVoidTransaction = (createdAt: Date | string): boolean => {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const hoursSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24;
};

// ==================== SUPABASE THUNKS (Phase 6) ====================

/**
 * Fetch transactions by date from Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchTransactionsByDateFromSupabase = createAsyncThunk(
  'transactions/fetchByDateFromSupabase',
  async (date: Date) => {
    // dataService already returns Transaction[] (converted)
    return await dataService.transactions.getByDate(date);
  }
);

/**
 * Fetch single transaction by ID from Supabase
 */
export const fetchTransactionByIdFromSupabase = createAsyncThunk(
  'transactions/fetchByIdFromSupabase',
  async (transactionId: string) => {
    // dataService already returns Transaction (converted)
    const transaction = await dataService.transactions.getById(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    return transaction;
  }
);

/**
 * Fetch daily summary from Supabase
 */
export const fetchDailySummaryFromSupabase = createAsyncThunk(
  'transactions/fetchDailySummaryFromSupabase',
  async (date: Date) => {
    return await dataService.transactions.getDailySummary(date);
  }
);

/**
 * Fetch payment breakdown from Supabase
 */
export const fetchPaymentBreakdownFromSupabase = createAsyncThunk(
  'transactions/fetchPaymentBreakdownFromSupabase',
  async (date: Date) => {
    return await dataService.transactions.getPaymentBreakdown(date);
  }
);

/**
 * Create a transaction in Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const createTransactionInSupabase = createAsyncThunk(
  'transactions/createInSupabase',
  async (input: CreateTransactionInput, { rejectWithValue }) => {
    try {
      // Validate foreign keys before creating
      const { validateTransactionInput } = await import('../../utils/validation');
      const validation = await validateTransactionInput({
        ticketId: input.ticketId,
        clientId: input.clientId,
      });

      if (!validation.valid) {
        return rejectWithValue(validation.error || 'Validation failed');
      }

      // Calculate totals
      const subtotal = input.subtotal || 0;
      const tax = input.tax || 0;
      const tip = input.tip || 0;
      const discount = input.discount || 0;
      const total = subtotal + tax + tip - discount;

      // Validate amounts
      if (total <= 0) {
        return rejectWithValue('Transaction total must be greater than 0');
      }

      // Build transaction data for insert (dataService returns Transaction directly)
      const transactionData = {
        salonId: '', // Will be filled by dataService
        ticketId: input.ticketId,
        ticketNumber: input.ticketNumber,
        clientId: input.clientId,
        clientName: input.clientName,
        subtotal,
        tax,
        tip,
        discount,
        amount: subtotal + tax,
        total,
        paymentMethod: input.paymentMethod,
        paymentDetails: input.paymentDetails,
        status: 'completed' as const,
      };

      // dataService.transactions.create returns Transaction directly
      return await dataService.transactions.create(transactionData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create transaction');
    }
  }
);

/**
 * Fetch transactions by ticket ID from Supabase
 */
export const fetchTransactionsByTicketIdFromSupabase = createAsyncThunk(
  'transactions/fetchByTicketIdFromSupabase',
  async (ticketId: string) => {
    // dataService already returns Transaction[] (converted)
    return await dataService.transactions.getByTicketId(ticketId);
  }
);

/**
 * Void a transaction in Supabase
 */
export const voidTransactionInSupabase = createAsyncThunk(
  'transactions/voidInSupabase',
  async ({ id, voidReason: _voidReason }: { id: string; voidReason: string }, { rejectWithValue }) => {
    try {
      // dataService already returns Transaction directly
      const transaction = await dataService.transactions.getById(id);
      if (!transaction) {
        return rejectWithValue('Transaction not found');
      }

      if (transaction.status === 'voided') {
        return rejectWithValue('Transaction already voided');
      }

      if (transaction.status === 'refunded') {
        return rejectWithValue('Cannot void a refunded transaction');
      }

      // Check time window - can only void within 24 hours
      if (!canVoidTransaction(transaction.createdAt)) {
        return rejectWithValue('Cannot void transaction older than 24 hours');
      }

      // Update in Supabase - dataService returns Transaction directly
      const updated = await dataService.transactions.update(id, {
        status: 'voided',
      });

      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to void transaction');
    }
  }
);

/**
 * Refund a transaction in Supabase
 */
export const refundTransactionInSupabase = createAsyncThunk(
  'transactions/refundInSupabase',
  async ({ id, refundAmount, refundReason: _refundReason }: { id: string; refundAmount: number; refundReason: string }, { rejectWithValue }) => {
    try {
      // dataService already returns Transaction directly
      const transaction = await dataService.transactions.getById(id);
      if (!transaction) {
        return rejectWithValue('Transaction not found');
      }

      if (transaction.status === 'voided') {
        return rejectWithValue('Cannot refund voided transaction');
      }

      // Validate refund amount
      const existingRefund = transaction.refundedAmount || 0;
      if (!validateRefundAmount(refundAmount, transaction.total, existingRefund)) {
        return rejectWithValue(`Invalid refund amount. Maximum refundable: $${(transaction.total - existingRefund).toFixed(2)}`);
      }

      // Determine new status
      const newStatus = refundAmount === transaction.total ? 'refunded' : 'partially-refunded';

      // Update in Supabase - dataService returns Transaction directly
      const updated = await dataService.transactions.update(id, {
        status: newStatus,
      });

      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to refund transaction');
    }
  }
);

// ==================== LEGACY ASYNC THUNKS (IndexedDB) ====================
// ⚠️ DEPRECATED: These thunks use IndexedDB only and do not sync to Supabase.
// Use the Supabase versions instead:
// - fetchTransactions → fetchTransactionsByDateFromSupabase
// - createTransaction → createTransactionInSupabase

/**
 * @deprecated Use fetchTransactionsByDateFromSupabase instead. This only reads from IndexedDB.
 */
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_salonId: string) => {
    console.warn('⚠️ DEPRECATED: fetchTransactions is deprecated. Use fetchTransactionsByDateFromSupabase instead.');
    return await transactionsDB.getAll(_salonId);
  }
);

/**
 * @deprecated Use createTransactionInSupabase instead. This only saves to IndexedDB and does not sync to Supabase.
 */
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async ({
    ticketId,
  }: {
    ticketId: string;
    _salonId: string;
    _userId: string
  }) => {
    console.warn('⚠️ DEPRECATED: createTransaction is deprecated. Use createTransactionInSupabase instead.');
    // Fetch the completed ticket
    const ticket = await ticketsDB.getById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status !== 'completed') {
      throw new Error('Cannot create transaction for non-completed ticket');
    }

    // Validate ticket has required financial data
    if (!ticket.total || ticket.total <= 0) {
      throw new Error('Invalid ticket total amount');
    }

    // Validate amounts add up correctly
    const subtotal = ticket.subtotal || 0;
    const tip = ticket.tip || 0;
    const total = ticket.total;

    if (!validateTransactionAmount(subtotal, tip, total)) {
      throw new Error('Transaction amounts do not match: subtotal + tip != total');
    }

    // Validate payment method
    const paymentMethod = (ticket.payments?.[0]?.method || 'cash') as PaymentMethod;
    const paymentDetails = {
      cardLast4: ticket.payments?.[0]?.cardLast4,
      authCode: ticket.payments?.[0]?.transactionId,
    };

    if (!validatePaymentMethod(paymentMethod, paymentDetails)) {
      throw new Error('Invalid payment method details');
    }

    // Create transaction from ticket data
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'> = {
      salonId: ticket.salonId,
      ticketId: ticket.id,
      ticketNumber: ticket.number || 0,
      clientId: ticket.clientId,
      clientName: ticket.clientName,
      subtotal: ticket.subtotal,
      tax: ticket.tax || 0,
      discount: ticket.discount || 0,
      amount: ticket.subtotal,
      tip: ticket.tip,
      total: ticket.total,
      paymentMethod: (ticket.payments?.[0]?.method || 'cash') as PaymentMethod,
      paymentDetails: {
        cardLast4: ticket.payments?.[0]?.cardLast4,
        authCode: ticket.payments?.[0]?.transactionId,
      },
      status: 'completed',
      processedAt: new Date().toISOString(),
    };

    // Create in database
    const transaction = await transactionsDB.create(transactionData);

    // Add to sync queue with high priority for financial data
    await syncQueueDB.add({
      type: 'create',
      entity: 'transaction',
      entityId: transaction.id,
      action: 'CREATE',
      payload: transaction,
      priority: 1, // High priority
      maxAttempts: 10,
    });

    return transaction;
  }
);

// Create transaction from pending ticket (Pending Module workflow)
export const createTransactionFromPending = createAsyncThunk(
  'transactions/createFromPending',
  async (input: CreateTransactionInput, { getState }) => {
    const state = getState() as RootState;
    const salonId = state.auth?.user?.salonId || 'default-salon';
    const userId = state.auth?.user?.id || 'default-user';

    // Validate input
    if (!input.ticketId || !input.clientName) {
      throw new Error('Missing required transaction data');
    }

    // Calculate totals
    const subtotal = input.subtotal || 0;
    const tax = input.tax || 0;
    const tip = input.tip || 0;
    const discount = input.discount || 0;
    const total = subtotal + tax + tip - discount;

    // Validate amounts
    if (total <= 0) {
      throw new Error('Transaction total must be greater than 0');
    }

    if (!validatePaymentMethod(input.paymentMethod, input.paymentDetails)) {
      throw new Error('Invalid payment method details');
    }

    // Create transaction object
    const transaction: Transaction = {
      id: uuidv4(),
      salonId,
      ticketId: input.ticketId,
      ticketNumber: input.ticketNumber,
      clientId: input.clientId,
      clientName: input.clientName,

      // Financial breakdown
      subtotal,
      tax,
      tip,
      discount,
      amount: subtotal + tax, // Legacy field for compatibility
      total,

      // Payment info
      paymentMethod: input.paymentMethod,
      paymentDetails: input.paymentDetails,

      // Service details
      services: input.services,

      // Status and timestamps
      status: 'completed',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      processedBy: input.processedBy || userId,

      // Additional metadata
      notes: input.notes,

      // Sync status
      syncStatus: 'local',
    };

    // Create in database
    await transactionsDB.create(transaction);

    // Add to sync queue with high priority for financial data
    await syncQueueDB.add({
      type: 'create',
      entity: 'transaction',
      entityId: transaction.id,
      action: 'CREATE',
      payload: transaction,
      priority: 1, // High priority
      maxAttempts: 10,
    });

    return transaction;
  }
);

// Void a transaction
export const voidTransaction = createAsyncThunk(
  'transactions/void',
  async ({
    id,
    voidReason,
    userId
  }: {
    id: string;
    voidReason: string;
    userId: string
  }) => {
    const transaction = await transactionsDB.getById(id);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'voided') {
      throw new Error('Transaction already voided');
    }

    if (transaction.status === 'refunded') {
      throw new Error('Cannot void a refunded transaction');
    }

    // Check time window - can only void within 24 hours
    if (!canVoidTransaction(transaction.createdAt)) {
      throw new Error('Cannot void transaction older than 24 hours');
    }

    const voided = await transactionsDB.update(id, {
      status: 'voided',
      voidedAt: new Date().toISOString(),
      voidedBy: userId,
      voidReason,
    });

    if (voided) {
      // Add to sync queue
      await syncQueueDB.add({
        type: 'update',
        entity: 'transaction',
        entityId: id,
        action: 'UPDATE',
        payload: voided,
        priority: 1,
        maxAttempts: 10,
      });
    }

    return voided;
  }
);

// Refund a transaction
export const refundTransaction = createAsyncThunk(
  'transactions/refund',
  async ({
    id,
    refundAmount,
    refundReason,
  }: {
    id: string;
    refundAmount: number;
    refundReason: string;
    _userId: string;
  }) => {
    const transaction = await transactionsDB.getById(id);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'voided') {
      throw new Error('Cannot refund voided transaction');
    }

    // Validate refund amount
    const existingRefund = transaction.refundedAmount || 0;
    if (!validateRefundAmount(refundAmount, transaction.total, existingRefund)) {
      throw new Error(`Invalid refund amount. Maximum refundable: $${(transaction.total - existingRefund).toFixed(2)}`);
    }

    const refunded = await transactionsDB.update(id, {
      status: refundAmount === transaction.total ? 'refunded' : 'partially-refunded',
      refundedAt: new Date().toISOString(),
      refundedAmount: existingRefund + refundAmount,
      refundReason,
    });

    if (refunded) {
      // Add to sync queue
      await syncQueueDB.add({
        type: 'update',
        entity: 'transaction',
        entityId: id,
        action: 'UPDATE',
        payload: refunded,
        priority: 1,
        maxAttempts: 10,
      });
    }

    return refunded;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      });

    // Create transaction
    builder
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // Add to beginning
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create transaction';
      });

    // Create transaction from pending
    builder
      .addCase(createTransactionFromPending.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransactionFromPending.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // Add to beginning
      })
      .addCase(createTransactionFromPending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create transaction from pending';
      });

    // Void transaction
    builder
      .addCase(voidTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(voidTransaction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.items.findIndex(t => t.id === action.payload!.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      })
      .addCase(voidTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to void transaction';
      });

    // Refund transaction
    builder
      .addCase(refundTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refundTransaction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.items.findIndex(t => t.id === action.payload!.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      })
      .addCase(refundTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to refund transaction';
      });

    // ==================== SUPABASE THUNKS REDUCERS (Phase 6) ====================

    // Fetch transactions by date from Supabase
    builder
      .addCase(fetchTransactionsByDateFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionsByDateFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactionsByDateFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions from Supabase';
      });

    // Fetch transaction by ID from Supabase
    builder
      .addCase(fetchTransactionByIdFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionByIdFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        // Update the item in the list if it exists, otherwise add it
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(fetchTransactionByIdFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transaction from Supabase';
      });

    // Daily summary and payment breakdown don't modify state.items
    // They return data directly through the thunk payload
    builder
      .addCase(fetchDailySummaryFromSupabase.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDailySummaryFromSupabase.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchDailySummaryFromSupabase.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(fetchPaymentBreakdownFromSupabase.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPaymentBreakdownFromSupabase.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchPaymentBreakdownFromSupabase.rejected, (state) => {
        state.loading = false;
      });

    // Create transaction in Supabase
    builder
      .addCase(createTransactionInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransactionInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createTransactionInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create transaction';
      });

    // Fetch transactions by ticket ID from Supabase
    builder
      .addCase(fetchTransactionsByTicketIdFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionsByTicketIdFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        // Merge with existing items, avoiding duplicates
        action.payload.forEach(newItem => {
          const existingIndex = state.items.findIndex(t => t.id === newItem.id);
          if (existingIndex !== -1) {
            state.items[existingIndex] = newItem;
          } else {
            state.items.push(newItem);
          }
        });
      })
      .addCase(fetchTransactionsByTicketIdFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions by ticket';
      });

    // Void transaction in Supabase
    builder
      .addCase(voidTransactionInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(voidTransactionInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) return;
        const voidedTransaction = action.payload;
        const index = state.items.findIndex(t => t.id === voidedTransaction.id);
        if (index !== -1) {
          state.items[index] = voidedTransaction;
        }
      })
      .addCase(voidTransactionInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to void transaction';
      });

    // Refund transaction in Supabase
    builder
      .addCase(refundTransactionInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refundTransactionInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) return;
        const refundedTransaction = action.payload;
        const index = state.items.findIndex(t => t.id === refundedTransaction.id);
        if (index !== -1) {
          state.items[index] = refundedTransaction;
        }
      })
      .addCase(refundTransactionInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to refund transaction';
      });
  },
});

// Export actions
export const { clearError } = transactionsSlice.actions;

// Selectors
export const selectAllTransactions = (state: RootState) => state.transactions.items;
export const selectTransactionById = (state: RootState, id: string) =>
  state.transactions.items.find(t => t.id === id);
export const selectTransactionsLoading = (state: RootState) => state.transactions.loading;
export const selectTransactionsError = (state: RootState) => state.transactions.error;

// Stats selectors with proper memoization
export const selectTransactionStats = createSelector(
  [selectAllTransactions],
  (transactions) => {
    // Ensure we have valid transactions array
    const validTransactions = transactions || [];

    // Calculate stats with null safety
    const totalRevenue = validTransactions.reduce((sum, t) => {
      const total = t?.total || 0;
      return sum + total;
    }, 0);

    const totalTips = validTransactions.reduce((sum, t) => {
      const tip = t?.tip || 0;
      return sum + tip;
    }, 0);

    const avgTransaction = validTransactions.length > 0 ? totalRevenue / validTransactions.length : 0;

    return {
      totalRevenue,
      totalTips,
      avgTransaction,
      totalTransactions: validTransactions.length,
      completedCount: validTransactions.filter(t => t?.status === 'completed').length,
      voidedCount: validTransactions.filter(t => t?.status === 'voided').length,
      refundedCount: validTransactions.filter(t => t?.status === 'refunded' || (t?.status as any) === 'partially-refunded').length,
    };
  }
);

export default transactionsSlice.reducer;
