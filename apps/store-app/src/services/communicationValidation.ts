/**
 * Communication Validation Service
 * Implements PRD requirement for do-not-contact flag enforcement
 *
 * This service should be called before sending any SMS, email, or push notifications
 * to ensure client communication preferences are respected.
 */

import { clientsDB } from '../db/database';
import { auditLogger } from './audit/auditLogger';

export interface CommunicationValidationResult {
  canContact: boolean;
  blockedReason?: 'do_not_contact' | 'no_sms_consent' | 'no_email_consent' | 'client_blocked';
  clientId: string;
  channel: 'sms' | 'email' | 'push' | 'all';
}

/**
 * Validate if a client can be contacted via a specific channel
 * MUST be called before sending any communications
 */
export async function validateClientCommunication(
  clientId: string,
  channel: 'sms' | 'email' | 'push' | 'all' = 'all'
): Promise<CommunicationValidationResult> {
  const client = await clientsDB.getById(clientId);

  if (!client) {
    return {
      canContact: false,
      blockedReason: 'client_blocked',
      clientId,
      channel,
    };
  }

  // Check if client is blocked
  if (client.isBlocked) {
    await logBlockedAttempt(clientId, channel, 'client_blocked');
    return {
      canContact: false,
      blockedReason: 'client_blocked',
      clientId,
      channel,
    };
  }

  // Check do-not-contact flag (highest priority)
  if (client.communicationPreferences?.doNotContact) {
    await logBlockedAttempt(clientId, channel, 'do_not_contact');
    return {
      canContact: false,
      blockedReason: 'do_not_contact',
      clientId,
      channel,
    };
  }

  // Check specific channel preferences
  if (channel === 'sms' || channel === 'all') {
    if (!client.communicationPreferences?.smsEnabled) {
      await logBlockedAttempt(clientId, 'sms', 'no_sms_consent');
      return {
        canContact: false,
        blockedReason: 'no_sms_consent',
        clientId,
        channel: 'sms',
      };
    }
  }

  if (channel === 'email' || channel === 'all') {
    if (!client.communicationPreferences?.emailEnabled) {
      await logBlockedAttempt(clientId, 'email', 'no_email_consent');
      return {
        canContact: false,
        blockedReason: 'no_email_consent',
        clientId,
        channel: 'email',
      };
    }
  }

  if (channel === 'push' || channel === 'all') {
    if (!client.communicationPreferences?.pushEnabled) {
      return {
        canContact: false,
        blockedReason: 'no_sms_consent', // Using closest equivalent
        clientId,
        channel: 'push',
      };
    }
  }

  return {
    canContact: true,
    clientId,
    channel,
  };
}

/**
 * Validate multiple clients for communication
 */
export async function validateBulkCommunication(
  clientIds: string[],
  channel: 'sms' | 'email' | 'push' | 'all' = 'all'
): Promise<Map<string, CommunicationValidationResult>> {
  const results = new Map<string, CommunicationValidationResult>();

  await Promise.all(
    clientIds.map(async (clientId) => {
      const result = await validateClientCommunication(clientId, channel);
      results.set(clientId, result);
    })
  );

  return results;
}

/**
 * Get list of clients who CAN be contacted from a list
 */
export async function filterContactableClients(
  clientIds: string[],
  channel: 'sms' | 'email' | 'push' | 'all' = 'all'
): Promise<string[]> {
  const results = await validateBulkCommunication(clientIds, channel);
  return Array.from(results.entries())
    .filter(([, result]) => result.canContact)
    .map(([clientId]) => clientId);
}

/**
 * Log blocked communication attempt for audit trail
 */
async function logBlockedAttempt(
  clientId: string,
  channel: string,
  reason: string
): Promise<void> {
  try {
    await auditLogger.log({
      action: 'communication_blocked',
      entityType: 'client',
      entityId: clientId,
      details: {
        channel,
        reason,
        timestamp: new Date().toISOString(),
      },
      severity: 'info',
    });
  } catch (error) {
    console.warn('Failed to log blocked communication attempt:', error);
  }
}

export default {
  validateClientCommunication,
  validateBulkCommunication,
  filterContactableClients,
};
