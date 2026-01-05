/**
 * MQTT Service
 * Real-time communication for Mango POS multi-app architecture
 *
 * Part of: MQTT Architecture Implementation
 *
 * @example
 * // Check if MQTT is enabled
 * import { isMqttEnabled, getMqttFeatureFlags } from '@/services/mqtt';
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
 * import { TOPIC_PATTERNS, buildTopic } from '@/services/mqtt';
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
// Client & Provider (Phase 1)
// =============================================================================
export { MqttClient, getMqttClient, destroyMqttClient } from './MqttClient';
export {
  MqttProvider,
  useMqttContext,
  useMqttContextOptional,
  destroyMqttResources,
} from './MqttProvider';
export {
  DualBrokerManager,
  getDualBrokerManager,
  destroyDualBrokerManager,
} from './DualBrokerManager';

// =============================================================================
// Hooks (Phase 1)
// =============================================================================
export { useMqtt } from './hooks/useMqtt';
export {
  useMqttSubscription,
  useMqttSubscriptions,
} from './hooks/useMqttSubscription';
export { useMqttPublish, useTopicPublish } from './hooks/useMqttPublish';

// =============================================================================
// Bridge (Phase 3)
// =============================================================================
export { mqttBridge, default as MqttBridge } from './mqttBridge';
