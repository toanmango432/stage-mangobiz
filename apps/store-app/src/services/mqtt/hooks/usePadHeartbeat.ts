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

import { useEffect, useRef } from 'react';
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

  // Refs to prevent cleanup race conditions
  const clientRef = useRef<MqttClient | null>(null);
  const isDisconnectingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const offlineCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabaseSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const padDevicesRef = useRef(padDevices);

  // Store dispatch in ref to keep effect dependencies stable
  const dispatchRef = useRef(dispatch);
  const storeIdRef = useRef(storeId);

  // Keep refs in sync
  useEffect(() => {
    padDevicesRef.current = padDevices;
  }, [padDevices]);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    storeIdRef.current = storeId;
  }, [storeId]);

  // Single stable effect - only runs once on mount (or when storeId changes)
  useEffect(() => {
    if (!isMqttEnabled()) {
      console.log('[usePadHeartbeat] MQTT disabled');
      return;
    }
    if (!storeId) {
      console.log('[usePadHeartbeat] No storeId, skipping');
      return;
    }

    // Reset state for new connection
    isDisconnectingRef.current = false;
    isConnectedRef.current = false;

    // Get station ID (this device's fingerprint) for device-to-device communication
    const stationId = getOrCreateDeviceId();

    const brokerUrl = getCloudBrokerUrl();
    // Subscribe to pad heartbeats for this specific station
    const padHeartbeatTopic = buildTopic(TOPIC_PATTERNS.PAD_HEARTBEAT, { storeId, stationId });
    // Topic for publishing station heartbeats
    const stationHeartbeatTopic = buildTopic(TOPIC_PATTERNS.STATION_HEARTBEAT, { storeId, stationId });
    // Screen sync topics (Phase 1 Integration)
    const screenChangedTopic = buildTopic(TOPIC_PATTERNS.PAD_SCREEN_CHANGED, { storeId, stationId });
    const customerStartedTopic = buildTopic(TOPIC_PATTERNS.PAD_CUSTOMER_STARTED, { storeId, stationId });

    console.log('[usePadHeartbeat] 🔌 Connecting to MQTT broker:', brokerUrl);

    const client = mqtt.connect(brokerUrl, {
      clientId: `pos-station-${stationId}-${Date.now()}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
    });

    clientRef.current = client;

    // Safe publish function that checks connection state
    const safePublish = (topic: string, message: string) => {
      if (isDisconnectingRef.current) {
        return; // Silently skip during cleanup
      }
      if (!isConnectedRef.current) {
        return; // Skip if not connected
      }
      if (!client.connected) {
        return; // Skip if MQTT client reports not connected
      }
      try {
        client.publish(topic, message, { qos: 0 });
      } catch {
        // Ignore publish errors during disconnect
      }
    };

    client.on('connect', () => {
      if (isDisconnectingRef.current) return; // Ignore if cleaning up

      isConnectedRef.current = true;
      console.log('[usePadHeartbeat] 🟢 MQTT Connected! Subscribing to topics...');

      // Subscribe to pad heartbeats for this station
      client.subscribe(padHeartbeatTopic, { qos: 0 }, (err) => {
        if (err) console.error('[usePadHeartbeat] Failed to subscribe to padHeartbeat:', err);
        else console.log('[usePadHeartbeat] ✅ Subscribed to:', padHeartbeatTopic);
      });

      // Subscribe to screen sync topics for real-time Pad state
      client.subscribe(screenChangedTopic, { qos: 1 }, (err) => {
        if (err) console.error('[usePadHeartbeat] Failed to subscribe to screenChanged:', err);
        else console.log('[usePadHeartbeat] ✅ Subscribed to:', screenChangedTopic);
      });
      client.subscribe(customerStartedTopic, { qos: 1 }, (err) => {
        if (err) console.error('[usePadHeartbeat] Failed to subscribe to customerStarted:', err);
        else console.log('[usePadHeartbeat] ✅ Subscribed to:', customerStartedTopic);
      });

      // Clear any existing heartbeat interval before starting new one
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Start publishing station heartbeats so Mango Pad knows we're online
      const publishHeartbeat = () => {
        const heartbeat = {
          stationId,
          storeId: storeIdRef.current,
          timestamp: new Date().toISOString(),
          status: 'online',
        };
        safePublish(stationHeartbeatTopic, JSON.stringify(heartbeat));
      };

      // Publish immediately and then every 5 seconds
      publishHeartbeat();
      heartbeatIntervalRef.current = setInterval(publishHeartbeat, STATION_HEARTBEAT_INTERVAL);
    });

    client.on('disconnect', () => {
      isConnectedRef.current = false;
      console.log('[usePadHeartbeat] 🔴 MQTT Disconnected');
    });

    client.on('close', () => {
      isConnectedRef.current = false;
    });

    client.on('message', (receivedTopic, message) => {
      if (isDisconnectingRef.current) return; // Ignore messages during cleanup

      try {
        const parsed = JSON.parse(message.toString());
        // Log all non-heartbeat messages for debugging
        if (!receivedTopic.includes('/heartbeat')) {
          console.log('[usePadHeartbeat] 📨 Message received on topic:', receivedTopic);
        }

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
          dispatchRef.current(handleHeartbeat(payload));
          return;
        }

        // Handle screen_changed messages from Pad
        if (receivedTopic.includes('/pad/screen_changed')) {
          console.log('[usePadHeartbeat] 📱 Received screen_changed:', parsed);
          const payload = unwrapPayload<PadScreenChangedPayload>(
            (p: unknown) => !!(p as PadScreenChangedPayload).screen && !!(p as PadScreenChangedPayload).transactionId
          );
          if (!payload) {
            console.warn('[usePadHeartbeat] ⚠️ Could not extract screen_changed payload');
            return;
          }
          console.log('[usePadHeartbeat] 📱 Screen changed:', payload.previousScreen, '->', payload.screen);
          dispatchRef.current(setPadScreenChanged({
            transactionId: payload.transactionId,
            screen: payload.screen,
            previousScreen: payload.previousScreen,
            changedAt: payload.changedAt,
          }));
          return;
        }

        // Handle customer_started messages from Pad
        if (receivedTopic.includes('/pad/customer_started')) {
          console.log('[usePadHeartbeat] 👤 Received customer_started:', parsed);
          const payload = unwrapPayload<PadCustomerStartedPayload>(
            (p: unknown) => !!(p as PadCustomerStartedPayload).transactionId
          );
          if (!payload) {
            console.warn('[usePadHeartbeat] ⚠️ Could not extract customer_started payload');
            return;
          }
          console.log('[usePadHeartbeat] 👤 Customer started on transaction:', payload.transactionId);
          dispatchRef.current(setCustomerStarted({ transactionId: payload.transactionId }));
          return;
        }
      } catch (error) {
        console.error('[usePadHeartbeat] Failed to parse message:', error);
      }
    });

    client.on('error', (err) => {
      // Only log errors if not disconnecting (to prevent noise during cleanup)
      if (!isDisconnectingRef.current) {
        console.error('[usePadHeartbeat] MQTT error:', err);
      }
    });

    // Batch update Supabase with device online/offline status (US-010)
    const syncToSupabase = async () => {
      const devices = padDevicesRef.current;
      const currentStoreId = storeIdRef.current;
      if (!currentStoreId || devices.length === 0) return;

      console.log('[usePadHeartbeat] Syncing', devices.length, 'devices to Supabase');

      for (const device of devices) {
        try {
          await supabase
            .from('salon_devices')
            .update({
              is_online: device.status === 'online',
              last_seen_at: device.lastSeen,
            })
            .eq('store_id', currentStoreId)
            .eq('device_fingerprint', device.id);
        } catch (error) {
          console.error('[usePadHeartbeat] Failed to sync device:', device.id, error);
        }
      }
    };

    // Check for offline devices periodically
    offlineCheckRef.current = setInterval(() => {
      if (!isDisconnectingRef.current) {
        dispatchRef.current(checkOfflineDevices());
      }
    }, OFFLINE_CHECK_INTERVAL);

    // Sync device status to Supabase every 60 seconds (US-010)
    supabaseSyncRef.current = setInterval(() => {
      if (!isDisconnectingRef.current) {
        syncToSupabase();
      }
    }, SUPABASE_SYNC_INTERVAL);

    return () => {
      console.log('[usePadHeartbeat] 🧹 Cleaning up MQTT connection...');

      // Set flag FIRST to prevent any further operations
      isDisconnectingRef.current = true;
      isConnectedRef.current = false;

      // Clear all intervals BEFORE disconnecting
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (offlineCheckRef.current) {
        clearInterval(offlineCheckRef.current);
        offlineCheckRef.current = null;
      }
      if (supabaseSyncRef.current) {
        clearInterval(supabaseSyncRef.current);
        supabaseSyncRef.current = null;
      }

      // Remove all listeners to prevent callbacks during disconnect
      client.removeAllListeners();

      // Now safe to disconnect
      if (client.connected) {
        client.unsubscribe([padHeartbeatTopic, screenChangedTopic, customerStartedTopic], () => {
          client.end(false); // Graceful disconnect (not forced)
        });
      } else {
        client.end(false);
      }

      clientRef.current = null;
    };
  }, [storeId]); // Only storeId as dependency - dispatch is stable, callbacks use refs
}

export default usePadHeartbeat;
