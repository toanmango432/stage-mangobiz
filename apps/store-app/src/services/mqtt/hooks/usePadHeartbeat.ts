/**
 * usePadHeartbeat Hook
 * Subscribe to Mango Pad heartbeats and manage device presence
 *
 * Part of: Mango Pad Integration (US-004)
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  handleHeartbeat,
  checkOfflineDevices,
} from '@/store/slices/padDevicesSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { useMqttContext } from '../MqttProvider';
import { buildTopic, TOPIC_PATTERNS } from '../topics';
import { isMqttEnabled } from '../featureFlags';
import type { PadHeartbeatPayload, MqttMessage } from '../types';

const OFFLINE_CHECK_INTERVAL = 10000; // Check every 10 seconds

export function usePadHeartbeat() {
  const dispatch = useAppDispatch();
  const { subscribe, connection } = useMqttContext();
  const storeId = useAppSelector(selectStoreId);
  const offlineCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleHeartbeatMessage = useCallback(
    (_topic: string, message: MqttMessage<PadHeartbeatPayload>) => {
      dispatch(handleHeartbeat(message.payload));
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isMqttEnabled()) return;
    if (connection.state !== 'connected') return;
    if (!storeId) return;

    const topic = buildTopic(TOPIC_PATTERNS.PAD_HEARTBEAT, {
      storeId,
    });

    const unsubscribe = subscribe(topic, handleHeartbeatMessage as any);

    offlineCheckRef.current = setInterval(() => {
      dispatch(checkOfflineDevices());
    }, OFFLINE_CHECK_INTERVAL);

    return () => {
      unsubscribe();
      if (offlineCheckRef.current) {
        clearInterval(offlineCheckRef.current);
        offlineCheckRef.current = null;
      }
    };
  }, [
    connection.state,
    storeId,
    dispatch,
    handleHeartbeatMessage,
    subscribe,
  ]);
}

export default usePadHeartbeat;
