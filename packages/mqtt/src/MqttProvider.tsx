/**
 * MQTT React Context Provider
 * Provides MQTT connection and operations to React components
 *
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  MqttConfig,
  MqttConnectionInfo,
  MqttContextValue,
  MqttMessageHandler,
  MqttPublishOptions,
  DevicePresence,
} from './types';
import { getMqttClient, destroyMqttClient } from './MqttClient';
import {
  getDualBrokerManager,
  destroyDualBrokerManager,
} from './DualBrokerManager';
import { isMqttEnabled, logMqttStatus } from './featureFlags';
import { TOPIC_PATTERNS, buildTopic } from './topics';

// =============================================================================
// Context
// =============================================================================

const MqttContext = createContext<MqttContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

interface MqttProviderProps {
  children: ReactNode;
  /** MQTT configuration */
  config: MqttConfig;
  /** Called when connected */
  onConnect?: () => void;
  /** Called when disconnected */
  onDisconnect?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Enable debug logging */
  debug?: boolean;
}

// =============================================================================
// Provider Component
// =============================================================================

export function MqttProvider({
  children,
  config,
  onConnect,
  onDisconnect,
  onError,
  debug = false,
}: MqttProviderProps) {
  const [connection, setConnection] = useState<MqttConnectionInfo>({
    state: 'disconnected',
    brokerType: null,
    brokerUrl: null,
    clientId: null,
    connectedAt: null,
    error: null,
  });
  const [devices, setDevices] = useState<DevicePresence[]>([]);

  const clientRef = useRef(getMqttClient());
  const brokerManagerRef = useRef(getDualBrokerManager());
  const mountedRef = useRef(true);
  const configRef = useRef(config);

  // Update config ref when it changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // =============================================================================
  // Connection Management
  // =============================================================================

  useEffect(() => {
    if (!isMqttEnabled()) {
      if (debug) {
        console.log('[MqttProvider] MQTT is disabled');
      }
      return;
    }

    if (debug) {
      logMqttStatus();
    }

    const client = clientRef.current;
    const brokerManager = brokerManagerRef.current;
    mountedRef.current = true;

    // Subscribe to connection state changes
    const unsubscribeState = client.onStateChange((info) => {
      if (!mountedRef.current) return;

      setConnection(info);

      if (info.state === 'connected') {
        onConnect?.();
      } else if (info.state === 'disconnected') {
        onDisconnect?.();
      } else if (info.state === 'error' && info.error) {
        onError?.(info.error);
      }
    });

    // Connect to broker
    const connect = async () => {
      try {
        await brokerManager.connect(config);
      } catch (error) {
        console.error('[MqttProvider] Connection error:', error);
        onError?.(error as Error);
      }
    };

    connect();

    // Subscribe to device presence updates
    const presenceTopic = buildTopic(TOPIC_PATTERNS.DEVICE_STATUS, {
      storeId: config.storeId,
    });

    const unsubscribePresence = client.subscribe(presenceTopic, (topic, msg) => {
      if (!mountedRef.current) return;

      try {
        const payload = msg.payload as { status: 'online' | 'offline' };
        const deviceId = topic.split('/')[3]; // mango/{storeId}/devices/{deviceId}/status

        setDevices((prev) => {
          const existing = prev.find((d) => d.deviceId === deviceId);
          if (existing) {
            return prev.map((d) =>
              d.deviceId === deviceId
                ? { ...d, status: payload.status, lastSeenAt: msg.timestamp }
                : d
            );
          }
          // New device - will be populated by full presence message
          return prev;
        });
      } catch (error) {
        console.error('[MqttProvider] Failed to process presence:', error);
      }
    });

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      unsubscribeState();
      unsubscribePresence();
      // Don't destroy on unmount - let parent control lifecycle
    };
  }, [config.storeId, config.deviceId, debug]); // Minimal dependencies

  // =============================================================================
  // Context Methods
  // =============================================================================

  const publish = useCallback(
    async <T,>(
      topic: string,
      payload: T,
      options?: MqttPublishOptions
    ): Promise<void> => {
      const client = clientRef.current;
      if (!client.isConnected()) {
        throw new Error('MQTT not connected');
      }
      await client.publish(topic, payload, options);
    },
    []
  );

  const subscribe = useCallback(
    (topic: string, handler: MqttMessageHandler): (() => void) => {
      const client = clientRef.current;
      return client.subscribe(topic, handler);
    },
    []
  );

  const reconnect = useCallback(async (): Promise<void> => {
    const brokerManager = brokerManagerRef.current;
    await brokerManager.disconnect();
    await brokerManager.connect(configRef.current);
  }, []);

  const disconnect = useCallback((): void => {
    const brokerManager = brokerManagerRef.current;
    brokerManager.disconnect();
  }, []);

  // =============================================================================
  // Context Value
  // =============================================================================

  const contextValue: MqttContextValue = {
    connection,
    devices,
    publish,
    subscribe,
    reconnect,
    disconnect,
  };

  return (
    <MqttContext.Provider value={contextValue}>{children}</MqttContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access the MQTT context
 * Must be used within an MqttProvider
 */
export function useMqttContext(): MqttContextValue {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqttContext must be used within an MqttProvider');
  }
  return context;
}

/**
 * Check if MQTT context is available
 * Useful for optional MQTT usage
 */
export function useMqttContextOptional(): MqttContextValue | null {
  return useContext(MqttContext);
}

// =============================================================================
// Cleanup Utilities
// =============================================================================

/**
 * Destroy all MQTT resources
 * Call when app is shutting down
 */
export function destroyMqttResources(): void {
  destroyDualBrokerManager();
  destroyMqttClient();
}
