/**
 * POS Heartbeat Provider
 *
 * Publishes heartbeats to MQTT broker so Mango Pad knows Store App is online.
 * This provider runs at the app level, INDEPENDENT of authentication state,
 * so heartbeats are published even when showing the login screen in dev mode.
 *
 * Part of: Mango Pad Integration
 */

import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import mqtt, { type MqttClient } from 'mqtt';

// Constants
const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds

// Get store ID from env (works without login)
const STORE_ID = import.meta.env.VITE_STORE_ID || 'demo-salon';
const STORE_NAME = 'Mango POS';
const APP_VERSION = '1.0.0';

// Check if MQTT is enabled
function isMqttEnabled(): boolean {
  return import.meta.env.VITE_USE_MQTT === 'true';
}

// Get cloud broker URL
function getCloudBrokerUrl(): string {
  return import.meta.env.VITE_MQTT_CLOUD_URL || 'wss://broker.emqx.io:8084/mqtt';
}

interface PosHeartbeatPayload {
  storeId: string;
  storeName: string;
  timestamp: string;
  version: string;
}

interface PosHeartbeatProviderProps {
  children: ReactNode;
}

export function PosHeartbeatProvider({ children }: PosHeartbeatProviderProps) {
  const clientRef = useRef<MqttClient | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPublishingRef = useRef(false);

  const publishHeartbeat = useCallback(() => {
    if (isPublishingRef.current || !clientRef.current?.connected) return;

    try {
      isPublishingRef.current = true;
      const topic = `salon/${STORE_ID}/pos/heartbeat`;

      const payload: PosHeartbeatPayload = {
        storeId: STORE_ID,
        storeName: STORE_NAME,
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
      };

      clientRef.current.publish(topic, JSON.stringify(payload), { qos: 0 });
      console.log('[PosHeartbeat] Published heartbeat to:', topic);
    } catch (error) {
      console.warn('[PosHeartbeat] Failed to publish heartbeat:', error);
    } finally {
      isPublishingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isMqttEnabled()) {
      console.log('[PosHeartbeat] MQTT disabled, skipping heartbeat');
      return;
    }

    const brokerUrl = getCloudBrokerUrl();
    console.log('[PosHeartbeat] Connecting to MQTT broker:', brokerUrl);

    const client = mqtt.connect(brokerUrl, {
      clientId: `pos-heartbeat-${STORE_ID}-${Date.now()}`,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('[PosHeartbeat] Connected to MQTT broker');
      // Publish immediately on connect
      publishHeartbeat();
      // Then publish every 15 seconds
      intervalRef.current = setInterval(publishHeartbeat, HEARTBEAT_INTERVAL_MS);
    });

    client.on('error', (err) => {
      console.error('[PosHeartbeat] MQTT error:', err);
    });

    client.on('reconnect', () => {
      console.log('[PosHeartbeat] Reconnecting to MQTT broker...');
    });

    client.on('close', () => {
      console.log('[PosHeartbeat] MQTT connection closed');
    });

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (client) {
        client.end(true);
      }
      clientRef.current = null;
    };
  }, [publishHeartbeat]);

  // Also cleanup on window unload
  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  return <>{children}</>;
}

export default PosHeartbeatProvider;
