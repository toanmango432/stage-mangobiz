/**
 * useMqttSubscription Hook
 * Subscribe to MQTT topics with automatic cleanup
 *
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { useEffect, useRef } from 'react';
import { useMqttContext } from '../MqttProvider';
import type { MqttMessage, MqttMessageHandler } from '../types';

/**
 * Options for MQTT subscription
 */
interface UseMqttSubscriptionOptions<T> {
  /** Topic or topic pattern to subscribe to */
  topic: string;
  /** Callback when message is received */
  onMessage: (payload: T, message: MqttMessage<T>, topic: string) => void;
  /** Only subscribe when this is true */
  enabled?: boolean;
  /** Dependencies that should trigger resubscription */
  deps?: unknown[];
}

/**
 * Subscribe to an MQTT topic
 *
 * @example
 * // Subscribe to appointment updates
 * useMqttSubscription({
 *   topic: `mango/${storeId}/appointments/#`,
 *   onMessage: (payload, message, topic) => {
 *     console.log('Appointment update:', payload);
 *     dispatch(updateAppointment(payload));
 *   },
 * });
 *
 * @example
 * // Conditional subscription
 * useMqttSubscription({
 *   topic: `mango/${storeId}/pad/signature`,
 *   onMessage: handleSignature,
 *   enabled: isPadMode,
 * });
 */
export function useMqttSubscription<T = unknown>({
  topic,
  onMessage,
  enabled = true,
  deps = [],
}: UseMqttSubscriptionOptions<T>) {
  const { subscribe, connection } = useMqttContext();
  const handlerRef = useRef(onMessage);

  // Update handler ref on each render
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;
    if (connection.state !== 'connected') return;

    const handler: MqttMessageHandler = (receivedTopic, message) => {
      try {
        handlerRef.current(
          message.payload as T,
          message as MqttMessage<T>,
          receivedTopic
        );
      } catch (error) {
        console.error('[useMqttSubscription] Handler error:', error);
      }
    };

    const unsubscribe = subscribe(topic, handler);

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, enabled, connection.state, subscribe, ...deps]);
}

/**
 * Subscribe to multiple MQTT topics
 *
 * @example
 * useMqttSubscriptions([
 *   {
 *     topic: `mango/${storeId}/appointments/#`,
 *     onMessage: handleAppointment,
 *   },
 *   {
 *     topic: `mango/${storeId}/tickets/#`,
 *     onMessage: handleTicket,
 *   },
 * ]);
 */
export function useMqttSubscriptions(
  subscriptions: Array<{
    topic: string;
    onMessage: (payload: unknown, message: MqttMessage, topic: string) => void;
    enabled?: boolean;
  }>
) {
  const { subscribe, connection } = useMqttContext();
  const handlersRef = useRef(subscriptions);

  // Update handlers ref on each render
  handlersRef.current = subscriptions;

  useEffect(() => {
    if (connection.state !== 'connected') return;

    const unsubscribes: Array<() => void> = [];

    for (let i = 0; i < handlersRef.current.length; i++) {
      const { topic, onMessage, enabled = true } = handlersRef.current[i];

      if (!enabled) continue;

      const handler: MqttMessageHandler = (receivedTopic, message) => {
        try {
          onMessage(message.payload, message, receivedTopic);
        } catch (error) {
          console.error('[useMqttSubscriptions] Handler error:', error);
        }
      };

      unsubscribes.push(subscribe(topic, handler));
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [connection.state, subscribe, subscriptions.length]);
}

export default useMqttSubscription;
