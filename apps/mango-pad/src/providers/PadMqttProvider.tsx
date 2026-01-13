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
import { setTransaction, setPaymentResult, clearTransaction } from '@/store/slices/transactionSlice';
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
}

const PadMqttContext = createContext<PadMqttContextValue | null>(null);

interface PadMqttProviderProps {
  children: ReactNode;
}

// Heartbeat timeout - if no heartbeat received within this time, POS is considered offline
const HEARTBEAT_TIMEOUT_MS = 15000; // 15 seconds

// How often Mango Pad sends its heartbeat to Store App
const PAD_HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds

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

export function PadMqttProvider({ children }: PadMqttProviderProps) {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config.config);
  const transactionId = useAppSelector((state) => state.transaction.current?.transactionId);
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus>('disconnected');
  const [posConnection, setPosConnection] = useState<PosConnectionStatus>({ isConnected: false });
  const [unpairReceived, setUnpairReceived] = useState(false);
  const [stationId, setStationId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const offlineAlertSentRef = useRef(false);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use broker URL from config
  const brokerUrl = config.mqttBrokerUrl;

  // Load salonId and stationId from pairing info on mount
  useEffect(() => {
    const pairing = getPairingInfo();
    if (pairing) {
      setStationId(pairing.stationId);
      setSalonId(pairing.salonId);
      console.log('[PadMqttProvider] Loaded pairing info:', {
        stationId: pairing.stationId,
        salonId: pairing.salonId,
      });
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

    console.log('[PadMqttProvider] Subscribing to station-specific topics:', {
      readyToPayTopic,
      paymentResultTopic,
      cancelTopic,
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
      }
    );

    const unsubCancel = mqttService.subscribe(cancelTopic, () => {
      dispatch(clearTransaction());
      dispatch(resetToIdle());
    });

    return () => {
      unsubReadyToPay();
      unsubPaymentResult();
      unsubCancel();
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

    const deviceId = localStorage.getItem('mango_pad_device_id');
    if (!deviceId) return;

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

  // Set current screen via Redux
  const setCurrentScreen = useCallback(
    (screen: PadScreen) => {
      dispatch(setScreen(screen));
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
    publishTipSelected,
    publishSignature,
    publishReceiptPreference,
    publishTransactionComplete,
    publishHelpRequested,
    publishSplitPayment,
    setCurrentScreen,
    reconnect,
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
