/**
 * Notification Types
 * PRD Reference: PRD-API-Specifications.md Section 4.2
 *
 * Notification templates, delivery tracking, and client
 * communication preferences.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Notification channel */
export type NotificationChannel = 'sms' | 'email' | 'push';

/** Notification delivery status */
export type NotificationStatus =
  | 'pending'    // Queued for sending
  | 'sent'       // Sent to provider
  | 'delivered'  // Confirmed delivered
  | 'failed'     // Failed to send
  | 'bounced';   // Bounced back (email)

/** Notification trigger type */
export type NotificationTrigger =
  | 'appointment_created'
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'waitlist_ready'
  | 'review_request'
  | 'birthday'
  | 'loyalty_reward'
  | 'form_required'
  | 'payment_receipt'
  | 'membership_renewal'
  | 'package_expiring'
  | 'custom';

// ============================================
// NOTIFICATION TEMPLATE
// ============================================

/**
 * A reusable notification template.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface NotificationTemplate extends BaseSyncableEntity {
  /** Template name (e.g., "24hr Reminder") */
  name: string;

  /** Delivery channel */
  channel: NotificationChannel;

  /** Email subject (for email channel) */
  subject?: string;

  /** Message body with variable placeholders */
  body: string;

  /** Available variables for this template */
  variables: string[];

  /** Whether template is active */
  isActive: boolean;

  /** Trigger that uses this template (optional) */
  trigger?: NotificationTrigger;

  /** Whether this is a system template (cannot be deleted) */
  isSystem?: boolean;

  /** Category for organization */
  category?: 'appointments' | 'marketing' | 'transactional' | 'custom';
}

// ============================================
// NOTIFICATION LOG
// ============================================

/**
 * Record of a sent notification.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface NotificationLog extends BaseSyncableEntity {
  /** Recipient client ID */
  clientId: string;

  /** Client name (denormalized) */
  clientName?: string;

  /** Delivery channel */
  channel: NotificationChannel;

  /** Recipient address (phone/email) */
  recipient: string;

  /** Template used (optional) */
  templateId?: string;

  /** Template name (denormalized) */
  templateName?: string;

  /** Trigger that caused this notification */
  trigger?: NotificationTrigger;

  /** Associated appointment */
  appointmentId?: string;

  /** Actual subject sent (for email) */
  subject?: string;

  /** Actual body sent */
  body: string;

  /** Delivery status */
  status: NotificationStatus;

  /** When notification was sent */
  sentAt: string;

  /** When notification was delivered (if tracked) */
  deliveredAt?: string;

  /** Error message (if failed) */
  errorMessage?: string;

  /** External provider message ID */
  providerMessageId?: string;

  /** Cost of sending (for SMS) */
  cost?: number;
}

// ============================================
// CLIENT NOTIFICATION PREFERENCES
// ============================================

/**
 * Client's notification preferences.
 */
export interface ClientNotificationPreferences {
  /** Client ID */
  clientId: string;

  /** Receive appointment reminders */
  appointmentReminders: boolean;

  /** Receive confirmation messages */
  appointmentConfirmations: boolean;

  /** Receive marketing messages */
  marketingMessages: boolean;

  /** Receive review requests */
  reviewRequests: boolean;

  /** Receive birthday messages */
  birthdayMessages: boolean;

  /** Receive loyalty updates */
  loyaltyUpdates: boolean;

  /** Preferred channel for reminders */
  reminderChannel: NotificationChannel;

  /** Preferred channel for marketing */
  marketingChannel: NotificationChannel;

  /** Reminder timing (hours before appointment) */
  reminderHoursBefore: number[];

  /** Quiet hours (don't send during) */
  quietHoursStart?: string;
  quietHoursEnd?: string;

  /** Last updated */
  updatedAt: string;
}

// ============================================
// NOTIFICATION SETTINGS
// ============================================

/**
 * Salon notification settings.
 */
export interface NotificationSettings {
  /** Enable appointment reminders */
  remindersEnabled: boolean;

  /** Reminder times (hours before) */
  reminderTimes: number[];

  /** Enable confirmation on booking */
  confirmationEnabled: boolean;

  /** Enable cancellation notifications */
  cancellationEnabled: boolean;

  /** Enable review requests */
  reviewRequestsEnabled: boolean;

  /** Review request delay (hours after appointment) */
  reviewRequestDelay: number;

  /** Enable birthday messages */
  birthdayEnabled: boolean;

  /** SMS sender ID / phone number */
  smsSenderId?: string;

  /** Email from address */
  emailFromAddress?: string;

  /** Email from name */
  emailFromName?: string;

  /** Reply-to email */
  replyToEmail?: string;

  /** Maximum SMS per day per client */
  maxSmsPerDayPerClient: number;

  /** Quiet hours (local timezone) */
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating a notification template.
 */
export interface CreateNotificationTemplateInput {
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables?: string[];
  trigger?: NotificationTrigger;
  category?: 'appointments' | 'marketing' | 'transactional' | 'custom';
}

/**
 * Input for sending a notification.
 */
export interface SendNotificationInput {
  clientId: string;
  channel: NotificationChannel;
  templateId?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
  appointmentId?: string;
  trigger?: NotificationTrigger;
}

/**
 * Input for sending bulk notifications.
 */
export interface SendBulkNotificationInput {
  clientIds: string[];
  channel: NotificationChannel;
  templateId: string;
  variables?: Record<string, Record<string, string>>; // clientId -> variables
  scheduledAt?: string;
}

// ============================================
// NOTIFICATION TEMPLATES (DEFAULT)
// ============================================

/**
 * Default notification template variables.
 */
export const NOTIFICATION_VARIABLES = {
  client: ['clientName', 'clientFirstName', 'clientPhone', 'clientEmail'],
  appointment: [
    'appointmentDate',
    'appointmentTime',
    'appointmentDateTime',
    'serviceName',
    'staffName',
    'duration',
    'price',
  ],
  salon: ['salonName', 'salonPhone', 'salonAddress', 'salonEmail', 'salonWebsite'],
  booking: ['bookingLink', 'confirmLink', 'cancelLink', 'rescheduleLink'],
  transaction: ['totalAmount', 'paymentMethod', 'receiptLink'],
  loyalty: ['pointsBalance', 'pointsEarned', 'tierName', 'rewardName'],
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets status display info for a notification.
 */
export function getNotificationStatusInfo(status: NotificationStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'sent':
      return { label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'delivered':
      return { label: 'Delivered', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'failed':
      return { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'bounced':
      return { label: 'Bounced', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Gets channel display info.
 */
export function getChannelInfo(channel: NotificationChannel): {
  label: string;
  icon: string;
} {
  switch (channel) {
    case 'sms':
      return { label: 'SMS', icon: '📱' };
    case 'email':
      return { label: 'Email', icon: '📧' };
    case 'push':
      return { label: 'Push', icon: '🔔' };
    default:
      return { label: 'Unknown', icon: '?' };
  }
}

/**
 * Replaces variables in a template body.
 */
export function interpolateTemplate(
  body: string,
  variables: Record<string, string>
): string {
  let result = body;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Extracts variables from a template body.
 */
export function extractTemplateVariables(body: string): string[] {
  const matches = body.match(/{{(\w+)}}/g) || [];
  const uniqueVars = new Set(matches.map((m) => m.replace(/[{}]/g, '')));
  return Array.from(uniqueVars);
}

/**
 * Checks if current time is within quiet hours.
 */
export function isWithinQuietHours(
  quietStart: string,
  quietEnd: string,
  currentTime: Date = new Date()
): boolean {
  const current = currentTime.toTimeString().slice(0, 5);

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (quietStart > quietEnd) {
    return current >= quietStart || current <= quietEnd;
  }

  return current >= quietStart && current <= quietEnd;
}

/**
 * Creates default notification settings.
 */
export function createDefaultNotificationSettings(): NotificationSettings {
  return {
    remindersEnabled: true,
    reminderTimes: [24, 2],
    confirmationEnabled: true,
    cancellationEnabled: true,
    reviewRequestsEnabled: true,
    reviewRequestDelay: 2,
    birthdayEnabled: true,
    maxSmsPerDayPerClient: 3,
    quietHoursEnabled: true,
    quietHoursStart: '21:00',
    quietHoursEnd: '08:00',
  };
}

/**
 * Creates default client notification preferences.
 */
export function createDefaultClientPreferences(clientId: string): ClientNotificationPreferences {
  return {
    clientId,
    appointmentReminders: true,
    appointmentConfirmations: true,
    marketingMessages: true,
    reviewRequests: true,
    birthdayMessages: true,
    loyaltyUpdates: true,
    reminderChannel: 'sms',
    marketingChannel: 'email',
    reminderHoursBefore: [24, 2],
    updatedAt: new Date().toISOString(),
  };
}
