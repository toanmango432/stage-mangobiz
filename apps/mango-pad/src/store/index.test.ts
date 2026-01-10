/**
 * Redux Store Unit Tests
 * US-016: Tests for store configuration and integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import padReducer, { setScreen, resetToIdle } from './slices/padSlice';
import transactionReducer, { setTransaction, setTip, clearTransaction } from './slices/transactionSlice';
import configReducer, { setConfig } from './slices/configSlice';
import uiReducer, { setError, clearMessages } from './slices/uiSlice';
import type { TransactionPayload } from '@/types';

interface RootState {
  pad: ReturnType<typeof padReducer>;
  transaction: ReturnType<typeof transactionReducer>;
  config: ReturnType<typeof configReducer>;
  ui: ReturnType<typeof uiReducer>;
}

describe('Redux Store', () => {
  let store: EnhancedStore<RootState>;

  beforeEach(() => {
    localStorage.clear();
    store = configureStore({
      reducer: {
        pad: padReducer,
        transaction: transactionReducer,
        config: configReducer,
        ui: uiReducer,
      },
    });
  });

  describe('store configuration', () => {
    it('should have all slices configured', () => {
      const state = store.getState();
      expect(state.pad).toBeDefined();
      expect(state.transaction).toBeDefined();
      expect(state.config).toBeDefined();
      expect(state.ui).toBeDefined();
    });

    it('should have correct initial state', () => {
      const state = store.getState();
      expect(state.pad.currentScreen).toBe('idle');
      expect(state.transaction.current).toBeNull();
      expect(state.config.config.tipEnabled).toBe(true);
      expect(state.ui.errorMessage).toBeNull();
    });
  });

  describe('cross-slice integration', () => {
    it('should handle payment flow state transitions', () => {
      const mockTransaction: TransactionPayload = {
        transactionId: 'txn-123',
        clientId: 'client-1',
        clientName: 'Test Client',
        staffName: 'Staff Member',
        items: [{ name: 'Service', price: 50, quantity: 1, type: 'service' }],
        subtotal: 50,
        tax: 4,
        total: 54,
        suggestedTips: [18, 20, 25],
        showReceiptOptions: true,
      };

      store.dispatch(setTransaction(mockTransaction));
      store.dispatch(setScreen('order-review'));
      
      let state = store.getState();
      expect(state.transaction.current?.transactionId).toBe('txn-123');
      expect(state.pad.currentScreen).toBe('order-review');

      store.dispatch(setScreen('tip'));
      store.dispatch(setTip({
        tipAmount: 10.80,
        tipPercent: 20,
        selectedAt: new Date().toISOString(),
      }));
      
      state = store.getState();
      expect(state.pad.currentScreen).toBe('tip');
      expect(state.transaction.tip?.tipAmount).toBe(10.80);
    });

    it('should handle cancel flow', () => {
      store.dispatch(setTransaction({
        transactionId: 'txn-cancel',
        clientId: 'client-1',
        clientName: 'Cancel Test',
        staffName: 'Staff',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        suggestedTips: [],
        showReceiptOptions: false,
      }));
      store.dispatch(setScreen('payment'));
      
      store.dispatch(clearTransaction());
      store.dispatch(resetToIdle());
      
      const state = store.getState();
      expect(state.transaction.current).toBeNull();
      expect(state.pad.currentScreen).toBe('idle');
    });

    it('should handle config updates affecting payment flow', () => {
      store.dispatch(setConfig({
        tipEnabled: false,
        signatureRequired: false,
      }));
      
      const state = store.getState();
      expect(state.config.config.tipEnabled).toBe(false);
      expect(state.config.config.signatureRequired).toBe(false);
    });

    it('should handle error state', () => {
      store.dispatch(setError('Connection failed'));
      
      let state = store.getState();
      expect(state.ui.errorMessage).toBe('Connection failed');
      
      store.dispatch(clearMessages());
      state = store.getState();
      expect(state.ui.errorMessage).toBeNull();
    });
  });

  describe('state selectors', () => {
    it('should select current screen', () => {
      store.dispatch(setScreen('signature'));
      const state = store.getState();
      expect(state.pad.currentScreen).toBe('signature');
    });

    it('should select transaction total', () => {
      store.dispatch(setTransaction({
        transactionId: 'txn-1',
        clientId: 'c-1',
        clientName: 'Client',
        staffName: 'Staff',
        items: [],
        subtotal: 100,
        tax: 8,
        total: 108,
        suggestedTips: [],
        showReceiptOptions: true,
      }));
      
      const state = store.getState();
      expect(state.transaction.current?.total).toBe(108);
    });

    it('should select config settings', () => {
      store.dispatch(setConfig({ salonId: 'salon-test' }));
      const state = store.getState();
      expect(state.config.config.salonId).toBe('salon-test');
    });
  });
});
