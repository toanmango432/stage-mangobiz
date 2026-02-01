/**
 * MQTT Service
 * Real-time communication for Mango POS multi-app architecture
 *
 * Part of: MQTT Architecture Implementation
 *
 * @example
 * // Check if MQTT is enabled
 * import { isMqttEnabled, getMqttFeatureFlags } from '@mango/mqtt';
 *
 * if (isMqttEnabled()) {
 *   const flags = getMqttFeatureFlags();
 *   if (flags.devicePresence) {
 *     // Use MQTT for device presence
 *   }
 * }
 *
 * @example
 * // Build topics
 * import { TOPIC_PATTERNS, buildTopic } from '@mango/mqtt';
 *
 * const topic = buildTopic(TOPIC_PATTERNS.APPOINTMENT_CREATED, {
 *   storeId: 'abc123'
 * });
 * // Returns: 'mango/abc123/appointments/created'
 */

// =============================================================================
// Types
// =============================================================================
export type {
  // Connection
  MqttConnectionState,
  MqttBrokerType,
  MqttConfig,
  MqttConnectionInfo,
  // Messages
  MqttQoS,
  MqttMessage,
  MqttPublishOptions,
  MqttMessageHandler,
  // Events
  MqttEventType,
  // Device Types
  SalonDeviceType,
  DeviceCapabilities,
  // Device Presence
  DevicePresence,
  DeviceHeartbeat,
  DevicePresencePayload,
  // Payloads
  PadSignaturePayload,
  PadTipPayload,
  PadReceiptReadyPayload,
  CheckinWalkinPayload,
  CheckinStaffPayload,
  // Heartbeat Payloads
  PadHeartbeatPayload,
  PosHeartbeatPayload,
  // Context
  MqttContextValue,
} from './types';

// =============================================================================
// Topics
// =============================================================================
export {
  TOPIC_PATTERNS,
  buildTopic,
  parseTopic,
  matchTopic,
  QOS_BY_TOPIC,
  getQosForTopic,
} from './topics';

export type { ParsedTopic } from './topics';

// =============================================================================
// Feature Flags
// =============================================================================
export {
  isMqttEnabled,
  getCloudBrokerUrl,
  isDevelopment,
  getMqttFeatureFlags,
  isMqttFeatureEnabled,
  MQTT_MIGRATION_PHASE,
  getCurrentMigrationPhase,
  logMqttStatus,
} from './featureFlags';

export type { MqttFeatureFlags } from './featureFlags';

// =============================================================================
// Client (Phase 1)
// =============================================================================
export { MqttClient, getMqttClient, destroyMqttClient } from './MqttClient';

// =============================================================================
// TODO: The following exports are temporarily disabled due to API mismatches
// and missing dependencies that need to be resolved. The MqttProvider,
// DualBrokerManager and related hooks have dependencies on app-specific
// paths (@/store, ../supabase/client) that don't exist in this package.
// See MQTT_ARCHITECTURE.md for planned refactoring.
// =============================================================================
// export { MqttProvider, useMqttContext, useMqttContextOptional, destroyMqttResources } from './MqttProvider';
// export { DualBrokerManager, getDualBrokerManager, destroyDualBrokerManager } from './DualBrokerManager';
// export { mqttBridge, default as MqttBridge } from './mqttBridge';
// export { useMqtt } from './hooks/useMqtt';
// export { useMqttSubscription, useMqttSubscriptions } from './hooks/useMqttSubscription';
// export { useMqttPublish, useTopicPublish } from './hooks/useMqttPublish';
