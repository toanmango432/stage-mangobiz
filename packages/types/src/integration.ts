/**
 * Integration Types
 * PRD Reference: PRD-API-Specifications.md Section 4.11
 *
 * Third-party integrations, webhooks, and external service
 * connections (Google Calendar, QuickBooks, Zapier, etc.)
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Integration provider */
export type IntegrationProvider =
  | 'google-calendar'
  | 'google-reserve'
  | 'quickbooks'
  | 'xero'
  | 'shopify'
  | 'zapier'
  | 'mailchimp'
  | 'instagram'
  | 'facebook'
  | 'yelp'
  | 'stripe'
  | 'square'
  | 'twilio'
  | 'sendgrid'
  | 'custom-webhook';

/** Integration status */
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

/** Webhook event type */
export type WebhookEventType =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.reminder'
  | 'appointment.checked_in'
  | 'appointment.completed'
  | 'transaction.completed'
  | 'client.created'
  | 'client.updated'
  | 'form.submitted'
  | 'survey.response'
  | 'form.required'
  | 'staff.clocked_in'
  | 'staff.clocked_out'
  | 'inventory.low_stock'
  | 'membership.created'
  | 'membership.cancelled'
  | 'gift_card.purchased'
  | 'gift_card.redeemed';

// ============================================
// INTEGRATION ENTITY
// ============================================

/**
 * A third-party integration connection.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Integration extends BaseSyncableEntity {
  /** Integration provider */
  provider: IntegrationProvider;

  /** Display name */
  name: string;

  /** Current status */
  status: IntegrationStatus;

  /** Provider-specific configuration */
  config: IntegrationConfig;

  /** OAuth access token (encrypted) */
  accessToken?: string;

  /** OAuth refresh token (encrypted) */
  refreshToken?: string;

  /** Token expiration */
  tokenExpiresAt?: string;

  /** Last successful sync */
  lastSyncAt?: string;

  /** Last sync status */
  lastSyncStatus?: 'success' | 'partial' | 'failed';

  /** Sync errors (if any) */
  syncErrors?: string[];

  /** Number of consecutive failures */
  failureCount: number;

  /** External account ID */
  externalAccountId?: string;

  /** External account email */
  externalAccountEmail?: string;

  /** Sync enabled */
  syncEnabled: boolean;

  /** Sync direction */
  syncDirection?: 'push' | 'pull' | 'bidirectional';

  /** Sync frequency (minutes) */
  syncFrequency?: number;
}

/**
 * Provider-specific configuration.
 */
export interface IntegrationConfig {
  /** Google Calendar: calendar ID */
  calendarId?: string;

  /** QuickBooks: company ID */
  companyId?: string;

  /** QuickBooks: account mappings */
  accountMappings?: Record<string, string>;

  /** Zapier: zap URL */
  zapUrl?: string;

  /** Mailchimp: list/audience ID */
  audienceId?: string;

  /** Mailchimp: tag mappings */
  tagMappings?: Record<string, string>;

  /** Instagram: business account ID */
  businessAccountId?: string;

  /** Custom settings */
  [key: string]: unknown;
}

// ============================================
// WEBHOOK SUBSCRIPTION
// ============================================

/**
 * A webhook subscription for receiving events.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface WebhookSubscription extends BaseSyncableEntity {
  /** Webhook endpoint URL */
  url: string;

  /** Description */
  description?: string;

  /** Events to receive */
  events: WebhookEventType[];

  /** Secret for HMAC signature */
  secret: string;

  /** Whether webhook is active */
  isActive: boolean;

  /** Last delivery attempt */
  lastDeliveredAt?: string;

  /** Last delivery status */
  lastDeliveryStatus?: 'success' | 'failed';

  /** Consecutive failure count */
  failureCount: number;

  /** Headers to include in requests */
  headers?: Record<string, string>;

  /** Created by user */
  createdByName?: string;
}

// ============================================
// WEBHOOK DELIVERY
// ============================================

/**
 * Record of a webhook delivery attempt.
 */
export interface WebhookDelivery extends BaseSyncableEntity {
  /** Webhook subscription ID */
  subscriptionId: string;

  /** Event type */
  eventType: WebhookEventType;

  /** Event ID (for deduplication) */
  eventId: string;

  /** Payload sent */
  payload: Record<string, unknown>;

  /** Delivery attempt number */
  attemptNumber: number;

  /** HTTP response status */
  responseStatus?: number;

  /** Response body (truncated) */
  responseBody?: string;

  /** Response time (ms) */
  responseTimeMs?: number;

  /** Whether delivery succeeded */
  success: boolean;

  /** Error message (if failed) */
  errorMessage?: string;

  /** Next retry scheduled */
  nextRetryAt?: string;
}

// ============================================
// SYNC LOG
// ============================================

/**
 * Record of an integration sync operation.
 */
export interface IntegrationSyncLog extends BaseSyncableEntity {
  /** Integration ID */
  integrationId: string;

  /** Provider */
  provider: IntegrationProvider;

  /** Sync direction */
  direction: 'push' | 'pull';

  /** Sync status */
  status: 'started' | 'completed' | 'failed';

  /** Records processed */
  recordsProcessed: number;

  /** Records created */
  recordsCreated: number;

  /** Records updated */
  recordsUpdated: number;

  /** Records failed */
  recordsFailed: number;

  /** Duration (ms) */
  durationMs?: number;

  /** Error messages */
  errors?: string[];

  /** Sync trigger */
  triggeredBy: 'schedule' | 'manual' | 'webhook';

  /** Triggered by user */
  triggeredByUser?: string;
}

// ============================================
// API KEY
// ============================================

/**
 * An API key for external access.
 */
export interface ApiKey extends BaseSyncableEntity {
  /** Key name/description */
  name: string;

  /** Key prefix (visible part) */
  prefix: string;

  /** Hashed key value */
  keyHash: string;

  /** Scopes/permissions */
  scopes: string[];

  /** Whether key is active */
  isActive: boolean;

  /** Expiration date */
  expiresAt?: string;

  /** Last used */
  lastUsedAt?: string;

  /** Usage count */
  usageCount: number;

  /** Rate limit (requests per minute) */
  rateLimit?: number;

  /** IP whitelist */
  allowedIps?: string[];

  /** Created by user */
  createdByName?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for connecting an integration.
 */
export interface ConnectIntegrationInput {
  provider: IntegrationProvider;
  name?: string;
  config?: Partial<IntegrationConfig>;
  redirectUrl?: string; // For OAuth
}

/**
 * Input for creating a webhook subscription.
 */
export interface CreateWebhookSubscriptionInput {
  url: string;
  description?: string;
  events: WebhookEventType[];
  headers?: Record<string, string>;
}

/**
 * Input for creating an API key.
 */
export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expiresAt?: string;
  rateLimit?: number;
  allowedIps?: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets integration status display info.
 */
export function getIntegrationStatusInfo(status: IntegrationStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'connected':
      return { label: 'Connected', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'disconnected':
      return { label: 'Disconnected', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'error':
      return { label: 'Error', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'pending':
      return { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Gets provider display info.
 */
export function getProviderInfo(provider: IntegrationProvider): {
  name: string;
  icon: string;
  category: 'calendar' | 'accounting' | 'automation' | 'social' | 'payment' | 'communication';
} {
  const providers: Record<
    IntegrationProvider,
    { name: string; icon: string; category: 'calendar' | 'accounting' | 'automation' | 'social' | 'payment' | 'communication' }
  > = {
    'google-calendar': { name: 'Google Calendar', icon: '📅', category: 'calendar' },
    'google-reserve': { name: 'Reserve with Google', icon: '🔍', category: 'calendar' },
    quickbooks: { name: 'QuickBooks', icon: '📊', category: 'accounting' },
    xero: { name: 'Xero', icon: '📈', category: 'accounting' },
    shopify: { name: 'Shopify', icon: '🛒', category: 'automation' },
    zapier: { name: 'Zapier', icon: '⚡', category: 'automation' },
    mailchimp: { name: 'Mailchimp', icon: '📧', category: 'automation' },
    instagram: { name: 'Instagram', icon: '📷', category: 'social' },
    facebook: { name: 'Facebook', icon: '👤', category: 'social' },
    yelp: { name: 'Yelp', icon: '⭐', category: 'social' },
    stripe: { name: 'Stripe', icon: '💳', category: 'payment' },
    square: { name: 'Square', icon: '⬜', category: 'payment' },
    twilio: { name: 'Twilio', icon: '📱', category: 'communication' },
    sendgrid: { name: 'SendGrid', icon: '✉️', category: 'communication' },
    'custom-webhook': { name: 'Custom Webhook', icon: '🔗', category: 'automation' },
  };

  return providers[provider] || { name: provider, icon: '🔌', category: 'automation' };
}

/**
 * Generates webhook secret.
 */
export function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

/**
 * Generates API key.
 */
export function generateApiKey(): { key: string; prefix: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'mango_';

  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }

  return {
    key,
    prefix: key.substring(0, 12) + '...',
  };
}

/**
 * Calculates retry delay with exponential backoff.
 */
export function calculateRetryDelay(attemptNumber: number, baseDelayMs: number = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 5 min
  const delay = baseDelayMs * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, 5 * 60 * 1000);
}

/**
 * Gets next retry time.
 */
export function getNextRetryTime(attemptNumber: number): Date {
  const delay = calculateRetryDelay(attemptNumber);
  return new Date(Date.now() + delay);
}

/**
 * Checks if integration needs reconnection.
 */
export function needsReconnection(integration: Integration): boolean {
  if (integration.status === 'error') return true;
  if (integration.failureCount >= 5) return true;

  if (integration.tokenExpiresAt) {
    const expiresAt = new Date(integration.tokenExpiresAt);
    const buffer = 5 * 60 * 1000; // 5 minutes buffer
    if (expiresAt.getTime() - Date.now() < buffer) return true;
  }

  return false;
}

/**
 * Creates HMAC signature for webhook payload.
 */
export async function createWebhookSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets available webhook events for a provider.
 */
export function getAvailableWebhookEvents(): WebhookEventType[] {
  return [
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
    'appointment.reminder',
    'appointment.checked_in',
    'appointment.completed',
    'transaction.completed',
    'client.created',
    'client.updated',
    'form.submitted',
    'survey.response',
    'form.required',
    'staff.clocked_in',
    'staff.clocked_out',
    'inventory.low_stock',
    'membership.created',
    'membership.cancelled',
    'gift_card.purchased',
    'gift_card.redeemed',
  ];
}
