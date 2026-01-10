/**
 * Transaction Slice
 * Manages current transaction data, tip, signature, and payment state
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  TransactionPayload,
  TipSelection,
  SignatureData,
  PaymentResult,
  ReceiptSelection,
  SplitPayment,
} from '@/types';

interface TransactionState {
  current: TransactionPayload | null;
  tip: TipSelection | null;
  signature: SignatureData | null;
  paymentResult: PaymentResult | null;
  receiptSelection: ReceiptSelection | null;
  splitPayments: SplitPayment[];
  currentSplitIndex: number;
  isSplitPayment: boolean;
}

const initialState: TransactionState = {
  current: null,
  tip: null,
  signature: null,
  paymentResult: null,
  receiptSelection: null,
  splitPayments: [],
  currentSplitIndex: 0,
  isSplitPayment: false,
};

export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransaction: (state, action: PayloadAction<TransactionPayload>) => {
      state.current = action.payload;
      state.tip = null;
      state.signature = null;
      state.paymentResult = null;
      state.receiptSelection = null;
      state.splitPayments = [];
      state.currentSplitIndex = 0;
      state.isSplitPayment = false;
    },
    setTip: (state, action: PayloadAction<TipSelection>) => {
      state.tip = action.payload;
    },
    setSignature: (state, action: PayloadAction<SignatureData>) => {
      state.signature = action.payload;
    },
    setPaymentResult: (state, action: PayloadAction<PaymentResult>) => {
      state.paymentResult = action.payload;
    },
    setReceiptSelection: (state, action: PayloadAction<ReceiptSelection>) => {
      state.receiptSelection = action.payload;
    },
    initializeSplitPayment: (
      state,
      action: PayloadAction<{ amounts: number[] }>
    ) => {
      const { amounts } = action.payload;
      state.isSplitPayment = true;
      state.currentSplitIndex = 0;
      state.splitPayments = amounts.map((amount, index) => ({
        splitIndex: index,
        totalSplits: amounts.length,
        amount,
        status: 'pending',
      }));
    },
    updateSplitPayment: (
      state,
      action: PayloadAction<{ index: number; update: Partial<SplitPayment> }>
    ) => {
      const { index, update } = action.payload;
      if (state.splitPayments[index]) {
        state.splitPayments[index] = {
          ...state.splitPayments[index],
          ...update,
        };
      }
    },
    setCurrentSplitIndex: (state, action: PayloadAction<number>) => {
      state.currentSplitIndex = action.payload;
    },
    clearTransaction: (state) => {
      state.current = null;
      state.tip = null;
      state.signature = null;
      state.paymentResult = null;
      state.receiptSelection = null;
      state.splitPayments = [];
      state.currentSplitIndex = 0;
      state.isSplitPayment = false;
    },
  },
});

export const {
  setTransaction,
  setTip,
  setSignature,
  setPaymentResult,
  setReceiptSelection,
  initializeSplitPayment,
  updateSplitPayment,
  setCurrentSplitIndex,
  clearTransaction,
} = transactionSlice.actions;

export default transactionSlice.reducer;
