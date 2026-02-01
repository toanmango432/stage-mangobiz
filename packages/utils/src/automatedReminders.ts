/**
 * Automated Reminder System
 * Handles scheduled reminders for appointments and client engagement
 */

import { LocalAppointment } from '@mango/types';

export interface ReminderConfig {
  enabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  timings: {
    confirmation24h: boolean;
    reminder2h: boolean;
    noShowFollowup: boolean;
    reviewRequest: boolean;
    rebookReminder: boolean;
  };
}

export interface ScheduledReminder {
  id: string;
  type: 'confirmation' | 'reminder' | 'no-show-followup' | 'review-request' | 'rebook-reminder';
  appointmentId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  scheduledFor: Date;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  channel: 'sms' | 'email' | 'both';
  metadata?: any;
}

export const DEFAULT_CONFIG: ReminderConfig = {
  enabled: true,
  smsEnabled: true,
  emailEnabled: true,
  timings: {
    confirmation24h: true,
    reminder2h: true,
    noShowFollowup: true,
    reviewRequest: true,
    rebookReminder: true,
  },
};

/**
 * Generate reminders for an appointment
 */
export function generateAppointmentReminders(
  appointment: LocalAppointment,
  config: ReminderConfig = DEFAULT_CONFIG
): ScheduledReminder[] {
  const reminders: ScheduledReminder[] = [];
  const appointmentTime = new Date(appointment.scheduledStartTime);

  // 24-hour confirmation reminder
  if (config.timings.confirmation24h) {
    const confirmTime = new Date(appointmentTime);
    confirmTime.setHours(confirmTime.getHours() - 24);

    if (confirmTime > new Date()) {
      reminders.push({
        id: `${appointment.id}-24h`,
        type: 'confirmation',
        appointmentId: appointment.id,
        clientId: appointment.clientId || '',
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        scheduledFor: confirmTime,
        message: generate24HourMessage(appointment),
        status: 'pending',
        channel: config.smsEnabled && config.emailEnabled ? 'both' :
                 config.smsEnabled ? 'sms' : 'email',
      });
    }
  }

  // 2-hour reminder
  if (config.timings.reminder2h) {
    const reminderTime = new Date(appointmentTime);
    reminderTime.setHours(reminderTime.getHours() - 2);

    if (reminderTime > new Date()) {
      reminders.push({
        id: `${appointment.id}-2h`,
        type: 'reminder',
        appointmentId: appointment.id,
        clientId: appointment.clientId || '',
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        scheduledFor: reminderTime,
        message: generate2HourMessage(appointment),
        status: 'pending',
        channel: config.smsEnabled ? 'sms' : 'email',
      });
    }
  }

  return reminders;
}

/**
 * Generate no-show follow-up
 */
export function generateNoShowFollowUp(
  appointment: LocalAppointment,
  config: ReminderConfig = DEFAULT_CONFIG
): ScheduledReminder | null {
  if (!config.timings.noShowFollowup) return null;

  const followUpTime = new Date(appointment.scheduledStartTime);
  followUpTime.setMinutes(followUpTime.getMinutes() + 15);

  return {
    id: `${appointment.id}-noshow`,
    type: 'no-show-followup',
    appointmentId: appointment.id,
    clientId: appointment.clientId || '',
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    clientEmail: appointment.clientEmail,
    scheduledFor: followUpTime,
    message: generateNoShowMessage(appointment),
    status: 'pending',
    channel: config.smsEnabled ? 'sms' : 'email',
  };
}

/**
 * Generate review request
 */
export function generateReviewRequest(
  appointment: LocalAppointment,
  config: ReminderConfig = DEFAULT_CONFIG
): ScheduledReminder | null {
  if (!config.timings.reviewRequest) return null;

  const reviewTime = new Date(appointment.scheduledEndTime);
  reviewTime.setDate(reviewTime.getDate() + 7); // 1 week after

  return {
    id: `${appointment.id}-review`,
    type: 'review-request',
    appointmentId: appointment.id,
    clientId: appointment.clientId || '',
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    clientEmail: appointment.clientEmail,
    scheduledFor: reviewTime,
    message: generateReviewMessage(appointment),
    status: 'pending',
    channel: config.emailEnabled ? 'email' : 'sms',
  };
}

/**
 * Message templates
 */
function generate24HourMessage(appointment: LocalAppointment): string {
  const time = formatAppointmentTime(new Date(appointment.scheduledStartTime));
  const services = appointment.services.map(s => s.serviceName).join(', ');

  return `Hi ${appointment.clientName}! Looking forward to seeing you tomorrow at ${time} for ${services} with ${appointment.staffName}. Reply 1 to confirm, 2 to reschedule. - Mango Salon`;
}

function generate2HourMessage(appointment: LocalAppointment): string {
  const time = formatAppointmentTime(new Date(appointment.scheduledStartTime));

  return `Hi ${appointment.clientName}! This is a reminder that your appointment is in 2 hours at ${time}. See you soon! - Mango Salon`;
}

function generateNoShowMessage(appointment: LocalAppointment): string {
  return `Hi ${appointment.clientName}, we noticed you missed your appointment today. Is everything okay? We'd love to reschedule. Reply or call us! - Mango Salon`;
}

function generateReviewMessage(appointment: LocalAppointment): string {
  return `Hi ${appointment.clientName}! Thanks for visiting us last week. We'd love to hear about your experience! Leave us a review: [REVIEW_LINK] - Mango Salon`;
}

function formatAppointmentTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Send reminder (integration point for SMS/Email services)
 */
export async function sendReminder(
  reminder: ScheduledReminder,
  smsService?: (phone: string, message: string) => Promise<void>,
  emailService?: (email: string, subject: string, message: string) => Promise<void>
): Promise<boolean> {
  try {
    if (reminder.channel === 'sms' || reminder.channel === 'both') {
      if (smsService && reminder.clientPhone) {
        await smsService(reminder.clientPhone, reminder.message);
      }
    }

    if (reminder.channel === 'email' || reminder.channel === 'both') {
      if (emailService && reminder.clientEmail) {
        const subject = getEmailSubject(reminder.type);
        await emailService(reminder.clientEmail, subject, reminder.message);
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to send reminder:', error);
    return false;
  }
}

function getEmailSubject(type: ScheduledReminder['type']): string {
  switch (type) {
    case 'confirmation':
      return 'Appointment Confirmation - Tomorrow';
    case 'reminder':
      return 'Appointment Reminder - In 2 Hours';
    case 'no-show-followup':
      return 'We Missed You Today';
    case 'review-request':
      return 'How Was Your Visit?';
    case 'rebook-reminder':
      return "Time for Your Next Appointment?";
    default:
      return 'Message from Mango Salon';
  }
}

/**
 * Process reminder queue
 */
export function processReminderQueue(
  reminders: ScheduledReminder[],
  smsService?: (phone: string, message: string) => Promise<void>,
  emailService?: (email: string, subject: string, message: string) => Promise<void>
): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const dueReminders = reminders.filter(r =>
    r.status === 'pending' && r.scheduledFor <= now
  );

  return Promise.all(
    dueReminders.map(async (reminder) => {
      const success = await sendReminder(reminder, smsService, emailService);
      return success;
    })
  ).then(results => ({
    sent: results.filter(Boolean).length,
    failed: results.filter(r => !r).length,
  }));
}
