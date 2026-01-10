/**
 * Mango Pad Event Handlers
 * Handles incoming MQTT messages from Mango Pad devices and dispatches Redux actions.
 *
 * Mango Pad publishes:
 * - tip_selected: Customer selected a tip amount
 * - signature: Customer signature captured
 * - receipt_preference: Customer chose receipt delivery method
 * - transaction_complete: Customer completed the checkout flow
 * - help_requested: Customer needs assistance
 */

import { store } from '../store';
import { setTip, setCheckoutStep } from '../store/slices/checkoutSlice';
import { updateTicketInSupabase } from '../store/slices/ticketsSlice';
import { addNotification } from '../store/slices/uiSlice';
import type {
  PadTipPayload,
  PadSignaturePayload,
  PadReceiptPreferencePayload,
  PadTransactionCompletePayload,
  PadHelpRequestedPayload,
} from './mqtt/types';

export interface PadTransactionState {
  transactionId: string;
  ticketId: string;
  signatureData?: string;
  signatureTimestamp?: string;
  receiptPreference?: 'email' | 'sms' | 'print' | 'none';
  receiptEmail?: string;
  receiptPhone?: string;
  tipAmount?: number;
  tipPercent?: number | null;
  completedAt?: string;
}

const padTransactionStore: Map<string, PadTransactionState> = new Map();

export function getPadTransactionState(ticketId: string): PadTransactionState | undefined {
  return padTransactionStore.get(ticketId);
}

export function setPadTransactionState(ticketId: string, state: Partial<PadTransactionState>): void {
  const existing = padTransactionStore.get(ticketId) || { transactionId: '', ticketId };
  padTransactionStore.set(ticketId, { ...existing, ...state });
}

export function clearPadTransactionState(ticketId: string): void {
  padTransactionStore.delete(ticketId);
}

export interface PadHandlerResult {
  success: boolean;
  error?: string;
}

/**
 * Handle tip selection from Mango Pad
 * Updates the checkout state with the selected tip amount and percent
 */
export function handleTipSelected(payload: PadTipPayload): PadHandlerResult {
  try {
    const { tipAmount, tipPercent, ticketId } = payload;

    store.dispatch(setTip({
      amount: tipAmount,
      percent: tipPercent,
    }));

    store.dispatch(addNotification({
      type: 'info',
      message: `Tip of $${tipAmount.toFixed(2)} selected`,
    }));

    console.log(`[MangoPadHandler] Tip selected for ticket ${ticketId}: $${tipAmount}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process tip selection';
    console.error('[MangoPadHandler] handleTipSelected error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle signature capture from Mango Pad
 * Stores the signature base64 data in the Pad transaction state and persists to ticket
 */
export function handleSignatureCaptured(payload: PadSignaturePayload): PadHandlerResult {
  try {
    const { signatureData, ticketId, transactionId, signedAt } = payload;

    setPadTransactionState(ticketId, {
      transactionId,
      signatureData,
      signatureTimestamp: signedAt,
    });

    store.dispatch(updateTicketInSupabase({
      id: ticketId,
      updates: {
        signatureBase64: signatureData,
        signatureTimestamp: signedAt,
      },
    }));

    store.dispatch(addNotification({
      type: 'info',
      message: 'Customer signature captured',
    }));

    console.log(`[MangoPadHandler] Signature captured for ticket ${ticketId}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process signature';
    console.error('[MangoPadHandler] handleSignatureCaptured error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle receipt preference from Mango Pad
 * Stores the preference and triggers the appropriate receipt delivery method
 */
export function handleReceiptPreference(payload: PadReceiptPreferencePayload): PadHandlerResult {
  try {
    const { preference, email, phone, ticketId, transactionId } = payload;

    setPadTransactionState(ticketId, {
      transactionId,
      receiptPreference: preference,
      receiptEmail: email,
      receiptPhone: phone,
    });

    let message: string;
    switch (preference) {
      case 'email':
        message = `Receipt will be emailed to ${email}`;
        break;
      case 'sms':
        message = `Receipt will be texted to ${phone}`;
        break;
      case 'print':
        message = 'Receipt will be printed';
        break;
      case 'none':
        message = 'Customer declined receipt';
        break;
      default:
        message = 'Receipt preference recorded';
    }

    store.dispatch(addNotification({
      type: 'info',
      message,
    }));

    console.log(`[MangoPadHandler] Receipt preference for ticket ${ticketId}: ${preference}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process receipt preference';
    console.error('[MangoPadHandler] handleReceiptPreference error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle transaction complete from Mango Pad
 * Marks the ticket as paid and updates all final transaction data including signature
 */
export function handleTransactionComplete(payload: PadTransactionCompletePayload): PadHandlerResult {
  try {
    const { ticketId, transactionId, tipAmount, total, signatureData, receiptPreference, completedAt } = payload;

    setPadTransactionState(ticketId, {
      transactionId,
      signatureData,
      receiptPreference,
      tipAmount,
      completedAt,
    });

    store.dispatch(updateTicketInSupabase({
      id: ticketId,
      updates: {
        status: 'paid',
        tip: tipAmount,
        total,
        completedAt,
        ...(signatureData && {
          signatureBase64: signatureData,
          signatureTimestamp: completedAt,
        }),
      },
    }));

    store.dispatch(setCheckoutStep('complete'));

    store.dispatch(addNotification({
      type: 'success',
      message: `Payment complete - $${total.toFixed(2)}`,
    }));

    clearPadTransactionState(ticketId);

    console.log(`[MangoPadHandler] Transaction complete for ticket ${ticketId}: $${total}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process transaction completion';
    console.error('[MangoPadHandler] handleTransactionComplete error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle help request from Mango Pad
 * Shows a prominent notification to staff that customer needs assistance
 */
export function handleHelpRequested(payload: PadHelpRequestedPayload): PadHandlerResult {
  try {
    const { deviceName, clientName, requestedAt, ticketId } = payload;

    const customerInfo = clientName || 'Customer';

    store.dispatch(addNotification({
      type: 'warning',
      message: `🆘 ${customerInfo} needs help at ${deviceName}`,
    }));

    console.log(`[MangoPadHandler] Help requested at ${deviceName} for ticket ${ticketId} at ${requestedAt}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process help request';
    console.error('[MangoPadHandler] handleHelpRequested error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Dispatch table for mapping MQTT topics to handlers
 * Used by the MQTT subscriber to route messages to appropriate handlers
 */
export const padMessageHandlers = {
  tip_selected: handleTipSelected,
  signature: handleSignatureCaptured,
  receipt_preference: handleReceiptPreference,
  transaction_complete: handleTransactionComplete,
  help_requested: handleHelpRequested,
} as const;

export type PadMessageType = keyof typeof padMessageHandlers;
