/**
 * usePadHeartbeat Hook
 * Subscribe to Mango Pad heartbeats and manage device presence
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
import type { PadHeartbeatPayload } from '../types';

const OFFLINE_CHECK_INTERVAL = 10000; // Check every 10 seconds
const SUPABASE_SYNC_INTERVAL = 60000; // Sync to Supabase every 60 seconds

export function usePadHeartbeat() {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);
  const padDevices = useAppSelector(selectAllPadDevices);
  const clientRef = useRef<MqttClient | null>(null);
  const offlineCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabaseSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

    const brokerUrl = getCloudBrokerUrl();
    const topic = buildTopic(TOPIC_PATTERNS.PAD_HEARTBEAT, { storeId });
    
    console.log('[usePadHeartbeat] Connecting to MQTT broker:', brokerUrl);
    console.log('[usePadHeartbeat] Will subscribe to:', topic);

    const client = mqtt.connect(brokerUrl, {
      clientId: `pos-pad-listener-${storeId}-${Date.now()}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('[usePadHeartbeat] Connected to MQTT broker');
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[usePadHeartbeat] Subscribe error:', err);
        } else {
          console.log('[usePadHeartbeat] Subscribed to:', topic);
        }
      });
    });

    client.on('message', (receivedTopic, message) => {
      if (receivedTopic.includes('/pad/heartbeat')) {
        try {
          const payload = JSON.parse(message.toString()) as PadHeartbeatPayload;
          console.log('[usePadHeartbeat] Received pad heartbeat:', payload);
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
      client.end(true);
      clientRef.current = null;
    };
  }, [storeId, dispatch, handleHeartbeatMessage, syncToSupabase]);
}

export default usePadHeartbeat;
