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
import {
  setPadScreenChanged,
  setCustomerStarted,
} from '@/store/slices/padTransactionSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { buildTopic, TOPIC_PATTERNS } from '../topics';
import { isMqttEnabled, getCloudBrokerUrl } from '../featureFlags';
import { supabase } from '@/services/supabase/client';
import { getOrCreateDeviceId } from '@/services/deviceRegistration';
import type { PadHeartbeatPayload, PadScreenChangedPayload, PadCustomerStartedPayload } from '../types';

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
    // NEW: Screen sync topics (Phase 1 Integration)
    const screenChangedTopic = buildTopic(TOPIC_PATTERNS.PAD_SCREEN_CHANGED, { storeId, stationId });
    const customerStartedTopic = buildTopic(TOPIC_PATTERNS.PAD_CUSTOMER_STARTED, { storeId, stationId });

    const client = mqtt.connect(brokerUrl, {
      clientId: `pos-station-${stationId}-${Date.now()}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      // Subscribe to pad heartbeats for this station
      client.subscribe(padHeartbeatTopic, { qos: 0 });

      // Subscribe to screen sync topics for real-time Pad state
      client.subscribe(screenChangedTopic, { qos: 1 });
      client.subscribe(customerStartedTopic, { qos: 1 });

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
      try {
        const parsed = JSON.parse(message.toString());

        // Extract payload from wrapped format { id, timestamp, payload } or use direct format
        const unwrapPayload = <T>(directCheck: (p: unknown) => boolean): T | null => {
          if (parsed.payload && typeof parsed.payload === 'object') {
            return parsed.payload as T;
          }
          if (directCheck(parsed)) {
            return parsed as T;
          }
          return null;
        };

        // Handle heartbeat messages
        if (receivedTopic.includes('/pad/heartbeat')) {
          const payload = unwrapPayload<PadHeartbeatPayload>((p: unknown) => !!(p as PadHeartbeatPayload).deviceId);
          if (!payload) {
            return;
          }
          handleHeartbeatMessage(payload);
          return;
        }

        // Handle screen_changed messages from Pad
        if (receivedTopic.includes('/pad/screen_changed')) {
          const payload = unwrapPayload<PadScreenChangedPayload>(
            (p: unknown) => !!(p as PadScreenChangedPayload).screen && !!(p as PadScreenChangedPayload).transactionId
          );
          if (!payload) {
            return;
          }
          dispatch(setPadScreenChanged({
            transactionId: payload.transactionId,
            screen: payload.screen,
            previousScreen: payload.previousScreen,
            changedAt: payload.changedAt,
          }));
          return;
        }

        // Handle customer_started messages from Pad
        if (receivedTopic.includes('/pad/customer_started')) {
          const payload = unwrapPayload<PadCustomerStartedPayload>(
            (p: unknown) => !!(p as PadCustomerStartedPayload).transactionId
          );
          if (!payload) {
            return;
          }
          dispatch(setCustomerStarted({ transactionId: payload.transactionId }));
          return;
        }
      } catch (error) {
        console.error('[usePadHeartbeat] Failed to parse message:', error);
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
      // Unsubscribe from all topics before disconnecting
      client.unsubscribe([padHeartbeatTopic, screenChangedTopic, customerStartedTopic]);
      client.end(true);
      clientRef.current = null;
    };
  }, [storeId, dispatch, handleHeartbeatMessage, syncToSupabase]);
}

export default usePadHeartbeat;
