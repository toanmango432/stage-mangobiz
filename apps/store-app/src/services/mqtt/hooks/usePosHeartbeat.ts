/**
 * usePosHeartbeat Hook
 * Publish POS heartbeats so Mango Pad knows Store App is connected
 *
 * Part of: Mango Pad Integration (US-011)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectStoreId, selectStoreName } from '@/store/slices/authSlice';
import { useMqttContext } from '../MqttProvider';
import { buildTopic, TOPIC_PATTERNS, getQosForTopic } from '../topics';
import { isMqttEnabled } from '../featureFlags';
import type { PosHeartbeatPayload } from '../types';

const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds
const APP_VERSION = '1.0.0'; // TODO: Pull from package.json or build config

export function usePosHeartbeat() {
  const { publish, connection } = useMqttContext();
  const storeId = useAppSelector(selectStoreId);
  const storeName = useAppSelector(selectStoreName);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPublishingRef = useRef(false);

  const publishHeartbeat = useCallback(async () => {
    if (!storeId || isPublishingRef.current) return;

    try {
      isPublishingRef.current = true;
      const topic = buildTopic(TOPIC_PATTERNS.POS_HEARTBEAT, { storeId });
      const qos = getQosForTopic(topic);

      const payload: PosHeartbeatPayload = {
        storeId,
        storeName: storeName || 'Unknown Store',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
      };

      await publish(topic, payload, { qos });
    } catch (error) {
      console.warn('[usePosHeartbeat] Failed to publish heartbeat:', error);
    } finally {
      isPublishingRef.current = false;
    }
  }, [storeId, storeName, publish]);

  useEffect(() => {
    if (!isMqttEnabled()) return;
    if (connection.state !== 'connected') return;
    if (!storeId) return;

    // Publish immediately on connect
    publishHeartbeat();

    // Then publish every 15 seconds
    intervalRef.current = setInterval(publishHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connection.state, storeId, publishHeartbeat]);

  // Cleanup on window unload/beforeunload
  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('unload', cleanup);
      cleanup();
    };
  }, []);
}

export default usePosHeartbeat;
