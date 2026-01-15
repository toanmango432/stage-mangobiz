/**
 * usePadTransactionEvents Hook
 * Subscribes to Mango Pad transaction events and updates Redux state.
 *
 * Device-to-Device (1:1) Architecture:
 * - Each Store App station subscribes to: salon/{storeId}/station/{stationId}/pad/...
 * - Only receives events from the Mango Pad paired to this specific station
 *
 * Part of: Mango Pad Integration (US-007)
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectStoreId } from '@/store/slices/authSlice';
import {
  setTipSelected,
  setSignatureCaptured,
  setReceiptPreference,
  setTransactionComplete,
  setTransactionFailed,
  setPadScreenChanged,
  setCustomerStarted,
} from '@/store/slices/padTransactionSlice';
import { setTip, setCheckoutStep } from '@/store/slices/checkoutSlice';
import { updateTicketInSupabase } from '@/store/slices/ticketsSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { useMqttContextOptional } from '../MqttProvider';
import { buildTopic, TOPIC_PATTERNS } from '../topics';
import { isMqttEnabled } from '../featureFlags';
import { getOrCreateDeviceId } from '@/services/deviceRegistration';
import type {
  MqttMessage,
  PadTipPayload,
  PadSignaturePayload,
  PadReceiptPreferencePayload,
  PadTransactionCompletePayload,
  PadScreenChangedPayload,
  PadCustomerStartedPayload,
} from '../types';

/**
 * Get human-readable notification message for receipt preference
 */
function getReceiptNotificationMessage(
  preference: string,
  email?: string,
  phone?: string
): string {
  switch (preference) {
    case 'email':
      return `Receipt will be emailed to ${email}`;
    case 'sms':
      return `Receipt will be texted to ${phone}`;
    case 'print':
      return 'Receipt will be printed';
    case 'none':
      return 'Customer declined receipt';
    default:
      return 'Receipt preference recorded';
  }
}

export function usePadTransactionEvents() {
  const dispatch = useAppDispatch();
  const mqttContext = useMqttContextOptional();
  const subscribe = mqttContext?.subscribe;
  const connection = mqttContext?.connection;
  const storeId = useAppSelector(selectStoreId);

  // Get station ID (this device's fingerprint) for device-to-device communication
  const stationId = useMemo(() => getOrCreateDeviceId(), []);

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

      const notificationMessage = getReceiptNotificationMessage(preference, email, phone);
      dispatch(addNotification({ type: 'info', message: notificationMessage }));

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

  // Handle screen change events from Mango Pad (real-time sync)
  const handleScreenChanged = useCallback(
    (_topic: string, message: MqttMessage<PadScreenChangedPayload>) => {
      const { transactionId, screen, previousScreen, changedAt } = message.payload;

      console.log(`[PadTransactionEvents] Screen changed: ${previousScreen} -> ${screen}`);

      dispatch(
        setPadScreenChanged({
          transactionId,
          screen,
          previousScreen,
          changedAt,
        })
      );
    },
    [dispatch]
  );

  // Handle customer started event (when customer first interacts with Pad)
  const handleCustomerStarted = useCallback(
    (_topic: string, message: MqttMessage<PadCustomerStartedPayload>) => {
      const { transactionId, screen } = message.payload;

      console.log(`[PadTransactionEvents] Customer started interacting on screen: ${screen}`);

      dispatch(setCustomerStarted({ transactionId }));

      dispatch(
        addNotification({
          type: 'info',
          message: 'Customer is viewing checkout on Pad',
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isMqttEnabled()) return;
    if (!mqttContext) return; // MQTT context not available (e.g., rendered outside MqttProvider)
    if (connection?.state !== 'connected') return;
    if (!storeId || !subscribe) return;

    console.log('[usePadTransactionEvents] Subscribing to station-specific topics');
    console.log('[usePadTransactionEvents] Station ID:', stationId);

    // Subscribe to station-specific topics (device-to-device)
    const tipTopic = buildTopic(TOPIC_PATTERNS.PAD_TIP_SELECTED, { storeId, stationId });
    const signatureTopic = buildTopic(TOPIC_PATTERNS.PAD_SIGNATURE_CAPTURED, { storeId, stationId });
    const receiptTopic = buildTopic(TOPIC_PATTERNS.PAD_RECEIPT_PREFERENCE, { storeId, stationId });
    const completeTopic = buildTopic(TOPIC_PATTERNS.PAD_TRANSACTION_COMPLETE, { storeId, stationId });
    const screenChangedTopic = buildTopic(TOPIC_PATTERNS.PAD_SCREEN_CHANGED, { storeId, stationId });
    const customerStartedTopic = buildTopic(TOPIC_PATTERNS.PAD_CUSTOMER_STARTED, { storeId, stationId });

    console.log('[usePadTransactionEvents] Topic patterns:', {
      tipTopic,
      signatureTopic,
      receiptTopic,
      completeTopic,
      screenChangedTopic,
      customerStartedTopic,
    });

    const unsubTip = subscribe(tipTopic, handleTipSelected as any);
    const unsubSignature = subscribe(signatureTopic, handleSignatureCaptured as any);
    const unsubReceipt = subscribe(receiptTopic, handleReceiptPreference as any);
    const unsubComplete = subscribe(completeTopic, handleTransactionComplete as any);
    const unsubScreenChanged = subscribe(screenChangedTopic, handleScreenChanged as any);
    const unsubCustomerStarted = subscribe(customerStartedTopic, handleCustomerStarted as any);

    return () => {
      unsubTip();
      unsubSignature();
      unsubReceipt();
      unsubComplete();
      unsubScreenChanged();
      unsubCustomerStarted();
    };
  }, [
    mqttContext,
    connection?.state,
    storeId,
    stationId,
    subscribe,
    handleTipSelected,
    handleSignatureCaptured,
    handleReceiptPreference,
    handleTransactionComplete,
    handleScreenChanged,
    handleCustomerStarted,
  ]);
}

export default usePadTransactionEvents;
