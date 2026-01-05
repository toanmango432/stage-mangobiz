/**
 * useMqttPublish Hook
 * Publish messages to MQTT topics
 *
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { useCallback, useState } from 'react';
import { useMqttContext } from '../MqttProvider';
import type { MqttPublishOptions, MqttQoS } from '../types';

/**
 * Return type for useMqttPublish hook
 */
interface UseMqttPublishReturn {
  /** Publish a message to a topic */
  publish: <T>(
    topic: string,
    payload: T,
    options?: MqttPublishOptions
  ) => Promise<void>;
  /** Whether a publish is in progress */
  isPublishing: boolean;
  /** Last error that occurred */
  error: Error | null;
  /** Clear the error state */
  clearError: () => void;
}

/**
 * Hook for publishing MQTT messages
 *
 * @example
 * const { publish, isPublishing, error } = useMqttPublish();
 *
 * const handleSubmit = async () => {
 *   await publish(`mango/${storeId}/checkin/walkin`, {
 *     clientName: 'John Doe',
 *     services: ['Haircut'],
 *   });
 * };
 */
export function useMqttPublish(): UseMqttPublishReturn {
  const { publish: contextPublish, connection } = useMqttContext();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publish = useCallback(
    async <T>(
      topic: string,
      payload: T,
      options?: MqttPublishOptions
    ): Promise<void> => {
      if (connection.state !== 'connected') {
        const err = new Error('MQTT not connected');
        setError(err);
        throw err;
      }

      setIsPublishing(true);
      setError(null);

      try {
        await contextPublish(topic, payload, options);
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsPublishing(false);
      }
    },
    [contextPublish, connection.state]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    publish,
    isPublishing,
    error,
    clearError,
  };
}

/**
 * Options for preconfigured publish hook
 */
interface UseTopicPublishOptions {
  /** Topic to publish to */
  topic: string;
  /** Default QoS level */
  qos?: MqttQoS;
  /** Whether to retain messages */
  retain?: boolean;
}

/**
 * Hook for publishing to a specific topic
 *
 * @example
 * const { publish, isPublishing } = useTopicPublish({
 *   topic: `mango/${storeId}/pad/signature`,
 *   qos: 1,
 * });
 *
 * await publish({ signatureData: base64, ticketId: '123' });
 */
export function useTopicPublish<T = unknown>({
  topic,
  qos,
  retain,
}: UseTopicPublishOptions) {
  const { publish: basePubish, isPublishing, error, clearError } = useMqttPublish();

  const publish = useCallback(
    async (payload: T): Promise<void> => {
      await basePubish(topic, payload, { qos, retain });
    },
    [basePubish, topic, qos, retain]
  );

  return {
    publish,
    isPublishing,
    error,
    clearError,
  };
}

export default useMqttPublish;
