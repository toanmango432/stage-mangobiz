/**
 * usePadTransactionEvents Hook
 * Subscribes to Mango Pad transaction events and updates Redux state.
 *
 * Part of: Mango Pad Integration (US-007)
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectStoreId } from '@/store/slices/authSlice';
import {
  setTipSelected,
  setSignatureCaptured,
  setReceiptPreference,
  setTransactionComplete,
  setTransactionFailed,
} from '@/store/slices/padTransactionSlice';
import { setTip, setCheckoutStep } from '@/store/slices/checkoutSlice';
import { updateTicketInSupabase } from '@/store/slices/ticketsSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { useMqttContext } from '../MqttProvider';
import { buildTopic, TOPIC_PATTERNS } from '../topics';
import { isMqttEnabled } from '../featureFlags';
import type {
  MqttMessage,
  PadTipPayload,
  PadSignaturePayload,
  PadReceiptPreferencePayload,
  PadTransactionCompletePayload,
} from '../types';

export function usePadTransactionEvents() {
  const dispatch = useAppDispatch();
  const { subscribe, connection } = useMqttContext();
  const storeId = useAppSelector(selectStoreId);

  const handleTipSelected = useCallback(
    (_topic: string, message: MqttMessage<PadTipPayload>) => {
      const { transactionId, tipAmount, tipPercent, ticketId } = message.payload;

      dispatch(setTipSelected({ transactionId, tipAmount, tipPercent }));

      dispatch(setTip({ amount: tipAmount, percent: tipPercent }));

      dispatch(
        addNotification({
          type: 'info',
          message: `Tip of $${tipAmount.toFixed(2)} selected`,
        })
      );

      console.log(`[PadTransactionEvents] Tip selected for ticket ${ticketId}: $${tipAmount}`);
    },
    [dispatch]
  );

  const handleSignatureCaptured = useCallback(
    (_topic: string, message: MqttMessage<PadSignaturePayload>) => {
      const { transactionId, ticketId } = message.payload;

      dispatch(setSignatureCaptured({ transactionId }));

      dispatch(
        addNotification({
          type: 'info',
          message: 'Customer signature captured',
        })
      );

      console.log(`[PadTransactionEvents] Signature captured for ticket ${ticketId}`);
    },
    [dispatch]
  );

  const handleReceiptPreference = useCallback(
    (_topic: string, message: MqttMessage<PadReceiptPreferencePayload>) => {
      const { transactionId, preference, email, phone, ticketId } = message.payload;

      dispatch(setReceiptPreference({ transactionId, preference }));

      let notificationMessage: string;
      switch (preference) {
        case 'email':
          notificationMessage = `Receipt will be emailed to ${email}`;
          break;
        case 'sms':
          notificationMessage = `Receipt will be texted to ${phone}`;
          break;
        case 'print':
          notificationMessage = 'Receipt will be printed';
          break;
        case 'none':
          notificationMessage = 'Customer declined receipt';
          break;
        default:
          notificationMessage = 'Receipt preference recorded';
      }

      dispatch(
        addNotification({
          type: 'info',
          message: notificationMessage,
        })
      );

      console.log(`[PadTransactionEvents] Receipt preference for ticket ${ticketId}: ${preference}`);
    },
    [dispatch]
  );

  const handleTransactionComplete = useCallback(
    (_topic: string, message: MqttMessage<PadTransactionCompletePayload>) => {
      const { transactionId, ticketId, tipAmount, total, completedAt } = message.payload;

      dispatch(setTransactionComplete({ transactionId }));

      dispatch(
        updateTicketInSupabase({
          id: ticketId,
          updates: {
            status: 'paid',
            tip: tipAmount,
            total,
            completedAt,
          },
        })
      );

      dispatch(setCheckoutStep('complete'));

      dispatch(
        addNotification({
          type: 'success',
          message: `Payment complete - $${total.toFixed(2)}`,
        })
      );

      console.log(`[PadTransactionEvents] Transaction complete for ticket ${ticketId}: $${total}`);
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isMqttEnabled()) return;
    if (connection.state !== 'connected') return;
    if (!storeId) return;

    const tipTopic = buildTopic(TOPIC_PATTERNS.PAD_TIP_SELECTED, { storeId });
    const signatureTopic = buildTopic(TOPIC_PATTERNS.PAD_SIGNATURE_CAPTURED, { storeId });
    const receiptTopic = buildTopic(TOPIC_PATTERNS.PAD_RECEIPT_PREFERENCE, { storeId });
    const completeTopic = buildTopic(TOPIC_PATTERNS.PAD_TRANSACTION_COMPLETE, { storeId });

    const unsubTip = subscribe(tipTopic, handleTipSelected as any);
    const unsubSignature = subscribe(signatureTopic, handleSignatureCaptured as any);
    const unsubReceipt = subscribe(receiptTopic, handleReceiptPreference as any);
    const unsubComplete = subscribe(completeTopic, handleTransactionComplete as any);

    return () => {
      unsubTip();
      unsubSignature();
      unsubReceipt();
      unsubComplete();
    };
  }, [
    connection.state,
    storeId,
    subscribe,
    handleTipSelected,
    handleSignatureCaptured,
    handleReceiptPreference,
    handleTransactionComplete,
  ]);
}

export default usePadTransactionEvents;
