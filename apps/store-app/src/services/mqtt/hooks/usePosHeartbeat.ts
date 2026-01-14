/**
 * usePosHeartbeat Hook
 * Publish station heartbeats so Mango Pad knows Store App is connected
 *
 * Device-to-Device (1:1) Architecture:
 * - Each Store App station publishes to: salon/{storeId}/station/{stationId}/heartbeat
 * - Only the Mango Pad paired to this station receives the heartbeat
 *
 * NOTE: This hook is now largely redundant as usePadHeartbeat also publishes station heartbeats.
 * Keeping for backwards compatibility and explicit heartbeat control.
 *
 * Part of: Mango Pad Integration (US-011)
 */

import { useEffect, useRef, useCallback } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import { useAppSelector } from '@/store/hooks';
import { selectStoreId, selectStoreName } from '@/store/slices/authSlice';
import { buildTopic, TOPIC_PATTERNS } from '../topics';
import { isMqttEnabled, getCloudBrokerUrl } from '../featureFlags';
import { getOrCreateDeviceId } from '@/services/deviceRegistration';
import type { PosHeartbeatPayload } from '../types';

const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds
const APP_VERSION = '1.0.0';

export function usePosHeartbeat() {
  const reduxStoreId = useAppSelector(selectStoreId);
  const reduxStoreName = useAppSelector(selectStoreName);

  // In dev mode, ALWAYS use VITE_STORE_ID (demo-salon) for consistent pairing with Mango Pad
  // After login, Redux storeId becomes the database ID which won't match Mango Pad's expected salonId
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
  const envStoreId = import.meta.env.VITE_STORE_ID;
  const storeId = (isDevMode && envStoreId) ? envStoreId : (reduxStoreId || envStoreId || null);
  const storeName = reduxStoreName || 'Dev Store';
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientRef = useRef<MqttClient | null>(null);
  const isPublishingRef = useRef(false);
  const stationIdRef = useRef<string | null>(null);

  const publishHeartbeat = useCallback(() => {
    if (!storeId || isPublishingRef.current || !clientRef.current?.connected) return;

    try {
      isPublishingRef.current = true;
      // Get station ID (this device's fingerprint) for device-to-device communication
      const stationId = stationIdRef.current || getOrCreateDeviceId();
      stationIdRef.current = stationId;

      const topic = buildTopic(TOPIC_PATTERNS.STATION_HEARTBEAT, { storeId, stationId });

      const payload: PosHeartbeatPayload = {
        storeId,
        stationId,
        storeName: storeName || 'Unknown Store',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
      };

      clientRef.current.publish(topic, JSON.stringify(payload), { qos: 0 });
      console.log('[usePosHeartbeat] Published heartbeat to:', topic);
    } catch (error) {
      console.warn('[usePosHeartbeat] Failed to publish heartbeat:', error);
    } finally {
      isPublishingRef.current = false;
    }
  }, [storeId, storeName]);

  useEffect(() => {
    if (!isMqttEnabled()) {
      console.log('[usePosHeartbeat] MQTT disabled');
      return;
    }
    if (!storeId) {
      console.log('[usePosHeartbeat] No storeId, skipping');
      return;
    }

    // Get station ID for device-to-device communication
    const stationId = getOrCreateDeviceId();
    stationIdRef.current = stationId;

    const brokerUrl = getCloudBrokerUrl();
    console.log('[usePosHeartbeat] Station ID:', stationId);
    console.log('[usePosHeartbeat] Connecting to MQTT broker:', brokerUrl);

    const client = mqtt.connect(brokerUrl, {
      clientId: `pos-heartbeat-${stationId}-${Date.now()}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('[usePosHeartbeat] Connected to MQTT broker');
      // Publish immediately
      publishHeartbeat();
      // Then every 15 seconds
      intervalRef.current = setInterval(publishHeartbeat, HEARTBEAT_INTERVAL_MS);
    });

    client.on('error', (err) => {
      console.error('[usePosHeartbeat] MQTT error:', err);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      client.end(true);
      clientRef.current = null;
    };
  }, [storeId, publishHeartbeat]);

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
