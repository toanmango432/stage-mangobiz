/**
 * MQTT Service Types
 * Core TypeScript interfaces for MQTT communication
 *
 * Part of: MQTT Architecture Implementation (Phase 0)
 */

/** Device type for MQTT clients */
export type SalonDeviceType = 'ios' | 'android' | 'web' | 'desktop' | 'pad' | 'checkin';

/** Device capabilities for presence */
export interface DeviceCapabilities {
  canSignature?: boolean;
  canPayment?: boolean;
  canPrint?: boolean;
  canOffline?: boolean;
}

// =============================================================================
// Connection Types
// =============================================================================

export type MqttConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type MqttBrokerType = 'local' | 'cloud';

export interface MqttConfig {
  /** Store/salon ID for topic namespacing */
  storeId: string;
  /** Unique device identifier */
  deviceId: string;
  /** Device type for client ID generation */
  deviceType: SalonDeviceType;
  /** Local broker URL (e.g., ws://192.168.1.100:1883) */
  localBrokerUrl?: string;
  /** Cloud broker URL (e.g., mqtts://mqtt.mango.cloud:8883) */
  cloudBrokerUrl: string;
  /** Username for authentication */
  username?: string;
  /** Password for authentication */
  password?: string;
  /** Use persistent session for QoS 1/2 message queuing */
  cleanSession?: boolean;
  /** Keepalive interval in seconds */
  keepAlive?: number;
  /** Reconnection period in milliseconds */
  reconnectPeriod?: number;
  /** Connection timeout in milliseconds */
  connectTimeout?: number;
}

export interface MqttConnectionInfo {
  state: MqttConnectionState;
  brokerType: MqttBrokerType | null;
  brokerUrl: string | null;
  clientId: string | null;
  connectedAt: Date | null;
  error: Error | null;
}

// =============================================================================
// Message Types
// =============================================================================

/**
 * QoS levels for MQTT messages
 * - 0: At most once (fire and forget) - UI updates, cursors
 * - 1: At least once (guaranteed delivery, may duplicate) - signatures, check-ins
 * - 2: Exactly once (guaranteed single delivery) - payments
 */
export type MqttQoS = 0 | 1 | 2;

/**
 * Standard MQTT message envelope
 * All messages use this format for consistency and deduplication
 */
export interface MqttMessage<T = unknown> {
  /** Unique message ID for deduplication */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Schema version for forward compatibility */
  version: number;
  /** Source device information */
  source: {
    deviceId: string;
    deviceType: SalonDeviceType;
    storeId: string;
  };
  /** Message payload */
  payload: T;
}

export interface MqttPublishOptions {
  qos?: MqttQoS;
  retain?: boolean;
}

export type MqttMessageHandler<T = unknown> = (
  topic: string,
  message: MqttMessage<T>
) => void;

// =============================================================================
// Event Types
// =============================================================================

/** MQTT event types for real-time communication */
export type MqttEventType =
  // Appointment events
  | 'appointment:created'
  | 'appointment:updated'
  | 'appointment:deleted'
  | 'appointment:status_changed'
  // Ticket events
  | 'ticket:created'
  | 'ticket:updated'
  | 'ticket:completed'
  | 'ticket:voided'
  // Staff events
  | 'staff:clock_in'
  | 'staff:clock_out'
  | 'staff:break_start'
  | 'staff:break_end'
  | 'staff:updated'
  // Device events
  | 'device:online'
  | 'device:offline'
  | 'device:discovered'
  | 'device:heartbeat'
  // Mango Pad events
  | 'pad:receipt_ready'
  | 'pad:tip_selected'
  | 'pad:signature_captured'
  // Check-in events
  | 'checkin:walkin'
  | 'checkin:staff'
  // Waitlist events
  | 'waitlist:updated'
  | 'waitlist:position_changed'
  // Sync events
  | 'sync:required'
  | 'sync:conflict'
  | 'sync:completed'
  // Payment events
  | 'payment:started'
  | 'payment:completed'
  | 'payment:failed';

// =============================================================================
// Device Presence Types
// =============================================================================

export interface DevicePresence {
  deviceId: string;
  deviceName: string | null;
  deviceType: SalonDeviceType;
  status: 'online' | 'offline';
  lastSeenAt: string;
  isHub: boolean;
  localIp: string | null;
  mqttPort: number;
  capabilities: DeviceCapabilities;
}

export interface DeviceHeartbeat {
  deviceId: string;
  storeId: string;
  timestamp: string;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/** Payload for device presence MQTT messages */
export interface DevicePresencePayload {
  deviceId: string;
  deviceName?: string;
  deviceType?: SalonDeviceType;
  isOnline: boolean;
  timestamp: string;
  localIp?: string;
  mqttPort?: number;
  isHub?: boolean;
}

// =============================================================================
// Payload Types for Specific Events
// =============================================================================

export interface PadSignaturePayload {
  ticketId: string;
  signatureData: string; // Base64 encoded PNG
  signedAt: string;
}

export interface PadTipPayload {
  ticketId: string;
  tipAmount: number;
  tipPercent: number | null;
  selectedAt: string;
}

export interface PadReceiptReadyPayload {
  ticketId: string;
  receipt: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  };
}

export interface CheckinWalkinPayload {
  clientId: string | null;
  clientName: string;
  phone?: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
  }>;
  preferredStaffId: string | null;
  checkinTime: string;
}

export interface CheckinStaffPayload {
  staffId: string;
  action: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp: string;
}

// =============================================================================
// Heartbeat Payloads (Pad ↔ POS connection awareness)
// =============================================================================

/** Payload sent by Mango Pad on salon/{salonId}/pad/heartbeat */
export interface PadHeartbeatPayload {
  deviceId: string;
  deviceName: string;
  salonId: string;
  timestamp: string;
  screen: 'waiting' | 'tip' | 'signature' | 'receipt' | 'complete' | 'error';
}

/** Payload sent by Store App on salon/{salonId}/pos/heartbeat */
export interface PosHeartbeatPayload {
  storeId: string;
  storeName: string;
  timestamp: string;
  version: string;
}

// =============================================================================
// Context Types
// =============================================================================

export interface MqttContextValue {
  /** Current connection information */
  connection: MqttConnectionInfo;
  /** List of discovered devices in the store */
  devices: DevicePresence[];
  /** Publish a message to a topic */
  publish: <T>(
    topic: string,
    payload: T,
    options?: MqttPublishOptions
  ) => Promise<void>;
  /** Subscribe to a topic */
  subscribe: (
    topic: string,
    handler: MqttMessageHandler
  ) => () => void;
  /** Manually reconnect */
  reconnect: () => Promise<void>;
  /** Disconnect from broker */
  disconnect: () => void;
}
