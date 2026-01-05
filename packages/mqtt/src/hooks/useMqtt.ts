/**
 * useMqtt Hook
 * Base hook for MQTT connection status
 *
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { useMqttContext } from '../MqttProvider';

/**
 * Get MQTT connection status and basic operations
 *
 * @example
 * const { isConnected, brokerType, reconnect } = useMqtt();
 *
 * if (!isConnected) {
 *   return <div>Connecting to MQTT...</div>;
 * }
 */
export function useMqtt() {
  const context = useMqttContext();

  return {
    /** Whether MQTT is connected */
    isConnected: context.connection.state === 'connected',
    /** Current connection state */
    connectionState: context.connection.state,
    /** Current broker type ('local' or 'cloud') */
    brokerType: context.connection.brokerType,
    /** Current broker URL */
    brokerUrl: context.connection.brokerUrl,
    /** When the connection was established */
    connectedAt: context.connection.connectedAt,
    /** Last connection error */
    error: context.connection.error,
    /** Manually reconnect */
    reconnect: context.reconnect,
    /** Disconnect from broker */
    disconnect: context.disconnect,
    /** List of discovered devices */
    devices: context.devices,
  };
}

export default useMqtt;
