/**
 * SMS Service - Abstraction layer for SMS notifications
 *
 * This service handles sending SMS notifications to clients.
 * In production, this integrates with a third-party SMS provider
 * (Twilio, SendGrid, or AWS SNS) via Supabase Edge Functions.
 *
 * The actual SMS delivery is handled by a Supabase Edge Function
 * named 'send-sms' which should be deployed to the Supabase project.
 */

import { supabase } from './supabase';

export interface SmsMessage {
  to: string;
  body: string;
  type: 'queue_called' | 'queue_update' | 'appointment_reminder' | 'custom';
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const isOnline = (): boolean => navigator.onLine;

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function getQueueCalledMessage(params: {
  clientName: string;
  checkInNumber: string;
  technicianName?: string;
  station?: string;
}): string {
  let message = `Hi ${params.clientName}! You're ready - your check-in ${params.checkInNumber} has been called.`;
  
  if (params.technicianName) {
    message += ` Please see ${params.technicianName}`;
    if (params.station) {
      message += ` at ${params.station}`;
    }
    message += '.';
  } else if (params.station) {
    message += ` Please proceed to ${params.station}.`;
  }
  
  return message;
}

function getQueueUpdateMessage(params: {
  clientName: string;
  position: number;
  estimatedWaitMinutes: number;
}): string {
  return `Hi ${params.clientName}! You're #${params.position} in line. Estimated wait: ~${params.estimatedWaitMinutes} minutes.`;
}

export const smsService = {
  async send(message: SmsMessage): Promise<SmsResult> {
    if (!isOnline()) {
      return {
        success: false,
        error: 'Cannot send SMS while offline',
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: toE164(message.to),
          body: message.body,
          type: message.type,
        },
      });

      if (error) {
        console.error('[smsService] Error sending SMS:', error);
        return {
          success: false,
          error: error.message || 'Failed to send SMS',
        };
      }

      return {
        success: true,
        messageId: data?.messageId,
      };
    } catch (error) {
      console.error('[smsService] Exception sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async sendQueueCalledNotification(params: {
    phone: string;
    clientName: string;
    checkInNumber: string;
    technicianName?: string;
    station?: string;
    smsOptIn: boolean;
  }): Promise<SmsResult> {
    if (!params.smsOptIn) {
      return {
        success: false,
        error: 'Client has not opted in to SMS notifications',
      };
    }

    const body = getQueueCalledMessage({
      clientName: params.clientName,
      checkInNumber: params.checkInNumber,
      technicianName: params.technicianName,
      station: params.station,
    });

    return this.send({
      to: params.phone,
      body,
      type: 'queue_called',
    });
  },

  async sendQueueUpdateNotification(params: {
    phone: string;
    clientName: string;
    position: number;
    estimatedWaitMinutes: number;
    smsOptIn: boolean;
  }): Promise<SmsResult> {
    if (!params.smsOptIn) {
      return {
        success: false,
        error: 'Client has not opted in to SMS notifications',
      };
    }

    const body = getQueueUpdateMessage({
      clientName: params.clientName,
      position: params.position,
      estimatedWaitMinutes: params.estimatedWaitMinutes,
    });

    return this.send({
      to: params.phone,
      body,
      type: 'queue_update',
    });
  },

  async updateOptInStatus(clientId: string, smsOptIn: boolean): Promise<boolean> {
    if (!isOnline()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ sms_opt_in: smsOptIn })
        .eq('id', clientId);

      if (error) {
        console.error('[smsService] Error updating opt-in status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[smsService] Exception updating opt-in status:', error);
      return false;
    }
  },

  async handleUnsubscribe(phone: string): Promise<boolean> {
    if (!isOnline()) {
      return false;
    }

    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const { error } = await supabase
        .from('clients')
        .update({ sms_opt_in: false })
        .eq('phone', normalizedPhone);

      if (error) {
        console.error('[smsService] Error handling unsubscribe:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[smsService] Exception handling unsubscribe:', error);
      return false;
    }
  },
};

export default smsService;
