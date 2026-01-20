/**
 * MQTT Service Types
 * Core TypeScript interfaces for MQTT communication
 *
 * Part of: MQTT Architecture Implementation (Phase 0)
 */

import type { SalonDeviceType, DeviceCapabilities } from '../supabase/types';

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
  // Mango Pad events (Pad → Store App)
  | 'pad:ready_to_pay'
  | 'pad:payment_result'
  | 'pad:cancel'
  | 'pad:tip_selected'
  | 'pad:signature_captured'
  | 'pad:receipt_preference'
  | 'pad:transaction_complete'
  | 'pad:help_requested'
  | 'pad:heartbeat'
  | 'pad:screen_changed'      // New: Pad notifies Store App of screen changes
  | 'pad:customer_started'    // New: Customer began interacting with Pad
  | 'pad:customer_idle'       // New: Customer inactive for X seconds
  // Store App events (Store App → Pad)
  | 'pos:heartbeat'
  | 'pos:skip_tip'            // New: Staff skips tip step
  | 'pos:skip_signature'      // New: Staff skips signature step
  | 'pos:force_complete'      // New: Staff forces transaction completion
  | 'pos:update_order'        // New: Order updated after sending to Pad
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

export interface PadTransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  staffName?: string;
}

export interface PadReadyToPayPayload {
  transactionId: string;
  ticketId: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName?: string;
  items: PadTransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  suggestedTips: number[];
}

export interface PadPaymentResultPayload {
  transactionId: string;
  ticketId: string;
  success: boolean;
  cardLast4?: string;
  cardBrand?: string;
  authCode?: string;
  failureReason?: string;  // Aligned with Mango Pad's PaymentResultPayload
}

export interface PadCancelPayload {
  transactionId: string;
  ticketId: string;
  reason?: string;
}

export interface PadTipPayload {
  transactionId: string;
  ticketId: string;
  tipAmount: number;
  tipPercent: number | null;
  selectedAt: string;
}

export interface PadSignaturePayload {
  transactionId: string;
  ticketId: string;
  signatureData: string;
  signedAt: string;
}

export interface PadReceiptPreferencePayload {
  transactionId: string;
  ticketId: string;
  preference: 'email' | 'sms' | 'print' | 'none';
  email?: string;
  phone?: string;
}

export interface PadTransactionCompletePayload {
  transactionId: string;
  ticketId: string;
  tipAmount: number;
  total: number;
  signatureData?: string;
  receiptPreference: 'email' | 'sms' | 'print' | 'none';
  completedAt: string;
}

export interface PadHelpRequestedPayload {
  transactionId: string;
  ticketId: string;
  deviceId: string;
  deviceName: string;
  clientName?: string;
  requestedAt: string;
}

export interface PadHeartbeatPayload {
  deviceId: string;
  deviceName: string;
  salonId: string;
  /** Device ID of the Store App station this Pad is paired to (US-010) */
  pairedTo?: string;
  timestamp: string;
  screen: 'idle' | 'checkout' | 'tip' | 'signature' | 'receipt' | 'complete' | 'waiting';
}

export interface PosHeartbeatPayload {
  storeId: string;
  /** Station ID (device fingerprint) for device-to-device communication */
  stationId: string;
  storeName: string;
  timestamp: string;
  version: string;
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
// Pad Screen Sync Types (NEW - Phase 1 Integration)
// =============================================================================

/**
 * All possible screens on Mango Pad
 * Used for real-time state sync between Store App and Pad
 */
export type PadScreen =
  | 'idle'              // Initial idle state
  | 'waiting'           // Idle, waiting for transaction
  | 'order-review'      // Customer reviewing order
  | 'tip'               // Tip selection
  | 'signature'         // Signature capture
  | 'payment'           // Waiting for card / processing
  | 'receipt'           // Receipt preference selection
  | 'result'            // Payment result display
  | 'thank-you'         // Thank you screen
  | 'split-selection'   // Split payment selection
  | 'split-status'      // Split payment status
  | 'settings'          // Pad settings screen
  | 'processing'        // Payment processing
  | 'complete'          // Transaction successful
  | 'failed'            // Transaction failed
  | 'cancelled';        // Transaction cancelled

/**
 * Pad → Store App: Customer started interacting
 * Sent when customer first touches the Pad after receiving transaction
 */
export interface PadCustomerStartedPayload {
  transactionId: string;
  ticketId: string;
  screen: 'order-review';
  startedAt: string;
}

/**
 * Pad → Store App: Screen changed
 * Sent every time customer navigates to a new screen
 */
export interface PadScreenChangedPayload {
  transactionId: string;
  ticketId: string;
  screen: PadScreen;
  previousScreen: PadScreen;
  changedAt: string;
}

/**
 * Pad → Store App: Customer idle
 * Sent when customer hasn't interacted for X seconds
 */
export interface PadCustomerIdlePayload {
  transactionId: string;
  ticketId: string;
  idleSeconds: number;
  currentScreen: PadScreen;
  idleAt: string;
}

/**
 * Store App → Pad: Skip tip step
 * Staff can skip tip selection for customer
 */
export interface PosSkipTipPayload {
  transactionId: string;
  ticketId: string;
  reason?: string;
}

/**
 * Store App → Pad: Skip signature step
 * Staff can skip signature capture for customer
 */
export interface PosSkipSignaturePayload {
  transactionId: string;
  ticketId: string;
  reason?: string;
}

/**
 * Store App → Pad: Force complete
 * Staff forces transaction to complete (e.g., customer left)
 */
export interface PosForceCompletePayload {
  transactionId: string;
  ticketId: string;
  reason?: string;
}

/**
 * Store App → Pad: Update order
 * Sent when order is modified after already sent to Pad
 */
export interface PosUpdateOrderPayload {
  transactionId: string;
  ticketId: string;
  items: PadTransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
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
  /** Subscribe to a topic with typed message handler */
  subscribe: <T = unknown>(
    topic: string,
    handler: MqttMessageHandler<T>
  ) => () => void;
  /** Manually reconnect */
  reconnect: () => Promise<void>;
  /** Disconnect from broker */
  disconnect: () => void;
}
