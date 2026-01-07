import { Booking } from '@/types/booking';
import { format } from 'date-fns';

const EMAILS_KEY = 'mango-booking-emails';

export interface EmailLog {
  id: string;
  type: 'confirmation' | 'reminder' | 'reschedule' | 'cancellation';
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  bookingId: string;
}

/**
 * Save email log to localStorage (mock email sending)
 */
const logEmail = (email: EmailLog): void => {
  try {
    const logs = JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]');
    logs.push(email);
    localStorage.setItem(EMAILS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error logging email:', error);
  }
};

/**
 * Get all email logs
 */
export const getEmailLogs = (): EmailLog[] => {
  try {
    return JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Send booking confirmation email (mock)
 */
export const sendBookingConfirmation = (booking: Booking): void => {
  const email: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'confirmation',
    to: booking.client.email,
    subject: `Booking Confirmed - ${booking.bookingNumber}`,
    body: `
Hi ${booking.client.name},

Your booking has been confirmed!

Booking Details:
- Booking Number: ${booking.bookingNumber}
- Service: ${booking.service.name}
- Date: ${format(new Date(booking.dateTime), 'MMMM d, yyyy')}
- Time: ${format(new Date(booking.dateTime), 'h:mm a')}
${booking.staff ? `- Specialist: ${booking.staff.name}` : ''}
${booking.addOns.length > 0 ? `\nAdd-ons:\n${booking.addOns.map(a => `- ${a.name}`).join('\n')}` : ''}

Total Amount: $${booking.totalAmount.toFixed(2)}
${booking.depositAmount ? `Deposit Required: $${booking.depositAmount.toFixed(2)}` : ''}

What to bring:
- Please arrive 10 minutes early
- Bring a photo ID
- Wear comfortable clothing

Cancellation Policy:
- Free cancellation up to 24 hours before appointment
- Late cancellations or no-shows may incur a fee

We look forward to seeing you!

Best regards,
The Mango Salon Team
    `.trim(),
    sentAt: new Date().toISOString(),
    bookingId: booking.id,
  };

  logEmail(email);
  console.log('📧 Booking confirmation sent:', email);
};

/**
 * Send booking reminder email (mock - would be triggered 24h before)
 */
export const sendBookingReminder = (booking: Booking): void => {
  const email: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'reminder',
    to: booking.client.email,
    subject: `Reminder: Upcoming Appointment Tomorrow`,
    body: `
Hi ${booking.client.name},

This is a friendly reminder about your upcoming appointment tomorrow!

Appointment Details:
- Service: ${booking.service.name}
- Date: ${format(new Date(booking.dateTime), 'MMMM d, yyyy')}
- Time: ${format(new Date(booking.dateTime), 'h:mm a')}
${booking.staff ? `- Specialist: ${booking.staff.name}` : ''}

Location: Mango Salon

Need to reschedule? Please contact us at least 24 hours in advance.

See you soon!
    `.trim(),
    sentAt: new Date().toISOString(),
    bookingId: booking.id,
  };

  logEmail(email);
  console.log('📧 Booking reminder sent:', email);
};

/**
 * Send reschedule confirmation email (mock)
 */
export const sendRescheduleConfirmation = (booking: Booking): void => {
  const email: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'reschedule',
    to: booking.client.email,
    subject: `Booking Rescheduled - ${booking.bookingNumber}`,
    body: `
Hi ${booking.client.name},

Your booking has been successfully rescheduled.

Updated Booking Details:
- Booking Number: ${booking.bookingNumber}
- Service: ${booking.service.name}
- New Date: ${format(new Date(booking.dateTime), 'MMMM d, yyyy')}
- New Time: ${format(new Date(booking.dateTime), 'h:mm a')}
${booking.staff ? `- Specialist: ${booking.staff.name}` : ''}

If you need to make any further changes, please let us know.

Best regards,
The Mango Salon Team
    `.trim(),
    sentAt: new Date().toISOString(),
    bookingId: booking.id,
  };

  logEmail(email);
  console.log('📧 Reschedule confirmation sent:', email);
};

/**
 * Send cancellation confirmation email (mock)
 */
export const sendCancellationConfirmation = (booking: Booking): void => {
  const email: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'cancellation',
    to: booking.client.email,
    subject: `Booking Cancelled - ${booking.bookingNumber}`,
    body: `
Hi ${booking.client.name},

Your booking has been cancelled.

Cancelled Booking:
- Booking Number: ${booking.bookingNumber}
- Service: ${booking.service.name}
- Date: ${format(new Date(booking.dateTime), 'MMMM d, yyyy')}
- Time: ${format(new Date(booking.dateTime), 'h:mm a')}

${booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit-paid' 
  ? 'Your refund will be processed within 5-7 business days.' 
  : ''}

We hope to see you again soon!

Best regards,
The Mango Salon Team
    `.trim(),
    sentAt: new Date().toISOString(),
    bookingId: booking.id,
  };

  logEmail(email);
  console.log('📧 Cancellation confirmation sent:', email);
};
