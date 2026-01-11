/**
 * Mango Pad MQTT Provider
 * Provides MQTT connection, heartbeat publishing, and POS connection status
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import mqtt, { type MqttClient as MqttClientType } from 'mqtt';
import {
  PAD_CONFIG,
  getSalonId,
  getDeviceId,
  getMqttBrokerUrl
} from '../constants/config';
import { getPairingInfo } from '../services/pairingService';
import type { PadScreen, PosConnectionState } from '../types';

// =============================================================================
// Topic Patterns (aligned with @mango/mqtt)
// =============================================================================

const TOPICS = {
  PAD_HEARTBEAT: 'salon/{salonId}/pad/heartbeat',
  POS_HEARTBEAT: 'salon/{salonId}/pos/heartbeat',
  // Device pairing notifications (US-012, US-013)
  PAD_UNPAIRED: 'salon/{salonId}/pad/{deviceId}/unpaired',
};

function buildTopic(pattern: string, params: Record<string, string>): string {
  let topic = pattern;
  for (const [key, value] of Object.entries(params)) {
    topic = topic.replace(`{${key}}`, value);
  }
  return topic;
}

// =============================================================================
// Payload Types (aligned with @mango/mqtt)
// =============================================================================

interface PadHeartbeatPayload {
  deviceId: string;
  deviceName: string;
  salonId: string;
  /** Device ID of the Store App station this Pad is paired to (US-010) */
  pairedTo?: string;
  timestamp: string;
  screen: PadScreen;
}

interface PosHeartbeatPayload {
  storeId: string;
  storeName: string;
  timestamp: string;
  version: string;
}

// =============================================================================
// Context
// =============================================================================

interface PadMqttContextValue {
  /** MQTT connected status */
  isConnected: boolean;
  /** Current screen for heartbeat */
  currentScreen: PadScreen;
  /** Set the current screen */
  setCurrentScreen: (screen: PadScreen) => void;
  /** POS connection status */
  posConnection: PosConnectionState;
  /** Salon ID */
  salonId: string;
  /** Device ID */
  deviceId: string;
  /** Unpair event received from Store App (US-013) */
  unpairReceived: boolean;
  /** Clear unpair received flag after handling */
  clearUnpairReceived: () => void;
}

const PadMqttContext = createContext<PadMqttContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface PadMqttProviderProps {
  children: ReactNode;
}

export function PadMqttProvider({ children }: PadMqttProviderProps) {
  const salonId = getSalonId();
  const deviceId = getDeviceId();
  const brokerUrl = getMqttBrokerUrl();

  const [isConnected, setIsConnected] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<PadScreen>('waiting');
  const [posConnection, setPosConnection] = useState<PosConnectionState>({
    isConnected: false,
    lastHeartbeat: null,
    storeId: null,
    storeName: null,
  });
  // Unpair event state (US-013)
  const [unpairReceived, setUnpairReceived] = useState(false);

  const clientRef = useRef<MqttClientType | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const posCheckIntervalRef = useRef<number | null>(null);
  const currentScreenRef = useRef(currentScreen);

  // Keep currentScreenRef in sync
  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  // Publish heartbeat
  const publishHeartbeat = useCallback(() => {
    if (!clientRef.current?.connected) return;

    // Get pairing info to include pairedTo in heartbeat (US-010)
    const pairingInfo = getPairingInfo();

    const topic = buildTopic(TOPICS.PAD_HEARTBEAT, { salonId });
    const payload: PadHeartbeatPayload = {
      deviceId,
      deviceName: PAD_CONFIG.DEVICE_NAME,
      salonId,
      pairedTo: pairingInfo?.stationId,
      timestamp: new Date().toISOString(),
      screen: currentScreenRef.current,
    };

    clientRef.current.publish(topic, JSON.stringify(payload), { qos: 0 });
  }, [salonId, deviceId]);

  // Connect to MQTT
  useEffect(() => {
    const clientId = `pad-${deviceId}-${Date.now()}`;
    
    const client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('[PadMqtt] Connected to broker');
      setIsConnected(true);

      // Subscribe to POS heartbeat
      const posHeartbeatTopic = buildTopic(TOPICS.POS_HEARTBEAT, { salonId });
      client.subscribe(posHeartbeatTopic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[PadMqtt] Failed to subscribe to POS heartbeat:', err);
        } else {
          console.log('[PadMqtt] Subscribed to:', posHeartbeatTopic);
        }
      });

      // Subscribe to unpair notifications (US-013)
      const unpairTopic = buildTopic(TOPICS.PAD_UNPAIRED, { salonId, deviceId });
      client.subscribe(unpairTopic, { qos: 1 }, (err) => {
        if (err) {
          console.error('[PadMqtt] Failed to subscribe to unpair topic:', err);
        } else {
          console.log('[PadMqtt] Subscribed to:', unpairTopic);
        }
      });

      // Start heartbeat
      publishHeartbeat();
      heartbeatIntervalRef.current = window.setInterval(
        publishHeartbeat,
        PAD_CONFIG.HEARTBEAT_INTERVAL_MS
      );
    });

    client.on('disconnect', () => {
      console.log('[PadMqtt] Disconnected');
      setIsConnected(false);
    });

    client.on('error', (err) => {
      console.error('[PadMqtt] Error:', err);
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());

        if (topic.includes('/pos/heartbeat')) {
          const posPayload = payload as PosHeartbeatPayload;
          setPosConnection({
            isConnected: true,
            lastHeartbeat: new Date(),
            storeId: posPayload.storeId,
            storeName: posPayload.storeName,
          });
        }

        // Handle unpair notification (US-013)
        if (topic.includes('/unpaired')) {
          console.log('[PadMqtt] Received unpair notification:', payload);
          // Clear the pairing info from localStorage
          localStorage.removeItem('mango_pad_pairing');
          // Set flag to trigger navigation in components
          setUnpairReceived(true);
        }
      } catch (error) {
        console.error('[PadMqtt] Failed to parse message:', error);
      }
    });

    // Cleanup
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      client.end(true);
      clientRef.current = null;
    };
  }, [brokerUrl, deviceId, salonId, publishHeartbeat]);

  // Check for POS offline status
  useEffect(() => {
    const checkPosStatus = () => {
      setPosConnection((prev) => {
        if (!prev.lastHeartbeat) return prev;
        
        const timeSinceLastHeartbeat = Date.now() - prev.lastHeartbeat.getTime();
        if (timeSinceLastHeartbeat > PAD_CONFIG.POS_OFFLINE_TIMEOUT_MS) {
          return {
            ...prev,
            isConnected: false,
          };
        }
        return prev;
      });
    };

    posCheckIntervalRef.current = window.setInterval(checkPosStatus, 10_000);

    return () => {
      if (posCheckIntervalRef.current) {
        clearInterval(posCheckIntervalRef.current);
        posCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Clear unpair received flag (US-013)
  const clearUnpairReceived = useCallback(() => {
    setUnpairReceived(false);
  }, []);

  const contextValue: PadMqttContextValue = {
    isConnected,
    currentScreen,
    setCurrentScreen,
    posConnection,
    salonId,
    deviceId,
    unpairReceived,
    clearUnpairReceived,
  };

  return (
    <PadMqttContext.Provider value={contextValue}>
      {children}
    </PadMqttContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

export function usePadMqtt(): PadMqttContextValue {
  const context = useContext(PadMqttContext);
  if (!context) {
    throw new Error('usePadMqtt must be used within a PadMqttProvider');
  }
  return context;
}

export function usePosConnection(): PosConnectionState {
  const { posConnection } = usePadMqtt();
  return posConnection;
}

/**
 * Hook to use unpair event state (US-013)
 * Use this in components to detect when unpair has been received
 */
export function useUnpairEvent() {
  const { unpairReceived, clearUnpairReceived } = usePadMqtt();
  return { unpairReceived, clearUnpairReceived };
}
