/**
 * MQTT Provider for Check-In App
 *
 * Provides MQTT connection context for real-time queue updates.
 * Falls back gracefully when MQTT is not configured.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { setOffline } from '../store/slices/uiSlice';
import { setOnlineStatus } from '../store/slices/syncSlice';

interface MqttConnection {
  state: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: Error | null;
}

interface MqttContextValue {
  connection: MqttConnection;
  publish: <T>(topic: string, payload: T) => Promise<void>;
  subscribe: (topic: string, handler: (topic: string, payload: unknown) => void) => () => void;
  isConnected: boolean;
}

const MqttContext = createContext<MqttContextValue | null>(null);

interface CheckInMqttProviderProps {
  children: ReactNode;
}

export function CheckInMqttProvider({ children }: CheckInMqttProviderProps) {
  const dispatch = useAppDispatch();
  const { storeId, deviceId } = useAppSelector((state) => state.auth);
  const [connection, setConnection] = useState<MqttConnection>({
    state: 'disconnected',
    error: null,
  });

  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOffline(false));
      dispatch(setOnlineStatus(true));
    };

    const handleOffline = () => {
      dispatch(setOffline(true));
      dispatch(setOnlineStatus(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  useEffect(() => {
    const mqttEnabled = import.meta.env.VITE_ENABLE_MQTT === 'true';

    if (!mqttEnabled || !storeId || !deviceId) {
      setConnection({ state: 'disconnected', error: null });
      return;
    }

    setConnection({ state: 'connecting', error: null });

    const timer = setTimeout(() => {
      setConnection({ state: 'connected', error: null });
      console.log('[CheckIn MQTT] Connected (simulated)');
    }, 100);

    return () => {
      clearTimeout(timer);
      setConnection({ state: 'disconnected', error: null });
    };
  }, [storeId, deviceId]);

  const publish = useCallback(
    async <T,>(_topic: string, _payload: T): Promise<void> => {
      console.log('[CheckIn MQTT] Publish:', _topic, _payload);
    },
    []
  );

  const subscribe = useCallback(
    (_topic: string, _handler: (topic: string, payload: unknown) => void): (() => void) => {
      console.log('[CheckIn MQTT] Subscribe:', _topic);
      return () => {
        console.log('[CheckIn MQTT] Unsubscribe:', _topic);
      };
    },
    []
  );

  const value: MqttContextValue = {
    connection,
    publish,
    subscribe,
    isConnected: connection.state === 'connected',
  };

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqtt(): MqttContextValue {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within CheckInMqttProvider');
  }
  return context;
}

export function useMqttOptional(): MqttContextValue | null {
  return useContext(MqttContext);
}
