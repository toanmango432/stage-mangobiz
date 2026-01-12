/**
 * transactionSlice Unit Tests
 * US-016: Tests for transaction state management
 */

import { describe, it, expect } from 'vitest';
import transactionReducer, {
  setTransaction,
  setTip,
  setSignature,
  setPaymentResult,
  setReceiptSelection,
  initializeSplitPayment,
  updateSplitPayment,
  setCurrentSplitIndex,
  clearTransaction,
} from './transactionSlice';
import type { TransactionPayload, TipSelection, SignatureData, PaymentResult, ReceiptSelection } from '@/types';

describe('transactionSlice', () => {
  const initialState = {
    current: null,
    tip: null,
    signature: null,
    paymentResult: null,
    receiptSelection: null,
    splitPayments: [],
    currentSplitIndex: 0,
    isSplitPayment: false,
  };

  const mockTransaction: TransactionPayload = {
    transactionId: 'txn-123',
    clientId: 'client-1',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '555-0100',
    staffName: 'Jane Smith',
    items: [
      { name: 'Haircut', price: 45.00, quantity: 1, type: 'service' },
      { name: 'Shampoo', price: 12.99, quantity: 2, type: 'product' },
    ],
    subtotal: 70.99,
    tax: 5.32,
    total: 76.31,
    loyaltyPoints: 100,
    suggestedTips: [18, 20, 25, 30],
    showReceiptOptions: true,
    terminalType: 'pax',
  };

  describe('setTransaction', () => {
    it('should set transaction and reset all related state', () => {
      const state = transactionReducer(initialState, setTransaction(mockTransaction));
      expect(state.current).toEqual(mockTransaction);
      expect(state.tip).toBeNull();
      expect(state.signature).toBeNull();
      expect(state.paymentResult).toBeNull();
      expect(state.receiptSelection).toBeNull();
      expect(state.splitPayments).toEqual([]);
      expect(state.isSplitPayment).toBe(false);
    });

    it('should replace existing transaction', () => {
      let state = transactionReducer(initialState, setTransaction(mockTransaction));
      const newTransaction = { ...mockTransaction, transactionId: 'txn-456' };
      state = transactionReducer(state, setTransaction(newTransaction));
      expect(state.current?.transactionId).toBe('txn-456');
    });
  });

  describe('setTip', () => {
    it('should set tip selection', () => {
      const tip: TipSelection = {
        tipAmount: 15.26,
        tipPercent: 20,
        selectedAt: '2026-01-10T12:00:00Z',
      };
      const state = transactionReducer(initialState, setTip(tip));
      expect(state.tip).toEqual(tip);
    });

    it('should handle dollar-based tip (no percent)', () => {
      const tip: TipSelection = {
        tipAmount: 10.00,
        tipPercent: null,
        selectedAt: '2026-01-10T12:00:00Z',
      };
      const state = transactionReducer(initialState, setTip(tip));
      expect(state.tip?.tipPercent).toBeNull();
      expect(state.tip?.tipAmount).toBe(10.00);
    });
  });

  describe('setSignature', () => {
    it('should set signature data', () => {
      const signature: SignatureData = {
        signatureBase64: 'data:image/png;base64,iVBORw0...',
        agreedAt: '2026-01-10T12:05:00Z',
      };
      const state = transactionReducer(initialState, setSignature(signature));
      expect(state.signature).toEqual(signature);
    });
  });

  describe('setPaymentResult', () => {
    it('should set successful payment result', () => {
      const result: PaymentResult = {
        success: true,
        cardLast4: '4242',
        authCode: 'ABC123',
        processedAt: '2026-01-10T12:10:00Z',
      };
      const state = transactionReducer(initialState, setPaymentResult(result));
      expect(state.paymentResult).toEqual(result);
      expect(state.paymentResult?.success).toBe(true);
    });

    it('should set failed payment result', () => {
      const result: PaymentResult = {
        success: false,
        failureReason: 'Card declined',
        processedAt: '2026-01-10T12:10:00Z',
      };
      const state = transactionReducer(initialState, setPaymentResult(result));
      expect(state.paymentResult?.success).toBe(false);
      expect(state.paymentResult?.failureReason).toBe('Card declined');
    });
  });

  describe('setReceiptSelection', () => {
    it('should set email receipt preference', () => {
      const receipt: ReceiptSelection = {
        preference: 'email',
        email: 'john@example.com',
        selectedAt: '2026-01-10T12:15:00Z',
      };
      const state = transactionReducer(initialState, setReceiptSelection(receipt));
      expect(state.receiptSelection).toEqual(receipt);
    });

    it('should set no receipt preference', () => {
      const receipt: ReceiptSelection = {
        preference: 'none',
        selectedAt: '2026-01-10T12:15:00Z',
      };
      const state = transactionReducer(initialState, setReceiptSelection(receipt));
      expect(state.receiptSelection?.preference).toBe('none');
    });
  });

  describe('initializeSplitPayment', () => {
    it('should initialize split payments with equal amounts', () => {
      const state = transactionReducer(initialState, initializeSplitPayment({ amounts: [38.16, 38.15] }));
      expect(state.isSplitPayment).toBe(true);
      expect(state.currentSplitIndex).toBe(0);
      expect(state.splitPayments).toHaveLength(2);
      expect(state.splitPayments[0]).toEqual({
        splitIndex: 0,
        totalSplits: 2,
        amount: 38.16,
        status: 'pending',
      });
      expect(state.splitPayments[1]).toEqual({
        splitIndex: 1,
        totalSplits: 2,
        amount: 38.15,
        status: 'pending',
      });
    });

    it('should initialize 3-way split', () => {
      const state = transactionReducer(initialState, initializeSplitPayment({ amounts: [25.44, 25.43, 25.44] }));
      expect(state.splitPayments).toHaveLength(3);
    });

    it('should initialize 4-way split', () => {
      const state = transactionReducer(initialState, initializeSplitPayment({ amounts: [19.08, 19.08, 19.08, 19.07] }));
      expect(state.splitPayments).toHaveLength(4);
    });
  });

  describe('updateSplitPayment', () => {
    it('should update split payment status to completed', () => {
      let state = transactionReducer(initialState, initializeSplitPayment({ amounts: [38.16, 38.15] }));
      state = transactionReducer(state, updateSplitPayment({ index: 0, update: { status: 'completed', tipAmount: 7.00 } }));
      expect(state.splitPayments[0].status).toBe('completed');
      expect(state.splitPayments[0].tipAmount).toBe(7.00);
      expect(state.splitPayments[1].status).toBe('pending');
    });

    it('should update split with signature', () => {
      let state = transactionReducer(initialState, initializeSplitPayment({ amounts: [50, 50] }));
      state = transactionReducer(state, updateSplitPayment({ index: 0, update: { signatureBase64: 'base64...' } }));
      expect(state.splitPayments[0].signatureBase64).toBe('base64...');
    });

    it('should not fail for invalid index', () => {
      let state = transactionReducer(initialState, initializeSplitPayment({ amounts: [50, 50] }));
      state = transactionReducer(state, updateSplitPayment({ index: 99, update: { status: 'completed' } }));
      expect(state.splitPayments[0].status).toBe('pending');
      expect(state.splitPayments[1].status).toBe('pending');
    });
  });

  describe('setCurrentSplitIndex', () => {
    it('should set current split index', () => {
      let state = transactionReducer(initialState, initializeSplitPayment({ amounts: [50, 50] }));
      state = transactionReducer(state, setCurrentSplitIndex(1));
      expect(state.currentSplitIndex).toBe(1);
    });
  });

  describe('clearTransaction', () => {
    it('should clear all transaction state', () => {
      let state = transactionReducer(initialState, setTransaction(mockTransaction));
      state = transactionReducer(state, setTip({ tipAmount: 10, tipPercent: 15, selectedAt: new Date().toISOString() }));
      state = transactionReducer(state, initializeSplitPayment({ amounts: [50, 50] }));
      state = transactionReducer(state, clearTransaction());

      expect(state.current).toBeNull();
      expect(state.tip).toBeNull();
      expect(state.signature).toBeNull();
      expect(state.paymentResult).toBeNull();
      expect(state.receiptSelection).toBeNull();
      expect(state.splitPayments).toEqual([]);
      expect(state.currentSplitIndex).toBe(0);
      expect(state.isSplitPayment).toBe(false);
    });
  });
});
