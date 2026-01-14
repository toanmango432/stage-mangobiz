/**
 * usePadHeartbeat Hook
 * Subscribe to Mango Pad heartbeats and manage device presence
 *
 * Device-to-Device (1:1) Architecture:
 * - Each Store App station subscribes to: salon/{storeId}/station/{stationId}/pad/heartbeat
 * - Each Store App station publishes to: salon/{storeId}/station/{stationId}/heartbeat
 * - Only receives heartbeats from Mango Pads paired to this specific station
 *
 * Part of: Mango Pad Integration (US-004, US-010)
 */

import { useEffect, useCallback, useRef } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  handleHeartbeat,
  checkOfflineDevices,
  selectAllPadDevices,
} from '@/store/slices/padDevicesSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { buildTopic, TOPIC_PATTERNS } from '../topics';
import { isMqttEnabled, getCloudBrokerUrl } from '../featureFlags';
import { supabase } from '@/services/supabase/client';
import { getOrCreateDeviceId } from '@/services/deviceRegistration';
import type { PadHeartbeatPayload } from '../types';

const OFFLINE_CHECK_INTERVAL = 10000; // Check every 10 seconds
const SUPABASE_SYNC_INTERVAL = 60000; // Sync to Supabase every 60 seconds
const STATION_HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5 seconds

export function usePadHeartbeat() {
  const dispatch = useAppDispatch();
  const reduxStoreId = useAppSelector(selectStoreId);

  // In dev mode, ALWAYS use VITE_STORE_ID (demo-salon) for consistent pairing with Mango Pad
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
  const envStoreId = import.meta.env.VITE_STORE_ID;
  const storeId = (isDevMode && envStoreId) ? envStoreId : (reduxStoreId || envStoreId || null);
  const padDevices = useAppSelector(selectAllPadDevices);
  const clientRef = useRef<MqttClient | null>(null);
  const offlineCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabaseSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const padDevicesRef = useRef(padDevices);

  // Keep padDevicesRef in sync to access in interval callback
  useEffect(() => {
    padDevicesRef.current = padDevices;
  }, [padDevices]);

  // Batch update Supabase with device online/offline status (US-010)
  const syncToSupabase = useCallback(async () => {
    const devices = padDevicesRef.current;
    if (!storeId || devices.length === 0) return;

    console.log('[usePadHeartbeat] Syncing', devices.length, 'devices to Supabase');

    // Batch update all tracked devices
    for (const device of devices) {
      try {
        await supabase
          .from('salon_devices')
          .update({
            is_online: device.status === 'online',
            last_seen_at: device.lastSeen,
          })
          .eq('store_id', storeId)
          .eq('device_fingerprint', device.id);
      } catch (error) {
        console.error('[usePadHeartbeat] Failed to sync device:', device.id, error);
      }
    }
  }, [storeId]);

  const handleHeartbeatMessage = useCallback(
    (payload: PadHeartbeatPayload) => {
      dispatch(handleHeartbeat(payload));
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isMqttEnabled()) {
      console.log('[usePadHeartbeat] MQTT disabled');
      return;
    }
    if (!storeId) {
      console.log('[usePadHeartbeat] No storeId, skipping');
      return;
    }

    // Get station ID (this device's fingerprint) for device-to-device communication
    const stationId = getOrCreateDeviceId();

    const brokerUrl = getCloudBrokerUrl();
    // Subscribe to pad heartbeats for this specific station
    const padHeartbeatTopic = buildTopic(TOPIC_PATTERNS.PAD_HEARTBEAT, { storeId, stationId });
    // Topic for publishing station heartbeats
    const stationHeartbeatTopic = buildTopic(TOPIC_PATTERNS.STATION_HEARTBEAT, { storeId, stationId });

    console.log('[usePadHeartbeat] Station ID:', stationId);
    console.log('[usePadHeartbeat] Connecting to MQTT broker:', brokerUrl);
    console.log('[usePadHeartbeat] Will subscribe to:', padHeartbeatTopic);
    console.log('[usePadHeartbeat] Will publish heartbeats to:', stationHeartbeatTopic);

    const client = mqtt.connect(brokerUrl, {
      clientId: `pos-station-${stationId}-${Date.now()}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('[usePadHeartbeat] Connected to MQTT broker');

      // Subscribe to pad heartbeats for this station
      client.subscribe(padHeartbeatTopic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[usePadHeartbeat] Subscribe error:', err);
        } else {
          console.log('[usePadHeartbeat] Subscribed to:', padHeartbeatTopic);
        }
      });

      // Start publishing station heartbeats so Mango Pad knows we're online
      const publishHeartbeat = () => {
        const heartbeat = {
          stationId,
          storeId,
          timestamp: new Date().toISOString(),
          status: 'online',
        };
        client.publish(stationHeartbeatTopic, JSON.stringify(heartbeat), { qos: 0 });
      };

      // Publish immediately and then every 5 seconds
      publishHeartbeat();
      heartbeatIntervalRef.current = setInterval(publishHeartbeat, STATION_HEARTBEAT_INTERVAL);
    });

    client.on('message', (receivedTopic, message) => {
      if (receivedTopic.includes('/pad/heartbeat')) {
        try {
          const parsed = JSON.parse(message.toString());

          // Handle wrapped MqttMessage format { id, timestamp, payload } from Mango Pad
          // or direct payload format for backwards compatibility
          let payload: PadHeartbeatPayload;
          if (parsed.payload && typeof parsed.payload === 'object') {
            // Wrapped format: { id, timestamp, payload: PadHeartbeatPayload }
            payload = parsed.payload as PadHeartbeatPayload;
            console.log('[usePadHeartbeat] Received wrapped pad heartbeat:', payload);
          } else if (parsed.deviceId) {
            // Direct payload format (has deviceId at root level)
            payload = parsed as PadHeartbeatPayload;
            console.log('[usePadHeartbeat] Received direct pad heartbeat:', payload);
          } else {
            console.warn('[usePadHeartbeat] Unknown message format:', parsed);
            return;
          }

          handleHeartbeatMessage(payload);
        } catch (error) {
          console.error('[usePadHeartbeat] Failed to parse message:', error);
        }
      }
    });

    client.on('error', (err) => {
      console.error('[usePadHeartbeat] MQTT error:', err);
    });

    // Check for offline devices periodically
    offlineCheckRef.current = setInterval(() => {
      dispatch(checkOfflineDevices());
    }, OFFLINE_CHECK_INTERVAL);

    // Sync device status to Supabase every 60 seconds (US-010)
    supabaseSyncRef.current = setInterval(() => {
      syncToSupabase();
    }, SUPABASE_SYNC_INTERVAL);

    return () => {
      if (offlineCheckRef.current) {
        clearInterval(offlineCheckRef.current);
        offlineCheckRef.current = null;
      }
      if (supabaseSyncRef.current) {
        clearInterval(supabaseSyncRef.current);
        supabaseSyncRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      client.end(true);
      clientRef.current = null;
    };
  }, [storeId, dispatch, handleHeartbeatMessage, syncToSupabase]);
}

export default usePadHeartbeat;
