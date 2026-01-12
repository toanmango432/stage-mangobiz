/**
 * uiSlice Unit Tests
 * US-016: Tests for UI state management
 */

import { describe, it, expect } from 'vitest';
import uiReducer, {
  openNumericKeypad,
  closeNumericKeypad,
  openSettings,
  closeSettings,
  setError,
  setSuccess,
  clearMessages,
  setShowReconnecting,
  setPaymentTimeoutReached,
  setOfflineSince,
  setOfflineAlertTriggered,
  setQueuedMessageCount,
  setIsActiveTransaction,
  resetUi,
} from './uiSlice';

describe('uiSlice', () => {
  const initialState = {
    isNumericKeypadOpen: false,
    isSettingsOpen: false,
    errorMessage: null,
    successMessage: null,
    showReconnecting: false,
    paymentTimeoutReached: false,
    offlineSince: null,
    offlineAlertTriggered: false,
    queuedMessageCount: 0,
    isActiveTransaction: false,
  };

  describe('numeric keypad', () => {
    it('should open numeric keypad', () => {
      const state = uiReducer(initialState, openNumericKeypad());
      expect(state.isNumericKeypadOpen).toBe(true);
    });

    it('should close numeric keypad', () => {
      const state = uiReducer({ ...initialState, isNumericKeypadOpen: true }, closeNumericKeypad());
      expect(state.isNumericKeypadOpen).toBe(false);
    });
  });

  describe('settings', () => {
    it('should open settings', () => {
      const state = uiReducer(initialState, openSettings());
      expect(state.isSettingsOpen).toBe(true);
    });

    it('should close settings', () => {
      const state = uiReducer({ ...initialState, isSettingsOpen: true }, closeSettings());
      expect(state.isSettingsOpen).toBe(false);
    });
  });

  describe('messages', () => {
    it('should set error message', () => {
      const state = uiReducer(initialState, setError('Something went wrong'));
      expect(state.errorMessage).toBe('Something went wrong');
    });

    it('should clear error message', () => {
      const state = uiReducer({ ...initialState, errorMessage: 'Error' }, setError(null));
      expect(state.errorMessage).toBeNull();
    });

    it('should set success message', () => {
      const state = uiReducer(initialState, setSuccess('Operation completed'));
      expect(state.successMessage).toBe('Operation completed');
    });

    it('should clear success message', () => {
      const state = uiReducer({ ...initialState, successMessage: 'Success' }, setSuccess(null));
      expect(state.successMessage).toBeNull();
    });

    it('should clear all messages', () => {
      const state = uiReducer({
        ...initialState,
        errorMessage: 'Error',
        successMessage: 'Success',
      }, clearMessages());
      expect(state.errorMessage).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });

  describe('reconnecting state', () => {
    it('should show reconnecting overlay', () => {
      const state = uiReducer(initialState, setShowReconnecting(true));
      expect(state.showReconnecting).toBe(true);
    });

    it('should hide reconnecting overlay', () => {
      const state = uiReducer({ ...initialState, showReconnecting: true }, setShowReconnecting(false));
      expect(state.showReconnecting).toBe(false);
    });
  });

  describe('payment timeout', () => {
    it('should set payment timeout reached', () => {
      const state = uiReducer(initialState, setPaymentTimeoutReached(true));
      expect(state.paymentTimeoutReached).toBe(true);
    });

    it('should clear payment timeout', () => {
      const state = uiReducer({ ...initialState, paymentTimeoutReached: true }, setPaymentTimeoutReached(false));
      expect(state.paymentTimeoutReached).toBe(false);
    });
  });

  describe('offline tracking', () => {
    it('should set offline since timestamp', () => {
      const timestamp = '2026-01-10T12:00:00Z';
      const state = uiReducer(initialState, setOfflineSince(timestamp));
      expect(state.offlineSince).toBe(timestamp);
    });

    it('should clear offline since', () => {
      const state = uiReducer({ ...initialState, offlineSince: '2026-01-10T12:00:00Z' }, setOfflineSince(null));
      expect(state.offlineSince).toBeNull();
    });

    it('should set offline alert triggered', () => {
      const state = uiReducer(initialState, setOfflineAlertTriggered(true));
      expect(state.offlineAlertTriggered).toBe(true);
    });

    it('should set queued message count', () => {
      const state = uiReducer(initialState, setQueuedMessageCount(5));
      expect(state.queuedMessageCount).toBe(5);
    });

    it('should update queued message count', () => {
      let state = uiReducer(initialState, setQueuedMessageCount(3));
      state = uiReducer(state, setQueuedMessageCount(7));
      expect(state.queuedMessageCount).toBe(7);
    });
  });

  describe('active transaction', () => {
    it('should set active transaction', () => {
      const state = uiReducer(initialState, setIsActiveTransaction(true));
      expect(state.isActiveTransaction).toBe(true);
    });

    it('should clear active transaction', () => {
      const state = uiReducer({ ...initialState, isActiveTransaction: true }, setIsActiveTransaction(false));
      expect(state.isActiveTransaction).toBe(false);
    });
  });

  describe('resetUi', () => {
    it('should reset UI state but preserve some fields', () => {
      const modifiedState = {
        isNumericKeypadOpen: true,
        isSettingsOpen: true,
        errorMessage: 'Error',
        successMessage: 'Success',
        showReconnecting: true,
        paymentTimeoutReached: true,
        offlineSince: '2026-01-10T12:00:00Z',
        offlineAlertTriggered: true,
        queuedMessageCount: 5,
        isActiveTransaction: true,
      };
      const state = uiReducer(modifiedState, resetUi());
      expect(state.isNumericKeypadOpen).toBe(false);
      expect(state.errorMessage).toBeNull();
      expect(state.successMessage).toBeNull();
      expect(state.paymentTimeoutReached).toBe(false);
      expect(state.offlineAlertTriggered).toBe(false);
    });
  });
});
