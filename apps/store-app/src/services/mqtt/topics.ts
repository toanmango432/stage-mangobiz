/**
 * MQTT Topic Patterns and Builders
 * Centralized topic management for consistent naming across apps
 *
 * Topic structure: mango/{storeId}/{module}/{action}
 *
 * Part of: MQTT Architecture Implementation (Phase 0)
 */

// =============================================================================
// Topic Patterns (Templates)
// =============================================================================

/**
 * Topic patterns with placeholders
 * Use buildTopic() to create actual topics
 */
export const TOPIC_PATTERNS = {
  // Store-level wildcard (for Store App hub)
  STORE_ALL: 'mango/{storeId}/#',

  // Appointments
  APPOINTMENTS_ALL: 'mango/{storeId}/appointments/#',
  APPOINTMENT_CREATED: 'mango/{storeId}/appointments/created',
  APPOINTMENT_UPDATED: 'mango/{storeId}/appointments/updated',
  APPOINTMENT_DELETED: 'mango/{storeId}/appointments/deleted',
  APPOINTMENT_STATUS: 'mango/{storeId}/appointments/status',

  // Tickets
  TICKETS_ALL: 'mango/{storeId}/tickets/#',
  TICKET_CREATED: 'mango/{storeId}/tickets/created',
  TICKET_UPDATED: 'mango/{storeId}/tickets/updated',
  TICKET_COMPLETED: 'mango/{storeId}/tickets/completed',
  TICKET_VOIDED: 'mango/{storeId}/tickets/voided',

  // Staff
  STAFF_ALL: 'mango/{storeId}/staff/#',
  STAFF_CLOCK_IN: 'mango/{storeId}/staff/clock-in',
  STAFF_CLOCK_OUT: 'mango/{storeId}/staff/clock-out',
  STAFF_BREAK_START: 'mango/{storeId}/staff/break-start',
  STAFF_BREAK_END: 'mango/{storeId}/staff/break-end',
  STAFF_UPDATED: 'mango/{storeId}/staff/updated',

  // Mango Pad (Signature Capture) - Uses 'salon' prefix to match Mango Pad app
  PAD_ALL: 'salon/{storeId}/pad/#',
  // Store App publishes (to Pad)
  PAD_READY_TO_PAY: 'salon/{storeId}/pad/ready_to_pay',
  PAD_PAYMENT_RESULT: 'salon/{storeId}/pad/payment_result',
  PAD_CANCEL: 'salon/{storeId}/pad/cancel',
  // Store App receives (from Pad)
  PAD_TIP_SELECTED: 'salon/{storeId}/pad/tip_selected',
  PAD_SIGNATURE_CAPTURED: 'salon/{storeId}/pad/signature',
  PAD_RECEIPT_PREFERENCE: 'salon/{storeId}/pad/receipt_preference',
  PAD_TRANSACTION_COMPLETE: 'salon/{storeId}/pad/transaction_complete',
  PAD_HELP_REQUESTED: 'salon/{storeId}/pad/help_requested',
  // Heartbeats for connection awareness
  PAD_HEARTBEAT: 'salon/{storeId}/pad/heartbeat',
  POS_HEARTBEAT: 'salon/{storeId}/pos/heartbeat',
  // Device pairing notifications (US-012, US-013)
  PAD_UNPAIRED: 'salon/{storeId}/pad/{deviceId}/unpaired',

  // Check-In App
  CHECKIN_ALL: 'mango/{storeId}/checkin/#',
  CHECKIN_WALKIN: 'mango/{storeId}/checkin/walkin',
  CHECKIN_STAFF: 'mango/{storeId}/checkin/staff',

  // Waitlist
  WAITLIST_ALL: 'mango/{storeId}/waitlist/#',
  WAITLIST_UPDATED: 'mango/{storeId}/waitlist/updated',
  WAITLIST_POSITION: 'mango/{storeId}/waitlist/position',

  // Online Bookings
  BOOKINGS_ALL: 'mango/{storeId}/bookings/#',
  BOOKING_CREATED: 'mango/{storeId}/bookings/created',
  BOOKING_CANCELLED: 'mango/{storeId}/bookings/cancelled',

  // Device Presence
  DEVICES_ALL: 'mango/{storeId}/devices/#',
  DEVICE_PRESENCE: 'mango/{storeId}/devices/{deviceId}/presence',
  DEVICE_STATUS: 'mango/{storeId}/devices/+/status',
  DEVICE_HEARTBEAT: 'mango/{storeId}/devices/{deviceId}/heartbeat',

  // Device Discovery
  DISCOVERY_ALL: 'mango/{storeId}/discovery/#',
  DISCOVERY_REQUEST: 'mango/{storeId}/discovery/request',
  DISCOVERY_RESPONSE: 'mango/{storeId}/discovery/response/{deviceId}',

  // Sync Coordination
  SYNC_ALL: 'mango/{storeId}/sync/#',
  SYNC_REQUEST: 'mango/{storeId}/sync/request',
  SYNC_RESPONSE: 'mango/{storeId}/sync/response/{deviceId}',
  SYNC_CONFLICT: 'mango/{storeId}/sync/conflict',

  // Payments (QoS 2)
  PAYMENTS_ALL: 'mango/{storeId}/payments/#',
  PAYMENT_STARTED: 'mango/{storeId}/payments/started',
  PAYMENT_COMPLETED: 'mango/{storeId}/payments/completed',
  PAYMENT_FAILED: 'mango/{storeId}/payments/failed',
} as const;

// =============================================================================
// Topic Builder
// =============================================================================

type TopicParams = Record<string, string>;

/**
 * Build a topic string from a pattern and parameters
 *
 * @example
 * buildTopic(TOPIC_PATTERNS.APPOINTMENT_CREATED, { storeId: 'abc123' })
 * // Returns: 'mango/abc123/appointments/created'
 *
 * @example
 * buildTopic(TOPIC_PATTERNS.DEVICE_PRESENCE, { storeId: 'abc123', deviceId: 'device1' })
 * // Returns: 'mango/abc123/devices/device1/presence'
 */
export function buildTopic(pattern: string, params: TopicParams): string {
  let topic = pattern;
  for (const [key, value] of Object.entries(params)) {
    topic = topic.replace(`{${key}}`, value);
  }

  // Validate no remaining placeholders (except wildcards)
  const remainingPlaceholders = topic.match(/\{[^}]+\}/g);
  if (remainingPlaceholders) {
    throw new Error(
      `Missing parameters for topic: ${remainingPlaceholders.join(', ')}`
    );
  }

  return topic;
}

// =============================================================================
// Topic Parser
// =============================================================================

export interface ParsedTopic {
  storeId: string;
  module: string;
  action?: string;
  deviceId?: string;
}

/**
 * Parse a topic string to extract components
 *
 * @example
 * parseTopic('mango/abc123/appointments/created')
 * // Returns: { storeId: 'abc123', module: 'appointments', action: 'created' }
 */
export function parseTopic(topic: string): ParsedTopic | null {
  const parts = topic.split('/');

  if (parts.length < 3 || parts[0] !== 'mango') {
    return null;
  }

  const result: ParsedTopic = {
    storeId: parts[1],
    module: parts[2],
  };

  if (parts.length > 3) {
    // Check if this is a device-specific topic
    if (result.module === 'devices' && parts.length >= 4) {
      result.deviceId = parts[3];
      if (parts.length > 4) {
        result.action = parts[4];
      }
    } else {
      result.action = parts.slice(3).join('/');
    }
  }

  return result;
}

// =============================================================================
// Topic Matchers
// =============================================================================

/**
 * Check if a topic matches a pattern (supports + and # wildcards)
 *
 * @example
 * matchTopic('mango/abc123/appointments/created', 'mango/abc123/appointments/#')
 * // Returns: true
 */
export function matchTopic(topic: string, pattern: string): boolean {
  const topicParts = topic.split('/');
  const patternParts = pattern.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];

    // Multi-level wildcard matches everything remaining
    if (patternPart === '#') {
      return true;
    }

    // Single-level wildcard matches any single level
    if (patternPart === '+') {
      if (i >= topicParts.length) {
        return false;
      }
      continue;
    }

    // Exact match required
    if (i >= topicParts.length || topicParts[i] !== patternPart) {
      return false;
    }
  }

  // Pattern must match entire topic
  return topicParts.length === patternParts.length;
}

// =============================================================================
// QoS Level Mapping
// =============================================================================

import type { MqttQoS } from './types';

/**
 * Default QoS levels by topic pattern
 * - QoS 0: Fire and forget (UI updates)
 * - QoS 1: At least once (important events)
 * - QoS 2: Exactly once (financial)
 */
export const QOS_BY_TOPIC: Record<string, MqttQoS> = {
  // QoS 0 - Non-critical, can miss
  [TOPIC_PATTERNS.WAITLIST_UPDATED]: 0,
  [TOPIC_PATTERNS.WAITLIST_POSITION]: 0,
  [TOPIC_PATTERNS.DEVICE_HEARTBEAT]: 0,

  // QoS 1 - Important, must deliver (default for most)
  [TOPIC_PATTERNS.APPOINTMENT_CREATED]: 1,
  [TOPIC_PATTERNS.APPOINTMENT_UPDATED]: 1,
  [TOPIC_PATTERNS.APPOINTMENT_DELETED]: 1,
  [TOPIC_PATTERNS.TICKET_CREATED]: 1,
  [TOPIC_PATTERNS.TICKET_UPDATED]: 1,
  [TOPIC_PATTERNS.TICKET_COMPLETED]: 1,
  [TOPIC_PATTERNS.PAD_READY_TO_PAY]: 1,
  [TOPIC_PATTERNS.PAD_PAYMENT_RESULT]: 1,
  [TOPIC_PATTERNS.PAD_CANCEL]: 1,
  [TOPIC_PATTERNS.PAD_TIP_SELECTED]: 1,
  [TOPIC_PATTERNS.PAD_SIGNATURE_CAPTURED]: 1,
  [TOPIC_PATTERNS.PAD_RECEIPT_PREFERENCE]: 1,
  [TOPIC_PATTERNS.PAD_TRANSACTION_COMPLETE]: 1,
  [TOPIC_PATTERNS.PAD_HELP_REQUESTED]: 1,
  [TOPIC_PATTERNS.PAD_HEARTBEAT]: 0,
  [TOPIC_PATTERNS.POS_HEARTBEAT]: 0,
  [TOPIC_PATTERNS.PAD_UNPAIRED]: 1, // Guaranteed delivery for unpair notification
  [TOPIC_PATTERNS.CHECKIN_WALKIN]: 1,
  [TOPIC_PATTERNS.CHECKIN_STAFF]: 1,
  [TOPIC_PATTERNS.BOOKING_CREATED]: 1,
  [TOPIC_PATTERNS.DEVICE_PRESENCE]: 1,

  // QoS 2 - Exactly once (financial transactions)
  [TOPIC_PATTERNS.PAYMENT_STARTED]: 2,
  [TOPIC_PATTERNS.PAYMENT_COMPLETED]: 2,
  [TOPIC_PATTERNS.PAYMENT_FAILED]: 2,
};

/**
 * Get the recommended QoS level for a topic
 * Defaults to QoS 1 if not explicitly mapped
 */
export function getQosForTopic(topic: string): MqttQoS {
  // Check for exact match first
  for (const [pattern, qos] of Object.entries(QOS_BY_TOPIC)) {
    if (matchTopic(topic, pattern)) {
      return qos;
    }
  }

  // Default to QoS 1 for guaranteed delivery
  return 1;
}
