import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { transactionsDB, ticketsDB, syncQueueDB } from '../../db/database';
import type { Transaction, PaymentMethod } from '../../types';
import type { RootState } from '../index';

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

// Fetch all transactions
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (salonId: string) => {
    return await transactionsDB.getAll(salonId);
  }
);

// Create transaction from completed ticket
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async ({
    ticketId,
    salonId,
    userId
  }: {
    ticketId: string;
    salonId: string;
    userId: string
  }) => {
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
      clientId: ticket.clientId,
      clientName: ticket.clientName,
      amount: ticket.subtotal,
      tip: ticket.tip,
      total: ticket.total,
      paymentMethod: (ticket.payments?.[0]?.method || 'cash') as PaymentMethod,
      paymentDetails: {
        cardLast4: ticket.payments?.[0]?.cardLast4,
        authCode: ticket.payments?.[0]?.transactionId,
      },
      status: 'completed',
      processedAt: new Date(),
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
      voidedAt: new Date(),
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
    userId
  }: {
    id: string;
    refundAmount: number;
    refundReason: string;
    userId: string;
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
      refundedAt: new Date(),
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
      refundedCount: validTransactions.filter(t => t?.status === 'refunded' || t?.status === 'partially-refunded').length,
    };
  }
);

export default transactionsSlice.reducer;
