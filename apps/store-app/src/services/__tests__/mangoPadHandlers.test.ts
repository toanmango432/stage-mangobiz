/**
 * Mango Pad Handlers Tests
 *
 * Tests for incoming MQTT message handlers from Mango Pad devices.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer from '../../store/slices/checkoutSlice';
import uiReducer from '../../store/slices/uiSlice';
import ticketsReducer from '../../store/slices/ticketsSlice';
import {
  handleTipSelected,
  handleSignatureCaptured,
  handleReceiptPreference,
  handleTransactionComplete,
  handleHelpRequested,
  padMessageHandlers,
} from '../mangoPadHandlers';
import type {
  PadTipPayload,
  PadSignaturePayload,
  PadReceiptPreferencePayload,
  PadTransactionCompletePayload,
  PadHelpRequestedPayload,
} from '../mqtt/types';

vi.mock('../../store', () => {
  const mockStore = {
    dispatch: vi.fn(),
    getState: vi.fn(() => ({
      checkout: {
        activeCheckout: {
          ticketId: 'test-ticket-id',
          step: 'tip',
          tipAmount: 0,
          tipPercent: null,
        },
      },
      ui: {
        notifications: [],
      },
      tickets: {
        items: [],
        activeTickets: [],
        selectedTicket: null,
        loading: false,
        error: null,
      },
    })),
  };
  return { store: mockStore };
});

import { store } from '../../store';

describe('mangoPadHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleTipSelected', () => {
    it('should dispatch setTip with correct amount and percent', () => {
      const payload: PadTipPayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        tipAmount: 10.50,
        tipPercent: 20,
        selectedAt: new Date().toISOString(),
      };

      const result = handleTipSelected(payload);

      expect(result.success).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'checkout/setTip',
          payload: { amount: 10.50, percent: 20 },
        })
      );
    });

    it('should dispatch notification for tip selected', () => {
      const payload: PadTipPayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        tipAmount: 15.00,
        tipPercent: 25,
        selectedAt: new Date().toISOString(),
      };

      handleTipSelected(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'info',
            message: 'Tip of $15.00 selected',
          }),
        })
      );
    });

    it('should handle null tip percent', () => {
      const payload: PadTipPayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        tipAmount: 5.00,
        tipPercent: null,
        selectedAt: new Date().toISOString(),
      };

      const result = handleTipSelected(payload);

      expect(result.success).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'checkout/setTip',
          payload: { amount: 5.00, percent: null },
        })
      );
    });
  });

  describe('handleSignatureCaptured', () => {
    it('should dispatch updateTicketInSupabase with signature data', () => {
      const payload: PadSignaturePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        signatureData: 'base64-signature-data',
        signedAt: '2026-01-10T12:00:00Z',
      };

      const result = handleSignatureCaptured(payload);

      expect(result.success).toBe(true);
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should dispatch notification for signature captured', () => {
      const payload: PadSignaturePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        signatureData: 'base64-signature-data',
        signedAt: '2026-01-10T12:00:00Z',
      };

      handleSignatureCaptured(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'info',
            message: 'Customer signature captured',
          }),
        })
      );
    });
  });

  describe('handleReceiptPreference', () => {
    it('should dispatch updateTicketInSupabase for email preference', () => {
      const payload: PadReceiptPreferencePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        preference: 'email',
        email: 'customer@example.com',
      };

      const result = handleReceiptPreference(payload);

      expect(result.success).toBe(true);
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should show correct notification for email preference', () => {
      const payload: PadReceiptPreferencePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        preference: 'email',
        email: 'customer@example.com',
      };

      handleReceiptPreference(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'info',
            message: 'Receipt will be emailed to customer@example.com',
          }),
        })
      );
    });

    it('should show correct notification for SMS preference', () => {
      const payload: PadReceiptPreferencePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        preference: 'sms',
        phone: '+15551234567',
      };

      handleReceiptPreference(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'info',
            message: 'Receipt will be texted to +15551234567',
          }),
        })
      );
    });

    it('should show correct notification for print preference', () => {
      const payload: PadReceiptPreferencePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        preference: 'print',
      };

      handleReceiptPreference(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'info',
            message: 'Receipt will be printed',
          }),
        })
      );
    });

    it('should show correct notification for no receipt', () => {
      const payload: PadReceiptPreferencePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        preference: 'none',
      };

      handleReceiptPreference(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'info',
            message: 'Customer declined receipt',
          }),
        })
      );
    });
  });

  describe('handleTransactionComplete', () => {
    it('should dispatch updateTicketInSupabase with complete data', () => {
      const payload: PadTransactionCompletePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        tipAmount: 10.00,
        total: 60.00,
        signatureData: 'base64-signature',
        receiptPreference: 'email',
        completedAt: '2026-01-10T12:00:00Z',
      };

      const result = handleTransactionComplete(payload);

      expect(result.success).toBe(true);
      expect(store.dispatch).toHaveBeenCalled();
    });

    it('should set checkout step to complete', () => {
      const payload: PadTransactionCompletePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        tipAmount: 10.00,
        total: 60.00,
        receiptPreference: 'none',
        completedAt: '2026-01-10T12:00:00Z',
      };

      handleTransactionComplete(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'checkout/setCheckoutStep',
          payload: 'complete',
        })
      );
    });

    it('should show success notification with total', () => {
      const payload: PadTransactionCompletePayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        tipAmount: 10.00,
        total: 60.00,
        receiptPreference: 'none',
        completedAt: '2026-01-10T12:00:00Z',
      };

      handleTransactionComplete(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'success',
            message: 'Payment complete - $60.00',
          }),
        })
      );
    });
  });

  describe('handleHelpRequested', () => {
    it('should dispatch warning notification with device and client info', () => {
      const payload: PadHelpRequestedPayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        deviceId: 'pad-001',
        deviceName: 'Pad 1',
        clientName: 'John Smith',
        requestedAt: '2026-01-10T12:00:00Z',
      };

      const result = handleHelpRequested(payload);

      expect(result.success).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'warning',
            message: '🆘 John Smith needs help at Pad 1',
          }),
        })
      );
    });

    it('should use "Customer" when clientName is not provided', () => {
      const payload: PadHelpRequestedPayload = {
        transactionId: 'txn-123',
        ticketId: 'ticket-456',
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        requestedAt: '2026-01-10T12:00:00Z',
      };

      handleHelpRequested(payload);

      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ui/addNotification',
          payload: expect.objectContaining({
            type: 'warning',
            message: '🆘 Customer needs help at Checkout Pad',
          }),
        })
      );
    });
  });

  describe('padMessageHandlers', () => {
    it('should export all handler functions', () => {
      expect(padMessageHandlers.tip_selected).toBe(handleTipSelected);
      expect(padMessageHandlers.signature).toBe(handleSignatureCaptured);
      expect(padMessageHandlers.receipt_preference).toBe(handleReceiptPreference);
      expect(padMessageHandlers.transaction_complete).toBe(handleTransactionComplete);
      expect(padMessageHandlers.help_requested).toBe(handleHelpRequested);
    });

    it('should have all expected message types', () => {
      const expectedTypes = [
        'tip_selected',
        'signature',
        'receipt_preference',
        'transaction_complete',
        'help_requested',
      ];

      expect(Object.keys(padMessageHandlers)).toEqual(expectedTypes);
    });
  });
});
