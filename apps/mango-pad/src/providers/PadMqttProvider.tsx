/**
 * Pad MQTT Provider
 * Provides MQTT connectivity and Pad-specific topic handling
 *
 * Device-to-Device (1:1) Architecture:
 * - Mango Pad pairs to ONE specific Store App station
 * - All MQTT communication is scoped to that station via stationId
 * - Topics: salon/{salonId}/station/{stationId}/pad/...
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { mqttService, type MqttMessage } from '@/services/mqttClient';
import { syncQueueService } from '@/services/syncQueue';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMqttConnectionStatus, setScreen, resetToIdle } from '@/store/slices/padSlice';
import { setTransaction, setPaymentResult, clearTransaction, setTip } from '@/store/slices/transactionSlice';
import {
  setShowReconnecting,
  setOfflineSince,
  setOfflineAlertTriggered,
  setQueuedMessageCount,
} from '@/store/slices/uiSlice';
import { buildPadTopic, PAD_TOPICS } from '@/constants/mqttTopics';
import type {
  MqttConnectionStatus,
  ReadyToPayPayload,
  PaymentResultPayload,
  TipSelectedPayload,
  SignatureCapturedPayload,
  ReceiptPreferencePayload,
  TransactionCompletePayload,
  HelpRequestedPayload,
  SplitPaymentPayload,
  PadScreen,
  PadFlowStep,
  ActiveTransaction,
  TransactionPayload,
} from '@/types';

// POS connection status tracked via heartbeat
export interface PosConnectionStatus {
  isConnected: boolean;
  storeName?: string;
}

interface PadMqttContextValue {
  connectionStatus: MqttConnectionStatus;
  isConnected: boolean;
  posConnection: PosConnectionStatus;
  stationId: string | null;
  // Transaction state management
  activeTransaction: ActiveTransaction | null;
  setActiveTransaction: (transaction: ActiveTransaction) => void;
  clearTransaction: () => void;
  updateTransactionStep: (step: PadFlowStep) => void;
  // Publish functions
  publishTipSelected: (payload: Omit<TipSelectedPayload, 'transactionId'>) => Promise<void>;
  publishSignature: (payload: Omit<SignatureCapturedPayload, 'transactionId'>) => Promise<void>;
  publishReceiptPreference: (
    payload: Omit<ReceiptPreferencePayload, 'transactionId'>
  ) => Promise<void>;
  publishTransactionComplete: () => Promise<void>;
  publishHelpRequested: (currentScreen: PadScreen) => Promise<void>;
  publishSplitPayment: (payload: Omit<SplitPaymentPayload, 'transactionId'>) => Promise<void>;
  setCurrentScreen: (screen: PadScreen) => void;
  reconnect: () => Promise<void>;
  // NEW: Screen sync for bi-directional communication
  publishScreenChanged: (newScreen: PadScreen, previousScreen: PadScreen) => Promise<void>;
}

const PadMqttContext = createContext<PadMqttContextValue | null>(null);

interface PadMqttProviderProps {
  children: ReactNode;
}

// Heartbeat timeout - if no heartbeat received within this time, POS is considered offline
const HEARTBEAT_TIMEOUT_MS = 15000; // 15 seconds

// How often Mango Pad sends its heartbeat to Store App
const PAD_HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds

// Dev mode fixed station ID - MUST match DEV_MODE_STATION_ID in store-app deviceRegistration.ts
// This enables automatic pairing in development without manual code entry
const DEV_MODE_STATION_ID = 'demo-station-001';
const DEV_MODE_SALON_ID = 'demo-salon';
const DEV_MODE_DEVICE_ID = 'demo-mango-pad-001';

/**
 * Get or create device ID for Mango Pad
 * In dev mode, uses a fixed device ID for consistent heartbeat publishing
 */
function getOrCreateDeviceId(): string {
  const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

  if (isDevMode) {
    // In dev mode, always use the fixed device ID
    // Also store it in localStorage so it's available everywhere
    localStorage.setItem('mango_pad_device_id', DEV_MODE_DEVICE_ID);
    return DEV_MODE_DEVICE_ID;
  }

  // Production mode: get existing or generate new UUID
  let deviceId = localStorage.getItem('mango_pad_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('mango_pad_device_id', deviceId);
  }
  return deviceId;
}

// Context for unpair events (used by useUnpairEvent hook)
interface UnpairContextValue {
  unpairReceived: boolean;
  clearUnpairReceived: () => void;
}

const UnpairContext = createContext<UnpairContextValue | null>(null);

/**
 * Get pairing info from localStorage
 */
function getPairingInfo(): { stationId: string; salonId: string; stationName?: string } | null {
  const pairingInfo = localStorage.getItem('mango_pad_pairing');
  if (!pairingInfo) return null;

  try {
    const parsed = JSON.parse(pairingInfo);
    if (parsed.stationId && parsed.salonId) {
      return {
        stationId: parsed.stationId,
        salonId: parsed.salonId,
        stationName: parsed.stationName,
      };
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

/**
 * Map PadFlowStep to PadScreen for navigation
 */
function flowStepToScreen(step: PadFlowStep): PadScreen {
  const mapping: Record<PadFlowStep, PadScreen> = {
    waiting: 'idle',
    receipt: 'order-review',
    tip: 'tip',
    signature: 'signature',
    receipt_preference: 'receipt',
    waiting_payment: 'payment',
    complete: 'result',
    failed: 'result',
    cancelled: 'idle',
  };
  return mapping[step];
}

/**
 * Map PadScreen to PadFlowStep for state tracking
 */
function screenToFlowStep(screen: PadScreen): PadFlowStep {
  const mapping: Record<PadScreen, PadFlowStep> = {
    idle: 'waiting',
    waiting: 'waiting',
    'order-review': 'receipt',
    tip: 'tip',
    signature: 'signature',
    payment: 'waiting_payment',
    result: 'complete', // Will be refined by payment result
    receipt: 'receipt_preference',
    'thank-you': 'complete',
    'split-selection': 'tip',
    'split-status': 'waiting_payment',
    settings: 'waiting',
  };
  return mapping[screen];
}

export function PadMqttProvider({ children }: PadMqttProviderProps) {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config.config);
  const transactionId = useAppSelector((state) => state.transaction.current?.transactionId);

  // Get full transaction state from Redux for computing activeTransaction
  const transactionState = useAppSelector((state) => state.transaction);
  const currentScreen = useAppSelector((state) => state.pad.currentScreen);

  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus>('disconnected');
  const [posConnection, setPosConnection] = useState<PosConnectionStatus>({ isConnected: false });
  const [unpairReceived, setUnpairReceived] = useState(false);
  const [stationId, setStationId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const offlineAlertSentRef = useRef(false);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousScreenRef = useRef<PadScreen>('waiting');
  const customerStartedRef = useRef(false); // Track if customer_started has been sent

  // Compute activeTransaction from Redux state
  const activeTransaction: ActiveTransaction | null = transactionState.current
    ? {
        transactionId: transactionState.current.transactionId,
        ticketId: transactionState.current.transactionId, // Use transactionId as ticketId for now
        clientName: transactionState.current.clientName,
        clientEmail: transactionState.current.clientEmail,
        clientPhone: transactionState.current.clientPhone,
        staffName: transactionState.current.staffName,
        items: transactionState.current.items,
        subtotal: transactionState.current.subtotal,
        tax: transactionState.current.tax,
        discount: transactionState.current.discount ?? 0,
        total: transactionState.current.total,
        suggestedTips: transactionState.current.suggestedTips,
        tipAmount: transactionState.tip?.tipAmount ?? 0,
        tipPercent: transactionState.tip?.tipPercent ?? null,
        signatureData: transactionState.signature?.signatureBase64,
        receiptPreference: transactionState.receiptSelection?.preference,
        step: transactionState.paymentResult
          ? transactionState.paymentResult.success
            ? 'complete'
            : 'failed'
          : screenToFlowStep(currentScreen),
        startedAt:
          transactionState.tip?.selectedAt ??
          transactionState.signature?.agreedAt ??
          new Date().toISOString(),
        paymentResult: transactionState.paymentResult
          ? {
              success: transactionState.paymentResult.success,
              cardLast4: transactionState.paymentResult.cardLast4,
              failureReason: transactionState.paymentResult.failureReason,
            }
          : undefined,
      }
    : null;

  // Use broker URL from config
  const brokerUrl = config.mqttBrokerUrl;

  // Load salonId and stationId from pairing info on mount
  // In dev mode, ALWAYS use fixed IDs for automatic connection (ignoring localStorage)
  useEffect(() => {
    const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

    if (isDevMode) {
      // Dev mode: ALWAYS use fixed IDs to match Store App's dev mode
      // This ensures consistent pairing without manual configuration
      console.log('[PadMqttProvider] Dev mode - using fixed IDs (ignoring localStorage):', {
        stationId: DEV_MODE_STATION_ID,
        salonId: DEV_MODE_SALON_ID,
      });
      setStationId(DEV_MODE_STATION_ID);
      setSalonId(DEV_MODE_SALON_ID);
    } else {
      // Production mode: use pairing info from localStorage
      const pairing = getPairingInfo();
      if (pairing) {
        setStationId(pairing.stationId);
        setSalonId(pairing.salonId);
        console.log('[PadMqttProvider] Loaded pairing info:', {
          stationId: pairing.stationId,
          salonId: pairing.salonId,
        });
      } else {
        console.log('[PadMqttProvider] No pairing found - waiting for user to pair via code');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribeState = mqttService.onStateChange((status) => {
      setConnectionStatus(status);
      dispatch(setMqttConnectionStatus(status));

      if (status === 'disconnected' || status === 'reconnecting') {
        dispatch(setShowReconnecting(true));
        if (status === 'disconnected') {
          dispatch(setOfflineSince(new Date().toISOString()));
        }
      } else if (status === 'connected') {
        dispatch(setShowReconnecting(false));
        dispatch(setOfflineSince(null));
        dispatch(setOfflineAlertTriggered(false));
        offlineAlertSentRef.current = false;
      }
    });

    return () => {
      unsubscribeState();
    };
  }, [dispatch]);

  useEffect(() => {
    syncQueueService.setOfflineAlertCallback((durationMs) => {
      if (!offlineAlertSentRef.current) {
        offlineAlertSentRef.current = true;
        dispatch(setOfflineAlertTriggered(true));
        console.warn(`[PadMqttProvider] Offline for ${Math.round(durationMs / 1000)}s - alerting staff`);
      }
    });
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(setQueuedMessageCount(syncQueueService.getQueueSize()));
    }, 2000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (!salonId || !brokerUrl) return;

    const connectAndSubscribe = async () => {
      try {
        await mqttService.connect(brokerUrl);
      } catch (error) {
        console.error('[PadMqttProvider] Connection failed:', error);
      }
    };

    connectAndSubscribe();

    return () => {
      mqttService.disconnect();
    };
  }, [salonId, brokerUrl]);

  // Subscribe to transaction topics (requires stationId for device-to-device)
  useEffect(() => {
    if (!salonId || !stationId || connectionStatus !== 'connected') return;

    console.log('[PadMqttProvider] Setting up subscriptions for station:', stationId);

    const topicParams = { salonId, stationId };

    const readyToPayTopic = buildPadTopic(PAD_TOPICS.READY_TO_PAY, topicParams);
    const paymentResultTopic = buildPadTopic(PAD_TOPICS.PAYMENT_RESULT, topicParams);
    const cancelTopic = buildPadTopic(PAD_TOPICS.CANCEL, topicParams);

    console.log('[PadMqttProvider] 🔔 Subscribing to station-specific topics:', {
      readyToPayTopic,
      paymentResultTopic,
      cancelTopic,
      salonId,
      stationId,
    });

    const unsubReadyToPay = mqttService.subscribe<ReadyToPayPayload>(
      readyToPayTopic,
      (_topic, msg: MqttMessage<ReadyToPayPayload>) => {
        const payload = msg.payload;
        console.log('[PadMqttProvider] Received ready_to_pay from station:', stationId);
        dispatch(
          setTransaction({
            transactionId: payload.transactionId,
            clientId: payload.clientId,
            clientName: payload.clientName,
            clientEmail: payload.clientEmail,
            clientPhone: payload.clientPhone,
            staffName: payload.staffName,
            items: payload.items,
            subtotal: payload.subtotal,
            tax: payload.tax,
            discount: payload.discount,
            total: payload.total,
            loyaltyPoints: payload.loyaltyPoints,
            suggestedTips: payload.suggestedTips,
            showReceiptOptions: payload.showReceiptOptions,
            terminalType: payload.terminalType,
          })
        );
        dispatch(setScreen('order-review'));
      }
    );

    const unsubPaymentResult = mqttService.subscribe<PaymentResultPayload>(
      paymentResultTopic,
      (_topic, msg: MqttMessage<PaymentResultPayload>) => {
        console.log('[PadMqttProvider] ✅ Received payment_result:', msg);
        const payload = msg.payload;
        dispatch(
          setPaymentResult({
            success: payload.success,
            cardLast4: payload.cardLast4,
            authCode: payload.authCode,
            failureReason: payload.failureReason,
            processedAt: new Date().toISOString(),
          })
        );
        dispatch(setScreen('result'));
        console.log('[PadMqttProvider] Dispatched setPaymentResult and setScreen(result)');
      }
    );

    const unsubCancel = mqttService.subscribe(cancelTopic, () => {
      dispatch(clearTransaction());
      dispatch(resetToIdle());
      // Reset customer started flag for next transaction
      customerStartedRef.current = false;
      previousScreenRef.current = 'waiting';
    });

    // NEW: Subscribe to POS skip commands for staff override
    const skipTipTopic = buildPadTopic(PAD_TOPICS.POS_SKIP_TIP, topicParams);
    const skipSignatureTopic = buildPadTopic(PAD_TOPICS.POS_SKIP_SIGNATURE, topicParams);
    const forceCompleteTopic = buildPadTopic(PAD_TOPICS.POS_FORCE_COMPLETE, topicParams);

    const unsubSkipTip = mqttService.subscribe(skipTipTopic, () => {
      // Set tip to 0 and skip to next screen
      dispatch(setTip({ tipAmount: 0, tipPercent: null, selectedAt: new Date().toISOString() }));
      dispatch(setScreen('signature'));
    });

    const unsubSkipSignature = mqttService.subscribe(skipSignatureTopic, () => {
      // Skip signature and go to payment/receipt
      dispatch(setScreen('receipt'));
    });

    const unsubForceComplete = mqttService.subscribe(forceCompleteTopic, () => {
      // Force complete the transaction
      dispatch(clearTransaction());
      dispatch(resetToIdle());
      customerStartedRef.current = false;
      previousScreenRef.current = 'waiting';
    });

    return () => {
      unsubReadyToPay();
      unsubPaymentResult();
      unsubCancel();
      unsubSkipTip();
      unsubSkipSignature();
      unsubForceComplete();
    };
  }, [salonId, stationId, connectionStatus, dispatch]);

  // Subscribe to station heartbeat and unpair topics (device-to-device)
  useEffect(() => {
    if (!salonId || !stationId || connectionStatus !== 'connected') return;

    const pairing = getPairingInfo();
    const storeName = pairing?.stationName;

    // Start with disconnected status until we receive first heartbeat
    setPosConnection({ isConnected: false, storeName });

    // Reset heartbeat timeout
    const resetHeartbeatTimeout = () => {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      heartbeatTimeoutRef.current = setTimeout(() => {
        setPosConnection({ isConnected: false, storeName });
      }, HEARTBEAT_TIMEOUT_MS);
    };

    // Subscribe to THIS station's heartbeat (device-to-device)
    const stationHeartbeatTopic = buildPadTopic(PAD_TOPICS.STATION_HEARTBEAT, { salonId, stationId });
    console.log('[PadMqttProvider] Subscribing to station heartbeat:', stationHeartbeatTopic);

    const unsubHeartbeat = mqttService.subscribe(stationHeartbeatTopic, () => {
      setPosConnection({ isConnected: true, storeName });
      resetHeartbeatTimeout();
    });

    // Subscribe to unpair notifications for this device from this station
    const deviceId = localStorage.getItem('mango_pad_device_id');
    let unsubUnpair: (() => void) | null = null;
    if (deviceId) {
      const unpairTopic = buildPadTopic(PAD_TOPICS.PAD_UNPAIRED, { salonId, stationId, padId: deviceId });
      console.log('[PadMqttProvider] Subscribing to unpair topic:', unpairTopic);
      unsubUnpair = mqttService.subscribe(unpairTopic, () => {
        console.log('[PadMqttProvider] Received unpair notification from station:', stationId);
        setUnpairReceived(true);
      });
    }

    // Start initial timeout
    resetHeartbeatTimeout();

    return () => {
      unsubHeartbeat();
      if (unsubUnpair) unsubUnpair();
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, [salonId, stationId, connectionStatus]);

  // Publish Mango Pad heartbeat to its paired station (device-to-device)
  useEffect(() => {
    if (!salonId || !stationId || connectionStatus !== 'connected') return;

    // Get or create device ID (ensures dev mode always has a device ID)
    const deviceId = getOrCreateDeviceId();

    const pairing = getPairingInfo();
    const deviceName = pairing?.stationName
      ? `Mango Pad (${pairing.stationName})`
      : 'Mango Pad';

    // Publish heartbeat to THIS station only (device-to-device)
    const heartbeatTopic = buildPadTopic(PAD_TOPICS.PAD_HEARTBEAT, { salonId, stationId });
    console.log('[PadMqttProvider] Will publish heartbeats to:', heartbeatTopic);

    const publishHeartbeat = () => {
      // Get current screen from Redux state
      const currentScreen = (window as unknown as { __REDUX_STORE__?: { getState: () => { pad: { currentScreen: string } } } }).__REDUX_STORE__?.getState?.()?.pad?.currentScreen || 'idle';

      const payload = {
        deviceId,
        deviceName,
        salonId,
        pairedTo: stationId,
        timestamp: new Date().toISOString(),
        screen: currentScreen,
      };

      mqttService.publish(heartbeatTopic, payload).catch((err) => {
        console.warn('[PadMqttProvider] Failed to publish heartbeat:', err);
      });
    };

    // Send initial heartbeat
    publishHeartbeat();

    // Send heartbeats periodically
    const heartbeatInterval = setInterval(publishHeartbeat, PAD_HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [salonId, stationId, connectionStatus]);

  // Clear unpair received flag
  const clearUnpairReceived = useCallback(() => {
    setUnpairReceived(false);
  }, []);

  // Watch Redux currentScreen and publish screen changes
  // This catches ALL screen changes, including direct Redux dispatches
  useEffect(() => {
    if (!salonId || !stationId || connectionStatus !== 'connected') return;

    const prevScreen = previousScreenRef.current;
    if (currentScreen !== prevScreen) {
      console.log('[PadMqttProvider] 📱 Screen changed (Redux):', prevScreen, '->', currentScreen);
      previousScreenRef.current = currentScreen;

      // Publish the screen change
      const topic = buildPadTopic(PAD_TOPICS.SCREEN_CHANGED, { salonId, stationId });
      const payload = {
        transactionId: transactionId ?? '',
        ticketId: transactionId ?? '',
        screen: currentScreen,
        previousScreen: prevScreen,
        changedAt: new Date().toISOString(),
      };

      mqttService.publish(topic, payload).then(() => {
        console.log('[PadMqttProvider] ✅ screen_changed published:', currentScreen);
      }).catch((err) => {
        console.warn('[PadMqttProvider] ⚠️ Failed to publish screen_changed:', err);
      });

      // If moving from waiting/idle to order-review, also publish customer_started
      if ((prevScreen === 'waiting' || prevScreen === 'idle') && currentScreen === 'order-review') {
        if (transactionId && !customerStartedRef.current) {
          customerStartedRef.current = true;
          const customerStartedTopic = buildPadTopic(PAD_TOPICS.CUSTOMER_STARTED, { salonId, stationId });
          mqttService.publish(customerStartedTopic, {
            transactionId,
            ticketId: transactionId,
            screen: 'order-review',
            startedAt: new Date().toISOString(),
          }).catch((err) => {
            console.warn('[PadMqttProvider] ⚠️ Failed to publish customer_started:', err);
          });
        }
      }
    }
  }, [salonId, stationId, connectionStatus, currentScreen, transactionId]);

  // Set active transaction - converts ActiveTransaction to TransactionPayload and dispatches to Redux
  const setActiveTransactionFn = useCallback(
    (transaction: ActiveTransaction) => {
      const payload: TransactionPayload = {
        transactionId: transaction.transactionId,
        clientId: transaction.ticketId, // Use ticketId as clientId fallback
        clientName: transaction.clientName,
        clientEmail: transaction.clientEmail,
        clientPhone: transaction.clientPhone,
        staffName: transaction.staffName,
        items: transaction.items,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        discount: transaction.discount,
        total: transaction.total,
        suggestedTips: transaction.suggestedTips,
        showReceiptOptions: true,
      };
      dispatch(setTransaction(payload));
      // Also navigate to the appropriate screen based on step
      dispatch(setScreen(flowStepToScreen(transaction.step)));
    },
    [dispatch]
  );

  // Clear transaction - clears Redux state and resets to idle
  const clearTransactionFn = useCallback(() => {
    dispatch(clearTransaction());
    dispatch(resetToIdle());
  }, [dispatch]);

  // Update transaction step - changes the current flow step
  const updateTransactionStep = useCallback(
    (step: PadFlowStep) => {
      // Navigate to the appropriate screen for this step
      dispatch(setScreen(flowStepToScreen(step)));
    },
    [dispatch]
  );

  // All publish functions now use stationId for device-to-device communication
  const publishTipSelected = useCallback(
    async (payload: Omit<TipSelectedPayload, 'transactionId'>) => {
      if (!salonId || !stationId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.TIP_SELECTED, { salonId, stationId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, stationId, transactionId]
  );

  const publishSignature = useCallback(
    async (payload: Omit<SignatureCapturedPayload, 'transactionId'>) => {
      if (!salonId || !stationId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.SIGNATURE, { salonId, stationId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, stationId, transactionId]
  );

  const publishReceiptPreference = useCallback(
    async (payload: Omit<ReceiptPreferencePayload, 'transactionId'>) => {
      if (!salonId || !stationId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.RECEIPT_PREFERENCE, { salonId, stationId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, stationId, transactionId]
  );

  const publishTransactionComplete = useCallback(async () => {
    if (!salonId || !stationId || !transactionId) return;
    const topic = buildPadTopic(PAD_TOPICS.TRANSACTION_COMPLETE, { salonId, stationId });
    const payload: TransactionCompletePayload = {
      transactionId,
      completedAt: new Date().toISOString(),
    };
    await mqttService.publish(topic, payload);
  }, [salonId, stationId, transactionId]);

  const publishHelpRequested = useCallback(
    async (currentScreen: PadScreen) => {
      if (!salonId || !stationId) return;
      const topic = buildPadTopic(PAD_TOPICS.HELP_REQUESTED, { salonId, stationId });
      const payload: HelpRequestedPayload = {
        transactionId: transactionId ?? undefined,
        currentScreen,
        requestedAt: new Date().toISOString(),
      };
      await mqttService.publish(topic, payload);
    },
    [salonId, stationId, transactionId]
  );

  const publishSplitPayment = useCallback(
    async (payload: Omit<SplitPaymentPayload, 'transactionId'>) => {
      if (!salonId || !stationId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.SPLIT_PAYMENT, { salonId, stationId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, stationId, transactionId]
  );

  // NEW: Publish screen changed to Store App for real-time sync
  const publishScreenChanged = useCallback(
    async (newScreen: PadScreen, previousScreen: PadScreen) => {
      if (!salonId || !stationId) return;
      const topic = buildPadTopic(PAD_TOPICS.SCREEN_CHANGED, { salonId, stationId });
      const payload = {
        transactionId: transactionId ?? undefined,
        ticketId: transactionId ?? undefined, // Use transactionId as ticketId
        screen: newScreen,
        previousScreen,
        changedAt: new Date().toISOString(),
      };
      await mqttService.publish(topic, payload);
    },
    [salonId, stationId, transactionId]
  );

  // Publish customer_started when customer first interacts
  const publishCustomerStarted = useCallback(
    async () => {
      if (!salonId || !stationId || !transactionId || customerStartedRef.current) return;
      customerStartedRef.current = true;
      const topic = buildPadTopic(PAD_TOPICS.CUSTOMER_STARTED, { salonId, stationId });
      const payload = {
        transactionId,
        ticketId: transactionId,
        screen: 'order-review' as const,
        startedAt: new Date().toISOString(),
      };
      await mqttService.publish(topic, payload);
    },
    [salonId, stationId, transactionId]
  );

  // Set current screen via Redux and publish to Store App
  // NOTE: This must be defined AFTER publishScreenChanged and publishCustomerStarted
  const setCurrentScreen = useCallback(
    (screen: PadScreen) => {
      const prevScreen = previousScreenRef.current;

      // Only publish if screen actually changed
      if (screen !== prevScreen) {
        // Update the ref first
        previousScreenRef.current = screen;

        // Dispatch to Redux
        dispatch(setScreen(screen));

        // Fire-and-forget: Screen sync is informational, not transactional.
        // Store App will recover state from next heartbeat if publish fails.
        publishScreenChanged(screen, prevScreen);

        // If moving from waiting/idle to order-review, publish customer_started
        if ((prevScreen === 'waiting' || prevScreen === 'idle') && screen === 'order-review') {
          publishCustomerStarted();
        }
      } else {
        // Just dispatch if same screen (shouldn't happen often)
        dispatch(setScreen(screen));
      }
    },
    [dispatch, publishScreenChanged, publishCustomerStarted]
  );

  const reconnect = useCallback(async () => {
    if (!brokerUrl) return;
    mqttService.disconnect();
    await mqttService.connect(brokerUrl);
  }, [brokerUrl]);

  const contextValue: PadMqttContextValue = {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    posConnection,
    stationId,
    // Transaction state management
    activeTransaction,
    setActiveTransaction: setActiveTransactionFn,
    clearTransaction: clearTransactionFn,
    updateTransactionStep,
    // Publish functions
    publishTipSelected,
    publishSignature,
    publishReceiptPreference,
    publishTransactionComplete,
    publishHelpRequested,
    publishSplitPayment,
    setCurrentScreen,
    reconnect,
    // NEW: Screen sync
    publishScreenChanged,
  };

  const unpairContextValue: UnpairContextValue = {
    unpairReceived,
    clearUnpairReceived,
  };

  return (
    <PadMqttContext.Provider value={contextValue}>
      <UnpairContext.Provider value={unpairContextValue}>
        {children}
      </UnpairContext.Provider>
    </PadMqttContext.Provider>
  );
}

export function usePadMqtt(): PadMqttContextValue {
  const context = useContext(PadMqttContext);
  if (!context) {
    throw new Error('usePadMqtt must be used within a PadMqttProvider');
  }
  return context;
}

export function usePadMqttOptional(): PadMqttContextValue | null {
  return useContext(PadMqttContext);
}

/**
 * Hook to get POS connection status
 * Returns 'online' | 'offline' | 'unknown'
 */
export function usePosConnection(): PosConnectionStatus {
  const context = useContext(PadMqttContext);
  if (!context) {
    throw new Error('usePosConnection must be used within a PadMqttProvider');
  }
  return context.posConnection;
}

/**
 * Hook for unpair event handling
 * Returns { unpairReceived, clearUnpairReceived }
 */
export function useUnpairEvent(): UnpairContextValue {
  const context = useContext(UnpairContext);
  if (!context) {
    throw new Error('useUnpairEvent must be used within a PadMqttProvider');
  }
  return context;
}
