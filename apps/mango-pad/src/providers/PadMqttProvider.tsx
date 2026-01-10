/**
 * Pad MQTT Provider
 * Provides MQTT connectivity and Pad-specific topic handling
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { mqttService, type MqttMessage } from '@/services/mqttClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMqttConnectionStatus, setScreen, resetToIdle } from '@/store/slices/padSlice';
import { setTransaction, setPaymentResult, clearTransaction } from '@/store/slices/transactionSlice';
import { setShowReconnecting } from '@/store/slices/uiSlice';
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

interface PadMqttContextValue {
  connectionStatus: MqttConnectionStatus;
  isConnected: boolean;
  publishTipSelected: (payload: Omit<TipSelectedPayload, 'transactionId'>) => Promise<void>;
  publishSignature: (payload: Omit<SignatureCapturedPayload, 'transactionId'>) => Promise<void>;
  publishReceiptPreference: (
    payload: Omit<ReceiptPreferencePayload, 'transactionId'>
  ) => Promise<void>;
  publishTransactionComplete: () => Promise<void>;
  publishHelpRequested: (currentScreen: PadScreen) => Promise<void>;
  publishSplitPayment: (payload: Omit<SplitPaymentPayload, 'transactionId'>) => Promise<void>;
  reconnect: () => Promise<void>;
}

const PadMqttContext = createContext<PadMqttContextValue | null>(null);

interface PadMqttProviderProps {
  children: ReactNode;
}

export function PadMqttProvider({ children }: PadMqttProviderProps) {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config.config);
  const transactionId = useAppSelector((state) => state.transaction.current?.transactionId);
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus>('disconnected');

  const salonId = config.salonId;
  const brokerUrl = config.mqttBrokerUrl;

  useEffect(() => {
    const unsubscribeState = mqttService.onStateChange((status) => {
      setConnectionStatus(status);
      dispatch(setMqttConnectionStatus(status));
      dispatch(setShowReconnecting(status === 'reconnecting'));
    });

    return () => {
      unsubscribeState();
    };
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

  useEffect(() => {
    if (!salonId || connectionStatus !== 'connected') return;

    const readyToPayTopic = buildPadTopic(PAD_TOPICS.READY_TO_PAY, { salonId });
    const paymentResultTopic = buildPadTopic(PAD_TOPICS.PAYMENT_RESULT, { salonId });
    const cancelTopic = buildPadTopic(PAD_TOPICS.CANCEL, { salonId });

    const unsubReadyToPay = mqttService.subscribe<ReadyToPayPayload>(
      readyToPayTopic,
      (_topic, msg: MqttMessage<ReadyToPayPayload>) => {
        const payload = msg.payload;
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
  }, [salonId, connectionStatus, dispatch]);

  const publishTipSelected = useCallback(
    async (payload: Omit<TipSelectedPayload, 'transactionId'>) => {
      if (!salonId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.TIP_SELECTED, { salonId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, transactionId]
  );

  const publishSignature = useCallback(
    async (payload: Omit<SignatureCapturedPayload, 'transactionId'>) => {
      if (!salonId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.SIGNATURE, { salonId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, transactionId]
  );

  const publishReceiptPreference = useCallback(
    async (payload: Omit<ReceiptPreferencePayload, 'transactionId'>) => {
      if (!salonId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.RECEIPT_PREFERENCE, { salonId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, transactionId]
  );

  const publishTransactionComplete = useCallback(async () => {
    if (!salonId || !transactionId) return;
    const topic = buildPadTopic(PAD_TOPICS.TRANSACTION_COMPLETE, { salonId });
    const payload: TransactionCompletePayload = {
      transactionId,
      completedAt: new Date().toISOString(),
    };
    await mqttService.publish(topic, payload);
  }, [salonId, transactionId]);

  const publishHelpRequested = useCallback(
    async (currentScreen: PadScreen) => {
      if (!salonId) return;
      const topic = buildPadTopic(PAD_TOPICS.HELP_REQUESTED, { salonId });
      const payload: HelpRequestedPayload = {
        transactionId: transactionId ?? undefined,
        currentScreen,
        requestedAt: new Date().toISOString(),
      };
      await mqttService.publish(topic, payload);
    },
    [salonId, transactionId]
  );

  const publishSplitPayment = useCallback(
    async (payload: Omit<SplitPaymentPayload, 'transactionId'>) => {
      if (!salonId || !transactionId) return;
      const topic = buildPadTopic(PAD_TOPICS.SPLIT_PAYMENT, { salonId });
      await mqttService.publish(topic, { ...payload, transactionId });
    },
    [salonId, transactionId]
  );

  const reconnect = useCallback(async () => {
    if (!brokerUrl) return;
    mqttService.disconnect();
    await mqttService.connect(brokerUrl);
  }, [brokerUrl]);

  const contextValue: PadMqttContextValue = {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    publishTipSelected,
    publishSignature,
    publishReceiptPreference,
    publishTransactionComplete,
    publishHelpRequested,
    publishSplitPayment,
    reconnect,
  };

  return (
    <PadMqttContext.Provider value={contextValue}>
      {children}
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
